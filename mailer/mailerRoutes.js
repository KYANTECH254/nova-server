const router = require("express").Router();

const { sendMail } = require("./mailerController");

router.post("/send", sendMail)

module.exports = router;