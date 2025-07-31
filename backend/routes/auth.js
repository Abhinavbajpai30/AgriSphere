/**
 * Authentication Routes for AgriSphere
 * Handles user registration, login, password management, and account verification
 * Designed for farmers in developing regions with simple mobile-first workflows
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { handleValidationErrors } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Validation middleware for user registration
const validateRegistration = [
  body('personalInfo.firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('personalInfo.lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('personalInfo.phoneNumber')
    .trim()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage('Please enter a valid phone number'),
  
  body('personalInfo.email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email address'),
  
  body('authentication.password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('location.address')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Address must be at least 5 characters long'),
  
  body('location.coordinates.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('location.coordinates.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('location.country')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Country is required'),
  
  body('farmingProfile.experienceLevel')
    .isIn(['beginner', 'intermediate', 'experienced', 'expert'])
    .withMessage('Experience level must be one of: beginner, intermediate, experienced, expert'),
  
  body('farmingProfile.farmingType')
    .isIn(['crop_only', 'livestock_only', 'mixed_farming', 'organic', 'subsistence', 'commercial'])
    .withMessage('Invalid farming type'),
  
  body('preferences.language')
    .optional()
    .isIn(['en', 'es', 'fr', 'hi', 'sw', 'am', 'yo', 'ha'])
    .withMessage('Unsupported language')
];

// Validation middleware for login
const validateLogin = [
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validation middleware for password reset request
const validatePasswordResetRequest = [
  body('phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
];

// Validation middleware for password reset
const validatePasswordReset = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
];

/**
 * @route   POST /api/auth/register
 * @desc    Register a new farmer user
 * @access  Public
 */
router.post('/register', validateRegistration, handleValidationErrors, asyncHandler(async (req, res) => {
  const {
    personalInfo,
    authentication,
    location,
    farmingProfile,
    preferences = {}
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ 
    'personalInfo.phoneNumber': personalInfo.phoneNumber 
  });

  if (existingUser) {
    return res.status(400).json({
      status: 'error',
      message: 'A user with this phone number already exists',
      timestamp: new Date().toISOString()
    });
  }

  // Check email if provided
  if (personalInfo.email) {
    const existingEmail = await User.findOne({ 
      'personalInfo.email': personalInfo.email 
    });

    if (existingEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'A user with this email already exists',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Create new user
  const newUser = new User({
    personalInfo,
    authentication,
    location,
    farmingProfile,
    preferences: {
      ...preferences,
      language: preferences.language || 'en'
    },
    appUsage: {
      registrationDate: new Date(),
      lastActiveDate: new Date()
    },
    status: {
      isActive: true,
      subscriptionType: 'free'
    }
  });

  await newUser.save();

  // Generate JWT token
  const token = jwt.sign(
    { 
      userId: newUser._id,
      phoneNumber: newUser.personalInfo.phoneNumber 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  // Remove sensitive information before sending response
  const userResponse = newUser.toJSON();
  delete userResponse.authentication;

  logger.info('New user registered successfully', {
    userId: newUser._id,
    phoneNumber: personalInfo.phoneNumber,
    country: location.country
  });

  res.status(201).json({
    status: 'success',
    message: 'User registered successfully',
    data: {
      user: userResponse,
      token,
      expiresIn: process.env.JWT_EXPIRE || '7d'
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return token
 * @access  Public
 */
router.post('/login', validateLogin, handleValidationErrors, asyncHandler(async (req, res) => {
  const { phoneNumber, password } = req.body;

  // Find user and include password for comparison
  const user = await User.findOne({ 
    'personalInfo.phoneNumber': phoneNumber 
  }).select('+authentication.password +authentication.loginAttempts +authentication.lockUntil');

  if (!user) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid phone number or password',
      timestamp: new Date().toISOString()
    });
  }

  // Check if account is locked
  if (user.authentication.isLocked) {
    return res.status(423).json({
      status: 'error',
      message: 'Account is temporarily locked due to too many failed login attempts. Please try again later.',
      timestamp: new Date().toISOString()
    });
  }

  // Check if account is active
  if (!user.status.isActive) {
    return res.status(403).json({
      status: 'error',
      message: 'Account is deactivated. Please contact support.',
      timestamp: new Date().toISOString()
    });
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    // Increment login attempts
    await user.incLoginAttempts();
    
    logger.warn('Failed login attempt', {
      phoneNumber,
      attempts: user.authentication.loginAttempts + 1
    });

    return res.status(401).json({
      status: 'error',
      message: 'Invalid phone number or password',
      timestamp: new Date().toISOString()
    });
  }

  // Reset login attempts on successful login
  await user.resetLoginAttempts();

  // Generate JWT token
  const token = jwt.sign(
    { 
      userId: user._id,
      phoneNumber: user.personalInfo.phoneNumber 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  // Update last active date
  user.appUsage.lastActiveDate = new Date();
  await user.save();

  // Remove sensitive information
  const userResponse = user.toJSON();
  delete userResponse.authentication;

  logger.info('User logged in successfully', {
    userId: user._id,
    phoneNumber
  });

  res.json({
    status: 'success',
    message: 'Login successful',
    data: {
      user: userResponse,
      token,
      expiresIn: process.env.JWT_EXPIRE || '7d'
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset token
 * @access  Public
 */
router.post('/forgot-password', validatePasswordResetRequest, handleValidationErrors, asyncHandler(async (req, res) => {
  const { phoneNumber } = req.body;

  const user = await User.findOne({ 
    'personalInfo.phoneNumber': phoneNumber 
  });

  if (!user) {
    // Don't reveal if user exists or not for security
    return res.json({
      status: 'success',
      message: 'If a user with this phone number exists, a password reset token has been sent.',
      timestamp: new Date().toISOString()
    });
  }

  // Generate reset token
  const resetToken = user.createPasswordResetToken();
  await user.save();

  // In a real implementation, you would send the token via SMS
  // For now, we'll log it and include it in the response (only for development)
  logger.info('Password reset token generated', {
    userId: user._id,
    phoneNumber,
    token: resetToken // Remove this in production
  });

  // In production, send SMS with reset token here
  // await smsService.sendPasswordResetToken(phoneNumber, resetToken);

  res.json({
    status: 'success',
    message: 'If a user with this phone number exists, a password reset token has been sent.',
    // Remove this in production - token should only be sent via SMS
    ...(process.env.NODE_ENV === 'development' && { resetToken }),
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
router.post('/reset-password', validatePasswordReset, handleValidationErrors, asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  // Hash the token to compare with stored hash
  const hashedToken = require('crypto')
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    'authentication.passwordResetToken': hashedToken,
    'authentication.passwordResetExpires': { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid or expired password reset token',
      timestamp: new Date().toISOString()
    });
  }

  // Set new password
  user.authentication.password = newPassword;
  user.authentication.passwordResetToken = undefined;
  user.authentication.passwordResetExpires = undefined;
  user.authentication.loginAttempts = 0;
  user.authentication.lockUntil = undefined;

  await user.save();

  logger.info('Password reset successfully', {
    userId: user._id,
    phoneNumber: user.personalInfo.phoneNumber
  });

  res.json({
    status: 'success',
    message: 'Password has been reset successfully. Please login with your new password.',
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/auth/verify-token
 * @desc    Verify if JWT token is valid
 * @access  Private
 */
router.get('/verify-token', asyncHandler(async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'No token provided',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.status.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token or user not found',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      status: 'success',
      message: 'Token is valid',
      data: {
        userId: user._id,
        phoneNumber: user.personalInfo.phoneNumber,
        isActive: user.status.isActive
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh-token', asyncHandler(async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'No token provided',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Verify the existing token (even if expired)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.status.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found or inactive',
        timestamp: new Date().toISOString()
      });
    }

    // Generate new token
    const newToken = jwt.sign(
      { 
        userId: user._id,
        phoneNumber: user.personalInfo.phoneNumber 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Update last active date
    user.appUsage.lastActiveDate = new Date();
    await user.save();

    res.json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @route   GET /api/auth/me
 * @desc    Get current user information
 * @access  Private
 */
router.get('/me', asyncHandler(async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'No token provided',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.status.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found or inactive',
        timestamp: new Date().toISOString()
      });
    }

    // Remove sensitive information
    const userResponse = user.toJSON();
    delete userResponse.authentication;

    res.json({
      status: 'success',
      data: {
        user: userResponse
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
      timestamp: new Date().toISOString()
    });
  }
}));

module.exports = router;