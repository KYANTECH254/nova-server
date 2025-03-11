const router = require("express").Router();
const { Packages, getCode } = require("../controllers/controller");

router.post("/packages", Packages);
router.post("/code", getCode)

module.exports = router;