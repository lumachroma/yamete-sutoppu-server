const express = require('express');
const passport = require('passport');
const { getUserIdentity } = require('../controllers/userIdentityController');
const router = express.Router();

// Get user identity and token validity from access token
router.get('/identity', passport.authenticate('jwt', { session: false }), getUserIdentity);

// Example protected route
router.get('/dashboard', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json({ message: `Welcome, ${req.user.email || req.user.phone}!` });
});

module.exports = router;