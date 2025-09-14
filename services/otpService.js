const crypto = require('crypto');
const { sendOtpEmail } = require('./emailService');

// Generate random OTP
function generateOtp() {
    return crypto.randomInt(100000, 1000000).toString();
}

// Send OTP (email)
async function sendOtp(address, user, method) {
    const otp = generateOtp();

    console.log(`Send OTP ${otp} to ${address}`);
    if (method === 'email') {
        await sendOtpEmail(address, otp);
    }
    // Add SMS sending here if needed
    return otp;
}

// Hash OTP securely with salt using scrypt
function hashOtp(otp) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hashed = crypto.scryptSync(otp, salt, 64).toString('hex');
    return `${salt}:${hashed}`;
}

// Verify OTP hash with salt
function verifyHashedOtp(otp, storedHash) {
    const [salt, hashed] = storedHash.split(':');
    const otpHashed = crypto.scryptSync(otp, salt, 64).toString('hex');
    return otpHashed === hashed;
}

module.exports = { sendOtp, hashOtp, verifyHashedOtp };