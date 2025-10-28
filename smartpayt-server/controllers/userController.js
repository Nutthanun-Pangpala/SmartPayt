const db = require("../db/dbConnection");
const multer = require("multer");
const path = require("path");

// กำหนด folder เก็บ slip
const upload = multer({
  dest: path.join(__dirname, "../uploads/"),
  limits: { fileSize: 5 * 1024 * 1024 }, // จำกัดขนาด 5MB
});

// 🧩 ดึงข้อมูลจำลอง (ทดสอบ)
const getUser = (req, res) => {
  res.json({ id: 1, name: "John Doe", email: "john@example.com" });
};

// 📤 อัปโหลดสลิปและอัปเดตสถานะบิล
const uploadSlip = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "ไม่มีไฟล์แนบมา" });
    }

    const { bill_ids } = req.body;
    if (!bill_ids) {
      return res.status(400).json({ success: false, message: "ไม่พบ bill_ids" });
    }

    let billArray;
    try {
      billArray = Array.isArray(bill_ids) ? bill_ids : JSON.parse(bill_ids);
    } catch (e) {
      return res.status(400).json({ success: false, message: "bill_ids ต้องเป็น array หรือ JSON string" });
    }

    if (!billArray.length) {
      return res.status(400).json({ success: false, message: "ไม่มี bill id สำหรับอัปโหลด" });
    }

    const filePath = req.file.path;

    // ✅ บันทึกสลิปในตาราง payment_slips
    for (let billId of billArray) {
      await db.query(
        "INSERT INTO payment_slips (bill_id, image_path, status, uploaded_at) VALUES (?, ?, 'pending', NOW())",
        [billId, filePath]
      );
    }

    // ✅ อัปเดตสถานะบิลเป็น 2 (รอตรวจสอบ)
    const placeholders = billArray.map(() => "?").join(",");
    await db.query(`UPDATE bills SET status = 2 WHERE id IN (${placeholders})`, billArray);

    return res.json({ success: true, message: "อัปโหลดและอัปเดตสถานะสำเร็จ" });
  } catch (err) {
    console.error("❌ [upload-slip ERROR]:", err);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: "เกิดข้อผิดพลาดใน server" });
    }
  }
};

// 👤 ดึงข้อมูลผู้ใช้
const userInfo = async (req, res) => {
  try {
    const { lineUserId } = req.params;
    if (!lineUserId)
      return res.status(400).json({ message: "lineUserId ไม่พบในคำขอ" });

    const [rows] = await db.query("SELECT * FROM users WHERE lineUserId = ?", [lineUserId]);
    if (rows.length === 0)
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });

    res.status(200).json({ message: "ดึงข้อมูลผู้ใช้สำเร็จ", user: rows[0] });
  } catch (error) {
    console.error("❌ [userInfo ERROR]:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};

// 🗑️ ลบผู้ใช้ตาม lineUserId
const removeUserByID = async (req, res) => {
  try {
    const lineUserId = req.params.id;
    if (!lineUserId) return res.status(400).json({ message: "กรุณาระบุ id" });

    const [user] = await db.query("SELECT * FROM users WHERE lineUserId = ?", [lineUserId]);
    if (user.length === 0)
      return res.status(404).json({ message: "ไม่พบผู้ใช้ในระบบ" });

    // ลบข้อมูลที่สัมพันธ์ (เรียงลบจากปลายสาย)
    await db.query(
      `DELETE ps FROM payment_slips ps 
       JOIN bills b ON ps.bill_id = b.id 
       JOIN addresses a ON b.address_id = a.address_id 
       WHERE a.lineUserId = ?`,
      [lineUserId]
    );
    await db.query(
      `DELETE b FROM bills b 
       JOIN addresses a ON b.address_id = a.address_id 
       WHERE a.lineUserId = ?`,
      [lineUserId]
    );
    await db.query("DELETE FROM addresses WHERE lineUserId = ?", [lineUserId]);
    await db.query("DELETE FROM users WHERE lineUserId = ?", [lineUserId]);

    res.status(200).json({ message: "ลบผู้ใช้และข้อมูลที่เกี่ยวข้องสำเร็จ" });
  } catch (error) {
    console.error("❌ [removeUserByID ERROR]:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ", details: error.message });
  }
};

// 🔎 ตรวจสอบว่าผู้ใช้ลงทะเบียนหรือยัง
const checkUser = async (req, res) => {
  const { lineUserId } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT COUNT(*) AS count FROM users WHERE lineUserId = ?",
      [lineUserId]
    );
    res.json({ exists: rows[0].count > 0 });
  } catch (err) {
    console.error("❌ [checkUser ERROR]:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล" });
  }
};

module.exports = {
  getUser,
  uploadSlip,
  upload,
  userInfo,
  removeUserByID,
  checkUser,
};
