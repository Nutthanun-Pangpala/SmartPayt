const db = require("../db/dbConnection");
const axios = require("axios");
require("dotenv").config();
const { generateToken, decodeToken } = require("../utils/jwt"); // ✅ นำเข้า jwt utils

const CLIENT_ID = process.env.LINE_CHANNEL_ID;

exports.lineLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "ID Token is required" });
    console.log("CLIENT_ID:", CLIENT_ID);
    console.log("Received ID Token:", idToken);

    // ✅ ตรวจสอบ idToken กับ LINE API
    const response = await axios.post("https://api.line.me/oauth2/v2.1/verify", null, {
      params: { id_token: idToken, client_id: String(CLIENT_ID) },
    });

    // ✅ Decode ID Token
    const decodedToken = decodeToken(idToken);
    if (!decodedToken) {
      return res.status(401).json({ message: "Invalid ID Token" });
    }

    console.log("Decoded Token:", decodedToken);

    // ✅ ตรวจสอบว่า aud ตรงกับ CLIENT_ID หรือไม่
    if (decodedToken.payload.aud !== CLIENT_ID) {
      return res.status(401).json({ message: "Invalid IdToken Audience" });
    }

    const userData = response.data;
    console.log("LINE User Data:", userData);

    // ✅ สร้าง JWT ให้ Client
    const token = generateToken({ id: userData.sub, name: userData.name });

    res.json({ token, user: { id: userData.sub, name: userData.name } });

  } catch (error) {
    console.error("LINE Token Verification Failed:", error.response?.data || error.message);
    res.status(401).json({ message: "Unauthorized" });
  }
};
