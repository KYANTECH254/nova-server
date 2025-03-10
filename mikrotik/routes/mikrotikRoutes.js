const express = require("express");
const { manageUser } = require("../contollers/mikrotikController");

const router = express.Router();

router.post("/manage", manageUser);

module.exports = router;
