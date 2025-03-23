// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // นำเข้าคอนโทรลเลอร์

// Route สำหรับดึงข้อมูลผู้ใช้
exports.getUser = (req, res) => {
    // ตัวอย่างการดึงข้อมูลผู้ใช้
    const user = {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
    };
  
    res.json(user);
  };

module.exports = router;
