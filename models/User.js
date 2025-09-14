const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    // other fields as needed
    // refreshToken: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);