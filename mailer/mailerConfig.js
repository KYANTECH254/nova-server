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
    logger: true,          
    debug: true
});

module.exports = transporter;