/**
 * Irrigation Management API Routes for AgriSphere
 * Provides smart irrigation recommendations and logging
 */

const express = require('express');
const { body, query, validationResult } = require('express-validator');

const { authenticateUser } = require('../middleware/auth');
const { handleValidationErrors, asyncHandler } = require('../middleware/errorHandler');
const { success, error } = require('../utils/apiResponse');
const logger = require('../utils/logger');

const irrigationService = require('../services/irrigationService');
const IrrigationLog = require('../models/IrrigationLog');
const Farm = require('../models/Farm');

const router = express.Router();

/**
 * @route   POST /api/irrigation/recommendation
 * @desc    Get irrigation recommendation for a field
 * @access  Private
 */
router.post('/recommendation', authenticateUser, [
  body('farmId').isMongoId().withMessage('Valid farm ID is required'),
  body('fieldId').notEmpty().withMessage('Field ID is required'),
  body('cropType').optional().isLength({ min: 2 }).withMessage('Crop type must be at least 2 characters'),
  body('growthStage').optional().isIn(['initial', 'development', 'mid', 'late']).withMessage('Invalid growth stage'),
  body('soilType').optional().isIn(['sandy', 'loam', 'clay', 'sandy_loam', 'clay_loam', 'silt_loam']).withMessage('Invalid soil type'),
  body('lastIrrigation').optional().isISO8601().withMessage('Last irrigation must be a valid date'),
  body('fieldSize').optional().isFloat({ min: 0.1, max: 1000 }).withMessage('Field size must be between 0.1 and 1000 hectares')
], handleValidationErrors, asyncHandler(async (req, res) => {
  try {
    const { farmId, fieldId, cropType, growthStage, soilType, lastIrrigation, fieldSize } = req.body;

  // Verify farm ownership
  const farm = await Farm.findOne({
      _id: farmId,
    owner: req.user._id
  });

  if (!farm) {
      return error(res, 'Farm not found or access denied', 404);
    }

    // Get farm location
    const { coordinates } = farm.location.centerPoint;
    const [longitude, latitude] = coordinates;

    // Get last irrigation from logs if not provided
    let lastIrrigationDate = lastIrrigation;
    if (!lastIrrigationDate) {
      const lastLog = await IrrigationLog.findOne({
        farm: farmId,
        fieldId: fieldId,
        user: req.user._id
      }).sort({ irrigationDate: -1 });
      
      if (lastLog) {
        lastIrrigationDate = lastLog.irrigationDate;
      }
    }

    logger.info('Calculating irrigation recommendation', { 
      userId: req.user._id, 
      farmId, 
      fieldId,
      location: { latitude, longitude }
    });

    // Calculate irrigation recommendation
    logger.info('About to call irrigation service', { latitude, longitude, cropType, growthStage });
    const recommendation = await irrigationService.calculateIrrigationRecommendation({
      latitude,
      longitude,
      cropType: cropType || 'unknown',
      growthStage: growthStage || 'mid',
      soilType: soilType || farm.soilType || 'unknown',
      lastIrrigation: lastIrrigationDate,
      fieldSize: fieldSize || 1
    });
    logger.info('Irrigation service call completed', { 
      hasRecommendation: !!recommendation,
      hasWeather: !!recommendation?.weather,
      hasWaterBalance: !!recommendation?.waterBalance,
      dataAvailability: recommendation?.metadata?.dataAvailability
    });

    // Log the recommendation request
    logger.info('Creating irrigation log', { 
      userId: req.user._id,
      farmId,
      fieldId,
      recommendationStatus: recommendation.recommendation?.status
    });
    
    try {
      const logData = new IrrigationLog({
        user: req.user._id,
        farm: farmId,
        fieldId,
        irrigationDate: new Date(), // Add current date for recommendation calculations
        recommendationType: 'calculation',
        recommendation: {
          status: recommendation.recommendation?.status || 'monitor',
          priority: recommendation.recommendation?.priority || 'low',
          action: recommendation.recommendation?.action || 'monitor',
          amount: recommendation.recommendation?.amount || 0,
          timing: recommendation.recommendation?.timing || 'next_assessment'
        },
        weatherConditions: {
          temperature: recommendation.weather?.current?.temperature || 25,
          humidity: recommendation.weather?.current?.humidity || 60,
          windSpeed: recommendation.weather?.current?.windSpeed || 10
        },
        soilMoisture: {
          percentage: recommendation.waterBalance?.moisturePercentage || 50,
          status: recommendation.waterBalance?.isCritical ? 'critical' : 
                  recommendation.waterBalance?.isOptimal ? 'optimal' : 'adequate'
        },
        cropDetails: {
          type: cropType || 'unknown',
          growthStage: growthStage || 'mid'
        }
      });

      logger.info('Saving irrigation log');
      await logData.save();
      logger.info('Irrigation log saved successfully');
    } catch (logError) {
      logger.error('Failed to create irrigation log', { 
        error: logError.message,
        stack: logError.stack,
        userId: req.user._id 
      });
      // Continue without logging if it fails
    }

    logger.info('Irrigation recommendation calculated successfully', { 
      userId: req.user._id,
      farmId,
      fieldId,
      status: recommendation.recommendation.status,
      amount: recommendation.recommendation.amount,
      dataReliability: recommendation.recommendation.dataSource?.reliability
    });

    // Determine response status based on data availability
    const hasRealData = recommendation.metadata?.dataAvailability?.hasRealData;
    const status = hasRealData ? 'success' : 'partial_success';
    const message = hasRealData 
      ? 'Irrigation recommendation calculated successfully' 
      : 'Irrigation recommendation calculated with limited data';

    return success(res, message, {
      recommendation: recommendation.recommendation || {},
      waterBalance: recommendation.waterBalance || {},
      evapotranspiration: recommendation.evapotranspiration || {},
      weather: {
        current: recommendation.weather?.current || {},
        forecast: recommendation.weather?.forecast?.slice(0, 3) || [], // Next 3 days only
        source: recommendation.weather?.source || 'unknown'
      },
      soil: recommendation.soil || {},
      metadata: {
        ...recommendation.metadata,
        status: status,
        dataReliability: recommendation.recommendation?.dataSource?.reliability || 'unknown'
      }
    });

  } catch (err) {
    logger.error('Irrigation recommendation calculation failed', { 
      error: err.message, 
      stack: err.stack,
      userId: req.user._id 
    });
    
    // Provide specific error messages for data unavailability
    if (err.message.includes('Weather data unavailable') || err.message.includes('weather')) {
      return error(res, `Weather data unavailable: ${err.message}`, 503);
    } else if (err.message.includes('Soil data unavailable') || err.message.includes('soil') || err.message.includes('texture')) {
      return error(res, `Soil data unavailable: ${err.message}`, 503);
    } else if (err.message.includes('Insufficient') || err.message.includes('Cannot provide reliable')) {
      return error(res, `Insufficient real data: ${err.message}`, 422);
    } else {
      return error(res, `Data service error: ${err.message}`, 503);
    }
  }
}));

/**
 * @route   POST /api/irrigation/log
 * @desc    Log an irrigation activity
 * @access  Private
 */
router.post('/log', authenticateUser, [
  body('farmId').isMongoId().withMessage('Valid farm ID is required'),
  body('fieldId').notEmpty().withMessage('Field ID is required'),
  body('irrigationDate').isISO8601().withMessage('Irrigation date is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('duration').optional().isFloat({ min: 0 }).withMessage('Duration must be a positive number'),
  body('method').optional().isIn(['sprinkler', 'drip', 'flood', 'furrow', 'manual']).withMessage('Invalid irrigation method'),
  body('notes').optional().isLength({ max: 500 }).withMessage('Notes too long')
], handleValidationErrors, asyncHandler(async (req, res) => {
  try {
    const { farmId, fieldId, irrigationDate, amount, duration, method, notes } = req.body;
    
    // Verify farm ownership
    const farm = await Farm.findOne({
      _id: farmId,
      owner: req.user._id
    });
    
    if (!farm) {
      return error(res, 'Farm not found or access denied', 404);
    }

    // Create irrigation log
    const irrigationLog = new IrrigationLog({
      user: req.user._id,
      farm: farmId,
      fieldId,
      irrigationDate: new Date(irrigationDate),
      recommendationType: 'manual_log',
      actualIrrigation: {
        amount: amount,
        duration: duration || null,
        method: method || 'unknown',
        efficiency: method === 'drip' ? 90 : method === 'sprinkler' ? 75 : 60
      },
      notes: notes || '',
      weatherConditions: {
        temperature: 0, // Will be updated with actual weather data if available
        humidity: 0,
        windSpeed: 0
      },
      soilMoisture: {
        percentage: 0, // Will be estimated based on irrigation
        status: 'unknown'
      }
    });

    await irrigationLog.save();

    // Update farm statistics
    await Farm.findByIdAndUpdate(farmId, {
      $inc: { 
        'irrigationStats.totalIrrigations': 1,
        'irrigationStats.totalWaterUsed': amount
      },
      $set: { 
        'irrigationStats.lastIrrigation': new Date(irrigationDate)
      }
    });

    logger.info('Irrigation activity logged', { 
    userId: req.user._id,
      farmId,
      fieldId,
      amount,
      date: irrigationDate
    });

    return success(res, 'Irrigation activity logged successfully', {
      logId: irrigationLog._id,
      irrigationDate: irrigationLog.irrigationDate,
      amount: irrigationLog.actualIrrigation.amount,
      efficiency: irrigationLog.actualIrrigation.efficiency
    });

  } catch (err) {
    logger.error('Irrigation logging failed', { 
      error: err.message, 
      userId: req.user._id 
    });
    return error(res, 'Failed to log irrigation activity. Please try again.', 500);
  }
}));

/**
 * @route   GET /api/irrigation/history
 * @desc    Get irrigation history for a farm/field
 * @access  Private
 */
router.get('/history', authenticateUser, [
  query('farmId').isMongoId().withMessage('Valid farm ID is required'),
  query('fieldId').optional().notEmpty().withMessage('Field ID cannot be empty'),
  query('startDate').optional().isISO8601().withMessage('Start date must be valid'),
  query('endDate').optional().isISO8601().withMessage('End date must be valid'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer')
], handleValidationErrors, asyncHandler(async (req, res) => {
  try {
    const { farmId, fieldId, startDate, endDate, limit = 20, page = 1 } = req.query;
    
    // Verify farm ownership
    const farm = await Farm.findOne({
      _id: farmId,
      owner: req.user._id
    });
    
    if (!farm) {
      return error(res, 'Farm not found or access denied', 404);
    }

    // Build query
    const query = {
      farm: farmId,
      user: req.user._id
    };

    if (fieldId) {
      query.fieldId = fieldId;
    }

    if (startDate || endDate) {
      query.irrigationDate = {};
      if (startDate) query.irrigationDate.$gte = new Date(startDate);
      if (endDate) query.irrigationDate.$lte = new Date(endDate);
    }

    // Get paginated results
    const skip = (page - 1) * limit;
    const [logs, totalCount] = await Promise.all([
      IrrigationLog.find(query)
        .sort({ irrigationDate: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('farm', 'name location')
        .lean(),
      IrrigationLog.countDocuments(query)
    ]);

  // Calculate summary statistics
    const stats = await IrrigationLog.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
          totalWaterUsed: { $sum: '$actualIrrigation.amount' },
          totalIrrigations: { $sum: 1 },
          avgWaterPerIrrigation: { $avg: '$actualIrrigation.amount' },
          lastIrrigation: { $max: '$irrigationDate' }
      }
    }
  ]);

    logger.info('Irrigation history retrieved', { 
      userId: req.user._id, 
      farmId,
      recordCount: logs.length
    });

    return success(res, 'Irrigation history retrieved successfully', {
      logs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalRecords: totalCount,
        hasNext: (page * limit) < totalCount,
        hasPrev: page > 1
      },
      statistics: stats[0] || {
        totalWaterUsed: 0,
        totalIrrigations: 0,
        avgWaterPerIrrigation: 0,
        lastIrrigation: null
      }
    });

  } catch (err) {
    logger.error('Failed to retrieve irrigation history', { 
      error: err.message, 
      userId: req.user._id 
    });
    return error(res, 'Failed to retrieve irrigation history. Please try again.', 500);
  }
}));

/**
 * @route   GET /api/irrigation/weather
 * @desc    Get weather forecast for irrigation planning
 * @access  Private
 */
router.get('/weather', authenticateUser, [
  query('farmId').isMongoId().withMessage('Valid farm ID is required'),
  query('days').optional().isInt({ min: 1, max: 14 }).withMessage('Days must be between 1 and 14')
], handleValidationErrors, asyncHandler(async (req, res) => {
  try {
    const { farmId, days = 7 } = req.query;
    
    // Verify farm ownership
  const farm = await Farm.findOne({
    _id: farmId,
    owner: req.user._id
  });

  if (!farm) {
      return error(res, 'Farm not found or access denied', 404);
    }

    // Get farm location
    const { coordinates } = farm.location.centerPoint;
    const [longitude, latitude] = coordinates;

    // Get weather forecast
    const weatherData = await irrigationService.getWeatherForecast(latitude, longitude);

    // Format response for irrigation planning
    const forecast = weatherData.forecast.slice(0, days).map(day => ({
      date: day.time,
      temperature: {
        value: day.temperature,
        unit: '°C',
        category: day.temperature > 30 ? 'hot' : day.temperature < 15 ? 'cool' : 'moderate'
      },
      humidity: {
        value: day.humidity,
        unit: '%',
        category: day.humidity > 80 ? 'high' : day.humidity < 50 ? 'low' : 'moderate'
      },
      precipitation: {
        value: day.precipitation,
        unit: 'mm',
        category: day.precipitation > 10 ? 'heavy' : day.precipitation > 2 ? 'light' : 'none'
      },
      windSpeed: {
        value: day.windSpeed,
        unit: 'km/h',
        category: day.windSpeed > 20 ? 'high' : day.windSpeed < 10 ? 'low' : 'moderate'
      },
      irrigationAdvice: getIrrigationAdvice(day),
      icon: getWeatherIcon(day.summary)
    }));

    // Calculate irrigation-relevant insights
    const insights = {
      totalExpectedRainfall: forecast.reduce((sum, day) => sum + day.precipitation.value, 0),
      hotDays: forecast.filter(day => day.temperature.value > 30).length,
      windyDays: forecast.filter(day => day.windSpeed.value > 20).length,
      rainyDays: forecast.filter(day => day.precipitation.value > 2).length,
      bestIrrigationDays: forecast
        .filter(day => day.precipitation.value < 2 && day.windSpeed.value < 15)
        .map(day => day.date.split('T')[0])
    };

    logger.info('Weather forecast retrieved for irrigation planning', { 
      userId: req.user._id, 
      farmId,
      days: forecast.length
    });

    return success(res, 'Weather forecast retrieved successfully', {
      current: weatherData.current,
      forecast,
      insights,
      location: { latitude, longitude },
      source: weatherData.source
    });

  } catch (err) {
    logger.error('Failed to retrieve weather forecast', { 
      error: err.message, 
      userId: req.user._id 
    });
    return error(res, 'Failed to retrieve weather forecast. Please try again.', 500);
  }
}));

/**
 * @route   GET /api/irrigation/stats
 * @desc    Get irrigation statistics and analytics
 * @access  Private
 */
router.get('/stats', authenticateUser, [
  query('farmId').optional().isMongoId().withMessage('Valid farm ID required'),
  query('timeframe').optional().isIn(['week', 'month', 'season', 'year']).withMessage('Invalid timeframe'),
  query('year').optional().isInt({ min: 2020, max: 2030 }).withMessage('Invalid year')
], handleValidationErrors, asyncHandler(async (req, res) => {
  try {
    const { farmId, timeframe = 'month', year = new Date().getFullYear() } = req.query;
    
    // Build base query
    const baseQuery = { user: req.user._id };
    if (farmId) {
      // Verify farm ownership
  const farm = await Farm.findOne({
    _id: farmId,
    owner: req.user._id
  });

  if (!farm) {
        return error(res, 'Farm not found or access denied', 404);
      }
      
      baseQuery.farm = farmId;
    }

    // Calculate date range based on timeframe
    let startDate, endDate;
    const now = new Date();
    
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'season':
        const currentMonth = now.getMonth();
        if (currentMonth < 3) { // Winter
          startDate = new Date(year - 1, 11, 1);
          endDate = new Date(year, 2, 31);
        } else if (currentMonth < 6) { // Spring
          startDate = new Date(year, 2, 1);
          endDate = new Date(year, 5, 30);
        } else if (currentMonth < 9) { // Summer
          startDate = new Date(year, 5, 1);
          endDate = new Date(year, 8, 30);
        } else { // Autumn
          startDate = new Date(year, 8, 1);
          endDate = new Date(year, 11, 31);
        }
        break;
      case 'year':
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
        break;
    }

    baseQuery.irrigationDate = { $gte: startDate, $lte: endDate };

    // Aggregate statistics
    const stats = await IrrigationLog.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          totalWaterUsed: { $sum: '$actualIrrigation.amount' },
          totalIrrigations: { $sum: 1 },
          avgWaterPerIrrigation: { $avg: '$actualIrrigation.amount' },
          maxSingleIrrigation: { $max: '$actualIrrigation.amount' },
          minSingleIrrigation: { $min: '$actualIrrigation.amount' },
          avgEfficiency: { $avg: '$actualIrrigation.efficiency' }
        }
      }
    ]);

    // Get irrigation trends (by day/week/month depending on timeframe)
    let groupBy;
    switch (timeframe) {
      case 'week':
        groupBy = { $dayOfYear: '$irrigationDate' };
        break;
      case 'month':
        groupBy = { $dayOfMonth: '$irrigationDate' };
        break;
      case 'season':
      case 'year':
        groupBy = { $month: '$irrigationDate' };
        break;
    }

    const trends = await IrrigationLog.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: groupBy,
          waterUsed: { $sum: '$actualIrrigation.amount' },
          irrigationCount: { $sum: 1 },
          avgEfficiency: { $avg: '$actualIrrigation.efficiency' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get method distribution
    const methodStats = await IrrigationLog.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$actualIrrigation.method',
          count: { $sum: 1 },
          totalWater: { $sum: '$actualIrrigation.amount' },
          avgEfficiency: { $avg: '$actualIrrigation.efficiency' }
        }
      }
    ]);

    // Calculate water conservation insights
    const conservationInsights = {
      potentialSavings: 0,
      efficiencyRating: 'unknown',
      recommendations: []
    };

    if (stats.length > 0) {
      const avgEfficiency = stats[0].avgEfficiency || 60;
      const totalWater = stats[0].totalWaterUsed || 0;
      
      if (avgEfficiency < 70) {
        conservationInsights.potentialSavings = totalWater * 0.2; // 20% potential savings
        conservationInsights.efficiencyRating = 'needs_improvement';
        conservationInsights.recommendations.push(
          'Consider switching to drip irrigation for better efficiency',
          'Schedule irrigations during early morning or evening',
          'Use soil moisture sensors to optimize timing'
        );
      } else if (avgEfficiency < 85) {
        conservationInsights.potentialSavings = totalWater * 0.1; // 10% potential savings
        conservationInsights.efficiencyRating = 'good';
        conservationInsights.recommendations.push(
          'Fine-tune irrigation scheduling',
          'Consider mulching to reduce evaporation'
        );
      } else {
        conservationInsights.efficiencyRating = 'excellent';
        conservationInsights.recommendations.push(
          'Maintain current practices',
          'Share your efficient methods with other farmers'
        );
      }
    }

    logger.info('Irrigation statistics calculated', { 
      userId: req.user._id, 
      farmId: farmId || 'all_farms',
      timeframe,
      recordCount: stats[0]?.totalIrrigations || 0
    });

    return success(res, 'Irrigation statistics retrieved successfully', {
      summary: stats[0] || {
        totalWaterUsed: 0,
        totalIrrigations: 0,
        avgWaterPerIrrigation: 0,
        maxSingleIrrigation: 0,
        minSingleIrrigation: 0,
        avgEfficiency: 0
      },
      trends,
      methodDistribution: methodStats,
      conservationInsights,
      timeframe: {
        type: timeframe,
        startDate,
        endDate,
        year
      }
    });

  } catch (err) {
    logger.error('Failed to calculate irrigation statistics', { 
      error: err.message, 
      userId: req.user._id 
    });
    return error(res, 'Failed to retrieve irrigation statistics. Please try again.', 500);
  }
}));

// Helper functions
function getIrrigationAdvice(dayWeather) {
  const { temperature, precipitation, windSpeed, humidity } = dayWeather;
  
  if (precipitation > 10) {
    return { advice: 'Skip irrigation - heavy rain expected', priority: 'low', color: 'blue' };
  } else if (precipitation > 2) {
    return { advice: 'Light irrigation may be needed', priority: 'low', color: 'green' };
  } else if (temperature > 35 || humidity < 30) {
    return { advice: 'High evaporation - increase irrigation', priority: 'high', color: 'red' };
  } else if (windSpeed > 20) {
    return { advice: 'Windy conditions - avoid overhead irrigation', priority: 'medium', color: 'yellow' };
  } else {
    return { advice: 'Good conditions for irrigation', priority: 'medium', color: 'green' };
  }
}

function getWeatherIcon(summary) {
  const iconMap = {
    'sunny': '☀️',
    'fair_day': '🌤️',
    'cloudy': '☁️',
    'rain': '🌧️',
    'heavy_rain': '⛈️',
    'snow': '❄️',
    'fog': '🌫️'
  };
  
  return iconMap[summary] || '🌤️';
}

module.exports = router;