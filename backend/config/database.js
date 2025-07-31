/**
 * MongoDB Database Configuration
 * Handles connection to MongoDB with proper error handling and retry logic
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB database
 * Implements retry logic for unreliable connections (important for developing regions)
 */
const connectDB = async () => {
  try {
    const connectionOptions = {
      // Connection options optimized for reliability
      useNewUrlParser: true,
      useUnifiedTopology: true,
      
      // Connection pool settings
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      
      // Heartbeat settings for unreliable connections
      heartbeatFrequencyMS: 10000, // Send a ping every 10 seconds
      
      // Retry settings
      retryWrites: true,
      retryReads: true,
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions);

    logger.info(`MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        logger.error('Error during MongoDB disconnection:', err);
        process.exit(1);
      }
    });

  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    
    // Retry connection after delay (important for unreliable networks)
    setTimeout(() => {
      logger.info('Retrying MongoDB connection...');
      connectDB();
    }, 5000);
  }
};

/**
 * Check if database is connected
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Get database connection status
 */
const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    state: states[mongoose.connection.readyState],
    host: mongoose.connection.host,
    port: mongoose.connection.port,
    database: mongoose.connection.name
  };
};

module.exports = {
  connectDB,
  isConnected,
  getConnectionStatus
};