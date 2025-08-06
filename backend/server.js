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
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

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
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Parse CORS origins from environment variable
    const allowedOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : [
          'http://localhost:3000', 
          'http://localhost:3001', 
          'http://127.0.0.1:3000', 
          'http://127.0.0.1:3001',
          'https://localhost:3000',
          'https://localhost:3001',
          'https://127.0.0.1:3000',
          'https://127.0.0.1:3001'
        ];
    
    // Log CORS configuration for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('CORS allowed origins:', allowedOrigins);
      console.log('Request origin:', origin);
    }
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// Rate limiting removed for frontend-only access
// Global rate limiting disabled as this backend is called only through the frontend

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

// SSL Configuration
const getSSLConfig = () => {
  const sslEnabled = process.env.SSL_ENABLED === 'true';
  
  if (!sslEnabled) {
    return null;
  }

  const certPath = process.env.SSL_CERT_PATH || path.join(__dirname, 'ssl', 'cert.pem');
  const keyPath = process.env.SSL_KEY_PATH || path.join(__dirname, 'ssl', 'key.pem');

  try {
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      const sslConfig = {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath)
      };
      
      // Add CA certificate only if it exists and is specified
      if (process.env.SSL_CA_PATH && fs.existsSync(process.env.SSL_CA_PATH)) {
        sslConfig.ca = fs.readFileSync(process.env.SSL_CA_PATH);
      }
      
      return sslConfig;
    } else {
      logger.warn('SSL certificates not found. HTTPS will be disabled.');
      return null;
    }
  } catch (error) {
    logger.error('Error loading SSL certificates:', error.message);
    return null;
  }
};

// Start server
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';
const SSL_ENABLED = process.env.SSL_ENABLED === 'true';
const SSL_PORT = process.env.SSL_PORT || 5001;

const sslConfig = getSSLConfig();

if (SSL_ENABLED && sslConfig) {
  // Create HTTPS server
  const httpsServer = https.createServer(sslConfig, app);
  
  httpsServer.listen(SSL_PORT, HOST, () => {
    logger.info(`AgriSphere Backend HTTPS running on https://${HOST}:${SSL_PORT} in ${process.env.NODE_ENV} mode`);
    
    // Initialize notification service after server starts
    const notificationService = require('./services/notificationService');
    notificationService.initialize();
  });

  // Also start HTTP server for redirects (optional)
  if (process.env.HTTP_REDIRECT === 'true') {
    const httpApp = express();
    httpApp.use((req, res) => {
      res.redirect(`https://${req.headers.host}${req.url}`);
    });
    
    const httpServer = http.createServer(httpApp);
    httpServer.listen(PORT, HOST, () => {
      logger.info(`HTTP redirect server running on http://${HOST}:${PORT}`);
    });
  }
} else {
  // Create HTTP server
  const server = app.listen(PORT, HOST, () => {
    logger.info(`AgriSphere Backend HTTP running on http://${HOST}:${PORT} in ${process.env.NODE_ENV} mode`);
    
    // Initialize notification service after server starts
    const notificationService = require('./services/notificationService');
    notificationService.initialize();
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    server.close(() => {
      const notificationService = require('./services/notificationService');
      notificationService.stopAll();
      process.exit(1);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    const notificationService = require('./services/notificationService');
    notificationService.stopAll();
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      const notificationService = require('./services/notificationService');
      notificationService.stopAll();
      process.exit(0);
    });
  });
}

// Global error handling for both HTTP and HTTPS servers
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  const notificationService = require('./services/notificationService');
  notificationService.stopAll();
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  const notificationService = require('./services/notificationService');
  notificationService.stopAll();
  process.exit(1);
});

module.exports = app;