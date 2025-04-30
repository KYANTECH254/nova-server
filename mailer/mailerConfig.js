const nodemailer = require("node-mailer");

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
        user: "88848c001@smtp-brevo.com",
        pass: "nvOWSAJ4VLTXa96s",
    },
    tls: {
        rejectUnauthorized: false
    },
});

module.exports = transporter;