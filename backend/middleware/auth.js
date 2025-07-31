/**
 * Authentication Middleware for AgriSphere
 * Centralized authentication and authorization for all protected routes
 * Includes role-based access control and request context management
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError } = require('./errorHandler');
const logger = require('../utils/logger');

/**
 * Main authentication middleware
 * Verifies JWT token and attaches user to request object
 */
const authenticateUser = async (req, res, next) => {
  try {
    // Get token from header
    let token = req.header('Authorization');
    
    if (!token) {
      throw new ApiError('Access denied. No token provided.', 401);
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-authentication.password');
    
    if (!user) {
      throw new ApiError('Invalid token. User not found.', 401);
    }

    // Check if user account is active
    if (!user.status.isActive) {
      throw new ApiError('Account is deactivated. Please contact support.', 403);
    }

    // Check if account is locked
    if (user.authentication.isLocked) {
      throw new ApiError('Account is temporarily locked. Please try again later.', 423);
    }

    // Attach user to request object
    req.user = user;
    req.userId = user._id;
    
    // Update last active date (async, don't wait)
    User.findByIdAndUpdate(user._id, { 
      'appUsage.lastActiveDate': new Date() 
    }).catch(err => {
      logger.warn('Failed to update user last active date', { userId: user._id, error: err.message });
    });

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError('Invalid token.', 401));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError('Token has expired.', 401));
    }

    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is valid, but doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.header('Authorization');
    
    if (!token) {
      return next(); // Continue without authentication
    }

    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-authentication.password');
    
    if (user && user.status.isActive && !user.authentication.isLocked) {
      req.user = user;
      req.userId = user._id;
    }

    next();
  } catch (error) {
    // Ignore authentication errors in optional auth
    next();
  }
};

/**
 * Role-based authorization middleware
 * Checks if user has required role/permission
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError('Authentication required.', 401));
    }

    // For now, all users have the same role (farmer)
    // In the future, you might have admin, expert, etc.
    const userRole = req.user.status.subscriptionType || 'free';
    
    if (role === 'premium' && userRole === 'free') {
      return next(new ApiError('Premium subscription required for this feature.', 403));
    }

    next();
  };
};

/**
 * Resource ownership validation
 * Ensures user can only access their own resources
 */
const requireOwnership = (resourceModel, resourceIdParam = 'id', ownerField = 'owner') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ApiError('Authentication required.', 401));
      }

      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        return next(new ApiError('Resource ID is required.', 400));
      }

      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        return next(new ApiError('Resource not found.', 404));
      }

      // Check ownership
      const ownerId = resource[ownerField];
      
      if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
        return next(new ApiError('Access denied. You can only access your own resources.', 403));
      }

      // Attach resource to request for use in route handler
      req.resource = resource;
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Rate limiting by user
 * More sophisticated rate limiting based on user subscription
 */
const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next(); // Skip rate limiting for unauthenticated requests
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get user's request history
    let requests = userRequests.get(userId) || [];
    
    // Remove old requests outside the time window
    requests = requests.filter(time => time > windowStart);
    
    // Check if user has exceeded limit
    const subscriptionMultiplier = {
      'free': 1,
      'basic': 2,
      'premium': 5
    };
    
    const userLimit = maxRequests * (subscriptionMultiplier[req.user.status.subscriptionType] || 1);
    
    if (requests.length >= userLimit) {
      return next(new ApiError(`Rate limit exceeded. Maximum ${userLimit} requests per ${windowMs / 60000} minutes.`, 429));
    }

    // Add current request
    requests.push(now);
    userRequests.set(userId, requests);

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': userLimit,
      'X-RateLimit-Remaining': Math.max(0, userLimit - requests.length - 1),
      'X-RateLimit-Reset': new Date(now + windowMs).toISOString()
    });

    next();
  };
};

/**
 * Request context middleware
 * Adds request ID and other context information
 */
const addRequestContext = (req, res, next) => {
  // Generate unique request ID
  req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Add request ID to response headers
  res.set('X-Request-ID', req.id);
  
  // Log request start
  logger.info('Request started', {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?._id
  });

  // Track request duration
  req.startTime = Date.now();
  
  // Override res.json to log responses
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - req.startTime;
    
    logger.info('Request completed', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?._id
    });

    return originalJson.call(this, data);
  };

  next();
};

/**
 * API key authentication for external integrations
 */
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key');
    
    if (!apiKey) {
      throw new ApiError('API key required.', 401);
    }

    // In a real implementation, you would validate the API key against a database
    // For now, just check if it matches a configured value
    if (apiKey !== process.env.API_KEY) {
      throw new ApiError('Invalid API key.', 401);
    }

    // For API key authentication, create a system user context
    req.user = {
      _id: 'system',
      isSystemUser: true,
      permissions: ['read', 'write']
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Subscription tier enforcement
 */
const requireSubscription = (minTier = 'basic') => {
  const tierLevels = {
    'free': 0,
    'basic': 1,
    'premium': 2
  };

  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError('Authentication required.', 401));
    }

    const userTier = req.user.status.subscriptionType || 'free';
    const requiredLevel = tierLevels[minTier];
    const userLevel = tierLevels[userTier];

    if (userLevel < requiredLevel) {
      return next(new ApiError(`${minTier} subscription or higher required for this feature.`, 403));
    }

    next();
  };
};

/**
 * Feature flag middleware
 * Enables/disables features based on configuration
 */
const requireFeature = (featureName) => {
  return (req, res, next) => {
    // Check if feature is enabled (in real app, this would come from config/database)
    const features = {
      'advanced_analytics': true,
      'ai_recommendations': true,
      'weather_alerts': true,
      'expert_consultation': false // Example of disabled feature
    };

    if (!features[featureName]) {
      return next(new ApiError('This feature is currently not available.', 503));
    }

    next();
  };
};

module.exports = {
  authenticateUser,
  optionalAuth,
  requireRole,
  requireOwnership,
  rateLimitByUser,
  addRequestContext,
  authenticateApiKey,
  requireSubscription,
  requireFeature
};