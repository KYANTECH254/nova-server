const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    connectionTimeout: 10000,
    auth: {
        user: process.env.MAILER_USERNAME,
        pass: process.env.MAILER_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false
    },
    logger: false,          
    debug: false
});

module.exports = transporter;