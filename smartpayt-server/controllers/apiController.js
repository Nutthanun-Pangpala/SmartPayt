const db = require("../db/dbConnection");
const axios = require("axios");
require("dotenv").config();

const access_token = process.env.LINE_ACCESS_TOKEN;


exports.registerAccount = async (req, res) => {
  try {
    console.log("🔹 รับข้อมูลจาก Frontend:", req.body);

    const { lineUserId, name, ID_card_No, Phone_No, Email } = req.body;

    if (!ID_card_No || !Phone_No || !Email) {
      console.log("❌ ข้อมูลไม่ครบ:", { ID_card_No, Phone_No, Email });
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    if (Phone_No.length !== 10) {
      console.log("❌ เบอร์โทรศัพท์ไม่ถูกต้อง:", Phone_No);
      return res.status(400).json({ message: "เบอร์โทรศัพท์ต้องมีความยาว 10 หลัก" });
    }

    console.log("🔎 ตรวจสอบข้อมูลในฐานข้อมูล...");
    const checkQuery = "SELECT * FROM users WHERE lineUserId = ? OR ID_card_No = ?";
    const [existingUser] = await db.promise().query(checkQuery, [lineUserId, ID_card_No]);

    if (existingUser.length > 0) {
      console.log("❌ พบข้อมูลซ้ำในระบบ:", existingUser);
      return res.status(400).json({ message: "บัญชีนี้ถูกลงทะเบียนแล้ว" });
    }

    console.log("📝 กำลังเพิ่มข้อมูลลงฐานข้อมูล...");
    const insertQuery = `
      INSERT INTO users (lineUserId, name, ID_card_No, Phone_No, Email)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.promise().query(insertQuery, [
      lineUserId, name, ID_card_No, Phone_No, Email
    ]);

    if (result.affectedRows === 0) {
      console.log("❌ INSERT ไม่สำเร็จ");
      return res.status(500).json({ message: "ไม่สามารถเพิ่มข้อมูลผู้ใช้ได้" });
    }

    console.log("✅ ลงทะเบียนสำเร็จ!");

    res.status(201).json({
      message: "ลงทะเบียนสำเร็จ!",
      userData: { lineUserId, name, ID_card_No, Phone_No, Email },
    });

  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ", error: error.message });
  }
};
exports.registerAddress = async (req, res) => {
  try {
    const { lineUserId, house_no, address_detail } = req.body;

    // ตรวจสอบว่าข้อมูลครบถ้วนหรือไม่
    if (!lineUserId || !house_no || !address_detail) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    // ✅ ตรวจสอบว่า lineUserId มีอยู่ในตาราง users หรือไม่
    const userCheckQuery = "SELECT * FROM users WHERE lineUserId = ?";
    const [user] = await db.promise().query(userCheckQuery, [lineUserId]);

    if (user.length === 0) {
      return res.status(400).json({ message: "ไม่พบผู้ใช้ในระบบ กรุณาลงทะเบียนก่อน" });
    }

    // ✅ ตรวจสอบว่า address ซ้ำหรือไม่
    const checkQuery = "SELECT * FROM addresses WHERE lineUserId = ? AND house_no = ?";
    const [existingAddress] = await db.promise().query(checkQuery, [lineUserId, house_no]);

    if (existingAddress.length > 0) {
      return res.status(400).json({ message: "ที่อยู่นี้ถูกลงทะเบียนแล้ว" });
    }

    // ✅ เพิ่มข้อมูลที่อยู่ใหม่
    const insertQuery = `
      INSERT INTO addresses (lineUserId, house_no, address_detail)
      VALUES (?, ?, ?)
    `;
    const [result] = await db.promise().query(insertQuery, [lineUserId, house_no, address_detail]);

    if (result.affectedRows === 0) {
      return res.status(500).json({ message: "ไม่สามารถเพิ่มข้อมูลที่อยู่ได้" });
    }

    // ✅ ส่งข้อความแจ้งเตือนผ่าน LINE
    try {
      const access_token = process.env.LINE_ACCESS_TOKEN;
      await axios.post(
        "https://api.line.me/v2/bot/message/push",
        {
          to: lineUserId,
          messages: [
            {
              type: "text",
              text: `✅ ลงทะเบียนสำเร็จ!\n🏠 บ้านเลขที่: ${house_no}\n📌 รายละเอียด: ${address_detail}`,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
        }
      );
    } catch (lineError) {
      console.error("❌ ไม่สามารถส่งข้อความไปยัง LINE:", lineError);
    }

    // ✅ ส่งข้อมูลกลับไปยัง Frontend
    res.status(201).json({
      message: "ลงทะเบียนที่อยู่สำเร็จ!",
      addressData: { lineUserId, house_no, address_detail },
    });

  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};



exports.userAddressList = async (req, res) => {
  try {
    // คำสั่ง SQL เพื่อดึงข้อมูลผู้ใช้ทั้งหมดจากตาราง users
    const query = "SELECT * FROM users";
    const [users] = await db.promise().query(query);

    // ตรวจสอบว่ามีข้อมูลหรือไม่
    if (users.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
    }

    // ส่งข้อมูลผู้ใช้ทั้งหมดกลับไปยัง frontend
    res.status(200).json({ users });

  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};

exports.reportiIssue = (req, res) => {
  const { Issues, lineUserId, name } = req.body;

  // Check for missing fields
  if (!Issues || !lineUserId || !name) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const sql = 'INSERT INTO issues (Issues, lineUserId, name) VALUES (?, ?, ?)';
  db.query(sql, [Issues, lineUserId, name], async (err, result) => {
    if (err) {
      console.error('❌ Insert Error:', err);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }

    try {
      await axios.post(
        "https://api.line.me/v2/bot/message/push",
        {
          to: lineUserId,
          messages: [
            {
              type: "text",
              text: `✅ ส่งคำร้อง!\n📌 ชื่อ: ${name}\n📌 รายละเอียดปัญหา: ${Issues}`,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`, // Use your LINE bot access token
          },
        }
      );

      // Respond after sending the message
      res.json({ message: 'ส่งคำร้องสำเร็จ!' });
    } catch (lineError) {
      console.error("❌ ไม่สามารถส่งข้อความไปยัง LINE:", lineError);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งข้อความไปยัง LINE' });
    }
  });
};

exports.userBills = (req, res) => {
  connection.query('SELECT * FROM bills', (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.json(results);
  });
};
exports.userAddress = async (req, res) => {
  try {
    const { lineUserId } = req.params; // ดึง lineUserId จาก URL parameters

    if (!lineUserId) {
      return res.status(400).json({ message: "lineUserId ไม่พบในคำขอ" });
    }

    // Query ดึงที่อยู่ทั้งหมดของผู้ใช้
    const query = "SELECT * FROM addresses WHERE lineUserId = ?";
    const [addresses] = await db.promise().query(query, [lineUserId]);

    if (addresses.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลที่อยู่" });
    }

    // ✅ เปลี่ยนจาก `address: addressData[0]` → `addresses: addresses`
    res.status(200).json({
      message: "ดึงข้อมูลที่อยู่สำเร็จ",
      addresses: addresses, // ✅ คืนค่าทั้งหมดเป็น array
    });

  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};