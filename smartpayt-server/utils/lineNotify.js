// services/lineService.js
const axios = require("axios");

async function sendMessageToUser(lineUserId, message) {
  const LINE_ACCESS_TOKEN = process.env.LINE_ACCESS_TOKEN;

  try {
    await axios.post(
      "https://api.line.me/v2/bot/message/push",
      {
        to: lineUserId,
        messages: [
          {
            type: "text",
            text: message,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LINE_ACCESS_TOKEN}`,
        },
      }
    );
    console.log("✅ ส่งข้อความผ่าน OA สำเร็จ");
  } catch (error) {
    console.error("❌ ส่งข้อความล้มเหลว:", error.response?.data || error.message);
  }
}

module.exports = { sendMessageToUser };
