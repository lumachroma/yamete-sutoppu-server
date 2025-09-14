const express = require('express');
const passport = require('passport');
const router = express.Router();

// Example protected route
router.get('/dashboard', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.json({ message: `Welcome, ${req.user.email || req.user.phone}!` });
});

module.exports = router;