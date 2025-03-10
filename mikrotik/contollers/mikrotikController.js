const mikrotikClient = require("../config/mikrotikClient");
const crypto = require("crypto");

exports.manageUser = async (req, res) => {
    const { action, username, password, speed, timeLimit, deviceLimit, useCode } = req.body;

    if (!action || (!username && !useCode)) {
        return res.status(400).json({ error: "Action and username or code are required." });
    }

    try {
        await mikrotikClient.connect();
        let result;

        if (action === "add") {
            // Generate a random code if using code-based login
            let finalUsername = useCode ? generateCode() : username;
            let finalPassword = password || generateCode(8); // Random 8-char password if not provided

            result = await mikrotikClient.write("/ip/hotspot/user/add", {
                name: finalUsername,
                password: finalPassword,
                profile: speed || "default",
                limitUptime: timeLimit || "00:30:00", // Default: 30 mins
                limitBytesTotal: deviceLimit ? deviceLimit * 1048576 : undefined, // Convert MB to Bytes
            });

            res.status(200).json({
                success: true,
                message: "User added successfully",
                username: finalUsername,
                password: finalPassword,
            });

        } else if (action === "remove") {
            result = await mikrotikClient.write("/ip/hotspot/user/remove", { numbers: username });
            res.status(200).json({ success: true, message: "User removed successfully" });

        } else {
            return res.status(400).json({ error: "Invalid action. Use 'add' or 'remove'." });
        }

        await mikrotikClient.close();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Function to generate random codes for login
const generateCode = (length = 6) => {
    return crypto.randomBytes(length).toString("hex").slice(0, length);
};
