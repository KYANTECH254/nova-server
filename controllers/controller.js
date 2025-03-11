const { getPackages, getCodesByPhone, getCodesByMpesa } = require("../actions/operations");
const { formatPhoneNumber } = require("../mpesa/controllers/mpesaControllers");
const { getMikrotikActiveUserDetails } = require("../mikrotik/contollers/mikrotikController")

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

const getCode = async (req, res) => {
    const { phone, code } = req.body;
    let fphone;
    let foundcodes;

    try {
        if (phone) {
            if (!/^(07|01)\d{8}$/.test(phone)) {
                return res.status(400).json({ type: "error", message: "Invalid phone number." });
            }
            fphone = formatPhoneNumber(phone);
            foundcodes = await getCodesByPhone(fphone);
        }

        if (code) {
            foundcodes = await getCodesByMpesa(code);
        }

        if (!foundcodes || foundcodes.length === 0) {
            return res.status(404).json({ type: "error", message: "No codes found." });
        }

        const updatedCodes = await Promise.all(
            foundcodes.map(async (codeData) => {
                const { username, platformID, status } = codeData;
                if (!username || !platformID) return codeData;
                const mikrotikData = await getMikrotikActiveUserDetails(username, platformID);

                if (mikrotikData.type === "success") {
                    return {
                        ...codeData,
                        activeFrom: mikrotikData.activeFrom,
                        timeLeft: mikrotikData.timeLeft
                    };
                } else {
                    if (status !== "expired") {
                        await updateUser(username, { status: "expired" });
                    }
                }

                return { ...codeData, status: "expired" };
            })
        );
        return res.status(200).json({ type: "success", foundcodes: updatedCodes });

    } catch (error) {
        console.error("Error getting codes:", error);
        res.status(500).json({ type: "error", message: "Internal server error." });
    }
};


module.exports = { Packages, getCode };