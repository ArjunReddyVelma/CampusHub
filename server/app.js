const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const errorHandler = require('./middleware/error');

// Route files
const auth = require('./routes/authRoutes');
const quizzes = require('./routes/quizRoutes');
const questions = require('./routes/questionRoutes');
const dashboard = require('./routes/dashboardRoutes');
const attempts = require('./routes/attemptRoutes');
const clubs = require('./routes/clubRoutes');
const hackathons = require('./routes/hackathonRoutes');

const app = express();

// Security Middlewares
app.use(helmet());

// CORS Configuration
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Mount routers
app.use('/api/v1/auth', auth);
app.use('/api/v1/quizzes', quizzes);
app.use('/api/v1/questions', questions);
app.use('/api/v1/dashboard', dashboard);
app.use('/api/v1/attempts', attempts);
app.use('/api/v1/clubs', clubs);
app.use('/api/v1/hackathons', hackathons);

// Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CampusHub API is healthy'
  });
});

// Centralized Error Handler (must be registered last)
app.use(errorHandler);

module.exports = app;
