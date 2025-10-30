/**
 * Public API routes index
 * Routes that don't require authentication
 */

const express = require('express');
const authRoutes = require('./auth');
const systemRoutes = require('./system');

const router = express.Router();

// Mount public routes
router.use('/', systemRoutes); // Health and info endpoints at root
router.use('/auth', authRoutes);

module.exports = router;