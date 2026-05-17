const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "mailhog",
  port: process.env.SMTP_PORT || 1025,
  secure: false
});

module.exports = transporter;
