const db = require("../db/dbConnection");
const axios = require("axios");
require("dotenv").config();

exports.registerUser = async (req, res) => {
  try {
    const { lineUserId, name, ID_card_No, Phone_No, Email, Home_ID, Address, access_token } = req.body;

    // ✅ ตรวจสอบว่ากรอกข้อมูลครบถ้วน
    if (  !ID_card_No || !Phone_No || !Email || !Home_ID || !Address ) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    // ✅ ตรวจสอบความยาวของเบอร์โทรศัพท์
    if (Phone_No.length !== 10) {
      return res.status(400).json({ message: "เบอร์โทรศัพท์ต้องมีความยาว 10 หลัก" });
    }

    // ✅ ตรวจสอบว่าผู้ใช้มีอยู่แล้ว (ID_card_No, Email, หรือ lineUserId)
    const checkQuery = "SELECT * FROM users WHERE ID_card_No = ? OR Email = ? OR lineUserId = ? OR access_token = ?";
    const [existingUser] = await db.promise().query(checkQuery, [ID_card_No, Email, lineUserId,access_token]);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "ผู้ใช้ลงทะเบียนแล้ว" });
    }

    // ✅ เพิ่มข้อมูลลงในฐานข้อมูล
    const insertQuery = `
  INSERT INTO users (lineUserId, name, ID_card_No, Phone_No, Email, Home_ID, Address, access_token)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;

await db.promise().query(insertQuery, [
  lineUserId, name, ID_card_No, Phone_No, Email, Home_ID, Address, access_token
]);
    // ✅ ส่งข้อความแจ้งเตือนผ่าน LINE
    try {
      await axios.post(
        "https://api.line.me/v2/bot/message/push",
        {
          to: lineUserId,
          messages: [
            {
              type: "text",
              text: `✅ ลงทะเบียนสำเร็จ!\n📌 ชื่อ: ${name}\n📌 Email: ${Email}\n📌 เบอร์โทร: ${Phone_No}\n🏠 ที่อยู่: ${Address}`,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`, // ใช้ token ของแต่ละ user
          },
        }
      );
    } catch (lineError) {
      console.error("❌ ไม่สามารถส่งข้อความไปยัง LINE:", lineError);
    }

    res.status(201).json({ message: "ลงทะเบียนสำเร็จ!" });
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};
