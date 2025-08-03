const { describe, test, expect, beforeEach, afterEach } = require('@jest/globals')
const request = require('supertest')
const express = require('express')
const authRoutes = require('../../routes/auth')
const User = require('../../models/User')

// Create test app
const app = express()
app.use(express.json())
app.use('/auth', authRoutes)

describe('Auth Routes', () => {
  let testUser

  beforeEach(async () => {
    // Clean up any existing test users
    await User.deleteMany({ 'personalInfo.phoneNumber': '+1234567890' })
  })

  afterEach(async () => {
    // Clean up test data
    if (testUser) {
      await User.findByIdAndDelete(testUser._id)
    }
  })

  describe('POST /auth/register', () => {
    test('should register a new user with valid data', async () => {
      const userData = {
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+1234567890',
          email: 'john.doe@example.com',
          dateOfBirth: '1990-01-01',
          gender: 'male'
        },
        location: {
          country: 'India',
          state: 'Maharashtra',
          district: 'Pune'
        },
        farmingExperience: {
          years: 5,
          farmSize: 2.5,
          primaryCrops: ['wheat', 'rice'],
          farmingType: 'traditional'
        },
        authentication: {
          password: 'testPassword123'
        }
      }

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.status).toBe('success')
      expect(response.body.message).toContain('successfully')
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('token')
      
      // Store for cleanup
      testUser = response.body.data.user
      
      // Verify user was created in database
      const dbUser = await User.findById(testUser._id)
      expect(dbUser).toBeTruthy()
      expect(dbUser.personalInfo.firstName).toBe('John')
    })

    test('should reject registration with duplicate phone number', async () => {
      // Create first user
      const userData = {
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+1234567890',
          email: 'john@example.com'
        },
        authentication: {
          password: 'testPassword123'
        }
      }

      const firstResponse = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201)

      testUser = firstResponse.body.data.user

      // Try to register with same phone number
      const duplicateUserData = {
        ...userData,
        personalInfo: {
          ...userData.personalInfo,
          firstName: 'Jane',
          email: 'jane@example.com'
        }
      }

      await request(app)
        .post('/auth/register')
        .send(duplicateUserData)
        .expect(400)
    })

    test('should validate required fields', async () => {
      const incompleteData = {
        personalInfo: {
          firstName: 'John'
          // Missing required fields
        }
      }

      const response = await request(app)
        .post('/auth/register')
        .send(incompleteData)
        .expect(400)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('validation')
    })

    test('should validate password strength', async () => {
      const userData = {
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+1234567890',
          email: 'john@example.com'
        },
        authentication: {
          password: '123' // Too weak
        }
      }

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400)

      expect(response.body.status).toBe('error')
    })
  })

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      // Create test user for login tests
      testUser = await global.testHelpers.createTestUser()
    })

    test('should login with valid credentials', async () => {
      const loginData = {
        phoneNumber: '+1234567890',
        password: 'testpassword123'
      }

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data.user).toHaveProperty('_id')
    })

    test('should reject login with invalid password', async () => {
      const loginData = {
        phoneNumber: '+1234567890',
        password: 'wrongpassword'
      }

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.status).toBe('error')
      expect(response.body.message).toContain('Invalid')
    })

    test('should reject login with non-existent phone number', async () => {
      const loginData = {
        phoneNumber: '+9999999999',
        password: 'testpassword123'
      }

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401)

      expect(response.body.status).toBe('error')
    })

    test('should validate login input', async () => {
      const invalidData = {
        phoneNumber: 'invalid-phone',
        password: ''
      }

      const response = await request(app)
        .post('/auth/login')
        .send(invalidData)
        .expect(400)

      expect(response.body.status).toBe('error')
    })
  })

  describe('GET /auth/me', () => {
    let authToken

    beforeEach(async () => {
      testUser = await global.testHelpers.createTestUser()
      authToken = global.testHelpers.generateTestToken(testUser._id)
    })

    test('should return user profile with valid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data.user._id).toBe(testUser._id.toString())
    })

    test('should reject request without token', async () => {
      await request(app)
        .get('/auth/me')
        .expect(401)
    })

    test('should reject request with invalid token', async () => {
      await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
    })
  })

  describe('PUT /auth/profile', () => {
    let authToken

    beforeEach(async () => {
      testUser = await global.testHelpers.createTestUser()
      authToken = global.testHelpers.generateTestToken(testUser._id)
    })

    test('should update user profile', async () => {
      const updateData = {
        personalInfo: {
          firstName: 'Updated Name',
          lastName: 'Updated Last'
        }
      }

      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.data.user.personalInfo.firstName).toBe('Updated Name')

      // Verify in database
      const updatedUser = await User.findById(testUser._id)
      expect(updatedUser.personalInfo.firstName).toBe('Updated Name')
    })

    test('should validate update data', async () => {
      const invalidData = {
        personalInfo: {
          phoneNumber: 'invalid-phone'
        }
      }

      await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)
    })

    test('should not allow updating sensitive fields', async () => {
      const sensitiveData = {
        authentication: {
          password: 'new-password'
        }
      }

      // This should either be rejected or the password should be ignored
      const response = await request(app)
        .put('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sensitiveData)

      // Verify password wasn't changed
      const user = await User.findById(testUser._id).select('+authentication.password')
      const isMatch = await user.comparePassword('testpassword123')
      expect(isMatch).toBe(true)
    })
  })

  describe('POST /auth/logout', () => {
    let authToken

    beforeEach(async () => {
      testUser = await global.testHelpers.createTestUser()
      authToken = global.testHelpers.generateTestToken(testUser._id)
    })

    test('should logout successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.message).toContain('logout')
    })

    test('should work without token (logout from client side)', async () => {
      // Logout should work even without token since it's mainly client-side
      const response = await request(app)
        .post('/auth/logout')
        .expect(200)

      expect(response.body.status).toBe('success')
    })
  })

  describe('Password Reset Flow', () => {
    beforeEach(async () => {
      testUser = await global.testHelpers.createTestUser()
    })

    test('should initiate password reset', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ phoneNumber: '+1234567890' })
        .expect(200)

      expect(response.body.status).toBe('success')
      expect(response.body.message).toContain('reset')
    })

    test('should handle non-existent phone number in password reset', async () => {
      const response = await request(app)
        .post('/auth/forgot-password')
        .send({ phoneNumber: '+9999999999' })
        .expect(404)

      expect(response.body.status).toBe('error')
    })
  })

  describe('Input Validation', () => {
    test('should sanitize input data', async () => {
      const maliciousData = {
        personalInfo: {
          firstName: '<script>alert("xss")</script>',
          lastName: 'Doe',
          phoneNumber: '+1234567890',
          email: 'test@example.com'
        },
        authentication: {
          password: 'testPassword123'
        }
      }

      const response = await request(app)
        .post('/auth/register')
        .send(maliciousData)
        .expect(201)

      // Verify XSS was sanitized
      expect(response.body.data.user.personalInfo.firstName).not.toContain('<script>')
    })

    test('should validate phone number format', async () => {
      const invalidFormats = [
        '1234567890',    // Missing country code
        'abc123',        // Invalid characters
        '+12345',        // Too short
        '+1234567890123456789'  // Too long
      ]

      for (const phoneNumber of invalidFormats) {
        const userData = {
          personalInfo: {
            firstName: 'John',
            lastName: 'Doe',
            phoneNumber,
            email: 'john@example.com'
          },
          authentication: {
            password: 'testPassword123'
          }
        }

        await request(app)
          .post('/auth/register')
          .send(userData)
          .expect(400)
      }
    })

    test('should validate email format', async () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test.example.com'
      ]

      for (const email of invalidEmails) {
        const userData = {
          personalInfo: {
            firstName: 'John',
            lastName: 'Doe',
            phoneNumber: '+1234567890',
            email
          },
          authentication: {
            password: 'testPassword123'
          }
        }

        await request(app)
          .post('/auth/register')
          .send(userData)
          .expect(400)
      }
    })
  })
})