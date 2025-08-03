const rateLimit = require('express-rate-limit')
const slowDown = require('express-slow-down')
const RedisStore = require('rate-limit-redis')
const { createClient } = require('redis')
const logger = require('../utils/logger')

// Create Redis client for distributed rate limiting (optional)
let redisClient
try {
  if (process.env.REDIS_URL) {
    redisClient = createClient({
      url: process.env.REDIS_URL
    })
    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err)
    })
  }
} catch (error) {
  logger.warn('Redis not available, using memory store for rate limiting')
}

// Rate limiting configurations
const rateLimitConfigs = {
  // Strict rate limiting for auth endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 auth requests per windowMs
    message: {
      status: 'error',
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: 15 * 60 // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    skipFailedRequests: false, // Count failed requests
  },

  // Moderate rate limiting for API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      status: 'error',
      message: 'Too many API requests. Please slow down.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Strict rate limiting for file uploads
  upload: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 uploads per minute
    message: {
      status: 'error',
      message: 'Too many file uploads. Please wait before uploading again.',
      retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Very strict rate limiting for password reset
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password reset attempts per hour
    message: {
      status: 'error',
      message: 'Too many password reset attempts. Please try again later.',
      retryAfter: 60 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
  }
}

// Create rate limiters
const createRateLimiter = (config) => {
  const rateLimiterOptions = {
    ...config,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?._id?.toString() || req.ip
    },
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userId: req.user?._id,
        endpoint: req.path,
        userAgent: req.get('User-Agent')
      })
      
      res.status(429).json(config.message)
    },
    onLimitReached: (req, res, options) => {
      logger.warn('Rate limit reached', {
        ip: req.ip,
        userId: req.user?._id,
        endpoint: req.path,
        limit: options.max,
        window: options.windowMs
      })
    }
  }

  // Use Redis store if available
  if (redisClient) {
    rateLimiterOptions.store = new RedisStore({
      client: redisClient,
      prefix: 'agrisphere:rate_limit:'
    })
  }

  return rateLimit(rateLimiterOptions)
}

// Create slow down middleware for progressive delays
const createSlowDown = (config) => {
  return slowDown({
    windowMs: config.windowMs,
    delayAfter: Math.floor(config.max / 2), // Start slowing down after half the limit
    delayMs: 500, // Start with 500ms delay
    maxDelayMs: 10000, // Max 10 second delay
    keyGenerator: (req) => {
      return req.user?._id?.toString() || req.ip
    },
    onLimitReached: (req, res, options) => {
      logger.info('Slow down triggered', {
        ip: req.ip,
        userId: req.user?._id,
        endpoint: req.path,
        delay: options.delay
      })
    }
  })
}

// Export configured rate limiters
const rateLimiters = {
  auth: createRateLimiter(rateLimitConfigs.auth),
  api: createRateLimiter(rateLimitConfigs.api),
  upload: createRateLimiter(rateLimitConfigs.upload),
  passwordReset: createRateLimiter(rateLimitConfigs.passwordReset),
  
  // Slow down middlewares
  authSlowDown: createSlowDown(rateLimitConfigs.auth),
  apiSlowDown: createSlowDown(rateLimitConfigs.api),
}

// Adaptive rate limiting based on server load
const adaptiveRateLimit = (baseConfig) => {
  return (req, res, next) => {
    // Get current server metrics
    const memoryUsage = process.memoryUsage()
    const heapUsedPercentage = memoryUsage.heapUsed / memoryUsage.heapTotal

    // Adjust rate limits based on server load
    let adjustedMax = baseConfig.max
    
    if (heapUsedPercentage > 0.9) {
      adjustedMax = Math.floor(baseConfig.max * 0.3) // Reduce to 30% if high memory usage
    } else if (heapUsedPercentage > 0.8) {
      adjustedMax = Math.floor(baseConfig.max * 0.5) // Reduce to 50% if medium memory usage
    } else if (heapUsedPercentage > 0.7) {
      adjustedMax = Math.floor(baseConfig.max * 0.7) // Reduce to 70% if moderate memory usage
    }

    // Create dynamic rate limiter
    const dynamicLimiter = createRateLimiter({
      ...baseConfig,
      max: adjustedMax
    })

    dynamicLimiter(req, res, next)
  }
}

// IP-based blocking for repeated violations
const ipBlockingMiddleware = () => {
  const blockedIPs = new Map() // In production, use Redis
  const violationThreshold = 10
  const blockDuration = 60 * 60 * 1000 // 1 hour

  return (req, res, next) => {
    const ip = req.ip
    const now = Date.now()

    // Check if IP is currently blocked
    const blockInfo = blockedIPs.get(ip)
    if (blockInfo && now < blockInfo.blockedUntil) {
      logger.warn('Blocked IP attempted access', { ip, blockedUntil: blockInfo.blockedUntil })
      return res.status(429).json({
        status: 'error',
        message: 'IP temporarily blocked due to repeated violations',
        blockedUntil: blockInfo.blockedUntil
      })
    }

    // Clear expired blocks
    if (blockInfo && now >= blockInfo.blockedUntil) {
      blockedIPs.delete(ip)
    }

    // Track violations
    req.on('rateLimitReached', () => {
      const currentViolations = (blockInfo?.violations || 0) + 1
      
      if (currentViolations >= violationThreshold) {
        // Block the IP
        blockedIPs.set(ip, {
          violations: currentViolations,
          blockedUntil: now + blockDuration,
          firstViolation: blockInfo?.firstViolation || now
        })
        
        logger.warn('IP blocked due to repeated violations', {
          ip,
          violations: currentViolations,
          blockedUntil: now + blockDuration
        })
      } else {
        // Track violation
        blockedIPs.set(ip, {
          violations: currentViolations,
          blockedUntil: null,
          firstViolation: blockInfo?.firstViolation || now
        })
      }
    })

    next()
  }
}

// Cleanup blocked IPs periodically
setInterval(() => {
  const now = Date.now()
  const cleanupLimit = 24 * 60 * 60 * 1000 // 24 hours
  
  // This would be implemented with Redis in production
  // for (const [ip, blockInfo] of blockedIPs.entries()) {
  //   if (now - blockInfo.firstViolation > cleanupLimit) {
  //     blockedIPs.delete(ip)
  //   }
  // }
}, 60 * 60 * 1000) // Run cleanup every hour

// API key rate limiting for external integrations
const apiKeyRateLimit = (req, res, next) => {
  const apiKey = req.headers['x-api-key']
  
  if (!apiKey) {
    return next()
  }

  // In production, you would validate the API key and get its tier/limits
  const keyLimits = {
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute for API keys
    message: {
      status: 'error',
      message: 'API key rate limit exceeded',
      retryAfter: 60
    }
  }

  const apiKeyLimiter = createRateLimiter(keyLimits)
  apiKeyLimiter(req, res, next)
}

// Health check for rate limiting status
const getRateLimitStatus = async (req, res) => {
  try {
    const status = {
      rateLimiting: 'active',
      redisConnected: !!redisClient,
      configs: Object.keys(rateLimitConfigs),
      timestamp: new Date().toISOString()
    }

    if (redisClient) {
      try {
        await redisClient.ping()
        status.redisStatus = 'connected'
      } catch (error) {
        status.redisStatus = 'error'
        status.redisError = error.message
      }
    }

    res.json(status)
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get rate limit status',
      error: error.message
    })
  }
}

module.exports = {
  rateLimiters,
  adaptiveRateLimit,
  ipBlockingMiddleware,
  apiKeyRateLimit,
  getRateLimitStatus,
  
  // Individual rate limiters for specific use cases
  authRateLimit: rateLimiters.auth,
  apiRateLimit: rateLimiters.api,
  uploadRateLimit: rateLimiters.upload,
  passwordResetRateLimit: rateLimiters.passwordReset,
  
  // Slow down middlewares
  authSlowDown: rateLimiters.authSlowDown,
  apiSlowDown: rateLimiters.apiSlowDown,
}