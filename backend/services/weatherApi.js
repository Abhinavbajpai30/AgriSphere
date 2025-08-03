/**
 * Weather API Service for AgriSphere
 * Provides weather data critical for farming decisions through OpenEPI
 * Refactored to use centralized OpenEPI service
 */

const openEpiService = require('./openEpiService');
const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');

class WeatherApiService {
  constructor() {
    this.openEpi = openEpiService;
    
    // Weather data cache duration (shorter for weather data)
    this.weatherCacheTTL = 1800; // 30 minutes
    this.forecastCacheTTL = 3600; // 1 hour
    this.historicalCacheTTL = 86400; // 24 hours
  }

  /**
   * Transform OpenEPI weather response to expected format
   */
  transformWeatherData(openEpiResponse, location) {
    // Handle both flat structure and nested current structure
    const currentData = openEpiResponse.current || openEpiResponse;
    
    return {
      location: {
        lat: location.lat,
        lon: location.lon,
        name: openEpiResponse.location?.name || 'Unknown',
        country: openEpiResponse.location?.country || 'Unknown'
      },
      current: {
        temperature: currentData.temperature || currentData.temp || null,
        feelsLike: currentData.feelsLike || currentData.feels_like || currentData.apparent_temperature,
        humidity: currentData.humidity || currentData.relative_humidity,
        pressure: currentData.pressure || currentData.surface_pressure,
        visibility: currentData.visibility,
        windSpeed: currentData.windSpeed || currentData.wind_speed || currentData.wind?.speed,
        windDirection: currentData.windDirection || currentData.wind_direction || currentData.wind?.direction,
        cloudiness: currentData.cloudiness || currentData.cloud_cover,
        description: currentData.description || currentData.weather_description,
        icon: currentData.icon || currentData.weather_icon,
        uvIndex: currentData.uvIndex || currentData.uv_index,
        dewPoint: currentData.dewPoint || currentData.dew_point,
        precipitation: currentData.precipitation
      },
      timestamp: new Date().toISOString(),
      source: 'OpenEPI'
    };
  }

  /**
   * Transform OpenEPI forecast response to expected format
   */
  transformForecastData(openEpiResponse, location) {
    const forecast = openEpiResponse.forecast || openEpiResponse.daily || [];
    
    return {
      location: {
        lat: location.lat,
        lon: location.lon,
        name: openEpiResponse.location?.name || 'Unknown',
        country: openEpiResponse.location?.country || 'Unknown'
      },
      forecast: forecast.map(day => ({
        date: day.date || day.datetime,
        temperature: {
          min: day.temp_min || day.temperature?.min || day.low,
          max: day.temp_max || day.temperature?.max || day.high,
          avg: day.temp_avg || day.temperature?.avg
        },
        humidity: day.humidity || day.relative_humidity,
        pressure: day.pressure || day.surface_pressure,
        windSpeed: day.windSpeed || day.wind_speed || day.wind?.speed,
        windDirection: day.windDirection || day.wind_direction || day.wind?.direction,
        cloudiness: day.cloudiness || day.cloud_cover,
        precipitation: day.precipitation || day.precip,
        precipitationProbability: day.precipitationProbability || day.precipitation_probability || day.precip_prob,
        description: day.description || day.weather_description,
        icon: day.icon || day.weather_icon,
        uvIndex: day.uvIndex || day.uv_index
      })),
      timestamp: new Date().toISOString(),
      source: 'OpenEPI'
    };
  }

  /**
   * Get current weather conditions for a location
   */
  async getCurrentWeather(lat, lon) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      logger.info('Getting current weather from OpenEPI', { lat, lon });

      const response = await this.openEpi.getWeatherData(lat, lon, {
        cacheTTL: this.weatherCacheTTL
      });
      
      logger.info('OpenEPI response received', { response: typeof response });

      const weatherData = this.transformWeatherData(response, { lat, lon });

      logger.info('Current weather data retrieved successfully via OpenEPI', { lat, lon });
      return weatherData;

    } catch (error) {
      logger.error('Failed to get current weather from OpenEPI', { lat, lon, error: error.message });
      throw error; // Let OpenEPI service handle error transformation
    }
  }

  /**
   * Get 7-day weather forecast for farming planning
   */
  async getWeatherForecast(lat, lon, days = 7) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      const response = await this.openEpi.getWeatherForecast(lat, lon, days, {
        cacheTTL: this.forecastCacheTTL
      });
      
      const forecastData = this.transformForecastData(response, { lat, lon });

      logger.info('Weather forecast data retrieved successfully via OpenEPI', { lat, lon, days });
      return forecastData;

    } catch (error) {
      logger.error('Failed to get weather forecast from OpenEPI', { lat, lon, error: error.message });
      throw error; // Let OpenEPI service handle error transformation
    }
  }

  /**
   * Get agricultural weather alerts and warnings
   */
  async getWeatherAlerts(lat, lon) {
    try {
      // Note: This would typically use a more specialized agricultural weather API
      // For now, we'll provide basic alerts based on current conditions
      const currentWeather = await this.getCurrentWeather(lat, lon);
      const alerts = [];

      // Generate basic farming alerts
      if (currentWeather.current.temperature > 35) {
        alerts.push({
          type: 'heat_warning',
          severity: 'moderate',
          title: 'High Temperature Alert',
          description: 'Temperature is above 35°C. Consider irrigation and crop protection.',
          recommendations: ['Increase irrigation frequency', 'Provide shade for sensitive crops', 'Monitor for heat stress']
        });
      }

      if (currentWeather.current.humidity > 90) {
        alerts.push({
          type: 'humidity_warning',
          severity: 'moderate',
          title: 'High Humidity Alert',
          description: 'High humidity may increase disease risk.',
          recommendations: ['Improve air circulation', 'Monitor for fungal diseases', 'Reduce irrigation if possible']
        });
      }

      if (currentWeather.current.windSpeed > 10) {
        alerts.push({
          type: 'wind_warning',
          severity: 'moderate',
          title: 'Strong Wind Alert',
          description: 'Strong winds may damage crops and affect spraying.',
          recommendations: ['Secure loose items', 'Postpone pesticide application', 'Check for crop damage']
        });
      }

      return {
        location: currentWeather.location,
        alerts,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to get weather alerts', { lat, lon, error: error.message });
      throw new ApiError('Weather alerts service temporarily unavailable', 503);
    }
  }

  /**
   * Get historical weather data for analysis
   */
  async getHistoricalWeather(lat, lon, startDate, endDate) {
    try {
      if (!lat || !lon || !startDate || !endDate) {
        throw new ApiError('Latitude, longitude, start date, and end date are required', 400);
      }

      const response = await this.openEpi.getHistoricalWeather(lat, lon, startDate, endDate, {
        cacheTTL: this.historicalCacheTTL
      });

      logger.info('Historical weather data retrieved successfully via OpenEPI', { 
        lat, lon, startDate, endDate 
      });
      
      return {
        location: { lat, lon },
        period: { startDate, endDate },
        data: response.historical || response.data || [],
        timestamp: new Date().toISOString(),
        source: 'OpenEPI'
      };

    } catch (error) {
      logger.error('Failed to get historical weather from OpenEPI', { 
        lat, lon, startDate, endDate, error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get agricultural weather insights and recommendations
   */
  async getAgriculturalInsights(lat, lon, cropType) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      const [currentWeather, forecast] = await Promise.all([
        this.getCurrentWeather(lat, lon),
        this.getWeatherForecast(lat, lon, 7)
      ]);

      // Generate agricultural insights
      const insights = {
        irrigation: this.generateIrrigationInsights(currentWeather, forecast),
        planting: this.generatePlantingInsights(currentWeather, forecast, cropType),
        harvesting: this.generateHarvestingInsights(currentWeather, forecast),
        pestManagement: this.generatePestManagementInsights(currentWeather, forecast)
      };

      return {
        location: currentWeather.location,
        cropType,
        insights,
        timestamp: new Date().toISOString(),
        source: 'OpenEPI'
      };

    } catch (error) {
      logger.error('Failed to generate agricultural insights', { 
        lat, lon, cropType, error: error.message 
      });
      throw error;
    }
  }

  /**
   * Generate irrigation recommendations based on weather data
   */
  generateIrrigationInsights(currentWeather, forecast) {
    const current = currentWeather.current;
    const upcoming = forecast.forecast.slice(0, 3); // Next 3 days
    
    let recommendation = 'normal';
    let reasoning = [];
    
    // Check current conditions
    if (current.temperature > 30 && current.humidity < 50) {
      recommendation = 'increase';
      reasoning.push('High temperature and low humidity increase water loss');
    }
    
    if (current.precipitation > 5) {
      recommendation = 'reduce';
      reasoning.push('Recent rainfall reduces irrigation needs');
    }
    
    // Check forecast
    const upcomingRain = upcoming.some(day => day.precipitation > 2);
    if (upcomingRain && recommendation !== 'reduce') {
      recommendation = 'delay';
      reasoning.push('Rain expected in next 3 days');
    }
    
    return {
      recommendation,
      reasoning,
      currentSoilMoisture: this.estimateSoilMoisture(current),
      nextIrrigation: this.calculateNextIrrigation(recommendation)
    };
  }

  /**
   * Generate planting recommendations
   */
  generatePlantingInsights(currentWeather, forecast, cropType) {
    const avgTemp = forecast.forecast
      .slice(0, 7)
      .reduce((sum, day) => sum + (day.temperature.avg || day.temperature.max), 0) / 7;
    
    const suitability = this.assessPlantingSuitability(avgTemp, currentWeather.current, cropType);
    
    return {
      suitability,
      optimalWindow: this.calculateOptimalPlantingWindow(forecast, cropType),
      recommendations: this.getPlantingRecommendations(suitability, cropType)
    };
  }

  /**
   * Generate harvesting insights
   */
  generateHarvestingInsights(currentWeather, forecast) {
    const dryDays = forecast.forecast.filter(day => day.precipitation < 1).length;
    const windyDays = forecast.forecast.filter(day => day.windSpeed > 15).length;
    
    return {
      conditions: dryDays >= 3 ? 'favorable' : 'challenging',
      optimalDays: forecast.forecast
        .filter(day => day.precipitation < 1 && day.windSpeed < 15)
        .map(day => day.date),
      recommendations: this.getHarvestingRecommendations(dryDays, windyDays)
    };
  }

  /**
   * Generate pest management insights
   */
  generatePestManagementInsights(currentWeather, forecast) {
    const current = currentWeather.current;
    const highHumidityDays = forecast.forecast.filter(day => day.humidity > 80).length;
    
    let riskLevel = 'low';
    let recommendations = [];
    
    if (current.temperature > 25 && current.humidity > 75) {
      riskLevel = 'high';
      recommendations.push('Monitor for fungal diseases');
      recommendations.push('Improve air circulation around plants');
    }
    
    if (highHumidityDays > 3) {
      riskLevel = Math.max(riskLevel, 'moderate');
      recommendations.push('Consider preventive fungicide application');
    }
    
    return {
      riskLevel,
      primaryConcerns: this.identifyPestConcerns(current, forecast),
      recommendations,
      optimalSprayingDays: forecast.forecast
        .filter(day => day.windSpeed < 10 && day.precipitation < 1)
        .map(day => day.date)
    };
  }

  // Helper methods for agricultural insights
  estimateSoilMoisture(weather) {
    // Simplified soil moisture estimation
    let moisture = 50; // Base percentage
    
    if (weather.precipitation > 10) moisture += 30;
    else if (weather.precipitation > 5) moisture += 15;
    
    if (weather.temperature > 30) moisture -= 20;
    if (weather.humidity < 50) moisture -= 10;
    
    return Math.max(0, Math.min(100, moisture));
  }

  calculateNextIrrigation(recommendation) {
    const now = new Date();
    const hours = {
      'immediate': 0,
      'increase': 12,
      'normal': 24,
      'reduce': 48,
      'delay': 72
    };
    
    return new Date(now.getTime() + (hours[recommendation] || 24) * 60 * 60 * 1000);
  }

  assessPlantingSuitability(avgTemp, current, cropType) {
    // Simplified crop-specific temperature requirements
    const tempRanges = {
      tomato: { min: 18, max: 30 },
      corn: { min: 15, max: 35 },
      wheat: { min: 10, max: 25 },
      rice: { min: 20, max: 35 },
      default: { min: 15, max: 30 }
    };
    
    const range = tempRanges[cropType] || tempRanges.default;
    
    if (avgTemp >= range.min && avgTemp <= range.max) {
      return 'excellent';
    } else if (avgTemp >= range.min - 5 && avgTemp <= range.max + 5) {
      return 'good';
    } else {
      return 'poor';
    }
  }

  calculateOptimalPlantingWindow(forecast, cropType) {
    // Return next 7 days with stable temperature conditions
    return forecast.forecast
      .filter(day => {
        const temp = day.temperature.avg || day.temperature.max;
        return temp > 15 && temp < 35 && day.precipitation < 5;
      })
      .map(day => day.date)
      .slice(0, 3);
  }

  getPlantingRecommendations(suitability, cropType) {
    const baseRecommendations = {
      excellent: [`Excellent conditions for ${cropType} planting`, 'Prepare soil and seeds'],
      good: [`Good conditions for ${cropType} planting`, 'Monitor weather for any changes'],
      poor: [`Not ideal for ${cropType} planting`, 'Wait for better conditions']
    };
    
    return baseRecommendations[suitability] || baseRecommendations.good;
  }

  getHarvestingRecommendations(dryDays, windyDays) {
    const recommendations = [];
    
    if (dryDays >= 3) {
      recommendations.push('Good weather window for harvesting');
    } else {
      recommendations.push('Wait for drier conditions');
    }
    
    if (windyDays > 2) {
      recommendations.push('Be cautious of strong winds during harvest');
    }
    
    return recommendations;
  }

  identifyPestConcerns(current, forecast) {
    const concerns = [];
    
    if (current.temperature > 25 && current.humidity > 75) {
      concerns.push('Fungal disease risk');
    }
    
    if (current.temperature > 30) {
      concerns.push('Insect activity increase');
    }
    
    const wetDays = forecast.forecast.filter(day => day.precipitation > 5).length;
    if (wetDays > 3) {
      concerns.push('Root rot and soil-borne diseases');
    }
    
    return concerns;
  }
}

module.exports = new WeatherApiService();