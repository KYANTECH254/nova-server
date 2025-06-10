const { sendEmail } = require("./mailerController");

const domain = "https://novawifi.online"
const emailfromaccounts = "NovaWiFi <accounts@novawifi.online>";
const emailfrominfo = "NovaWiFi <info@novawifi.online>";

const EmailTemplate = async (data) => {
    const { name, email, message, type, subject } = data;
    const formData = {
        name: name,
        from: type === "info" ? emailfrominfo : emailfromaccounts,
        to: email,
        subject: subject,
        message: message
    };

    try {
        const data = await sendEmail(formData);
        return { success: data.success, message: data.message };
    } catch (error) {
        return { success: false, message: error };
    }
};

module.exports = {
    EmailTemplate
}