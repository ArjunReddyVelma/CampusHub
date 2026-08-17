const logger = require('../utils/logger');

// Centralized error handler middleware
const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name || 'Error'}: ${err.message}\nStack: ${err.stack}`);

  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode || 500);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || [],
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

module.exports = errorHandler;
