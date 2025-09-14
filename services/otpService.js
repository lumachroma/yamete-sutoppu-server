const crypto = require('crypto');

// Generate random OTP
function generateOtp() {
    return crypto.randomInt(100000, 1000000).toString();
}

// Send OTP (stub: integrate email/SMS providers)
function sendOtp(address, user) {
    const otp = generateOtp();
    // Send via SMS or Email (implement SendGrid/Twilio/etc here)
    console.log(`Send OTP ${otp} to ${address}`);
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