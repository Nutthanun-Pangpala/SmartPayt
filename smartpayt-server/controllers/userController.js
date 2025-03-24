const axios = require("axios");
const db = require("../db/dbConnection");

exports.userByID = async (req, res) => {
  const { idToken, lineUserId } = req.body;

  // ตรวจสอบการเชื่อมต่อกับฐานข้อมูล
  connection.query(
      'SELECT * FROM users WHERE lineUserId = ?',
      [lineUserId],
      (err, results) => {
          if (err) {
              return res.status(500).send('Database error');
          }

          if (results.length > 0) {
              // ส่งข้อมูลผู้ใช้จากฐานข้อมูล
              return res.json({ user: results[0] });
          } else {
              return res.status(404).send('User not found');
          }
      }
  );
};


exports.removeUserByID = async (req, res) => {
  try {
    const lineUserId = req.params.id; // รับค่า lineUserId จาก URL

    if (!lineUserId) {
      return res.status(400).json({ message: "กรุณาระบุ id" });
    }

    const [user] = await db.promise().query("SELECT * FROM users WHERE lineUserId = ?", [lineUserId]);
    if (user.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้ในระบบ" });
    }

    // ลบข้อมูลที่เกี่ยวข้องกับผู้ใช้
    await db.promise().query("DELETE FROM orders WHERE lineUserId = ?", [lineUserId]);
    await db.promise().query("DELETE FROM user_addresses WHERE lineUserId = ?", [lineUserId]);

    // ลบผู้ใช้จากระบบ
    await db.promise().query("DELETE FROM users WHERE lineUserId = ?", [lineUserId]);

    res.status(200).json({ message: "ลบผู้ใช้สำเร็จ" });
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ", details: error.message });
  }
};