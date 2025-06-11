const router = require("express").Router();
const {
  Packages,
  getCode,
  addPlatform,
  deletePlatformID,
  fetchPlatforms,
  LoginAdmin,
  fetchPayments,
  fetchModerators,
  fetchSettings,
  addSettings,
  deleteCodes,
  updatePackages,
  addPackages,
  deletePackages,
  updateSettings,
  updateCodes,
  updateModerators,
  deleteModerators,
  authAdmin,
  fetchCodes,
  fetchPackages,
  addModerators,
  deletePayment,
  updateName,
  fetchStations,
  updateStations,
  deleteStations,
  addCode,
  getCodes,
  fetchDashboardStats,
  LoginManager,
  authManager,
  fetchSuperDashboardStats,
  fetchAllStations,
  registerPlatform,
  UpdateDDNSViaScript,
  fetchDDNS,
  updateDDNSR,
  deteteDDNSR,
  removeUser,
  updatePPPoE,
  fetchMyPPPoe,
  fetchTemplates,
  updateTemplate,
  verifyCodes,
  ResetPassword,
  UpdatePassword,
  UpdateProfile,
  fetchAllTemplates,
  addTemplates,
  updateTemplates,
  removeTemplates,
  updateMyPassword
  , } = require("../controllers/controller");

// POST
router.post("/packages", Packages);
router.post("/authAdmin", authAdmin);
router.post("/authManager", authManager);
router.post("/code", getCode);
router.post("/addPlatform", addPlatform);
router.post("/deletePlatform", deletePlatformID);
router.post("/loginAdmin", LoginAdmin);
router.post("/loginManager", LoginManager);
router.post("/fetchPayments", fetchPayments);
router.post("/fetchModerators", fetchModerators);
router.post("/addModerator", addModerators);
router.post("/fetchSettings", fetchSettings);
router.post("/addSettings", addSettings);
router.post("/deleteCode", deleteCodes);
router.post("/updatePackage", updatePackages);
router.post("/addPackage", addPackages);
router.post("/deletePackage", deletePackages);
router.post("/updateSettings", updateSettings);
router.post("/updateCode", updateCodes);
router.post("/updateModerator", updateModerators);
router.post("/deleteModerator", deleteModerators);
router.post("/fetchCodes", fetchCodes);
router.post("/deletePayment", deletePayment);
router.post("/updateName", updateName);
router.post("/fetchPackages", fetchPackages);
router.post("/fetchStations", fetchStations);
router.post("/updateStation", updateStations);
router.post("/deleteStation", deleteStations);
router.post("/addCode", addCode);
router.post("/getCodes", getCodes);
router.post("/stats", fetchDashboardStats);
router.post("/createAccount", registerPlatform);
router.post("/updateddns", UpdateDDNSViaScript);
router.post("/fetchddns", fetchDDNS)
router.post("/updatemyddns", updateDDNSR);
router.post("/deletemyddns", deteteDDNSR)
router.post("/deleteUser", removeUser)
router.post("/updatepppoe", updatePPPoE)
router.post("/pppoe", fetchMyPPPoe)
router.post("/templates", fetchTemplates)
router.post("/updateTemplate", updateTemplate)
router.post("/verifyCode", verifyCodes)
router.post("/resetPassword", ResetPassword)
router.post("/updatePassword", UpdatePassword)
router.post("/updateProfile", UpdateProfile)
router.post("/fetchAllTemplates", fetchAllTemplates)
router.post("/addTemplate", addTemplates)
router.post("/editTemplate", updateTemplates)
router.post("/deleteTemplate", removeTemplates)
router.post("/updateMyPassword", updateMyPassword)

// GET
router.get("/fetchPlatforms", fetchPlatforms);
router.get("/dashstats", fetchSuperDashboardStats);
router.get("/stations", fetchAllStations)

module.exports = router;
