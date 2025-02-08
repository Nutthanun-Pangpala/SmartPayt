const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// ✅ เชื่อม API login
router.post("/adminlogin", adminController.adminLogin);

module.exports = router;
