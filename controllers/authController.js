const User = require('../models/User');
const LoginAttempt = require('../models/LoginAttempt');
const { sendOtp, hashOtp, verifyHashedOtp } = require('../services/otpService');
const jwtService = require('../services/jwtService');
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

        // Generate OTP
        const otp = sendOtp(email || phone, user); // Service handles SMS/Email
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