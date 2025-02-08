const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.adminLogin = (req, res) => {
  const { admin_username, admin_password } = req.body;

  if (!admin_username || !admin_password) {
    return res.status(400).json({ message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
  }

  const sql = "SELECT * FROM admins WHERE admin_username = ?";
  db.query(sql, [admin_username], async (err, result) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ message: "เกิดข้อผิดพลาดในการล็อกอิน" });
    }

    if (result.length === 0) {
      return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const admin = result[0];

    // ตรวจสอบรหัสผ่าน
    const isMatch = await bcrypt.compare(admin_password, admin.admin_password);
    if (!isMatch) {
      return res.status(401).json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    // สร้าง JWT Token
    const token = jwt.sign({ id: admin.id, username: admin.admin_username }, "SECRET_KEY", {
      expiresIn: "1h",
    });

    res.status(200).json({ token, message: "ล็อกอินสำเร็จ" });
  });
};
