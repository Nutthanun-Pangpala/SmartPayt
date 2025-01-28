const axios = require("axios");
require("dotenv").config(); // ใช้ dotenv สำหรับดึงค่าจาก .env

// ฟังก์ชันส่งข้อความผ่าน LINE Messaging API
const sendLineMessage = async (lineUserId, message) => {
  const LINE_MESSAGING_API = "https://api.line.me/v2/bot/message/push";
  const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN; // ดึง Access Token จาก .env

  if (!LINE_ACCESS_TOKEN) {
    console.error("ไม่พบ LINE_ACCESS_TOKEN ในตัวแปรสิ่งแวดล้อม");
    return;
  }

  try {
    const response = await axios.post(
      LINE_MESSAGING_API,
      {
        to: lineUserId,
        messages: [
          {
            type: "text",
            text: message, // ข้อความที่ต้องการส่ง
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("ส่งข้อความสำเร็จ!", response.data);
  } catch (error) {
    if (error.response) {
      console.error("ส่งข้อความไม่สำเร็จ:", error.response.data);
    } else {
      console.error("เกิดข้อผิดพลาดในการเชื่อมต่อ:", error.message);
    }
  }
};

module.exports = sendLineMessage;
