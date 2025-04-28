const express = require("express");
const { stkPush, callBack, WithdrawFunds, handleIntasendCallback, handleIntasendDepositCallback } = require("../controllers/mpesaControllers");
const router = express.Router();

router.post("/stkpush", stkPush);
router.post("/callback", callBack);
router.post("/withdraw", WithdrawFunds)
router.post("/intasend-withdrawal-callback", handleIntasendCallback)
router.post("/intasend-deposit-callback", handleIntasendDepositCallback)

module.exports = router;