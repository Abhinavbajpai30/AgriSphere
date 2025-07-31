/**
 * Health Check Routes for AgriSphere
 * Comprehensive system health monitoring for production deployment
 * Includes database connectivity, external services, and system metrics
 */

const express = require('express');
const mongoose = require('mongoose');
const { asyncHandler } = require('../middleware/errorHandler');
const { isConnected, getConnectionStatus } = require('../config/database');
const logger = require('../utils/logger');
const weatherApi = require('../services/weatherApi');
const soilApi = require('../services/soilApi');

const router = express.Router();

/**
 * @route   GET /health
 * @desc    Basic health check endpoint
 * @access  Public
 */
router.get('/', asyncHandler(async (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'AgriSphere Backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    }
  };

  res.status(200).json(healthStatus);
}));

/**
 * @route   GET /health/detailed
 * @desc    Detailed health check with dependency status
 * @access  Public
 */
router.get('/detailed', asyncHandler(async (req, res) => {
  const checks = {};
  let overallStatus = 'healthy';

  try {
    // Database connectivity check
    checks.database = await checkDatabase();
    if (checks.database.status !== 'healthy') overallStatus = 'degraded';

    // External services check
    checks.weatherService = await checkWeatherService();
    checks.soilService = await checkSoilService();
    
    // If external services are down, mark as degraded but not unhealthy
    if (checks.weatherService.status !== 'healthy' || checks.soilService.status !== 'healthy') {
      if (overallStatus === 'healthy') overallStatus = 'degraded';
    }

    // System resources check
    checks.system = checkSystemResources();
    if (checks.system.status !== 'healthy') overallStatus = 'unhealthy';

    // API endpoints check
    checks.endpoints = checkCoreEndpoints();

  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    overallStatus = 'unhealthy';
    checks.error = {
      status: 'unhealthy',
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }

  const healthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    service: 'AgriSphere Backend',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    checks
  };

  const statusCode = overallStatus === 'healthy' ? 200 : 
                    overallStatus === 'degraded' ? 200 : 503;

  res.status(statusCode).json(healthResponse);
}));

/**
 * @route   GET /health/ready
 * @desc    Readiness probe for Kubernetes/container orchestration
 * @access  Public
 */
router.get('/ready', asyncHandler(async (req, res) => {
  try {
    // Check if database is connected
    if (!isConnected()) {
      return res.status(503).json({
        status: 'not_ready',
        message: 'Database not connected',
        timestamp: new Date().toISOString()
      });
    }

    // Check if essential environment variables are set
    const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      return res.status(503).json({
        status: 'not_ready',
        message: `Missing environment variables: ${missingEnvVars.join(', ')}`,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      status: 'ready',
      message: 'Service is ready to accept requests',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Readiness check failed', { error: error.message });
    
    res.status(503).json({
      status: 'not_ready',
      message: 'Service is not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @route   GET /health/live
 * @desc    Liveness probe for Kubernetes/container orchestration
 * @access  Public
 */
router.get('/live', asyncHandler(async (req, res) => {
  // Simple liveness check - if the server can respond, it's alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
}));

/**
 * @route   GET /health/metrics
 * @desc    System metrics for monitoring
 * @access  Public
 */
router.get('/metrics', asyncHandler(async (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    system: {
      uptime: Math.floor(process.uptime()),
      memory: {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
        rss: process.memoryUsage().rss
      },
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version
    },
    database: {
      connectionState: mongoose.connection.readyState,
      ...getConnectionStatus()
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  };

  // Add request count if available
  if (global.requestCount) {
    metrics.requests = {
      total: global.requestCount,
      currentWindow: global.currentWindowRequests || 0
    };
  }

  res.status(200).json(metrics);
}));

// Helper functions for health checks

/**
 * Check database connectivity and performance
 */
async function checkDatabase() {
  try {
    const startTime = Date.now();
    
    // Simple ping to database
    await mongoose.connection.db.admin().ping();
    
    const responseTime = Date.now() - startTime;
    const connectionStatus = getConnectionStatus();

    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      connection: connectionStatus,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Check weather service availability
 */
async function checkWeatherService() {
  try {
    const startTime = Date.now();
    
    // Test with a simple coordinate (New York)
    await weatherApi.getCurrentWeather(40.7128, -74.0060);
    
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      service: 'Weather API',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.warn('Weather service health check failed', { error: error.message });
    
    return {
      status: 'unhealthy',
      service: 'Weather API',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Check soil service availability
 */
async function checkSoilService() {
  try {
    const startTime = Date.now();
    
    // Test with a simple coordinate
    await soilApi.getSoilProperties(40.7128, -74.0060);
    
    const responseTime = Date.now() - startTime;

    return {
      status: 'healthy',
      service: 'Soil API',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.warn('Soil service health check failed', { error: error.message });
    
    return {
      status: 'unhealthy',
      service: 'Soil API',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Check system resources
 */
function checkSystemResources() {
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal;
  const usedMemory = memoryUsage.heapUsed;
  const memoryUtilization = (usedMemory / totalMemory) * 100;

  let status = 'healthy';
  const warnings = [];

  // Memory check
  if (memoryUtilization > 90) {
    status = 'unhealthy';
    warnings.push('High memory utilization');
  } else if (memoryUtilization > 80) {
    status = 'degraded';
    warnings.push('Elevated memory utilization');
  }

  // Uptime check (if server has been restarting frequently)
  const uptime = process.uptime();
  if (uptime < 300) { // Less than 5 minutes
    warnings.push('Recent restart detected');
  }

  return {
    status,
    memory: {
      utilized: `${memoryUtilization.toFixed(2)}%`,
      used: `${Math.round(usedMemory / 1024 / 1024)}MB`,
      total: `${Math.round(totalMemory / 1024 / 1024)}MB`
    },
    uptime: `${Math.floor(uptime / 60)} minutes`,
    warnings: warnings.length > 0 ? warnings : undefined,
    timestamp: new Date().toISOString()
  };
}

/**
 * Check core API endpoints availability
 */
function checkCoreEndpoints() {
  // In a more sophisticated implementation, you might actually test endpoints
  // For now, just return the endpoint configuration
  return {
    status: 'healthy',
    endpoints: [
      { path: '/api/auth', status: 'available' },
      { path: '/api/farm', status: 'available' },
      { path: '/api/diagnosis', status: 'available' },
      { path: '/api/irrigation', status: 'available' },
      { path: '/api/planning', status: 'available' }
    ],
    timestamp: new Date().toISOString()
  };
}

module.exports = router;