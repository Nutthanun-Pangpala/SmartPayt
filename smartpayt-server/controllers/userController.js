const axios = require("axios");
const db = require("../db/dbConnection");

// Controller: ฟังก์ชันเพื่อดึงข้อมูลผู้ใช้จากฐานข้อมูล
exports.userInfo = async (req, res) => {
  try {
    const { lineUserId } = req.params; // ดึง lineUserId จาก URL parameters

    if (!lineUserId) {
      return res.status(400).json({ message: "lineUserId ไม่พบในคำขอ" });
    }

    // Query เพื่อตรวจสอบข้อมูลผู้ใช้จากฐานข้อมูล
    const query = "SELECT * FROM users WHERE lineUserId = ?";
    const [userData] = await db.promise().query(query, [lineUserId]);

    if (userData.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
    }

    // ส่งข้อมูลผู้ใช้กลับไปที่ Frontend
    res.status(200).json({
      message: "ดึงข้อมูลผู้ใช้สำเร็จ",
      user: userData[0], // ส่งข้อมูลแค่แถวเดียว
    });

  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
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

exports.checkUser=  async (req, res) => {
  const { lineUserId } = req.params;
  try {
    const [rows] = await db.promise().query("SELECT COUNT(*) AS count FROM users WHERE lineUserId = ?", [lineUserId]);
    res.json({ exists: rows[0].count > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล" });
  }
};