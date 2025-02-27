const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET_KEY = process.env.JWT_SECRET  // ใช้ค่าใน .env หรือกำหนดค่าชั่วคราว

// ✅ ฟังก์ชันสร้าง JWT Token
const generateToken = (payload, expiresIn = "1h") => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
};

// ✅ ฟังก์ชันตรวจสอบและถอดรหัส JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (error) {
    return null; // ถ้าตรวจสอบไม่ผ่าน ให้ส่งค่า null
  }
};

// ✅ ฟังก์ชันถอดรหัส (decode) Token โดยไม่ตรวจสอบลายเซ็น
const decodeToken = (token) => {
  return jwt.decode(token, { complete: true });
};

module.exports = { generateToken, verifyToken, decodeToken };
