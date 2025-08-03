/**
 * Farm Management Routes for AgriSphere
 * Handles farm creation, field management, soil data, and farm analytics
 * Designed for comprehensive farm management and optimization
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');
const Farm = require('../models/Farm');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { handleValidationErrors } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const geocodingApi = require('../services/geocodingApi');
const soilApi = require('../services/soilApi');

const router = express.Router();

// Use proper authentication middleware
const { authenticateUser } = require('../middleware/auth');

// Validation middleware for farm creation
const validateFarmCreation = [
  body('farmInfo.name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Farm name must be between 2 and 100 characters'),
  
  body('farmInfo.farmType')
    .isIn(['crop_farm', 'livestock_farm', 'mixed_farm', 'organic_farm', 'greenhouse', 'orchard', 'vegetable_garden'])
    .withMessage('Invalid farm type'),
  
  body('farmInfo.totalArea.value')
    .isFloat({ min: 0.01 })
    .withMessage('Total area must be greater than 0'),
  
  body('farmInfo.totalArea.unit')
    .isIn(['hectares', 'acres', 'square_meters', 'square_feet'])
    .withMessage('Invalid area unit'),
  
  body('location.address')
    .trim()
    .isLength({ min: 5 })
    .withMessage('Address must be at least 5 characters'),
  
  body('location.centerPoint.coordinates')
    .isArray({ min: 2, max: 2 })
    .withMessage('Center point coordinates must be [longitude, latitude]'),
  
  body('location.centerPoint.coordinates.*')
    .isFloat()
    .withMessage('Coordinates must be valid numbers'),
  
  body('location.boundary.coordinates')
    .isArray()
    .withMessage('Boundary coordinates are required')
];

// Validation middleware for field addition
const validateFieldAddition = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Field name must be between 2 and 50 characters'),
  
  body('area.value')
    .isFloat({ min: 0.01 })
    .withMessage('Field area must be greater than 0'),
  
  body('area.unit')
    .isIn(['hectares', 'acres', 'square_meters'])
    .withMessage('Invalid area unit')
];

/**
 * @route   POST /api/farm
 * @desc    Create a new farm
 * @access  Private
 */
router.post('/', authenticateUser, validateFarmCreation, handleValidationErrors, asyncHandler(async (req, res) => {
  const farmData = {
    ...req.body,
    owner: req.user._id
  };

  // Validate farm location if coordinates provided
  const { coordinates } = farmData.location.centerPoint;
  const [longitude, latitude] = coordinates;

  try {
    // Verify location with geocoding service
    const locationValidation = await geocodingApi.validateFarmLocation(latitude, longitude);
    
    if (!locationValidation.isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid farm location coordinates',
        timestamp: new Date().toISOString()
      });
    }

    // Enhance farm data with location details
    farmData.location.timezone = locationValidation.administrative.timezone;
    farmData.environmental = {
      riskFactors: []
    };

  } catch (error) {
    logger.warn('Location validation failed, proceeding with farm creation', {
      userId: req.user._id,
      coordinates: [longitude, latitude],
      error: error.message
    });
  }

  // Create the farm
  const farm = new Farm(farmData);
  await farm.save();

  // Update user's farming profile
  if (!req.user.farmingProfile.totalFarmArea.value) {
    req.user.farmingProfile.totalFarmArea = farmData.farmInfo.totalArea;
    await req.user.save();
  }

  logger.info('New farm created', {
    farmId: farm._id,
    userId: req.user._id,
    farmName: farm.farmInfo.name,
    area: farm.farmInfo.totalArea
  });

  res.status(201).json({
    status: 'success',
    message: 'Farm created successfully',
    data: {
      farm
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/farm
 * @desc    Get all farms for the authenticated user
 * @access  Private
 */
router.get('/', authenticateUser, asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    farmType, 
    isActive = true 
  } = req.query;

  // Debug: Log user information
  console.log('🔍 Farm API Debug:');
  console.log('  req.user:', req.user);
  console.log('  req.user._id:', req.user._id);
  console.log('  req.user._id type:', typeof req.user._id);
  console.log('  req.user._id toString:', req.user._id.toString());

  const query = { 
    owner: req.user._id
  };
  
  console.log('  Query:', JSON.stringify(query, null, 2));
  console.log('  Query owner type:', typeof query.owner);
  console.log('  Query owner is ObjectId:', query.owner instanceof mongoose.Types.ObjectId);
  
  // Temporarily remove isActive filter to debug
  // if (isActive !== undefined) {
  //   query['status.isActive'] = isActive === 'true' || isActive === true;
  // }

  if (farmType) {
    query['farmInfo.farmType'] = farmType;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      {
        path: 'owner',
        select: 'personalInfo.firstName personalInfo.lastName'
      }
    ]
  };

  const farms = await Farm.find(query)
    .sort(options.sort);

  const total = await Farm.countDocuments(query);

  res.json({
    status: 'success',
    data: {
      farms,
      pagination: {
        currentPage: options.page,
        totalPages: Math.ceil(total / options.limit),
        totalFarms: total,
        hasNextPage: options.page < Math.ceil(total / options.limit),
        hasPrevPage: options.page > 1
      }
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/farm/:farmId
 * @desc    Get a specific farm by ID
 * @access  Private
 */
router.get('/:farmId', authenticateUser, asyncHandler(async (req, res) => {
  const { farmId } = req.params;

  const farm = await Farm.findOne({
    _id: farmId,
    owner: req.user._id
  }).populate('owner', 'personalInfo.firstName personalInfo.lastName');

  if (!farm) {
    return res.status(404).json({
      status: 'error',
      message: 'Farm not found',
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    status: 'success',
    data: {
      farm
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   PUT /api/farm/:farmId
 * @desc    Update farm information
 * @access  Private
 */
router.put('/:farmId', authenticateUser, asyncHandler(async (req, res) => {
  const { farmId } = req.params;
  const updates = req.body;

  const farm = await Farm.findOne({
    _id: farmId,
    owner: req.user._id
  });

  if (!farm) {
    return res.status(404).json({
      status: 'error',
      message: 'Farm not found',
      timestamp: new Date().toISOString()
    });
  }

  // Update farm data
  Object.keys(updates).forEach(key => {
    if (key !== 'owner' && updates[key] !== undefined) {
      farm[key] = updates[key];
    }
  });

  farm.status.lastUpdated = new Date();
  await farm.save();

  logger.info('Farm updated', {
    farmId: farm._id,
    userId: req.user._id,
    updatedFields: Object.keys(updates)
  });

  res.json({
    status: 'success',
    message: 'Farm updated successfully',
    data: {
      farm
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   DELETE /api/farm/:farmId
 * @desc    Delete a farm
 * @access  Private
 */
router.delete('/:farmId', authenticateUser, asyncHandler(async (req, res) => {
  const { farmId } = req.params;

  // Validate farmId
  if (!mongoose.Types.ObjectId.isValid(farmId)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid farm ID',
      timestamp: new Date().toISOString()
    });
  }

  const farm = await Farm.findOne({
    _id: farmId,
    owner: req.user._id
  });

  if (!farm) {
    return res.status(404).json({
      status: 'error',
      message: 'Farm not found',
      timestamp: new Date().toISOString()
    });
  }

  // Delete the farm
  await Farm.findByIdAndDelete(farmId);

  logger.info('Farm deleted', {
    farmId: farm._id,
    userId: req.user._id,
    farmName: farm.farmInfo.name
  });

  res.json({
    status: 'success',
    message: 'Farm deleted successfully',
    data: {
      deletedFarmId: farmId
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   POST /api/farm/:farmId/fields
 * @desc    Add a new field to a farm
 * @access  Private
 */
router.post('/:farmId/fields', authenticateUser, validateFieldAddition, handleValidationErrors, asyncHandler(async (req, res) => {
  const { farmId } = req.params;
  const fieldData = req.body;

  const farm = await Farm.findOne({
    _id: farmId,
    owner: req.user._id
  });

  if (!farm) {
    return res.status(404).json({
      status: 'error',
      message: 'Farm not found',
      timestamp: new Date().toISOString()
    });
  }

  // Generate unique field ID
  const fieldId = `field_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  const newField = {
    fieldId,
    ...fieldData,
    status: 'active'
  };

  await farm.addField(newField);

  logger.info('New field added to farm', {
    farmId: farm._id,
    fieldId,
    userId: req.user._id,
    fieldName: fieldData.name
  });

  res.status(201).json({
    status: 'success',
    message: 'Field added successfully',
    data: {
      field: newField,
      farm: farm
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/farm/:farmId/soil-analysis
 * @desc    Get soil analysis for a farm
 * @access  Private
 */
router.get('/:farmId/soil-analysis', authenticateUser, asyncHandler(async (req, res) => {
  const { farmId } = req.params;

  const farm = await Farm.findOne({
    _id: farmId,
    owner: req.user._id
  });

  if (!farm) {
    return res.status(404).json({
      status: 'error',
      message: 'Farm not found',
      timestamp: new Date().toISOString()
    });
  }

  const [longitude, latitude] = farm.location.centerPoint.coordinates;

  try {
    // Get comprehensive soil data
    const [soilProperties, soilNutrients, soilHealth] = await Promise.all([
      soilApi.getSoilProperties(latitude, longitude),
      soilApi.getSoilNutrients(latitude, longitude),
      soilApi.getSoilHealth(latitude, longitude)
    ]);

    const soilAnalysis = {
      properties: soilProperties,
      nutrients: soilNutrients,
      health: soilHealth,
      lastUpdated: farm.soilData?.lastTested || null,
      recommendations: soilHealth.recommendations || []
    };

    // Update farm's soil data
    if (soilProperties && soilNutrients) {
      const soilUpdateData = {
        lastTested: new Date(),
        testingMethod: 'digital_sensor',
        composition: {
          organicMatter: parseFloat(soilHealth.indicators?.organicMatter?.percentage) || 0
        },
        chemistry: {
          pH: {
            value: parseFloat(soilProperties.properties?.pH) || 7.0,
            date: new Date()
          }
        },
        nutrients: {
          nitrogen: {
            value: soilNutrients.nutrients?.nitrogen?.value || 0,
            status: soilNutrients.nutrients?.nitrogen?.status || 'unknown',
            testDate: new Date()
          },
          phosphorus: {
            value: soilNutrients.nutrients?.phosphorus?.value || 0,
            status: soilNutrients.nutrients?.phosphorus?.status || 'unknown',
            testDate: new Date()
          },
          potassium: {
            value: soilNutrients.nutrients?.potassium?.value || 0,
            status: soilNutrients.nutrients?.potassium?.status || 'unknown',
            testDate: new Date()
          }
        }
      };

      await farm.updateSoilData(soilUpdateData);
    }

    logger.info('Soil analysis retrieved', {
      farmId: farm._id,
      userId: req.user._id,
      coordinates: [longitude, latitude]
    });

    res.json({
      status: 'success',
      data: {
        soilAnalysis,
        farmId: farm._id
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to retrieve soil analysis', {
      farmId: farm._id,
      userId: req.user._id,
      error: error.message
    });

    res.status(503).json({
      status: 'error',
      message: 'Soil analysis service temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @route   POST /api/farm/:farmId/soil-data
 * @desc    Update soil data for a farm
 * @access  Private
 */
router.post('/:farmId/soil-data', authenticateUser, asyncHandler(async (req, res) => {
  const { farmId } = req.params;
  const soilData = req.body;

  const farm = await Farm.findOne({
    _id: farmId,
    owner: req.user._id
  });

  if (!farm) {
    return res.status(404).json({
      status: 'error',
      message: 'Farm not found',
      timestamp: new Date().toISOString()
    });
  }

  await farm.updateSoilData(soilData);

  logger.info('Soil data updated', {
    farmId: farm._id,
    userId: req.user._id,
    dataKeys: Object.keys(soilData)
  });

  res.json({
    status: 'success',
    message: 'Soil data updated successfully',
    data: {
      soilData: farm.soilData
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/farm/:farmId/analytics
 * @desc    Get farm analytics and insights
 * @access  Private
 */
router.get('/:farmId/analytics', authenticateUser, asyncHandler(async (req, res) => {
  const { farmId } = req.params;
  const { timeRange = '30' } = req.query;

  const farm = await Farm.findOne({
    _id: farmId,
    owner: req.user._id
  });

  if (!farm) {
    return res.status(404).json({
      status: 'error',
      message: 'Farm not found',
      timestamp: new Date().toISOString()
    });
  }

  // Calculate analytics
  const analytics = {
    overview: {
      totalArea: farm.farmInfo.totalArea,
      cultivatedArea: farm.cultivatedArea,
      utilizationRate: farm.farmInfo.totalArea.value > 0 ? 
        ((farm.cultivatedArea || 0) / farm.farmInfo.totalArea.value * 100).toFixed(1) : 0,
      activeFields: farm.fields?.filter(f => f.status === 'active').length || 0,
      totalFields: farm.fields?.length || 0,
      healthScore: farm.healthScore || 0
    },
    crops: {
      totalCrops: farm.currentCrops?.length || 0,
      cropDiversity: [...new Set(farm.currentCrops?.map(c => c.cropName) || [])].length,
      currentCrops: farm.currentCrops?.map(crop => ({
        name: crop.cropName,
        variety: crop.variety,
        area: crop.area,
        growthStage: crop.growthStage,
        healthStatus: crop.healthStatus?.overall,
        daysToHarvest: crop.expectedHarvestDate ? 
          Math.ceil((new Date(crop.expectedHarvestDate) - new Date()) / (1000 * 60 * 60 * 24)) : null
      })) || []
    },
    soil: {
      lastTested: farm.soilData?.lastTested,
      pH: farm.soilData?.chemistry?.pH?.value,
      nutrientStatus: {
        nitrogen: farm.soilData?.nutrients?.nitrogen?.status,
        phosphorus: farm.soilData?.nutrients?.phosphorus?.status,
        potassium: farm.soilData?.nutrients?.potassium?.status
      },
      recommendations: farm.soilData?.recommendations?.filter(r => r.status === 'pending').length || 0
    },
    infrastructure: {
      waterSources: farm.infrastructure?.waterSources?.length || 0,
      storage: farm.infrastructure?.storage?.length || 0,
      equipment: farm.infrastructure?.equipment?.length || 0,
      connectivity: farm.infrastructure?.connectivity || {}
    },
    dataQuality: {
      completeness: farm.status?.dataQuality?.completeness || 0,
      lastUpdated: farm.status?.lastUpdated
    }
  };

  // Add trend data if timeRange is specified
  if (parseInt(timeRange) > 0) {
    analytics.trends = {
      period: `${timeRange} days`,
      // In a real implementation, you would calculate trends from historical data
      productivity: 'stable',
      soilHealth: 'improving',
      waterUsage: 'decreasing'
    };
  }

  res.json({
    status: 'success',
    data: {
      analytics,
      farmId: farm._id
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/farm/nearby
 * @desc    Find nearby farms for community features
 * @access  Private
 */
router.get('/nearby/:lat/:lon', authenticateUser, asyncHandler(async (req, res) => {
  const { lat, lon } = req.params;
  const { radius = 50 } = req.query; // Default 50km radius

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid coordinates provided',
      timestamp: new Date().toISOString()
    });
  }

  const nearbyFarms = await Farm.findNearby(latitude, longitude, parseInt(radius))
    .populate('owner', 'personalInfo.firstName personalInfo.lastName location.country')
    .select('farmInfo.name farmInfo.farmType farmInfo.totalArea location.centerPoint currentCrops');

  res.json({
    status: 'success',
    data: {
      nearbyFarms,
      searchCenter: { latitude, longitude },
      radius: parseInt(radius),
      count: nearbyFarms.length
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   DELETE /api/farm/:farmId
 * @desc    Delete (deactivate) a farm
 * @access  Private
 */
router.delete('/:farmId', authenticateUser, asyncHandler(async (req, res) => {
  const { farmId } = req.params;

  const farm = await Farm.findOne({
    _id: farmId,
    owner: req.user._id
  });

  if (!farm) {
    return res.status(404).json({
      status: 'error',
      message: 'Farm not found',
      timestamp: new Date().toISOString()
    });
  }

  // Soft delete - deactivate instead of removing
  farm.status.isActive = false;
  farm.status.lastUpdated = new Date();
  await farm.save();

  logger.info('Farm deactivated', {
    farmId: farm._id,
    userId: req.user._id,
    farmName: farm.farmInfo.name
  });

  res.json({
    status: 'success',
    message: 'Farm deactivated successfully',
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;