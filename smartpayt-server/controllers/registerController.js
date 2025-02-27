const db = require("../db/dbConnection");
const axios = require("axios");
require("dotenv").config();

const access_token = process.env.LINE_ACCESS_TOKEN;

exports.registerUser = async (req, res) => {
  try {
    // รับข้อมูลจาก body
    const { lineUserId, name, ID_card_No, Phone_No, Email, Home_ID, Address } = req.body;

    // ตรวจสอบว่ากรอกข้อมูลครบถ้วน
    if (!ID_card_No || !Phone_No || !Email || !Home_ID || !Address) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    // ตรวจสอบความยาวของเบอร์โทรศัพท์
    if (Phone_No.length !== 10) {
      return res.status(400).json({ message: "เบอร์โทรศัพท์ต้องมีความยาว 10 หลัก" });
    }

    // ตรวจสอบว่า ID_card_No หรือ Email หรือ lineUserId มีในระบบแล้วหรือไม่
    const checkQuery = "SELECT * FROM users WHERE Home_ID = ? AND Address = ?";
    const [existingUser] = await db.promise().query(checkQuery, [Home_ID, Address]);

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "ที่อยู่นี้ถูกลงทะเบียนแล้ว" });
    }

    // เพิ่มข้อมูลผู้ใช้ใหม่ลงในฐานข้อมูล
    const insertQuery = `
      INSERT INTO users (lineUserId, name, ID_card_No, Phone_No, Email, Home_ID, Address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.promise().query(insertQuery, [
      lineUserId, name, ID_card_No, Phone_No, Email, Home_ID, Address
    ]);

    // ตรวจสอบการเพิ่มข้อมูล
    if (result.affectedRows === 0) {
      return res.status(500).json({ message: "ไม่สามารถเพิ่มข้อมูลผู้ใช้ได้" });
    }

    // ส่งข้อความแจ้งเตือนผ่าน LINE
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

    // ส่งข้อมูลผู้ใช้กลับไปให้ frontend
    res.status(201).json({
      message: "ลงทะเบียนสำเร็จ!",
      userData: {
        lineUserId,
        name,
        ID_card_No,
        Phone_No,
        Email,
        Home_ID,
        Address,
      }
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