const nodemailer = require("node-mailer");

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.MAILER_USERNAME,
        pass: process.env.MAILER_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false
    },
});

module.exports = transporter;