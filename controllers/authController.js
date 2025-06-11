const { getAdminByToken, getSuperUserByToken } = require("../actions/operations")

const AuthenticateRequest = async (token) => {
    if (!token) {
        return {
            success: false,
            message: "Missing token!",
        };
    }

    const admin = await getAdminByToken(token);
    const superuser = await getSuperUserByToken(token);

    if (!admin && !superuser) {
        return {
            success: false,
            message: "Invalid token provided",
        };
    }

    return {
        success: true,
        message: "Authenticated successfully",
        admin: admin || null,
        superuser: superuser || null,
    };
};

module.exports = { AuthenticateRequest };