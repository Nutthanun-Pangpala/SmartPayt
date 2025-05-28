const db = require("../db/dbConnection");
const axios = require("axios");
require("dotenv").config();
const { generateToken, decodeToken } = require("../utils/jwt"); // ✅ นำเข้า jwt utils

const CLIENT_ID = process.env.LINE_CHANNEL_ID;

exports.lineLogin = async (req, res) => {
  const { code } = req.body;

  if (!code) return res.status(400).json({ message: "Missing code" });

  try {
    const tokenResponse = await axios.post("https://api.line.me/oauth2/v2.1/token", null, {
      params: {
        grant_type: "authorization_code",
        code,
        redirect_uri: LINE_REDIRECT_URI,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
      },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const accessToken = tokenResponse.data.access_token;

    // 📌 ดึงข้อมูลโปรไฟล์จาก LINE
    const profileResponse = await axios.get("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { userId, displayName, pictureUrl } = profileResponse.data;

    // 📌 ส่งข้อมูลให้ React และเก็บ Access Token
    res.json({ userId, displayName, pictureUrl, accessToken });
  } catch (error) {
    console.error("Error logging in:", error.response?.data || error.message);
    res.status(500).json({ message: "Login failed" });
  }
};