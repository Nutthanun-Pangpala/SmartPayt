const express = require('express');
const db = require('../db/dbConnection'); // อิมพอร์ตการเชื่อมต่อฐานข้อมูล

const router = express.Router();

// POST route สำหรับการลงทะเบียนผู้ใช้
router.post("/register", (req, res) => {
  const { lineUserId, name, ID_card_No, Phone_No, Email, Home_ID, Address } = req.body;

  // ตรวจสอบว่ามีข้อมูลที่จำเป็นหรือไม่
  if (!lineUserId || !name || !ID_card_No || !Phone_No || !Email || !Home_ID || !Address) {
    return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }

  // ตรวจสอบว่าผู้ใช้เคยลงทะเบียนหรือยัง
  const checkUserQuery = "SELECT * FROM users WHERE lineUserId = ?";
  db.query(checkUserQuery, [lineUserId], (err, results) => {
    if (err) {
      console.error("Error checking user:", err);
      return res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: "ผู้ใช้นี้ลงทะเบียนแล้ว" });
    }

    // สร้างผู้ใช้ใหม่
    const insertUserQuery =
      "INSERT INTO users (lineUserId, name, ID_card_No, Phone_No, Email, Home_ID, Address) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(
      insertUserQuery,
      [lineUserId, name, ID_card_No, Phone_No, Email, Home_ID, Address],
      (err, result) => {
        if (err) {
          console.error("Error inserting user:", err);
          return res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
        }
        res.status(201).json({ message: "ลงทะเบียนสำเร็จ" });
      }
    );
  });
});

module.exports = router;
