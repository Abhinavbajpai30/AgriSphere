/**
 * DiagnosisHistory Model for AgriSphere
 * Stores crop health diagnoses, disease detection results, and treatment recommendations
 * Essential for tracking crop health over time and building agricultural knowledge base
 */

const mongoose = require('mongoose');

const diagnosisHistorySchema = new mongoose.Schema({
  // Basic Diagnosis Information
  diagnosisId: {
    type: String,
    required: true,
    default: function() {
      return `DX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  },
  
  // User and Farm References
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  farm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: [true, 'Farm reference is required'],
    index: true
  },
  fieldId: {
    type: String,
    required: [true, 'Field ID is required'],
    index: true
  },

  // Crop Information
  cropInfo: {
    cropName: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true
    },
    variety: {
      type: String,
      trim: true
    },
    growthStage: {
      type: String,
      enum: ['seedling', 'vegetative', 'flowering', 'fruiting', 'maturation', 'harvest_ready'],
      required: [true, 'Growth stage is required']
    },
    plantingDate: {
      type: Date
    },
    cropAge: {
      value: Number,
      unit: {
        type: String,
        enum: ['days', 'weeks', 'months'],
        default: 'days'
      }
    }
  },

  // Diagnosis Request Details
  diagnosisRequest: {
    requestType: {
      type: String,
      enum: ['image_analysis', 'symptom_description', 'pest_identification', 'disease_identification', 'general_health'],
      required: [true, 'Request type is required']
    },
    symptoms: [{
      type: {
        type: String,
        enum: ['leaf_discoloration', 'spots_on_leaves', 'wilting', 'stunted_growth', 'holes_in_leaves', 'unusual_growth', 'fruit_damage', 'stem_damage', 'root_issues', 'pest_presence']
      },
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe', 'critical']
      },
      description: String,
      location: {
        type: String,
        enum: ['leaves', 'stems', 'fruits', 'flowers', 'roots', 'whole_plant']
      },
      firstObserved: Date,
      progression: {
        type: String,
        enum: ['stable', 'improving', 'worsening', 'spreading']
      }
    }],
    affectedArea: {
      percentage: {
        type: Number,
        min: [0, 'Affected area cannot be negative'],
        max: [100, 'Affected area cannot exceed 100%']
      },
      description: String, // "few plants", "entire field", "corner section", etc.
      estimatedPlantCount: Number
    },
    environmentalConditions: {
      weather: {
        recentRainfall: {
          type: String,
          enum: ['none', 'light', 'moderate', 'heavy', 'excessive']
        },
        temperature: {
          type: String,
          enum: ['cold', 'cool', 'moderate', 'warm', 'hot', 'extreme']
        },
        humidity: {
          type: String,
          enum: ['low', 'moderate', 'high', 'very_high']
        },
        windConditions: {
          type: String,
          enum: ['calm', 'light', 'moderate', 'strong']
        }
      },
      irrigation: {
        method: String,
        frequency: String,
        lastWatered: Date,
        waterSource: String
      },
      recentTreatments: [{
        type: {
          type: String,
          enum: ['fertilizer', 'pesticide', 'fungicide', 'herbicide', 'organic_treatment']
        },
        product: String,
        applicationDate: Date,
        method: String
      }]
    }
  },

  // Image Data (if applicable)
  imageData: [{
    imageId: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required']
    },
    thumbnailUrl: String,
    imageType: {
      type: String,
      enum: ['affected_plant', 'healthy_comparison', 'close_up', 'field_overview', 'pest_photo']
    },
    captureDetails: {
      timestamp: {
        type: Date,
        default: Date.now
      },
      deviceInfo: String,
      gpsLocation: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      },
      imageQuality: {
        type: String,
        enum: ['poor', 'fair', 'good', 'excellent']
      },
      lighting: {
        type: String,
        enum: ['poor', 'adequate', 'good', 'optimal']
      }
    },
    metadata: {
      fileSize: Number, // bytes
      dimensions: {
        width: Number,
        height: Number
      },
      format: String // jpg, png, etc.
    }
  }],

  // AI/Expert Analysis Results
  analysisResults: {
    primaryDiagnosis: {
      condition: {
        type: String,
        required: [true, 'Primary diagnosis condition is required']
      },
      conditionType: {
        type: String,
        enum: ['disease', 'pest', 'nutrient_deficiency', 'environmental_stress', 'genetic_disorder', 'physical_damage'],
        required: [true, 'Condition type is required']
      },
      confidence: {
        type: Number,
        min: [0, 'Confidence cannot be negative'],
        max: [100, 'Confidence cannot exceed 100%'],
        required: [true, 'Confidence level is required']
      },
      severity: {
        type: String,
        enum: ['low', 'moderate', 'high', 'critical'],
        required: [true, 'Severity level is required']
      },
      causativeAgent: {
        scientificName: String,
        commonName: String,
        category: {
          type: String,
          enum: ['fungus', 'bacteria', 'virus', 'insect', 'mite', 'nematode', 'abiotic', 'unknown']
        }
      }
    },
    alternativeDiagnoses: [{
      condition: String,
      conditionType: String,
      confidence: Number,
      reasoning: String
    }],
    analysisMethod: {
      type: String,
      enum: ['ai_image_recognition', 'expert_review', 'symptom_matching', 'hybrid_analysis'],
      required: [true, 'Analysis method is required']
    },
    processingTime: {
      type: Number, // seconds
      min: 0
    },
    modelVersion: String,
    qualityAssessment: {
      imageQuality: {
        type: String,
        enum: ['insufficient', 'poor', 'adequate', 'good', 'excellent']
      },
      diagnosisReliability: {
        type: String,
        enum: ['low', 'moderate', 'high', 'very_high']
      },
      recommendsExpertReview: {
        type: Boolean,
        default: false
      }
    }
  },

  // Treatment Recommendations
  treatmentRecommendations: {
    immediate: [{
      action: {
        type: String,
        required: [true, 'Immediate action is required']
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
      },
      timeline: String, // "within 24 hours", "immediately", etc.
      description: String,
      materials: [{
        item: String,
        quantity: String,
        estimatedCost: {
          amount: Number,
          currency: String
        }
      }],
      method: String,
      precautions: [String]
    }],
    longTerm: [{
      action: String,
      timeline: String,
      description: String,
      rationale: String,
      materials: [{
        item: String,
        quantity: String,
        estimatedCost: {
          amount: Number,
          currency: String
        }
      }]
    }],
    prevention: [{
      measure: String,
      timing: String,
      frequency: String,
      description: String,
      effectiveness: {
        type: String,
        enum: ['low', 'moderate', 'high', 'very_high']
      }
    }],
    monitoring: {
      frequency: String,
      indicators: [String],
      criticalSigns: [String],
      followUpSchedule: [{
        date: Date,
        action: String,
        completed: {
          type: Boolean,
          default: false
        }
      }]
    },
    estimatedRecoveryTime: {
      minimum: {
        value: Number,
        unit: String
      },
      maximum: {
        value: Number,
        unit: String
      },
      factors: [String] // conditions affecting recovery time
    }
  },

  // Economic Impact Assessment
  economicImpact: {
    currentLoss: {
      yieldReduction: {
        percentage: Number,
        estimatedValue: {
          amount: Number,
          currency: String
        }
      },
      qualityImpact: {
        type: String,
        enum: ['none', 'minor', 'moderate', 'significant', 'severe']
      }
    },
    treatmentCosts: {
      immediate: {
        amount: Number,
        currency: String
      },
      total: {
        amount: Number,
        currency: String
      },
      breakdown: [{
        category: String,
        amount: Number,
        description: String
      }]
    },
    potentialLoss: {
      ifUntreated: {
        yieldLoss: Number, // percentage
        estimatedValue: {
          amount: Number,
          currency: String
        }
      },
      spreadRisk: {
        type: String,
        enum: ['low', 'moderate', 'high', 'very_high']
      },
      timeToSpread: String
    },
    costBenefitAnalysis: {
      recommendedTreatment: {
        type: String,
        enum: ['highly_recommended', 'recommended', 'optional', 'not_recommended']
      },
      reasoning: String,
      returnOnInvestment: Number // percentage
    }
  },

  // Follow-up and Treatment Status
  followUp: {
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'treated', 'resolved', 'worsened', 'abandoned'],
      default: 'pending'
    },
    treatmentsApplied: [{
      treatment: String,
      applicationDate: Date,
      method: String,
      quantity: String,
      cost: {
        amount: Number,
        currency: String
      },
      effectiveness: {
        type: String,
        enum: ['poor', 'fair', 'good', 'excellent', 'unknown']
      },
      sideEffects: [String],
      appliedBy: String,
      notes: String
    }],
    progressUpdates: [{
      date: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['improved', 'stable', 'worsened', 'resolved', 'new_symptoms']
      },
      description: String,
      images: [String], // URLs to progress images
      nextAction: String
    }],
    finalOutcome: {
      result: {
        type: String,
        enum: ['fully_recovered', 'partially_recovered', 'crop_lost', 'ongoing_treatment', 'unknown']
      },
      yieldImpact: {
        actualLoss: Number, // percentage
        comparedToExpected: String
      },
      lessonsLearned: [String],
      recommendations: [String],
      completionDate: Date
    }
  },

  // Expert Review and Validation
  expertReview: {
    isReviewed: {
      type: Boolean,
      default: false
    },
    reviewer: {
      name: String,
      credentials: String,
      institution: String,
      reviewDate: Date
    },
    reviewResults: {
      diagnosisAccuracy: {
        type: String,
        enum: ['accurate', 'partially_accurate', 'inaccurate', 'uncertain']
      },
      treatmentAppropriateness: {
        type: String,
        enum: ['appropriate', 'partially_appropriate', 'inappropriate', 'needs_modification']
      },
      additionalRecommendations: [String],
      correctedDiagnosis: {
        condition: String,
        reasoning: String
      },
      learningNotes: String // For improving AI models
    },
    publicationStatus: {
      isPublic: {
        type: Boolean,
        default: false
      },
      anonymized: {
        type: Boolean,
        default: true
      },
      researchConsent: {
        type: Boolean,
        default: false
      }
    }
  },

  // Metadata and System Information
  metadata: {
    source: {
      type: String,
      enum: ['mobile_app', 'web_app', 'api', 'expert_system'],
      default: 'mobile_app'
    },
    deviceInfo: {
      type: String,
      platform: String,
      version: String,
      location: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      }
    },
    processingDetails: {
      serverProcessingTime: Number, // milliseconds
      apiCalls: [{
        service: String,
        responseTime: Number,
        status: String
      }],
      errorLogs: [{
        timestamp: Date,
        error: String,
        resolved: Boolean
      }]
    },
    dataQuality: {
      completeness: {
        type: Number,
        min: 0,
        max: 100
      },
      accuracy: {
        type: String,
        enum: ['high', 'medium', 'low', 'unknown'],
        default: 'unknown'
      },
      reliability: {
        type: String,
        enum: ['high', 'medium', 'low', 'uncertain'],
        default: 'medium'
      }
    },
    privacy: {
      userConsent: {
        type: Boolean,
        default: true
      },
      dataRetention: {
        type: String,
        enum: ['indefinite', '5_years', '2_years', '1_year'],
        default: '2_years'
      },
      shareForResearch: {
        type: Boolean,
        default: false
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance optimization
diagnosisHistorySchema.index({ diagnosisId: 1 }, { unique: true });
diagnosisHistorySchema.index({ user: 1, createdAt: -1 });
diagnosisHistorySchema.index({ farm: 1, fieldId: 1 });
diagnosisHistorySchema.index({ 'cropInfo.cropName': 1 });
diagnosisHistorySchema.index({ 'analysisResults.primaryDiagnosis.condition': 1 });
diagnosisHistorySchema.index({ 'analysisResults.primaryDiagnosis.conditionType': 1 });
diagnosisHistorySchema.index({ 'followUp.status': 1 });
diagnosisHistorySchema.index({ createdAt: -1 });
diagnosisHistorySchema.index({ 'metadata.deviceInfo.location': '2dsphere' });

// Virtual for diagnosis age
diagnosisHistorySchema.virtual('diagnosisAge').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for treatment urgency
diagnosisHistorySchema.virtual('treatmentUrgency').get(function() {
  const severity = this.analysisResults?.primaryDiagnosis?.severity;
  const confidence = this.analysisResults?.primaryDiagnosis?.confidence || 0;
  
  if (severity === 'critical' && confidence > 70) return 'immediate';
  if (severity === 'high' && confidence > 60) return 'urgent';
  if (severity === 'moderate') return 'soon';
  return 'routine';
});

// Virtual for estimated cost impact
diagnosisHistorySchema.virtual('costImpact').get(function() {
  const treatmentCost = this.economicImpact?.treatmentCosts?.total?.amount || 0;
  const potentialLoss = this.economicImpact?.potentialLoss?.ifUntreated?.estimatedValue?.amount || 0;
  
  if (potentialLoss > 0) {
    return {
      treatmentCost,
      potentialLoss,
      savings: Math.max(0, potentialLoss - treatmentCost),
      costBenefit: potentialLoss > 0 ? ((potentialLoss - treatmentCost) / treatmentCost * 100).toFixed(1) : 0
    };
  }
  
  return null;
});

// Instance method to update treatment status
diagnosisHistorySchema.methods.updateTreatmentStatus = function(treatmentData) {
  this.followUp.treatmentsApplied.push(treatmentData);
  this.followUp.status = 'in_progress';
  this.metadata.dataQuality.completeness = Math.min(100, (this.metadata.dataQuality.completeness || 0) + 10);
  
  return this.save();
};

// Instance method to add progress update
diagnosisHistorySchema.methods.addProgressUpdate = function(updateData) {
  this.followUp.progressUpdates.push(updateData);
  
  // Update overall status based on progress
  if (updateData.status === 'resolved') {
    this.followUp.status = 'resolved';
  } else if (updateData.status === 'worsened') {
    this.followUp.status = 'worsened';
  }
  
  return this.save();
};

// Instance method to calculate treatment effectiveness
diagnosisHistorySchema.methods.calculateTreatmentEffectiveness = function() {
  const treatments = this.followUp.treatmentsApplied;
  if (!treatments || treatments.length === 0) return null;
  
  const effectivenessValues = {
    'excellent': 100,
    'good': 80,
    'fair': 60,
    'poor': 40,
    'unknown': 50
  };
  
  const scores = treatments
    .filter(t => t.effectiveness && t.effectiveness !== 'unknown')
    .map(t => effectivenessValues[t.effectiveness]);
  
  if (scores.length === 0) return null;
  
  return {
    averageEffectiveness: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    treatmentCount: treatments.length,
    hasUnknownOutcomes: treatments.some(t => !t.effectiveness || t.effectiveness === 'unknown')
  };
};

// Static method to get diagnosis statistics
diagnosisHistorySchema.statics.getDiagnosisStats = function(timeRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);
  
  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        totalDiagnoses: { $sum: 1 },
        byConditionType: {
          $push: '$analysisResults.primaryDiagnosis.conditionType'
        },
        byCrop: {
          $push: '$cropInfo.cropName'
        },
        bySeverity: {
          $push: '$analysisResults.primaryDiagnosis.severity'
        },
        avgConfidence: {
          $avg: '$analysisResults.primaryDiagnosis.confidence'
        },
        resolvedCases: {
          $sum: {
            $cond: [{ $eq: ['$followUp.status', 'resolved'] }, 1, 0]
          }
        }
      }
    }
  ]);
};

// Static method to find similar diagnoses
diagnosisHistorySchema.statics.findSimilarDiagnoses = function(crop, condition, limit = 5) {
  return this.find({
    'cropInfo.cropName': new RegExp(crop, 'i'),
    'analysisResults.primaryDiagnosis.condition': new RegExp(condition, 'i'),
    'followUp.status': { $in: ['resolved', 'treated'] }
  })
  .select('analysisResults.primaryDiagnosis treatmentRecommendations followUp.finalOutcome')
  .limit(limit)
  .sort({ 'analysisResults.primaryDiagnosis.confidence': -1 });
};

// Static method to get treatment success rates
diagnosisHistorySchema.statics.getTreatmentSuccessRates = function(condition) {
  return this.aggregate([
    { 
      $match: { 
        'analysisResults.primaryDiagnosis.condition': new RegExp(condition, 'i'),
        'followUp.status': { $in: ['resolved', 'treated', 'crop_lost'] }
      } 
    },
    {
      $group: {
        _id: '$analysisResults.primaryDiagnosis.condition',
        totalCases: { $sum: 1 },
        successfulTreatments: {
          $sum: {
            $cond: [
              { $in: ['$followUp.finalOutcome.result', ['fully_recovered', 'partially_recovered']] },
              1,
              0
            ]
          }
        },
        avgRecoveryTime: {
          $avg: {
            $dateDiff: {
              startDate: '$createdAt',
              endDate: '$followUp.finalOutcome.completionDate',
              unit: 'day'
            }
          }
        }
      }
    },
    {
      $project: {
        condition: '$_id',
        totalCases: 1,
        successfulTreatments: 1,
        successRate: {
          $multiply: [
            { $divide: ['$successfulTreatments', '$totalCases'] },
            100
          ]
        },
        avgRecoveryDays: { $round: ['$avgRecoveryTime', 1] }
      }
    }
  ]);
};

// Pre-save middleware to calculate data quality
diagnosisHistorySchema.pre('save', function(next) {
  let completeness = 0;
  const totalFields = 15; // Important fields for completeness
  
  // Check required fields
  if (this.cropInfo?.cropName) completeness++;
  if (this.diagnosisRequest?.symptoms?.length > 0) completeness++;
  if (this.analysisResults?.primaryDiagnosis?.condition) completeness++;
  if (this.analysisResults?.primaryDiagnosis?.confidence) completeness++;
  if (this.treatmentRecommendations?.immediate?.length > 0) completeness++;
  if (this.imageData?.length > 0) completeness++;
  if (this.diagnosisRequest?.affectedArea?.percentage) completeness++;
  if (this.economicImpact?.treatmentCosts?.total?.amount) completeness++;
  if (this.followUp?.status) completeness++;
  
  // Additional quality indicators
  if (this.expertReview?.isReviewed) completeness += 2;
  if (this.followUp?.treatmentsApplied?.length > 0) completeness += 2;
  if (this.followUp?.progressUpdates?.length > 0) completeness += 2;
  if (this.analysisResults?.primaryDiagnosis?.confidence > 80) completeness++;
  
  this.metadata.dataQuality.completeness = Math.round((completeness / totalFields) * 100);
  
  // Set accuracy based on confidence and expert review
  if (this.expertReview?.isReviewed) {
    this.metadata.dataQuality.accuracy = this.expertReview.reviewResults?.diagnosisAccuracy === 'accurate' ? 'high' : 'medium';
  } else if (this.analysisResults?.primaryDiagnosis?.confidence > 85) {
    this.metadata.dataQuality.accuracy = 'high';
  } else if (this.analysisResults?.primaryDiagnosis?.confidence > 70) {
    this.metadata.dataQuality.accuracy = 'medium';
  } else {
    this.metadata.dataQuality.accuracy = 'low';
  }
  
  next();
});

module.exports = mongoose.model('DiagnosisHistory', diagnosisHistorySchema);