const express = require('express');
const adminController = require('../controllers/adminControllers');
const verifyToken = require('../middleware/adminMiddleware');




const router = express.Router();

// Public routes
router.post('/register', adminController.register);
router.post('/login', adminController.login);
router.patch('/:lineUserId/address/verify/:addressId',adminController.verifyAddress);
router.post('/users/:lineUserId/add-address', adminController.adduserAddress);


// Protected routes

//Admin Main
router.get('/stats', adminController.getUserCount);
router.get('/waste-stats', adminController.getWasteStats);
router.get('/pending-counts', adminController.getPendingCounts);
router.get('/waste-months', adminController.getWasteMonths);


// Admin Service
router.get('/users', adminController.getUsers);
router.get('/users/:lineUserId',adminController.getUserDetails);
router.get('/users/address/:lineUserId',adminController.getUserAddress);
router.get("/users/address/bills/:address_id",adminController.getuserAddressBill);
router.get('/users/search',adminController.searchUser);

//Route for fetching users (AdminDebtPage)
router.get('/debt', adminController.getDebtUsers);
router.get('/users/:lineUserId/bills', adminController.getBillsByLineUserId);

//Route for AdminVerified page
router.post('/verify-address/:addressId', adminController.verifyAddress);  // ยืนยันที่อยู่
router.get('/users-verify-user', adminController.getUsersForUserVerification);
router.get('/users-verify-address', adminController.getUsersWithAddressVerification);
router.patch('/users/:lineUserId/verify', adminController.verifyUser);

//Route for Admin Manual bill page
router.post('/bills', verifyToken, adminController.createBill);
router.get('/waste-pricing', adminController.getWastePricing);

//roure for Edit Waste
router.post('/household', adminController.updateWastePricing); // สำหรับครัวเรือน
router.post('/establishment', adminController.updateWastePricing); // สำหรับสถานประกอบการ
router.get('/user-address/:lineUserId', adminController.getUserAddress);

// Admin View slip
router.get('/payment-slips', adminController.getAllPaymentSlips);
router.patch('/payment-slips/:id', adminController.updateSlipStatus);

router.patch('/users/:lineUserId/verify', verifyToken, adminController.verifyUser);
router.post('/verify-address/:addressId', verifyToken, adminController.verifyAddress);
router.post('/waste-pricing', verifyToken, adminController.updateWastePricing);

//report
router.get('/report/export-waste', adminController.exportWasteReport);
router.get('/stats-waste-daily', adminController.getDailyWasteStats);
router.get('/report/export-finance', adminController.exportFinanceReport);

router.post('/waste-records', verifyToken,adminController.createWasteRecord);
router.post('/generate-bills-today', adminController.generateBillsFromWasteToday);


router.use(verifyToken);

  


module.exports = router;