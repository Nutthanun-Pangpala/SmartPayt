// routes/admin.js
const express = require('express');
const adminController = require('../controllers/adminControllers');

// --- 1. [แก้ไข] Import 2 ฟังก์ชัน (ยาม 2 คน) จากไฟล์ middleware ---
const { verifyToken, checkRole } = require('../middleware/adminMiddleware');

const router = express.Router();

/* ===== Public routes ===== */
// (ไม่จำเป็นต้องเช็ก Token หรือ Role)
router.post('/register', adminController.register);
router.post('/login', adminController.login);

/* ===== Protected routes (ต้องมี token) ===== */
// --- 2. [แก้ไข] ใช้ verifyToken (ยามคนแรก) เพื่อเช็กว่า "ล็อกอินหรือยัง" ---
// โค้ดทั้งหมดข้างล่างนี้ จะต้องผ่าน verifyToken ก่อน
router.use(verifyToken);

// --- 3. [แก้ไข] เพิ่ม checkRole (ยามคนที่สอง) ในทุก Route ---

// == 📊 Dashboard (ทุกคนดูได้) ==
const allRoles = ['super-admin', 'staff', 'accountant'];
router.get('/stats', checkRole(allRoles), adminController.getUserCount);
router.get('/waste-stats', checkRole(allRoles), adminController.getWasteStats);
router.get('/pending-counts', checkRole(allRoles), adminController.getPendingCounts);
router.get('/waste-months', checkRole(allRoles), adminController.getWasteMonths);

// == 👥 User Management (Staff ขึ้นไป) ==
const staffAndUp = ['super-admin', 'staff'];
router.get('/users', checkRole(staffAndUp), adminController.getUsers);
router.get('/users/:lineUserId', checkRole(staffAndUp), adminController.getUserDetails);
router.get('/users/address/:lineUserId', checkRole(staffAndUp), adminController.getUserAddress);
router.get('/users/address/bills/:address_id', checkRole(staffAndUp), adminController.getuserAddressBill);
router.get('/users/search', checkRole(staffAndUp), adminController.searchUser);
router.post('/users/:lineUserId/add-address', checkRole(staffAndUp), adminController.adduserAddress);
router.post('/waste-records', checkRole(staffAndUp), adminController.createWasteRecord); // Staff คีย์ข้อมูลขยะ

// == ✅ Verification (Staff ขึ้นไป) ==
router.post('/verify-address/:addressId', checkRole(staffAndUp), adminController.verifyAddress);
router.get('/users-verify-user', checkRole(staffAndUp), adminController.getUsersForUserVerification);
router.get('/users-verify-address', checkRole(staffAndUp), adminController.getUsersWithAddressVerification);
router.patch('/users/:lineUserId/verify', checkRole(staffAndUp), adminController.verifyUser);

// == 🧾 Bill & Slips (Staff และ Accountant) ==
const moneyRoles = ['super-admin', 'staff', 'accountant'];
router.post('/bills', checkRole(moneyRoles), adminController.createBill); // Staff/Accountant สร้างบิลได้
router.get('/payment-slips', checkRole(moneyRoles), adminController.getAllPaymentSlips); // ทุกคนดูสลิปได้
router.patch('/payment-slips/:id', checkRole(moneyRoles), adminController.updateSlipStatus); // ทุกคนอนุมัติสลิปได้

// == 💰 Finance & Pricing (ต้องระวัง!) ==
const financeRoles = ['super-admin', 'accountant'];
router.get('/debt', checkRole(financeRoles), adminController.getDebtUsers);
router.get('/report/export-finance', checkRole(financeRoles), adminController.exportFinanceReport);
router.get('/users/:lineUserId/bills', checkRole(financeRoles), adminController.getBillsByLineUserId); // (อาจจะซ้ำซ้อน แต่ใส่ไว้ก่อน)

router.get('/waste-pricing', checkRole(allRoles), adminController.getWastePricing); // ทุกคนดู "ราคา" ได้

// --- ❌ (สำคัญ!) เฉพาะ Super Admin เท่านั้นที่ "เปลี่ยนราคา" ได้ ---
router.post('/waste-pricing', checkRole(['super-admin']), adminController.updateWastePricing);
router.post('/household', checkRole(['super-admin']), adminController.updateWastePricing);
router.post('/establishment', checkRole(['super-admin']), adminController.updateWastePricing);

// --- ⚙️ System Actions (เฉพาะ Super Admin) ---
router.post('/generate-bills-today', checkRole(['super-admin']), adminController.generateBillsFromWasteToday); // (การสั่งรัน Cron Job เอง)

// == 📈 Reports (ทุกคนดูได้) ==
router.get('/report/export-waste', checkRole(allRoles), adminController.exportWasteReport);
router.get('/stats-waste-daily', checkRole(allRoles), adminController.getDailyWasteStats);

// (อันนี้ซ้ำกับข้างบน แต่ใส่ Role ไว้เหมือนกัน)
router.get('/user-address/:lineUserId', checkRole(staffAndUp), adminController.getUserAddress);


module.exports = router;