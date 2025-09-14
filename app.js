const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST']
}));

// Rate limit global (defense-in-depth)
app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: 'Too many requests, try again later.'
}));

app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use(errorHandler);

module.exports = app;