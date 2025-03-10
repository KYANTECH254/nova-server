const { getPackages } = require("../actions/operations");

const Packages = async (req, res) => {
    const { platformID } = req.body;
    if (!platformID) {
        return res.status(400).json({ type: "error", message: "Platform ID is required." });
    }
    try {
        const packages = await getPackages(platformID);
        res.status(200).json({ type: "success", packages });
    } catch (error) {
        console.error("Error getting packages:", error);
        res.status(500).json({ type: "error", message: "Internal server error." });
    }
}

module.exports = { Packages };