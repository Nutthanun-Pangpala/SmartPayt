const axios = require("axios");

const verifyLiffToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;  // อ่านค่า Authorization Header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    const idToken = authHeader.split(" ")[1]; // ตัดคำว่า "Bearer " ออก

    // 📌 ตรวจสอบว่า idToken ได้รับค่าถูกต้องหรือไม่
    if (!idToken) {
      return res.status(401).json({ message: "Invalid Token" });
    }

    // 📌 เรียก API ของ LINE เพื่อ Verify Token
    const response = await axios.post(
      "https://api.line.me/oauth2/v2.1/verify",
      new URLSearchParams({
        id_token: idToken,
        client_id: "2006592847",  // ✅ ใส่ Client ID ของ LINE LIFF App
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    // 📌 ดึงข้อมูล user ออกจาก token
    req.user = response.data;
    console.log("LINE User Data:", req.user);

    next();
  } catch (error) {
    console.error("Token verification error:", error.response?.data || error.message);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

module.exports = { verifyLiffToken };
