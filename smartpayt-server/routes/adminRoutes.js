// routes/admin.js
const express = require('express');
const adminController = require('../controllers/adminControllers');
const verifyToken = require('../middleware/adminMiddleware');

const router = express.Router();

/* ===== Public routes ===== */
router.post('/register', adminController.register);
router.post('/login', adminController.login);

// (ถ้ามีเส้นทางที่ผู้ใช้ทั่วไปเรียกได้ ให้ใส่ไว้ก่อนบรรทัดด้านล่างนี้)

/* ===== Protected routes (ต้องมี token) ===== */
router.use(verifyToken);

// Admin Main
router.get('/stats', adminController.getUserCount);
router.get('/waste-stats', adminController.getWasteStats);
router.get('/pending-counts', adminController.getPendingCounts);
router.get('/waste-months', adminController.getWasteMonths);

// Admin Service
router.get('/users', adminController.getUsers);
router.get('/users/:lineUserId', adminController.getUserDetails);
router.get('/users/address/:lineUserId', adminController.getUserAddress);
router.get('/users/address/bills/:address_id', adminController.getuserAddressBill);
router.get('/users/search', adminController.searchUser);

// Debt & Bills
router.get('/debt', adminController.getDebtUsers);
router.get('/users/:lineUserId/bills', adminController.getBillsByLineUserId);

// ✅ Verify flows
router.post('/verify-address/:addressId', adminController.verifyAddress);
router.get('/users-verify-user', adminController.getUsersForUserVerification);
router.get('/users-verify-address', adminController.getUsersWithAddressVerification);
router.patch('/users/:lineUserId/verify', adminController.verifyUser);

// Manual bill & waste pricing
router.post('/bills', adminController.createBill);
router.get('/waste-pricing', adminController.getWastePricing);
router.post('/waste-pricing', adminController.updateWastePricing);
router.post('/household', adminController.updateWastePricing);
router.post('/establishment', adminController.updateWastePricing);

router.get('/user-address/:lineUserId', adminController.getUserAddress);

// View slip
router.get('/payment-slips', adminController.getAllPaymentSlips);
router.patch('/payment-slips/:id', adminController.updateSlipStatus);

// Reports
router.get('/report/export-waste', adminController.exportWasteReport);
router.get('/stats-waste-daily', adminController.getDailyWasteStats);
router.get('/report/export-finance', adminController.exportFinanceReport);

// Waste records
router.post('/waste-records', adminController.createWasteRecord);
router.post('/generate-bills-today', adminController.generateBillsFromWasteToday);
router.post('/users/:lineUserId/add-address', adminController.adduserAddress);

module.exports = router;
