const { SendEmail } = require("./mailerController");

const domain = "https://novawifi.online"
const emailfromaccounts = "accounts@novawifi.online";
const emailfrominfo = "info@novawifi.online";

const EmailTemplate = async (name, email, message, type, subject) => {
    const formData = {
        name: name,
        from: type === "info" ? emailfrominfo : emailfromaccounts,
        to: email,
        subject: subject,
        message: message
    };

    try {
        const data = await SendEmail(formData);
        return data;
    } catch (error) {
        return { success: false, message: error };
    }
};

module.exports = {
    EmailTemplate
}