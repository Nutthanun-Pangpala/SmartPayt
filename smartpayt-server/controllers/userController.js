const db = require("../db/dbConnection");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const path = require("path");


const getUser = (req, res) => {
  const user = {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
  };
  res.json(user);
};
const uploadSlip = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "ไม่มีไฟล์แนบมา" });
    }

    const billIds = JSON.parse(req.body.bill_ids);
    const filePath = req.file.path;

    const dbConn = db.promise();

    // บันทึกภาพสลิปใน payment_slips
    for (let billId of billIds) {
      await dbConn.query(
        "INSERT INTO payment_slips (bill_id, image_path) VALUES (?, ?)",
        [billId, filePath]
      );
    }

    // อัปเดตสถานะบิลเป็น 2 (รอตรวจสอบ)
    const placeholders = billIds.map(() => "?").join(",");
    await dbConn.query(
      `UPDATE bills SET status = 2 WHERE id IN (${placeholders})`,
      billIds
    );

    return res.json({ success: true, message: "อัปโหลดและอัปเดตสถานะสำเร็จ" });
  } catch (err) {
    console.error("❌ [upload-slip ERROR]:", err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดใน server" });
    }
  }
};





const userInfo = async (req, res) => {
  try {
    const { lineUserId } = req.params;
    if (!lineUserId) return res.status(400).json({ message: "lineUserId ไม่พบในคำขอ" });

    const query = "SELECT * FROM users WHERE lineUserId = ?";
    const [userData] = await db.promise().query(query, [lineUserId]);

    if (userData.length === 0) return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });

    res.status(200).json({
      message: "ดึงข้อมูลผู้ใช้สำเร็จ",
      user: userData[0],
    });
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};

const removeUserByID = async (req, res) => {
  try {
    const lineUserId = req.params.id;
    if (!lineUserId) return res.status(400).json({ message: "กรุณาระบุ id" });

    const [user] = await db.promise().query("SELECT * FROM users WHERE lineUserId = ?", [lineUserId]);
    if (user.length === 0) return res.status(404).json({ message: "ไม่พบผู้ใช้ในระบบ" });

    await db.promise().query("DELETE FROM orders WHERE lineUserId = ?", [lineUserId]);
    await db.promise().query("DELETE FROM user_addresses WHERE lineUserId = ?", [lineUserId]);
    await db.promise().query("DELETE FROM users WHERE lineUserId = ?", [lineUserId]);

    res.status(200).json({ message: "ลบผู้ใช้สำเร็จ" });
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ", details: error.message });
  }
};

const checkUser = async (req, res) => {
  const { lineUserId } = req.params;
  try {
    const [rows] = await db.promise().query("SELECT COUNT(*) AS count FROM users WHERE lineUserId = ?", [lineUserId]);
    res.json({ exists: rows[0].count > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล" });
  }
};

// ✅ Export ฟังก์ชันทั้งหมด
module.exports = {
  getUser,
  uploadSlip,
  upload,
  userInfo,
  removeUserByID,
  checkUser,
};
