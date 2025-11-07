// routes/admin.js
const express = require('express');
const adminController = require('../controllers/adminControllers');

// --- 1. Import 2 ฟังก์ชัน (ยาม 2 คน) จากไฟล์ middleware ---
const { verifyToken, checkRole } = require('../middleware/adminMiddleware');

const router = express.Router();

/* ===== Public routes ===== */
router.post('/register', adminController.register);
router.post('/login', adminController.login);

/* ===== Protected routes (ต้องมี token) ===== */
// --- 2. ใช้ verifyToken (ยามคนแรก) เพื่อเช็กว่า "ล็อกอินหรือยัง" ---
router.use(verifyToken);

// --- 3. Role Definitions ตามสิทธิ์ใหม่ ---

// เข้าถึงได้ทุกคนที่มี Token (ยกเว้น Collector ที่มีสิทธิ์จำกัดมาก)
const staffAccountantAdmin = ['super-admin', 'staff', 'accountant']; 
// Staff ขึ้นไป (จัดการผู้ใช้)
const staffAndUp = ['super-admin', 'staff']; 
// Collector และ Super Admin เท่านั้น
const collectorAndAdmin = ['super-admin', 'collector']; 
// Super Admin เท่านั้น
const superAdminOnly = ['super-admin']; 

// --- 4. กำหนดสิทธิ์ในแต่ละ Route ---

// == 📊 Dashboard & Stats (Staff, Accountant, Super Admin) ==
router.get('/stats', checkRole(staffAccountantAdmin), adminController.getUserCount);
router.get('/waste-stats', checkRole(staffAccountantAdmin), adminController.getWasteStats);
router.get('/pending-counts', checkRole(staffAccountantAdmin), adminController.getPendingCounts);
router.get('/waste-months', checkRole(staffAccountantAdmin), adminController.getWasteMonths);

// == 👥 User Management (Staff ขึ้นไป) ==
router.get('/users', checkRole(staffAndUp), adminController.getUsers);
router.get('/users/:lineUserId', checkRole(staffAndUp), adminController.getUserDetails);
router.get('/users/address/:lineUserId', checkRole(staffAndUp), adminController.getUserAddress);
router.get('/users/address/bills/:address_id', checkRole(staffAndUp), adminController.getuserAddressBill);
router.get('/users/search', checkRole(staffAndUp), adminController.searchUser);
router.post('/users/:lineUserId/add-address', checkRole(staffAndUp), adminController.adduserAddress);

// == 🗑️ Waste Records (Collector & Super Admin เท่านั้น) ==
// ⚠️ Collector มีสิทธิ์แค่บันทึกขยะ (Scan/Manual Key)
router.post('/waste-records', checkRole(collectorAndAdmin), adminController.createWasteRecord); 

// == ✅ Verification (Staff ขึ้นไป) ==
router.post('/verify-address/:addressId', checkRole(staffAndUp), adminController.verifyAddress);
router.get('/users-verify-user', checkRole(staffAndUp), adminController.getUsersForUserVerification);
router.get('/users-verify-address', checkRole(staffAndUp), adminController.getUsersWithAddressVerification);
router.patch('/users/:lineUserId/verify', checkRole(staffAndUp), adminController.verifyUser);

// == 🧾 Bill & Slips (Staff, Accountant, Super Admin) ==
router.post('/bills', checkRole(staffAccountantAdmin), adminController.createBill); 
router.get('/payment-slips', checkRole(staffAccountantAdmin), adminController.getAllPaymentSlips); 
router.patch('/payment-slips/:id', checkRole(staffAccountantAdmin), adminController.updateSlipStatus); 

// == 💰 Finance & Pricing ==
// ข้อมูลการเงิน เช่น หนี้ (Accountant, Super Admin)
const financeRoles = ['super-admin', 'accountant'];
router.get('/debt', checkRole(staffAccountantAdmin), adminController.getDebtUsers);
router.get('/report/export-finance', checkRole(financeRoles), adminController.exportFinanceReport);
router.get('/users/:lineUserId/bills', checkRole(financeRoles), adminController.getBillsByLineUserId); 

// ทุกคนดู "ราคา" ได้ (รวม Collector ด้วย เพื่อใช้ในการคำนวณหน้าสแกน)
const allRoles = ['super-admin', 'staff', 'accountant', 'collector'];
router.get('/waste-pricing', checkRole(allRoles), adminController.getWastePricing); 

// --- ❌ (สำคัญ!) เฉพาะ Super Admin เท่านั้นที่ "เปลี่ยนราคา" ได้ ---
router.post('/waste-pricing', checkRole(superAdminOnly), adminController.updateWastePricing);
router.post('/household', checkRole(superAdminOnly), adminController.updateWastePricing);
router.post('/establishment', checkRole(superAdminOnly), adminController.updateWastePricing);

// --- ⚙️ System Actions (เฉพาะ Super Admin) ---
router.post('/generate-bills-today', checkRole(superAdminOnly), adminController.generateBillsFromWasteToday); 

// == 📈 Reports (Staff, Accountant, Super Admin) ==
router.get('/report/export-waste', checkRole(staffAccountantAdmin), adminController.exportWasteReport);
router.get('/stats-waste-daily', checkRole(staffAccountantAdmin), adminController.getDailyWasteStats);

// (อันนี้ซ้ำกับข้างบน แต่ใส่ Role ไว้เหมือนกัน)
router.get('/user-address/:lineUserId', checkRole(staffAndUp), adminController.getUserAddress);


module.exports = router;