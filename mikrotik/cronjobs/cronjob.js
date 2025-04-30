const cron = require("node-cron");
const { createSingleMikrotikClient } = require("../config/mikrotikClient");
const { getPlatforms, getActivePlatformUsers, getStations, updateUser } = require("../../actions/operations");

const checkAndExpireUsers = async () => {
    try {
        const platforms = await getPlatforms();
        for (const platform of platforms) {
            const platformID = platform.platformID;
            const routers = await getStations(platformID);
            const router = routers[0];

            if (!router || !router.mikrotikHost) {
                console.warn(`No router found for platform '${platformID}'`);
                continue;
            }

            const host = router.mikrotikHost;
            const users = await getActivePlatformUsers(platformID);
            const connection = await createSingleMikrotikClient(platformID, host);

            if (!connection?.channel) {
                console.warn(`No connection for platform '${platformID}'`);
                continue;
            }

            const { channel } = connection;

            for (const user of users) {
                const username = user.username;
                if (!username) {
                    console.warn(`User without username found in platform '${platformID}'`);
                    continue;
                }

                const updateuser = await updateUser(user.id, { status: "expired" })

                try {
                    // Fetch the MikroTik user by username to get their ID
                    const mikrotikUser = await channel.menu('/ip/hotspot/user/print')
                        .where('name', username)
                        .get();

                    if (mikrotikUser.length > 0) {
                        const userId = mikrotikUser[0]['.id'] || mikrotikUser[0].id;
                        await channel.menu('/ip/hotspot/user/remove').remove({
                            id: userId
                        });
                        console.log(`User ${userId} '${username}' removed from MikroTik (platform: ${platformID})`);
                    } else {
                        console.log(`User '${username}' not found on MikroTik, no need to remove.`);
                    }
                } catch (err) {
                    console.error(`Failed to process user '${username}' for platform '${platformID}':`, err);
                }
            }
        }
    } catch (err) {
        console.error('Failed to check and expire users:', err);
    }
};

// Schedule the function to run every 1 minutes
cron.schedule("*/1 * * * *", () => {
    console.log("Running scheduled MikroTik user expire check...");
    checkAndExpireUsers();
});

module.exports = checkAndExpireUsers;
