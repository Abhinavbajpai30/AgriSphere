const { describe, test, expect, beforeEach } = require('@jest/globals')
const irrigationService = require('../../services/irrigationService')

describe('IrrigationService', () => {
  let testData

  beforeEach(() => {
    testData = {
      farm: {
        location: { coordinates: [73.8567, 18.5204] },
        farmInfo: { totalArea: { value: 2.5, unit: 'hectares' } },
        currentCrops: [{
          cropName: 'wheat',
          plantingDate: new Date('2023-11-01'),
          area: { value: 1, unit: 'hectares' },
          growthStage: 'vegetative'
        }]
      },
      weather: {
        temperature: 25,
        humidity: 60,
        windSpeed: 10,
        precipitation: 0
      },
      soil: {
        moisture: 45,
        ph: 6.8,
        type: 'loamy'
      }
    }
  })

  describe('calculateEvapotranspiration', () => {
    test('should calculate ET0 using Penman-Monteith equation', () => {
      const et0 = irrigationService.calculateEvapotranspiration(
        testData.weather.temperature,
        testData.weather.humidity,
        testData.weather.windSpeed,
        5.5 // solar radiation
      )

      expect(et0).toBeGreaterThan(0)
      expect(et0).toBeLessThan(20) // Reasonable ET0 range
      expect(typeof et0).toBe('number')
    })

    test('should handle edge cases', () => {
      // Very high temperature
      const highTempET = irrigationService.calculateEvapotranspiration(45, 30, 5, 8)
      expect(highTempET).toBeGreaterThan(0)

      // Very low humidity
      const lowHumidityET = irrigationService.calculateEvapotranspiration(25, 10, 15, 6)
      expect(lowHumidityET).toBeGreaterThan(0)

      // No wind
      const noWindET = irrigationService.calculateEvapotranspiration(20, 70, 0, 4)
      expect(noWindET).toBeGreaterThan(0)
    })
  })

  describe('calculateCropWaterRequirement', () => {
    test('should calculate crop water requirement based on growth stage', () => {
      const cropTypes = ['wheat', 'rice', 'tomato', 'potato']
      const growthStages = ['initial', 'development', 'mid', 'late']

      cropTypes.forEach(cropType => {
        growthStages.forEach(stage => {
          const requirement = irrigationService.calculateCropWaterRequirement(
            cropType,
            stage,
            5.0 // ET0
          )

          expect(requirement).toBeGreaterThan(0)
          expect(typeof requirement).toBe('number')
        })
      })
    })

    test('should apply correct crop coefficients', () => {
      const et0 = 5.0
      
      // Wheat at different stages
      const wheatInitial = irrigationService.calculateCropWaterRequirement('wheat', 'initial', et0)
      const wheatMid = irrigationService.calculateCropWaterRequirement('wheat', 'mid', et0)
      const wheatLate = irrigationService.calculateCropWaterRequirement('wheat', 'late', et0)

      // Mid-season should generally have higher water requirement
      expect(wheatMid).toBeGreaterThan(wheatInitial)
      expect(wheatMid).toBeGreaterThan(wheatLate)
    })

    test('should handle unknown crop types', () => {
      const requirement = irrigationService.calculateCropWaterRequirement('unknown_crop', 'mid', 5.0)
      expect(requirement).toBeGreaterThan(0) // Should use default values
    })
  })

  describe('calculateIrrigationRecommendation', () => {
    test('should provide irrigation recommendation', async () => {
      const recommendation = await irrigationService.calculateIrrigationRecommendation(
        testData.farm,
        testData.weather,
        testData.soil
      )

      expect(recommendation).toHaveProperty('shouldIrrigate')
      expect(recommendation).toHaveProperty('waterAmount')
      expect(recommendation).toHaveProperty('priority')
      expect(recommendation).toHaveProperty('reasoning')
      expect(recommendation).toHaveProperty('timing')
      expect(recommendation).toHaveProperty('method')

      expect(typeof recommendation.shouldIrrigate).toBe('boolean')
      expect(typeof recommendation.waterAmount).toBe('number')
      expect(['low', 'medium', 'high', 'urgent']).toContain(recommendation.priority)
    })

    test('should recommend irrigation for low soil moisture', async () => {
      const dryTestData = {
        ...testData,
        soil: { ...testData.soil, moisture: 20 } // Very low moisture
      }

      const recommendation = await irrigationService.calculateIrrigationRecommendation(
        dryTestData.farm,
        dryTestData.weather,
        dryTestData.soil
      )

      expect(recommendation.shouldIrrigate).toBe(true)
      expect(recommendation.priority).toBeOneOf(['high', 'urgent'])
    })

    test('should not recommend irrigation for recent rain', async () => {
      const rainyTestData = {
        ...testData,
        weather: { ...testData.weather, precipitation: 25 } // Recent heavy rain
      }

      const recommendation = await irrigationService.calculateIrrigationRecommendation(
        rainyTestData.farm,
        rainyTestData.weather,
        rainyTestData.soil
      )

      expect(recommendation.shouldIrrigate).toBe(false)
      expect(recommendation.reasoning).toContain('rain')
    })
  })

  describe('optimizeIrrigationSchedule', () => {
    test('should create optimized irrigation schedule', async () => {
      const schedule = await irrigationService.optimizeIrrigationSchedule(
        testData.farm,
        7 // days
      )

      expect(Array.isArray(schedule)).toBe(true)
      expect(schedule.length).toBeLessThanOrEqual(7)

      schedule.forEach(day => {
        expect(day).toHaveProperty('date')
        expect(day).toHaveProperty('shouldIrrigate')
        expect(day).toHaveProperty('waterAmount')
        expect(day).toHaveProperty('timeOfDay')
        expect(day).toHaveProperty('confidence')
      })
    })

    test('should prioritize morning irrigation', async () => {
      const schedule = await irrigationService.optimizeIrrigationSchedule(
        testData.farm,
        7
      )

      const irrigationDays = schedule.filter(day => day.shouldIrrigate)
      irrigationDays.forEach(day => {
        expect(['early_morning', 'morning']).toContain(day.timeOfDay)
      })
    })
  })

  describe('calculateWaterEfficiency', () => {
    test('should calculate irrigation efficiency metrics', () => {
      const irrigationLogs = [
        {
          date: new Date(),
          waterUsed: 100,
          area: 1,
          method: 'drip',
          cropType: 'wheat'
        },
        {
          date: new Date(),
          waterUsed: 150,
          area: 1.5,
          method: 'sprinkler',
          cropType: 'rice'
        }
      ]

      const efficiency = irrigationService.calculateWaterEfficiency(irrigationLogs)

      expect(efficiency).toHaveProperty('averageWaterPerHectare')
      expect(efficiency).toHaveProperty('efficiencyScore')
      expect(efficiency).toHaveProperty('recommendations')

      expect(efficiency.averageWaterPerHectare).toBeGreaterThan(0)
      expect(efficiency.efficiencyScore).toBeGreaterThanOrEqual(0)
      expect(efficiency.efficiencyScore).toBeLessThanOrEqual(100)
      expect(Array.isArray(efficiency.recommendations)).toBe(true)
    })

    test('should provide recommendations for improvement', () => {
      const inefficientLogs = [
        {
          date: new Date(),
          waterUsed: 500, // Very high water usage
          area: 1,
          method: 'flood',
          cropType: 'wheat'
        }
      ]

      const efficiency = irrigationService.calculateWaterEfficiency(inefficientLogs)
      expect(efficiency.recommendations.length).toBeGreaterThan(0)
      expect(efficiency.efficiencyScore).toBeLessThan(70)
    })
  })

  describe('validateIrrigationData', () => {
    test('should validate correct irrigation data', () => {
      const validData = {
        waterAmount: 100,
        duration: 60,
        method: 'drip',
        area: 1.5
      }

      const validation = irrigationService.validateIrrigationData(validData)
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('should detect invalid data', () => {
      const invalidData = {
        waterAmount: -10, // Negative water amount
        duration: 0, // Zero duration
        method: 'invalid_method',
        area: -1 // Negative area
      }

      const validation = irrigationService.validateIrrigationData(invalidData)
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    test('should detect missing required fields', () => {
      const incompleteData = {
        waterAmount: 100
        // Missing other required fields
      }

      const validation = irrigationService.validateIrrigationData(incompleteData)
      expect(validation.isValid).toBe(false)
      expect(validation.errors.some(error => error.includes('required'))).toBe(true)
    })
  })
})