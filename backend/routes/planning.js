/**
 * Climate-Smart Crop Planning API Routes for AgriSphere
 * Provides intelligent crop recommendations and seasonal planning
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');

const { authenticateUser } = require('../middleware/auth');
const { handleValidationErrors, asyncHandler } = require('../middleware/errorHandler');
const { success, error } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const cropRecommendationService = require('../services/cropRecommendationService');
const Farm = require('../models/Farm');
const User = require('../models/User');

const router = express.Router();

/**
 * @route   POST /api/planning/recommendations
 * @desc    Get personalized crop recommendations for a farm
 * @access  Private
 */
router.post('/recommendations', authenticateUser, [
  body('farmId').custom((value) => {
    // Allow both MongoDB ObjectIds and mock farm IDs for development
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(value)) {
      return true;
    }
    // Allow mock farm IDs (1, 2, 3) for development
    if (process.env.NODE_ENV === 'development' && ['1', '2', '3'].includes(value)) {
      return true;
    }
    throw new Error('Valid farm ID is required');
  }).withMessage('Valid farm ID is required'),
  body('experience').optional().isIn(['beginner', 'intermediate', 'expert']).withMessage('Invalid experience level'),
  body('budget').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid budget category'),
  body('marketAccess').optional().isIn(['local', 'regional', 'national', 'export']).withMessage('Invalid market access'),
  body('riskTolerance').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid risk tolerance')
], handleValidationErrors, asyncHandler(async (req, res) => {
  try {
    const { 
      farmId, 
      experience = 'intermediate', 
      budget = 'medium', 
      marketAccess = 'local',
      riskTolerance = 'medium'
    } = req.body;
    
    // Verify farm ownership or handle mock farms in development
    let farm;
    if (process.env.NODE_ENV === 'development' && ['1', '2', '3'].includes(farmId)) {
      // Mock farm data for development
      const mockFarms = {
        '1': {
          location: { centerPoint: { coordinates: [77.2090, 28.6139] } }, // Delhi coordinates
          farmInfo: { totalArea: { value: 2.5 } },
          fields: [{ soilType: 'clay_loam' }]
        },
        '2': {
          location: { centerPoint: { coordinates: [76.7794, 30.7333] } }, // Chandigarh coordinates
          farmInfo: { totalArea: { value: 1.8 } },
          fields: [{ soilType: 'sandy_loam' }]
        },
        '3': {
          location: { centerPoint: { coordinates: [80.2702, 26.8467] } }, // Lucknow coordinates
          farmInfo: { totalArea: { value: 0.5 } },
          fields: [{ soilType: 'loam' }]
        }
      };
      farm = mockFarms[farmId];
    } else {
      // Real farm lookup
      farm = await Farm.findOne({
        _id: farmId,
        owner: req.user._id
      }).populate('owner', 'profile.experience');

      if (!farm) {
        return error(res, 'Farm not found or access denied', 404);
      }
    }

    // Get farm details
    const { coordinates } = farm.location.centerPoint;
    const [longitude, latitude] = coordinates;
    const farmSize = farm.farmInfo.totalArea.value || 1;
    const farmSoilType = farm.fields?.[0]?.soilType || 'unknown';

    logger.info('Generating crop recommendations', { 
      userId: req.user._id, 
      farmId,
      location: { latitude, longitude }
    });

    // Get crop recommendations
    const recommendations = await cropRecommendationService.getRecommendations({
      latitude,
      longitude,
      farmSize,
      soilType: farmSoilType,
      experience,
      budget,
      marketAccess,
      riskTolerance
    });

    logger.info('Crop recommendations generated successfully', { 
      userId: req.user._id,
      farmId,
      recommendationCount: recommendations.allRecommendations.length
    });

    return success(res, 'Crop recommendations generated successfully', {
      topRecommendations: recommendations.topRecommendations,
      allRecommendations: recommendations.allRecommendations.slice(0, 10),
      seasonalCalendar: recommendations.seasonalCalendar,
      climateAdaptation: recommendations.climateAdaptation,
      environmental: {
        weather: {
          current: recommendations.environmental.weather.current,
          forecast: recommendations.environmental.weather.forecast.slice(0, 5),
          source: recommendations.environmental.weather.source
        },
        soil: recommendations.environmental.soil
      },
      metadata: recommendations.metadata
    });

  } catch (err) {
    logger.error('Crop recommendation generation failed', { 
      error: err.message, 
      userId: req.user._id 
    });
    return error(res, 'Failed to generate crop recommendations. Please try again.', 500);
  }
}));

/**
 * @route   GET /api/planning/crop-details/:cropType
 * @desc    Get detailed information about a specific crop
 * @access  Private
 */
router.get('/crop-details/:cropType', authenticateUser, asyncHandler(async (req, res) => {
  try {
    const { cropType } = req.params;
    
    // Get crop data from service
    const cropDatabase = cropRecommendationService.cropDatabase;
    const cropData = cropDatabase[cropType];
    
    if (!cropData) {
      return error(res, 'Crop not found', 404);
    }

    logger.info('Crop details retrieved', { 
      userId: req.user._id, 
      cropType
    });

    return success(res, 'Crop details retrieved successfully', {
      crop: {
        ...cropData,
        sustainabilityScore: 75,
        marketTrend: 'stable'
      }
    });

  } catch (err) {
    logger.error('Crop details retrieval failed', { 
      error: err.message, 
      userId: req.user._id
    });
    return error(res, 'Failed to retrieve crop details. Please try again.', 500);
  }
}));

/**
 * @route   POST /api/planning/compare-crops
 * @desc    Compare multiple crops side by side
 * @access  Private
 */
router.post('/compare-crops', authenticateUser, [
  body('farmId').custom((value) => {
    // Allow both MongoDB ObjectIds and mock farm IDs for development
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(value)) {
      return true;
    }
    // Allow mock farm IDs (1, 2, 3) for development
    if (process.env.NODE_ENV === 'development' && ['1', '2', '3'].includes(value)) {
      return true;
    }
    throw new Error('Valid farm ID is required');
  }).withMessage('Valid farm ID is required'),
  body('crops').isArray({ min: 2, max: 4 }).withMessage('Please select 2-4 crops to compare')
], handleValidationErrors, asyncHandler(async (req, res) => {
  try {
    const { farmId, crops } = req.body;
    
    // Verify farm ownership or handle mock farms in development
    let farm;
    if (process.env.NODE_ENV === 'development' && ['1', '2', '3'].includes(farmId)) {
      // Mock farm data for development
      const mockFarms = {
        '1': {
          location: { centerPoint: { coordinates: [77.2090, 28.6139] } }, // Delhi coordinates
          farmInfo: { totalArea: { value: 2.5 } },
          fields: [{ soilType: 'clay_loam' }]
        },
        '2': {
          location: { centerPoint: { coordinates: [76.7794, 30.7333] } }, // Chandigarh coordinates
          farmInfo: { totalArea: { value: 1.8 } },
          fields: [{ soilType: 'sandy_loam' }]
        },
        '3': {
          location: { centerPoint: { coordinates: [80.2702, 26.8467] } }, // Lucknow coordinates
          farmInfo: { totalArea: { value: 0.5 } },
          fields: [{ soilType: 'loam' }]
        }
      };
      farm = mockFarms[farmId];
    } else {
      // Real farm lookup
      farm = await Farm.findOne({
        _id: farmId,
        owner: req.user._id
      });

      if (!farm) {
        return error(res, 'Farm not found or access denied', 404);
      }
    }

    // Get farm location
    const { coordinates } = farm.location.centerPoint;
    const [longitude, latitude] = coordinates;

    // Get recommendations for comparison
    const recommendations = await cropRecommendationService.getRecommendations({
      latitude,
      longitude,
      farmSize: farm.farmInfo.totalArea.value || 1,
      soilType: farm.fields?.[0]?.soilType || 'unknown'
    });

    // Filter to requested crops
    const cropsToCompare = recommendations.allRecommendations.filter(
      crop => crops.includes(crop.cropKey)
    );

    if (cropsToCompare.length !== crops.length) {
      return error(res, 'Some requested crops not found', 400);
    }

    // Generate comparison
    const comparison = {
      crops: cropsToCompare.map(crop => ({
        key: crop.cropKey,
        name: crop.name,
        overallScore: crop.overallScore,
        scores: crop.suitabilityScores,
        economics: crop.profitProjection,
        duration: crop.growing.duration,
        difficulty: crop.growing.difficulty
      })),
        summary: {
        bestOverall: cropsToCompare.reduce((best, current) => 
          current.overallScore > best.overallScore ? current : best
        ).name,
        mostProfitable: cropsToCompare.reduce((best, current) => 
          current.profitProjection.profit > best.profitProjection.profit ? current : best
        ).name
      }
    };

    logger.info('Crop comparison generated', { 
      userId: req.user._id, 
      farmId,
      cropsCompared: crops
    });

    return success(res, 'Crop comparison generated successfully', comparison);

  } catch (err) {
    logger.error('Crop comparison failed', { 
      error: err.message, 
      userId: req.user._id 
    });
    return error(res, 'Failed to generate crop comparison. Please try again.', 500);
  }
}));

module.exports = router;