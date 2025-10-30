/**
 * Main API routes index
 * Organizes public and private routes
 */

const express = require('express');
const publicRoutes = require('./public');
const privateRoutes = require('./private');

const router = express.Router();

// Mount public routes (no authentication required)
router.use('/public', publicRoutes);

// Mount private routes (authentication required)
router.use('/private', privateRoutes);

// // Legacy route mappings for backward compatibility
// // TODO: Remove these once frontend is updated to use new structure
// const authRoutes = require('./public/auth');
// const identityRoutes = require('./private/identity');
// const userRoutes = require('./private/users');

// router.use('/auth', authRoutes);
// router.use('/protected', identityRoutes);
// router.use('/users', userRoutes);

module.exports = router;