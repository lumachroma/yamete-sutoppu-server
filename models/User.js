const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema({
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
});

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    refreshTokens: [refreshTokenSchema], // For refresh token rotation
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);