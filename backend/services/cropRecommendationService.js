/**
 * Climate-Smart Crop Recommendation Service for AgriSphere
 * Provides intelligent crop recommendations based on climate, soil, and market data
 */

const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');
const irrigationService = require('./irrigationService');

class CropRecommendationService {
  constructor() {
    // Comprehensive crop database with climate requirements
    this.cropDatabase = {
      tomato: {
        name: 'Tomato',
        scientificName: 'Solanum lycopersicum',
        category: 'vegetable',
        image: '/images/crops/tomato.jpg',
        climate: {
          optimalTemp: { min: 20, max: 30 },
          rainfall: { min: 500, max: 800 },
          humidity: { min: 60, max: 80 },
          season: ['spring', 'summer']
        },
        soil: {
          ph: { min: 6.0, max: 7.0 },
          drainage: 'good',
          type: ['loam', 'sandy_loam'],
          organicMatter: { min: 2, max: 5 }
        },
        growing: {
          duration: 90, // days
          difficulty: 'medium',
          waterNeed: 'high',
          spacing: 0.6 // meters
        },
        economics: {
          seedCost: 150, // per kg
          expectedYield: 25000, // kg per hectare
          marketPrice: 2.5, // per kg
          profitMargin: 60 // percentage
        },
        benefits: [
          'High market demand',
          'Multiple harvests possible',
          'Rich in vitamins and antioxidants',
          'Good processing potential'
        ],
        challenges: [
          'Susceptible to pests and diseases',
          'Requires regular watering',
          'Sensitive to extreme temperatures',
          'Needs support structures'
        ],
        riskFactors: {
          drought: 'high',
          flood: 'medium',
          pest: 'high',
          disease: 'high',
          market: 'low'
        }
      },
      corn: {
        name: 'Corn (Maize)',
        scientificName: 'Zea mays',
        category: 'cereal',
        image: '/images/crops/corn.jpg',
        climate: {
          optimalTemp: { min: 18, max: 32 },
          rainfall: { min: 400, max: 700 },
          humidity: { min: 50, max: 70 },
          season: ['spring', 'summer']
        },
        soil: {
          ph: { min: 6.0, max: 7.5 },
          drainage: 'moderate',
          type: ['loam', 'clay_loam', 'sandy_loam'],
          organicMatter: { min: 2, max: 4 }
        },
        growing: {
          duration: 120,
          difficulty: 'easy',
          waterNeed: 'medium',
          spacing: 0.3
        },
        economics: {
          seedCost: 200,
          expectedYield: 8000,
          marketPrice: 0.8,
          profitMargin: 45
        },
        benefits: [
          'Stable market demand',
          'Drought tolerant varieties available',
          'Multiple uses (food, feed, industrial)',
          'Mechanization friendly'
        ],
        challenges: [
          'Requires large planting area',
          'Vulnerable to strong winds',
          'Heavy feeder (needs fertilizers)',
          'Post-harvest storage challenges'
        ],
        riskFactors: {
          drought: 'medium',
          flood: 'high',
          pest: 'medium',
          disease: 'medium',
          market: 'low'
        }
      },
      rice: {
        name: 'Rice',
        scientificName: 'Oryza sativa',
        category: 'cereal',
        image: '/images/crops/rice.jpg',
        climate: {
          optimalTemp: { min: 22, max: 32 },
          rainfall: { min: 1000, max: 2000 },
          humidity: { min: 70, max: 90 },
          season: ['monsoon', 'summer']
        },
        soil: {
          ph: { min: 5.5, max: 7.0 },
          drainage: 'poor',
          type: ['clay', 'clay_loam'],
          organicMatter: { min: 1.5, max: 3 }
        },
        growing: {
          duration: 110,
          difficulty: 'medium',
          waterNeed: 'very_high',
          spacing: 0.2
        },
        economics: {
          seedCost: 100,
          expectedYield: 6000,
          marketPrice: 1.2,
          profitMargin: 40
        },
        benefits: [
          'Staple food with guaranteed demand',
          'Suitable for waterlogged areas',
          'Multiple varieties available',
          'Government support often available'
        ],
        challenges: [
          'High water requirement',
          'Labor intensive',
          'Pest and disease pressure',
          'Climate change vulnerability'
        ],
        riskFactors: {
          drought: 'very_high',
          flood: 'low',
          pest: 'high',
          disease: 'high',
          market: 'very_low'
        }
      },
      potato: {
        name: 'Potato',
        scientificName: 'Solanum tuberosum',
        category: 'tuber',
        image: '/images/crops/potato.jpg',
        climate: {
          optimalTemp: { min: 15, max: 25 },
          rainfall: { min: 400, max: 600 },
          humidity: { min: 60, max: 80 },
          season: ['winter', 'spring']
        },
        soil: {
          ph: { min: 5.5, max: 6.5 },
          drainage: 'good',
          type: ['sandy_loam', 'loam'],
          organicMatter: { min: 2, max: 4 }
        },
        growing: {
          duration: 75,
          difficulty: 'easy',
          waterNeed: 'medium',
          spacing: 0.3
        },
        economics: {
          seedCost: 300,
          expectedYield: 20000,
          marketPrice: 1.5,
          profitMargin: 55
        },
        benefits: [
          'Short growing season',
          'High yield potential',
          'Good storage life',
          'Multiple market channels'
        ],
        challenges: [
          'Susceptible to late blight',
          'Requires quality seed tubers',
          'Storage facility needed',
          'Price volatility'
        ],
        riskFactors: {
          drought: 'medium',
          flood: 'high',
          pest: 'medium',
          disease: 'high',
          market: 'medium'
        }
      },
      cassava: {
        name: 'Cassava',
        scientificName: 'Manihot esculenta',
        category: 'tuber',
        image: '/images/crops/cassava.jpg',
        climate: {
          optimalTemp: { min: 25, max: 35 },
          rainfall: { min: 600, max: 1200 },
          humidity: { min: 60, max: 85 },
          season: ['all_year']
        },
        soil: {
          ph: { min: 5.5, max: 7.0 },
          drainage: 'good',
          type: ['sandy', 'sandy_loam', 'loam'],
          organicMatter: { min: 1, max: 3 }
        },
        growing: {
          duration: 300,
          difficulty: 'easy',
          waterNeed: 'low',
          spacing: 1.0
        },
        economics: {
          seedCost: 50,
          expectedYield: 15000,
          marketPrice: 0.5,
          profitMargin: 70
        },
        benefits: [
          'Drought tolerant',
          'Grows in poor soils',
          'Long storage in ground',
          'Climate resilient'
        ],
        challenges: [
          'Long growing period',
          'Processing required for some varieties',
          'Limited market in some areas',
          'Pest and disease issues'
        ],
        riskFactors: {
          drought: 'low',
          flood: 'medium',
          pest: 'medium',
          disease: 'medium',
          market: 'medium'
        }
      },
      wheat: {
        name: 'Wheat',
        scientificName: 'Triticum aestivum',
        category: 'cereal',
        image: '/images/crops/wheat.jpg',
        climate: {
          optimalTemp: { min: 15, max: 25 },
          rainfall: { min: 300, max: 600 },
          humidity: { min: 40, max: 60 },
          season: ['winter', 'spring']
        },
        soil: {
          ph: { min: 6.0, max: 7.5 },
          drainage: 'moderate',
          type: ['clay_loam', 'loam'],
          organicMatter: { min: 1.5, max: 3 }
        },
        growing: {
          duration: 130,
          difficulty: 'easy',
          waterNeed: 'medium',
          spacing: 0.1
        },
        economics: {
          seedCost: 80,
          expectedYield: 4000,
          marketPrice: 1.0,
          profitMargin: 35
        },
        benefits: [
          'Stable market demand',
          'Mechanization friendly',
          'Good for rotation',
          'Government support'
        ],
        challenges: [
          'Requires specific climate',
          'Competition from imports',
          'Storage and processing needed',
          'Vulnerable to weather extremes'
        ],
        riskFactors: {
          drought: 'high',
          flood: 'medium',
          pest: 'medium',
          disease: 'medium',
          market: 'low'
        }
      }
    };

    // Climate change adaptation strategies
    this.adaptationStrategies = {
      drought: [
        'Select drought-tolerant varieties',
        'Implement water-efficient irrigation',
        'Use mulching to retain moisture',
        'Practice conservation agriculture'
      ],
      flood: [
        'Choose flood-tolerant varieties',
        'Improve drainage systems',
        'Raise field beds',
        'Plan for early/late planting'
      ],
      temperature: [
        'Use heat/cold tolerant varieties',
        'Adjust planting dates',
        'Provide shade or protection',
        'Select appropriate microclimates'
      ]
    };

    // Seasonal planting calendar
    this.plantingCalendar = {
      spring: {
        months: ['March', 'April', 'May'],
        suitableCrops: ['tomato', 'corn', 'potato'],
        characteristics: 'Moderate temperatures, increasing daylight'
      },
      summer: {
        months: ['June', 'July', 'August'],
        suitableCrops: ['tomato', 'corn', 'rice'],
        characteristics: 'High temperatures, monsoon rains'
      },
      monsoon: {
        months: ['June', 'July', 'August', 'September'],
        suitableCrops: ['rice', 'cassava'],
        characteristics: 'Heavy rainfall, high humidity'
      },
      winter: {
        months: ['November', 'December', 'January', 'February'],
        suitableCrops: ['potato', 'wheat'],
        characteristics: 'Cool temperatures, dry conditions'
      }
    };
  }

  /**
   * Get personalized crop recommendations
   */
  async getRecommendations(params) {
    const {
      latitude,
      longitude,
      farmSize = 1,
      soilType = 'unknown',
      experience = 'beginner',
      budget = 'medium',
      marketAccess = 'local',
      riskTolerance = 'medium'
    } = params;

    try {
      // Get environmental data
      const [weatherData, soilData] = await Promise.all([
        irrigationService.getWeatherForecast(latitude, longitude),
        irrigationService.getSoilData(latitude, longitude)
      ]);

      // Calculate suitability scores for all crops
      const cropScores = await this.calculateCropSuitability(
        weatherData,
        soilData,
        { farmSize, experience, budget, marketAccess, riskTolerance }
      );

      // Get top recommendations
      const topRecommendations = cropScores
        .sort((a, b) => b.overallScore - a.overallScore)
        .slice(0, 6);

      // Generate seasonal calendar
      const seasonalCalendar = this.generateSeasonalCalendar(topRecommendations);

      // Climate adaptation recommendations
      const climateAdaptation = this.generateClimateAdaptation(weatherData, topRecommendations);

      return {
        topRecommendations: topRecommendations.slice(0, 3),
        allRecommendations: topRecommendations,
        seasonalCalendar,
        climateAdaptation,
        location: { latitude, longitude },
        environmental: {
          weather: weatherData,
          soil: soilData
        },
        metadata: {
          calculatedAt: new Date(),
          parameters: params,
          totalCropsEvaluated: Object.keys(this.cropDatabase).length
        }
      };

    } catch (error) {
      logger.error('Failed to get crop recommendations', { error: error.message });
      throw new ApiError('Crop recommendation service failed', 500);
    }
  }

  /**
   * Calculate suitability score for each crop
   */
  async calculateCropSuitability(weatherData, soilData, userParams) {
    const { farmSize, experience, budget, marketAccess, riskTolerance } = userParams;
    const currentMonth = new Date().getMonth() + 1;
    const currentSeason = this.getCurrentSeason(currentMonth);

    const cropScores = [];

    for (const [cropKey, crop] of Object.entries(this.cropDatabase)) {
      // Climate suitability
      const climateScore = this.calculateClimateScore(crop, weatherData);
      
      // Soil suitability
      const soilScore = this.calculateSoilScore(crop, soilData);
      
      // Economic viability
      const economicScore = this.calculateEconomicScore(crop, farmSize, budget, marketAccess);
      
      // Farmer suitability
      const farmerScore = this.calculateFarmerScore(crop, experience, riskTolerance);
      
      // Seasonal appropriateness
      const seasonalScore = this.calculateSeasonalScore(crop, currentSeason);
      
      // Risk assessment
      const riskScore = this.calculateRiskScore(crop, weatherData, riskTolerance);

      // Calculate weighted overall score
      const overallScore = (
        climateScore * 0.25 +
        soilScore * 0.20 +
        economicScore * 0.20 +
        farmerScore * 0.15 +
        seasonalScore * 0.10 +
        riskScore * 0.10
      );

      cropScores.push({
        cropKey,
        ...crop,
        suitabilityScores: {
          climate: Math.round(climateScore),
          soil: Math.round(soilScore),
          economic: Math.round(economicScore),
          farmer: Math.round(farmerScore),
          seasonal: Math.round(seasonalScore),
          risk: Math.round(riskScore),
          overall: Math.round(overallScore)
        },
        overallScore: Math.round(overallScore),
        recommendation: this.getRecommendationLevel(overallScore),
        profitProjection: this.calculateProfitProjection(crop, farmSize),
        waterRequirement: this.calculateWaterRequirement(crop, weatherData),
        bestPlantingTime: this.getBestPlantingTime(crop, currentMonth)
      });
    }

    return cropScores;
  }

  /**
   * Calculate climate suitability score
   */
  calculateClimateScore(crop, weatherData) {
    const avgTemp = weatherData.forecast
      .slice(0, 7)
      .reduce((sum, day) => sum + day.temperature, 0) / 7;
    
    const avgRainfall = weatherData.forecast
      .slice(0, 7)
      .reduce((sum, day) => sum + day.precipitation, 0) * 52; // Annualized
    
    const avgHumidity = weatherData.forecast
      .slice(0, 7)
      .reduce((sum, day) => sum + day.humidity, 0) / 7;

    // Temperature score
    const tempScore = this.getScoreInRange(
      avgTemp,
      crop.climate.optimalTemp.min,
      crop.climate.optimalTemp.max
    );

    // Rainfall score
    const rainScore = this.getScoreInRange(
      avgRainfall,
      crop.climate.rainfall.min,
      crop.climate.rainfall.max
    );

    // Humidity score
    const humidityScore = this.getScoreInRange(
      avgHumidity,
      crop.climate.humidity.min,
      crop.climate.humidity.max
    );

    return (tempScore + rainScore + humidityScore) / 3;
  }

  /**
   * Calculate soil suitability score
   */
  calculateSoilScore(crop, soilData) {
    // pH score
    const phScore = this.getScoreInRange(
      soilData.ph,
      crop.soil.ph.min,
      crop.soil.ph.max
    );

    // Soil type score
    const typeScore = crop.soil.type.includes(soilData.type) ? 100 : 60;

    // Drainage score
    const drainageScore = crop.soil.drainage === soilData.drainage ? 100 : 70;

    // Organic matter score
    const omScore = this.getScoreInRange(
      soilData.organicMatter,
      crop.soil.organicMatter.min,
      crop.soil.organicMatter.max
    );

    return (phScore + typeScore + drainageScore + omScore) / 4;
  }

  /**
   * Calculate economic viability score
   */
  calculateEconomicScore(crop, farmSize, budget, marketAccess) {
    const totalInvestment = crop.economics.seedCost * farmSize;
    const expectedRevenue = crop.economics.expectedYield * farmSize * crop.economics.marketPrice;
    const roi = ((expectedRevenue - totalInvestment) / totalInvestment) * 100;

    // Budget compatibility
    let budgetScore;
    if (budget === 'low' && totalInvestment < 5000) budgetScore = 100;
    else if (budget === 'medium' && totalInvestment < 15000) budgetScore = 100;
    else if (budget === 'high') budgetScore = 100;
    else budgetScore = 50;

    // Market access score
    let marketScore = 70; // base score
    if (marketAccess === 'export' && crop.category === 'vegetable') marketScore = 100;
    if (marketAccess === 'local' && crop.category === 'cereal') marketScore = 90;

    // ROI score
    const roiScore = Math.min(100, roi);

    return (budgetScore + marketScore + roiScore) / 3;
  }

  /**
   * Calculate farmer suitability score
   */
  calculateFarmerScore(crop, experience, riskTolerance) {
    // Experience level score
    let experienceScore = 100;
    if (experience === 'beginner' && crop.growing.difficulty === 'hard') experienceScore = 40;
    if (experience === 'beginner' && crop.growing.difficulty === 'medium') experienceScore = 70;
    if (experience === 'intermediate' && crop.growing.difficulty === 'hard') experienceScore = 80;

    // Risk tolerance score
    const cropRisk = Object.values(crop.riskFactors).reduce((sum, risk) => {
      const riskValues = { 'very_low': 1, 'low': 2, 'medium': 3, 'high': 4, 'very_high': 5 };
      return sum + (riskValues[risk] || 3);
    }, 0) / Object.keys(crop.riskFactors).length;

    let riskScore = 100;
    if (riskTolerance === 'low' && cropRisk > 3) riskScore = 50;
    if (riskTolerance === 'medium' && cropRisk > 4) riskScore = 70;

    return (experienceScore + riskScore) / 2;
  }

  /**
   * Calculate seasonal appropriateness score
   */
  calculateSeasonalScore(crop, currentSeason) {
    if (crop.climate.season.includes('all_year')) return 100;
    if (crop.climate.season.includes(currentSeason)) return 100;
    
    // Check if it's close to the right season
    const nextSeason = this.getNextSeason(currentSeason);
    if (crop.climate.season.includes(nextSeason)) return 80;
    
    return 40;
  }

  /**
   * Calculate risk score
   */
  calculateRiskScore(crop, weatherData, riskTolerance) {
    // Weather-based risk assessment
    const avgTemp = weatherData.forecast
      .slice(0, 7)
      .reduce((sum, day) => sum + day.temperature, 0) / 7;
    
    const totalRainfall = weatherData.forecast
      .slice(0, 7)
      .reduce((sum, day) => sum + day.precipitation, 0);

    let weatherRisk = 0;
    
    // Temperature extremes
    if (avgTemp > 35 || avgTemp < 10) weatherRisk += 20;
    
    // Rainfall extremes
    if (totalRainfall > 100) weatherRisk += 15; // Flood risk
    if (totalRainfall < 5) weatherRisk += 10; // Drought risk

    // Crop-specific risk factors
    const cropRiskLevel = Object.values(crop.riskFactors).reduce((sum, risk) => {
      const riskValues = { 'very_low': 1, 'low': 2, 'medium': 3, 'high': 4, 'very_high': 5 };
      return sum + (riskValues[risk] || 3);
    }, 0) / Object.keys(crop.riskFactors).length;

    const totalRisk = weatherRisk + (cropRiskLevel * 10);
    
    return Math.max(0, 100 - totalRisk);
  }

  /**
   * Generate seasonal planting calendar
   */
  generateSeasonalCalendar(topRecommendations) {
    const calendar = {};
    
    for (const [season, data] of Object.entries(this.plantingCalendar)) {
      calendar[season] = {
        ...data,
        recommendedCrops: topRecommendations
          .filter(crop => crop.climate.season.includes(season) || crop.climate.season.includes('all_year'))
          .slice(0, 3)
          .map(crop => ({
            name: crop.name,
            duration: crop.growing.duration,
            expectedYield: crop.economics.expectedYield,
            score: crop.overallScore
          }))
      };
    }
    
    return calendar;
  }

  /**
   * Generate climate adaptation strategies
   */
  generateClimateAdaptation(weatherData, topRecommendations) {
    const strategies = [];
    
    // Analyze climate risks
    const avgTemp = weatherData.forecast
      .slice(0, 7)
      .reduce((sum, day) => sum + day.temperature, 0) / 7;
    
    const totalRainfall = weatherData.forecast
      .slice(0, 7)
      .reduce((sum, day) => sum + day.precipitation, 0);

    if (avgTemp > 32) {
      strategies.push({
        risk: 'High Temperature',
        impact: 'Heat stress on crops',
        strategies: this.adaptationStrategies.temperature,
        priority: 'high',
        affectedCrops: topRecommendations
          .filter(crop => crop.climate.optimalTemp.max < avgTemp)
          .map(crop => crop.name)
      });
    }

    if (totalRainfall < 10) {
      strategies.push({
        risk: 'Low Rainfall',
        impact: 'Drought stress and water scarcity',
        strategies: this.adaptationStrategies.drought,
        priority: 'high',
        affectedCrops: topRecommendations
          .filter(crop => crop.growing.waterNeed === 'high' || crop.growing.waterNeed === 'very_high')
          .map(crop => crop.name)
      });
    }

    if (totalRainfall > 80) {
      strategies.push({
        risk: 'Excessive Rainfall',
        impact: 'Flooding and waterlogging',
        strategies: this.adaptationStrategies.flood,
        priority: 'medium',
        affectedCrops: topRecommendations
          .filter(crop => crop.riskFactors.flood === 'high')
          .map(crop => crop.name)
      });
    }

    return strategies;
  }

  /**
   * Helper methods
   */
  getScoreInRange(value, min, max) {
    if (value >= min && value <= max) return 100;
    
    const optimalRange = max - min;
    const tolerance = optimalRange * 0.3; // 30% tolerance
    
    if (value < min) {
      const deviation = min - value;
      return Math.max(0, 100 - (deviation / tolerance) * 100);
    } else {
      const deviation = value - max;
      return Math.max(0, 100 - (deviation / tolerance) * 100);
    }
  }

  getCurrentSeason(month) {
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'autumn';
    return 'winter';
  }

  getNextSeason(currentSeason) {
    const seasons = ['spring', 'summer', 'autumn', 'winter'];
    const currentIndex = seasons.indexOf(currentSeason);
    return seasons[(currentIndex + 1) % seasons.length];
  }

  getRecommendationLevel(score) {
    if (score >= 80) return 'highly_recommended';
    if (score >= 60) return 'recommended';
    if (score >= 40) return 'suitable_with_care';
    return 'not_recommended';
  }

  calculateProfitProjection(crop, farmSize) {
    const investment = crop.economics.seedCost * farmSize;
    const revenue = crop.economics.expectedYield * farmSize * crop.economics.marketPrice;
    const profit = revenue - investment;
    
    return {
      investment,
      revenue,
      profit,
      margin: crop.economics.profitMargin,
      roi: ((profit / investment) * 100).toFixed(1),
      paybackPeriod: Math.ceil(crop.growing.duration / 30) // months
    };
  }

  calculateWaterRequirement(crop, weatherData) {
    const baseRequirement = {
      'very_high': 1000,
      'high': 600,
      'medium': 400,
      'low': 200
    };
    
    const requirement = baseRequirement[crop.growing.waterNeed] || 400;
    const naturalRainfall = weatherData.forecast
      .slice(0, 7)
      .reduce((sum, day) => sum + day.precipitation, 0) * 15; // Approximate for growing season
    
    const irrigationNeeded = Math.max(0, requirement - naturalRainfall);
    
    return {
      total: requirement,
      naturalRainfall,
      irrigationNeeded,
      efficiency: irrigationNeeded / requirement
    };
  }

  getBestPlantingTime(crop, currentMonth) {
    const seasons = crop.climate.season;
    const seasonMonths = {
      spring: [3, 4, 5],
      summer: [6, 7, 8],
      monsoon: [6, 7, 8, 9],
      autumn: [9, 10, 11],
      winter: [12, 1, 2]
    };
    
    if (seasons.includes('all_year')) {
      return 'Any time of year';
    }
    
    for (const season of seasons) {
      const months = seasonMonths[season];
      if (months && months.includes(currentMonth)) {
        return 'Plant now';
      }
    }
    
    // Find next suitable season
    for (let i = 1; i <= 12; i++) {
      const futureMonth = ((currentMonth + i - 1) % 12) + 1;
      for (const season of seasons) {
        const months = seasonMonths[season];
        if (months && months.includes(futureMonth)) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return `Best time: ${monthNames[futureMonth - 1]}`;
        }
      }
    }
    
    return 'Check seasonal calendar';
  }
}

module.exports = new CropRecommendationService();