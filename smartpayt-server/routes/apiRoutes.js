const express = require("express");
const apiController = require("../controllers/apiController");
const userController = require("../controllers/userController");
const { verify } = require("jsonwebtoken");
const { verifyLiffToken } = require("../services/liffService");

const router = express.Router();

// 🔹 Route สำหรับลงทะเบียน
router.post("/registerAccount",apiController.registerAccount);

router.post("/registerAddress", apiController.registerAddress);

router.get("/listuseraddress",apiController.userAddressList);

router.put('/userupdateAccout/:lineUserId', apiController.updateAccount);

router.get("/user/:lineUserId", userController.userInfo);

router.get("/address/:lineUserId", apiController.userAddress);

router.get("/bills/:address_id", apiController.userAddressBill);

router.delete("/removeuser/:id",userController.removeUserByID);

router.post("/report-issue", apiController.reportiIssue);


router.get('/generate-barcode/:addressId', apiController.generateBarcode);

router.get('/checkUser/:lineUserId',userController.checkUser);





module.exports = router;
