/**
 * Farm Model for AgriSphere
 * Stores farm boundary data, soil information, crop details, and field management data
 * Supports polygon boundaries for accurate field mapping and multi-field farms
 */

const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  // Farm Ownership and Basic Info
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Farm owner is required']
  },
  farmInfo: {
    name: {
      type: String,
      required: [true, 'Farm name is required'],
      trim: true,
      maxlength: [100, 'Farm name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    farmType: {
      type: String,
      enum: ['crop_farm', 'livestock_farm', 'mixed_farm', 'organic_farm', 'greenhouse', 'orchard', 'vegetable_garden'],
      required: [true, 'Farm type is required']
    },
    establishedYear: {
      type: Number,
      min: [1800, 'Established year must be after 1800'],
      max: [new Date().getFullYear(), 'Established year cannot be in the future']
    },
    totalArea: {
      value: {
        type: Number,
        required: [true, 'Total area is required'],
        min: [0.01, 'Area must be greater than 0']
      },
      unit: {
        type: String,
        enum: ['hectares', 'acres', 'square_meters', 'square_feet'],
        default: 'hectares'
      }
    }
  },

  // Geographic Boundaries and Location
  location: {
    address: {
      type: String,
      required: [true, 'Farm address is required'],
      trim: true
    },
    centerPoint: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Center coordinates are required'],
        validate: {
          validator: function(coords) {
            return coords.length === 2 && 
                   coords[0] >= -180 && coords[0] <= 180 && 
                   coords[1] >= -90 && coords[1] <= 90;
          },
          message: 'Invalid coordinates format'
        }
      }
    },
    boundary: {
      type: {
        type: String,
        enum: ['Polygon'],
        default: 'Polygon'
      },
      coordinates: {
        type: [[[Number]]], // Array of linear rings
        required: [true, 'Boundary coordinates are required'],
        validate: {
          validator: function(coords) {
            // Basic polygon validation - at least 4 points, first and last point should be the same
            if (!coords || coords.length === 0) return false;
            const ring = coords[0];
            return ring.length >= 4 && 
                   ring[0][0] === ring[ring.length - 1][0] && 
                   ring[0][1] === ring[ring.length - 1][1];
          },
          message: 'Invalid polygon boundary'
        }
      }
    },
    elevation: {
      type: Number, // meters above sea level
      min: [-500, 'Elevation cannot be below -500m'],
      max: [9000, 'Elevation cannot be above 9000m']
    },
    slope: {
      type: Number, // percentage
      min: [0, 'Slope cannot be negative'],
      max: [100, 'Slope cannot exceed 100%']
    },
    aspect: {
      type: String,
      enum: ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest', 'flat']
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },

  // Field Management - Support for multiple fields within a farm
  fields: [{
    fieldId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: [true, 'Field name is required'],
      trim: true
    },
    area: {
      value: {
        type: Number,
        required: [true, 'Field area is required'],
        min: [0.01, 'Field area must be greater than 0']
      },
      unit: {
        type: String,
        enum: ['hectares', 'acres', 'square_meters'],
        default: 'hectares'
      }
    },
    boundary: {
      type: {
        type: String,
        enum: ['Polygon'],
        default: 'Polygon'
      },
      coordinates: {
        type: [[[Number]]]
      }
    },
    soilType: {
      type: String,
      enum: ['clay', 'loam', 'sand', 'silt', 'clay_loam', 'sandy_loam', 'silty_loam', 'rocky', 'organic']
    },
    currentCrop: {
      type: String,
      trim: true
    },
    cropHistory: [{
      crop: String,
      plantingDate: Date,
      harvestDate: Date,
      yield: {
        amount: Number,
        unit: String
      },
      season: String
    }],
    irrigationSystem: {
      type: String,
      enum: ['none', 'manual', 'drip', 'sprinkler', 'flood', 'center_pivot', 'furrow']
    },
    status: {
      type: String,
      enum: ['active', 'fallow', 'preparation', 'planted', 'growing', 'harvest_ready', 'harvested'],
      default: 'active'
    }
  }],

  // Soil Data and Analysis
  soilData: {
    lastTested: {
      type: Date
    },
    testingMethod: {
      type: String,
      enum: ['laboratory', 'field_test', 'digital_sensor', 'estimated']
    },
    composition: {
      sand: {
        type: Number,
        min: [0, 'Sand percentage cannot be negative'],
        max: [100, 'Sand percentage cannot exceed 100']
      },
      silt: {
        type: Number,
        min: [0, 'Silt percentage cannot be negative'],
        max: [100, 'Silt percentage cannot exceed 100']
      },
      clay: {
        type: Number,
        min: [0, 'Clay percentage cannot be negative'],
        max: [100, 'Clay percentage cannot exceed 100']
      },
      organicMatter: {
        type: Number,
        min: [0, 'Organic matter cannot be negative'],
        max: [100, 'Organic matter cannot exceed 100']
      }
    },
    chemistry: {
      pH: {
        value: {
          type: Number,
          min: [0, 'pH cannot be below 0'],
          max: [14, 'pH cannot exceed 14']
        },
        date: Date
      },
      electricalConductivity: {
        value: Number, // dS/m
        date: Date
      },
      cationExchangeCapacity: {
        value: Number, // cmol/kg
        date: Date
      }
    },
    nutrients: {
      nitrogen: {
        value: Number, // mg/kg or ppm
        status: {
          type: String,
          enum: ['deficient', 'low', 'adequate', 'high', 'excessive']
        },
        testDate: Date
      },
      phosphorus: {
        value: Number,
        status: {
          type: String,
          enum: ['deficient', 'low', 'adequate', 'high', 'excessive']
        },
        testDate: Date
      },
      potassium: {
        value: Number,
        status: {
          type: String,
          enum: ['deficient', 'low', 'adequate', 'high', 'excessive']
        },
        testDate: Date
      },
      calcium: {
        value: Number,
        status: {
          type: String,
          enum: ['deficient', 'low', 'adequate', 'high', 'excessive']
        },
        testDate: Date
      },
      magnesium: {
        value: Number,
        status: {
          type: String,
          enum: ['deficient', 'low', 'adequate', 'high', 'excessive']
        },
        testDate: Date
      },
      sulfur: {
        value: Number,
        status: {
          type: String,
          enum: ['deficient', 'low', 'adequate', 'high', 'excessive']
        },
        testDate: Date
      }
    },
    micronutrients: {
      iron: Number,
      manganese: Number,
      zinc: Number,
      copper: Number,
      boron: Number,
      molybdenum: Number
    },
    recommendations: [{
      type: {
        type: String,
        enum: ['fertilizer', 'lime', 'amendment', 'drainage', 'cultivation']
      },
      description: String,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent']
      },
      estimatedCost: {
        amount: Number,
        currency: String
      },
      dateRecommended: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
      }
    }]
  },

  // Current Crop Information
  currentCrops: [{
    fieldId: String,
    cropName: {
      type: String,
      required: [true, 'Crop name is required'],
      trim: true
    },
    variety: {
      type: String,
      trim: true
    },
    plantingDate: {
      type: Date,
      required: [true, 'Planting date is required']
    },
    expectedHarvestDate: {
      type: Date
    },
    growthStage: {
      type: String,
      enum: ['seedbed_preparation', 'planting', 'germination', 'seedling', 'vegetative', 'flowering', 'fruiting', 'maturation', 'harvest_ready', 'harvested'],
      default: 'planting'
    },
    plantingDensity: {
      value: Number,
      unit: String // plants per hectare, seeds per square meter, etc.
    },
    area: {
      value: Number,
      unit: String
    },
    irrigationSchedule: {
      method: String,
      frequency: String,
      amount: Number, // liters or gallons
      lastWatered: Date
    },
    fertilizationPlan: [{
      fertilizer: String,
      applicationDate: Date,
      amount: Number,
      unit: String,
      method: String,
      completed: {
        type: Boolean,
        default: false
      }
    }],
    pestManagement: [{
      pest: String,
      treatmentMethod: String,
      applicationDate: Date,
      product: String,
      amount: Number,
      unit: String,
      effectiveness: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'none']
      }
    }],
    healthStatus: {
      overall: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'critical'],
        default: 'good'
      },
      diseases: [{
        name: String,
        severity: {
          type: String,
          enum: ['low', 'moderate', 'high', 'severe']
        },
        firstObserved: Date,
        treatment: String,
        status: {
          type: String,
          enum: ['active', 'controlled', 'resolved']
        }
      }],
      pests: [{
        name: String,
        severity: {
          type: String,
          enum: ['low', 'moderate', 'high', 'severe']
        },
        firstObserved: Date,
        treatment: String,
        status: {
          type: String,
          enum: ['active', 'controlled', 'resolved']
        }
      }],
      lastInspection: Date
    },
    yieldExpectation: {
      estimated: Number,
      unit: String,
      confidence: {
        type: String,
        enum: ['low', 'medium', 'high']
      }
    }
  }],

  // Infrastructure and Equipment
  infrastructure: {
    waterSources: [{
      type: {
        type: String,
        enum: ['well', 'borehole', 'river', 'lake', 'pond', 'municipal', 'rainwater', 'canal']
      },
      name: String,
      capacity: Number, // liters or gallons
      quality: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'untested']
      },
      location: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere'
      },
      reliability: {
        type: String,
        enum: ['year_round', 'seasonal', 'unreliable']
      }
    }],
    storage: [{
      type: {
        type: String,
        enum: ['grain_silo', 'warehouse', 'barn', 'cold_storage', 'drying_facility', 'shed']
      },
      capacity: {
        value: Number,
        unit: String
      },
      condition: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'needs_repair']
      },
      location: {
        type: [Number] // [longitude, latitude]
      }
    }],
    equipment: [{
      type: {
        type: String,
        enum: ['tractor', 'plow', 'harrow', 'planter', 'harvester', 'sprayer', 'irrigation_pump', 'thresher', 'cultivator']
      },
      brand: String,
      model: String,
      year: Number,
      condition: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'needs_repair']
      },
      lastMaintenance: Date,
      nextMaintenance: Date,
      isOwned: {
        type: Boolean,
        default: true
      }
    }],
    connectivity: {
      internetAccess: {
        type: Boolean,
        default: false
      },
      cellularCoverage: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'none']
      },
      electricityAccess: {
        type: Boolean,
        default: false
      },
      roadAccess: {
        type: String,
        enum: ['paved', 'gravel', 'dirt', 'footpath', 'poor']
      }
    }
  },

  // Environmental and Climate Data
  environmental: {
    microclimate: {
      averageRainfall: {
        annual: Number, // mm
        byMonth: [Number] // 12 values for each month
      },
      averageTemperature: {
        annual: Number, // Celsius
        minimum: Number,
        maximum: Number,
        byMonth: [Number]
      },
      humidityRange: {
        minimum: Number,
        maximum: Number,
        average: Number
      },
      windPatterns: {
        prevailingDirection: String,
        averageSpeed: Number, // km/h
        seasonalVariation: String
      }
    },
    riskFactors: [{
      type: {
        type: String,
        enum: ['drought', 'flood', 'frost', 'hail', 'strong_winds', 'pest_outbreak', 'disease_pressure', 'market_volatility']
      },
      probability: {
        type: String,
        enum: ['low', 'moderate', 'high', 'very_high']
      },
      impactLevel: {
        type: String,
        enum: ['minor', 'moderate', 'major', 'severe']
      },
      seasonality: String,
      mitigationMeasures: [String]
    }]
  },

  // Administrative and Status Information
  management: {
    farmManager: {
      name: String,
      contact: String,
      role: String
    },
    laborers: [{
      name: String,
      contact: String,
      role: String,
      isFullTime: Boolean,
      skills: [String]
    }],
    certifications: [{
      type: {
        type: String,
        enum: ['organic', 'fair_trade', 'rainforest_alliance', 'good_agricultural_practices', 'iso_certification']
      },
      issuedBy: String,
      issueDate: Date,
      expiryDate: Date,
      certificateNumber: String,
      status: {
        type: String,
        enum: ['active', 'expired', 'suspended', 'pending']
      }
    }],
    insurance: [{
      provider: String,
      policyNumber: String,
      coverage: String,
      premium: Number,
      startDate: Date,
      endDate: Date,
      claimHistory: [{
        date: Date,
        amount: Number,
        reason: String,
        status: String
      }]
    }]
  },

  // Status and Metadata
  status: {
    isActive: {
      type: Boolean,
      default: true
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified'
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
      lastValidated: Date
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance optimization
farmSchema.index({ owner: 1 });
farmSchema.index({ 'location.centerPoint': '2dsphere' });
farmSchema.index({ 'location.boundary': '2dsphere' });
farmSchema.index({ 'farmInfo.farmType': 1 });
farmSchema.index({ 'status.isActive': 1 });
farmSchema.index({ 'status.verificationStatus': 1 });
farmSchema.index({ 'currentCrops.cropName': 1 });
farmSchema.index({ 'fields.fieldId': 1 });

// Virtual for total cultivated area
farmSchema.virtual('cultivatedArea').get(function() {
  if (!this.currentCrops || this.currentCrops.length === 0) return 0;
  
  return this.currentCrops.reduce((total, crop) => {
    return total + (crop.area?.value || 0);
  }, 0);
});

// Virtual for farm health score
farmSchema.virtual('healthScore').get(function() {
  if (!this.currentCrops || this.currentCrops.length === 0) return 0;
  
  const healthValues = {
    'excellent': 100,
    'good': 80,
    'fair': 60,
    'poor': 40,
    'critical': 20
  };
  
  const scores = this.currentCrops.map(crop => 
    healthValues[crop.healthStatus?.overall] || 60
  );
  
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
});

// Instance method to calculate area in different units
farmSchema.methods.getAreaInUnit = function(targetUnit) {
  const conversions = {
    'hectares_to_acres': 2.47105,
    'hectares_to_square_meters': 10000,
    'acres_to_hectares': 0.404686,
    'acres_to_square_meters': 4046.86,
    'square_meters_to_hectares': 0.0001,
    'square_meters_to_acres': 0.000247105
  };
  
  const currentUnit = this.farmInfo.totalArea.unit;
  const currentValue = this.farmInfo.totalArea.value;
  
  if (currentUnit === targetUnit) return currentValue;
  
  const conversionKey = `${currentUnit}_to_${targetUnit}`;
  const factor = conversions[conversionKey];
  
  return factor ? currentValue * factor : null;
};

// Instance method to add new field
farmSchema.methods.addField = function(fieldData) {
  const fieldId = fieldData.fieldId || `field_${this.fields.length + 1}`;
  
  this.fields.push({
    fieldId,
    ...fieldData
  });
  
  return this.save();
};

// Instance method to update soil data
farmSchema.methods.updateSoilData = function(newSoilData) {
  this.soilData = {
    ...this.soilData.toObject(),
    ...newSoilData,
    lastTested: new Date()
  };
  
  // Ensure status is an object before setting properties
  if (typeof this.status === 'string') {
    this.status = {
      isActive: true,
      lastUpdated: new Date(),
      verificationStatus: 'unverified',
      dataQuality: {
        completeness: 75,
        accuracy: 'medium',
        lastValidated: new Date()
      }
    };
  } else {
    this.status.lastUpdated = new Date();
  }
  return this.save();
};

// Static method to find farms by crop type
farmSchema.statics.findByCrop = function(cropName) {
  return this.find({
    'currentCrops.cropName': new RegExp(cropName, 'i'),
    'status.isActive': true
  }).populate('owner', 'personalInfo.firstName personalInfo.lastName location.country');
};

// Static method to find farms within radius
farmSchema.statics.findNearby = function(lat, lon, radiusKm = 50) {
  return this.find({
    'location.centerPoint': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lon, lat]
        },
        $maxDistance: radiusKm * 1000
      }
    },
    'status.isActive': true
  });
};

// Static method to get farm statistics
farmSchema.statics.getFarmStatistics = function() {
  return this.aggregate([
    { $match: { 'status.isActive': true } },
    {
      $group: {
        _id: null,
        totalFarms: { $sum: 1 },
        totalArea: { $sum: '$farmInfo.totalArea.value' },
        avgArea: { $avg: '$farmInfo.totalArea.value' },
        farmTypes: { $push: '$farmInfo.farmType' },
        countries: { $push: '$owner.location.country' }
      }
    }
  ]);
};

// Pre-save middleware to calculate data completeness
farmSchema.pre('save', function(next) {
  const requiredFields = [
    'farmInfo.name',
    'farmInfo.farmType',
    'location.centerPoint.coordinates',
    'location.boundary.coordinates',
    'farmInfo.totalArea.value'
  ];
  
  let completedFields = 0;
  const totalFields = requiredFields.length + 10; // Additional optional but important fields
  
  requiredFields.forEach(field => {
    if (this.get(field)) completedFields++;
  });
  
  // Check additional fields
  if (this.soilData && this.soilData.lastTested) completedFields++;
  if (this.currentCrops && this.currentCrops.length > 0) completedFields++;
  if (this.infrastructure && this.infrastructure.waterSources && this.infrastructure.waterSources.length > 0) completedFields++;
  if (this.fields && this.fields.length > 0) completedFields++;
  
  // Ensure status is an object before setting properties
  if (typeof this.status === 'string') {
    this.status = {
      isActive: true,
      lastUpdated: new Date(),
      verificationStatus: 'unverified',
      dataQuality: {
        completeness: Math.round((completedFields / totalFields) * 100),
        accuracy: 'medium',
        lastValidated: new Date()
      }
    };
  } else {
    this.status.dataQuality.completeness = Math.round((completedFields / totalFields) * 100);
    this.status.lastUpdated = new Date();
  }
  
  next();
});

module.exports = mongoose.model('Farm', farmSchema);