/**
 * Smart Irrigation Advisor Service for AgriSphere
 * Calculates irrigation needs using evapotranspiration, weather data, and soil conditions
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');

class IrrigationService {
  constructor() {
    // OpenEPI API configuration
    this.openEpiConfig = {
      authURL: 'https://auth.openepi.io/realms/openepi/protocol/openid-connect/token',
      baseURL: process.env.OPENEPI_API_URL || 'https://api.openepi.io',
      clientId: process.env.OPENEPI_CLIENT_ID || '',
      clientSecret: process.env.OPENEPI_CLIENT_SECRET || '',
      timeout: 30000
    };
    
    // Token cache
    this.accessToken = null;
    this.tokenExpiry = null;
    
    // Crop coefficients for different growth stages
    this.cropCoefficients = {
      tomato: {
        initial: 0.6,    // Germination to 10% ground cover
        development: 0.8, // 10% to 80% ground cover  
        mid: 1.15,       // 80% ground cover to start of maturity
        late: 0.8        // Start of maturity to harvest
      },
      corn: {
        initial: 0.3,
        development: 0.7,
        mid: 1.2,
        late: 0.6
      },
      rice: {
        initial: 1.05,
        development: 1.10,
        mid: 1.20,
        late: 0.90
      },
      wheat: {
        initial: 0.4,
        development: 0.7,
        mid: 1.15,
        late: 0.4
      },
      potato: {
        initial: 0.5,
        development: 0.75,
        mid: 1.15,
        late: 0.75
      },
      cassava: {
        initial: 0.3,
        development: 0.6,
        mid: 0.8,
        late: 0.5
      },
      default: {
        initial: 0.5,
        development: 0.75,
        mid: 1.0,
        late: 0.7
      }
    };
    
    // Soil water holding capacity (mm/m of soil depth)
    this.soilWaterCapacity = {
      sandy: 120,
      loam: 200,
      clay: 250,
      sandy_loam: 160,
      clay_loam: 220,
      silt_loam: 240,
      unknown: 180
    };
    
    // Cache for weather and soil data
    this.weatherCache = new Map();
    this.soilCache = new Map();
    this.cacheTTL = 3600000; // 1 hour in milliseconds
  }

  /**
   * Get OpenEPI access token using client credentials
   */
  async getOpenEpiToken() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        this.openEpiConfig.authURL,
        {
          grant_type: 'client_credentials',
          client_id: this.openEpiConfig.clientId,
          client_secret: this.openEpiConfig.clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: this.openEpiConfig.timeout
        }
      );

      if (response.data && response.data.access_token) {
        this.accessToken = response.data.access_token;
        this.tokenExpiry = Date.now() + (50 * 60 * 1000);
        return this.accessToken;
      } else {
        throw new Error('No access token received from OpenEPI');
      }
    } catch (error) {
      logger.error('Failed to get OpenEPI token', { error: error.message });
      throw error;
    }
  }

  /**
   * Get weather forecast data from OpenEPI
   */
  async getWeatherForecast(latitude, longitude) {
    const cacheKey = `weather_${latitude}_${longitude}`;
    const cached = this.weatherCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      // Try real OpenEPI API if configured
      if (this.openEpiConfig.clientId && this.openEpiConfig.clientSecret) {
        try {
          const token = await this.getOpenEpiToken();
          
          const response = await axios.get(
            `${this.openEpiConfig.baseURL}/weather/locationforecast`,
            {
              params: { lat: latitude, lon: longitude },
              headers: {
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'AgriSphere/1.0'
              },
              timeout: this.openEpiConfig.timeout
            }
          );

          if (response.data && response.data.properties) {
            const processedData = this.processWeatherData(response.data);
            this.weatherCache.set(cacheKey, {
              data: processedData,
              timestamp: Date.now()
            });
            return processedData;
          }
        } catch (apiError) {
          logger.warn('OpenEPI Weather API failed, using mock data', { error: apiError.message });
        }
      }

      // Fallback to mock weather data
      const mockWeather = this.generateMockWeatherData(latitude, longitude);
      this.weatherCache.set(cacheKey, {
        data: mockWeather,
        timestamp: Date.now()
      });
      return mockWeather;

    } catch (error) {
      logger.error('Failed to get weather forecast', { error: error.message });
      throw new ApiError('Weather service temporarily unavailable', 503);
    }
  }

  /**
   * Get soil data from OpenEPI
   */
  async getSoilData(latitude, longitude) {
    const cacheKey = `soil_${latitude}_${longitude}`;
    const cached = this.soilCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    try {
      // Try real OpenEPI API if configured
      if (this.openEpiConfig.clientId && this.openEpiConfig.clientSecret) {
        try {
          const token = await this.getOpenEpiToken();
          
          const response = await axios.get(
            `${this.openEpiConfig.baseURL}/soil/type`,
            {
              params: { lat: latitude, lon: longitude },
              headers: {
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'AgriSphere/1.0'
              },
              timeout: this.openEpiConfig.timeout
            }
          );

          if (response.data) {
            const processedData = this.processSoilData(response.data);
            this.soilCache.set(cacheKey, {
              data: processedData,
              timestamp: Date.now()
            });
            return processedData;
          }
        } catch (apiError) {
          logger.warn('OpenEPI Soil API failed, using mock data', { error: apiError.message });
        }
      }

      // Fallback to mock soil data
      const mockSoil = this.generateMockSoilData(latitude, longitude);
      this.soilCache.set(cacheKey, {
        data: mockSoil,
        timestamp: Date.now()
      });
      return mockSoil;

    } catch (error) {
      logger.error('Failed to get soil data', { error: error.message });
      throw new ApiError('Soil service temporarily unavailable', 503);
    }
  }

  /**
   * Calculate evapotranspiration using Penman-Monteith equation (simplified)
   */
  calculateEvapotranspiration(weatherData, cropType, growthStage) {
    const { temperature, humidity, windSpeed, solarRadiation } = weatherData;
    
    // Simplified ET0 calculation (reference evapotranspiration)
    // In production, you'd use the full Penman-Monteith equation
    const tempFactor = Math.max(0, (temperature - 5) / 30);
    const humidityFactor = Math.max(0.3, (100 - humidity) / 100);
    const windFactor = Math.min(2, 1 + windSpeed / 10);
    const radiationFactor = solarRadiation ? solarRadiation / 25 : 1;
    
    const et0 = tempFactor * humidityFactor * windFactor * radiationFactor * 5; // mm/day
    
    // Apply crop coefficient
    const cropCoef = this.getCropCoefficient(cropType, growthStage);
    const etCrop = et0 * cropCoef;
    
    return {
      et0: Math.round(et0 * 100) / 100,
      etCrop: Math.round(etCrop * 100) / 100,
      cropCoefficient: cropCoef
    };
  }

  /**
   * Calculate irrigation recommendation
   */
  async calculateIrrigationRecommendation(params) {
    const {
      latitude,
      longitude,
      cropType = 'unknown',
      growthStage = 'mid',
      soilType = 'unknown',
      lastIrrigation = null,
      fieldSize = 1 // hectares
    } = params;

    try {
      // Get weather and soil data
      const [weatherData, soilData] = await Promise.all([
        this.getWeatherForecast(latitude, longitude),
        this.getSoilData(latitude, longitude)
      ]);

      // Calculate evapotranspiration
      const etData = this.calculateEvapotranspiration(
        weatherData.current,
        cropType,
        growthStage
      );

      // Calculate water balance
      const waterBalance = this.calculateWaterBalance(
        etData,
        weatherData,
        soilData,
        soilType,
        lastIrrigation
      );

      // Generate recommendation
      const recommendation = this.generateIrrigationRecommendation(
        waterBalance,
        weatherData,
        etData,
        fieldSize
      );

      return {
        recommendation,
        waterBalance,
        evapotranspiration: etData,
        weather: weatherData,
        soil: soilData,
        metadata: {
          calculatedAt: new Date(),
          location: { latitude, longitude },
          crop: { type: cropType, growthStage },
          fieldSize
        }
      };

    } catch (error) {
      logger.error('Failed to calculate irrigation recommendation', { error: error.message });
      throw new ApiError('Irrigation calculation failed', 500);
    }
  }

  /**
   * Calculate water balance in soil
   */
  calculateWaterBalance(etData, weatherData, soilData, soilType, lastIrrigation) {
    const soilCapacity = this.soilWaterCapacity[soilType] || this.soilWaterCapacity.unknown;
    const rootDepth = 0.6; // meters (typical for most crops)
    const totalWaterCapacity = soilCapacity * rootDepth;
    
    // Calculate days since last irrigation
    const daysSinceIrrigation = lastIrrigation 
      ? Math.floor((Date.now() - new Date(lastIrrigation).getTime()) / (1000 * 60 * 60 * 24))
      : 7; // Default to 7 days if no previous irrigation
    
    // Calculate water loss due to ET
    const waterLoss = etData.etCrop * daysSinceIrrigation;
    
    // Calculate water gain from rainfall
    const waterGain = weatherData.forecast
      .slice(0, daysSinceIrrigation)
      .reduce((sum, day) => sum + (day.precipitation || 0), 0);
    
    // Current soil moisture (simplified)
    const currentMoisture = Math.max(0, totalWaterCapacity * 0.8 - waterLoss + waterGain);
    const moisturePercentage = (currentMoisture / totalWaterCapacity) * 100;
    
    // Critical thresholds
    const criticalThreshold = totalWaterCapacity * 0.3; // 30% of capacity
    const optimalThreshold = totalWaterCapacity * 0.7; // 70% of capacity
    
    return {
      currentMoisture: Math.round(currentMoisture),
      totalCapacity: Math.round(totalWaterCapacity),
      moisturePercentage: Math.round(moisturePercentage),
      waterLoss: Math.round(waterLoss),
      waterGain: Math.round(waterGain),
      isCritical: currentMoisture < criticalThreshold,
      isOptimal: currentMoisture >= optimalThreshold,
      daysSinceIrrigation
    };
  }

  /**
   * Generate irrigation recommendation
   */
  generateIrrigationRecommendation(waterBalance, weatherData, etData, fieldSize) {
    const { currentMoisture, totalCapacity, isCritical, isOptimal, moisturePercentage } = waterBalance;
    
    // Check upcoming rainfall
    const upcomingRain = weatherData.forecast
      .slice(0, 3) // Next 3 days
      .reduce((sum, day) => sum + (day.precipitation || 0), 0);
    
    let status, priority, action, amount, timing, reason;
    
    if (isCritical && upcomingRain < 10) {
      status = 'urgent';
      priority = 'high';
      action = 'irrigate_now';
      amount = Math.round((totalCapacity * 0.8 - currentMoisture) * fieldSize * 10); // liters
      timing = 'within_2_hours';
      reason = 'Critical soil moisture level detected. Immediate irrigation required to prevent crop stress.';
    } else if (moisturePercentage < 50 && upcomingRain < 5) {
      status = 'needed';
      priority = 'medium';
      action = 'irrigate_soon';
      amount = Math.round((totalCapacity * 0.7 - currentMoisture) * fieldSize * 10);
      timing = 'within_24_hours';
      reason = 'Soil moisture below optimal level. Irrigation recommended before crop stress occurs.';
    } else if (upcomingRain >= 10) {
      status = 'skip';
      priority = 'low';
      action = 'wait_for_rain';
      amount = 0;
      timing = 'after_rainfall';
      reason = `Significant rainfall expected (${Math.round(upcomingRain)}mm). Skip irrigation and reassess after rain.`;
    } else if (isOptimal) {
      status = 'optimal';
      priority = 'low';
      action = 'monitor';
      amount = 0;
      timing = 'next_assessment';
      reason = 'Soil moisture at optimal level. Continue monitoring and reassess in 2-3 days.';
    } else {
      status = 'monitor';
      priority = 'low';
      action = 'assess_tomorrow';
      amount = 0;
      timing = 'tomorrow';
      reason = 'Soil moisture adequate for now. Reassess tomorrow based on weather conditions.';
    }

    // Calculate optimal irrigation times
    const optimalTimes = this.calculateOptimalIrrigationTimes(weatherData.current);
    
    // Water conservation tips
    const conservationTips = this.getWaterConservationTips(status, weatherData);
    
    return {
      status,
      priority,
      action,
      amount,
      timing,
      reason,
      optimalTimes,
      conservationTips,
      nextAssessment: this.calculateNextAssessment(status),
      costEstimate: this.calculateIrrigationCost(amount),
      environmentalImpact: this.calculateEnvironmentalImpact(amount, status)
    };
  }

  /**
   * Get crop coefficient based on crop type and growth stage
   */
  getCropCoefficient(cropType, growthStage) {
    const cropData = this.cropCoefficients[cropType] || this.cropCoefficients.default;
    return cropData[growthStage] || cropData.mid;
  }

  /**
   * Calculate optimal irrigation times based on weather
   */
  calculateOptimalIrrigationTimes(currentWeather) {
    const { temperature, windSpeed } = currentWeather;
    
    // Early morning is always good
    const earlyMorning = {
      time: '05:30 - 07:00',
      reason: 'Low evaporation, good water absorption',
      efficiency: 95
    };
    
    // Evening time depends on temperature
    const eveningTime = temperature > 30 
      ? '18:30 - 20:00' 
      : '17:00 - 19:00';
    
    const evening = {
      time: eveningTime,
      reason: 'Cooler temperatures, reduced water loss',
      efficiency: 85
    };
    
    // Avoid midday unless urgent
    const avoid = {
      time: '10:00 - 16:00',
      reason: 'High evaporation, water stress on plants',
      efficiency: 45
    };
    
    return {
      recommended: [earlyMorning, evening],
      avoid: [avoid],
      best: temperature > 25 ? earlyMorning : evening
    };
  }

  /**
   * Get water conservation tips
   */
  getWaterConservationTips(status, weatherData) {
    const tips = [
      {
        tip: 'Use drip irrigation for 30-50% water savings',
        impact: 'high',
        savings: '30-50%'
      },
      {
        tip: 'Apply mulch around plants to reduce evaporation',
        impact: 'medium',
        savings: '15-25%'
      }
    ];
    
    if (weatherData.current.windSpeed > 15) {
      tips.push({
        tip: 'Avoid irrigation during windy conditions to reduce drift',
        impact: 'medium',
        savings: '10-20%'
      });
    }
    
    if (status === 'urgent') {
      tips.push({
        tip: 'Consider split irrigation to improve absorption',
        impact: 'high',
        savings: '20-30%'
      });
    }
    
    return tips;
  }

  /**
   * Calculate next assessment time
   */
  calculateNextAssessment(status) {
    const now = new Date();
    let hoursToAdd;
    
    switch (status) {
      case 'urgent':
        hoursToAdd = 6;
        break;
      case 'needed':
        hoursToAdd = 24;
        break;
      case 'skip':
        hoursToAdd = 72;
        break;
      default:
        hoursToAdd = 48;
    }
    
    return new Date(now.getTime() + hoursToAdd * 60 * 60 * 1000);
  }

  /**
   * Calculate irrigation cost estimate
   */
  calculateIrrigationCost(amount) {
    const waterCostPerLiter = 0.001; // $0.001 per liter (adjust based on location)
    const energyCost = amount * 0.0005; // Energy cost for pumping
    const totalCost = (amount * waterCostPerLiter) + energyCost;
    
    return {
      water: Math.round(amount * waterCostPerLiter * 100) / 100,
      energy: Math.round(energyCost * 100) / 100,
      total: Math.round(totalCost * 100) / 100,
      currency: 'USD'
    };
  }

  /**
   * Calculate environmental impact
   */
  calculateEnvironmentalImpact(amount, status) {
    const co2PerLiter = 0.0003; // kg CO2 per liter (pumping energy)
    const co2Impact = amount * co2PerLiter;
    
    let sustainability;
    if (status === 'optimal' || status === 'skip') {
      sustainability = 'excellent';
    } else if (status === 'monitor') {
      sustainability = 'good';
    } else if (status === 'needed') {
      sustainability = 'moderate';
    } else {
      sustainability = 'concerning';
    }
    
    return {
      co2Footprint: Math.round(co2Impact * 1000) / 1000,
      sustainability,
      waterEfficiency: status === 'urgent' ? 'low' : 'high',
      recommendation: 'Consider precision irrigation techniques for better efficiency'
    };
  }

  /**
   * Process OpenEPI weather data
   */
  processWeatherData(rawData) {
    try {
      const timeseries = rawData.properties.timeseries;
      const current = timeseries[0].data.instant.details;
      
      const forecast = timeseries.slice(0, 7).map(entry => {
        const details = entry.data.instant.details;
        const next6h = entry.data.next_6_hours;
        
        return {
          time: entry.time,
          temperature: details.air_temperature,
          humidity: details.relative_humidity,
          windSpeed: details.wind_speed,
          precipitation: next6h ? next6h.details.precipitation_amount : 0,
          summary: next6h ? next6h.summary.symbol_code : 'fair_day'
        };
      });
      
      return {
        current: {
          temperature: current.air_temperature,
          humidity: current.relative_humidity,
          windSpeed: current.wind_speed,
          solarRadiation: 20 // Estimated, as not always available
        },
        forecast,
        source: 'OpenEPI'
      };
    } catch (error) {
      logger.error('Error processing weather data', { error: error.message });
      throw new Error('Invalid weather data format');
    }
  }

  /**
   * Process OpenEPI soil data
   */
  processSoilData(rawData) {
    try {
      return {
        type: rawData.soil_type || 'loam',
        ph: rawData.ph || 6.5,
        organicMatter: rawData.organic_matter || 2.5,
        drainage: rawData.drainage || 'moderate',
        waterHoldingCapacity: rawData.water_holding_capacity || 180,
        source: 'OpenEPI'
      };
    } catch (error) {
      logger.error('Error processing soil data', { error: error.message });
      throw new Error('Invalid soil data format');
    }
  }

  /**
   * Generate mock weather data for testing
   */
  generateMockWeatherData(latitude, longitude) {
    const baseTemp = 25 + (Math.random() - 0.5) * 10;
    const baseHumidity = 60 + (Math.random() - 0.5) * 30;
    
    const forecast = [];
    for (let i = 0; i < 7; i++) {
      const tempVariation = (Math.random() - 0.5) * 5;
      const humidityVariation = (Math.random() - 0.5) * 20;
      const rainChance = Math.random();
      
      forecast.push({
        time: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
        temperature: Math.round((baseTemp + tempVariation) * 10) / 10,
        humidity: Math.max(20, Math.min(90, baseHumidity + humidityVariation)),
        windSpeed: Math.round((5 + Math.random() * 15) * 10) / 10,
        precipitation: rainChance > 0.7 ? Math.round(Math.random() * 20 * 10) / 10 : 0,
        summary: rainChance > 0.7 ? 'rain' : (rainChance > 0.4 ? 'cloudy' : 'sunny')
      });
    }
    
    return {
      current: {
        temperature: forecast[0].temperature,
        humidity: forecast[0].humidity,
        windSpeed: forecast[0].windSpeed,
        solarRadiation: 18 + Math.random() * 8
      },
      forecast,
      source: 'Mock Data'
    };
  }

  /**
   * Generate mock soil data for testing
   */
  generateMockSoilData(latitude, longitude) {
    const soilTypes = ['sandy', 'loam', 'clay', 'sandy_loam', 'clay_loam'];
    const randomType = soilTypes[Math.floor(Math.random() * soilTypes.length)];
    
    return {
      type: randomType,
      ph: Math.round((6.0 + Math.random() * 2.5) * 10) / 10,
      organicMatter: Math.round((1.5 + Math.random() * 3) * 10) / 10,
      drainage: ['poor', 'moderate', 'good'][Math.floor(Math.random() * 3)],
      waterHoldingCapacity: this.soilWaterCapacity[randomType],
      source: 'Mock Data'
    };
  }
}

module.exports = new IrrigationService();