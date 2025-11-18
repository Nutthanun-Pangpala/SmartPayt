const cron = require('node-cron');
const adminController = require('../controllers/adminControllers'); // เช็คชื่อไฟล์ให้ถูก (มี s หรือไม่มี s)
require('dotenv').config();

// 📌 CRON รันวันที่ 1 ของทุกเดือน ตอน 14:00 น.
cron.schedule('0 14 1 * *', async () => {
  console.log('⏳ [CRON] เริ่มกระบวนการสร้างบิลประจำเดือน...');

  // 1. คำนวณหา "เดือนก่อนหน้า" 
  // (เช่น รันวันที่ 1 พ.ย. ต้องออกบิลของเดือน ต.ค.)
  const date = new Date();
  date.setMonth(date.getMonth() - 1); // ถอยหลัง 1 เดือน
  
  const targetMonth = date.getMonth() + 1; // JS เดือนเริ่มที่ 0 เลยต้อง +1
  const targetYear = date.getFullYear();

  console.log(`📅 กำลังออกบิลของเดือน: ${targetMonth}/${targetYear}`);

  // 2. สร้าง Mock Objects (จำลอง req และ res)
  // เพื่อให้ adminController ทำงานได้โดยไม่ error
  const req = {
    body: {
      month: targetMonth,
      year: targetYear
    }
  };

  const res = {
    status: (code) => ({
      json: (data) => console.log(`✅ [CRON Success] Status: ${code}`, data.message || data)
    }),
    send: (data) => console.log(`✅ [CRON Success]:`, data)
  };

  // 3. เรียกฟังก์ชันสร้างบิลรายเดือน (Monthly)
  try {
    await adminController.generateMonthlyBills(req, res);
  } catch (error) {
    console.error('❌ [CRON Failed] เกิดข้อผิดพลาด:', error);
  }

}, { timezone: 'Asia/Bangkok' });

console.log('✅ Bill cron job started. ระบบรอรันทุกวันที่ 1 เวลา 14:00 น.');