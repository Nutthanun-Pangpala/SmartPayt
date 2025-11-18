// routes/adminRoutes.js
const express = require('express');
const adminController = require('../controllers/adminControllers'); // ✅ ชื่อไฟล์ตรงแล้ว

const { verifyToken, checkRole } = require('../middleware/adminMiddleware');

const router = express.Router();

/* ===== Public routes ===== */
router.post('/register', adminController.register);
router.post('/login', adminController.login);

/* ===== Protected routes ===== */
router.use(verifyToken);

// --- Role Definitions ---
const staffAccountantAdmin = ['super-admin', 'staff', 'accountant']; 
const staffAndUp = ['super-admin', 'staff']; 
const collectorAndAdmin = ['super-admin', 'collector']; 
const superAdminOnly = ['super-admin']; 
const financeRoles = ['super-admin', 'accountant'];
const allRoles = ['super-admin', 'staff', 'accountant', 'collector'];

// --- Routes ---

// == 📊 Dashboard & Stats ==
router.get('/stats', checkRole(staffAccountantAdmin), adminController.getUserCount);
router.get('/waste-stats', checkRole(staffAccountantAdmin), adminController.getWasteStats);
router.get('/pending-counts', checkRole(staffAccountantAdmin), adminController.getPendingCounts);
router.get('/waste-months', checkRole(staffAccountantAdmin), adminController.getWasteMonths);

// == 👥 User Management ==
router.get('/users', checkRole(staffAndUp), adminController.getUsers);
router.get('/users/:lineUserId', checkRole(staffAndUp), adminController.getUserDetails);
router.get('/users/address/:lineUserId', checkRole(staffAndUp), adminController.getUserAddress);
router.get('/users/address/bills/:address_id', checkRole(staffAndUp), adminController.getuserAddressBill);
router.get('/users/search', checkRole(staffAndUp), adminController.searchUser);
router.post('/users/:lineUserId/add-address', checkRole(staffAndUp), adminController.adduserAddress);

// == 🗑️ Waste Records ==
router.post('/waste-records', checkRole(collectorAndAdmin), adminController.createWasteRecord); 

// == ✅ Verification ==
router.post('/verify-address/:addressId', checkRole(staffAndUp), adminController.verifyAddress);
router.get('/users-verify-user', checkRole(staffAndUp), adminController.getUsersForUserVerification);
router.get('/users-verify-address', checkRole(staffAndUp), adminController.getUsersWithAddressVerification);
router.patch('/users/:lineUserId/verify', checkRole(staffAndUp), adminController.verifyUser);

// == 🧾 Bill & Slips ==
router.post('/bills', checkRole(staffAccountantAdmin), adminController.createBill); 
router.get('/payment-slips', checkRole(staffAccountantAdmin), adminController.getAllPaymentSlips); 
router.patch('/payment-slips/:id', checkRole(staffAccountantAdmin), adminController.updateSlipStatus); 

// == 💰 Finance & Pricing ==
router.get('/debt', checkRole(staffAccountantAdmin), adminController.getDebtUsers);
router.get('/report/export-finance', checkRole(financeRoles), adminController.exportFinanceReport);
router.get('/users/:lineUserId/bills', checkRole(financeRoles), adminController.getBillsByLineUserId); 

// ทุกคนดู "ราคา" ได้
router.get('/waste-pricing', checkRole(allRoles), adminController.getWastePricing); 

// --- ❌ เฉพาะ Super Admin เปลี่ยนราคาได้ ---
router.post('/waste-pricing', checkRole(superAdminOnly), adminController.updateWastePricing);
router.post('/household', checkRole(superAdminOnly), adminController.updateWastePricing);
router.post('/establishment', checkRole(superAdminOnly), adminController.updateWastePricing);

// --- ⚙️ System Actions (Automated Billing) ---
// ✅ แก้ตรงนี้: เปลี่ยนเป็น Monthly และเรียกฟังก์ชันให้ถูก
router.post('/generate-bills-monthly', checkRole(superAdminOnly), adminController.generateMonthlyBills); 

// == 📈 Reports ==
router.get('/report/export-waste', checkRole(staffAccountantAdmin), adminController.exportWasteReport);
router.get('/stats-waste-daily', checkRole(staffAccountantAdmin), adminController.getDailyWasteStats);

router.get('/audit-logs', checkRole(superAdminOnly), adminController.getAuditLogs);

module.exports = router;