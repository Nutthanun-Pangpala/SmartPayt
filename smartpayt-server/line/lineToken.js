const { response } = require("express");
const db = require("../db/dbConnection");
const axios = require("axios");
require("dotenv").config();

exports.callback = async(req,res) =>{
    const { code } = req.query; // รับ authorization code จาก query parameter
  
    if (!code) {
      return res.status(400).send("Authorization code not found.");
    }
  
    try {
      // แลก authorization code เป็น access token
      const response = await axios.post("https://api.line.me/oauth2/v2.1/token", {
        grant_type: "authorization_code",
        code: code,
        LINE_REDIRECT_URI: "http://localhost:3000/liff/callback", // ใช้ Callback URL ของคุณ
        LINE_CHANNEL_ID: response.env.LINE_CHANNEL_ID,
        LINE_CHANNEL_SECRET: response.env.LINE_CHANNEL_SECRET
      });
  
      const accessToken = response.data.access_token;
  
      // ใช้ access token ดึงข้อมูลผู้ใช้
      const userProfile = await axios.get("https://api.line.me/v2/profile", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
  
      console.log(userProfile.data);
  
      res.send("Login successful!");
    } catch (error) {
      console.error("Error while getting access token:", error);
      res.status(500).send("Internal server error.");
    }
  };
  