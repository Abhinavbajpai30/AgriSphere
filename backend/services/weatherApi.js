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
    // Handle OpenEPI weather forecast format
    let currentData;
    
    if (openEpiResponse.properties?.timeseries?.[0]?.data?.instant?.details) {
      // OpenEPI weather forecast format
      const instant = openEpiResponse.properties.timeseries[0].data.instant.details;
      const next1h = openEpiResponse.properties.timeseries[0].data.next_1_hours;
      const next6h = openEpiResponse.properties.timeseries[0].data.next_6_hours;
      
      currentData = {
        temperature: instant.air_temperature,
        humidity: instant.relative_humidity,
        pressure: instant.air_pressure_at_sea_level,
        windSpeed: instant.wind_speed,
        windDirection: instant.wind_from_direction,
        cloudiness: instant.cloud_area_fraction,
        dewPoint: instant.dew_point_temperature,
        description: next1h?.summary?.symbol_code || next6h?.summary?.symbol_code || 'unknown',
        icon: next1h?.summary?.symbol_code || next6h?.summary?.symbol_code || 'unknown'
      };
    } else {
      // Fallback for other formats
      currentData = openEpiResponse.current || openEpiResponse;
    }
    
    return {
      location: {
        lat: location.lat,
        lon: location.lon,
        name: openEpiResponse.location?.name || 'Unknown',
        country: openEpiResponse.location?.country || 'Unknown'
      },
      current: {
        temperature: currentData.temperature || currentData.temp || currentData.air_temperature,
        feelsLike: currentData.feelsLike || currentData.feels_like || currentData.apparent_temperature,
        humidity: currentData.humidity || currentData.relative_humidity,
        pressure: currentData.pressure || currentData.surface_pressure || currentData.air_pressure_at_sea_level,
        visibility: currentData.visibility,
        windSpeed: currentData.windSpeed || currentData.wind_speed,
        windDirection: currentData.windDirection || currentData.wind_direction || currentData.wind_from_direction,
        cloudiness: currentData.cloudiness || currentData.cloud_cover || currentData.cloud_area_fraction,
        description: currentData.description || currentData.weather_description || 'partly cloudy',
        icon: currentData.icon || currentData.weather_icon || 'partly-cloudy-day',
        uvIndex: currentData.uvIndex || currentData.uv_index,
        dewPoint: currentData.dewPoint || currentData.dew_point || currentData.dew_point_temperature,
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
    let forecast = [];
    
    if (openEpiResponse.properties?.timeseries) {
      // OpenEPI weather forecast format - group by days
      const dailyData = {};
      
      openEpiResponse.properties.timeseries.forEach(entry => {
        const date = new Date(entry.time).toDateString();
        const details = entry.data.instant.details;
        const next6h = entry.data.next_6_hours;
        
        if (!dailyData[date]) {
          dailyData[date] = {
            date: entry.time,
            temperatures: [],
            humidity: details.relative_humidity,
            pressure: details.air_pressure_at_sea_level,
            windSpeed: details.wind_speed,
            windDirection: details.wind_from_direction,
            cloudiness: details.cloud_area_fraction,
            precipitation: next6h?.details?.precipitation_amount || 0,
            description: next6h?.summary?.symbol_code || 'unknown',
            icon: next6h?.summary?.symbol_code || 'unknown'
          };
        }
        
        dailyData[date].temperatures.push(details.air_temperature);
      });
      
      // Convert to forecast format
      forecast = Object.values(dailyData).slice(0, 7).map(day => ({
        date: day.date,
        temperature: {
          min: Math.min(...day.temperatures),
          max: Math.max(...day.temperatures),
          avg: day.temperatures.reduce((a, b) => a + b, 0) / day.temperatures.length
        },
        humidity: day.humidity,
        pressure: day.pressure,
        windSpeed: day.windSpeed,
        windDirection: day.windDirection,
        cloudiness: day.cloudiness,
        precipitation: day.precipitation,
        precipitationProbability: day.precipitation > 0 ? 80 : 20,
        description: day.description,
        icon: day.icon
      }));
    } else {
      // Fallback for other formats
      forecast = openEpiResponse.forecast || openEpiResponse.daily || [];
    }
    
    return {
      location: {
        lat: location.lat,
        lon: location.lon,
        name: openEpiResponse.location?.name || 'Unknown',
        country: openEpiResponse.location?.country || 'Unknown'
      },
      forecast: forecast,
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