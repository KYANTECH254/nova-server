const transporter = require("./mailerConfig");

const sendEmail = async (data) => {
    const { from, to, subject, message, name } = data;
    if (!from || !to || !subject || !message) {
        return {
            success: false,
            message: "Missing required credentials!"
        }
    }
    const emailHtml = `
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #4CAF50;">Hello ${name || "User"},</h2>
                <p>${message}</p>
                <p>Best regards,</p>
                <p><strong>Nova WiFi</strong></p>
            </body>
        </html>
    `;
    try {
        const sendmail = await transporter.sendMail({
            from: from,
            to: to,
            subject: subject,
            html: emailHtml,
        });

        return {
            success: true,
            message: "Email sent successfully!",
        };

    } catch (error) {
        console.error("Error sending email:", error);
        return {
            success: false,
            message: `Failed to send email. Please try again later. ${error}`,
        };
    }
}

const sendMail = async (res, req) => {
    const { from, to, subject, message, name } = req.body;
    if (!from || !to || !subject || !message) {
        return res.json({
            success: false,
            message: "Missing required credentials!"
        })
    }
    const emailHtml = `
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h3 style="color: #4CAF50;">Hello ${name || "User"},</h3>
                <p>${message}</p>
                <p>Best regards,</p>
                <p><strong>Nova WiFi</strong></p>
            </body>
        </html>
    `;
    try {
        const sendmail = await transporter.sendMail({
            from: from,
            to: to,
            subject: subject,
            html: emailHtml,
        });

        return res.json({
            success: true,
            message: "Email sent successfully!",
        });

    } catch (error) {
        console.error("Error sending email:", error);
        return res.json({
            success: false,
            message: "Failed to send email. Please try again later.",
        });
    }
}

module.exports = {
    sendEmail,
    sendMail
}