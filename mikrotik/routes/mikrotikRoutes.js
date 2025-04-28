const express = require("express");
const { 
    fetchAddressPoolsFromConnections, 
    fetchStations,
    fetchMikrotikProfiles
} = require("../contollers/mikrotikController");

const router = express.Router();

router.post("/pools", fetchAddressPoolsFromConnections);
router.post("/stations", fetchStations);
router.post("/hotspot-profiles", fetchMikrotikProfiles);

module.exports = router;
