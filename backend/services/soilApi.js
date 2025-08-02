/**
 * Soil API Service for AgriSphere
 * Provides soil data crucial for crop management and farming decisions through OpenEPI
 * Refactored to use centralized OpenEPI service
 */

const openEpiService = require('./openEpiService');
const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');

class SoilApiService {
  constructor() {
    this.openEpi = openEpiService;
    
    // Soil data cache duration (longer for soil data as it changes slowly)
    this.soilCacheTTL = 7200; // 2 hours
    this.soilCompositionCacheTTL = 86400; // 24 hours
    this.soilHealthCacheTTL = 3600; // 1 hour
  }

  /**
   * Transform OpenEPI soil response to expected format
   */
  transformSoilData(openEpiResponse) {
    return {
      soilType: openEpiResponse.soil_type || openEpiResponse.classification || 'unknown',
      ph: openEpiResponse.ph || openEpiResponse.pH || null,
      organicMatter: openEpiResponse.organic_matter || openEpiResponse.organicContent || null,
      nitrogen: openEpiResponse.nitrogen || openEpiResponse.N || null,
      phosphorus: openEpiResponse.phosphorus || openEpiResponse.P || null,
      potassium: openEpiResponse.potassium || openEpiResponse.K || null,
      moisture: openEpiResponse.moisture || openEpiResponse.water_content || null,
      temperature: openEpiResponse.temperature || openEpiResponse.soil_temp || null,
      salinity: openEpiResponse.salinity || openEpiResponse.ec || null,
      cationExchangeCapacity: openEpiResponse.cec || openEpiResponse.cation_exchange_capacity || null,
      bulkDensity: openEpiResponse.bulk_density || null,
      porosity: openEpiResponse.porosity || null,
      carbonContent: openEpiResponse.carbon || openEpiResponse.carbon_content || null,
      lastUpdated: new Date(),
      source: 'OpenEPI',
      dataQuality: openEpiResponse.quality || 'medium'
    };
  }

  /**
   * Transform soil composition data
   */
  transformCompositionData(openEpiResponse) {
    return {
      sand: openEpiResponse.sand || openEpiResponse.sand_percentage || null,
      clay: openEpiResponse.clay || openEpiResponse.clay_percentage || null,
      silt: openEpiResponse.silt || openEpiResponse.silt_percentage || null,
      gravel: openEpiResponse.gravel || openEpiResponse.gravel_content || null,
      textureClass: openEpiResponse.texture_class || openEpiResponse.texture || null,
      structure: openEpiResponse.structure || null,
      color: openEpiResponse.color || null,
      depth: openEpiResponse.depth || null,
      drainage: openEpiResponse.drainage || openEpiResponse.drainage_class || null,
      source: 'OpenEPI'
    };
  }

  /**
   * Transform soil health assessment data
   */
  transformHealthData(openEpiResponse) {
    return {
      healthScore: openEpiResponse.health_score || openEpiResponse.overall_score || null,
      biologicalActivity: openEpiResponse.biological_activity || null,
      microbialBiomass: openEpiResponse.microbial_biomass || null,
      enzymeActivity: openEpiResponse.enzyme_activity || null,
      erosionRisk: openEpiResponse.erosion_risk || null,
      compactionLevel: openEpiResponse.compaction || null,
      organicMatterTrend: openEpiResponse.om_trend || null,
      recommendations: openEpiResponse.recommendations || [],
      concerns: openEpiResponse.concerns || [],
      source: 'OpenEPI'
    };
  }

  /**
   * Get soil composition and properties for a location
   */
  async getSoilData(lat, lon, depth = 30) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      const response = await this.openEpi.getSoilData(lat, lon, {
        cacheTTL: this.soilCacheTTL
      });
      
      const soilData = this.transformSoilData(response);
      
      logger.info('Soil data retrieved successfully via OpenEPI', { lat, lon, depth });
      return {
        location: { lat, lon, depth },
        ...soilData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to get soil data from OpenEPI', { lat, lon, error: error.message });
      throw error; // Let OpenEPI service handle error transformation
    }
  }

  /**
   * Get detailed soil composition
   */
  async getSoilComposition(lat, lon, depth = 30) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      const response = await this.openEpi.getSoilComposition(lat, lon, depth, {
        cacheTTL: this.soilCompositionCacheTTL
      });
      
      const compositionData = this.transformCompositionData(response);
      
      logger.info('Soil composition data retrieved successfully via OpenEPI', { lat, lon, depth });
      return {
        location: { lat, lon, depth },
        composition: compositionData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to get soil composition from OpenEPI', { lat, lon, error: error.message });
      throw error;
    }
  }

  /**
   * Get soil health assessment
   */
  async getSoilHealth(lat, lon) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      const response = await this.openEpi.getSoilHealth(lat, lon, {
        cacheTTL: this.soilHealthCacheTTL
      });
      
      const healthData = this.transformHealthData(response);
      
      logger.info('Soil health data retrieved successfully via OpenEPI', { lat, lon });
      return {
        location: { lat, lon },
        health: healthData,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Failed to get soil health from OpenEPI', { lat, lon, error: error.message });
      throw error;
    }
  }

  /**
   * Get soil nutrient analysis using OpenEPI
   */
  async getSoilNutrients(lat, lon) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      // Get soil data from OpenEPI which includes nutrient information
      const response = await this.openEpi.getSoilData(lat, lon, {
        cacheTTL: this.soilCacheTTL
      });
      
      const transformedData = this.transformSoilData(response);
      
      const nutrientData = {
        location: { lat, lon },
        nutrients: {
          nitrogen: {
            value: transformedData.nitrogen,
            status: this.getNutrientStatus(transformedData.nitrogen, 'nitrogen'),
            recommendations: this.getNutrientRecommendations(transformedData.nitrogen, 'nitrogen')
          },
          phosphorus: {
            value: transformedData.phosphorus,
            status: this.getNutrientStatus(transformedData.phosphorus, 'phosphorus'),
            recommendations: this.getNutrientRecommendations(transformedData.phosphorus, 'phosphorus')
          },
          potassium: {
            value: transformedData.potassium,
            status: this.getNutrientStatus(transformedData.potassium, 'potassium'),
            recommendations: this.getNutrientRecommendations(transformedData.potassium, 'potassium')
          }
        },
        soilProperties: {
          ph: transformedData.ph,
          organicMatter: transformedData.organicMatter,
          cationExchangeCapacity: transformedData.cationExchangeCapacity,
          salinity: transformedData.salinity
        },
        generalRecommendations: this.generateSoilRecommendations(transformedData),
        timestamp: new Date().toISOString(),
        source: 'OpenEPI'
      };

      logger.info('Soil nutrients data retrieved successfully via OpenEPI', { lat, lon });
      return nutrientData;

    } catch (error) {
      logger.error('Failed to get soil nutrients from OpenEPI', { lat, lon, error: error.message });
      throw error;
    }
  }

  /**
   * Generate nutrient recommendations based on levels
   */
  getNutrientRecommendations(value, nutrient) {
    if (!value) return ['Data not available - consider soil testing'];
    
    const status = this.getNutrientStatus(value, nutrient);
    
    const recommendations = {
      nitrogen: {
        low: ['Apply nitrogen fertilizer', 'Consider legume cover crops', 'Add compost or manure'],
        high: ['Reduce nitrogen inputs', 'Plant nitrogen-consuming crops', 'Monitor for leaching'],
        optimal: ['Maintain current nitrogen management practices']
      },
      phosphorus: {
        low: ['Apply phosphorus fertilizer', 'Use bone meal or rock phosphate', 'Improve mycorrhizal associations'],
        high: ['Reduce phosphorus inputs', 'Monitor runoff to prevent water pollution', 'Test soil regularly'],
        optimal: ['Continue balanced phosphorus management']
      },
      potassium: {
        low: ['Apply potassium fertilizer', 'Use wood ash or greensand', 'Add compost'],
        high: ['Reduce potassium inputs', 'Monitor for salt buildup', 'Ensure adequate calcium and magnesium'],
        optimal: ['Maintain current potassium levels']
      }
    };
    
    return recommendations[nutrient]?.[status] || ['Consult agricultural specialist for specific recommendations'];
  }

  /**
   * Generate general soil recommendations based on all properties
   */
  generateSoilRecommendations(soilData) {
    const recommendations = [];
    
    if (soilData.ph < 6.0) {
      recommendations.push('Consider lime application to raise pH for better nutrient availability');
    } else if (soilData.ph > 8.0) {
      recommendations.push('Consider sulfur application to lower pH');
    }
    
    if (soilData.organicMatter < 2.0) {
      recommendations.push('Increase organic matter through compost, cover crops, or green manure');
    }
    
    if (soilData.salinity > 2.0) {
      recommendations.push('Address soil salinity through improved drainage or salt-tolerant crops');
    }
    
    if (soilData.cationExchangeCapacity < 10) {
      recommendations.push('Improve soil CEC through organic matter addition and clay amendments');
    }
    
    // General recommendations
    recommendations.push('Regular soil testing every 2-3 years');
    recommendations.push('Practice crop rotation to maintain soil health');
    recommendations.push('Minimize soil compaction through proper equipment use');
    
    return recommendations;
  }

  /**
   * Get soil suitability for specific crops
   */
  async getSoilSuitability(lat, lon, cropType) {
    try {
      if (!lat || !lon || !cropType) {
        throw new ApiError('Latitude, longitude, and crop type are required', 400);
      }

      const [soilData, soilHealth] = await Promise.all([
        this.getSoilData(lat, lon),
        this.getSoilHealth(lat, lon)
      ]);

      const suitability = this.assessCropSuitability(soilData, soilHealth, cropType);
      
      logger.info('Soil suitability assessment completed via OpenEPI', { lat, lon, cropType });
      return {
        location: { lat, lon },
        cropType,
        suitability,
        timestamp: new Date().toISOString(),
        source: 'OpenEPI'
      };

    } catch (error) {
      logger.error('Failed to assess soil suitability', { lat, lon, cropType, error: error.message });
      throw error;
    }
  }

  /**
   * Assess crop suitability based on soil conditions
   */
  assessCropSuitability(soilData, healthData, cropType) {
    const cropRequirements = {
      tomato: { phMin: 6.0, phMax: 7.0, drainageNeeded: 'good', organicMatter: 3.0 },
      corn: { phMin: 6.0, phMax: 6.8, drainageNeeded: 'good', organicMatter: 2.5 },
      wheat: { phMin: 6.0, phMax: 7.5, drainageNeeded: 'moderate', organicMatter: 2.0 },
      rice: { phMin: 5.5, phMax: 7.0, drainageNeeded: 'poor', organicMatter: 2.0 },
      potato: { phMin: 5.0, phMax: 6.5, drainageNeeded: 'good', organicMatter: 3.0 },
      default: { phMin: 6.0, phMax: 7.0, drainageNeeded: 'good', organicMatter: 2.5 }
    };

    const requirements = cropRequirements[cropType] || cropRequirements.default;
    const limitations = [];
    const recommendations = [];

    // pH assessment
    if (soilData.ph < requirements.phMin) {
      limitations.push('pH too low for optimal growth');
      recommendations.push('Apply lime to raise soil pH');
    } else if (soilData.ph > requirements.phMax) {
      limitations.push('pH too high for optimal growth');
      recommendations.push('Apply sulfur or organic matter to lower pH');
    }

    // Organic matter assessment
    if (soilData.organicMatter < requirements.organicMatter) {
      limitations.push('Low organic matter content');
      recommendations.push('Increase organic matter through compost or cover crops');
    }

    // Health score assessment
    if (healthData.health.healthScore < 70) {
      limitations.push('Poor soil health indicators');
      recommendations.push('Improve soil health through biological amendments');
    }

    const score = this.calculateSuitabilityScore(soilData, healthData, requirements);
    
    return {
      score,
      rating: this.getSuitabilityRating(score),
      limitations,
      recommendations,
      details: {
        ph: { current: soilData.ph, optimal: `${requirements.phMin}-${requirements.phMax}` },
        organicMatter: { current: soilData.organicMatter, optimal: `>${requirements.organicMatter}%` },
        healthScore: healthData.health.healthScore
      }
    };
  }

  calculateSuitabilityScore(soilData, healthData, requirements) {
    let score = 100;
    
    // pH scoring
    const phDiff = Math.min(
      Math.abs(soilData.ph - requirements.phMin),
      Math.abs(soilData.ph - requirements.phMax)
    );
    if (phDiff > 0.5) score -= Math.min(phDiff * 10, 30);
    
    // Organic matter scoring
    if (soilData.organicMatter < requirements.organicMatter) {
      score -= (requirements.organicMatter - soilData.organicMatter) * 10;
    }
    
    // Health score factor
    score = score * (healthData.health.healthScore / 100);
    
    return Math.max(0, Math.round(score));
  }

  getSuitabilityRating(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  /**
   * Get nutrient status based on value and type
   */
  getNutrientStatus(value, nutrient) {
    const thresholds = {
      nitrogen: { low: 30, high: 80 },
      phosphorus: { low: 15, high: 40 },
      potassium: { low: 100, high: 200 },
      calcium: { low: 500, high: 1500 },
      magnesium: { low: 100, high: 300 },
      sulfur: { low: 10, high: 20 }
    };

    const threshold = thresholds[nutrient];
    if (!threshold) return 'optimal';

    if (value < threshold.low) return 'low';
    if (value > threshold.high) return 'high';
    return 'optimal';
  }
}

module.exports = new SoilApiService();