const router = require("express").Router();
const { Packages } = require("../controllers/controller");

router.post("/packages", Packages);

module.exports = router;