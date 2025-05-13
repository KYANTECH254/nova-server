const express = require("express");
const { 
    fetchAddressPoolsFromConnections, 
    fetchStations,
    fetchMikrotikProfiles,
    updateAddressPool,
    deleteAddressPool,
    fetchInterfaces,
    fetchPPPprofile
} = require("../contollers/mikrotikController");

const router = express.Router();

router.post("/pools", fetchAddressPoolsFromConnections);
router.post("/stations", fetchStations);
router.post("/hotspot-profiles", fetchMikrotikProfiles);
router.post("/updatePool", updateAddressPool)
router.post("/deletePool", deleteAddressPool)
router.post("/interfaces", fetchInterfaces)
router.post("/ppp-profiles", fetchPPPprofile)

module.exports = router;
