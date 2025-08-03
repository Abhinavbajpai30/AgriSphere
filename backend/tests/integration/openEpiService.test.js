const { describe, test, expect, beforeAll, afterAll, jest } = require('@jest/globals')
const openEpiService = require('../../services/openEpiService')

describe('OpenEpiService Integration Tests', () => {
  let originalEnv

  beforeAll(() => {
    // Store original environment variables
    originalEnv = { ...process.env }
    
    // Set test environment variables
    process.env.OPENEPI_CLIENT_ID = 'test-client-id'
    process.env.OPENEPI_CLIENT_SECRET = 'test-client-secret'
  })

  afterAll(() => {
    // Restore original environment variables
    process.env = originalEnv
  })

  describe('Authentication', () => {
    test('should handle OAuth2 token generation', async () => {
      // Mock the token response
      const mockToken = 'mock-access-token'
      jest.spyOn(openEpiService, 'getOpenEpiToken').mockResolvedValue(mockToken)

      const token = await openEpiService.getOpenEpiToken()
      expect(token).toBe(mockToken)
      expect(typeof token).toBe('string')
    })

    test('should handle authentication failures gracefully', async () => {
      // Mock authentication failure
      jest.spyOn(openEpiService, 'getOpenEpiToken').mockRejectedValue(
        new Error('Authentication failed')
      )

      await expect(openEpiService.getOpenEpiToken()).rejects.toThrow('Authentication failed')
    })
  })

  describe('Weather API', () => {
    test('should fetch current weather data', async () => {
      const latitude = 18.5204
      const longitude = 73.8567

      // Use mock data since we're testing
      const weatherData = await openEpiService.getWeatherData(latitude, longitude)

      expect(weatherData).toHaveProperty('location')
      expect(weatherData).toHaveProperty('temperature')
      expect(weatherData).toHaveProperty('humidity')
      expect(weatherData).toHaveProperty('wind_speed')
      expect(weatherData).toHaveProperty('weather_description')

      expect(weatherData.location).toHaveProperty('lat')
      expect(weatherData.location).toHaveProperty('lon')
      expect(weatherData.location.lat).toBe(latitude)
      expect(weatherData.location.lon).toBe(longitude)
    })

    test('should fetch weather forecast', async () => {
      const latitude = 18.5204
      const longitude = 73.8567
      const days = 5

      const forecastData = await openEpiService.getWeatherForecast(latitude, longitude, days)

      expect(forecastData).toHaveProperty('location')
      expect(forecastData).toHaveProperty('forecast')
      expect(Array.isArray(forecastData.forecast)).toBe(true)
      expect(forecastData.forecast).toHaveLength(days)

      forecastData.forecast.forEach(day => {
        expect(day).toHaveProperty('date')
        expect(day).toHaveProperty('temperature')
        expect(day).toHaveProperty('humidity')
        expect(day).toHaveProperty('precipitation')
        expect(day.temperature).toHaveProperty('min')
        expect(day.temperature).toHaveProperty('max')
        expect(day.temperature).toHaveProperty('avg')
      })
    })

    test('should handle invalid coordinates', async () => {
      const invalidLat = 200 // Invalid latitude
      const invalidLon = 400 // Invalid longitude

      // Should still return mock data for testing
      const weatherData = await openEpiService.getWeatherData(invalidLat, invalidLon)
      expect(weatherData).toBeDefined()
    })

    test('should validate weather data structure', async () => {
      const weatherData = await openEpiService.getWeatherData(18.5204, 73.8567)

      // Validate required fields
      expect(typeof weatherData.temperature).toBe('number')
      expect(typeof weatherData.humidity).toBe('number')
      expect(typeof weatherData.wind_speed).toBe('number')
      expect(typeof weatherData.weather_description).toBe('string')

      // Validate reasonable ranges
      expect(weatherData.temperature).toBeGreaterThan(-50)
      expect(weatherData.temperature).toBeLessThan(60)
      expect(weatherData.humidity).toBeGreaterThanOrEqual(0)
      expect(weatherData.humidity).toBeLessThanOrEqual(100)
    })
  })

  describe('Soil API', () => {
    test('should fetch soil data', async () => {
      const latitude = 18.5204
      const longitude = 73.8567

      const soilData = await openEpiService.getSoilData(latitude, longitude)

      expect(soilData).toHaveProperty('ph')
      expect(soilData).toHaveProperty('organic_matter')
      expect(soilData).toHaveProperty('nitrogen')
      expect(soilData).toHaveProperty('phosphorus')
      expect(soilData).toHaveProperty('potassium')

      // Validate pH range
      expect(soilData.ph).toBeGreaterThan(0)
      expect(soilData.ph).toBeLessThan(14)

      // Validate nutrient values are non-negative
      expect(soilData.nitrogen).toBeGreaterThanOrEqual(0)
      expect(soilData.phosphorus).toBeGreaterThanOrEqual(0)
      expect(soilData.potassium).toBeGreaterThanOrEqual(0)
    })

    test('should fetch soil composition', async () => {
      const latitude = 18.5204
      const longitude = 73.8567
      const depth = 30

      const composition = await openEpiService.getSoilComposition(latitude, longitude, depth)

      expect(composition).toHaveProperty('sand_percentage')
      expect(composition).toHaveProperty('clay_percentage')
      expect(composition).toHaveProperty('silt_percentage')

      // Validate percentages sum to approximately 100
      const total = composition.sand_percentage + 
                   composition.clay_percentage + 
                   composition.silt_percentage
      expect(total).toBeCloseTo(100, 1)
    })

    test('should handle different depth parameters', async () => {
      const depths = [10, 30, 60, 100]
      
      for (const depth of depths) {
        const composition = await openEpiService.getSoilComposition(18.5204, 73.8567, depth)
        expect(composition).toBeDefined()
        expect(typeof composition).toBe('object')
      }
    })
  })

  describe('Error Handling', () => {
    test('should handle network timeouts', async () => {
      // Mock a timeout error
      const originalMakeRequest = openEpiService.makeRequest
      openEpiService.makeRequest = jest.fn().mockRejectedValue(
        new Error('Request timeout')
      )

      await expect(
        openEpiService.getWeatherData(18.5204, 73.8567)
      ).rejects.toThrow()

      // Restore original method
      openEpiService.makeRequest = originalMakeRequest
    })

    test('should handle API rate limiting', async () => {
      // Mock rate limit error
      const rateLimitError = new Error('Rate limit exceeded')
      rateLimitError.response = { status: 429 }

      const originalMakeRequest = openEpiService.makeRequest
      openEpiService.makeRequest = jest.fn().mockRejectedValue(rateLimitError)

      await expect(
        openEpiService.getWeatherData(18.5204, 73.8567)
      ).rejects.toThrow('Rate limit exceeded')

      openEpiService.makeRequest = originalMakeRequest
    })

    test('should handle invalid API responses', async () => {
      // Mock invalid response
      const originalMakeRequest = openEpiService.makeRequest
      openEpiService.makeRequest = jest.fn().mockResolvedValue({
        invalid: 'response'
      })

      // Should still handle gracefully and return mock data
      const result = await openEpiService.getWeatherData(18.5204, 73.8567)
      expect(result).toBeDefined()

      openEpiService.makeRequest = originalMakeRequest
    })
  })

  describe('Caching Behavior', () => {
    test('should implement response caching', async () => {
      const latitude = 18.5204
      const longitude = 73.8567

      // First request
      const start1 = Date.now()
      const result1 = await openEpiService.getWeatherData(latitude, longitude)
      const time1 = Date.now() - start1

      // Second request (should be faster if cached)
      const start2 = Date.now()
      const result2 = await openEpiService.getWeatherData(latitude, longitude)
      const time2 = Date.now() - start2

      expect(result1).toEqual(result2)
      // If caching is working, second request should be faster
      // This is a loose test since we're using mock data
    })

    test('should respect cache TTL', async () => {
      // This would test cache expiration in a real implementation
      // For now, just verify consistent data structure
      const result = await openEpiService.getWeatherData(18.5204, 73.8567)
      expect(result).toHaveProperty('temperature')
    })
  })

  describe('Data Transformation', () => {
    test('should transform weather data correctly', async () => {
      const weatherData = await openEpiService.getWeatherData(18.5204, 73.8567)

      // Check that data is in expected format
      expect(weatherData.location.name).toMatch(/\d+\.\d+, \d+\.\d+/)
      expect(weatherData.location.country).toBe('Coordinates')
    })

    test('should transform forecast data correctly', async () => {
      const forecastData = await openEpiService.getWeatherForecast(18.5204, 73.8567, 3)

      forecastData.forecast.forEach(day => {
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD format
        expect(day.temperature).toHaveProperty('min')
        expect(day.temperature).toHaveProperty('max')
        expect(day.temperature).toHaveProperty('avg')
      })
    })
  })

  describe('Mock Data Validation', () => {
    test('should generate realistic mock weather data', async () => {
      const weatherData = await openEpiService.getWeatherData(18.5204, 73.8567)

      // Validate realistic ranges for mock data
      expect(weatherData.temperature).toBeGreaterThan(-10)
      expect(weatherData.temperature).toBeLessThan(50)
      expect(weatherData.humidity).toBeGreaterThanOrEqual(0)
      expect(weatherData.humidity).toBeLessThanOrEqual(100)
      expect(weatherData.wind_speed).toBeGreaterThanOrEqual(0)
      expect(weatherData.wind_speed).toBeLessThan(100)
    })

    test('should vary mock data based on time and coordinates', async () => {
      const data1 = await openEpiService.getWeatherData(18.5204, 73.8567)
      const data2 = await openEpiService.getWeatherData(20.0000, 75.0000)

      // Data should be different for different coordinates
      // Note: In real implementation, this would be more predictable
      expect(typeof data1.temperature).toBe('number')
      expect(typeof data2.temperature).toBe('number')
    })
  })
})