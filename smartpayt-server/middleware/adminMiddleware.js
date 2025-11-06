const jwt = require("jsonwebtoken");

// --- 1. ยามคนแรก (ตัวเดิมของคุณ, ถูกต้องแล้ว) ---
// (ทำหน้าที่: เช็กว่าล็อกอินหรือยัง?)
const verifyToken = (req, res, next) => {
  // ✅ รองรับทั้ง Authorization (Bearer ...) และ Admin_token header
  const token =
    req.headers['authorization']?.split(' ')[1] || // Bearer token
    req.headers['admin_token'];                    // custom header

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    // ให้แน่ใจว่ามี id หรือ adminId
    if (!decoded.id && !decoded.adminId) {
      return res.status(401).json({ message: 'Unauthorized: missing admin id in token' });
    }
    
    // บรรทัดนี้สำคัญมาก: สร้าง req.user (ซึ่งจะมี role ที่เราเพิ่มใน DB ติดมาด้วย)
    req.user = decoded; 
    next();
  });
};

// --- 2. ยามคนใหม่ (เพิ่มส่วนนี้เข้าไป) ---
// (ทำหน้าที่: เช็กว่ามีสิทธิ์ (Role) หรือไม่?)

/**
 * Middleware สำหรับตรวจสอบ Role ของ Admin (ยามคนที่สอง)
 * @param {Array<string>} allowedRoles - Array ของ Role ที่ได้รับอนุญาต
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // ฟังก์ชันนี้จะทำงาน *หลังจาก* verifyToken, ดังนั้น req.user ควรจะถูกสร้างแล้ว
    if (!req.user || !req.user.role) {
      // ถ้าใน Token ไม่มี role (อาจจะยังไม่ได้ login ใหม่)
      return res.status(403).json({ message: 'Forbidden: ไม่มีข้อมูลสิทธิ์' });
    }

    const { role } = req.user;

    if (allowedRoles.includes(role)) {
      // ✅ สิทธิ์ถูกต้อง, ไปต่อได้
      next();
    } else {
      // ❌ สิทธิ์ไม่พอ
      return res.status(403).json({ message: 'Forbidden: สิทธิ์ของคุณไม่เพียงพอ' });
    }
  };
};


// --- 3. แก้ไขการ export (ให้ส่งออกไป 2 ฟังก์ชัน) ---
module.exports = {
  verifyToken,
  checkRole
};