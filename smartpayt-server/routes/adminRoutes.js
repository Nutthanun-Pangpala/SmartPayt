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
router.use(verifyToken);

//Admin Main
router.get('/stats', adminController.getUserCount);
router.get('/waste-stats', adminController.getWasteStats);
router.get('/pending-counts', adminController.getPendingCounts);
router.get('/waste-months', adminController.getWasteMonths);


// Admin Service
router.get('/stats', adminController.getUserCount);
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
router.post('/waste-pricing', adminController.updateWastePricing);
router.get('/user-address/:lineUserId', adminController.getUserAddress);

module.exports = router;
