require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

// Set port
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Start Server
const server = app.listen(PORT, () => {
  logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}\nStack: ${err.stack}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
