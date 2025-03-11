const { validateOperation } = require("../../actions/operations");
const { createMikrotikClient } = require("../config/mikrotikClient");
const crypto = require("crypto");

const manageUser = async (req, res) => {
    const { platformID, action, package } = req.body;

    if (!platformID || !action || package) {
        return { type: "error", message: "Missing credentials are required." };
    }
    const { speed, timeLimit, deviceLimit, packageID } = package;
    let client;
    try {
        client = await createMikrotikClient(platformID);
        await client.connect();

        if (action === "add") {
            let code = generateCode()
            let finalUsername = code;
            let finalPassword = code;

            await client.write("/ip/hotspot/user/add", [
                `=name=${finalUsername}`,
                `=password=${finalPassword}`,
                `=profile=${speed}`,
                `=limit-uptime=${timeLimit}`, // Default: 1 min
                ...(deviceLimit ? [`=limit-bytes-total=${deviceLimit * 1048576}`] : [])
            ]);

            return {
                type: "success",
                message: "User added successfully",
                username: finalUsername,
                password: finalPassword,
            };

        } else if (action === "remove") {
            await client.write("/ip/hotspot/user/remove", [`=numbers=${username}`]);
            return { type: "success", message: "User removed successfully" };

        } else {
            return { type: "error", message: "Invalid action. Use 'add' or 'remove'." };
        }
    } catch (error) {
        console.error("MikroTik Error:", error);
        return { type: "error", message: error.message };
    } finally {
        if (client) {
            client.close();
        }
    }
};

const manageMikrotikUser = async (data) => {
    const { platformID, action, package } = data;
    if (!platformID || !action || package) {
        return { type: "error", message: "Missing credentials are required." };
    }
    const { speed, timeLimit, deviceLimit, packageID, adminID } = package;

    const validate = validateOperation(adminID, platformID);
    if (!validate) {
        return { type: "error", message: "Unauthorized operation." };
    }

    let client;
    try {
        client = await createMikrotikClient(platformID);
        await client.connect();

        if (action === "add") {
            let code = generateCode()
            let finalUsername = code;
            let finalPassword = code;

            await client.write("/ip/hotspot/user/add", [
                `=name=${finalUsername}`,
                `=password=${finalPassword}`,
                `=profile=${speed}`,
                `=limit-uptime=${timeLimit}`, // Default: 1 min
                ...(deviceLimit ? [`=limit-bytes-total=${deviceLimit * 1048576}`] : [])
            ]);

            return {
                type: "success",
                message: "User added successfully",
                username: finalUsername,
                password: finalPassword,
            };

        } else if (action === "remove") {
            await client.write("/ip/hotspot/user/remove", [`=numbers=${username}`]);
            return { type: "success", message: "User removed successfully" };

        } else {
            return { type: "error", message: "Invalid action. Use 'add' or 'remove'." };
        }
    } catch (error) {
        console.error("MikroTik Error:", error);
        return { type: "error", message: error.message };
    } finally {
        if (client) {
            client.close();
        }
    }
}

const getMikrotikActiveUserDetails = async (username, platformID) => {
    if (!username || !platformID) {
        return { type: "error", message: "Missing username or platformID." };
    }

    let client;
    try {
        client = await createMikrotikClient(platformID);
        await client.connect();
        const activeUserData = await client.write("/ip/hotspot/active/print", [`?name=${username}`]);

        if (!activeUserData || activeUserData.length === 0) {
            return { type: "error", message: "User not active or not found." };
        }

        const { "bytes-in": bytesIn, "bytes-out": bytesOut, uptime, "limit-uptime": limitUptime } = activeUserData[0];

        const totalUsageMB = ((parseInt(bytesIn) + parseInt(bytesOut)) / 1048576).toFixed(2);
        const uptimeFormatted = formatMikrotikTime(uptime);
        const userData = await client.write("/ip/hotspot/user/print", [`?name=${username}`]);

        let remainingTime = "Unlimited";
        if (userData.length > 0 && userData[0]["limit-uptime"]) {
            remainingTime = calculateRemainingTime(userData[0]["limit-uptime"], uptime);
        }

        return {
            type: "success",
            message: "Active user data retrieved successfully",
            username,
            usageMB: totalUsageMB,
            activeFrom: uptimeFormatted,
            timeLeft: remainingTime
        };

    } catch (error) {
        console.error("MikroTik Error:", error);
        return { type: "error", message: error.message };
    } finally {
        if (client) {
            client.close();
        }
    }
};

const formatMikrotikTime = (mikrotikTime) => {
    return mikrotikTime.replace(/d/, " days ").replace(/h/, " hours ").replace(/m/, " minutes ").replace(/s/, " seconds ");
};

const generateCode = (length = 6) => {
    return crypto.randomBytes(length).toString("hex").slice(0, length);
};

module.exports = { manageMikrotikUser, manageUser, getMikrotikActiveUserDetails };