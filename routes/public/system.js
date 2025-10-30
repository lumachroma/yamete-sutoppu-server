const express = require('express');
const router = express.Router();

// Health check endpoint - no authentication required
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API info endpoint
router.get('/info', (req, res) => {
    res.json({
        name: 'Yamete Sutoppu API',
        version: '1.0.0',
        description: 'Authentication and User Management API',
        endpoints: {
            public: [
                'GET /api/public/health',
                'GET /api/public/info', 
                'POST /api/public/auth/login',
                'POST /api/public/auth/verify-otp',
                'POST /api/public/auth/refresh-token',
                'POST /api/public/auth/logout-everywhere'
            ],
            private: [
                'GET /api/private/identity/identity',
                'GET /api/private/identity/dashboard',
                'GET /api/private/users',
                'GET /api/private/users/:id',
                'POST /api/private/users',
                'PUT /api/private/users/:id',
                'DELETE /api/private/users/:id'
            ]
        }
    });
});

module.exports = router;