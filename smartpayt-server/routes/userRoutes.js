const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // ✅ นำเข้าฟังก์ชัน controller

// 👉 ตัวอย่าง route ปกติ
router.get("/user", userController.getUser);

// 👉 เพิ่ม route สำหรับอัปโหลดสลิป

router.post(
  "/upload-slip",
  userController.upload.single("slip"), // <-- สำคัญ!
  userController.uploadSlip
);
module.exports = router;
