/**
 * IrrigationLog Model for AgriSphere
 * Stores irrigation recommendations, schedules, water usage data, and efficiency metrics
 * Essential for water management and optimization in smallholder farming
 */

const mongoose = require('mongoose');

const irrigationLogSchema = new mongoose.Schema({
  // Basic Log Information
  logId: {
    type: String,
    required: true,
    default: function() {
      return `IRR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  // Crop and Field Information
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
      enum: ['germination', 'seedling', 'vegetative', 'flowering', 'fruit_development', 'maturation', 'harvest'],
      required: [true, 'Growth stage is required']
    },
    plantingDate: {
      type: Date,
      required: [true, 'Planting date is required']
    },
    cropAge: {
      value: {
        type: Number,
        required: true,
        min: [0, 'Crop age cannot be negative']
      },
      unit: {
        type: String,
        enum: ['days', 'weeks', 'months'],
        default: 'days'
      }
    },
    expectedHarvestDate: Date,
    cultivatedArea: {
      value: {
        type: Number,
        required: [true, 'Cultivated area is required'],
        min: [0.01, 'Area must be greater than 0']
      },
      unit: {
        type: String,
        enum: ['hectares', 'acres', 'square_meters'],
        default: 'hectares'
      }
    }
  },

  // Irrigation System Information
  irrigationSystem: {
    type: {
      type: String,
      enum: ['manual_watering', 'drip_irrigation', 'sprinkler', 'flood_irrigation', 'center_pivot', 'furrow', 'subsurface_drip', 'micro_sprinkler'],
      required: [true, 'Irrigation system type is required']
    },
    efficiency: {
      type: Number,
      min: [0, 'Efficiency cannot be negative'],
      max: [100, 'Efficiency cannot exceed 100%'],
      default: function() {
        // Default efficiency values based on system type
        const efficiencies = {
          'manual_watering': 60,
          'flood_irrigation': 45,
          'furrow': 55,
          'sprinkler': 75,
          'center_pivot': 80,
          'drip_irrigation': 90,
          'subsurface_drip': 95,
          'micro_sprinkler': 85
        };
        return efficiencies[this.type] || 70;
      }
    },
    waterSource: {
      type: String,
      enum: ['well', 'borehole', 'river', 'lake', 'pond', 'municipal', 'rainwater', 'canal', 'spring'],
      required: [true, 'Water source is required']
    },
    waterQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'untested'],
      default: 'untested'
    },
    pressureRating: {
      value: Number, // PSI or bar
      unit: {
        type: String,
        enum: ['psi', 'bar', 'kpa'],
        default: 'psi'
      }
    },
    flowRate: {
      value: Number, // liters per minute or gallons per minute
      unit: {
        type: String,
        enum: ['lpm', 'gpm', 'lps'],
        default: 'lpm'
      }
    }
  },

  // Environmental Conditions
  environmentalData: {
    weather: {
      temperature: {
        current: Number, // Celsius
        minimum: Number,
        maximum: Number,
        average: Number
      },
      humidity: {
        current: Number, // percentage
        minimum: Number,
        maximum: Number,
        average: Number
      },
      windSpeed: {
        current: Number, // km/h
        average: Number,
        maximum: Number
      },
      rainfall: {
        last24Hours: {
          type: Number,
          default: 0,
          min: [0, 'Rainfall cannot be negative']
        },
        last7Days: {
          type: Number,
          default: 0,
          min: [0, 'Rainfall cannot be negative']
        },
        forecast48Hours: {
          type: Number,
          default: 0,
          min: [0, 'Rainfall cannot be negative']
        }
      },
      solarRadiation: Number, // MJ/m²/day
      evapotranspiration: {
        reference: Number, // mm/day
        crop: Number, // mm/day
        calculated: {
          type: Boolean,
          default: false
        }
      }
    },
    soil: {
      moistureLevel: {
        current: {
          type: Number,
          min: [0, 'Soil moisture cannot be negative'],
          max: [100, 'Soil moisture cannot exceed 100%']
        },
        optimal: {
          type: Number,
          min: [0, 'Optimal moisture cannot be negative'],
          max: [100, 'Optimal moisture cannot exceed 100%']
        },
        fieldCapacity: Number,
        wiltingPoint: Number,
        measurementMethod: {
          type: String,
          enum: ['sensor', 'manual_check', 'estimated', 'calculated']
        },
        measurementDepth: {
          value: Number,
          unit: {
            type: String,
            enum: ['cm', 'inches'],
            default: 'cm'
          }
        },
        lastMeasured: {
          type: Date,
          default: Date.now
        }
      },
      temperature: Number,
      pH: Number,
      salinity: Number, // dS/m
      infiltrationRate: Number // mm/hour
    }
  },

  // Irrigation Recommendation
  recommendation: {
    recommendationType: {
      type: String,
      enum: ['scheduled', 'sensor_triggered', 'weather_based', 'growth_stage', 'stress_response', 'manual_request'],
      required: [true, 'Recommendation type is required']
    },
    recommendedAction: {
      type: String,
      enum: ['irrigate_now', 'irrigate_later', 'skip_irrigation', 'reduce_irrigation', 'increase_irrigation', 'monitor_only'],
      required: [true, 'Recommended action is required']
    },
    waterAmount: {
      value: {
        type: Number,
        required: [true, 'Water amount is required'],
        min: [0, 'Water amount cannot be negative']
      },
      unit: {
        type: String,
        enum: ['liters', 'gallons', 'cubic_meters', 'mm'],
        default: 'liters'
      }
    },
    duration: {
      value: {
        type: Number,
        min: [0, 'Duration cannot be negative']
      },
      unit: {
        type: String,
        enum: ['minutes', 'hours'],
        default: 'minutes'
      }
    },
    timing: {
      preferredStartTime: {
        type: String,
        validate: {
          validator: function(v) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Time must be in HH:MM format'
        }
      },
      preferredEndTime: {
        type: String,
        validate: {
          validator: function(v) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Time must be in HH:MM format'
        }
      },
      urgency: {
        type: String,
        enum: ['low', 'normal', 'high', 'critical'],
        default: 'normal'
      },
      deadline: Date,
      avoidTimes: [String] // Times to avoid irrigation
    },
    reasoning: {
      primaryFactors: [{
        factor: {
          type: String,
          enum: ['soil_moisture', 'weather_forecast', 'crop_stage', 'stress_indicators', 'schedule', 'water_availability']
        },
        value: String,
        importance: {
          type: String,
          enum: ['low', 'medium', 'high', 'critical']
        }
      }],
      calculation: {
        method: {
          type: String,
          enum: ['et_based', 'soil_moisture', 'schedule_based', 'stress_based', 'hybrid']
        },
        inputs: mongoose.Schema.Types.Mixed,
        confidence: {
          type: Number,
          min: [0, 'Confidence cannot be negative'],
          max: [100, 'Confidence cannot exceed 100%']
        }
      },
      weatherConsiderations: {
        rainProbability: Number,
        temperatureTrend: String,
        windEffect: String,
        recommendations: [String]
      }
    },
    alternatives: [{
      action: String,
      waterAmount: {
        value: Number,
        unit: String
      },
      reasoning: String,
      pros: [String],
      cons: [String]
    }],
    generatedAt: {
      type: Date,
      default: Date.now
    },
    validUntil: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
      }
    }
  },

  // Actual Irrigation Implementation
  actualIrrigation: {
    wasImplemented: {
      type: Boolean,
      default: false
    },
    implementationDate: Date,
    actualStartTime: Date,
    actualEndTime: Date,
    waterUsed: {
      value: Number,
      unit: String
    },
    duration: {
      value: Number,
      unit: String
    },
    method: {
      type: String,
      enum: ['manual', 'automated', 'semi_automated']
    },
    operator: String,
    deviations: [{
      parameter: {
        type: String,
        enum: ['water_amount', 'duration', 'timing', 'method']
      },
      planned: String,
      actual: String,
      reason: String
    }],
    observations: {
      waterPressure: Number,
      flowRate: Number,
      uniformity: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor']
      },
      issues: [{
        issue: {
          type: String,
          enum: ['low_pressure', 'blocked_emitters', 'leaks', 'uneven_distribution', 'equipment_failure']
        },
        severity: {
          type: String,
          enum: ['minor', 'moderate', 'major', 'critical']
        },
        description: String,
        resolved: Boolean,
        resolutionMethod: String
      }],
      notes: String
    },
    costs: {
      waterCost: {
        amount: Number,
        currency: String
      },
      energyCost: {
        amount: Number,
        currency: String
      },
      laborCost: {
        amount: Number,
        currency: String
      },
      totalCost: {
        amount: Number,
        currency: String
      }
    }
  },

  // Performance Metrics and Analysis
  performance: {
    efficiency: {
      waterUseEfficiency: Number, // actual vs recommended
      applicationEfficiency: Number, // how much water reached the crop
      distributionUniformity: Number, // percentage
      energyEfficiency: Number // kWh per cubic meter
    },
    effectiveness: {
      soilMoistureImprovement: Number, // percentage increase
      plantResponse: {
        type: String,
        enum: ['excellent', 'good', 'adequate', 'poor', 'no_response']
      },
      stressRelief: {
        type: String,
        enum: ['complete', 'significant', 'moderate', 'minimal', 'none']
      },
      uniformityOfResponse: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor']
      }
    },
    costBenefit: {
      costPerUnit: Number, // cost per liter or cubic meter
      yieldImpact: {
        expected: Number,
        actual: Number,
        unit: String
      },
      waterProductivity: Number, // kg yield per cubic meter water
      returnOnInvestment: Number // percentage
    },
    environmental: {
      waterSaved: Number, // compared to traditional methods
      energyUsed: {
        value: Number,
        unit: String
      },
      carbonFootprint: Number, // kg CO2 equivalent
      soilHealthImpact: {
        type: String,
        enum: ['positive', 'neutral', 'negative']
      }
    }
  },

  // Follow-up and Monitoring
  followUp: {
    nextIrrigationDue: Date,
    monitoringSchedule: [{
      parameter: {
        type: String,
        enum: ['soil_moisture', 'plant_stress', 'growth_rate', 'water_quality']
      },
      frequency: String,
      nextCheck: Date,
      responsible: String
    }],
    adjustments: [{
      date: Date,
      parameter: String,
      oldValue: String,
      newValue: String,
      reason: String,
      implementedBy: String
    }],
    alerts: [{
      type: {
        type: String,
        enum: ['maintenance_due', 'efficiency_drop', 'cost_increase', 'water_shortage', 'equipment_failure']
      },
      severity: {
        type: String,
        enum: ['info', 'warning', 'error', 'critical']
      },
      message: String,
      triggeredAt: Date,
      resolved: Boolean,
      resolutionDate: Date
    }]
  },

  // Learning and Optimization
  learning: {
    successRating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    userFeedback: {
      satisfaction: {
        type: String,
        enum: ['very_satisfied', 'satisfied', 'neutral', 'dissatisfied', 'very_dissatisfied']
      },
      easeOfImplementation: {
        type: String,
        enum: ['very_easy', 'easy', 'moderate', 'difficult', 'very_difficult']
      },
      accuracy: {
        type: String,
        enum: ['very_accurate', 'accurate', 'somewhat_accurate', 'inaccurate', 'very_inaccurate']
      },
      comments: String,
      suggestions: [String]
    },
    aiLearning: {
      modelVersion: String,
      predictionAccuracy: Number,
      improvementAreas: [String],
      dataQuality: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor']
      }
    },
    bestPractices: [{
      practice: String,
      effectiveness: Number,
      applicability: String,
      source: String
    }]
  },

  // Metadata and System Information
  metadata: {
    source: {
      type: String,
      enum: ['mobile_app', 'web_app', 'iot_sensor', 'api', 'manual_entry'],
      default: 'mobile_app'
    },
    deviceInfo: {
      type: String,
      platform: String,
      version: String,
      sensors: [String]
    },
    dataQuality: {
      completeness: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      accuracy: {
        type: String,
        enum: ['high', 'medium', 'low', 'unknown'],
        default: 'unknown'
      },
      reliability: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
      },
      sensorCalibration: {
        lastCalibrated: Date,
        nextCalibration: Date,
        calibrationAccuracy: Number
      }
    },
    privacy: {
      shareData: {
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
    },
    integration: {
      weatherApiUsed: Boolean,
      soilSensorConnected: Boolean,
      automationLevel: {
        type: String,
        enum: ['manual', 'semi_automated', 'fully_automated'],
        default: 'manual'
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance optimization
irrigationLogSchema.index({ logId: 1 }, { unique: true });
irrigationLogSchema.index({ user: 1, createdAt: -1 });
irrigationLogSchema.index({ farm: 1, fieldId: 1 });
irrigationLogSchema.index({ 'cropInfo.cropName': 1 });
irrigationLogSchema.index({ 'recommendation.recommendedAction': 1 });
irrigationLogSchema.index({ 'actualIrrigation.implementationDate': -1 });
irrigationLogSchema.index({ 'followUp.nextIrrigationDue': 1 });
irrigationLogSchema.index({ createdAt: -1 });

// Virtual for irrigation efficiency
irrigationLogSchema.virtual('irrigationEfficiency').get(function() {
  if (!this.actualIrrigation.waterUsed?.value || !this.recommendation.waterAmount?.value) {
    return null;
  }
  
  const recommended = this.recommendation.waterAmount.value;
  const actual = this.actualIrrigation.waterUsed.value;
  
  return {
    waterEfficiency: Math.round((recommended / actual) * 100),
    variance: Math.round(((actual - recommended) / recommended) * 100),
    status: Math.abs(actual - recommended) <= (recommended * 0.1) ? 'optimal' : 
            actual > recommended ? 'overwatered' : 'underwatered'
  };
});

// Virtual for cost per unit area
irrigationLogSchema.virtual('costPerArea').get(function() {
  if (!this.actualIrrigation.costs?.totalCost?.amount || !this.cropInfo.cultivatedArea?.value) {
    return null;
  }
  
  const totalCost = this.actualIrrigation.costs.totalCost.amount;
  const area = this.cropInfo.cultivatedArea.value;
  const areaUnit = this.cropInfo.cultivatedArea.unit;
  
  return {
    cost: (totalCost / area).toFixed(2),
    unit: `${this.actualIrrigation.costs.totalCost.currency}/${areaUnit}`,
    totalCost,
    area: `${area} ${areaUnit}`
  };
});

// Virtual for water use intensity
irrigationLogSchema.virtual('waterUseIntensity').get(function() {
  if (!this.actualIrrigation.waterUsed?.value || !this.cropInfo.cultivatedArea?.value) {
    return null;
  }
  
  const waterUsed = this.actualIrrigation.waterUsed.value;
  const area = this.cropInfo.cultivatedArea.value;
  
  return {
    intensity: (waterUsed / area).toFixed(2),
    unit: `${this.actualIrrigation.waterUsed.unit}/${this.cropInfo.cultivatedArea.unit}`,
    totalWater: `${waterUsed} ${this.actualIrrigation.waterUsed.unit}`,
    totalArea: `${area} ${this.cropInfo.cultivatedArea.unit}`
  };
});

// Instance method to calculate water savings
irrigationLogSchema.methods.calculateWaterSavings = function(baselineWaterUse) {
  if (!this.actualIrrigation.waterUsed?.value) return null;
  
  const actualUse = this.actualIrrigation.waterUsed.value;
  const savings = baselineWaterUse - actualUse;
  const percentageSavings = (savings / baselineWaterUse) * 100;
  
  return {
    absoluteSavings: savings,
    percentageSavings: percentageSavings.toFixed(1),
    actualUse,
    baselineUse: baselineWaterUse,
    unit: this.actualIrrigation.waterUsed.unit
  };
};

// Instance method to update implementation status
irrigationLogSchema.methods.updateImplementation = function(implementationData) {
  this.actualIrrigation = {
    ...this.actualIrrigation.toObject(),
    ...implementationData,
    wasImplemented: true
  };
  
  // Update completeness score
  this.metadata.dataQuality.completeness = Math.min(100, (this.metadata.dataQuality.completeness || 0) + 20);
  
  return this.save();
};

// Instance method to add monitoring data
irrigationLogSchema.methods.addMonitoringData = function(monitoringData) {
  this.followUp.adjustments.push({
    date: new Date(),
    ...monitoringData
  });
  
  return this.save();
};

// Instance method to calculate ROI
irrigationLogSchema.methods.calculateROI = function(yieldValue, costPerUnit) {
  if (!this.actualIrrigation.costs?.totalCost?.amount || !yieldValue) return null;
  
  const totalCost = this.actualIrrigation.costs.totalCost.amount;
  const revenue = yieldValue * costPerUnit;
  const roi = ((revenue - totalCost) / totalCost) * 100;
  
  return {
    roi: roi.toFixed(2),
    revenue,
    totalCost,
    profit: revenue - totalCost,
    profitMargin: ((revenue - totalCost) / revenue * 100).toFixed(2)
  };
};

// Static method to get irrigation statistics
irrigationLogSchema.statics.getIrrigationStats = function(timeRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - timeRange);
  
  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: null,
        totalIrrigations: { $sum: 1 },
        implementedIrrigations: {
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
        },
        byCrop: {
          $push: '$cropInfo.cropName'
        },
        bySystem: {
          $push: '$irrigationSystem.type'
        },
        avgSuccessRating: {
          $avg: '$learning.successRating'
        }
      }
    }
  ]);
};

// Static method to find optimal irrigation patterns
irrigationLogSchema.statics.findOptimalPatterns = function(crop, systemType) {
  return this.aggregate([
    {
      $match: {
        'cropInfo.cropName': new RegExp(crop, 'i'),
        'irrigationSystem.type': systemType,
        'actualIrrigation.wasImplemented': true,
        'learning.successRating': { $gte: 4 }
      }
    },
    {
      $group: {
        _id: '$cropInfo.growthStage',
        avgWaterAmount: { $avg: '$recommendation.waterAmount.value' },
        avgDuration: { $avg: '$recommendation.duration.value' },
        avgSuccessRating: { $avg: '$learning.successRating' },
        avgEfficiency: { $avg: '$performance.efficiency.waterUseEfficiency' },
        count: { $sum: 1 }
      }
    },
    { $sort: { avgSuccessRating: -1 } }
  ]);
};

// Static method to get water usage trends
irrigationLogSchema.statics.getWaterUsageTrends = function(farmId, days = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        farm: mongoose.Types.ObjectId(farmId),
        'actualIrrigation.wasImplemented': true,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        dailyWaterUse: { $sum: '$actualIrrigation.waterUsed.value' },
        dailyCost: { $sum: '$actualIrrigation.costs.totalCost.amount' },
        irrigationCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
};

// Pre-save middleware to calculate data completeness
irrigationLogSchema.pre('save', function(next) {
  let completeness = 0;
  const totalFields = 20; // Important fields for completeness
  
  // Required fields
  if (this.cropInfo?.cropName) completeness++;
  if (this.cropInfo?.growthStage) completeness++;
  if (this.irrigationSystem?.type) completeness++;
  if (this.recommendation?.recommendedAction) completeness++;
  if (this.recommendation?.waterAmount?.value) completeness++;
  if (this.environmentalData?.soil?.moistureLevel?.current !== undefined) completeness++;
  
  // Implementation data
  if (this.actualIrrigation?.wasImplemented) {
    completeness += 5; // Bonus for implementation
    if (this.actualIrrigation.waterUsed?.value) completeness++;
    if (this.actualIrrigation.duration?.value) completeness++;
    if (this.actualIrrigation.costs?.totalCost?.amount) completeness++;
  }
  
  // Performance data
  if (this.performance?.efficiency?.waterUseEfficiency) completeness++;
  if (this.performance?.effectiveness?.plantResponse) completeness++;
  if (this.learning?.successRating) completeness++;
  if (this.learning?.userFeedback?.satisfaction) completeness++;
  
  // Environmental data
  if (this.environmentalData?.weather?.temperature?.current !== undefined) completeness++;
  if (this.environmentalData?.weather?.rainfall?.last24Hours !== undefined) completeness++;
  if (this.followUp?.nextIrrigationDue) completeness++;
  
  this.metadata.dataQuality.completeness = Math.round((completeness / totalFields) * 100);
  
  // Set accuracy based on sensor data and implementation
  if (this.environmentalData?.soil?.moistureLevel?.measurementMethod === 'sensor') {
    this.metadata.dataQuality.accuracy = 'high';
  } else if (this.actualIrrigation?.wasImplemented) {
    this.metadata.dataQuality.accuracy = 'medium';
  } else {
    this.metadata.dataQuality.accuracy = 'low';
  }
  
  next();
});

module.exports = mongoose.model('IrrigationLog', irrigationLogSchema);