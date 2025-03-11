const cron = require("node-cron");
const { createMikrotikClient } = require("../config/mikrotikClient");
const { getPlatforms, getActivePlatformUsers } = require("../../actions/operations");

const checkAndUpdateAllUserSessions = async () => {
    console.log("Checking MikroTik user sessions per platform...");

    try {
        // Fetch all platforms (MikroTik routers)
        const platforms = await getPlatforms();

        if (platforms.length === 0) {
            console.log("No platforms found.");
            return;
        }

        for (const platform of platforms) {
            console.log(`Checking users on platform ID: ${platform.platformID}`);

            let client;
            try {
                // Connect to MikroTik router for this platform
                client = await createMikrotikClient(platform.platformID);
                await client.connect();
                const users = await getActivePlatformUsers(platformID);

                if (users.length === 0) {
                    console.log(`No active users found on platform ${platform.platformID}.`);
                    continue;
                }
                // Get active sessions from MikroTik
                const sessions = await client.write("/ip/hotspot/active/print", []);
                for (const user of users) {
                    const isUserOnline = sessions.some(session => session.name === user.username);

                    if (!isUserOnline) {
                        console.log(`User ${user.username} session expired. Updating status...`);
                        const upddata = {
                            status: "active",
                        }
                        await updateUser(user.id, upddata);
                    }
                }

            } catch (error) {
                console.error(`Error checking users for platform ${platform.platformID}:`, error);
            } finally {
                if (client) client.close();
            }
        }

        console.log("MikroTik session check completed for all platforms.");

    } catch (error) {
        console.error("Error checking/updating user sessions:", error);
    }
};

// Schedule the function to run every 5 minutes
cron.schedule("*/5 * * * *", () => {
    console.log("Running scheduled MikroTik user session check...");
    checkAndUpdateAllUserSessions();
});

module.exports = checkAndUpdateAllUserSessions;
