const express = require("express");
const { stkPush, callBack } = require("../controllers/mpesaControllers");

const router = express.Router();

router.post("/stkpush", stkPush);
router.post("/callback", callBack);

module.exports = router;