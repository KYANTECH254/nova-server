const cron = require("node-cron");
const { createSingleMikrotikClient } = require("../config/mikrotikClient");
const { getPlatforms, getActivePlatformUsers, getStations, updateUser } = require("../../actions/operations");

const checkAndExpireUsers = async () => {
    try {
        const now = new Date();
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

                const expireAt = new Date(user.expireAt);
                if (expireAt <= now) {
                    await updateUser(user.id, { status: "expired" });

                    try {
                        const mikrotikUser = await channel.menu('/ip/hotspot/user/print')
                            .where('name', username)
                            .get();

                        if (mikrotikUser.length > 0) {
                            const userId = mikrotikUser[0]['.id'] || mikrotikUser[0].id;
                            await channel.menu('/ip/hotspot/user/remove').remove({ id: userId });
                            console.log(`User ${userId} '${username}' removed from MikroTik (platform: ${platformID})`);
                        } else {
                            console.log(`User '${username}' not found on MikroTik, no need to remove.`);
                        }
                    } catch (err) {
                        console.error(`Failed to remove user '${username}' from MikroTik (platform: ${platformID}):`, err);
                    }
                }
            }
        }
    } catch (err) {
        console.error('Failed to check and expire users:', err);
    }
};

const disablePPPoEServer = async (stationId, interfaceName) => {
    const station = await prisma.station.findUnique({
        where: { id: stationId },
        select: {
            platformID: true,
            mikrotikHost: true,
        }
    });

    if (!station) {
        console.error(`Station ${stationId} not found`);
        return;
    }

    let connection;
    try {
        connection = await createSingleMikrotikClient(
            station.platformID,
            station.mikrotikHost,
        );

        const servers = await connection.channel.menu('/ppp/pppoe-server/print').get();
        const server = servers.find(s => s.interface === interfaceName);

        if (server) {
            await connection.channel.menu('/ppp/pppoe-server/set')
                .where('.id', server['.id'])
                .update({ disabled: 'yes' });
        }
    } catch (error) {
        console.error(`Error disabling PPPoE server on ${station.mikrotikHost}:`, error);
    } finally {
        if (connection) connection.close();
    }
};

// Main expiration check function
const checkPPPoEExpirations = async () => {
    try {
        const now = new Date();
        const activeServices = await prisma.pppoe.findMany({
            where: { status: 'active' }
        });

        for (const service of activeServices) {
            try {
                const periodMs = parsePeriod(service.period);
                const createdAt = new Date(service.createdAt);
                const expirationTime = new Date(createdAt.getTime() + periodMs);

                if (now > expirationTime) {
                    // Update database status
                    await prisma.pppoe.update({
                        where: { id: service.id },
                        data: { status: 'inactive' }
                    });

                    // Disable MikroTik PPPoE server
                    await disablePPPoEServer(service.station, service.interface);

                    console.log(`Disabled PPPoE service ${service.id}`);
                }
            } catch (error) {
                console.error(`Error processing service ${service.id}:`, error);
            }
        }
    } catch (error) {
        console.error('PPPoE expiration check failed:', error);
    }
};

const parsePeriod = (period) => {
    const [value, unit] = period.split(' ');
    const numericValue = parseInt(value);

    switch (unit.toLowerCase()) {
        case 'minutes':
        case 'minute':
            return numericValue * 60 * 1000;
        case 'hours':
        case 'hour':
            return numericValue * 60 * 60 * 1000;
        case 'days':
        case 'day':
            return numericValue * 24 * 60 * 60 * 1000;
        default:
            throw new Error(`Unknown period unit: ${unit}`);
    }
};


// Schedule the function to run every 1 minutes
cron.schedule("*/1 * * * *", () => {
    console.log("Running scheduled MikroTik user expire check...");
    checkAndExpireUsers();
    checkPPPoEExpirations();
});

module.exports = checkAndExpireUsers;
