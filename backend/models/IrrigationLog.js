/**
 * IrrigationLog Model for AgriSphere
 * Tracks irrigation activities, recommendations, and water management data
 */

const mongoose = require('mongoose');

const irrigationLogSchema = new mongoose.Schema({
  // Basic Information
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

  // Irrigation Details
  irrigationDate: {
      type: Date,
    required: [true, 'Irrigation date is required'],
    index: true
  },
  recommendationType: {
      type: String,
    enum: ['calculation', 'manual_log', 'scheduled', 'emergency'],
    required: [true, 'Recommendation type is required']
  },

  // Recommendation Data (if calculated)
  recommendation: {
    status: {
      type: String,
      enum: ['urgent', 'needed', 'skip', 'optimal', 'monitor']
    },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low']
    },
    action: {
        type: String,
      enum: ['irrigate_now', 'irrigate_soon', 'wait_for_rain', 'monitor', 'assess_tomorrow']
    },
    amount: {
      type: Number, // liters
      min: 0
    },
    timing: {
        type: String,
      enum: ['within_2_hours', 'within_24_hours', 'after_rainfall', 'next_assessment', 'tomorrow']
    }
  },

  // Actual Irrigation Data (if performed)
  actualIrrigation: {
    amount: {
      type: Number, // liters
      min: 0
    },
    duration: {
      type: Number, // minutes
      min: 0
    },
    method: {
      type: String,
      enum: ['sprinkler', 'drip', 'flood', 'furrow', 'manual', 'unknown'],
      default: 'unknown'
    },
    efficiency: {
      type: Number, // percentage
      min: 0,
      max: 100,
      default: 60
    }
  },

  // Environmental Conditions
  weatherConditions: {
    temperature: {
      type: Number, // Celsius
      required: true
    },
    humidity: {
      type: Number, // percentage
      min: 0,
      max: 100,
      required: true
    },
    windSpeed: {
      type: Number, // km/h
      min: 0,
      required: true
    },
    precipitation: {
      type: Number, // mm
      min: 0,
      default: 0
    }
  },

  // Soil Conditions
  soilMoisture: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    status: {
        type: String,
      enum: ['critical', 'low', 'adequate', 'optimal', 'saturated', 'unknown'],
      required: true
    }
  },

  // Crop Information
  cropDetails: {
    type: {
      type: String,
      required: true
    },
    growthStage: {
      type: String,
      enum: ['initial', 'development', 'mid', 'late'],
      default: 'mid'
    },
    plantingDate: {
      type: Date
    }
  },

  // Additional Information
  notes: {
    type: String,
    maxlength: 1000
  },
  attachments: [{
    type: String, // URLs to images or documents
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid URL format'
    }
  }],

  // System Information
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
irrigationLogSchema.index({ user: 1, farm: 1, irrigationDate: -1 });
irrigationLogSchema.index({ farm: 1, fieldId: 1, irrigationDate: -1 });
irrigationLogSchema.index({ recommendationType: 1, createdAt: -1 });

// Virtual for water efficiency calculation
irrigationLogSchema.virtual('waterEfficiency').get(function() {
  if (this.actualIrrigation && this.actualIrrigation.amount > 0) {
    const efficiency = this.actualIrrigation.efficiency || 60;
    const effectiveWater = (this.actualIrrigation.amount * efficiency) / 100;
  return {
      appliedWater: this.actualIrrigation.amount,
      effectiveWater: effectiveWater,
      wastedWater: this.actualIrrigation.amount - effectiveWater,
      efficiencyPercentage: efficiency
    };
  }
  return null;
});

// Virtual for cost calculation
irrigationLogSchema.virtual('estimatedCost').get(function() {
  if (this.actualIrrigation && this.actualIrrigation.amount > 0) {
    const waterCostPerLiter = 0.001; // $0.001 per liter
    const energyCostPerLiter = 0.0005; // Energy cost
    const waterCost = this.actualIrrigation.amount * waterCostPerLiter;
    const energyCost = this.actualIrrigation.amount * energyCostPerLiter;
  
  return {
      waterCost: Math.round(waterCost * 100) / 100,
      energyCost: Math.round(energyCost * 100) / 100,
      totalCost: Math.round((waterCost + energyCost) * 100) / 100,
      currency: 'USD'
    };
  }
  return null;
});

// Static method to get irrigation statistics
irrigationLogSchema.statics.getStatistics = async function(userId, farmId, timeframe = 'month') {
  const matchQuery = { user: userId };
  if (farmId) matchQuery.farm = farmId;

  // Calculate date range
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  matchQuery.irrigationDate = { $gte: startDate };

  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalIrrigations: { $sum: 1 },
        totalWaterUsed: { $sum: '$actualIrrigation.amount' },
        avgWaterPerIrrigation: { $avg: '$actualIrrigation.amount' },
        avgEfficiency: { $avg: '$actualIrrigation.efficiency' },
        lastIrrigation: { $max: '$irrigationDate' },
        methodDistribution: {
          $push: '$actualIrrigation.method'
        }
      }
    }
  ]);

  return stats[0] || {
    totalIrrigations: 0,
    totalWaterUsed: 0,
    avgWaterPerIrrigation: 0,
    avgEfficiency: 0,
    lastIrrigation: null,
    methodDistribution: []
  };
};

// Instance method to calculate water savings
irrigationLogSchema.methods.calculateWaterSavings = function(baselineEfficiency = 60) {
  if (!this.actualIrrigation || !this.actualIrrigation.amount) {
    return null;
  }

  const currentEfficiency = this.actualIrrigation.efficiency || 60;
  const currentWater = this.actualIrrigation.amount;
  const baselineWater = (currentWater * currentEfficiency) / baselineEfficiency;
  const waterSaved = baselineWater - currentWater;

  return {
    currentUsage: currentWater,
    baselineUsage: Math.round(baselineWater),
    waterSaved: Math.round(waterSaved),
    savingsPercentage: Math.round(((waterSaved / baselineWater) * 100) * 10) / 10,
    efficiencyImprovement: currentEfficiency - baselineEfficiency
  };
};

// Pre-save middleware to update timestamps
irrigationLogSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Post-save middleware for logging
irrigationLogSchema.post('save', function(doc) {
  console.log(`Irrigation log saved: ${doc._id} for farm ${doc.farm}`);
});

const IrrigationLog = mongoose.model('IrrigationLog', irrigationLogSchema);

module.exports = IrrigationLog;