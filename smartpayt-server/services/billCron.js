const cron = require('node-cron');
const adminController = require('../controllers/adminControllers');
require('dotenv').config();

// 📌 CRON รันทุกวันตอน 14:00 Asia/Bangkok
cron.schedule('0 14  * * *', () => {
  console.log('⏳ [CRON] เริ่มสร้างบิลอัตโนมัติ');

  adminController.generateBillsFromWasteToday({}, {});
}, { timezone: 'Asia/Bangkok' });

console.log('✅ Bill cron job started. รอเวลาทำงาน...');
