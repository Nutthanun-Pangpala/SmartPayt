const cron = require('node-cron');
const adminController = require('../controllers/adminControllers');
require('dotenv').config();

// 📌 CRON รันวันที่ 1 ของทุกเดือน ตอน 14:00 (02:00 PM) Asia/Bangkok
// รูปแบบ: นาที ชั่วโมง วันที่ของเดือน เดือน วันของสัปดาห์
// '0 14 1 * *' คือ: นาที 0, ชั่วโมง 14 (บ่าย 2 โมง), วันที่ 1, ทุกเดือน, ทุกวันของสัปดาห์
cron.schedule('0 14 1 * *', () => {
  console.log('⏳ [CRON] เริ่มสร้างบิลอัตโนมัติประจำเดือน');

  adminController.generateBillsFromWasteToday({}, {});
}, { timezone: 'Asia/Bangkok' });

console.log('✅ Bill cron job started. รอเวลาทำงาน...');