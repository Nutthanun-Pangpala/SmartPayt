const express = require("express");
const { registerUser,userAddressList } = require("../controllers/registerController");
const { userByID,removeUserByID } = require("../controllers/userController");
const { verify } = require("jsonwebtoken");
const { verifyLiffToken } = require("../services/liffService");

const router = express.Router();

// 🔹 Route สำหรับลงทะเบียน
router.post("/register", registerUser);

router.get("/listuseraddress",userAddressList);

router.get("/user/:id", userByID); 

router.delete("/removeuser/:id",removeUserByID);


module.exports = router;
