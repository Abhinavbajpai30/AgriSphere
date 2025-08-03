/**
 * User Model for AgriSphere
 * Stores farmer profile information, preferences, and authentication data
 * Designed for low-literacy users with simple but comprehensive data structure
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Profile Information
  personalInfo: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      validate: {
        validator: function(v) {
          // Simple phone validation - can be enhanced for specific regions
          return /^\+?[\d\s\-\(\)]+$/.test(v);
        },
        message: 'Please enter a valid phone number'
      }
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true, // Allow null/undefined but unique if provided
      validate: {
        validator: function(v) {
          return !v || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: function(v) {
          return !v || v <= new Date();
        },
        message: 'Date of birth cannot be in the future'
      }
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
      lowercase: true
    }
  },

  // Authentication
  authentication: {
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false // Don't include in queries by default
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: {
      type: String,
      select: false
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    },
    lastLogin: {
      type: Date,
      default: null
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date
    }
  },

  // Location Information
  location: {
    address: {
      type: String,
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    },
    country: {
      type: String,
      trim: true
    },
    region: { // State/Province
      type: String,
      trim: true
    },
    district: { // County/District
      type: String,
      trim: true
    },
    village: {
      type: String,
      trim: true
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },

  // User Preferences and Settings
  preferences: {
    language: {
      type: String,
      required: [true, 'Language preference is required'],
      enum: ['en', 'es', 'fr', 'hi', 'sw', 'am', 'yo', 'ha'], // Common languages in target regions
      default: 'en'
    },
    units: {
      temperature: {
        type: String,
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      },
      measurement: {
        type: String,
        enum: ['metric', 'imperial'],
        default: 'metric'
      },
      currency: {
        type: String,
        default: 'USD'
      }
    },
    notifications: {
      weatherAlerts: {
        type: Boolean,
        default: true
      },
      cropReminders: {
        type: Boolean,
        default: true
      },
      marketPrices: {
        type: Boolean,
        default: true
      },
      irrigationReminders: {
        type: Boolean,
        default: true
      },
      irrigation: {
        type: Boolean,
        default: true
      },
      weather: {
        type: Boolean,
        default: true
      },
      planning: {
        type: Boolean,
        default: true
      },
      analytics: {
        type: Boolean,
        default: true
      },
      smsNotifications: {
        type: Boolean,
        default: true
      },
      emailNotifications: {
        type: Boolean,
        default: false
      }
    },
    accessibility: {
      fontSize: {
        type: String,
        enum: ['small', 'medium', 'large'],
        default: 'medium'
      },
      highContrast: {
        type: Boolean,
        default: false
      },
      voiceAssistance: {
        type: Boolean,
        default: false
      }
    }
  },

  // Farming Information
  farmingProfile: {
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'experienced', 'expert']
    },
    farmingType: {
      type: String,
      enum: ['crop_only', 'livestock_only', 'mixed_farming', 'organic', 'subsistence', 'commercial']
    },
    primaryCrops: [{
      type: String,
      trim: true
    }],
    totalFarmArea: {
      value: {
        type: Number,
        min: [0, 'Farm area cannot be negative']
      },
      unit: {
        type: String,
        enum: ['hectares', 'acres', 'square_meters'],
        default: 'hectares'
      }
    },
    irrigationAccess: {
      type: String,
      enum: ['none', 'manual', 'drip', 'sprinkler', 'flood', 'mixed'],
      default: 'none'
    },
    equipmentAccess: {
      tractors: { type: Boolean, default: false },
      tillers: { type: Boolean, default: false },
      harvesters: { type: Boolean, default: false },
      irrigation: { type: Boolean, default: false },
      storage: { type: Boolean, default: false }
    }
  },

  // App Usage and Analytics
  appUsage: {
    registrationDate: {
      type: Date,
      default: Date.now
    },
    lastActiveDate: {
      type: Date,
      default: Date.now
    },
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    totalDiagnoses: {
      type: Number,
      default: 0
    },
    totalQueries: {
      type: Number,
      default: 0
    },
    favoriteFeatures: [{
      feature: String,
      usageCount: Number
    }],
    deviceInfo: {
      type: {
        type: String,
        enum: ['mobile', 'tablet', 'desktop'],
        default: 'mobile'
      },
      os: String,
      browser: String
    }
  },

  // Account Status
  status: {
    isActive: {
      type: Boolean,
      default: true
    },
    subscriptionType: {
      type: String,
      enum: ['free', 'basic', 'premium'],
      default: 'free'
    },
    subscriptionExpiry: {
      type: Date
    },
    accountFlags: [{
      type: String,
      reason: String,
      date: Date
    }]
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.authentication.password;
      delete ret.authentication.verificationToken;
      delete ret.authentication.passwordResetToken;
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance optimization
userSchema.index({ 'personalInfo.phoneNumber': 1 });
userSchema.index({ 'personalInfo.email': 1 }, { sparse: true, unique: true });
userSchema.index({ 'location.coordinates': '2dsphere' }); // Geospatial index
userSchema.index({ 'location.country': 1, 'location.region': 1 });
userSchema.index({ 'status.isActive': 1 });
userSchema.index({ 'appUsage.lastActiveDate': 1 });

// Virtual for full name
userSchema.virtual('personalInfo.fullName').get(function() {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
});

// Virtual for account locked status
userSchema.virtual('authentication.isLocked').get(function() {
  return !!(this.authentication.lockUntil && this.authentication.lockUntil > Date.now());
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('authentication.password')) return next();

  try {
    // Hash password with cost of 12
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.authentication.password = await bcrypt.hash(this.authentication.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update lastActiveDate
userSchema.pre('save', function(next) {
  if (this.isModified() && !this.isModified('appUsage.lastActiveDate')) {
    this.appUsage.lastActiveDate = new Date();
  }
  next();
});

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.authentication.password) {
    throw new Error('Password not set');
  }
  return bcrypt.compare(candidatePassword, this.authentication.password);
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.authentication.lockUntil && this.authentication.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'authentication.lockUntil': 1 },
      $set: { 'authentication.loginAttempts': 1 }
    });
  }
  
  const updates = { $inc: { 'authentication.loginAttempts': 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  if (this.authentication.loginAttempts + 1 >= maxAttempts && !this.authentication.lockUntil) {
    updates.$set = { 'authentication.lockUntil': Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { 
      'authentication.loginAttempts': 1,
      'authentication.lockUntil': 1
    },
    $set: {
      'authentication.lastLogin': Date.now()
    }
  });
};

// Instance method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = require('crypto').randomBytes(32).toString('hex');
  
  this.authentication.passwordResetToken = require('crypto')
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.authentication.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Static method to find users by location
userSchema.statics.findNearby = function(lat, lon, radiusKm = 50) {
  return this.find({
    'location.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lon, lat]
        },
        $maxDistance: radiusKm * 1000 // Convert km to meters
      }
    },
    'status.isActive': true
  });
};

// Static method to get user statistics
userSchema.statics.getStatistics = function() {
  return this.aggregate([
    { $match: { 'status.isActive': true } },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        byCountry: { $push: '$location.country' },
        byExperience: { $push: '$farmingProfile.experienceLevel' },
        byLanguage: { $push: '$preferences.language' }
      }
    }
  ]);
};

module.exports = mongoose.model('User', userSchema);