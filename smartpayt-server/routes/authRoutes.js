const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { lineLogin } = require("../controllers/authControllers");

const router = express.Router();

// ✅ Login with LINE
router.post("/line-login",lineLogin);

module.exports = router;
