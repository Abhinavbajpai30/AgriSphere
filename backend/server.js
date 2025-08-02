/**
 * AgriSphere Backend Server
 * Main entry point for the AI-powered digital agronomist application
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const { connectDB } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const farmRoutes = require('./routes/farm');
const diagnosisRoutes = require('./routes/diagnosis');
const irrigationRoutes = require('./routes/irrigation');
const planningRoutes = require('./routes/planning');
const healthRoutes = require('./routes/health');
const onboardingRoutes = require('./routes/onboarding');
const dashboardRoutes = require('./routes/dashboard');

// Import middleware
const { addRequestContext } = require('./middleware/auth');
const { trackResponseTime, attachResponseHelpers } = require('./utils/apiResponse');

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB();

// Security middleware - Set security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Enable CORS for frontend communication
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Request context and response helpers
app.use(addRequestContext);
app.use(attachResponseHelpers);
app.use(trackResponseTime);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent HTTP Parameter Pollution attacks
app.use(hpp());

// Compression middleware for better performance
app.use(compression());

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check routes
app.use('/health', healthRoutes);

// API information endpoint
app.get('/api', (req, res) => {
  res.apiInfo();
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/farm', farmRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/irrigation', irrigationRoutes);
app.use('/api/planning', planningRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Catch-all route for undefined routes
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  });
});

// Global error handling middleware (must be last)
app.use(errorHandler);

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

const server = app.listen(PORT, HOST, () => {
  logger.info(`AgriSphere Backend running on ${HOST}:${PORT} in ${process.env.NODE_ENV} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;