const { body, param, query, validationResult } = require('express-validator')
const mongoose = require('mongoose')
const DOMPurify = require('isomorphic-dompurify')
const validator = require('validator')

/**
 * Security-focused validation middleware
 */

// Sanitization helpers
const sanitizeHtml = (value) => {
  if (typeof value !== 'string') return value
  return DOMPurify.sanitize(value, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  }).trim()
}

const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject)
    }
    
    const sanitized = {}
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeHtml(value)
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value)
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }

  req.body = sanitizeObject(req.body)
  req.query = sanitizeObject(req.query)
  req.params = sanitizeObject(req.params)
  
  next()
}

// Custom validators
const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value)
}

const isValidPhoneNumber = (value) => {
  return validator.isMobilePhone(value, 'any', { strictMode: false })
}

const isStrongPassword = (value) => {
  return validator.isStrongPassword(value, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 0
  })
}

const isValidCoordinate = (value) => {
  return typeof value === 'number' && value >= -180 && value <= 180
}

const isValidLatitude = (value) => {
  return typeof value === 'number' && value >= -90 && value <= 90
}

const isValidLongitude = (value) => {
  return typeof value === 'number' && value >= -180 && value <= 180
}

const isSafeFileName = (value) => {
  const unsafeChars = /[<>:"/\\|?*\x00-\x1f]/
  return !unsafeChars.test(value) && value.length <= 255
}

// Validation schemas
const validationSchemas = {
  // User registration validation
  userRegistration: [
    body('personalInfo.firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('First name must contain only letters and spaces'),
    
    body('personalInfo.lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Last name must contain only letters and spaces'),
    
    body('personalInfo.phoneNumber')
      .custom(isValidPhoneNumber)
      .withMessage('Invalid phone number format'),
    
    body('personalInfo.email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email format'),
    
    body('personalInfo.dateOfBirth')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    
    body('personalInfo.gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
      .withMessage('Invalid gender value'),
    
    body('authentication.password')
      .custom(isStrongPassword)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
    
    body('location.country')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Country is required'),
    
    body('location.state')
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('State is required'),
    
    body('farmingExperience.years')
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage('Years of experience must be between 0 and 100'),
    
    body('farmingExperience.farmSize')
      .optional()
      .isFloat({ min: 0, max: 10000 })
      .withMessage('Farm size must be a positive number')
  ],

  // User login validation
  userLogin: [
    body('phoneNumber')
      .custom(isValidPhoneNumber)
      .withMessage('Invalid phone number format'),
    
    body('password')
      .isLength({ min: 1 })
      .withMessage('Password is required')
  ],

  // Farm creation validation
  farmCreation: [
    body('farmInfo.name')
      .trim()
      .isLength({ min: 1, max: 100 })
      .matches(/^[a-zA-Z0-9\s\-_]+$/)
      .withMessage('Farm name must contain only letters, numbers, spaces, hyphens, and underscores'),
    
    body('farmInfo.totalArea.value')
      .isFloat({ min: 0.01, max: 10000 })
      .withMessage('Farm area must be between 0.01 and 10000'),
    
    body('farmInfo.totalArea.unit')
      .isIn(['acres', 'hectares', 'square_meters'])
      .withMessage('Invalid area unit'),
    
    body('farmInfo.farmType')
      .isIn(['crop_farm', 'livestock_farm', 'mixed_farm', 'organic_farm', 'greenhouse', 'other'])
      .withMessage('Invalid farm type'),
    
    body('location.coordinates')
      .isArray({ min: 2, max: 2 })
      .withMessage('Coordinates must be an array of [longitude, latitude]'),
    
    body('location.coordinates.*')
      .custom(isValidCoordinate)
      .withMessage('Invalid coordinate value'),
    
    body('location.soilType')
      .optional()
      .isIn(['clay', 'loamy', 'sandy', 'silt', 'peaty', 'chalky'])
      .withMessage('Invalid soil type')
  ],

  // Crop diagnosis validation
  cropDiagnosis: [
    body('cropType')
      .trim()
      .isLength({ min: 1, max: 50 })
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Crop type must contain only letters and spaces'),
    
    body('additionalInfo')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Additional info must be less than 500 characters'),
    
    body('uploadId')
      .custom(isValidObjectId)
      .withMessage('Invalid upload ID')
  ],

  // File upload validation
  fileUpload: [
    body('category')
      .optional()
      .isIn(['crop_diagnosis', 'farm_photo', 'document', 'other'])
      .withMessage('Invalid file category'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Description must be less than 200 characters')
  ],

  // Irrigation planning validation
  irrigationPlanning: [
    body('waterAmount')
      .isFloat({ min: 0, max: 10000 })
      .withMessage('Water amount must be between 0 and 10000 liters'),
    
    body('duration')
      .isInt({ min: 1, max: 1440 })
      .withMessage('Duration must be between 1 and 1440 minutes'),
    
    body('method')
      .isIn(['drip', 'sprinkler', 'flood', 'furrow', 'manual'])
      .withMessage('Invalid irrigation method'),
    
    body('scheduledTime')
      .optional()
      .isISO8601()
      .withMessage('Invalid scheduled time format')
  ],

  // Profile update validation
  profileUpdate: [
    body('personalInfo.firstName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('First name must contain only letters and spaces'),
    
    body('personalInfo.lastName')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Last name must contain only letters and spaces'),
    
    body('personalInfo.email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email format'),
    
    body('preferences.language')
      .optional()
      .isIn(['en', 'hi', 'es', 'fr', 'de'])
      .withMessage('Invalid language code'),
    
    body('preferences.units')
      .optional()
      .isIn(['metric', 'imperial'])
      .withMessage('Invalid units preference')
  ],

  // Password reset validation
  passwordReset: [
    body('phoneNumber')
      .custom(isValidPhoneNumber)
      .withMessage('Invalid phone number format')
  ],

  // Password change validation
  passwordChange: [
    body('currentPassword')
      .isLength({ min: 1 })
      .withMessage('Current password is required'),
    
    body('newPassword')
      .custom(isStrongPassword)
      .withMessage('New password must be at least 8 characters with uppercase, lowercase, and number'),
    
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error('Password confirmation does not match')
        }
        return true
      })
  ]
}

// Parameter validation
const paramValidation = {
  objectId: [
    param('id')
      .custom(isValidObjectId)
      .withMessage('Invalid ID parameter')
  ],
  
  farmId: [
    param('farmId')
      .custom(isValidObjectId)
      .withMessage('Invalid farm ID parameter')
  ],
  
  cropType: [
    param('cropType')
      .trim()
      .isLength({ min: 1, max: 50 })
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Invalid crop type parameter')
  ]
}

// Query validation
const queryValidation = {
  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page must be between 1 and 1000'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('sort')
      .optional()
      .isIn(['asc', 'desc', 'newest', 'oldest'])
      .withMessage('Invalid sort parameter')
  ],
  
  dateRange: [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid end date format')
  ],
  
  coordinates: [
    query('lat')
      .optional()
      .custom(isValidLatitude)
      .withMessage('Invalid latitude'),
    
    query('lon')
      .optional()
      .custom(isValidLongitude)
      .withMessage('Invalid longitude')
  ]
}

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }))
    
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errorDetails,
      timestamp: new Date().toISOString()
    })
  }
  
  next()
}

// File validation for uploads
const validateFileUpload = (options = {}) => {
  const {
    maxSize = 50 * 1024 * 1024, // 50MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    maxFiles = 10
  } = options

  return (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No files uploaded',
        timestamp: new Date().toISOString()
      })
    }

    if (req.files.length > maxFiles) {
      return res.status(400).json({
        status: 'error',
        message: `Too many files. Maximum ${maxFiles} files allowed`,
        timestamp: new Date().toISOString()
      })
    }

    const errors = []

    req.files.forEach((file, index) => {
      // Check file size
      if (file.size > maxSize) {
        errors.push({
          field: `file[${index}]`,
          message: `File size too large. Maximum ${maxSize / (1024 * 1024)}MB allowed`,
          size: file.size
        })
      }

      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        errors.push({
          field: `file[${index}]`,
          message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
          type: file.mimetype
        })
      }

      // Check file name safety
      if (!isSafeFileName(file.originalname)) {
        errors.push({
          field: `file[${index}]`,
          message: 'Unsafe file name. Please use only alphanumeric characters, hyphens, and underscores',
          filename: file.originalname
        })
      }
    })

    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'File validation failed',
        errors,
        timestamp: new Date().toISOString()
      })
    }

    next()
  }
}

// Business logic validation
const businessValidation = {
  // Validate farm ownership
  validateFarmOwnership: async (req, res, next) => {
    try {
      const { farmId } = req.params
      const userId = req.user._id
      
      const Farm = require('../models/Farm')
      const farm = await Farm.findOne({ _id: farmId, owner: userId })
      
      if (!farm) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. You do not own this farm',
          timestamp: new Date().toISOString()
        })
      }
      
      req.farm = farm
      next()
    } catch (error) {
      next(error)
    }
  },

  // Validate diagnosis ownership
  validateDiagnosisOwnership: async (req, res, next) => {
    try {
      const { diagnosisId } = req.params
      const userId = req.user._id
      
      const DiagnosisHistory = require('../models/DiagnosisHistory')
      const diagnosis = await DiagnosisHistory.findOne({ _id: diagnosisId, user: userId })
      
      if (!diagnosis) {
        return res.status(403).json({
          status: 'error',
          message: 'Access denied. You do not own this diagnosis',
          timestamp: new Date().toISOString()
        })
      }
      
      req.diagnosis = diagnosis
      next()
    } catch (error) {
      next(error)
    }
  }
}

module.exports = {
  sanitizeInput,
  validationSchemas,
  paramValidation,
  queryValidation,
  handleValidationErrors,
  validateFileUpload,
  businessValidation,
  
  // Export individual validators
  isValidObjectId,
  isValidPhoneNumber,
  isStrongPassword,
  isValidCoordinate,
  isValidLatitude,
  isValidLongitude,
  isSafeFileName
}