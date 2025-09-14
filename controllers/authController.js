const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');
const { sendOtp, hashOtp, verifyHashedOtp } = require('../services/otpService');
const jwtService = require('../services/jwtService');
const { blacklistToken, isTokenBlacklisted } = require('../services/tokenBlacklistService');
const redisClient = require('../config/redis');
const crypto = require('crypto');

const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;

exports.loginRequest = async (req, res, next) => {
    try {
        const { email, phone } = req.body;
        if (!email && !phone) {
            return res.status(400).json({ message: 'Email or phone required' });
        }

        // Find User
        const user = await User.findOne(email ? { email } : { phone });
        if (!user) {
            return res.status(404).json({ message: 'Account not found' });
        }

        // Rate limit per user (Redis)
        const rateKey = `rate:${user._id}`;
        const attempts = await redisClient.incr(rateKey);
        if (attempts === 1) await redisClient.expire(rateKey, 60);
        if (attempts > 5) {
            return res.status(429).json({ message: 'Too many login attempts, try again later.' });
        }

        // Generate and send OTP
        const method = email ? 'email' : 'phone';
        const otp = await sendOtp(email || phone, user, method); // Await for async email/SMS sending
        const otpHash = hashOtp(otp);

        // Create LoginAttempt
        const attempt = await LoginAttempt.create({
            user: user._id,
            method: email ? 'email' : 'phone',
            otpHash,
            expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000)
        });

        return res.status(200).json({
            message: 'OTP sent',
            attemptId: attempt._id,
            expiresIn: OTP_EXPIRY_MINUTES * 60
        });
    } catch (err) {
        next(err);
    }
};

exports.verifyOtp = async (req, res, next) => {
    try {
        const { attemptId, otp } = req.body;
        if (!attemptId || !otp) return res.status(400).json({ message: 'OTP and attemptId required' });

        const attempt = await LoginAttempt.findById(attemptId).populate('user');
        if (!attempt || !attempt.user) return res.status(404).json({ message: 'Login attempt not found' });

        if (attempt.used) return res.status(400).json({ message: 'OTP already used.' });
        if (Date.now() > attempt.expiresAt.getTime()) return res.status(400).json({ message: 'OTP expired.' });

        // Rate limit OTP verification per attempt
        if (attempt.attempts >= MAX_ATTEMPTS) return res.status(429).json({ message: 'Too many OTP attempts.' });

        // Verify OTP
        if (!verifyHashedOtp(otp, attempt.otpHash)) {
            attempt.attempts += 1;
            await attempt.save();
            return res.status(401).json({ message: 'Invalid OTP.' });
        }

        // Mark attempt as used
        attempt.used = true;
        await attempt.save();

        // Issue JWT
        const accessToken = jwtService.signAccessToken(attempt.user);
        const refreshToken = jwtService.signRefreshToken(attempt.user);

        // Optionally persist refresh token server-side for rotation
        // await redisClient.set(`refresh:${attempt.user._id}`, refreshToken, 'EX', jwtService.REFRESH_EXPIRY);

        // Set HttpOnly, Secure, SameSite cookies
        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: jwtService.ACCESS_EXPIRY * 1000
        });

        // Set refresh token as HttpOnly cookie
        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: jwtService.REFRESH_EXPIRY * 1000
        });

        // Only return access token in response body
        return res.status(200).json({ accessToken });
    } catch (err) {
        next(err);
    }
};

exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

        // 1. Verify JWT
        const payload = jwtService.verifyRefreshToken(refreshToken);
        if (!payload) return res.status(401).json({ message: 'Invalid refresh token' });

        // 2. Blacklist check
        if (await isTokenBlacklisted(payload.jti)) {
            return res.status(401).json({ message: 'Refresh token revoked' });
        }

        // 3. Find user and verify token in DB
        const user = await User.findById(payload.sub);
        if (!user) return res.status(401).json({ message: 'User not found' });

        // Hash the provided refresh token for comparison
        const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        const storedToken = user.refreshTokens.find(rt => rt.tokenHash === refreshTokenHash);
        if (!storedToken) return res.status(401).json({ message: 'Refresh token not recognized' });

        // 4. Token expiry check
        if (new Date() > storedToken.expiresAt) {
            return res.status(401).json({ message: 'Refresh token expired' });
        }

        // 5. Rotate: blacklist old, remove from user, issue new
        await blacklistToken(payload.jti, Math.max(0, Math.floor((storedToken.expiresAt - Date.now()) / 1000)));

        // Remove old refresh token by hash
        user.refreshTokens = user.refreshTokens.filter(rt => rt.tokenHash !== refreshTokenHash);

        // Issue new refresh token
        const newRefreshToken = jwtService.signRefreshToken(user);
        const newRefreshTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
        const newExpiresAt = new Date(Date.now() + jwtService.REFRESH_EXPIRY * 1000);

        user.refreshTokens.push({ tokenHash: newRefreshTokenHash, expiresAt: newExpiresAt });
        await user.save();

        // Issue new access token
        const accessToken = jwtService.signAccessToken(user);

        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: jwtService.ACCESS_EXPIRY * 1000
        });

        return res.status(200).json({
            accessToken,
            refreshToken: newRefreshToken
        });
    } catch (err) {
        next(err);
    }
};

exports.logoutEverywhere = async (req, res, next) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Blacklist existing refresh tokens
        for (const rt of user.refreshTokens) {
            const payload = jwtService.verifyRefreshToken(rt.token);
            if (payload) {
                await blacklistToken(payload.jti, Math.floor((rt.expiresAt - Date.now()) / 1000));
            }
        }

        user.refreshTokens = [];
        await user.save();
        res.clearCookie('access_token');
        res.json({ message: 'Logged out everywhere' });
    } catch (err) {
        next(err);
    }
};