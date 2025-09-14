const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: process.env.SMTP_PROVIDER, // Yahoo (https://nodemailer.com/smtp/well-known-services/)
  auth: {
    user: process.env.SMTP_USER, // Yahoo Email (normal username)
    pass: process.env.SMTP_PASS, // Yahoo App password (from account security settings)
  },
});

// Send OTP Email
async function sendOtpEmail(to, otp) {
    const appName = process.env.APP_NAME;
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject: `[${appName}] Your One-Time Password (OTP)`,
        text: `Greetings from ${appName}! Your OTP code is: ${otp}`,
        html: `<p>Greetings from <em>${appName}!</em></p><p>Your OTP code is: <strong>${otp}</strong></p>`,
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        throw new Error(`Failed to send OTP email to ${to}: ${error.message}`);
    }
}

module.exports = { sendOtpEmail };