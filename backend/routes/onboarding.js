/**
 * Onboarding Routes for AgriSphere
 * Handles the complete user onboarding flow including user registration,
 * farm setup, and initial data collection
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// Models
const User = require('../models/User');
const Farm = require('../models/Farm');

// Services
const soilApi = require('../services/soilApi');
const weatherApi = require('../services/weatherApi');
const geocodingApi = require('../services/geocodingApi');

// Middleware
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateUser } = require('../middleware/auth');
const logger = require('../utils/logger');
const { success, error } = require('../utils/apiResponse');

/**
 * Validation rules for onboarding completion
 */
const validateOnboardingData = [
  body('personalInfo.firstName')
    .notEmpty()
    .withMessage('First name is required')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
    
  body('personalInfo.lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
    
  body('personalInfo.phoneNumber')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage('Please provide a valid phone number'),
    
  body('personalInfo.email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address'),
    
  body('authentication.password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
    
  body('location.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Location coordinates must be an array of [longitude, latitude]'),
    
  body('farmBoundary.coordinates')
    .isArray({ min: 3 })
    .withMessage('Farm boundary must have at least 3 coordinates'),
    
  body('farmBoundary.area')
    .isFloat({ min: 0.01 })
    .withMessage('Farm area must be greater than 0.01 hectares'),
    
  body('crops')
    .isArray({ min: 1 })
    .withMessage('At least one crop must be selected'),
    
  body('language')
    .isIn(['en', 'es', 'fr', 'hi', 'sw', 'am', 'yo', 'ha'])
    .withMessage('Invalid language selection')
];

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(
      res,
      'Validation failed',
      400,
      errors.array()
    );
  }
  next();
};

/**
 * @route   POST /api/onboarding/complete
 * @desc    Complete the entire onboarding process
 * @access  Public
 */
router.post('/complete', validateOnboardingData, handleValidationErrors, asyncHandler(async (req, res) => {
  const {
    personalInfo,
    authentication,
    location,
    farmBoundary,
    crops,
    language,
    preferences = {}
  } = req.body;

  logger.info('Starting onboarding completion process', {
    phoneNumber: personalInfo.phoneNumber,
    farmArea: farmBoundary.area,
    cropCount: crops.length
  });

  // Check if user already exists
  const existingUser = await User.findOne({ 
    'personalInfo.phoneNumber': personalInfo.phoneNumber 
  });
  
  if (existingUser) {
    return error(
      res,
      'A user with this phone number already exists',
      409
    );
  }

  try {
    // Step 1: Validate and enhance location data
    const [longitude, latitude] = location.coordinates;
    let enhancedLocation = { ...location };
    
    try {
      // Get detailed location information
      const locationDetails = await geocodingApi.getAdministrativeInfo(latitude, longitude);
      enhancedLocation = {
        ...enhancedLocation,
        country: locationDetails.country || location.country,
        region: locationDetails.region || location.region,
        district: locationDetails.district,
        timezone: locationDetails.timezone || 'UTC'
      };
    } catch (geoError) {
      logger.warn('Failed to enhance location data', { error: geoError.message });
    }

    // Step 2: Get initial soil data for the farm
    let soilData = {};
    try {
      const soilInfo = await soilApi.getSoilData(latitude, longitude);
      soilData = {
        soilType: soilInfo.soilType || 'unknown',
        ph: soilInfo.ph || null,
        organicMatter: soilInfo.organicMatter || null,
        nitrogen: soilInfo.nitrogen || null,
        phosphorus: soilInfo.phosphorus || null,
        potassium: soilInfo.potassium || null,
        lastUpdated: new Date(),
        source: 'soil_api',
        dataQuality: 'medium'
      };
    } catch (soilError) {
      logger.warn('Failed to fetch initial soil data', { error: soilError.message });
      soilData = {
        soilType: 'unknown',
        lastUpdated: new Date(),
        source: 'user_input',
        dataQuality: 'low'
      };
    }

    // Step 3: Get initial weather data
    let weatherData = {};
    try {
      const currentWeather = await weatherApi.getCurrentWeather(latitude, longitude);
      weatherData = {
        lastWeatherUpdate: new Date(),
        currentConditions: {
          temperature: currentWeather.current.temperature,
          humidity: currentWeather.current.humidity,
          description: currentWeather.current.description
        }
      };
    } catch (weatherError) {
      logger.warn('Failed to fetch initial weather data', { error: weatherError.message });
    }

    // Step 4: Create the user account
    const newUser = new User({
      personalInfo: {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        phoneNumber: personalInfo.phoneNumber,
        email: personalInfo.email || null
      },
      authentication: {
        password: authentication.password
      },
      location: {
        address: enhancedLocation.address || 'Farm Location',
        coordinates: {
          latitude: latitude,
          longitude: longitude
        },
        country: enhancedLocation.country || 'Unknown',
        region: enhancedLocation.region || 'Unknown',
        district: enhancedLocation.district,
        timezone: enhancedLocation.timezone || 'UTC'
      },
      farmingProfile: {
        experienceLevel: personalInfo.farmingExperience || 'beginner',
        farmingType: 'mixed',
        totalFarmArea: {
          value: farmBoundary.area,
          unit: 'hectares'
        },
        primaryCrops: crops.map(crop => crop.name)
      },
      preferences: {
        language: language || 'en',
        units: {
          temperature: 'celsius',
          measurement: 'metric',
          currency: 'USD'
        },
        notifications: {
          weather: true,
          irrigation: true,
          pests: true,
          harvest: true,
          ...preferences.notifications
        }
      },
      appUsage: {
        registrationDate: new Date(),
        lastActiveDate: new Date(),
        onboardingCompleted: true
      },
      status: {
        isActive: true,
        subscriptionType: 'free'
      }
    });

    // Save the user
    await newUser.save();
    logger.info('User created successfully', { userId: newUser._id });

    // Step 5: Create the farm
    const newFarm = new Farm({
      owner: newUser._id,
      farmInfo: {
        name: farmBoundary.name || `${personalInfo.firstName}'s Farm`,
        description: `Farm managed by ${personalInfo.firstName} ${personalInfo.lastName}`,
        farmType: 'mixed_farm',
        totalArea: {
          value: farmBoundary.area,
          unit: 'hectares'
        }
      },
      location: {
        centerPoint: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        boundary: {
          type: 'Polygon',
          coordinates: [farmBoundary.coordinates.map(coord => [coord[1], coord[0]])] // Convert lat,lng to lng,lat
        },
        address: enhancedLocation.address || 'Farm Location',
        country: enhancedLocation.country || 'Unknown',
        region: enhancedLocation.region || 'Unknown',
        district: enhancedLocation.district,
        timezone: enhancedLocation.timezone || 'UTC'
      },
      fields: [{
        fieldId: 'main_field',
        name: 'Main Field',
        area: {
          value: farmBoundary.area,
          unit: 'hectares'
        },
        boundary: {
          type: 'Polygon',
          coordinates: [farmBoundary.coordinates.map(coord => [coord[1], coord[0]])]
        },
        soilType: soilData.soilType || 'unknown',
        status: 'active'
      }],
      soilData: soilData,
      currentCrops: crops.map(crop => ({
        fieldId: 'main_field',
        cropName: crop.name,
        variety: crop.variety || '',
        plantingDate: new Date(crop.plantingDate),
        growthStage: crop.growthStage || 'seedbed_preparation',
        area: {
          value: crop.area || farmBoundary.area / crops.length,
          unit: 'hectares'
        },
        healthStatus: {
          overall: 'good',
          lastAssessment: new Date()
        }
      })),
      environmental: {
        climate: {
          averageRainfall: 0,
          averageTemperature: weatherData.currentConditions?.temperature || 25,
          humidityLevel: weatherData.currentConditions?.humidity || 60
        },
        lastWeatherUpdate: weatherData.lastWeatherUpdate || new Date()
      },
      status: {
        isActive: true,
        lastUpdated: new Date(),
        verificationStatus: 'unverified',
        dataQuality: {
          completeness: 75, // Good initial setup
          accuracy: 'medium',
          lastValidated: new Date()
        }
      }
    });

    // Save the farm
    await newFarm.save();
    logger.info('Farm created successfully', { farmId: newFarm._id, userId: newUser._id });

    // Step 6: Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser._id,
        phoneNumber: newUser.personalInfo.phoneNumber 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Step 7: Prepare response data
    const userResponse = newUser.toJSON();
    delete userResponse.authentication; // Remove sensitive data

    const farmResponse = {
      id: newFarm._id,
      name: newFarm.farmInfo.name,
      area: newFarm.farmInfo.totalArea,
      location: newFarm.location.address,
      cropCount: newFarm.currentCrops.length,
      status: newFarm.status.verificationStatus
    };

    logger.info('Onboarding completed successfully', {
      userId: newUser._id,
      farmId: newFarm._id,
      phoneNumber: personalInfo.phoneNumber,
      farmArea: farmBoundary.area,
      cropCount: crops.length
    });

    // Send success response
    res.status(201).json(success(
      'Onboarding completed successfully! Welcome to AgriSphere!',
      {
        user: userResponse,
        farm: farmResponse,
        token,
        expiresIn: process.env.JWT_EXPIRE || '7d',
        onboardingComplete: true
      }
    ));

  } catch (err) {
    logger.error('Onboarding completion failed', {
      error: err.message,
      phoneNumber: personalInfo.phoneNumber,
      stack: err.stack
    });

    // Clean up if user was created but farm creation failed
    if (err.name === 'ValidationError' && err.message.includes('Farm')) {
      try {
        await User.findOneAndDelete({ 'personalInfo.phoneNumber': personalInfo.phoneNumber });
        logger.info('Cleaned up user after farm creation failure');
      } catch (cleanupError) {
        logger.error('Failed to cleanup user after farm creation failure', { error: cleanupError.message });
      }
    }

    error(
      res,
      'Failed to complete onboarding. Please try again.',
      500,
      {
        message: err.message,
        code: 'ONBOARDING_FAILED'
      }
    );
  }
}));

/**
 * @route   GET /api/onboarding/soil-preview
 * @desc    Get soil data preview for a location
 * @access  Public
 */
router.get('/soil-preview', asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return error(
      res,
      'Latitude and longitude are required',
      400
    );
  }

  try {
    const soilData = await soilApi.getSoilData(parseFloat(lat), parseFloat(lng));
    
    res.json(success(
      'Soil data preview retrieved successfully',
      {
        soilType: soilData.soilType,
        ph: soilData.ph,
        organicMatter: soilData.organicMatter,
        suitableFor: soilData.suitableFor || ['maize', 'beans', 'vegetables'],
        recommendations: soilData.recommendations || []
      }
    ));
  } catch (err) {
    logger.error('Failed to get soil preview', { error: err.message, lat, lng });
    
    res.json(success(
      'Soil data preview (limited)',
      {
        soilType: 'unknown',
        ph: null,
        organicMatter: null,
        suitableFor: ['maize', 'beans', 'vegetables'],
        recommendations: ['Soil testing recommended for optimal results'],
        note: 'Detailed soil data will be available after account creation'
      }
    ));
  }
}));

/**
 * @route   PUT /api/onboarding/update
 * @desc    Update existing user's onboarding data (farm, crops, etc.)
 * @access  Private (requires authentication)
 */
router.put('/update', authenticateUser, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    location,
    farmBoundary,
    crops,
    language,
    preferences = {}
  } = req.body;

  logger.info('Updating existing user onboarding data', {
    userId,
    farmArea: farmBoundary.area,
    cropCount: crops.length
  });

  try {
    // Step 1: Update user's location
    const [longitude, latitude] = location.coordinates;
    let enhancedLocation = { ...location };
    
    try {
      // Get detailed location information
      const locationDetails = await geocodingApi.getAdministrativeInfo(latitude, longitude);
      enhancedLocation = {
        ...enhancedLocation,
        country: locationDetails.country || location.country,
        region: locationDetails.region || location.region,
        district: locationDetails.district,
        timezone: locationDetails.timezone || 'UTC'
      };
    } catch (geoError) {
      logger.warn('Failed to enhance location data', { error: geoError.message });
    }

    // Step 2: Get initial soil data for the farm
    let soilData = {};
    try {
      const soilInfo = await soilApi.getSoilData(latitude, longitude);
      soilData = {
        soilType: soilInfo.soilType || 'unknown',
        ph: soilInfo.ph || null,
        organicMatter: soilInfo.organicMatter || null,
        nitrogen: soilInfo.nitrogen || null,
        phosphorus: soilInfo.phosphorus || null,
        potassium: soilInfo.potassium || null,
        lastUpdated: new Date(),
        source: 'soil_api',
        dataQuality: 'medium'
      };
    } catch (soilError) {
      logger.warn('Failed to fetch initial soil data', { error: soilError.message });
      soilData = {
        soilType: 'unknown',
        lastUpdated: new Date(),
        source: 'user_input',
        dataQuality: 'low'
      };
    }

    // Step 3: Create or update farm
    const farmData = {
      owner: userId,
      farmInfo: {
        name: farmBoundary.name || 'My Farm',
        farmType: 'crop_farm', // Default to crop farm
        totalArea: {
          value: farmBoundary.area,
          unit: 'hectares'
        }
      },
      location: {
        address: location.address,
        centerPoint: {
          type: 'Point',
          coordinates: [longitude, latitude] // [longitude, latitude] format
        },
        boundary: {
          type: 'Polygon',
          coordinates: [(() => {
            // Ensure polygon is closed (first and last point are the same)
            const coords = farmBoundary.coordinates;
            if (coords.length >= 3) {
              // Check if first and last points are the same
              const firstPoint = coords[0];
              const lastPoint = coords[coords.length - 1];
              
              if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
                // Add the first point at the end to close the polygon
                return [...coords, firstPoint];
              }
              return coords;
            }
            return coords;
          })()]
        },
        country: enhancedLocation.country,
        region: enhancedLocation.region,
        district: enhancedLocation.district,
        timezone: enhancedLocation.timezone || 'UTC'
      },
      soilData: {
        ...soilData,
        lastTested: new Date()
      },
      currentCrops: crops.map(crop => ({
        cropName: crop.name,
        plantingDate: new Date(), // Default to current date
        expectedHarvestDate: crop.expectedHarvest ? new Date(crop.expectedHarvest) : null,
        area: {
          value: crop.area || farmBoundary.area / crops.length,
          unit: 'hectares'
        },
        growthStage: 'planting'
      })),
      status: 'active'
    };

    // Update user's location
    await User.findByIdAndUpdate(userId, {
      'location': enhancedLocation,
      'preferences.language': language || 'en',
      'preferences.units': preferences.units || 'metric',
      'appUsage.onboardingCompleted': true,
      'appUsage.lastActiveDate': new Date()
    });

    // Create farm
    const farm = new Farm(farmData);
    await farm.save();

    logger.info('User onboarding data updated successfully', {
      userId,
      farmId: farm._id,
      farmArea: farmBoundary.area,
      cropCount: crops.length
    });

    res.json({
      status: 'success',
      message: 'Onboarding data updated successfully',
      data: {
        farm: farm,
        updatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    logger.error('Failed to update onboarding data', { error: err.message, userId });
    
    error(
      res,
      'Failed to update onboarding data. Please try again.',
      500,
      { message: err.message }
    );
  }
}));

/**
 * @route   GET /api/onboarding/geocode
 * @desc    Geocode coordinates to address or address to coordinates
 * @access  Public
 */
router.get('/geocode', asyncHandler(async (req, res) => {
  const { lat, lng, address } = req.query;
  
  console.log('Geocoding request:', { lat, lng, address })
  
  try {
    if (lat && lng) {
      // Reverse geocoding: coordinates to address
      console.log('Reverse geocoding:', lat, lng)
      const locationInfo = await geocodingApi.getAdministrativeInfo(parseFloat(lat), parseFloat(lng));
      console.log('Location info:', locationInfo)
      const address = `${locationInfo.locality || locationInfo.district || 'Unknown City'}, ${locationInfo.region || 'Unknown Region'}, ${locationInfo.country || 'Unknown Country'}`;
      
      res.json({
        status: 'success',
        message: 'Address retrieved successfully',
        data: {
          address: address,
          coordinates: [parseFloat(lng), parseFloat(lat)],
          locationInfo: locationInfo
        },
        timestamp: new Date().toISOString()
      });
    } else if (address) {
      // Forward geocoding: address to coordinates
      const coordinates = await geocodingApi.getCoordinates(address);
      
      res.json({
        status: 'success',
        message: 'Coordinates retrieved successfully',
        data: {
          address: address,
          coordinates: coordinates
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Either lat/lng or address parameter is required',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    logger.error('Geocoding failed', { error: error.message, lat, lng, address });
    
    res.status(500).json({
      status: 'error',
      message: 'Geocoding service unavailable',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @route   GET /api/onboarding/crop-recommendations
 * @desc    Get crop recommendations based on location and farm size
 * @access  Public
 */
router.get('/crop-recommendations', asyncHandler(async (req, res) => {
  const { lat, lng, area, season } = req.query;
  
  if (!lat || !lng) {
    return error(
      res,
      'Latitude and longitude are required',
      400
    );
  }

  try {
    // Get location-based crop recommendations
    const locationInfo = await geocodingApi.getAdministrativeInfo(parseFloat(lat), parseFloat(lng));
    
    // Basic recommendations based on tropical/subtropical regions
    const baseRecommendations = [
      { crop: 'maize', suitability: 'high', reason: 'Staple crop, good market demand' },
      { crop: 'beans', suitability: 'high', reason: 'Nitrogen fixing, good companion crop' },
      { crop: 'tomatoes', suitability: 'medium', reason: 'High value crop, requires more care' },
      { crop: 'cabbage', suitability: 'medium', reason: 'Good for cooler seasons' }
    ];

    res.json(success(
      'Crop recommendations retrieved successfully',
      {
        recommendations: baseRecommendations,
        location: locationInfo.country || 'Unknown',
        farmArea: parseFloat(area) || 1,
        bestSeason: season || 'rainy_season',
        note: 'Detailed recommendations will be available after account creation'
      }
    ));
  } catch (err) {
    logger.error('Failed to get crop recommendations', { error: err.message, lat, lng });
    
    error(
      res,
      'Failed to get crop recommendations',
      500,
      { message: err.message }
    );
  }
}));

module.exports = router;