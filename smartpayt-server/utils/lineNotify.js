// utils/lineNotify.js
const axios = require('axios');
require('dotenv').config(); // ตรวจสอบว่ามี dotenv หรือยัง

// --------------------------------------------------
// ฟังก์ชันเดิมสำหรับส่งหา User (Push API) - คงไว้
// --------------------------------------------------
const sendMessageToUser = async (lineUserId, messageText) => {
  const lineAccessToken = process.env.LINE_ACCESS_TOKEN; // Token ของ Messaging API Bot
  if (!lineUserId || !messageText) {
    console.error("❌ LINE Send Error: Missing lineUserId or messageText");
    return;
  }
  if (!lineAccessToken) {
    console.error("❌ LINE Send Error: Missing LINE_ACCESS_TOKEN in .env");
    return;
  }

  try {
    console.log(`➡️ Sending LINE message to User ${lineUserId}: "${messageText}"`);
    await axios.post(
      "https://api.line.me/v2/bot/message/push",
      { to: lineUserId, messages: [{ type: "text", text: messageText }] },
      { headers: { "Content-Type": "application/json", Authorization: `Bearer ${lineAccessToken}` } }
    );
    console.log(`✅ LINE message sent successfully to User ${lineUserId}`);
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    console.error(`❌ LINE Send Error to User ${lineUserId}: ${errorMessage}`, error.response?.data?.details || '');
  }
};


// --------------------------------------------------
// (เพิ่มใหม่) ฟังก์ชันสำหรับส่ง LINE Notify (เข้ากลุ่ม Admin หรือหา Admin)
// --------------------------------------------------
const sendLineNotify = async (messageText) => {
  const lineNotifyToken = process.env.LINE_NOTIFY_TOKEN; // <<--- Token ของ LINE Notify ที่จะส่งหา
  if (!messageText) {
    console.error("❌ LINE Notify Error: Missing messageText");
    return;
  }
  if (!lineNotifyToken) {
    console.error("❌ LINE Notify Error: Missing LINE_NOTIFY_TOKEN in .env");
    return;
  }

  try {
    console.log(`➡️ Sending LINE Notify: "${messageText}"`);
    await axios.post(
      'https://notify-api.line.me/api/notify',
      `message=${encodeURIComponent(messageText)}`, // ต้องส่งแบบ form-urlencoded
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${lineNotifyToken}`,
        },
      }
    );
    console.log(`✅ LINE Notify sent successfully`);
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    console.error(`❌ LINE Notify Error: ${errorMessage}`, error.response?.status || '');
  }
};


// Export ทั้งสองฟังก์ชัน
module.exports = {
  sendMessageToUser,
  sendLineNotify, // <<--- Export ฟังก์ชันใหม่ด้วย
};