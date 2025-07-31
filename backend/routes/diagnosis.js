/**
 * Crop Health Diagnosis Routes for AgriSphere
 * Handles disease detection, pest identification, treatment recommendations, and diagnosis tracking
 * Core functionality for AI-powered agricultural assistance
 */

const express = require('express');
const { body, param, query } = require('express-validator');
const DiagnosisHistory = require('../models/DiagnosisHistory');
const Farm = require('../models/Farm');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { handleValidationErrors } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const cropHealthApi = require('../services/cropHealthApi');

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

// Validation middleware for diagnosis creation
const validateDiagnosisRequest = [
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
    .isIn(['seedling', 'vegetative', 'flowering', 'fruiting', 'maturation', 'harvest_ready'])
    .withMessage('Invalid growth stage'),
  
  body('diagnosisRequest.requestType')
    .isIn(['image_analysis', 'symptom_description', 'pest_identification', 'disease_identification', 'general_health'])
    .withMessage('Invalid request type'),
  
  body('diagnosisRequest.symptoms')
    .isArray({ min: 1 })
    .withMessage('At least one symptom must be provided'),
  
  body('diagnosisRequest.affectedArea.percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Affected area percentage must be between 0 and 100')
];

// Validation middleware for treatment update
const validateTreatmentUpdate = [
  body('treatment')
    .trim()
    .notEmpty()
    .withMessage('Treatment description is required'),
  
  body('applicationDate')
    .isISO8601()
    .withMessage('Valid application date is required'),
  
  body('method')
    .trim()
    .notEmpty()
    .withMessage('Application method is required'),
  
  body('effectiveness')
    .optional()
    .isIn(['poor', 'fair', 'good', 'excellent', 'unknown'])
    .withMessage('Invalid effectiveness rating')
];

/**
 * @route   POST /api/diagnosis
 * @desc    Create a new crop health diagnosis
 * @access  Private
 */
router.post('/', authenticateUser, validateDiagnosisRequest, handleValidationErrors, asyncHandler(async (req, res) => {
  const diagnosisData = {
    ...req.body,
    user: req.user._id
  };

  // Verify farm ownership
  const farm = await Farm.findOne({
    _id: diagnosisData.farmId,
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
  const field = farm.fields?.find(f => f.fieldId === diagnosisData.fieldId);
  if (!field) {
    return res.status(400).json({
      status: 'error',
      message: 'Field not found in the specified farm',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Analyze crop condition using AI service
    let analysisResults = null;
    
    if (diagnosisData.diagnosisRequest.requestType === 'image_analysis' && diagnosisData.imageData) {
      // Process image analysis
      analysisResults = await cropHealthApi.analyzeCropImage(
        diagnosisData.imageData[0], 
        diagnosisData.cropInfo.cropName
      );
    } else {
      // Generate analysis based on symptoms
      analysisResults = await generateSymptomBasedDiagnosis(
        diagnosisData.cropInfo.cropName,
        diagnosisData.diagnosisRequest.symptoms
      );
    }

    // Get treatment recommendations
    const treatmentRecommendations = await getTreatmentRecommendations(
      analysisResults.primaryDiagnosis,
      diagnosisData.cropInfo.cropName,
      diagnosisData.diagnosisRequest.affectedArea
    );

    // Calculate economic impact
    const economicImpact = await calculateEconomicImpact(
      analysisResults.primaryDiagnosis,
      diagnosisData.diagnosisRequest.affectedArea,
      farm.farmInfo.totalArea
    );

    // Create diagnosis record
    const diagnosis = new DiagnosisHistory({
      ...diagnosisData,
      analysisResults: {
        primaryDiagnosis: analysisResults.primaryDiagnosis,
        alternativeDiagnoses: analysisResults.alternatives || [],
        analysisMethod: diagnosisData.diagnosisRequest.requestType === 'image_analysis' ? 
          'ai_image_recognition' : 'symptom_matching',
        processingTime: analysisResults.processingTime || 2.5,
        qualityAssessment: {
          diagnosisReliability: analysisResults.primaryDiagnosis.confidence > 80 ? 'high' : 
                               analysisResults.primaryDiagnosis.confidence > 60 ? 'moderate' : 'low',
          recommendsExpertReview: analysisResults.primaryDiagnosis.confidence < 70
        }
      },
      treatmentRecommendations,
      economicImpact,
      metadata: {
        source: 'mobile_app',
        deviceInfo: req.headers['user-agent'] || 'unknown'
      }
    });

    await diagnosis.save();

    // Update user's diagnosis count
    req.user.appUsage.totalDiagnoses = (req.user.appUsage.totalDiagnoses || 0) + 1;
    await req.user.save();

    logger.info('New diagnosis created', {
      diagnosisId: diagnosis.diagnosisId,
      userId: req.user._id,
      farmId: farm._id,
      cropName: diagnosisData.cropInfo.cropName,
      condition: analysisResults.primaryDiagnosis.condition,
      confidence: analysisResults.primaryDiagnosis.confidence
    });

    res.status(201).json({
      status: 'success',
      message: 'Diagnosis completed successfully',
      data: {
        diagnosis: {
          diagnosisId: diagnosis.diagnosisId,
          primaryDiagnosis: diagnosis.analysisResults.primaryDiagnosis,
          treatmentRecommendations: diagnosis.treatmentRecommendations,
          economicImpact: diagnosis.economicImpact,
          urgency: diagnosis.treatmentUrgency,
          followUpRequired: true,
          createdAt: diagnosis.createdAt
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Diagnosis analysis failed', {
      userId: req.user._id,
      cropName: diagnosisData.cropInfo.cropName,
      error: error.message
    });

    res.status(503).json({
      status: 'error',
      message: 'Diagnosis service temporarily unavailable. Please try again later.',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @route   GET /api/diagnosis
 * @desc    Get user's diagnosis history
 * @access  Private
 */
router.get('/', authenticateUser, asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    status, 
    cropName, 
    farmId,
    timeRange = 30 
  } = req.query;

  const query = { user: req.user._id };

  // Apply filters
  if (status) {
    query['followUp.status'] = status;
  }
  
  if (cropName) {
    query['cropInfo.cropName'] = new RegExp(cropName, 'i');
  }
  
  if (farmId) {
    query.farm = farmId;
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

  const diagnoses = await DiagnosisHistory.find(query)
    .populate(options.populate)
    .sort(options.sort)
    .limit(options.limit * 1)
    .skip((options.page - 1) * options.limit)
    .select('-imageData -metadata.processingDetails');

  const total = await DiagnosisHistory.countDocuments(query);

  res.json({
    status: 'success',
    data: {
      diagnoses,
      pagination: {
        currentPage: options.page,
        totalPages: Math.ceil(total / options.limit),
        totalDiagnoses: total,
        hasNextPage: options.page < Math.ceil(total / options.limit),
        hasPrevPage: options.page > 1
      }
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/diagnosis/:diagnosisId
 * @desc    Get detailed diagnosis information
 * @access  Private
 */
router.get('/:diagnosisId', authenticateUser, asyncHandler(async (req, res) => {
  const { diagnosisId } = req.params;

  const diagnosis = await DiagnosisHistory.findOne({
    diagnosisId,
    user: req.user._id
  }).populate([
    {
      path: 'farm',
      select: 'farmInfo.name location.address'
    },
    {
      path: 'user',
      select: 'personalInfo.firstName personalInfo.lastName'
    }
  ]);

  if (!diagnosis) {
    return res.status(404).json({
      status: 'error',
      message: 'Diagnosis not found',
      timestamp: new Date().toISOString()
    });
  }

  // Get similar diagnoses for reference
  const similarDiagnoses = await DiagnosisHistory.findSimilarDiagnoses(
    diagnosis.cropInfo.cropName,
    diagnosis.analysisResults.primaryDiagnosis.condition,
    3
  );

  res.json({
    status: 'success',
    data: {
      diagnosis,
      similarCases: similarDiagnoses,
      diagnosticMetrics: {
        age: diagnosis.diagnosisAge,
        urgency: diagnosis.treatmentUrgency,
        costImpact: diagnosis.costImpact
      }
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   PUT /api/diagnosis/:diagnosisId/treatment
 * @desc    Update treatment status and add treatment information
 * @access  Private
 */
router.put('/:diagnosisId/treatment', authenticateUser, validateTreatmentUpdate, handleValidationErrors, asyncHandler(async (req, res) => {
  const { diagnosisId } = req.params;
  const treatmentData = req.body;

  const diagnosis = await DiagnosisHistory.findOne({
    diagnosisId,
    user: req.user._id
  });

  if (!diagnosis) {
    return res.status(404).json({
      status: 'error',
      message: 'Diagnosis not found',
      timestamp: new Date().toISOString()
    });
  }

  await diagnosis.updateTreatmentStatus(treatmentData);

  logger.info('Treatment updated', {
    diagnosisId: diagnosis.diagnosisId,
    userId: req.user._id,
    treatment: treatmentData.treatment
  });

  res.json({
    status: 'success',
    message: 'Treatment information updated successfully',
    data: {
      diagnosis: {
        diagnosisId: diagnosis.diagnosisId,
        followUpStatus: diagnosis.followUp.status,
        treatmentsApplied: diagnosis.followUp.treatmentsApplied,
        lastUpdate: new Date()
      }
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   POST /api/diagnosis/:diagnosisId/progress
 * @desc    Add progress update to diagnosis
 * @access  Private
 */
router.post('/:diagnosisId/progress', authenticateUser, asyncHandler(async (req, res) => {
  const { diagnosisId } = req.params;
  const { status, description, images = [], nextAction } = req.body;

  if (!status || !description) {
    return res.status(400).json({
      status: 'error',
      message: 'Status and description are required',
      timestamp: new Date().toISOString()
    });
  }

  const diagnosis = await DiagnosisHistory.findOne({
    diagnosisId,
    user: req.user._id
  });

  if (!diagnosis) {
    return res.status(404).json({
      status: 'error',
      message: 'Diagnosis not found',
      timestamp: new Date().toISOString()
    });
  }

  const updateData = {
    status,
    description,
    images,
    nextAction
  };

  await diagnosis.addProgressUpdate(updateData);

  logger.info('Progress update added', {
    diagnosisId: diagnosis.diagnosisId,
    userId: req.user._id,
    status,
    description: description.substring(0, 100)
  });

  res.json({
    status: 'success',
    message: 'Progress update added successfully',
    data: {
      diagnosis: {
        diagnosisId: diagnosis.diagnosisId,
        currentStatus: diagnosis.followUp.status,
        progressUpdates: diagnosis.followUp.progressUpdates,
        lastUpdate: new Date()
      }
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/diagnosis/stats
 * @desc    Get diagnosis statistics and insights
 * @access  Private
 */
router.get('/stats/overview', authenticateUser, asyncHandler(async (req, res) => {
  const { timeRange = 30 } = req.query;

  // Get user's diagnosis statistics
  const stats = await DiagnosisHistory.getDiagnosisStats(parseInt(timeRange));
  
  // Get user-specific statistics
  const userStats = await DiagnosisHistory.aggregate([
    { $match: { user: req.user._id } },
    {
      $group: {
        _id: null,
        totalDiagnoses: { $sum: 1 },
        resolvedCases: {
          $sum: { $cond: [{ $eq: ['$followUp.status', 'resolved'] }, 1, 0] }
        },
        avgConfidence: { $avg: '$analysisResults.primaryDiagnosis.confidence' },
        commonCrops: { $push: '$cropInfo.cropName' },
        commonConditions: { $push: '$analysisResults.primaryDiagnosis.condition' }
      }
    }
  ]);

  const treatmentEffectiveness = await DiagnosisHistory.find({
    user: req.user._id,
    'followUp.treatmentsApplied.0': { $exists: true }
  }).then(diagnoses => {
    return diagnoses.map(d => d.calculateTreatmentEffectiveness()).filter(Boolean);
  });

  const overview = {
    userStatistics: userStats[0] || {
      totalDiagnoses: 0,
      resolvedCases: 0,
      avgConfidence: 0,
      commonCrops: [],
      commonConditions: []
    },
    systemStatistics: stats[0] || {},
    treatmentEffectiveness: treatmentEffectiveness.length > 0 ? {
      averageEffectiveness: Math.round(
        treatmentEffectiveness.reduce((sum, t) => sum + t.averageEffectiveness, 0) / treatmentEffectiveness.length
      ),
      totalTreatments: treatmentEffectiveness.reduce((sum, t) => sum + t.treatmentCount, 0)
    } : null,
    recommendations: [
      'Continue regular crop monitoring',
      'Implement preventive measures based on common conditions',
      'Keep detailed records of treatment outcomes'
    ]
  };

  res.json({
    status: 'success',
    data: {
      overview,
      timeRange: parseInt(timeRange)
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @route   GET /api/diagnosis/conditions/:cropName
 * @desc    Get common conditions and treatments for a specific crop
 * @access  Private
 */
router.get('/conditions/:cropName', authenticateUser, asyncHandler(async (req, res) => {
  const { cropName } = req.params;

  try {
    // Get treatment success rates for this crop
    const successRates = await DiagnosisHistory.getTreatmentSuccessRates(cropName);
    
    // Get common conditions for this crop
    const commonConditions = await DiagnosisHistory.aggregate([
      { 
        $match: { 
          'cropInfo.cropName': new RegExp(cropName, 'i'),
          'analysisResults.primaryDiagnosis.confidence': { $gte: 60 }
        }
      },
      {
        $group: {
          _id: '$analysisResults.primaryDiagnosis.condition',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$analysisResults.primaryDiagnosis.confidence' },
          severity: { $push: '$analysisResults.primaryDiagnosis.severity' },
          conditionType: { $first: '$analysisResults.primaryDiagnosis.conditionType' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get prevention tips from database or service
    const preventionTips = await getPreventionTips(cropName);

    res.json({
      status: 'success',
      data: {
        cropName,
        commonConditions,
        treatmentSuccessRates: successRates,
        preventionTips,
        totalRecords: commonConditions.reduce((sum, c) => sum + c.count, 0)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get crop conditions', {
      cropName,
      error: error.message
    });

    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve crop condition data',
      timestamp: new Date().toISOString()
    });
  }
}));

// Helper functions

/**
 * Generate symptom-based diagnosis
 */
async function generateSymptomBasedDiagnosis(cropName, symptoms) {
  // This would integrate with the crop health API
  // For now, return a mock diagnosis
  const commonConditions = {
    'leaf_discoloration': 'nutrient_deficiency',
    'spots_on_leaves': 'fungal_disease',
    'wilting': 'water_stress',
    'holes_in_leaves': 'pest_damage'
  };

  const primarySymptom = symptoms[0]?.type;
  const condition = commonConditions[primarySymptom] || 'unknown_condition';
  
  return {
    primaryDiagnosis: {
      condition,
      conditionType: 'disease',
      confidence: Math.floor(Math.random() * 30) + 60, // 60-90%
      severity: symptoms.length > 2 ? 'high' : 'moderate'
    },
    alternatives: [
      {
        condition: 'alternative_condition',
        confidence: Math.floor(Math.random() * 20) + 40,
        reasoning: 'Similar symptoms observed'
      }
    ],
    processingTime: Math.random() * 2 + 1
  };
}

/**
 * Get treatment recommendations based on diagnosis
 */
async function getTreatmentRecommendations(diagnosis, cropName, affectedArea) {
  try {
    // Use crop health API to get detailed recommendations
    const diseaseInfo = await cropHealthApi.getDiseaseInfo(cropName, diagnosis.condition);
    
    return {
      immediate: diseaseInfo.treatment.immediate.map(action => ({
        action,
        priority: diagnosis.severity === 'critical' ? 'urgent' : 'high',
        timeline: 'within 24 hours',
        description: `Apply ${action} to affected plants`,
        materials: [{
          item: action,
          quantity: 'as needed',
          estimatedCost: { amount: 50, currency: 'USD' }
        }]
      })),
      longTerm: diseaseInfo.treatment.longTerm?.map(action => ({
        action,
        timeline: 'next 1-2 weeks',
        description: action,
        rationale: 'Prevent recurrence and improve plant health'
      })) || [],
      prevention: diseaseInfo.treatment.longTerm?.map(measure => ({
        measure,
        timing: 'next growing season',
        frequency: 'seasonal',
        description: measure,
        effectiveness: 'high'
      })) || [],
      monitoring: {
        frequency: diagnosis.severity === 'high' ? 'daily' : 'weekly',
        indicators: ['symptom progression', 'new infections', 'plant recovery'],
        criticalSigns: ['rapid spread', 'plant death', 'yield loss']
      }
    };
  } catch (error) {
    logger.error('Failed to get treatment recommendations', { error: error.message });
    
    // Return basic recommendations as fallback
    return {
      immediate: [{
        action: 'Isolate affected plants',
        priority: 'high',
        timeline: 'immediately',
        description: 'Prevent spread to healthy plants'
      }],
      longTerm: [{
        action: 'Monitor plant health',
        timeline: 'ongoing',
        description: 'Regular inspection and care'
      }],
      prevention: [{
        measure: 'Maintain good plant hygiene',
        timing: 'ongoing',
        frequency: 'daily',
        description: 'Remove dead leaves and maintain cleanliness'
      }],
      monitoring: {
        frequency: 'daily',
        indicators: ['symptom changes'],
        criticalSigns: ['worsening condition']
      }
    };
  }
}

/**
 * Calculate economic impact of the condition
 */
async function calculateEconomicImpact(diagnosis, affectedArea, farmArea) {
  const severity = diagnosis.severity;
  const percentage = affectedArea?.percentage || 10;
  const farmValue = farmArea?.value || 1;
  
  // Basic economic impact calculation
  const yieldLossPercentage = {
    'low': 5,
    'moderate': 15,
    'high': 30,
    'critical': 50
  }[severity] || 15;
  
  const estimatedLoss = (percentage / 100) * yieldLossPercentage * farmValue * 1000; // $1000 per unit area
  const treatmentCost = severity === 'critical' ? 200 : severity === 'high' ? 100 : 50;
  
  return {
    currentLoss: {
      yieldReduction: { percentage: yieldLossPercentage },
      estimatedValue: { amount: estimatedLoss, currency: 'USD' }
    },
    treatmentCosts: {
      immediate: { amount: treatmentCost, currency: 'USD' },
      total: { amount: treatmentCost * 1.5, currency: 'USD' }
    },
    potentialLoss: {
      ifUntreated: {
        yieldLoss: yieldLossPercentage * 2,
        estimatedValue: { amount: estimatedLoss * 2, currency: 'USD' }
      },
      spreadRisk: severity === 'critical' ? 'very_high' : 'moderate'
    }
  };
}

/**
 * Get prevention tips for a crop
 */
async function getPreventionTips(cropName) {
  const tips = {
    tomato: [
      'Maintain proper spacing between plants',
      'Avoid overhead watering',
      'Practice crop rotation',
      'Remove diseased plant material promptly'
    ],
    corn: [
      'Plant disease-resistant varieties',
      'Ensure good drainage',
      'Monitor for pest insects',
      'Maintain proper nutrition'
    ],
    rice: [
      'Manage water levels carefully',
      'Use certified clean seeds',
      'Practice proper field sanitation',
      'Monitor for blast disease'
    ]
  };
  
  return tips[cropName.toLowerCase()] || [
    'Practice good field hygiene',
    'Monitor crops regularly',
    'Use appropriate fertilizers',
    'Implement integrated pest management'
  ];
}

module.exports = router;