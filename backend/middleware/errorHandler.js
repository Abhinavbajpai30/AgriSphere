/**
 * Global Error Handling Middleware for AgriSphere Backend
 * Provides consistent error responses and logging for production use
 */

const logger = require('../utils/logger');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle different types of database errors
 */
const handleDatabaseError = (error) => {
  let message = 'Database operation failed';
  let statusCode = 500;

  // MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    message = `${field} already exists. Please use a different value.`;
    statusCode = 400;
  }

  // MongoDB validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    message = `Validation failed: ${errors.join(', ')}`;
    statusCode = 400;
  }

  // MongoDB cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    message = `Invalid ${error.path}: ${error.value}`;
    statusCode = 400;
  }

  return new ApiError(message, statusCode);
};

/**
 * Handle JWT errors
 */
const handleJWTError = (error) => {
  let message = 'Authentication failed';
  
  if (error.name === 'JsonWebTokenError') {
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    message = 'Authentication token has expired';
  }
  
  return new ApiError(message, 401);
};

/**
 * Format error response for production
 */
const formatErrorResponse = (error, req) => {
  const response = {
    status: 'error',
    message: error.message || 'Something went wrong',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.error = error;
  }

  // Add request ID if available (useful for debugging)
  if (req.id) {
    response.requestId = req.id;
  }

  return response;
};

/**
 * Main error handling middleware
 */
const errorHandler = (error, req, res, next) => {
  let err = { ...error };
  err.message = error.message;

  // Log error details
  logger.apiError(error, req);

  // Handle specific error types
  if (error.name === 'CastError' || error.name === 'ValidationError' || error.code === 11000) {
    err = handleDatabaseError(error);
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    err = handleJWTError(error);
  }

  // Handle mongoose connection errors
  if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
    err = new ApiError('Database connection failed. Please try again later.', 503);
  }

  // Handle rate limiting errors
  if (error.status === 429) {
    err = new ApiError('Too many requests. Please slow down.', 429);
  }

  // Default to 500 server error
  const statusCode = err.statusCode || 500;
  const response = formatErrorResponse(err, req);

  res.status(statusCode).json(response);
};

/**
 * Async error wrapper to catch async errors in route handlers
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found middleware for undefined routes
 */
const notFound = (req, res, next) => {
  const error = new ApiError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

/**
 * Validation error handler for express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errorMessages,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

module.exports = {
  ApiError,
  errorHandler,
  asyncHandler,
  notFound,
  handleValidationErrors,
  handleDatabaseError,
  handleJWTError,
  formatErrorResponse
};