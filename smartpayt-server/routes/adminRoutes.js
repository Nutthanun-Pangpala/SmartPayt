const express = require('express');
const adminController = require('../controllers/adminControllers');
const verifyToken = require('../middleware/adminMiddleware');

const router = express.Router();

// Public routes
router.post('/register', adminController.register);
router.post('/login', adminController.login);
router.patch('/:lineUserId/address/verify/:addressId',adminController.verifyUserAddress);
router.post('/users/:lineUserId/add-address', adminController.adduserAsdress);

// Protected routes
router.use(verifyToken);

// Route for fetching users (AdminService)
router.get('/stats',adminController.getUserCount);
router.get('/users', adminController.getUsers);
router.get('/users/:lineUserId',adminController.getUserDetails);
router.get('/users/address/:lineUserId',adminController.getUserAddress);
router.get("/users/address/bills/:address_id",adminController.getuserAddressBill);
router.get('/users/search',adminController.searchUser);

module.exports = router;