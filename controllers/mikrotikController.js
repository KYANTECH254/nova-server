const { getPackagesByID, getStations, createUser } = require("../actions/operations");
const { manageMikrotikUser } = require("../mikrotik/contollers/mikrotikController")

const addManualCode = async (data) => {
    if (!data) {
        return {
            success: false,
            message: "Missing credentials required!",
        }
    }
    if (!data) {
        return {
            success: false,
            message: "Missing credentials required!",
        };
    }

    const { phone, packageID, platformID, package, code } = data;

    try {
        const pkg = await getPackagesByID(packageID);
        if (!pkg) {
            return {
                success: false,
                message: "Failed to add user to MikroTik, Package not found!",
            };
        }
        const profileName = pkg.name;
        const hostdata = await getStations(platformID);
        if (!hostdata) {
            return {
                success: false,
                message: "Failed to add user to MikroTik, Router not found!",
            };
        }
        const host = hostdata[0].mikrotikHost;
        const mikrotikData = {
            platformID,
            action: "add",
            profileName,
            host
        };
        const addUserToMikrotik = await manageMikrotikUser(mikrotikData)
        if (!addUserToMikrotik) {
            return {
                success: false,
                message: "Failed to add user to MikroTik",
            };
        }

        if (addUserToMikrotik.success) {
            let expireAt = null;
            if (pkg?.period) {
                const now = new Date();
                const period = pkg.period.toLowerCase();

                const match = period.match(/^(\d+)\s+(hour|minute|day|month|year)s?$/i);

                if (match) {
                    const value = parseInt(match[1]);
                    const unit = match[2].toLowerCase();

                    switch (unit) {
                        case 'minute':
                            expireAt = new Date(now.getTime() + value * 60000);
                            break;
                        case 'hour':
                            expireAt = new Date(now.getTime() + value * 3600000);
                            break;
                        case 'day':
                            expireAt = new Date(now.getTime() + value * 86400000);
                            break;
                        case 'month':
                            expireAt = new Date(now.setMonth(now.getMonth() + value));
                            break;
                        case 'year':
                            expireAt = new Date(now.setFullYear(now.getFullYear() + value));
                            break;
                    }
                }
            }

            const addedcode = await createUser({
                status: "active",
                code: code,
                platformID: platformID,
                phone: phone,
                username: addUserToMikrotik.username,
                password: addUserToMikrotik.password,
                expireAt: expireAt
            });

            return {
                success: true,
                message: "Code added successfully",
                code: addedcode,
            };
        } else {
            return {
                success: false,
                message: `Failed to add user to MikroTik, ${addUserToMikrotik.message}`,
            };
        }

    } catch (error) {
        console.log("An error occurred", error);
        return {
            success: false,
            message: "An error occurred while adding the user",
        };
    }
};

module.exports = { addManualCode };