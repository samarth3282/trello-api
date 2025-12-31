const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Verify connection configuration (optional - only if credentials are provided)
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && process.env.EMAIL_USER !== 'your_email@gmail.com') {
    transporter.verify((error, success) => {
        if (error) {
            logger.warn(`Email configuration issue (emails will not be sent): ${error.message}`);
        } else {
            logger.info('Email server is ready to send messages');
        }
    });
} else {
    logger.info('Email not configured - email notifications disabled');
}

module.exports = transporter;
