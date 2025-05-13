const express = require("express");
const {
    stkPush,
    callBack,
    WithdrawFunds,
    handleIntasendCallback,
    handleIntasendDepositCallback,
    checkPayment,
    handlePaystackDepositCallback 
} = require("../controllers/mpesaControllers");
const router = express.Router();

router.post("/stkpush", stkPush);
router.post("/callback", callBack);
router.post("/withdraw", WithdrawFunds);
router.post("/intasend-withdrawal-callback", handleIntasendCallback)
router.post("/intasend-deposit-callback", handleIntasendDepositCallback) 
router.post("/paystack-deposit-callback", handlePaystackDepositCallback )
router.post("/confirm", checkPayment)

module.exports = router;