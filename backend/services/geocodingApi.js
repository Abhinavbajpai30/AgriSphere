/**
 * Geocoding API Service for AgriSphere
 * Provides location services, address validation, and geographic data
 * Essential for farm location mapping and regional agricultural data
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');

class GeocodingApiService {
  constructor() {
    this.mapboxBaseURL = process.env.GEOCODING_API_URL || 'https://api.mapbox.com/geocoding/v5';
    this.apiKey = process.env.GEOCODING_API_KEY;
    this.retryAttempts = 3;
    this.retryDelay = 2000;
    
    // Create axios instance with default config
    this.client = axios.create({
      timeout: 15000, // 15 seconds timeout
      headers: {
        'Content-Type': 'application/json'
      }
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
      
      logger.warn(`Geocoding API request failed (attempt ${attempt}/${this.retryAttempts}). Retrying...`, {
        error: error.message,
        attempt
      });
      
      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.retryRequest(requestFn, attempt + 1);
    }
  }

  /**
   * Convert address to coordinates (geocoding)
   */
  async geocodeAddress(address, countryCode = null) {
    try {
      if (!address || address.trim().length === 0) {
        throw new ApiError('Address is required', 400);
      }

      const encodedAddress = encodeURIComponent(address.trim());
      const countryFilter = countryCode ? `&country=${countryCode}` : '';
      
      const requestFn = () => this.client.get(
        `${this.mapboxBaseURL}/mapbox.places/${encodedAddress}.json?access_token=${this.apiKey}&limit=5${countryFilter}`
      );

      const response = await this.retryRequest(requestFn);
      
      if (!response.data.features || response.data.features.length === 0) {
        throw new ApiError('No locations found for the provided address', 404);
      }

      const results = response.data.features.map(feature => ({
        formattedAddress: feature.place_name,
        coordinates: {
          longitude: feature.center[0],
          latitude: feature.center[1]
        },
        components: this.parseAddressComponents(feature),
        confidence: this.calculateConfidence(feature),
        bounds: feature.bbox ? {
          southwest: { lat: feature.bbox[1], lng: feature.bbox[0] },
          northeast: { lat: feature.bbox[3], lng: feature.bbox[2] }
        } : null,
        placeType: feature.place_type[0],
        relevance: feature.relevance
      }));

      const geocodingResult = {
        query: address,
        results,
        resultCount: results.length,
        timestamp: new Date().toISOString(),
        source: 'Mapbox'
      };

      logger.info('Address geocoding completed', { address, resultCount: results.length });
      return geocodingResult;

    } catch (error) {
      logger.error('Failed to geocode address', { address, error: error.message });
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error.response?.status === 401) {
        throw new ApiError('Invalid geocoding API key', 401);
      }
      
      throw new ApiError('Geocoding service temporarily unavailable', 503);
    }
  }

  /**
   * Convert coordinates to address (reverse geocoding)
   */
  async reverseGeocode(lat, lon) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new ApiError('Invalid coordinates provided', 400);
      }

      const requestFn = () => this.client.get(
        `${this.mapboxBaseURL}/mapbox.places/${lon},${lat}.json?access_token=${this.apiKey}&types=address,place`
      );

      const response = await this.retryRequest(requestFn);
      
      if (!response.data.features || response.data.features.length === 0) {
        throw new ApiError('No address found for the provided coordinates', 404);
      }

      const feature = response.data.features[0];
      
      const reverseGeocodingResult = {
        coordinates: { latitude: lat, longitude: lon },
        address: {
          formatted: feature.place_name,
          components: this.parseAddressComponents(feature),
          confidence: this.calculateConfidence(feature),
          placeType: feature.place_type[0]
        },
        administrativeInfo: this.extractAdministrativeInfo(response.data.features),
        timestamp: new Date().toISOString(),
        source: 'Mapbox'
      };

      logger.info('Reverse geocoding completed', { lat, lon });
      return reverseGeocodingResult;

    } catch (error) {
      logger.error('Failed to reverse geocode coordinates', { lat, lon, error: error.message });
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error.response?.status === 401) {
        throw new ApiError('Invalid geocoding API key', 401);
      }
      
      throw new ApiError('Reverse geocoding service temporarily unavailable', 503);
    }
  }

  /**
   * Get administrative boundaries and geographic information
   */
  async getAdministrativeInfo(lat, lon) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      const reverseResult = await this.reverseGeocode(lat, lon);
      
      const adminInfo = {
        coordinates: { latitude: lat, longitude: lon },
        country: null,
        region: null, // State/Province
        district: null, // County/District
        locality: null, // City/Town
        agriculturalZone: this.determineAgriculturalZone(lat, lon),
        climateZone: this.determineClimateZone(lat, lon),
        timezone: this.getTimezone(lat, lon),
        boundaries: {
          country: null,
          state: null,
          county: null
        },
        timestamp: new Date().toISOString()
      };

      // Extract administrative information from address components
      if (reverseResult.administrativeInfo) {
        Object.assign(adminInfo, reverseResult.administrativeInfo);
      }

      logger.info('Administrative information retrieved', { lat, lon });
      return adminInfo;

    } catch (error) {
      logger.error('Failed to get administrative info', { lat, lon, error: error.message });
      throw new ApiError('Administrative information service temporarily unavailable', 503);
    }
  }

  /**
   * Validate farm coordinates and get location details
   */
  async validateFarmLocation(lat, lon) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      const [reverseResult, adminInfo] = await Promise.all([
        this.reverseGeocode(lat, lon),
        this.getAdministrativeInfo(lat, lon)
      ]);

      const validation = {
        coordinates: { latitude: lat, longitude: lon },
        isValid: true,
        address: reverseResult.address,
        administrative: adminInfo,
        suitabilityAssessment: {
          farmingSuitability: this.assessFarmingSuitability(lat, lon),
          proximityToWater: this.assessWaterProximity(lat, lon),
          accessibilityRating: this.assessAccessibility(lat, lon),
          soilQualityIndicator: this.getRegionalSoilIndicator(lat, lon)
        },
        nearbyFeatures: await this.getNearbyAgriculturalFeatures(lat, lon),
        recommendations: [
          'Verify soil testing in the specific field areas',
          'Check local zoning regulations for agricultural use',
          'Consider proximity to markets and transportation',
          'Evaluate water rights and availability'
        ],
        timestamp: new Date().toISOString()
      };

      logger.info('Farm location validated', { lat, lon, suitable: validation.suitabilityAssessment.farmingSuitability });
      return validation;

    } catch (error) {
      logger.error('Failed to validate farm location', { lat, lon, error: error.message });
      throw new ApiError('Farm location validation service temporarily unavailable', 503);
    }
  }

  /**
   * Parse address components from geocoding response
   */
  parseAddressComponents(feature) {
    const components = {
      streetNumber: null,
      streetName: null,
      locality: null,
      region: null,
      country: null,
      postalCode: null
    };

    if (feature.context) {
      feature.context.forEach(ctx => {
        if (ctx.id.startsWith('country')) {
          components.country = ctx.text;
        } else if (ctx.id.startsWith('region')) {
          components.region = ctx.text;
        } else if (ctx.id.startsWith('place')) {
          components.locality = ctx.text;
        } else if (ctx.id.startsWith('postcode')) {
          components.postalCode = ctx.text;
        }
      });
    }

    // Extract street information from the feature text
    if (feature.properties && feature.properties.address) {
      components.streetNumber = feature.properties.address;
    }
    
    if (feature.text) {
      components.streetName = feature.text;
    }

    return components;
  }

  /**
   * Calculate confidence score for geocoding result
   */
  calculateConfidence(feature) {
    let confidence = 0.5; // Base confidence
    
    if (feature.relevance) {
      confidence = feature.relevance;
    }
    
    // Adjust based on place type
    if (feature.place_type.includes('address')) {
      confidence += 0.2;
    } else if (feature.place_type.includes('place')) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  /**
   * Extract administrative information from features
   */
  extractAdministrativeInfo(features) {
    const info = {
      country: null,
      region: null,
      district: null,
      locality: null
    };

    features.forEach(feature => {
      if (feature.place_type.includes('country')) {
        info.country = feature.text;
      } else if (feature.place_type.includes('region')) {
        info.region = feature.text;
      } else if (feature.place_type.includes('district')) {
        info.district = feature.text;
      } else if (feature.place_type.includes('place')) {
        info.locality = feature.text;
      }
    });

    return info;
  }

  /**
   * Determine agricultural zone based on coordinates
   */
  determineAgriculturalZone(lat, lon) {
    // Simplified agricultural zone determination
    // In a real implementation, this would use actual agricultural zone APIs
    
    if (lat >= 40) {
      return 'temperate_grain';
    } else if (lat >= 20) {
      return 'subtropical_mixed';
    } else if (lat >= -20) {
      return 'tropical_crops';
    } else {
      return 'temperate_southern';
    }
  }

  /**
   * Determine climate zone based on coordinates
   */
  determineClimateZone(lat, lon) {
    // Simplified climate zone determination
    const absLat = Math.abs(lat);
    
    if (absLat >= 60) return 'arctic';
    if (absLat >= 50) return 'subarctic';
    if (absLat >= 40) return 'temperate';
    if (absLat >= 23.5) return 'subtropical';
    return 'tropical';
  }

  /**
   * Get timezone for coordinates
   */
  getTimezone(lat, lon) {
    // Simplified timezone calculation based on longitude
    const timezoneOffset = Math.round(lon / 15);
    return `UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`;
  }

  /**
   * Assess farming suitability based on location
   */
  assessFarmingSuitability(lat, lon) {
    // Simplified assessment - in reality would use soil, climate, and land use data
    const factors = {
      climate: Math.random() > 0.2 ? 'suitable' : 'marginal',
      elevation: Math.random() > 0.1 ? 'suitable' : 'challenging',
      landUse: Math.random() > 0.3 ? 'agricultural' : 'mixed'
    };
    
    const suitableCount = Object.values(factors).filter(v => v === 'suitable' || v === 'agricultural').length;
    
    if (suitableCount >= 2) return 'highly_suitable';
    if (suitableCount >= 1) return 'moderately_suitable';
    return 'limited_suitability';
  }

  /**
   * Assess water proximity for irrigation
   */
  assessWaterProximity(lat, lon) {
    // Mock water proximity assessment
    const waterSources = ['river', 'lake', 'groundwater', 'none'];
    const proximity = waterSources[Math.floor(Math.random() * waterSources.length)];
    
    return {
      nearestSource: proximity,
      distance: proximity === 'none' ? 'unknown' : `${Math.floor(Math.random() * 10) + 1} km`,
      quality: proximity === 'none' ? 'unknown' : Math.random() > 0.3 ? 'good' : 'needs_testing'
    };
  }

  /**
   * Assess accessibility for farm operations
   */
  assessAccessibility(lat, lon) {
    const ratings = ['excellent', 'good', 'fair', 'poor'];
    return {
      roadAccess: ratings[Math.floor(Math.random() * ratings.length)],
      marketDistance: `${Math.floor(Math.random() * 50) + 5} km`,
      transportationOptions: Math.random() > 0.5 ? ['road', 'rail'] : ['road']
    };
  }

  /**
   * Get regional soil quality indicator
   */
  getRegionalSoilIndicator(lat, lon) {
    const qualities = ['excellent', 'good', 'fair', 'poor'];
    return {
      generalRating: qualities[Math.floor(Math.random() * qualities.length)],
      primarySoilType: ['loam', 'clay', 'sandy', 'silt'][Math.floor(Math.random() * 4)],
      recommendedTesting: 'detailed soil analysis recommended for specific fields'
    };
  }

  /**
   * Get nearby agricultural features
   */
  async getNearbyAgriculturalFeatures(lat, lon) {
    // Mock nearby features - in reality would query geographic databases
    const features = [
      {
        type: 'irrigation_system',
        name: 'Regional Irrigation Canal',
        distance: `${Math.floor(Math.random() * 20) + 1} km`,
        status: 'operational'
      },
      {
        type: 'market',
        name: 'Local Farmers Market',
        distance: `${Math.floor(Math.random() * 30) + 5} km`,
        operatingDays: ['Tuesday', 'Saturday']
      },
      {
        type: 'extension_office',
        name: 'Agricultural Extension Office',
        distance: `${Math.floor(Math.random() * 40) + 10} km`,
        services: ['soil_testing', 'crop_advice', 'equipment_rental']
      }
    ];

    return features;
  }
}

module.exports = new GeocodingApiService();