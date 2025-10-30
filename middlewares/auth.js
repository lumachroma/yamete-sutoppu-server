const passport = require('passport');

/**
 * JWT Authentication middleware
 * Requires valid JWT token for protected routes
 */
const requireAuth = passport.authenticate('jwt', { session: false });

/**
 * Optional authentication middleware
 * Populates req.user if valid token exists, but doesn't require it
 */
const optionalAuth = (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
        if (user) {
            req.user = user;
        }
        next();
    })(req, res, next);
};

module.exports = {
    requireAuth,
    optionalAuth
};