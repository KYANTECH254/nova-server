const cron = require("node-cron");
const { createSingleMikrotikClient } = require("../config/mikrotikClient");
const { getPlatforms, getActivePlatformUsers, getStations, updateUser } = require("../../actions/operations");

const checkAndExpireUsers = async () => {
    try {
        const platforms = await getPlatforms();
        console.log("Platforms:", platforms);

        for (const platform of platforms) {
            const platformID = platform.platformID;
            console.log("Platform ID:", platformID);

            const routers = await getStations(platformID);
            console.log("Routers:", routers);

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

                try {
                    if (!user.expireAt) {
                        console.log(`User '${username}' has no expireAt set, skipping.`);
                        continue;
                    }

                    const now = new Date();
                    const expireAt = new Date(user.expireAt);

                    if (now >= expireAt && user.status !== 'expired') {
                        // Remove user from MikroTik
                        const mikrotikUser = await channel.menu('/ip/hotspot/user/print')
                            .where('name', username)
                            .get();
console.log(mikrotikUser);

                        if (mikrotikUser.length > 0) {
                            const userId = mikrotikUser[0].id;
console.log(userId);

                            await channel.menu('/ip/hotspot/user/remove')
                                .where('id', userId)
                                .exec();

                            console.log(`User '${username}' removed from MikroTik (platform: ${platformID})`);
                        } else {
                            console.log(`User '${username}' not found on MikroTik, no need to remove.`);
                        }

                        // Update user status in DB
                        await updateUser(user.id, { status: 'expired' });
                        console.log(`User '${username}' marked as expired in database (platform: ${platformID})`);
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
// cron.schedule("*/1 * * * *", () => {
//     console.log("Running scheduled MikroTik user expire check...");
//     checkAndExpireUsers();
// });
checkAndExpireUsers();
module.exports = checkAndExpireUsers;
