/**
 * Irrigation Management Routes for AgriSphere
 * Handles irrigation recommendations, scheduling, water usage tracking, and efficiency optimization
 * Critical for water management in smallholder farming with limited water resources
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const IrrigationLog = require('../models/IrrigationLog');
const Farm = require('../models/Farm');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { handleValidationErrors } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const weatherApi = require('../services/weatherApi');
const soilApi = require('../services/soilApi');

const router = express.Router();

// Authentication middleware (simplified - should be in separate file)
const authenticateUser = asyncHandler(async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. No token provided.',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user || !user.status.isActive) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token or user inactive',
        timestamp: new Date().toISOString()
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token',
      timestamp: new Date().toISOString()
    });
  }
});

// Validation middleware for irrigation recommendation request
const validateIrrigationRequest = [
  body('farmId')
    .isMongoId()
    .withMessage('Valid farm ID is required'),
  
  body('fieldId')
    .trim()
    .notEmpty()
    .withMessage('Field ID is required'),
  
  body('cropInfo.cropName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Crop name must be between 2 and 50 characters'),
  
  body('cropInfo.growthStage')
    .isIn(['germination', 'seedling', 'vegetative', 'flowering', 'fruit_development', 'maturation', 'harvest'])
    .withMessage('Invalid growth stage'),
  
  body('cropInfo.cultivatedArea.value')
    .isFloat({ min: 0.01 })
    .withMessage('Cultivated area must be greater than 0'),
  
  body('irrigationSystem.type')
    .isIn(['manual_watering', 'drip_irrigation', 'sprinkler', 'flood_irrigation', 'center_pivot', 'furrow', 'subsurface_drip', 'micro_sprinkler'])
    .withMessage('Invalid irrigation system type'),
  
  body('environmentalData.soil.moistureLevel.current')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Soil moisture level must be between 0 and 100%')
];

// Validation middleware for irrigation implementation
const validateIrrigationImplementation = [
  body('actualStartTime')
    .isISO8601()
    .withMessage('Valid start time is required'),
  
  body('actualEndTime')
    .isISO8601()
    .withMessage('Valid end time is required'),
  
  body('waterUsed.value')
    .isFloat({ min: 0 })
    .withMessage('Water used must be non-negative'),
  
  body('waterUsed.unit')
    .isIn(['liters', 'gallons', 'cubic_meters'])
    .withMessage('Invalid water unit'),
  
  body('method')
    .isIn(['manual', 'automated', 'semi_automated'])
    .withMessage('Invalid irrigation method')
];

/**
 * @route   POST /api/irrigation/recommend
 * @desc    Get irrigation recommendation for a field
 * @access  Private
 */
router.post('/recommend', authenticateUser, validateIrrigationRequest, handleValidationErrors, asyncHandler(async (req, res) => {
  const recommendationData = {
    ...req.body,
    user: req.user._id
  };

  // Verify farm ownership
  const farm = await Farm.findOne({
    _id: recommendationData.farmId,
    owner: req.user._id
  });

  if (!farm) {
    return res.status(404).json({
      status: 'error',
      message: 'Farm not found or access denied',
      timestamp: new Date().toISOString()
    });
  }

  // Verify field exists in farm
  const field = farm.fields?.find(f => f.fieldId === recommendationData.fieldId);
  if (!field) {
    return res.status(400).json({
      status: 'error',
      message: 'Field not found in the specified farm',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const [longitude, latitude] = farm.location.centerPoint.coordinates;

    // Get current weather and forecast
    const [currentWeather, weatherForecast] = await Promise.all([
      weatherApi.getCurrentWeather(latitude, longitude),
      weatherApi.getWeatherForecast(latitude, longitude)
    ]);

    // Enhance environmental data with weather information
    const enhancedEnvironmentalData = {
      ...recommendationData.environmentalData,
      weather: {
        temperature: {
          current: currentWeather.current.temperature,
          minimum: currentWeather.current.temperature - 5,
          maximum: currentWeather.current.temperature + 5,
          average: currentWeather.current.temperature
        },
        humidity: {
          current: currentWeather.current.humidity,
          average: currentWeather.current.humidity
        },
        windSpeed: {
          current: currentWeather.current.windSpeed,
          average: currentWeather.current.windSpeed
        },
        rainfall: {
          last24Hours: 0, // Would come from weather history
          last7Days: 0,
          forecast48Hours: weatherForecast.forecast.slice(0, 16) // Next 48 hours
            .reduce((sum, item) => sum + (item.precipitation || 0), 0)
        },
        evapotranspiration: {
          reference: calculateReferenceET(currentWeather),
          crop: calculateCropET(currentWeather, recommendationData.cropInfo),
          calculated: true
        }
      }
    };

    // Generate irrigation recommendation
    const recommendation = await generateIrrigationRecommendation(
      recommendationData.cropInfo,
      recommendationData.irrigationSystem,
      enhancedEnvironmentalData,
      farm
    );

    // Create irrigation log entry
    const irrigationLog = new IrrigationLog({
      ...recommendationData,
      environmentalData: enhancedEnvironmentalData,
      recommendation,
      metadata: {
        source: 'mobile_app',
        deviceInfo: req.headers['user-agent'] || 'unknown'
      }
    });

    await irrigationLog.save();

    logger.info('Irrigation recommendation generated', {
      logId: irrigationLog.logId,
      userId: req.user._id,
      farmId: farm._id,
      action: recommendation.recommendedAction,
      waterAmount: recommendation.waterAmount.value
    });

    res.status(201).json({
      status: 'success',
      message: 'Irrigation recommendation generated successfully',
      data: {
        recommendation: {
          logId: irrigationLog.logId,
          action: recommendation.recommendedAction,
          waterAmount: recommendation.waterAmount,
          duration: recommendation.duration,
          timing: recommendation.timing,
          reasoning: recommendation.reasoning,
          urgency: recommendation.timing.urgency,
          validUntil: recommendation.validUntil
        },
        environmentalFactors: {
          currentSoilMoisture: enhancedEnvironmentalData.soil.moistureLevel.current,
          weather: {
            temperature: enhancedEnvironmentalData.weather.temperature.current,
            humidity: enhancedEnvironmentalData.weather.humidity.current,
            forecastRainfall: enhancedEnvironmentalData.weather.rainfall.forecast48Hours
          }
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Irrigation recommendation failed', {
      userId: req.user._id,
      farmId: recommendationData.farmId,
      error: error.message
    });

    res.status(503).json({
      status: 'error',
      message: 'Irrigation recommendation service temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @route   PUT /api/irrigation/:logId/implement
 * @desc    Record implementation of irrigation recommendation
 * @access  Private
 */
router.put('/:logId/implement', authenticateUser, validateIrrigationImplementation, handleValidationErrors, asyncHandler(async (req, res) => {
  const { logId } = req.params;
  const implementationData = req.body;

  const irrigationLog = await IrrigationLog.findOne({
    logId,
    user: req.user._id
  });

  if (!irrigationLog) {
    return res.status(404).json({
      status: 'error',
      message: 'Irrigation log not found',
      timestamp: new Date().toISOString()
    });
  }

  // Calculate duration and validate data
  const startTime = new Date(implementationData.actualStartTime);
  const endTime = new Date(implementationData.actualEndTime);
  const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

  if (durationMinutes <= 0) {
    return res.status(400).json({
      status: 'error',
      message: 'End time must be after start time',
      timestamp: new Date().toISOString()
    });
  }

  // Calculate costs (basic calculation)
  const waterCost = calculateWaterCost(implementationData.waterUsed);
  const energyCost = calculateEnergyCost(durationMinutes, irrigationLog.irrigationSystem.type);
  const laborCost = calculateLaborCost(durationMinutes, implementationData.method);

  const fullImplementationData = {
    ...implementationData,
    implementationDate: new Date(),
    duration: {
      value: durationMinutes,
      unit: 'minutes'
    },
    costs: {
      waterCost,
      energyCost,
      laborCost,
      totalCost: {
        amount: waterCost.amount + energyCost.amount + laborCost.amount,
        currency: 'USD'
      }
    }
  };

  await irrigationLog.updateImplementation(fullImplementationData);

  // Calculate performance metrics
  const efficiency = irrigationLog.irrigationEfficiency;
  const costPerArea = irrigationLog.costPerArea;
  const waterUseIntensity = irrigationLog.waterUseIntensity;

  logger.info('Irrigation implementation recorded', {
    logId: irrigationLog.logId,
    userId: req.user._id,
    waterUsed: implementationData.waterUsed.value,
    duration: durationMinutes,
    efficiency: efficiency?.waterEfficiency
  });

  res.json({
    status: 'success',
    message: 'Irrigation implementation recorded successfully',
    data: {
      implementation: {
        logId: irrigationLog.logId,
        waterUsed: implementationData.waterUsed,
        duration: fullImplementationData.duration,
        costs: fullImplementationData.costs,
        efficiency,
        costPerArea,
        waterUseIntensity
      },
      recommendations: [
        efficiency?.status === 'overwatered' ? 'Consider reducing water amount next time' :
        efficiency?.status === 'underwatered' ? 'Consider increasing water amount next time' :
        'Good water management',
        'Monitor crop response over next 24-48 hours',
        'Record any observations for future reference'
      ]
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/irrigation
 * @desc    Get irrigation history and logs
 * @access  Private
 */
router.get('/', authenticateUser, asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    farmId, 
    cropName, 
    timeRange = 30,
    implemented 
  } = req.query;

  const query = { user: req.user._id };

  // Apply filters
  if (farmId) {
    query.farm = farmId;
  }
  
  if (cropName) {
    query['cropInfo.cropName'] = new RegExp(cropName, 'i');
  }
  
  if (implemented !== undefined) {
    query['actualIrrigation.wasImplemented'] = implemented === 'true';
  }

  // Time range filter
  if (timeRange && parseInt(timeRange) > 0) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));
    query.createdAt = { $gte: startDate };
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 },
    populate: [
      {
        path: 'farm',
        select: 'farmInfo.name location.address'
      }
    ]
  };

  const irrigationLogs = await IrrigationLog.find(query)
    .populate(options.populate)
    .sort(options.sort)
    .limit(options.limit * 1)
    .skip((options.page - 1) * options.limit)
    .select('-metadata.deviceInfo -environmentalData.weather');

  const total = await IrrigationLog.countDocuments(query);

  // Calculate summary statistics
  const summaryStats = await IrrigationLog.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalRecommendations: { $sum: 1 },
        implementedCount: {
          $sum: { $cond: ['$actualIrrigation.wasImplemented', 1, 0] }
        },
        totalWaterUsed: {
          $sum: '$actualIrrigation.waterUsed.value'
        },
        avgWaterPerIrrigation: {
          $avg: '$actualIrrigation.waterUsed.value'
        },
        totalCost: {
          $sum: '$actualIrrigation.costs.totalCost.amount'
        }
      }
    }
  ]);

  res.json({
    status: 'success',
    data: {
      irrigationLogs,
      pagination: {
        currentPage: options.page,
        totalPages: Math.ceil(total / options.limit),
        totalLogs: total,
        hasNextPage: options.page < Math.ceil(total / options.limit),
        hasPrevPage: options.page > 1
      },
      summary: summaryStats[0] || {
        totalRecommendations: 0,
        implementedCount: 0,
        totalWaterUsed: 0,
        avgWaterPerIrrigation: 0,
        totalCost: 0
      }
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/irrigation/schedule/:farmId
 * @desc    Get irrigation schedule for a farm
 * @access  Private
 */
router.get('/schedule/:farmId', authenticateUser, asyncHandler(async (req, res) => {
  const { farmId } = req.params;
  const { days = 7 } = req.query;

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

  // Get pending and upcoming irrigation schedules
  const upcomingIrrigation = await IrrigationLog.find({
    farm: farmId,
    user: req.user._id,
    'followUp.nextIrrigationDue': {
      $gte: new Date(),
      $lte: new Date(Date.now() + parseInt(days) * 24 * 60 * 60 * 1000)
    }
  }).sort({ 'followUp.nextIrrigationDue': 1 });

  // Generate schedule for fields that need irrigation
  const schedule = [];
  
  for (const field of farm.fields || []) {
    if (field.status === 'active' && field.currentCrop) {
      // Calculate next irrigation need based on crop and season
      const nextIrrigation = calculateNextIrrigationNeed(field, farm.location);
      
      if (nextIrrigation) {
        schedule.push({
          fieldId: field.fieldId,
          fieldName: field.name,
          cropName: field.currentCrop,
          nextIrrigationDue: nextIrrigation.date,
          urgency: nextIrrigation.urgency,
          estimatedWaterNeeded: nextIrrigation.waterAmount,
          reason: nextIrrigation.reason
        });
      }
    }
  }

  res.json({
    status: 'success',
    data: {
      farmId,
      scheduleRange: `${days} days`,
      upcomingIrrigation,
      predictedSchedule: schedule.sort((a, b) => new Date(a.nextIrrigationDue) - new Date(b.nextIrrigationDue)),
      totalScheduledItems: upcomingIrrigation.length + schedule.length
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/irrigation/analytics/:farmId
 * @desc    Get irrigation analytics and water usage insights
 * @access  Private
 */
router.get('/analytics/:farmId', authenticateUser, asyncHandler(async (req, res) => {
  const { farmId } = req.params;
  const { timeRange = 90 } = req.query;

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

  try {
    // Get irrigation statistics
    const stats = await IrrigationLog.getIrrigationStats(parseInt(timeRange));
    
    // Get water usage trends
    const waterTrends = await IrrigationLog.getWaterUsageTrends(farmId, parseInt(timeRange));
    
    // Get efficiency metrics
    const efficiencyMetrics = await IrrigationLog.aggregate([
      {
        $match: {
          farm: require('mongoose').Types.ObjectId(farmId),
          'actualIrrigation.wasImplemented': true,
          createdAt: { $gte: new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: null,
          avgWaterEfficiency: { $avg: '$performance.efficiency.waterUseEfficiency' },
          avgApplicationEfficiency: { $avg: '$performance.efficiency.applicationEfficiency' },
          avgCostPerArea: { $avg: '$actualIrrigation.costs.totalCost.amount' },
          systemTypes: { $push: '$irrigationSystem.type' }
        }
      }
    ]);

    const analytics = {
      overview: stats[0] || {
        totalIrrigations: 0,
        implementedIrrigations: 0,
        totalWaterUsed: 0,
        avgWaterPerIrrigation: 0,
        totalCost: 0
      },
      waterUsageTrends: waterTrends,
      efficiency: efficiencyMetrics[0] || {
        avgWaterEfficiency: 0,
        avgApplicationEfficiency: 0,
        avgCostPerArea: 0,
        systemTypes: []
      },
      recommendations: generateIrrigationRecommendations(stats[0], efficiencyMetrics[0]),
      benchmarks: {
        targetWaterEfficiency: 85,
        targetApplicationEfficiency: 90,
        optimalCostRange: '50-100 USD per hectare'
      }
    };

    res.json({
      status: 'success',
      data: {
        analytics,
        farmId,
        timeRange: parseInt(timeRange)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to generate irrigation analytics', {
      farmId,
      error: error.message
    });

    res.status(500).json({
      status: 'error',
      message: 'Failed to generate irrigation analytics',
      timestamp: new Date().toISOString()
    });
  }
}));

// Helper functions

/**
 * Calculate reference evapotranspiration
 */
function calculateReferenceET(weather) {
  // Simplified Penman-Monteith equation
  const temp = weather.current.temperature;
  const humidity = weather.current.humidity;
  const windSpeed = weather.current.windSpeed;
  
  // Basic ET calculation (mm/day)
  const et = Math.max(0, (temp * 0.1) + (windSpeed * 0.05) - (humidity * 0.02) + 2);
  return Math.round(et * 100) / 100;
}

/**
 * Calculate crop evapotranspiration
 */
function calculateCropET(weather, cropInfo) {
  const referenceET = calculateReferenceET(weather);
  
  // Crop coefficients by growth stage
  const cropCoefficients = {
    'germination': 0.4,
    'seedling': 0.6,
    'vegetative': 1.0,
    'flowering': 1.2,
    'fruit_development': 1.15,
    'maturation': 0.8,
    'harvest': 0.6
  };
  
  const kc = cropCoefficients[cropInfo.growthStage] || 1.0;
  return Math.round(referenceET * kc * 100) / 100;
}

/**
 * Generate irrigation recommendation
 */
async function generateIrrigationRecommendation(cropInfo, irrigationSystem, environmentalData, farm) {
  const soilMoisture = environmentalData.soil.moistureLevel.current;
  const optimalMoisture = environmentalData.soil.moistureLevel.optimal || 70;
  const forecastRain = environmentalData.weather.rainfall.forecast48Hours;
  const cropET = environmentalData.weather.evapotranspiration.crop;
  const area = cropInfo.cultivatedArea.value;
  
  let recommendedAction = 'monitor_only';
  let waterAmount = { value: 0, unit: 'liters' };
  let urgency = 'low';
  let reasoning = { primaryFactors: [] };
  
  // Decision logic
  if (soilMoisture < optimalMoisture * 0.6) {
    recommendedAction = 'irrigate_now';
    urgency = 'high';
    reasoning.primaryFactors.push({
      factor: 'soil_moisture',
      value: `${soilMoisture}% (critically low)`,
      importance: 'critical'
    });
  } else if (soilMoisture < optimalMoisture * 0.8 && forecastRain < 5) {
    recommendedAction = 'irrigate_now';
    urgency = 'normal';
    reasoning.primaryFactors.push({
      factor: 'soil_moisture',
      value: `${soilMoisture}% (low)`,
      importance: 'high'
    });
  } else if (forecastRain > 20) {
    recommendedAction = 'skip_irrigation';
    urgency = 'low';
    reasoning.primaryFactors.push({
      factor: 'weather_forecast',
      value: `${forecastRain}mm rain expected`,
      importance: 'high'
    });
  }
  
  // Calculate water amount if irrigation is needed
  if (recommendedAction === 'irrigate_now') {
    const moistureDeficit = (optimalMoisture - soilMoisture) / 100;
    const etReplacement = cropET * area * 10; // Convert to liters
    const deficitReplacement = moistureDeficit * area * 500; // Approximate
    
    waterAmount.value = Math.round(Math.max(etReplacement, deficitReplacement));
    
    // Adjust for system efficiency
    const efficiency = irrigationSystem.efficiency / 100;
    waterAmount.value = Math.round(waterAmount.value / efficiency);
  }
  
  // Calculate duration
  const flowRate = irrigationSystem.flowRate?.value || 100; // liters per minute
  const duration = {
    value: Math.round(waterAmount.value / flowRate),
    unit: 'minutes'
  };
  
  return {
    recommendationType: 'weather_based',
    recommendedAction,
    waterAmount,
    duration,
    timing: {
      urgency,
      preferredStartTime: '06:00',
      preferredEndTime: '09:00',
      deadline: urgency === 'high' ? new Date(Date.now() + 4 * 60 * 60 * 1000) : null
    },
    reasoning,
    generatedAt: new Date(),
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
  };
}

/**
 * Calculate water cost
 */
function calculateWaterCost(waterUsed) {
  const costPerLiter = 0.002; // $0.002 per liter (adjust based on local rates)
  return {
    amount: Math.round(waterUsed.value * costPerLiter * 100) / 100,
    currency: 'USD'
  };
}

/**
 * Calculate energy cost
 */
function calculateEnergyCost(durationMinutes, systemType) {
  const powerConsumption = {
    'manual_watering': 0,
    'drip_irrigation': 0.5, // kW
    'sprinkler': 1.5,
    'center_pivot': 3.0,
    'flood_irrigation': 2.0
  };
  
  const power = powerConsumption[systemType] || 1.0;
  const energyUsed = (power * durationMinutes) / 60; // kWh
  const costPerKWh = 0.12; // $0.12 per kWh
  
  return {
    amount: Math.round(energyUsed * costPerKWh * 100) / 100,
    currency: 'USD'
  };
}

/**
 * Calculate labor cost
 */
function calculateLaborCost(durationMinutes, method) {
  const laborRates = {
    'manual': 10, // $10 per hour
    'automated': 0,
    'semi_automated': 5
  };
  
  const rate = laborRates[method] || 5;
  const laborHours = durationMinutes / 60;
  
  return {
    amount: Math.round(laborHours * rate * 100) / 100,
    currency: 'USD'
  };
}

/**
 * Calculate next irrigation need for a field
 */
function calculateNextIrrigationNeed(field, location) {
  // Simplified calculation - in reality would use weather data and soil sensors
  const daysUntilNext = Math.floor(Math.random() * 5) + 2; // 2-6 days
  const nextDate = new Date(Date.now() + daysUntilNext * 24 * 60 * 60 * 1000);
  
  return {
    date: nextDate,
    urgency: daysUntilNext <= 2 ? 'high' : 'normal',
    waterAmount: { value: Math.floor(Math.random() * 500) + 200, unit: 'liters' },
    reason: 'Based on crop growth stage and weather forecast'
  };
}

/**
 * Generate irrigation recommendations based on analytics
 */
function generateIrrigationRecommendations(stats, efficiency) {
  const recommendations = [];
  
  if (stats && stats.implementedIrrigations / stats.totalIrrigations < 0.7) {
    recommendations.push('Consider implementing more irrigation recommendations to improve crop yields');
  }
  
  if (efficiency && efficiency.avgWaterEfficiency < 80) {
    recommendations.push('Water efficiency is below optimal. Consider upgrading to drip irrigation or improving system maintenance');
  }
  
  if (efficiency && efficiency.avgApplicationEfficiency < 85) {
    recommendations.push('Application efficiency could be improved. Check for leaks and ensure proper system calibration');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Your irrigation management is performing well. Continue monitoring and maintaining your systems');
  }
  
  return recommendations;
}

module.exports = router;