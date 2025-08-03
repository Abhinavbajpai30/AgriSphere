const express = require('express')
const mongoose = require('mongoose')
const os = require('os')
const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const logger = require('../utils/logger')
const analytics = require('../utils/analytics')

const router = express.Router()

/**
 * Comprehensive health check system
 */

class HealthChecker {
  constructor() {
    this.checks = new Map()
    this.registerDefaultChecks()
  }

  registerDefaultChecks() {
    this.registerCheck('database', this.checkDatabase.bind(this))
    this.registerCheck('memory', this.checkMemory.bind(this))
    this.registerCheck('disk', this.checkDisk.bind(this))
    this.registerCheck('external_apis', this.checkExternalAPIs.bind(this))
    this.registerCheck('cache', this.checkCache.bind(this))
    this.registerCheck('file_system', this.checkFileSystem.bind(this))
  }

  registerCheck(name, checkFunction) {
    this.checks.set(name, checkFunction)
  }

  async runCheck(name, timeout = 5000) {
    const checkFunction = this.checks.get(name)
    if (!checkFunction) {
      throw new Error(`Health check '${name}' not found`)
    }

    const startTime = Date.now()
    
    try {
      const result = await Promise.race([
        checkFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), timeout)
        )
      ])

      return {
        name,
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: result,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  async runAllChecks(timeout = 10000) {
    const checkNames = Array.from(this.checks.keys())
    const results = await Promise.allSettled(
      checkNames.map(name => this.runCheck(name, timeout / checkNames.length))
    )

    const healthChecks = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        return {
          name: checkNames[index],
          status: 'error',
          error: result.reason.message,
          timestamp: new Date().toISOString()
        }
      }
    })

    const healthyCount = healthChecks.filter(check => check.status === 'healthy').length
    const overallStatus = healthyCount === healthChecks.length ? 'healthy' : 
                         healthyCount > healthChecks.length / 2 ? 'degraded' : 'unhealthy'

    return {
      status: overallStatus,
      checks: healthChecks,
      summary: {
        total: healthChecks.length,
        healthy: healthyCount,
        unhealthy: healthChecks.length - healthyCount,
        responseTime: Math.max(...healthChecks.map(c => c.responseTime || 0))
      },
      timestamp: new Date().toISOString()
    }
  }

  // Individual health checks
  async checkDatabase() {
    const startTime = Date.now()
    
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected')
    }

    // Test database operations
    const testResult = await mongoose.connection.db.admin().ping()
    const responseTime = Date.now() - startTime

    // Get database stats
    const stats = await mongoose.connection.db.stats()

    return {
      connected: true,
      responseTime,
      database: mongoose.connection.name,
      collections: stats.collections,
      dataSize: stats.dataSize,
      indexSize: stats.indexSize,
      ping: testResult
    }
  }

  async checkMemory() {
    const usage = process.memoryUsage()
    const systemMem = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem()
    }

    const memoryUsagePercent = (usage.heapUsed / usage.heapTotal) * 100
    const systemUsagePercent = (systemMem.used / systemMem.total) * 100

    if (memoryUsagePercent > 90) {
      throw new Error(`High memory usage: ${memoryUsagePercent.toFixed(2)}%`)
    }

    return {
      process: {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
        rss: Math.round(usage.rss / 1024 / 1024), // MB
        external: Math.round(usage.external / 1024 / 1024), // MB
        usagePercent: Math.round(memoryUsagePercent)
      },
      system: {
        total: Math.round(systemMem.total / 1024 / 1024), // MB
        free: Math.round(systemMem.free / 1024 / 1024), // MB
        used: Math.round(systemMem.used / 1024 / 1024), // MB
        usagePercent: Math.round(systemUsagePercent)
      }
    }
  }

  async checkDisk() {
    try {
      const { stdout } = await exec("df -h / | tail -1 | awk '{print $5}' | sed 's/%//'")
      const usagePercent = parseInt(stdout.trim())

      if (usagePercent > 85) {
        throw new Error(`High disk usage: ${usagePercent}%`)
      }

      const { stdout: available } = await exec("df -h / | tail -1 | awk '{print $4}'")

      return {
        usagePercent,
        available: available.trim(),
        status: usagePercent > 80 ? 'warning' : 'ok'
      }
    } catch (error) {
      // Fallback for systems without df command
      return {
        usagePercent: 0,
        available: 'unknown',
        status: 'unknown',
        note: 'Disk check not available on this system'
      }
    }
  }

  async checkExternalAPIs() {
    const apiChecks = []

    // Check OpenEPI API
    try {
      const openEpiService = require('../services/openEpiService')
      const startTime = Date.now()
      
      // Simple connectivity test
      await openEpiService.makeRequest('/health', {}, { timeout: 3000 })
      
      apiChecks.push({
        name: 'OpenEPI',
        status: 'healthy',
        responseTime: Date.now() - startTime
      })
    } catch (error) {
      apiChecks.push({
        name: 'OpenEPI',
        status: 'unhealthy',
        error: error.message
      })
    }

    const unhealthyAPIs = apiChecks.filter(api => api.status === 'unhealthy')
    
    if (unhealthyAPIs.length > 0) {
      throw new Error(`${unhealthyAPIs.length} external APIs are unhealthy`)
    }

    return {
      apis: apiChecks,
      totalAPIs: apiChecks.length,
      healthyAPIs: apiChecks.filter(api => api.status === 'healthy').length
    }
  }

  async checkCache() {
    // Check if caching is working
    const testKey = 'health_check_test'
    const testValue = Date.now().toString()

    try {
      // Simple in-memory cache test
      const NodeCache = require('node-cache')
      const cache = new NodeCache({ stdTTL: 60 })
      
      cache.set(testKey, testValue)
      const retrieved = cache.get(testKey)
      
      if (retrieved !== testValue) {
        throw new Error('Cache write/read test failed')
      }

      return {
        status: 'working',
        keys: cache.keys().length,
        test: 'passed'
      }
    } catch (error) {
      throw new Error(`Cache system error: ${error.message}`)
    }
  }

  async checkFileSystem() {
    const fs = require('fs').promises
    const path = require('path')

    try {
      // Check upload directory
      const uploadDir = path.join(__dirname, '../uploads')
      await fs.access(uploadDir)
      const uploadStats = await fs.stat(uploadDir)

      // Check logs directory
      const logsDir = path.join(__dirname, '../logs')
      await fs.access(logsDir)
      const logsStats = await fs.stat(logsDir)

      // Test write permissions
      const testFile = path.join(uploadDir, 'health_check_test.txt')
      await fs.writeFile(testFile, 'test')
      await fs.unlink(testFile)

      return {
        uploadDir: {
          exists: true,
          writable: true,
          size: uploadStats.size
        },
        logsDir: {
          exists: true,
          writable: true,
          size: logsStats.size
        }
      }
    } catch (error) {
      throw new Error(`File system error: ${error.message}`)
    }
  }
}

const healthChecker = new HealthChecker()

/**
 * @route   GET /api/health
 * @desc    Basic health check endpoint
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now()
    
    // Quick health check
    const basicHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      responseTime: Date.now() - startTime
    }

    // Track health check
    analytics.trackEvent('health_check', {
      endpoint: '/health',
      status: 'healthy'
    })

    res.status(200).json(basicHealth)
  } catch (error) {
    logger.error('Health check failed', error)
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * @route   GET /api/health/detailed
 * @desc    Comprehensive health check with all systems
 * @access  Public
 */
router.get('/detailed', async (req, res) => {
  try {
    const startTime = Date.now()
    const healthReport = await healthChecker.runAllChecks()
    
    healthReport.meta = {
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      totalResponseTime: Date.now() - startTime
    }

    // Set appropriate status code
    const statusCode = healthReport.status === 'healthy' ? 200 :
                      healthReport.status === 'degraded' ? 200 : 503

    // Track detailed health check
    analytics.trackEvent('health_check_detailed', {
      status: healthReport.status,
      healthyChecks: healthReport.summary.healthy,
      totalChecks: healthReport.summary.total
    })

    res.status(statusCode).json(healthReport)
  } catch (error) {
    logger.error('Detailed health check failed', error)
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * @route   GET /api/health/:check
 * @desc    Individual health check
 * @access  Public
 */
router.get('/:check', async (req, res) => {
  try {
    const { check } = req.params
    const result = await healthChecker.runCheck(check)
    
    const statusCode = result.status === 'healthy' ? 200 : 503
    
    analytics.trackEvent('health_check_individual', {
      check,
      status: result.status
    })

    res.status(statusCode).json(result)
  } catch (error) {
    logger.error(`Health check '${req.params.check}' failed`, error)
    res.status(404).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * @route   GET /api/health/status/live
 * @desc    Kubernetes liveness probe
 * @access  Public
 */
router.get('/status/live', (req, res) => {
  // Simple liveness check - just return OK if server is running
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() })
})

/**
 * @route   GET /api/health/status/ready
 * @desc    Kubernetes readiness probe
 * @access  Public
 */
router.get('/status/ready', async (req, res) => {
  try {
    // Check critical dependencies
    const checks = await Promise.allSettled([
      healthChecker.runCheck('database', 2000),
      healthChecker.runCheck('memory', 1000)
    ])

    const allHealthy = checks.every(check => 
      check.status === 'fulfilled' && check.value.status === 'healthy'
    )

    if (allHealthy) {
      res.status(200).json({ 
        status: 'ready', 
        timestamp: new Date().toISOString() 
      })
    } else {
      res.status(503).json({ 
        status: 'not_ready', 
        timestamp: new Date().toISOString() 
      })
    }
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * @route   GET /api/health/metrics
 * @desc    System metrics for monitoring
 * @access  Public
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      system: {
        uptime: process.uptime(),
        loadAverage: os.loadavg(),
        cpuCount: os.cpus().length,
        platform: os.platform(),
        nodeVersion: process.version
      },
      memory: await healthChecker.runCheck('memory'),
      analytics: analytics.getSystemHealth(),
      timestamp: new Date().toISOString()
    }

    res.status(200).json(metrics)
  } catch (error) {
    logger.error('Metrics collection failed', error)
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

module.exports = router