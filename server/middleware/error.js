const logger = require('../utils/logger');

// Centralized error handler middleware
const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name || 'Error'}: ${err.message}\nStack: ${err.stack}`);

  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode || 500);

  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  if (process.env.NODE_ENV === 'production') {
    if (err.name === 'ValidationError') {
      message = 'Validation failed';
      errors = Object.values(err.errors).map(e => e.message);
    } else if (err.name === 'MongoServerError' || err.name === 'CastError' || err.name === 'TypeError' || !err.statusCode) {
      message = 'An internal server error occurred';
      errors = [];
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

module.exports = errorHandler;
