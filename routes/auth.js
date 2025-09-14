const express = require('express');
const { loginRequest, verifyOtp } = require('../controllers/authController');
const router = express.Router();

router.post('/login', loginRequest); // Step 1/2: User enters email/phone
router.post('/verify-otp', verifyOtp); // Step 3/4: User submits OTP

module.exports = router;