/**
 * Weather API Service for AgriSphere
 * Provides weather data critical for farming decisions
 * Includes retry logic for unreliable internet connections
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');

class WeatherApiService {
  constructor() {
    this.baseURL = process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5';
    this.apiKey = process.env.WEATHER_API_KEY;
    this.retryAttempts = 3;
    this.retryDelay = 2000; // 2 seconds
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000, // 15 seconds timeout for slow connections
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Add request interceptor for API key
    this.client.interceptors.request.use((config) => {
      config.params = {
        ...config.params,
        appid: this.apiKey,
        units: 'metric' // Use Celsius for temperature
      };
      return config;
    });
  }

  /**
   * Retry mechanism for failed requests
   */
  async retryRequest(requestFn, attempt = 1) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt >= this.retryAttempts) {
        throw error;
      }
      
      logger.warn(`Weather API request failed (attempt ${attempt}/${this.retryAttempts}). Retrying...`, {
        error: error.message,
        attempt
      });
      
      // Exponential backoff
      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.retryRequest(requestFn, attempt + 1);
    }
  }

  /**
   * Get current weather conditions for a location
   */
  async getCurrentWeather(lat, lon) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      const requestFn = () => this.client.get('/weather', {
        params: { lat, lon }
      });

      const response = await this.retryRequest(requestFn);
      
      const weatherData = {
        location: {
          lat: response.data.coord.lat,
          lon: response.data.coord.lon,
          name: response.data.name,
          country: response.data.sys.country
        },
        current: {
          temperature: response.data.main.temp,
          feelsLike: response.data.main.feels_like,
          humidity: response.data.main.humidity,
          pressure: response.data.main.pressure,
          visibility: response.data.visibility,
          windSpeed: response.data.wind.speed,
          windDirection: response.data.wind.deg,
          cloudiness: response.data.clouds.all,
          description: response.data.weather[0].description,
          icon: response.data.weather[0].icon
        },
        timestamp: new Date().toISOString(),
        source: 'OpenWeatherMap'
      };

      logger.info('Current weather data retrieved successfully', { lat, lon });
      return weatherData;

    } catch (error) {
      logger.error('Failed to get current weather', { lat, lon, error: error.message });
      
      if (error.response?.status === 401) {
        throw new ApiError('Invalid weather API key', 401);
      } else if (error.response?.status === 404) {
        throw new ApiError('Location not found', 404);
      }
      
      throw new ApiError('Weather service temporarily unavailable', 503);
    }
  }

  /**
   * Get 5-day weather forecast for farming planning
   */
  async getWeatherForecast(lat, lon) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      const requestFn = () => this.client.get('/forecast', {
        params: { lat, lon }
      });

      const response = await this.retryRequest(requestFn);
      
      const forecastData = {
        location: {
          lat: response.data.city.coord.lat,
          lon: response.data.city.coord.lon,
          name: response.data.city.name,
          country: response.data.city.country
        },
        forecast: response.data.list.map(item => ({
          datetime: item.dt_txt,
          temperature: {
            current: item.main.temp,
            min: item.main.temp_min,
            max: item.main.temp_max,
            feelsLike: item.main.feels_like
          },
          humidity: item.main.humidity,
          pressure: item.main.pressure,
          windSpeed: item.wind.speed,
          windDirection: item.wind.deg,
          cloudiness: item.clouds.all,
          precipitation: item.rain ? item.rain['3h'] || 0 : 0,
          description: item.weather[0].description,
          icon: item.weather[0].icon
        })),
        timestamp: new Date().toISOString(),
        source: 'OpenWeatherMap'
      };

      logger.info('Weather forecast data retrieved successfully', { lat, lon });
      return forecastData;

    } catch (error) {
      logger.error('Failed to get weather forecast', { lat, lon, error: error.message });
      
      if (error.response?.status === 401) {
        throw new ApiError('Invalid weather API key', 401);
      } else if (error.response?.status === 404) {
        throw new ApiError('Location not found', 404);
      }
      
      throw new ApiError('Weather forecast service temporarily unavailable', 503);
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
}

module.exports = new WeatherApiService();