const express = require("express");
const { registerAddress,userAddressList,reportiIssue ,userBills, registerAccount, userAddress } = require("../controllers/apiController");
const { userInfo,removeUserByID } = require("../controllers/userController");
const { verify } = require("jsonwebtoken");
const { verifyLiffToken } = require("../services/liffService");

const router = express.Router();

// 🔹 Route สำหรับลงทะเบียน
router.post("/registerAccount",registerAccount);

router.post("/registerAddress", registerAddress);

router.get("/listuseraddress",userAddressList);

router.get("/user/:lineUserId", userInfo);

router.get("/address/:lineUserId", userAddress);

router.delete("/removeuser/:id",removeUserByID);

router.post("/report-issue",reportiIssue)

router.get("/bills",userBills);


module.exports = router;
