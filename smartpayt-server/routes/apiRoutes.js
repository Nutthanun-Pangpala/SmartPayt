const express = require("express");
const { registerAddress,userAddressList,reportiIssue , registerAccount, userAddress ,userAddressBill ,generateBarcode} = require("../controllers/apiController");
const { userInfo,removeUserByID,checkUser } = require("../controllers/userController");
const { verify } = require("jsonwebtoken");
const { verifyLiffToken } = require("../services/liffService");

const router = express.Router();

// 🔹 Route สำหรับลงทะเบียน
router.post("/registerAccount",registerAccount);

router.post("/registerAddress", registerAddress);

router.get("/listuseraddress",userAddressList);

router.get("/user/:lineUserId", userInfo);

router.get("/address/:lineUserId", userAddress);

router.get("/bills/:address_id", userAddressBill);

router.delete("/removeuser/:id",removeUserByID);

router.post("/report-issue",reportiIssue)

router.get('/generate-barcode/:addressId', generateBarcode);

router.get('/checkUser/:lineUserId',checkUser);



module.exports = router;
