const express = require('express');
const { getUserIdentity } = require('../../controllers/userIdentityController');
const { requireAuth } = require('../../middlewares/auth');
const router = express.Router();

// All routes in this file require authentication
router.use(requireAuth);

// Get user identity and token validity from access token
router.get('/identity', getUserIdentity);

// Example protected route
router.get('/dashboard', (req, res) => {
    res.json({ message: `Welcome, ${req.user.email || req.user.phone}!` });
});

module.exports = router;