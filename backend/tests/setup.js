const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')
const { beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals')

let mongoServer

// Setup test database before all tests
beforeAll(async () => {
  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create()
  const mongoUri = mongoServer.getUri()
  
  // Connect to the in-memory database
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  
  console.log('Test database connected')
})

// Clean up after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
  await mongoServer.stop()
  console.log('Test database disconnected')
})

// Clean database before each test
beforeEach(async () => {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    const collection = collections[key]
    await collection.deleteMany({})
  }
})

// Global test helpers
global.testHelpers = {
  // Create test user
  createTestUser: async () => {
    const User = require('../models/User')
    const bcrypt = require('bcryptjs')
    
    const hashedPassword = await bcrypt.hash('testpassword123', 12)
    
    return await User.create({
      personalInfo: {
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1234567890',
        email: 'test@example.com',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male'
      },
      authentication: {
        password: hashedPassword,
        isVerified: true
      },
      location: {
        country: 'India',
        state: 'Maharashtra',
        district: 'Pune',
        coordinates: [73.8567, 18.5204]
      },
      farmingExperience: {
        years: 5,
        farmSize: 2.5,
        primaryCrops: ['wheat', 'rice'],
        farmingType: 'traditional'
      },
      preferences: {
        language: 'en',
        units: 'metric',
        notifications: {
          weather: true,
          irrigation: true,
          diagnosis: true,
          planning: true,
          analytics: false
        }
      },
      status: {
        isActive: true,
        onboardingCompleted: true
      }
    })
  },

  // Create test farm
  createTestFarm: async (userId) => {
    const Farm = require('../models/Farm')
    
    return await Farm.create({
      owner: userId,
      farmInfo: {
        name: 'Test Farm',
        totalArea: { value: 2.5, unit: 'hectares' },
        farmType: 'mixed_farm',
        establishedYear: 2020,
        description: 'Test farm for unit testing'
      },
      location: {
        address: 'Test Address, Test City',
        coordinates: [73.8567, 18.5204],
        centerPoint: {
          type: 'Point',
          coordinates: [73.8567, 18.5204]
        },
        boundary: {
          type: 'Polygon',
          coordinates: [[
            [73.8567, 18.5204],
            [73.8577, 18.5204],
            [73.8577, 18.5214],
            [73.8567, 18.5214],
            [73.8567, 18.5204]
          ]]
        },
        soilType: 'loamy',
        elevation: 550,
        waterSource: 'borewell'
      },
      currentCrops: [{
        cropName: 'wheat',
        variety: 'HD-2967',
        plantingDate: new Date(),
        expectedHarvestDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        area: { value: 1, unit: 'hectares' },
        growthStage: 'vegetative',
        field: 'Field-1'
      }],
      infrastructure: {
        irrigationSystem: 'sprinkler',
        storage: { capacity: 100, unit: 'tons' },
        equipment: ['tractor', 'harvester'],
        buildings: ['warehouse', 'farmhouse']
      },
      certifications: [{
        type: 'organic',
        issuedBy: 'Test Certification Body',
        issuedDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        certificateNumber: 'TEST-001'
      }]
    })
  },

  // Generate JWT token for testing
  generateTestToken: (userId) => {
    const jwt = require('jsonwebtoken')
    return jwt.sign(
      { _id: userId },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    )
  },

  // Mock API responses
  mockOpenEpiResponse: (type = 'weather') => {
    const responses = {
      weather: {
        location: { name: 'Test Location', country: 'Test Country' },
        temperature: 25,
        humidity: 60,
        wind_speed: 10,
        weather_description: 'Clear',
        weather_icon: 'sunny'
      },
      soil: {
        ph: 6.8,
        organic_matter: 3.2,
        nitrogen: 45,
        phosphorus: 23,
        potassium: 180
      },
      crop_health: {
        predictions: {
          healthy: 0.85,
          diseased: 0.15
        },
        confidence: 0.92
      }
    }
    return responses[type] || {}
  },

  // Create multipart form data for file uploads
  createFormData: (fields = {}, files = []) => {
    const FormData = require('form-data')
    const form = new FormData()
    
    Object.entries(fields).forEach(([key, value]) => {
      form.append(key, value)
    })
    
    files.forEach(file => {
      form.append(file.fieldName, file.buffer, file.filename)
    })
    
    return form
  }
}

// Set test environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-secret-key'
process.env.BCRYPT_ROUNDS = '4' // Faster for testing