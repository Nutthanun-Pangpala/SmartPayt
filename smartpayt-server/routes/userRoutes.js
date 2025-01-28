// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// ดึงข้อมูลผู้ใช้ทั้งหมด
router.get('/', userController.getUsers);

// ลบผู้ใช้โดย ID
router.delete('/:id', userController.deleteUser);

module.exports = router;
