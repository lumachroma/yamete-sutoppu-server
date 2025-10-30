const express = require('express');
const { loginRequest, verifyOtp, refreshToken, logoutEverywhere } = require('../../controllers/authController');
const router = express.Router();

// Public authentication routes - no JWT required
router.post('/login', loginRequest); // Step 1/2: User enters email/phone
router.post('/verify-otp', verifyOtp); // Step 3/4: User submits OTP
router.post('/refresh-token', refreshToken); // Step 5: User requests new access token
router.post('/logout-everywhere', logoutEverywhere); // Step 6: User logs out from all devices

module.exports = router;