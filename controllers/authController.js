const { getAdminByToken } = require("../actions/operations")

const AuthenticateRequest = async (token) => {
    if (!token) return {
        success: false,
        message: "Missing token!"
    }

    const admin = await getAdminByToken(token);
    if (!admin) return {
        success: false,
        message: "Invalid token provided"
    }
    return {
        success: true,
        message: "Authenticated succesfully",
        admin: admin
    }

}


module.exports = { AuthenticateRequest };