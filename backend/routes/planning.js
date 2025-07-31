/**
 * Crop Planning Routes for AgriSphere
 * Handles crop planning, seasonal scheduling, rotation recommendations, and harvest planning
 * Essential for optimizing farm productivity and sustainability
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const Farm = require('../models/Farm');
const User = require('../models/User');
const DiagnosisHistory = require('../models/DiagnosisHistory');
const IrrigationLog = require('../models/IrrigationLog');
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

// Validation middleware for crop planning
const validateCropPlan = [
  body('farmId')
    .isMongoId()
    .withMessage('Valid farm ID is required'),
  
  body('fieldId')
    .trim()
    .notEmpty()
    .withMessage('Field ID is required'),
  
  body('cropName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Crop name must be between 2 and 50 characters'),
  
  body('variety')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Variety name cannot exceed 50 characters'),
  
  body('plantingDate')
    .isISO8601()
    .withMessage('Valid planting date is required'),
  
  body('expectedHarvestDate')
    .optional()
    .isISO8601()
    .withMessage('Valid harvest date is required'),
  
  body('area.value')
    .isFloat({ min: 0.01 })
    .withMessage('Area must be greater than 0'),
  
  body('area.unit')
    .isIn(['hectares', 'acres', 'square_meters'])
    .withMessage('Invalid area unit')
];

// Validation middleware for rotation planning
const validateRotationPlan = [
  body('farmId')
    .isMongoId()
    .withMessage('Valid farm ID is required'),
  
  body('rotationCycle')
    .isArray({ min: 2 })
    .withMessage('Rotation cycle must include at least 2 crops'),
  
  body('rotationCycle.*.cropName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Each crop name must be at least 2 characters'),
  
  body('rotationCycle.*.season')
    .isIn(['spring', 'summer', 'fall', 'winter', 'dry_season', 'rainy_season'])
    .withMessage('Invalid season'),
  
  body('cycleDuration')
    .isInt({ min: 1, max: 10 })
    .withMessage('Cycle duration must be between 1 and 10 years')
];

/**
 * @route   POST /api/planning/crop-plan
 * @desc    Create a new crop plan for a field
 * @access  Private
 */
router.post('/crop-plan', authenticateUser, validateCropPlan, handleValidationErrors, asyncHandler(async (req, res) => {
  const planData = req.body;

  // Verify farm ownership
  const farm = await Farm.findOne({
    _id: planData.farmId,
    owner: req.user._id
  });

  if (!farm) {
    return res.status(404).json({
      status: 'error',
      message: 'Farm not found or access denied',
      timestamp: new Date().toISOString()
    });
  }

  // Verify field exists
  const fieldIndex = farm.fields?.findIndex(f => f.fieldId === planData.fieldId);
  if (fieldIndex === -1) {
    return res.status(400).json({
      status: 'error',
      message: 'Field not found in the specified farm',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Get environmental and location data
    const [longitude, latitude] = farm.location.centerPoint.coordinates;
    
    // Validate planting conditions
    const [weatherForecast, soilConditions] = await Promise.all([
      weatherApi.getWeatherForecast(latitude, longitude),
      soilApi.getSoilProperties(latitude, longitude)
    ]);

    // Generate crop suitability analysis
    const suitabilityAnalysis = await analyzeCropSuitability(
      planData.cropName,
      planData.variety,
      farm.location,
      soilConditions,
      weatherForecast
    );

    // Calculate expected timeline and milestones
    const timeline = generateCropTimeline(
      planData.cropName,
      planData.plantingDate,
      planData.expectedHarvestDate
    );

    // Generate resource requirements
    const resourceRequirements = calculateResourceRequirements(
      planData.cropName,
      planData.area,
      farm.soilData,
      timeline
    );

    // Risk assessment
    const riskAssessment = await assessCropRisks(
      planData.cropName,
      farm.location,
      planData.plantingDate,
      farm.environmental?.riskFactors || []
    );

    // Create crop plan object
    const cropPlan = {
      planId: `PLAN_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      farmId: planData.farmId,
      fieldId: planData.fieldId,
      cropDetails: {
        cropName: planData.cropName,
        variety: planData.variety,
        plantingDate: new Date(planData.plantingDate),
        expectedHarvestDate: planData.expectedHarvestDate ? 
          new Date(planData.expectedHarvestDate) : 
          timeline.expectedHarvest,
        area: planData.area
      },
      suitabilityAnalysis,
      timeline,
      resourceRequirements,
      riskAssessment,
      recommendations: generatePlanningRecommendations(
        suitabilityAnalysis,
        resourceRequirements,
        riskAssessment
      ),
      status: 'planned',
      createdBy: req.user._id,
      createdAt: new Date()
    };

    // Update farm with new crop plan
    const newCrop = {
      fieldId: planData.fieldId,
      cropName: planData.cropName,
      variety: planData.variety,
      plantingDate: cropPlan.cropDetails.plantingDate,
      expectedHarvestDate: cropPlan.cropDetails.expectedHarvestDate,
      growthStage: 'seedbed_preparation',
      area: planData.area,
      healthStatus: { overall: 'good' }
    };

    farm.currentCrops = farm.currentCrops || [];
    farm.currentCrops.push(newCrop);
    
    // Update field information
    if (farm.fields[fieldIndex]) {
      farm.fields[fieldIndex].currentCrop = planData.cropName;
      farm.fields[fieldIndex].status = 'preparation';
    }

    await farm.save();

    logger.info('Crop plan created', {
      planId: cropPlan.planId,
      userId: req.user._id,
      farmId: planData.farmId,
      cropName: planData.cropName,
      plantingDate: planData.plantingDate
    });

    res.status(201).json({
      status: 'success',
      message: 'Crop plan created successfully',
      data: {
        cropPlan: {
          planId: cropPlan.planId,
          cropDetails: cropPlan.cropDetails,
          suitability: suitabilityAnalysis.overallSuitability,
          timeline: timeline,
          keyRecommendations: cropPlan.recommendations.slice(0, 3),
          riskLevel: riskAssessment.overallRisk
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Crop planning failed', {
      userId: req.user._id,
      farmId: planData.farmId,
      cropName: planData.cropName,
      error: error.message
    });

    res.status(503).json({
      status: 'error',
      message: 'Crop planning service temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @route   GET /api/planning/recommendations/:farmId
 * @desc    Get crop recommendations for a farm
 * @access  Private
 */
router.get('/recommendations/:farmId', authenticateUser, asyncHandler(async (req, res) => {
  const { farmId } = req.params;
  const { season, nextPlanting } = req.query;

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
    const [longitude, latitude] = farm.location.centerPoint.coordinates;

    // Get environmental data
    const [soilData, weatherData] = await Promise.all([
      soilApi.getSoilProperties(latitude, longitude),
      weatherApi.getCurrentWeather(latitude, longitude)
    ]);

    // Analyze farm history
    const farmHistory = await analyzeFarmHistory(farmId);

    // Generate crop recommendations
    const recommendations = await generateCropRecommendations(
      farm,
      soilData,
      weatherData,
      farmHistory,
      season
    );

    // Get market insights (mock data)
    const marketInsights = generateMarketInsights(farm.location.country);

    // Sustainability recommendations
    const sustainabilityRecommendations = generateSustainabilityRecommendations(
      farm,
      farmHistory
    );

    res.json({
      status: 'success',
      data: {
        farmId,
        season: season || 'current',
        recommendations: {
          primaryRecommendations: recommendations.slice(0, 3),
          alternativeOptions: recommendations.slice(3, 6),
          marketInsights,
          sustainability: sustainabilityRecommendations
        },
        farmConditions: {
          soilQuality: soilData.properties?.pH ? 'tested' : 'estimated',
          weatherSuitability: 'favorable',
          riskFactors: farm.environmental?.riskFactors?.length || 0
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to generate crop recommendations', {
      farmId,
      error: error.message
    });

    res.status(503).json({
      status: 'error',
      message: 'Recommendation service temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @route   POST /api/planning/rotation
 * @desc    Create a crop rotation plan
 * @access  Private
 */
router.post('/rotation', authenticateUser, validateRotationPlan, handleValidationErrors, asyncHandler(async (req, res) => {
  const { farmId, rotationCycle, cycleDuration, startYear } = req.body;

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
    // Validate rotation cycle for sustainability
    const rotationAnalysis = analyzeRotationPlan(rotationCycle, farm.soilData);

    // Generate rotation schedule
    const rotationSchedule = generateRotationSchedule(
      rotationCycle,
      cycleDuration,
      startYear || new Date().getFullYear()
    );

    // Calculate benefits and impacts
    const rotationBenefits = calculateRotationBenefits(rotationCycle, farm);

    const rotationPlan = {
      rotationId: `ROT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      farmId,
      rotationCycle,
      cycleDuration,
      schedule: rotationSchedule,
      analysis: rotationAnalysis,
      benefits: rotationBenefits,
      status: 'active',
      createdBy: req.user._id,
      createdAt: new Date()
    };

    logger.info('Crop rotation plan created', {
      rotationId: rotationPlan.rotationId,
      userId: req.user._id,
      farmId,
      cycleDuration,
      cropsInRotation: rotationCycle.length
    });

    res.status(201).json({
      status: 'success',
      message: 'Crop rotation plan created successfully',
      data: {
        rotationPlan: {
          rotationId: rotationPlan.rotationId,
          cycle: rotationCycle,
          schedule: rotationSchedule.slice(0, 4), // Show first 4 seasons
          benefits: rotationBenefits,
          sustainabilityScore: rotationAnalysis.sustainabilityScore
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Rotation planning failed', {
      userId: req.user._id,
      farmId,
      error: error.message
    });

    res.status(500).json({
      status: 'error',
      message: 'Failed to create rotation plan',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @route   GET /api/planning/calendar/:farmId
 * @desc    Get farming calendar for a farm
 * @access  Private
 */
router.get('/calendar/:farmId', authenticateUser, asyncHandler(async (req, res) => {
  const { farmId } = req.params;
  const { year = new Date().getFullYear(), months = 12 } = req.query;

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
    // Generate farming calendar
    const calendar = await generateFarmingCalendar(farm, parseInt(year), parseInt(months));

    // Get weather patterns for the region
    const seasonalPatterns = getSeasonalPatterns(farm.location);

    // Add upcoming activities
    const upcomingActivities = getUpcomingActivities(farm, 30); // Next 30 days

    res.json({
      status: 'success',
      data: {
        farmId,
        year: parseInt(year),
        calendar,
        seasonalPatterns,
        upcomingActivities,
        totalActivities: calendar.reduce((sum, month) => sum + month.activities.length, 0)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to generate farming calendar', {
      farmId,
      year,
      error: error.message
    });

    res.status(500).json({
      status: 'error',
      message: 'Failed to generate farming calendar',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @route   GET /api/planning/harvest/:farmId
 * @desc    Get harvest planning and predictions
 * @access  Private
 */
router.get('/harvest/:farmId', authenticateUser, asyncHandler(async (req, res) => {
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
    // Calculate harvest predictions for current crops
    const harvestPredictions = [];
    
    for (const crop of farm.currentCrops || []) {
      if (crop.expectedHarvestDate) {
        const prediction = await generateHarvestPrediction(crop, farm);
        harvestPredictions.push(prediction);
      }
    }

    // Sort by harvest date
    harvestPredictions.sort((a, b) => new Date(a.expectedDate) - new Date(b.expectedDate));

    // Calculate harvest readiness
    const harvestReadiness = await assessHarvestReadiness(farm);

    // Generate post-harvest recommendations
    const postHarvestRecommendations = generatePostHarvestRecommendations(
      harvestPredictions,
      farm
    );

    res.json({
      status: 'success',
      data: {
        farmId,
        timeRange: parseInt(timeRange),
        harvestPredictions,
        harvestReadiness,
        postHarvestRecommendations,
        summary: {
          totalCropsToHarvest: harvestPredictions.length,
          nextHarvestDate: harvestPredictions[0]?.expectedDate,
          estimatedTotalYield: harvestPredictions.reduce((sum, p) => sum + (p.estimatedYield.amount || 0), 0)
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to generate harvest planning', {
      farmId,
      error: error.message
    });

    res.status(500).json({
      status: 'error',
      message: 'Failed to generate harvest planning',
      timestamp: new Date().toISOString()
    });
  }
}));

// Helper functions

/**
 * Analyze crop suitability for given conditions
 */
async function analyzeCropSuitability(cropName, variety, location, soilConditions, weatherForecast) {
  // Simplified suitability analysis
  const cropRequirements = getCropRequirements(cropName);
  const currentConditions = {
    climate: determineClimateType(location),
    soilType: soilConditions.soilType || 'loam',
    pH: soilConditions.properties?.pH || 7.0,
    rainfall: weatherForecast.forecast?.slice(0, 30).reduce((sum, day) => sum + (day.precipitation || 0), 0) || 0
  };

  let suitabilityScore = 80; // Base score
  const factors = [];

  // Climate suitability
  if (cropRequirements.climate.includes(currentConditions.climate)) {
    factors.push({ factor: 'climate', score: 90, status: 'excellent' });
  } else {
    suitabilityScore -= 20;
    factors.push({ factor: 'climate', score: 60, status: 'marginal' });
  }

  // Soil suitability
  if (Math.abs(cropRequirements.optimalPH - currentConditions.pH) < 1) {
    factors.push({ factor: 'soil_ph', score: 85, status: 'good' });
  } else {
    suitabilityScore -= 10;
    factors.push({ factor: 'soil_ph', score: 70, status: 'needs_adjustment' });
  }

  // Water requirements
  if (currentConditions.rainfall >= cropRequirements.minRainfall) {
    factors.push({ factor: 'water_availability', score: 90, status: 'adequate' });
  } else {
    suitabilityScore -= 15;
    factors.push({ factor: 'water_availability', score: 65, status: 'irrigation_needed' });
  }

  return {
    overallSuitability: suitabilityScore >= 80 ? 'excellent' : 
                       suitabilityScore >= 65 ? 'good' :
                       suitabilityScore >= 50 ? 'fair' : 'poor',
    suitabilityScore,
    factors,
    recommendations: factors
      .filter(f => f.score < 80)
      .map(f => `Improve ${f.factor.replace('_', ' ')} conditions`)
  };
}

/**
 * Generate crop timeline with key milestones
 */
function generateCropTimeline(cropName, plantingDate, expectedHarvestDate) {
  const cropData = getCropRequirements(cropName);
  const planting = new Date(plantingDate);
  
  // Calculate harvest date if not provided
  const harvest = expectedHarvestDate ? 
    new Date(expectedHarvestDate) : 
    new Date(planting.getTime() + cropData.growthDuration * 24 * 60 * 60 * 1000);

  const totalDays = Math.ceil((harvest - planting) / (1000 * 60 * 60 * 24));
  
  const milestones = [
    {
      stage: 'planting',
      date: planting,
      daysFromPlanting: 0,
      activities: ['soil_preparation', 'seed_planting', 'initial_watering']
    },
    {
      stage: 'germination',
      date: new Date(planting.getTime() + 7 * 24 * 60 * 60 * 1000),
      daysFromPlanting: 7,
      activities: ['monitor_emergence', 'light_watering', 'pest_monitoring']
    },
    {
      stage: 'vegetative',
      date: new Date(planting.getTime() + Math.floor(totalDays * 0.3) * 24 * 60 * 60 * 1000),
      daysFromPlanting: Math.floor(totalDays * 0.3),
      activities: ['fertilizer_application', 'weeding', 'pruning']
    },
    {
      stage: 'flowering',
      date: new Date(planting.getTime() + Math.floor(totalDays * 0.6) * 24 * 60 * 60 * 1000),
      daysFromPlanting: Math.floor(totalDays * 0.6),
      activities: ['pollination_support', 'increased_watering', 'disease_monitoring']
    },
    {
      stage: 'maturation',
      date: new Date(planting.getTime() + Math.floor(totalDays * 0.85) * 24 * 60 * 60 * 1000),
      daysFromPlanting: Math.floor(totalDays * 0.85),
      activities: ['reduce_watering', 'harvest_preparation', 'quality_assessment']
    },
    {
      stage: 'harvest',
      date: harvest,
      daysFromPlanting: totalDays,
      activities: ['harvesting', 'post_harvest_handling', 'storage_preparation']
    }
  ];

  return {
    plantingDate: planting,
    expectedHarvest: harvest,
    totalGrowthDays: totalDays,
    milestones,
    criticalPeriods: [
      { period: 'germination', importance: 'critical', days: '0-14' },
      { period: 'flowering', importance: 'high', days: `${Math.floor(totalDays * 0.5)}-${Math.floor(totalDays * 0.7)}` },
      { period: 'pre_harvest', importance: 'high', days: `${Math.floor(totalDays * 0.8)}-${totalDays}` }
    ]
  };
}

/**
 * Calculate resource requirements for crop plan
 */
function calculateResourceRequirements(cropName, area, soilData, timeline) {
  const cropData = getCropRequirements(cropName);
  const areaValue = area.value;
  
  return {
    seeds: {
      quantity: Math.round(cropData.seedRate * areaValue),
      unit: 'kg',
      estimatedCost: { amount: cropData.seedRate * areaValue * 5, currency: 'USD' }
    },
    fertilizer: {
      nitrogen: Math.round(cropData.nitrogenNeed * areaValue),
      phosphorus: Math.round(cropData.phosphorusNeed * areaValue),
      potassium: Math.round(cropData.potassiumNeed * areaValue),
      unit: 'kg',
      estimatedCost: { amount: areaValue * 100, currency: 'USD' }
    },
    water: {
      totalNeed: Math.round(cropData.waterNeed * areaValue),
      dailyAverage: Math.round(cropData.waterNeed * areaValue / timeline.totalGrowthDays),
      unit: 'liters',
      irrigationSchedule: 'every 2-3 days during growing season'
    },
    labor: {
      totalHours: Math.round(cropData.laborHours * areaValue),
      criticalPeriods: ['planting', 'weeding', 'harvesting'],
      estimatedCost: { amount: cropData.laborHours * areaValue * 10, currency: 'USD' }
    },
    equipment: [
      'hand_tools',
      'irrigation_equipment',
      'harvesting_tools'
    ],
    totalEstimatedCost: {
      amount: Math.round((cropData.seedRate * areaValue * 5) + (areaValue * 100) + (cropData.laborHours * areaValue * 10)),
      currency: 'USD'
    }
  };
}

/**
 * Assess crop risks
 */
async function assessCropRisks(cropName, location, plantingDate, existingRisks) {
  const seasonalRisks = getSeasonalRisks(location, plantingDate);
  const cropSpecificRisks = getCropSpecificRisks(cropName);
  
  const allRisks = [...seasonalRisks, ...cropSpecificRisks, ...existingRisks];
  
  // Calculate overall risk level
  const highRisks = allRisks.filter(r => r.impactLevel === 'severe' || r.probability === 'very_high').length;
  const moderateRisks = allRisks.filter(r => r.impactLevel === 'major' || r.probability === 'high').length;
  
  let overallRisk = 'low';
  if (highRisks > 0) overallRisk = 'high';
  else if (moderateRisks > 1) overallRisk = 'moderate';
  
  return {
    overallRisk,
    riskCount: allRisks.length,
    risks: allRisks.slice(0, 5), // Top 5 risks
    mitigationStrategies: allRisks.map(r => r.mitigationMeasures).flat().slice(0, 3)
  };
}

/**
 * Get crop requirements data
 */
function getCropRequirements(cropName) {
  const requirements = {
    tomato: {
      climate: ['temperate', 'subtropical'],
      optimalPH: 6.5,
      minRainfall: 500,
      growthDuration: 90,
      seedRate: 0.2,
      nitrogenNeed: 120,
      phosphorusNeed: 80,
      potassiumNeed: 100,
      waterNeed: 5000,
      laborHours: 100
    },
    corn: {
      climate: ['temperate', 'subtropical', 'tropical'],
      optimalPH: 6.8,
      minRainfall: 600,
      growthDuration: 120,
      seedRate: 25,
      nitrogenNeed: 150,
      phosphorusNeed: 60,
      potassiumNeed: 80,
      waterNeed: 6000,
      laborHours: 80
    },
    rice: {
      climate: ['tropical', 'subtropical'],
      optimalPH: 6.0,
      minRainfall: 1000,
      growthDuration: 120,
      seedRate: 40,
      nitrogenNeed: 100,
      phosphorusNeed: 50,
      potassiumNeed: 60,
      waterNeed: 15000,
      laborHours: 120
    }
  };

  return requirements[cropName.toLowerCase()] || requirements.tomato;
}

/**
 * Determine climate type from location
 */
function determineClimateType(location) {
  const lat = Math.abs(location.coordinates?.latitude || 0);
  
  if (lat >= 60) return 'arctic';
  if (lat >= 50) return 'subarctic';
  if (lat >= 40) return 'temperate';
  if (lat >= 23.5) return 'subtropical';
  return 'tropical';
}

/**
 * Generate other helper functions for planning
 */
function generatePlanningRecommendations(suitability, resources, risks) {
  const recommendations = [];
  
  if (suitability.suitabilityScore < 70) {
    recommendations.push('Consider soil testing and amendments before planting');
  }
  
  if (risks.overallRisk === 'high') {
    recommendations.push('Implement risk mitigation strategies before planting');
  }
  
  recommendations.push('Prepare resources in advance of planting date');
  recommendations.push('Monitor weather conditions closely');
  
  return recommendations;
}

async function analyzeFarmHistory(farmId) {
  // Analyze diagnosis history and irrigation logs
  const [diagnosisHistory, irrigationHistory] = await Promise.all([
    DiagnosisHistory.find({ farm: farmId }).limit(20),
    IrrigationLog.find({ farm: farmId }).limit(20)
  ]);

  return {
    commonDiseases: diagnosisHistory.map(d => d.analysisResults?.primaryDiagnosis?.condition).filter(Boolean),
    waterUsagePatterns: irrigationHistory.map(i => i.actualIrrigation?.waterUsed?.value).filter(Boolean),
    successfulCrops: [], // Would be calculated from actual harvest data
    challengeAreas: []
  };
}

async function generateCropRecommendations(farm, soilData, weatherData, farmHistory, season) {
  // Mock recommendations based on conditions
  const crops = ['tomato', 'corn', 'beans', 'lettuce', 'pepper', 'cucumber'];
  
  return crops.map(crop => ({
    cropName: crop,
    suitabilityScore: Math.floor(Math.random() * 30) + 70,
    reasons: [`Suitable for ${season || 'current'} season`, 'Good soil conditions', 'Favorable climate'],
    estimatedYield: `${Math.floor(Math.random() * 500) + 200} kg/hectare`,
    estimatedProfit: `$${Math.floor(Math.random() * 1000) + 500}`,
    riskLevel: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)]
  }));
}

function generateMarketInsights(country) {
  return {
    demandTrends: 'Increasing demand for organic vegetables',
    priceForecasts: 'Stable prices expected for next season',
    exportOpportunities: 'Regional markets showing growth',
    recommendations: ['Focus on quality over quantity', 'Consider organic certification']
  };
}

function generateSustainabilityRecommendations(farm, farmHistory) {
  return [
    'Implement crop rotation to improve soil health',
    'Consider cover crops during fallow periods',
    'Reduce chemical inputs through integrated pest management',
    'Implement water conservation techniques'
  ];
}

function analyzeRotationPlan(rotationCycle, soilData) {
  // Analyze the sustainability and benefits of the rotation
  let sustainabilityScore = 50;
  
  // Check for nitrogen-fixing crops
  const nitrogenFixers = ['beans', 'peas', 'legumes'];
  if (rotationCycle.some(crop => nitrogenFixers.includes(crop.cropName.toLowerCase()))) {
    sustainabilityScore += 20;
  }
  
  // Check for diversity
  if (rotationCycle.length >= 3) {
    sustainabilityScore += 15;
  }
  
  return {
    sustainabilityScore: Math.min(100, sustainabilityScore),
    benefits: ['Improved soil health', 'Reduced pest pressure', 'Better nutrient cycling'],
    concerns: sustainabilityScore < 70 ? ['Limited crop diversity', 'Consider adding nitrogen-fixing crops'] : []
  };
}

function generateRotationSchedule(rotationCycle, cycleDuration, startYear) {
  const schedule = [];
  
  for (let year = 0; year < cycleDuration; year++) {
    for (let seasonIndex = 0; seasonIndex < rotationCycle.length; seasonIndex++) {
      const crop = rotationCycle[seasonIndex];
      schedule.push({
        year: startYear + year,
        season: crop.season,
        cropName: crop.cropName,
        variety: crop.variety,
        estimatedPlantingDate: new Date(startYear + year, seasonIndex * 3, 1),
        estimatedHarvestDate: new Date(startYear + year, seasonIndex * 3 + 3, 1)
      });
    }
  }
  
  return schedule;
}

function calculateRotationBenefits(rotationCycle, farm) {
  return {
    soilHealthImprovement: 'Expected 15-25% improvement over 3 years',
    pestReduction: 'Estimated 30% reduction in pest pressure',
    yieldIncrease: 'Potential 10-20% yield increase after 2 years',
    costSavings: 'Reduced fertilizer costs by 15-20%',
    environmentalBenefits: ['Reduced chemical usage', 'Improved biodiversity', 'Better water retention']
  };
}

async function generateFarmingCalendar(farm, year, months) {
  const calendar = [];
  const startDate = new Date(year, 0, 1);
  
  for (let month = 0; month < months; month++) {
    const monthDate = new Date(year, month, 1);
    const monthName = monthDate.toLocaleString('default', { month: 'long' });
    
    const activities = generateMonthlyActivities(farm, month, year);
    
    calendar.push({
      month: monthName,
      year: year,
      monthNumber: month + 1,
      activities,
      weather: getMonthlyWeatherPattern(farm.location, month),
      recommendations: getMonthlyRecommendations(month, farm.location)
    });
  }
  
  return calendar;
}

function generateMonthlyActivities(farm, month, year) {
  // Generate activities based on current crops and seasonal patterns
  const activities = [];
  
  // Basic seasonal activities
  const seasonalActivities = {
    0: ['soil_testing', 'equipment_maintenance', 'planning'],
    1: ['field_preparation', 'seed_preparation'],
    2: ['early_planting', 'soil_preparation'],
    3: ['spring_planting', 'fertilizer_application'],
    4: ['crop_monitoring', 'pest_control'],
    5: ['irrigation_setup', 'weeding'],
    6: ['summer_maintenance', 'disease_monitoring'],
    7: ['harvest_preparation', 'water_management'],
    8: ['early_harvest', 'market_preparation'],
    9: ['main_harvest', 'post_harvest_handling'],
    10: ['field_cleanup', 'storage_management'],
    11: ['winter_preparation', 'planning_next_season']
  };
  
  return seasonalActivities[month] || [];
}

function getSeasonalPatterns(location) {
  return {
    drySeasonStart: 'November',
    rainySeasonStart: 'May',
    optimalPlantingPeriod: 'March - May',
    harvestSeason: 'August - October',
    riskPeriods: ['Drought: Dec-Feb', 'Heavy rains: Jun-Aug']
  };
}

function getUpcomingActivities(farm, days) {
  // Get activities for the next N days
  const activities = [];
  const currentDate = new Date();
  
  // Check current crops for upcoming milestones
  for (const crop of farm.currentCrops || []) {
    if (crop.expectedHarvestDate) {
      const harvestDate = new Date(crop.expectedHarvestDate);
      const daysUntilHarvest = Math.ceil((harvestDate - currentDate) / (1000 * 60 * 60 * 24));
      
      if (daysUntilHarvest > 0 && daysUntilHarvest <= days) {
        activities.push({
          date: harvestDate,
          activity: 'harvest',
          cropName: crop.cropName,
          fieldId: crop.fieldId,
          priority: daysUntilHarvest <= 7 ? 'high' : 'medium'
        });
      }
    }
  }
  
  return activities.sort((a, b) => new Date(a.date) - new Date(b.date));
}

async function generateHarvestPrediction(crop, farm) {
  // Generate harvest prediction based on crop data
  const growthProgress = calculateGrowthProgress(crop);
  
  return {
    cropName: crop.cropName,
    fieldId: crop.fieldId,
    currentGrowthStage: crop.growthStage,
    growthProgress: growthProgress,
    expectedDate: crop.expectedHarvestDate,
    estimatedYield: {
      amount: Math.floor(Math.random() * 500) + 200,
      unit: 'kg',
      confidence: growthProgress > 80 ? 'high' : 'moderate'
    },
    quality: 'good',
    marketReadiness: calculateMarketReadiness(crop),
    recommendations: [
      'Monitor ripeness indicators daily',
      'Prepare harvesting equipment',
      'Arrange transportation and storage'
    ]
  };
}

function calculateGrowthProgress(crop) {
  const plantingDate = new Date(crop.plantingDate);
  const expectedHarvest = new Date(crop.expectedHarvestDate);
  const currentDate = new Date();
  
  const totalDays = Math.ceil((expectedHarvest - plantingDate) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.ceil((currentDate - plantingDate) / (1000 * 60 * 60 * 24));
  
  return Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));
}

async function assessHarvestReadiness(farm) {
  // Assess which crops are ready or nearly ready for harvest
  const readinessCriteria = [];
  
  for (const crop of farm.currentCrops || []) {
    const daysToHarvest = crop.expectedHarvestDate ? 
      Math.ceil((new Date(crop.expectedHarvestDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
    
    if (daysToHarvest !== null) {
      readinessCriteria.push({
        cropName: crop.cropName,
        fieldId: crop.fieldId,
        daysToHarvest,
        readinessStatus: daysToHarvest <= 0 ? 'ready' :
                        daysToHarvest <= 7 ? 'almost_ready' :
                        daysToHarvest <= 14 ? 'approaching' : 'growing',
        qualityIndicators: ['color', 'size', 'firmness'],
        harvestWindow: daysToHarvest <= 0 ? 'immediate' : `${daysToHarvest} days`
      });
    }
  }
  
  return readinessCriteria.sort((a, b) => a.daysToHarvest - b.daysToHarvest);
}

function generatePostHarvestRecommendations(harvestPredictions, farm) {
  return [
    'Clean and prepare storage facilities',
    'Plan for timely transportation to markets',
    'Consider value-addition opportunities',
    'Document harvest yields for future planning',
    'Prepare fields for next planting cycle'
  ];
}

function getSeasonalRisks(location, plantingDate) {
  return [
    { type: 'drought', probability: 'moderate', impactLevel: 'major', mitigationMeasures: ['irrigation', 'drought-resistant varieties'] },
    { type: 'pest_outbreak', probability: 'low', impactLevel: 'moderate', mitigationMeasures: ['monitoring', 'integrated pest management'] }
  ];
}

function getCropSpecificRisks(cropName) {
  const risks = {
    tomato: [
      { type: 'late_blight', probability: 'high', impactLevel: 'severe', mitigationMeasures: ['fungicide application', 'proper spacing'] }
    ],
    corn: [
      { type: 'corn_borer', probability: 'moderate', impactLevel: 'major', mitigationMeasures: ['pheromone traps', 'resistant varieties'] }
    ]
  };
  
  return risks[cropName.toLowerCase()] || [];
}

function getMonthlyWeatherPattern(location, month) {
  // Simplified weather patterns
  const patterns = {
    0: 'Cool and dry',
    1: 'Cool, increasing humidity',
    2: 'Warming, occasional rains',
    3: 'Warm, spring rains',
    4: 'Warm and humid',
    5: 'Hot, rainy season begins',
    6: 'Hot and wet',
    7: 'Hot and wet',
    8: 'Warm, rains decreasing',
    9: 'Warm and drier',
    10: 'Cooling, dry',
    11: 'Cool and dry'
  };
  
  return patterns[month] || 'Variable';
}

function getMonthlyRecommendations(month, location) {
  const recommendations = {
    0: ['Plan crop rotations', 'Maintain equipment', 'Soil testing'],
    1: ['Prepare seedbeds', 'Order seeds and inputs'],
    2: ['Begin early plantings', 'Soil preparation'],
    3: ['Main planting season', 'Apply base fertilizers'],
    4: ['Monitor for pests', 'Begin weeding'],
    5: ['Irrigation management', 'Disease monitoring'],
    6: ['Intensive crop care', 'Water management'],
    7: ['Prepare for harvest', 'Pest control'],
    8: ['Begin harvesting', 'Market preparation'],
    9: ['Main harvest', 'Post-harvest handling'],
    10: ['Field cleanup', 'Storage management'],
    11: ['Winter preparations', 'Plan next season']
  };
  
  return recommendations[month] || [];
}

function calculateMarketReadiness(crop) {
  // Calculate market readiness score
  const factors = {
    timing: 80, // Good timing for market
    quality: 85, // Expected quality
    quantity: 75, // Expected quantity
    demand: 90   // Market demand
  };
  
  const overallScore = Object.values(factors).reduce((sum, score) => sum + score, 0) / 4;
  
  return {
    overallScore: Math.round(overallScore),
    factors,
    marketAdvice: overallScore > 80 ? 'Excellent market conditions' : 'Good market opportunity'
  };
}

module.exports = router;