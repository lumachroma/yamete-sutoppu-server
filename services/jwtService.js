const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set.');
}

const ACCESS_EXPIRY = 900; // 15 minutes
const REFRESH_EXPIRY = 7 * 24 * 60 * 60; // 7 days

function signAccessToken(user) {
    return jwt.sign(
        { sub: user._id, email: user.email, phone: user.phone },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_EXPIRY }
    );
}

function signRefreshToken(user) {
    return jwt.sign(
        { sub: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRY }
    );
}

module.exports = { signAccessToken, signRefreshToken, ACCESS_EXPIRY, REFRESH_EXPIRY };