/**
 * Soil API Service for AgriSphere
 * Provides soil data crucial for crop management and farming decisions
 * Includes soil composition, pH, nutrients, and health indicators
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');

class SoilApiService {
  constructor() {
    this.baseURL = process.env.SOIL_API_URL || 'https://api.soilapi.org/v1';
    this.apiKey = process.env.SOIL_API_KEY;
    this.retryAttempts = 3;
    this.retryDelay = 2000;
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 20000, // 20 seconds for soil data requests
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
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
      
      logger.warn(`Soil API request failed (attempt ${attempt}/${this.retryAttempts}). Retrying...`, {
        error: error.message,
        attempt
      });
      
      const delay = this.retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.retryRequest(requestFn, attempt + 1);
    }
  }

  /**
   * Get soil composition and properties for a location
   */
  async getSoilProperties(lat, lon, depth = 30) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      // Mock soil data for demonstration (replace with actual API call)
      const mockSoilData = this.generateMockSoilData(lat, lon, depth);
      
      logger.info('Soil properties data retrieved successfully', { lat, lon, depth });
      return mockSoilData;

    } catch (error) {
      logger.error('Failed to get soil properties', { lat, lon, error: error.message });
      throw new ApiError('Soil properties service temporarily unavailable', 503);
    }
  }

  /**
   * Get soil nutrient analysis
   */
  async getSoilNutrients(lat, lon) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      // Mock nutrient data (replace with actual API call)
      const nutrientData = {
        location: { lat, lon },
        nutrients: {
          nitrogen: {
            value: Math.random() * 100 + 20, // mg/kg
            status: this.getNutrientStatus(Math.random() * 100 + 20, 'nitrogen'),
            recommendations: []
          },
          phosphorus: {
            value: Math.random() * 50 + 10, // mg/kg
            status: this.getNutrientStatus(Math.random() * 50 + 10, 'phosphorus'),
            recommendations: []
          },
          potassium: {
            value: Math.random() * 200 + 50, // mg/kg
            status: this.getNutrientStatus(Math.random() * 200 + 50, 'potassium'),
            recommendations: []
          },
          calcium: {
            value: Math.random() * 1000 + 200, // mg/kg
            status: this.getNutrientStatus(Math.random() * 1000 + 200, 'calcium'),
            recommendations: []
          },
          magnesium: {
            value: Math.random() * 300 + 50, // mg/kg
            status: this.getNutrientStatus(Math.random() * 300 + 50, 'magnesium'),
            recommendations: []
          },
          sulfur: {
            value: Math.random() * 20 + 5, // mg/kg
            status: this.getNutrientStatus(Math.random() * 20 + 5, 'sulfur'),
            recommendations: []
          }
        },
        micronutrients: {
          iron: Math.random() * 10 + 2,
          manganese: Math.random() * 5 + 1,
          zinc: Math.random() * 3 + 0.5,
          copper: Math.random() * 2 + 0.3,
          boron: Math.random() * 1 + 0.2
        },
        recommendations: [
          'Regular soil testing recommended every 2-3 years',
          'Consider organic matter addition to improve soil structure',
          'Monitor pH levels for optimal nutrient availability'
        ],
        timestamp: new Date().toISOString(),
        source: 'SoilAPI'
      };

      // Add specific recommendations based on nutrient levels
      Object.keys(nutrientData.nutrients).forEach(nutrient => {
        const data = nutrientData.nutrients[nutrient];
        if (data.status === 'low') {
          data.recommendations.push(`Apply ${nutrient} fertilizer to address deficiency`);
        } else if (data.status === 'high') {
          data.recommendations.push(`Reduce ${nutrient} application to prevent toxicity`);
        }
      });

      logger.info('Soil nutrients data retrieved successfully', { lat, lon });
      return nutrientData;

    } catch (error) {
      logger.error('Failed to get soil nutrients', { lat, lon, error: error.message });
      throw new ApiError('Soil nutrients service temporarily unavailable', 503);
    }
  }

  /**
   * Get soil health indicators and recommendations
   */
  async getSoilHealth(lat, lon) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      const healthData = {
        location: { lat, lon },
        healthScore: Math.floor(Math.random() * 40) + 60, // Score 60-100
        indicators: {
          organicMatter: {
            percentage: (Math.random() * 3 + 1).toFixed(2),
            status: Math.random() > 0.5 ? 'good' : 'needs_improvement',
            impact: 'Improves water retention and nutrient availability'
          },
          soilStructure: {
            rating: Math.random() > 0.3 ? 'good' : 'poor',
            porosity: (Math.random() * 20 + 30).toFixed(1) + '%',
            impact: 'Affects root penetration and water infiltration'
          },
          biologicalActivity: {
            microbialBiomass: Math.floor(Math.random() * 200) + 100, // μg C/g soil
            earthwormCount: Math.floor(Math.random() * 15) + 5, // per m²
            status: Math.random() > 0.4 ? 'active' : 'low',
            impact: 'Essential for nutrient cycling and soil fertility'
          },
          waterHoldingCapacity: {
            capacity: (Math.random() * 0.3 + 0.2).toFixed(2), // cm³/cm³
            rating: Math.random() > 0.3 ? 'adequate' : 'low',
            impact: 'Critical for drought resilience and irrigation efficiency'
          }
        },
        risks: [],
        recommendations: [
          'Maintain ground cover to prevent erosion',
          'Add organic matter through compost or crop residues',
          'Practice crop rotation to improve soil biodiversity',
          'Minimize tillage to preserve soil structure'
        ],
        timestamp: new Date().toISOString(),
        source: 'SoilAPI'
      };

      // Add risk assessments
      if (healthData.indicators.organicMatter.percentage < 2) {
        healthData.risks.push({
          type: 'low_organic_matter',
          severity: 'moderate',
          description: 'Low organic matter may reduce soil fertility and water retention'
        });
      }

      if (healthData.indicators.biologicalActivity.status === 'low') {
        healthData.risks.push({
          type: 'poor_biological_activity',
          severity: 'moderate',
          description: 'Low biological activity may indicate soil health issues'
        });
      }

      logger.info('Soil health data retrieved successfully', { lat, lon });
      return healthData;

    } catch (error) {
      logger.error('Failed to get soil health', { lat, lon, error: error.message });
      throw new ApiError('Soil health service temporarily unavailable', 503);
    }
  }

  /**
   * Generate mock soil data (replace with actual API integration)
   */
  generateMockSoilData(lat, lon, depth) {
    const soilTypes = ['Loam', 'Clay', 'Sandy', 'Silty', 'Clay Loam', 'Sandy Loam'];
    const selectedType = soilTypes[Math.floor(Math.random() * soilTypes.length)];

    return {
      location: { lat, lon },
      depth: depth,
      soilType: selectedType,
      properties: {
        pH: (Math.random() * 4 + 5).toFixed(1), // pH 5.0-9.0
        electricalConductivity: (Math.random() * 2).toFixed(2), // dS/m
        organicCarbon: (Math.random() * 2 + 0.5).toFixed(2), // %
        cationExchangeCapacity: Math.floor(Math.random() * 30) + 10, // cmol/kg
        bulkDensity: (Math.random() * 0.5 + 1.2).toFixed(2), // g/cm³
        moisture: (Math.random() * 30 + 10).toFixed(1) // %
      },
      texture: {
        sand: Math.floor(Math.random() * 60) + 20, // %
        silt: Math.floor(Math.random() * 40) + 10, // %
        clay: Math.floor(Math.random() * 30) + 10  // %
      },
      drainage: Math.random() > 0.5 ? 'well-drained' : 'moderately-drained',
      erosionRisk: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'moderate' : 'low',
      recommendations: [
        'Monitor soil moisture regularly',
        'Test soil pH annually',
        'Consider lime application if pH is below 6.0'
      ],
      timestamp: new Date().toISOString(),
      source: 'SoilAPI'
    };
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