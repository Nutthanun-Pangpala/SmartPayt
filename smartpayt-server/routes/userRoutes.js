// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // นำเข้าคอนโทรลเลอร์

// Route สำหรับดึงข้อมูลผู้ใช้
router.get('/user', userController.getUser);

module.exports = router;
