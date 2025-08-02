/**
 * Geocoding API Service for AgriSphere
 * Provides location services, address validation, and geographic data through OpenEPI
 * Refactored to use centralized OpenEPI service
 */

const openEpiService = require('./openEpiService');
const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');

class GeocodingApiService {
  constructor() {
    this.openEpi = openEpiService;
    
    // Geocoding cache duration (addresses don't change frequently)
    this.addressCacheTTL = 86400; // 24 hours
    this.reverseGeocodeCacheTTL = 43200; // 12 hours
    this.adminInfoCacheTTL = 604800; // 7 days
  }

  /**
   * Transform OpenEPI geocoding response to expected format
   */
  transformGeocodingResponse(openEpiResponse, query) {
    const features = openEpiResponse.features || openEpiResponse.results || [];
    
    const results = features.map(feature => ({
      formattedAddress: feature.formatted_address || feature.display_name || feature.address,
      coordinates: {
        longitude: feature.coordinates?.[0] || feature.lng || feature.lon,
        latitude: feature.coordinates?.[1] || feature.lat
      },
      components: this.parseOpenEpiComponents(feature),
      confidence: feature.confidence || feature.accuracy || 0.8,
      bounds: feature.bounds || feature.bbox ? this.transformBounds(feature.bounds || feature.bbox) : null,
      placeType: feature.type || feature.place_type || 'unknown',
      relevance: feature.relevance || feature.score || 1.0
    }));

    return {
      query,
      results,
      resultCount: results.length,
      timestamp: new Date().toISOString(),
      source: 'OpenEPI'
    };
  }

  /**
   * Transform OpenEPI reverse geocoding response
   */
  transformReverseGeocodingResponse(openEpiResponse, lat, lon) {
    const feature = openEpiResponse.address || openEpiResponse.result || openEpiResponse;
    
    return {
      coordinates: { latitude: lat, longitude: lon },
      address: {
        formatted: feature.formatted_address || feature.display_name || feature.address,
        components: this.parseOpenEpiComponents(feature),
        confidence: feature.confidence || feature.accuracy || 0.8,
        placeType: feature.type || feature.place_type || 'address'
      },
      administrativeInfo: this.extractOpenEpiAdministrativeInfo(feature),
      timestamp: new Date().toISOString(),
      source: 'OpenEPI'
    };
  }

  /**
   * Parse OpenEPI address components
   */
  parseOpenEpiComponents(feature) {
    const components = feature.components || feature.address_components || {};
    
    return {
      street: components.street || components.road || components.street_name || null,
      streetNumber: components.house_number || components.street_number || null,
      neighborhood: components.neighbourhood || components.neighborhood || null,
      locality: components.city || components.locality || components.town || components.village || null,
      region: components.state || components.region || components.province || null,
      country: components.country || components.country_name || null,
      countryCode: components.country_code || components.country_iso || null,
      postalCode: components.postcode || components.postal_code || components.zip || null
    };
  }

  /**
   * Transform bounds data
   */
  transformBounds(bounds) {
    if (Array.isArray(bounds) && bounds.length === 4) {
      // [west, south, east, north] format
      return {
        southwest: { lat: bounds[1], lng: bounds[0] },
        northeast: { lat: bounds[3], lng: bounds[2] }
      };
    }
    
    if (bounds.southwest && bounds.northeast) {
      return bounds;
    }
    
    return null;
  }

  /**
   * Extract administrative information from OpenEPI response
   */
  extractOpenEpiAdministrativeInfo(feature) {
    const components = feature.components || feature.administrative || {};
    
    return {
      country: components.country || null,
      countryCode: components.country_code || null,
      region: components.region || components.state || null,
      district: components.district || components.county || null,
      locality: components.locality || components.city || null,
      timezone: feature.timezone || null,
      elevation: feature.elevation || null
    };
  }

  /**
   * Convert address to coordinates (geocoding) using OpenEPI
   */
  async geocodeAddress(address, countryCode = null) {
    try {
      if (!address || address.trim().length === 0) {
        throw new ApiError('Address is required', 400);
      }

      const response = await this.openEpi.geocodeAddress(address.trim(), {
        cacheTTL: this.addressCacheTTL
      });
      
      if (!response || (!response.features && !response.results)) {
        throw new ApiError('No locations found for the provided address', 404);
      }

      const geocodingResult = this.transformGeocodingResponse(response, address);

      logger.info('Address geocoding completed via OpenEPI', { address, resultCount: geocodingResult.resultCount });
      return geocodingResult;

    } catch (error) {
      logger.error('Failed to geocode address via OpenEPI', { address, error: error.message });
      throw error; // Let OpenEPI service handle error transformation
    }
  }

  /**
   * Get coordinates for an address (alias for geocodeAddress)
   */
  async getCoordinates(address, countryCode = null) {
    const result = await this.geocodeAddress(address, countryCode);
    
    if (result.results && result.results.length > 0) {
      return result.results[0].coordinates;
    }
    
    throw new ApiError('No coordinates found for the provided address', 404);
  }

  /**
   * Convert coordinates to address (reverse geocoding) using OpenEPI
   */
  async reverseGeocode(lat, lon) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        throw new ApiError('Invalid coordinates provided', 400);
      }

      const response = await this.openEpi.reverseGeocode(lat, lon, {
        cacheTTL: this.reverseGeocodeCacheTTL
      });
      
      if (!response) {
        throw new ApiError('No address found for the provided coordinates', 404);
      }

      const reverseGeocodingResult = this.transformReverseGeocodingResponse(response, lat, lon);

      logger.info('Reverse geocoding completed via OpenEPI', { lat, lon });
      return reverseGeocodingResult;

    } catch (error) {
      logger.error('Failed to reverse geocode coordinates via OpenEPI', { lat, lon, error: error.message });
      throw error; // Let OpenEPI service handle error transformation
    }
  }

  /**
   * Get administrative information for coordinates using OpenEPI
   */
  async getAdministrativeInfo(lat, lon) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      const response = await this.openEpi.getAdministrativeInfo(lat, lon, {
        cacheTTL: this.adminInfoCacheTTL
      });

      const adminInfo = this.extractOpenEpiAdministrativeInfo(response);

      logger.info('Administrative information retrieved via OpenEPI', { lat, lon });
      return {
        coordinates: { latitude: lat, longitude: lon },
        ...adminInfo,
        timestamp: new Date().toISOString(),
        source: 'OpenEPI'
      };

    } catch (error) {
      logger.error('Failed to get administrative info via OpenEPI', { lat, lon, error: error.message });
      throw error;
      
      if (error.response?.status === 401) {
        throw new ApiError('Invalid geocoding API key', 401);
      }
      
      throw new ApiError('Reverse geocoding service temporarily unavailable', 503);
    }
  }

  /**
   * Get coordinates from address (forward geocoding)
   */
  async getCoordinates(address) {
    try {
      if (!address || address.trim().length === 0) {
        throw new ApiError('Address is required', 400);
      }

      const geocodingResult = await this.geocodeAddress(address);
      
      if (!geocodingResult.results || geocodingResult.results.length === 0) {
        throw new ApiError('No coordinates found for the provided address', 404);
      }

      // Return the coordinates of the best match
      const bestMatch = geocodingResult.results[0];
      return [bestMatch.coordinates.longitude, bestMatch.coordinates.latitude];

    } catch (error) {
      logger.error('Failed to get coordinates from address', { address, error: error.message });
      throw error;
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