// Controller for protected user identity API using passport authentication
exports.getUserIdentity = (req, res) => {
    // Passport populates req.user if JWT is valid
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized: No user found in request' });
    }
    // console.log('Authenticated user:', req.user);
    // Extract user info from req.user and JWT payload
    const { _id, email, phone, iat, exp } = req.user;
    return res.status(200).json({
        sub: _id,
        email,
        phone,
        iat,
        exp
    });
};
