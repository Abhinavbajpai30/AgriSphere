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
    this.baseURL = process.env.OPENEPI_BASE_URL || 'https://api.openepi.org/v1';
    this.apiKey = process.env.OPENEPI_API_KEY;
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
        'Authorization': `Bearer ${this.apiKey}`,
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
    return this.makeRequest('/weather/current', {
      lat: latitude,
      lon: longitude,
      units: 'metric'
    }, options);
  }

  async getWeatherForecast(latitude, longitude, days = 7, options = {}) {
    return this.makeRequest('/weather/forecast', {
      lat: latitude,
      lon: longitude,
      days,
      units: 'metric'
    }, options);
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
    return this.makeRequest('/geocoding/forward', {
      q: address,
      limit: 5
    }, options);
  }

  async reverseGeocode(latitude, longitude, options = {}) {
    return this.makeRequest('/geocoding/reverse', {
      lat: latitude,
      lon: longitude
    }, options);
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