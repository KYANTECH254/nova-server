const mikrotikClient = require("../config/mikrotikClient");

exports.manageUser = async (req, res) => {
    const { action, username, password } = req.body;

    if (!action || !username) {
        return res.status(400).json({ error: "Action and username are required." });
    }

    try {
        await mikrotikClient.connect();
        let result;

        if (action === "add") {
            result = await mikrotikClient.write("/ip/hotspot/user/add", {
                name: username,
                password: password || "",
                profile: "default",
            });
        } else if (action === "remove") {
            result = await mikrotikClient.write("/ip/hotspot/user/remove", { numbers: username });
        } else {
            return res.status(400).json({ error: "Invalid action. Use 'add' or 'remove'." });
        }

        await mikrotikClient.close();
        res.status(200).json({ success: true, result });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
