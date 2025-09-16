const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User = require('../models/User');

module.exports = (passport) => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 16) {
        throw new Error('JWT_SECRET environment variable must be set and at least 16 characters long for security.');
    }
    passport.use(new JwtStrategy({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: jwtSecret,
    }, async (payload, done) => {
        try {
            if (!payload || !payload.sub) {
                return done(null, false);
            }
            const user = await User.findById(payload.sub);
            if (!user) return done(null, false);
            // console.log('JWT payload verified:', payload);
            // console.log('Authenticated user:', user);
            // Attach iat and exp from payload to user object for identity endpoint
            user.iat = payload.iat;
            user.exp = payload.exp;
            return done(null, user);
        } catch (err) {
            return done(err, false);
        }
    }));
};
