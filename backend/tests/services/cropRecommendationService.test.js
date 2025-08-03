const { describe, test, expect, beforeEach } = require('@jest/globals')
const cropRecommendationService = require('../../services/cropRecommendationService')

describe('CropRecommendationService', () => {
  let testFarmData

  beforeEach(() => {
    testFarmData = {
      location: {
        coordinates: [73.8567, 18.5204], // Pune, India
        soilType: 'loamy',
        elevation: 550
      },
      farmInfo: {
        totalArea: { value: 2.5, unit: 'hectares' },
        farmType: 'mixed_farm'
      },
      farmingExperience: {
        years: 5,
        primaryCrops: ['wheat', 'rice'],
        farmingType: 'traditional'
      }
    }
  })

  describe('getCropRecommendations', () => {
    test('should return crop recommendations for given conditions', async () => {
      const season = 'winter'
      const recommendations = await cropRecommendationService.getCropRecommendations(
        testFarmData,
        season
      )

      expect(Array.isArray(recommendations)).toBe(true)
      expect(recommendations.length).toBeGreaterThan(0)

      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('cropName')
        expect(rec).toHaveProperty('variety')
        expect(rec).toHaveProperty('suitabilityScore')
        expect(rec).toHaveProperty('expectedYield')
        expect(rec).toHaveProperty('marketPrice')
        expect(rec).toHaveProperty('profitability')
        expect(rec).toHaveProperty('riskFactors')
        expect(rec).toHaveProperty('requirements')

        expect(rec.suitabilityScore).toBeGreaterThanOrEqual(0)
        expect(rec.suitabilityScore).toBeLessThanOrEqual(100)
      })
    })

    test('should prioritize crops by suitability score', async () => {
      const recommendations = await cropRecommendationService.getCropRecommendations(
        testFarmData,
        'winter'
      )

      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i - 1].suitabilityScore)
          .toBeGreaterThanOrEqual(recommendations[i].suitabilityScore)
      }
    })

    test('should recommend different crops for different seasons', async () => {
      const winterRecs = await cropRecommendationService.getCropRecommendations(
        testFarmData,
        'winter'
      )
      const summerRecs = await cropRecommendationService.getCropRecommendations(
        testFarmData,
        'summer'
      )

      // At least some recommendations should be different
      const winterCrops = winterRecs.map(r => r.cropName)
      const summerCrops = summerRecs.map(r => r.cropName)
      
      const commonCrops = winterCrops.filter(crop => summerCrops.includes(crop))
      expect(commonCrops.length).toBeLessThan(Math.max(winterCrops.length, summerCrops.length))
    })
  })

  describe('calculateSuitabilityScore', () => {
    test('should calculate suitability based on multiple factors', () => {
      const cropData = {
        climateRequirements: {
          temperature: { min: 15, max: 30, optimal: 22 },
          rainfall: { min: 300, max: 800, optimal: 500 },
          humidity: { min: 40, max: 70, optimal: 55 }
        },
        soilRequirements: {
          ph: { min: 6.0, max: 8.0, optimal: 7.0 },
          type: ['loamy', 'clay'],
          drainage: 'well-drained'
        }
      }

      const currentConditions = {
        climate: { temperature: 22, rainfall: 500, humidity: 55 },
        soil: { ph: 7.0, type: 'loamy', drainage: 'well-drained' }
      }

      const score = cropRecommendationService.calculateSuitabilityScore(
        cropData,
        currentConditions
      )

      expect(score).toBeGreaterThan(80) // Should be high for optimal conditions
      expect(score).toBeLessThanOrEqual(100)
    })

    test('should penalize poor conditions', () => {
      const cropData = {
        climateRequirements: {
          temperature: { min: 15, max: 30, optimal: 22 },
          rainfall: { min: 300, max: 800, optimal: 500 }
        },
        soilRequirements: {
          ph: { min: 6.0, max: 8.0, optimal: 7.0 }
        }
      }

      const poorConditions = {
        climate: { temperature: 10, rainfall: 100 }, // Too cold and dry
        soil: { ph: 4.5 } // Too acidic
      }

      const score = cropRecommendationService.calculateSuitabilityScore(
        cropData,
        poorConditions
      )

      expect(score).toBeLessThan(50) // Should be low for poor conditions
    })
  })

  describe('getCropCalendar', () => {
    test('should generate seasonal crop calendar', async () => {
      const calendar = await cropRecommendationService.getCropCalendar(testFarmData)

      expect(calendar).toHaveProperty('seasons')
      expect(Array.isArray(calendar.seasons)).toBe(true)

      calendar.seasons.forEach(season => {
        expect(season).toHaveProperty('name')
        expect(season).toHaveProperty('startMonth')
        expect(season).toHaveProperty('endMonth')
        expect(season).toHaveProperty('recommendedCrops')
        expect(Array.isArray(season.recommendedCrops)).toBe(true)
      })
    })

    test('should include planting and harvesting dates', async () => {
      const calendar = await cropRecommendationService.getCropCalendar(testFarmData)

      calendar.seasons.forEach(season => {
        season.recommendedCrops.forEach(crop => {
          expect(crop).toHaveProperty('plantingWindow')
          expect(crop).toHaveProperty('harvestWindow')
          expect(crop.plantingWindow).toHaveProperty('start')
          expect(crop.plantingWindow).toHaveProperty('end')
        })
      })
    })
  })

  describe('analyzeMarketTrends', () => {
    test('should analyze market trends for crops', async () => {
      const trends = await cropRecommendationService.analyzeMarketTrends(['wheat', 'rice'])

      expect(Array.isArray(trends)).toBe(true)
      
      trends.forEach(trend => {
        expect(trend).toHaveProperty('cropName')
        expect(trend).toHaveProperty('currentPrice')
        expect(trend).toHaveProperty('priceHistory')
        expect(trend).toHaveProperty('demandForecast')
        expect(trend).toHaveProperty('trend')

        expect(['rising', 'falling', 'stable']).toContain(trend.trend)
        expect(trend.currentPrice).toBeGreaterThan(0)
      })
    })

    test('should calculate price volatility', async () => {
      const trends = await cropRecommendationService.analyzeMarketTrends(['wheat'])

      expect(trends[0]).toHaveProperty('volatility')
      expect(trends[0].volatility).toBeGreaterThanOrEqual(0)
      expect(trends[0].volatility).toBeLessThanOrEqual(100)
    })
  })

  describe('calculateProfitability', () => {
    test('should calculate expected profitability', () => {
      const cropData = {
        expectedYield: { value: 3000, unit: 'kg/hectare' },
        cultivationCost: 50000, // per hectare
        harvestingCost: 10000,
        marketPrice: 25 // per kg
      }

      const area = 2 // hectares

      const profitability = cropRecommendationService.calculateProfitability(
        cropData,
        area
      )

      expect(profitability).toHaveProperty('grossIncome')
      expect(profitability).toHaveProperty('totalCosts')
      expect(profitability).toHaveProperty('netProfit')
      expect(profitability).toHaveProperty('profitMargin')
      expect(profitability).toHaveProperty('roi')

      expect(profitability.grossIncome).toBeGreaterThan(0)
      expect(profitability.totalCosts).toBeGreaterThan(0)
      expect(profitability.profitMargin).toBeGreaterThanOrEqual(-100)
      expect(profitability.profitMargin).toBeLessThanOrEqual(100)
    })

    test('should handle loss scenarios', () => {
      const lossData = {
        expectedYield: { value: 1000, unit: 'kg/hectare' },
        cultivationCost: 80000,
        harvestingCost: 20000,
        marketPrice: 20
      }

      const profitability = cropRecommendationService.calculateProfitability(
        lossData,
        1
      )

      expect(profitability.netProfit).toBeLessThan(0)
      expect(profitability.profitMargin).toBeLessThan(0)
      expect(profitability.roi).toBeLessThan(0)
    })
  })

  describe('assessClimateRisks', () => {
    test('should assess climate-related risks', async () => {
      const risks = await cropRecommendationService.assessClimateRisks(
        'wheat',
        testFarmData.location
      )

      expect(Array.isArray(risks)).toBe(true)
      
      risks.forEach(risk => {
        expect(risk).toHaveProperty('type')
        expect(risk).toHaveProperty('probability')
        expect(risk).toHaveProperty('impact')
        expect(risk).toHaveProperty('mitigation')

        expect(['low', 'medium', 'high']).toContain(risk.probability)
        expect(['low', 'medium', 'high']).toContain(risk.impact)
      })
    })

    test('should identify location-specific risks', async () => {
      const coastalLocation = {
        coordinates: [72.8777, 19.0760], // Mumbai (coastal)
        elevation: 10
      }

      const inlandLocation = {
        coordinates: [77.1025, 28.7041], // Delhi (inland)
        elevation: 216
      }

      const coastalRisks = await cropRecommendationService.assessClimateRisks(
        'rice',
        coastalLocation
      )
      const inlandRisks = await cropRecommendationService.assessClimateRisks(
        'rice',
        inlandLocation
      )

      // Coastal areas should have different risk profiles
      const coastalRiskTypes = coastalRisks.map(r => r.type)
      const inlandRiskTypes = inlandRisks.map(r => r.type)
      
      expect(coastalRiskTypes).not.toEqual(inlandRiskTypes)
    })
  })

  describe('compareCrops', () => {
    test('should compare multiple crops across various factors', async () => {
      const comparison = await cropRecommendationService.compareCrops(
        ['wheat', 'rice', 'potato'],
        testFarmData
      )

      expect(comparison).toHaveProperty('crops')
      expect(comparison).toHaveProperty('comparisonMatrix')
      expect(comparison).toHaveProperty('recommendations')

      expect(Array.isArray(comparison.crops)).toBe(true)
      expect(comparison.crops).toHaveLength(3)

      comparison.crops.forEach(crop => {
        expect(crop).toHaveProperty('name')
        expect(crop).toHaveProperty('scores')
        expect(crop.scores).toHaveProperty('suitability')
        expect(crop.scores).toHaveProperty('profitability')
        expect(crop.scores).toHaveProperty('riskLevel')
      })
    })

    test('should provide ranking and recommendations', async () => {
      const comparison = await cropRecommendationService.compareCrops(
        ['wheat', 'rice'],
        testFarmData
      )

      expect(comparison).toHaveProperty('ranking')
      expect(Array.isArray(comparison.ranking)).toBe(true)
      expect(comparison.ranking).toHaveLength(2)

      // First ranked crop should have higher overall score
      if (comparison.ranking.length > 1) {
        expect(comparison.ranking[0].overallScore)
          .toBeGreaterThanOrEqual(comparison.ranking[1].overallScore)
      }
    })
  })

  describe('validateCropData', () => {
    test('should validate correct crop data', () => {
      const validData = {
        cropName: 'wheat',
        variety: 'HD-2967',
        area: { value: 1.5, unit: 'hectares' },
        plantingDate: new Date(),
        expectedHarvest: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
      }

      const validation = cropRecommendationService.validateCropData(validData)
      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('should detect invalid crop data', () => {
      const invalidData = {
        cropName: '', // Empty name
        area: { value: -1, unit: 'hectares' }, // Negative area
        plantingDate: new Date('invalid'), // Invalid date
        expectedHarvest: new Date('2020-01-01') // Past date
      }

      const validation = cropRecommendationService.validateCropData(invalidData)
      expect(validation.isValid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })
  })
})