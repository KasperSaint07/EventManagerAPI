const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async ({ to, subject, text, html }) => {
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || 'EventManager <noreply@eventmanager.com>',
    to, subject, text, html
  });
  console.log(`Email sent: ${info.messageId}`);
  return info;
};

module.exports = sendEmail;
