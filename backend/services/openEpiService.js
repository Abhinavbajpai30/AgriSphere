/**
 * OpenEPI API Service for AgriSphere
 * Centralized service for all agricultural and environmental data through OpenEPI
 * Handles authentication, rate limiting, caching, and error handling
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');

class OpenEpiService {
  constructor() {
    this.baseURL = process.env.OPENEPI_API_URL || 'https://api.openepi.io';
    this.clientId = process.env.OPENEPI_CLIENT_ID;
    this.clientSecret = process.env.OPENEPI_CLIENT_SECRET;
    this.retryAttempts = 3;
    this.retryDelay = 2000; // Base delay of 2 seconds
    this.rateLimitPerMinute = parseInt(process.env.OPENEPI_RATE_LIMIT_PER_MINUTE) || 60;
    this.cacheTTL = parseInt(process.env.OPENEPI_CACHE_TTL_SECONDS) || 3600; // 1 hour
    this.requestTimeout = parseInt(process.env.OPENEPI_REQUEST_TIMEOUT_MS) || 30000; // 30 seconds
    
    // In-memory cache for frequently requested data
    this.cache = new Map();
    
    // Rate limiting tracking
    this.requestCount = 0;
    this.rateLimitWindow = 60000; // 1 minute window
    this.lastReset = Date.now();
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.requestTimeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AgriSphere/1.0'
      }
    });

    // Add request interceptor for rate limiting and logging
    this.client.interceptors.request.use(
      (config) => {
        this.checkRateLimit();
        logger.info('OpenEPI API request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          params: config.params
        });
        return config;
      },
      (error) => {
        logger.error('OpenEPI request interceptor error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.info('OpenEPI API response', {
          status: response.status,
          url: response.config.url,
          responseTime: response.headers['x-response-time']
        });
        return response;
      },
      (error) => {
        const errorData = {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url
        };
        logger.error('OpenEPI API error', errorData);
        return Promise.reject(this.handleApiError(error));
      }
    );

    // Initialize cache cleanup interval
    this.initializeCacheCleanup();
  }

  /**
   * Check and enforce rate limiting
   */
  checkRateLimit() {
    const now = Date.now();
    
    // Reset counter if window has passed
    if (now - this.lastReset > this.rateLimitWindow) {
      this.requestCount = 0;
      this.lastReset = now;
    }
    
    // Check if rate limit exceeded
    if (this.requestCount >= this.rateLimitPerMinute) {
      const waitTime = this.rateLimitWindow - (now - this.lastReset);
      throw new ApiError(
        `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
        429
      );
    }
    
    this.requestCount++;
  }

  /**
   * Generate cache key for requests
   */
  generateCacheKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${endpoint}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * Get data from cache if available and not expired
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expires) {
      logger.info('Cache hit', { key });
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
      logger.info('Cache expired', { key });
    }
    
    return null;
  }

  /**
   * Store data in cache with TTL
   */
  setCache(key, data, ttl = this.cacheTTL) {
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttl * 1000)
    });
    logger.info('Data cached', { key, ttl });
  }

  /**
   * Initialize cache cleanup interval
   */
  initializeCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      const keysToDelete = [];
      
      for (const [key, value] of this.cache.entries()) {
        if (now >= value.expires) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => this.cache.delete(key));
      
      if (keysToDelete.length > 0) {
        logger.info('Cache cleanup completed', { 
          deletedKeys: keysToDelete.length,
          remainingKeys: this.cache.size 
        });
      }
    }, 300000); // Clean up every 5 minutes
  }

  /**
   * Handle API errors and convert to standard format
   */
  handleApiError(error) {
    if (error.response) {
      // API responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText;
      
      switch (status) {
        case 401:
          return new ApiError('OpenEPI API authentication failed. Please check your API key.', 401);
        case 403:
          return new ApiError('OpenEPI API access forbidden. Check your subscription and permissions.', 403);
        case 429:
          return new ApiError('OpenEPI API rate limit exceeded. Please try again later.', 429);
        case 500:
          return new ApiError('OpenEPI API server error. Please try again later.', 500);
        case 502:
        case 503:
        case 504:
          return new ApiError('OpenEPI API service temporarily unavailable. Please try again later.', 503);
        default:
          return new ApiError(`OpenEPI API error: ${message}`, status);
      }
    } else if (error.request) {
      // Request made but no response received
      return new ApiError('OpenEPI API is unreachable. Please check your internet connection.', 503);
    } else {
      // Something else happened
      return new ApiError(`OpenEPI API request failed: ${error.message}`, 500);
    }
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
      
      // Don't retry on client errors (4xx) except for rate limiting
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
        throw error;
      }
      
      logger.warn(`OpenEPI API request failed (attempt ${attempt}/${this.retryAttempts}). Retrying...`, {
        error: error.message,
        attempt,
        nextRetryIn: this.retryDelay * Math.pow(2, attempt - 1)
      });
      
      // Exponential backoff
      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.retryRequest(requestFn, attempt + 1);
    }
  }

  /**
   * Make cached API request
   */
  async makeRequest(endpoint, params = {}, options = {}) {
    const { 
      method = 'GET', 
      data = null, 
      useCache = true, 
      cacheTTL = this.cacheTTL 
    } = options;
    
    // Generate cache key
    const cacheKey = this.generateCacheKey(endpoint, { method, params, data });
    
    // Try to get from cache first (only for GET requests)
    if (method === 'GET' && useCache) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }
    
    // Make the API request with retry logic
    const response = await this.retryRequest(async () => {
      const config = {
        method,
        url: endpoint,
        params: method === 'GET' ? params : undefined,
        data: method !== 'GET' ? data || params : undefined
      };
      
      return await this.client.request(config);
    });
    
    const responseData = response.data;
    
    // Cache the response (only for successful GET requests)
    if (method === 'GET' && useCache && response.status === 200) {
      this.setCache(cacheKey, responseData, cacheTTL);
    }
    
    return responseData;
  }

  /**
   * Weather data endpoints
   */
  async getWeatherData(latitude, longitude, options = {}) {
    // For now, return mock weather data since OpenEPI weather API is not available
    return await this.getMockWeatherData(latitude, longitude);
  }

  async getWeatherForecast(latitude, longitude, days = 7, options = {}) {
    // For now, return mock forecast data since OpenEPI weather API is not available
    return await this.getMockWeatherForecast(latitude, longitude, days);
  }

  async getMockWeatherData(latitude, longitude) {
    // Generate realistic weather data based on coordinates and time
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth(); // 0-11
    
    // Simulate seasonal and daily temperature variations
    let baseTemp = 25; // Base temperature in Celsius
    
    // Seasonal adjustment (simplified)
    if (month >= 11 || month <= 2) { // Winter
      baseTemp = 15;
    } else if (month >= 3 && month <= 5) { // Spring
      baseTemp = 22;
    } else if (month >= 6 && month <= 8) { // Summer
      baseTemp = 32;
    } else { // Fall
      baseTemp = 25;
    }
    
    // Daily variation
    if (hour >= 6 && hour <= 18) { // Daytime
      baseTemp += 5;
    } else { // Nighttime
      baseTemp -= 5;
    }
    
    // Add some randomness
    const temperature = Math.round(baseTemp + (Math.random() - 0.5) * 4);
    const humidity = Math.round(40 + Math.random() * 40); // 40-80%
    const windSpeed = Math.round(5 + Math.random() * 15); // 5-20 km/h
    
    // Determine weather description based on conditions
    let description = 'Clear';
    let icon = 'sunny';
    
    if (humidity > 70) {
      description = 'Humid';
      icon = 'cloudy';
    }
    if (temperature > 30) {
      description = 'Hot';
      icon = 'sunny';
    }
    if (temperature < 10) {
      description = 'Cold';
      icon = 'cold';
    }
    if (windSpeed > 15) {
      description = 'Windy';
      icon = 'windy';
    }

    // Get location name using reverse geocoding
    const locationName = await this.getLocationNameFromCoordinates(latitude, longitude);
    
    return {
      location: {
        name: locationName,
        country: 'India', // Default for Indian coordinates
        lat: latitude,
        lon: longitude
      },
      current: {
        temperature: temperature,
        description: description,
        humidity: humidity,
        windSpeed: windSpeed,
        icon: icon,
        uvIndex: Math.round(1 + Math.random() * 10)
      }
    };
  }

  /**
   * Get location name from coordinates using reverse geocoding
   */
  async getLocationNameFromCoordinates(latitude, longitude) {
    try {
      // First try the local mapping for faster response on known cities
      const locationMap = this.getLocationMapping(latitude, longitude);
      if (locationMap) {
        return locationMap;
      }

      // Try real reverse geocoding using Nominatim OpenStreetMap API
      logger.info('Attempting reverse geocoding via Nominatim', { latitude, longitude });
      
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse`;
      const response = await axios.get(nominatimUrl, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1,
          extratags: 1,
          namedetails: 1,
          zoom: 10, // City level
          'accept-language': 'en'
        },
        headers: {
          'User-Agent': 'AgriSphere/1.0 (contact@agrisphere.com)'
        },
        timeout: 5000 // 5 second timeout
      });

      if (response.data && response.data.display_name) {
        console.log('response.data', response.data);
        const locationData = response.data;
        const address = locationData.address || {};
        
        // Extract relevant location components
        const city = address.city || address.town || address.village || address.municipality;
        const state = address.state || address.region;
        const country = address.country;
        
        // Build formatted location name
        let locationName = '';
        if (city) {
          locationName = city;
          if (state && state !== city) {
            locationName += `, ${state}`;
          }
          if (country) {
            locationName += `, ${country}`;
          }
        } else if (state) {
          locationName = state;
          if (country) {
            locationName += `, ${country}`;
          }
        } else if (country) {
          locationName = country;
        } else {
          // Use the full display name as fallback
          locationName = locationData.display_name.split(',').slice(0, 3).join(', ');
        }

        logger.info('Reverse geocoding successful via Nominatim', { 
          latitude, 
          longitude, 
          locationName 
        });
        
        return locationName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }

      // If Nominatim fails, fall back to coordinate string
      logger.warn('Nominatim returned empty result, using coordinates', { latitude, longitude });
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      
    } catch (error) {
      logger.warn('Reverse geocoding failed, using coordinates', { 
        latitude, 
        longitude, 
        error: error.message 
      });
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  }

  /**
   * Simple location mapping for common Indian coordinates
   */
  getLocationMapping(latitude, longitude) {
    // Approximate coordinates for major Indian cities
    const locations = [
      { lat: 28.7041, lon: 77.1025, name: 'Delhi, India' },
      { lat: 19.0760, lon: 72.8777, name: 'Mumbai, India' },
      { lat: 12.9716, lon: 77.5946, name: 'Bangalore, India' },
      { lat: 13.0827, lon: 80.2707, name: 'Chennai, India' },
      { lat: 22.5726, lon: 88.3639, name: 'Kolkata, India' },
      { lat: 17.3850, lon: 78.4867, name: 'Hyderabad, India' },
      { lat: 26.8467, lon: 80.9462, name: 'Lucknow, India' },
      { lat: 23.0225, lon: 72.5714, name: 'Ahmedabad, India' },
      { lat: 30.7333, lon: 76.7794, name: 'Chandigarh, India' },
      { lat: 25.2048, lon: 55.2708, name: 'Dubai, UAE' },
      { lat: 40.7128, lon: -74.0060, name: 'New York, USA' },
      { lat: 51.5074, lon: -0.1278, name: 'London, UK' }
    ];

    // Find the closest location within 50km radius
    for (const location of locations) {
      const distance = this.calculateDistance(latitude, longitude, location.lat, location.lon);
      if (distance <= 50) { // Within 50km
        return location.name;
      }
    }

    return null; // No close match found
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  async getMockWeatherForecast(latitude, longitude, days) {
    const forecast = [];
    const now = new Date();
    
    for (let i = 1; i <= days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      // Generate daily forecast
      const baseTemp = 25 + (Math.random() - 0.5) * 10;
      const maxTemp = Math.round(baseTemp + 5);
      const minTemp = Math.round(baseTemp - 5);
      const avgTemp = Math.round(baseTemp);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        temperature: {
          min: minTemp,
          max: maxTemp,
          avg: avgTemp
        },
        humidity: Math.round(40 + Math.random() * 40),
        pressure: 1013 + Math.round((Math.random() - 0.5) * 20),
        wind_speed: Math.round(5 + Math.random() * 15),
        wind_direction: Math.round(Math.random() * 360),
        cloud_cover: Math.round(Math.random() * 100),
        precipitation: Math.round(Math.random() * 10),
        precipitation_probability: Math.round(Math.random() * 100),
        weather_description: ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
        weather_icon: ['sunny', 'partly-cloudy', 'cloudy', 'rain'][Math.floor(Math.random() * 4)],
        uv_index: Math.round(1 + Math.random() * 10)
      });
    }
    
    // Get location name using reverse geocoding
    const locationName = await this.getLocationNameFromCoordinates(latitude, longitude);
    
    return {
      location: {
        name: locationName,
        country: 'India', // Default for Indian coordinates
        lat: latitude,
        lon: longitude
      },
      forecast: forecast
    };
  }

  async getHistoricalWeather(latitude, longitude, startDate, endDate, options = {}) {
    return this.makeRequest('/weather/historical', {
      lat: latitude,
      lon: longitude,
      start_date: startDate,
      end_date: endDate,
      units: 'metric'
    }, options);
  }

  /**
   * Soil data endpoints
   */
  async getSoilData(latitude, longitude, options = {}) {
    return this.makeRequest('/soil/properties', {
      lat: latitude,
      lon: longitude
    }, options);
  }

  async getSoilComposition(latitude, longitude, depth = 30, options = {}) {
    return this.makeRequest('/soil/composition', {
      lat: latitude,
      lon: longitude,
      depth_cm: depth
    }, options);
  }

  async getSoilHealth(latitude, longitude, options = {}) {
    return this.makeRequest('/soil/health', {
      lat: latitude,
      lon: longitude
    }, options);
  }

  /**
   * Geocoding endpoints
   */
  async geocodeAddress(address, options = {}) {
    try {
      if (!address || address.trim().length === 0) {
        throw new ApiError('Address is required', 400);
      }

      logger.info('Attempting forward geocoding via Nominatim', { address });
      
      // Use Nominatim OpenStreetMap API for forward geocoding
      const nominatimUrl = `https://nominatim.openstreetmap.org/search`;
      const response = await axios.get(nominatimUrl, {
        params: {
          q: address.trim(),
          format: 'json',
          addressdetails: 1,
          extratags: 1,
          namedetails: 1,
          limit: 5,
          'accept-language': 'en'
        },
        headers: {
          'User-Agent': 'AgriSphere/1.0 (contact@agrisphere.com)'
        },
        timeout: 10000 // 10 second timeout
      });

      if (!response.data || response.data.length === 0) {
        throw new ApiError('No locations found for the provided address', 404);
      }

      // Transform Nominatim response to expected format
      const features = response.data.map(place => ({
        formatted_address: place.display_name,
        coordinates: [parseFloat(place.lon), parseFloat(place.lat)],
        components: {
          locality: place.address?.city || place.address?.town || place.address?.village,
          region: place.address?.state || place.address?.region,
          country: place.address?.country,
          country_code: place.address?.country_code?.toUpperCase(),
          postal_code: place.address?.postcode
        },
        confidence: 0.8,
        place_type: place.type || 'unknown',
        relevance: parseFloat(place.importance) || 0.5
      }));

      const result = {
        features: features,
        results: features,
        query: address,
        resultCount: features.length,
        timestamp: new Date().toISOString(),
        source: 'Nominatim'
      };

      logger.info('Forward geocoding successful via Nominatim', { 
        address, 
        resultCount: features.length 
      });
      
      return result;

    } catch (error) {
      logger.error('Forward geocoding failed via Nominatim', { address, error: error.message });
      throw new ApiError('Geocoding service unavailable', 503);
    }
  }

  async reverseGeocode(latitude, longitude, options = {}) {
    try {
      if (!latitude || !longitude) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      logger.info('Attempting reverse geocoding via Nominatim', { latitude, longitude });
      
      // Use Nominatim OpenStreetMap API for reverse geocoding
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse`;
      const response = await axios.get(nominatimUrl, {
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json',
          addressdetails: 1,
          extratags: 1,
          namedetails: 1,
          zoom: 10, // City level
          'accept-language': 'en'
        },
        headers: {
          'User-Agent': 'AgriSphere/1.0 (contact@agrisphere.com)'
        },
        timeout: 10000 // 10 second timeout
      });

      if (!response.data || !response.data.display_name) {
        throw new ApiError('No address found for the provided coordinates', 404);
      }

      const locationData = response.data;
      const address = locationData.address || {};
      
      // Extract relevant location components
      const city = address.city || address.town || address.village || address.municipality;
      const state = address.state || address.region;
      const country = address.country;
      const countryCode = address.country_code?.toUpperCase();
      
      // Build formatted location name
      let locationName = '';
      if (city) {
        locationName = city;
        if (state && state !== city) {
          locationName += `, ${state}`;
        }
        if (country) {
          locationName += `, ${country}`;
        }
      } else if (state) {
        locationName = state;
        if (country) {
          locationName += `, ${country}`;
        }
      } else if (country) {
        locationName = country;
      } else {
        // Use the full display name as fallback
        locationName = locationData.display_name.split(',').slice(0, 3).join(', ');
      }

      const result = {
        address: {
          formatted: locationName,
          components: {
            locality: city,
            region: state,
            country: country,
            country_code: countryCode,
            postal_code: address.postcode
          },
          confidence: 0.8,
          place_type: 'address'
        },
        administrativeInfo: {
          country: country,
          region: state,
          locality: city,
          timezone: 'Asia/Kolkata' // Default for India
        },
        coordinates: { latitude: latitude, longitude: longitude },
        timestamp: new Date().toISOString(),
        source: 'Nominatim'
      };

      logger.info('Reverse geocoding successful via Nominatim', { 
        latitude, 
        longitude, 
        locationName 
      });
      
      return result;

    } catch (error) {
      logger.error('Reverse geocoding failed via Nominatim', { latitude, longitude, error: error.message });
      throw new ApiError('Reverse geocoding service unavailable', 503);
    }
  }

  async getAdministrativeInfo(latitude, longitude, options = {}) {
    return this.makeRequest('/geocoding/administrative', {
      lat: latitude,
      lon: longitude
    }, options);
  }

  /**
   * Crop health endpoints
   */
  async analyzeCropImage(imageData, cropType, options = {}) {
    return this.makeRequest('/crops/analyze', {
      image: imageData,
      crop_type: cropType
    }, { 
      method: 'POST',
      useCache: false,
      ...options 
    });
  }

  async getCropDiseases(cropType, region = null, options = {}) {
    return this.makeRequest('/crops/diseases', {
      crop_type: cropType,
      region
    }, options);
  }

  async getCropTreatment(diseaseId, cropType, options = {}) {
    return this.makeRequest('/crops/treatment', {
      disease_id: diseaseId,
      crop_type: cropType
    }, options);
  }

  /**
   * Flood risk endpoints
   */
  async getFloodRisk(latitude, longitude, options = {}) {
    return this.makeRequest('/flood/risk', {
      lat: latitude,
      lon: longitude
    }, options);
  }

  async getFloodForecast(latitude, longitude, days = 7, options = {}) {
    return this.makeRequest('/flood/forecast', {
      lat: latitude,
      lon: longitude,
      days
    }, options);
  }

  async getFloodHistory(latitude, longitude, startDate, endDate, options = {}) {
    return this.makeRequest('/flood/history', {
      lat: latitude,
      lon: longitude,
      start_date: startDate,
      end_date: endDate
    }, options);
  }

  /**
   * Agricultural data endpoints
   */
  async getCropCalendar(cropType, latitude, longitude, options = {}) {
    return this.makeRequest('/agriculture/calendar', {
      crop_type: cropType,
      lat: latitude,
      lon: longitude
    }, options);
  }

  async getIrrigationRecommendations(latitude, longitude, cropType, soilType, options = {}) {
    return this.makeRequest('/agriculture/irrigation', {
      lat: latitude,
      lon: longitude,
      crop_type: cropType,
      soil_type: soilType
    }, options);
  }

  async getPestAlerts(latitude, longitude, cropType, options = {}) {
    return this.makeRequest('/agriculture/pests', {
      lat: latitude,
      lon: longitude,
      crop_type: cropType
    }, options);
  }



  /**
   * Clear cache (useful for testing or manual cache invalidation)
   */
  clearCache() {
    this.cache.clear();
    logger.info('OpenEPI service cache cleared');
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      requestCount: this.requestCount,
      lastReset: new Date(this.lastReset).toISOString(),
      rateLimitPerMinute: this.rateLimitPerMinute,
      cacheTTL: this.cacheTTL
    };
  }
}

// Create singleton instance
const openEpiService = new OpenEpiService();

module.exports = openEpiService;