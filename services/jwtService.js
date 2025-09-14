const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 16) {
    throw new Error('JWT_SECRET environment variable must be set and at least 16 characters long for security.');
}

const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
if (!jwtRefreshSecret || jwtRefreshSecret.length < 16) {
    throw new Error('JWT_REFRESH_SECRET environment variable must be set and at least 16 characters long for security.');
}

const ACCESS_EXPIRY = 15 * 60; // 15 minutes
const REFRESH_EXPIRY = 7 * 24 * 60 * 60; // 7 days

function signAccessToken(user) {
    return jwt.sign(
        { sub: user._id, email: user.email, phone: user.phone },
        jwtSecret,
        { expiresIn: ACCESS_EXPIRY }
    );
}

function signRefreshToken(user) {
    // Use random string for token id (jti) for rotation/blacklist
    const jti = crypto.randomBytes(32).toString('hex');
    return jwt.sign(
        { sub: user._id, jti },
        jwtRefreshSecret,
        { expiresIn: REFRESH_EXPIRY }
    );
}

function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, jwtRefreshSecret);
    } catch (err) {
        console.error('JWT verification error:', err);

        if (err.name === 'TokenExpiredError') {
            return { error: 'TokenExpiredError', message: 'Refresh token has expired.' };
        } else if (err.name === 'JsonWebTokenError') {
            return { error: 'JsonWebTokenError', message: 'Invalid refresh token.' };
        } else if (err.name === 'NotBeforeError') {
            return { error: 'NotBeforeError', message: 'Refresh token not active yet.' };
        }

        return { error: 'UnknownError', message: 'An unknown error occurred during token verification.' };
    }
}

module.exports = { signAccessToken, signRefreshToken, verifyRefreshToken, ACCESS_EXPIRY, REFRESH_EXPIRY };