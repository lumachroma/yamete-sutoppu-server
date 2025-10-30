/**
 * Private API routes index
 * Routes that require authentication
 */

const express = require('express');
const identityRoutes = require('./identity');
const userRoutes = require('./users');

const router = express.Router();

// Mount private routes
router.use('/identity', identityRoutes);
router.use('/users', userRoutes);

module.exports = router;