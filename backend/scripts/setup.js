/**
 * Setup Script for AgriSphere Backend
 * Initializes database, creates indexes, and sets up initial data
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Models
const User = require('../models/User');
const Farm = require('../models/Farm');
const DiagnosisHistory = require('../models/DiagnosisHistory');
const IrrigationLog = require('../models/IrrigationLog');

/**
 * Create database indexes for optimal performance
 */
async function createIndexes() {
  try {
    logger.info('Creating database indexes...');

    // User indexes
    await User.collection.createIndex({ 'personalInfo.phoneNumber': 1 }, { unique: true });
    await User.collection.createIndex({ 'personalInfo.email': 1 }, { unique: true, sparse: true });
    await User.collection.createIndex({ 'location.coordinates': '2dsphere' });

    // Farm indexes  
    await Farm.collection.createIndex({ owner: 1 });
    await Farm.collection.createIndex({ 'location.centerPoint': '2dsphere' });
    await Farm.collection.createIndex({ 'location.boundary': '2dsphere' });

    // Diagnosis indexes
    await DiagnosisHistory.collection.createIndex({ user: 1, createdAt: -1 });
    await DiagnosisHistory.collection.createIndex({ farm: 1, fieldId: 1 });
    await DiagnosisHistory.collection.createIndex({ 'cropInfo.cropName': 1 });

    // Irrigation indexes
    await IrrigationLog.collection.createIndex({ user: 1, createdAt: -1 });
    await IrrigationLog.collection.createIndex({ farm: 1, fieldId: 1 });

    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Failed to create indexes:', error);
    throw error;
  }
}

/**
 * Check environment variables
 */
function checkEnvironment() {
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error('Missing required environment variables:', missingVars);
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }

  logger.info('Environment variables check passed');
}

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Test the connection
    await mongoose.connection.db.admin().ping();
    logger.info('Database connection test successful');
    
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error);
    throw error;
  }
}

/**
 * Create sample data for development
 */
async function createSampleData() {
  if (process.env.NODE_ENV === 'production') {
    logger.info('Skipping sample data creation in production');
    return;
  }

  try {
    logger.info('Creating sample data for development...');

    // Check if sample data already exists
    const existingUser = await User.findOne({ 'personalInfo.phoneNumber': '+1234567890' });
    if (existingUser) {
      logger.info('Sample data already exists, skipping creation');
      return;
    }

    // Create sample user
    const sampleUser = new User({
      personalInfo: {
        firstName: 'John',
        lastName: 'Farmer',
        phoneNumber: '+1234567890',
        email: 'john.farmer@example.com'
      },
      authentication: {
        password: 'password123' // Will be hashed automatically
      },
      location: {
        address: '123 Farm Road, Rural County, Kenya',
        coordinates: {
          latitude: -1.2921,
          longitude: 36.8219
        },
        country: 'Kenya',
        region: 'Nairobi',
        timezone: 'Africa/Nairobi'
      },
      farmingProfile: {
        experienceLevel: 'intermediate',
        farmingType: 'mixed_farming',
        primaryCrops: ['maize', 'beans', 'tomatoes'],
        totalFarmArea: {
          value: 2.5,
          unit: 'hectares'
        }
      },
      preferences: {
        language: 'en',
        units: {
          temperature: 'celsius',
          measurement: 'metric'
        }
      }
    });

    await sampleUser.save();
    logger.info('Sample user created:', sampleUser._id);

    // Create sample farm
    const sampleFarm = new Farm({
      owner: sampleUser._id,
      farmInfo: {
        name: 'Green Valley Farm',
        farmType: 'mixed_farm',
        totalArea: {
          value: 2.5,
          unit: 'hectares'
        }
      },
      location: {
        address: '123 Farm Road, Rural County, Kenya',
        centerPoint: {
          type: 'Point',
          coordinates: [36.8219, -1.2921] // [longitude, latitude]
        },
        boundary: {
          type: 'Polygon',
          coordinates: [[
            [36.8200, -1.2900],
            [36.8240, -1.2900],
            [36.8240, -1.2940],
            [36.8200, -1.2940],
            [36.8200, -1.2900]
          ]]
        },
        timezone: 'Africa/Nairobi'
      },
      fields: [
        {
          fieldId: 'field_001',
          name: 'North Field',
          area: { value: 1.0, unit: 'hectares' },
          soilType: 'loam',
          currentCrop: 'maize',
          status: 'active'
        },
        {
          fieldId: 'field_002', 
          name: 'South Field',
          area: { value: 1.5, unit: 'hectares' },
          soilType: 'clay_loam',
          currentCrop: 'beans',
          status: 'active'
        }
      ],
      currentCrops: [
        {
          fieldId: 'field_001',
          cropName: 'maize',
          variety: 'DH02',
          plantingDate: new Date('2024-03-15'),
          expectedHarvestDate: new Date('2024-08-15'),
          growthStage: 'vegetative',
          area: { value: 1.0, unit: 'hectares' },
          healthStatus: { overall: 'good' }
        }
      ]
    });

    await sampleFarm.save();
    logger.info('Sample farm created:', sampleFarm._id);

    logger.info('Sample data creation completed');

  } catch (error) {
    logger.error('Failed to create sample data:', error);
    throw error;
  }
}

/**
 * Main setup function
 */
async function setup() {
  try {
    logger.info('Starting AgriSphere backend setup...');

    // Check environment
    checkEnvironment();

    // Test database connection
    await testDatabaseConnection();

    // Create indexes
    await createIndexes();

    // Create sample data for development
    await createSampleData();

    logger.info('Setup completed successfully!');
    
    console.log('\n✅ AgriSphere Backend Setup Complete!');
    console.log('\nNext steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Test the API endpoints: GET http://localhost:5000/health');
    console.log('3. Check the API documentation in README.md');
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n🧪 Sample data created:');
      console.log('   Email: john.farmer@example.com');
      console.log('   Phone: +1234567890');
      console.log('   Password: password123');
    }

  } catch (error) {
    logger.error('Setup failed:', error);
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  require('dotenv').config();
  setup();
}

module.exports = { setup, createIndexes, testDatabaseConnection };