/**
 * API Response Utilities for AgriSphere
 * Standardized response formats for consistent API communication
 * Includes success responses, error responses, and pagination helpers
 */

const logger = require('./logger');

/**
 * Standard success response format
 */
class ApiResponse {
  constructor(data = null, message = 'Success', statusCode = 200) {
    this.status = 'success';
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Send the response
   */
  send(res) {
    return res.status(this.statusCode).json({
      status: this.status,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp
    });
  }
}

/**
 * Success response helpers
 */
const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return new ApiResponse(data, message, statusCode).send(res);
};

const created = (res, data = null, message = 'Resource created successfully') => {
  return success(res, data, message, 201);
};

const updated = (res, data = null, message = 'Resource updated successfully') => {
  return success(res, data, message, 200);
};

const deleted = (res, message = 'Resource deleted successfully') => {
  return success(res, null, message, 200);
};

const noContent = (res) => {
  return res.status(204).send();
};

/**
 * Paginated response helper
 */
const paginated = (res, data, pagination, message = 'Success') => {
  const response = {
    items: data,
    pagination: {
      currentPage: pagination.page || 1,
      totalPages: pagination.totalPages || 1,
      totalItems: pagination.totalItems || data.length,
      itemsPerPage: pagination.limit || data.length,
      hasNextPage: pagination.hasNextPage || false,
      hasPrevPage: pagination.hasPrevPage || false
    }
  };

  return success(res, response, message);
};

/**
 * Error response helpers
 */
const error = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const response = {
    status: 'error',
    message,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = errors;
  }

  if (process.env.NODE_ENV === 'development') {
    response.debug = {
      statusCode,
      stack: new Error().stack
    };
  }

  return res.status(statusCode).json(response);
};

const badRequest = (res, message = 'Bad request', errors = null) => {
  return error(res, message, 400, errors);
};

const unauthorized = (res, message = 'Unauthorized access') => {
  return error(res, message, 401);
};

const forbidden = (res, message = 'Forbidden') => {
  return error(res, message, 403);
};

const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

const conflict = (res, message = 'Resource conflict') => {
  return error(res, message, 409);
};

const tooManyRequests = (res, message = 'Too many requests') => {
  return error(res, message, 429);
};

const internalError = (res, message = 'Internal server error') => {
  return error(res, message, 500);
};

const serviceUnavailable = (res, message = 'Service temporarily unavailable') => {
  return error(res, message, 503);
};

/**
 * Validation error response
 */
const validationError = (res, errors) => {
  const formattedErrors = Array.isArray(errors) 
    ? errors.map(err => ({
        field: err.param || err.path,
        message: err.msg || err.message,
        value: err.value
      }))
    : [{ message: errors }];

  return badRequest(res, 'Validation failed', formattedErrors);
};

/**
 * Agricultural-specific response helpers
 */
const diagnosisResponse = (res, diagnosis, recommendations = []) => {
  const data = {
    diagnosis: {
      id: diagnosis.diagnosisId,
      condition: diagnosis.analysisResults?.primaryDiagnosis?.condition,
      confidence: diagnosis.analysisResults?.primaryDiagnosis?.confidence,
      severity: diagnosis.analysisResults?.primaryDiagnosis?.severity,
      urgency: diagnosis.treatmentUrgency
    },
    recommendations: recommendations.slice(0, 3), // Top 3 recommendations
    nextSteps: [
      'Monitor crop condition closely',
      'Follow treatment recommendations',
      'Record treatment outcomes'
    ],
    followUpRequired: true
  };

  return success(res, data, 'Diagnosis completed successfully');
};

const irrigationResponse = (res, recommendation, implementation = null) => {
  const data = {
    recommendation: {
      action: recommendation.recommendedAction,
      waterAmount: recommendation.waterAmount,
      timing: recommendation.timing,
      urgency: recommendation.timing?.urgency || 'normal'
    }
  };

  if (implementation) {
    data.implementation = {
      status: 'completed',
      waterUsed: implementation.waterUsed,
      efficiency: implementation.efficiency,
      cost: implementation.costs?.totalCost
    };
  }

  return success(res, data, 'Irrigation recommendation generated successfully');
};

const farmAnalyticsResponse = (res, analytics, period = '30 days') => {
  const data = {
    period,
    overview: analytics.overview,
    insights: analytics.insights || [],
    recommendations: analytics.recommendations || [],
    trends: analytics.trends || {},
    lastUpdated: new Date().toISOString()
  };

  return success(res, data, 'Farm analytics retrieved successfully');
};

const cropPlanResponse = (res, plan, timeline = null) => {
  const data = {
    plan: {
      id: plan.planId,
      crop: plan.cropDetails?.cropName,
      area: plan.cropDetails?.area,
      plantingDate: plan.cropDetails?.plantingDate,
      expectedHarvest: plan.cropDetails?.expectedHarvestDate,
      suitability: plan.suitabilityAnalysis?.overallSuitability
    }
  };

  if (timeline) {
    data.timeline = timeline.milestones?.slice(0, 5); // Next 5 milestones
  }

  return success(res, data, 'Crop plan created successfully');
};

/**
 * Health check response
 */
const healthCheck = (res, checks = {}) => {
  const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
  
  const data = {
    status: allHealthy ? 'healthy' : 'degraded',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks
  };

  return res.status(allHealthy ? 200 : 503).json(data);
};

/**
 * API documentation response
 */
const apiInfo = (res) => {
  const data = {
    name: 'AgriSphere API',
    version: '1.0.0',
    description: 'AI-powered digital agronomist for smallholder farmers',
    documentation: '/docs',
    endpoints: {
      authentication: '/api/auth',
      farms: '/api/farm',
      diagnosis: '/api/diagnosis',
      irrigation: '/api/irrigation',
      planning: '/api/planning'
    },
    supportedLanguages: ['en', 'es', 'fr', 'hi', 'sw', 'am', 'yo', 'ha'],
    contact: {
      support: 'support@agrisphere.com',
      documentation: 'https://docs.agrisphere.com'
    }
  };

  return success(res, data, 'API information');
};

/**
 * Rate limit response
 */
const rateLimitExceeded = (res, limit, remaining, resetTime) => {
  res.set({
    'X-RateLimit-Limit': limit,
    'X-RateLimit-Remaining': remaining,
    'X-RateLimit-Reset': resetTime
  });

  return tooManyRequests(res, `Rate limit exceeded. Try again in ${Math.ceil((resetTime - Date.now()) / 1000)} seconds.`);
};

/**
 * Middleware to add response helpers to res object
 */
const attachResponseHelpers = (req, res, next) => {
  // Success responses
  res.success = (data, message, statusCode) => success(res, data, message, statusCode);
  res.created = (data, message) => created(res, data, message);
  res.updated = (data, message) => updated(res, data, message);
  res.deleted = (message) => deleted(res, message);
  res.noContent = () => noContent(res);
  res.paginated = (data, pagination, message) => paginated(res, data, pagination, message);

  // Error responses
  res.error = (message, statusCode, errors) => error(res, message, statusCode, errors);
  res.badRequest = (message, errors) => badRequest(res, message, errors);
  res.unauthorized = (message) => unauthorized(res, message);
  res.forbidden = (message) => forbidden(res, message);
  res.notFound = (message) => notFound(res, message);
  res.conflict = (message) => conflict(res, message);
  res.tooManyRequests = (message) => tooManyRequests(res, message);
  res.internalError = (message) => internalError(res, message);
  res.serviceUnavailable = (message) => serviceUnavailable(res, message);
  res.validationError = (errors) => validationError(res, errors);

  // Agricultural-specific responses
  res.diagnosisResponse = (diagnosis, recommendations) => diagnosisResponse(res, diagnosis, recommendations);
  res.irrigationResponse = (recommendation, implementation) => irrigationResponse(res, recommendation, implementation);
  res.farmAnalyticsResponse = (analytics, period) => farmAnalyticsResponse(res, analytics, period);
  res.cropPlanResponse = (plan, timeline) => cropPlanResponse(res, plan, timeline);

  // Utility responses
  res.healthCheck = (checks) => healthCheck(res, checks);
  res.apiInfo = () => apiInfo(res);

  next();
};

/**
 * Response time tracking middleware
 */
const trackResponseTime = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Don't set headers after response is finished
    // res.set('X-Response-Time', `${duration}ms`);

    // Log slow requests
    if (duration > 5000) { // 5 seconds
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        userId: req.user?._id,
        requestId: req.id
      });
    }

    // Log request metrics
    logger.info('Request metrics', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?._id,
      requestId: req.id
    });
  });

  next();
};

module.exports = {
  ApiResponse,
  success,
  created,
  updated,
  deleted,
  noContent,
  paginated,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
  internalError,
  serviceUnavailable,
  validationError,
  diagnosisResponse,
  irrigationResponse,
  farmAnalyticsResponse,
  cropPlanResponse,
  healthCheck,
  apiInfo,
  rateLimitExceeded,
  attachResponseHelpers,
  trackResponseTime
};