const express = require("express");
const { registerUser } = require("../controllers/registerController");
const { callback } = require("../line/lineToken");

const router = express.Router();

// 🔹 Route สำหรับลงทะเบียน
router.post("/register", registerUser);

router.get('"/callback',callback);

module.exports = router;
