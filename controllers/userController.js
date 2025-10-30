const User = require('../models/User');

// Get all users
exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find({}, '-refreshTokens')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await User.countDocuments();

        res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id, '-refreshTokens');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Create new user
exports.createUser = async (req, res) => {
    try {
        const { email, phone } = req.body;

        // Validate input
        if (!email && !phone) {
            return res.status(400).json({ message: 'Either email or phone is required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                ...(email ? [{ email }] : []),
                ...(phone ? [{ phone }] : [])
            ]
        });

        if (existingUser) {
            return res.status(409).json({ message: 'User with this email or phone already exists' });
        }

        const user = new User({ email, phone });
        await user.save();

        // Return user without refresh tokens
        const userResponse = user.toObject();
        delete userResponse.refreshTokens;

        res.status(201).json(userResponse);
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'User with this email or phone already exists' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, phone } = req.body;

        // Validate input
        if (!email && !phone) {
            return res.status(400).json({ message: 'Either email or phone is required' });
        }

        // Check if another user already has this email/phone
        const existingUser = await User.findOne({
            _id: { $ne: id },
            $or: [
                ...(email ? [{ email }] : []),
                ...(phone ? [{ phone }] : [])
            ]
        });

        if (existingUser) {
            return res.status(409).json({ message: 'Another user with this email or phone already exists' });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { email, phone },
            { new: true, runValidators: true }
        ).select('-refreshTokens');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        if (error.code === 11000) {
            return res.status(409).json({ message: 'User with this email or phone already exists' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findByIdAndDelete(id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user ID' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
};