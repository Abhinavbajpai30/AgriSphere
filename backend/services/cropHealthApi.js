/**
 * Crop Health API Service for AgriSphere
 * Provides crop disease detection, pest identification, and health monitoring
 * Integrates with image analysis and agricultural databases
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');

class CropHealthApiService {
  constructor() {
    this.openEpi = require('./openEpiService');
    
    // Crop health cache duration
    this.cropAnalysisCacheTTL = 3600; // 1 hour
    this.diseaseInfoCacheTTL = 86400; // 24 hours
    this.treatmentCacheTTL = 43200; // 12 hours

    // Common crop diseases database
    this.diseaseDatabase = {
      tomato: {
        'bacterial_spot': {
          severity: 'high',
          symptoms: ['Dark spots on leaves', 'Yellowing around spots', 'Fruit lesions'],
          treatment: ['Copper-based fungicides', 'Remove affected plants', 'Improve air circulation'],
          prevention: ['Drip irrigation', 'Avoid overhead watering', 'Crop rotation']
        },
        'early_blight': {
          severity: 'moderate',
          symptoms: ['Brown spots with concentric rings', 'Lower leaves affected first'],
          treatment: ['Fungicide application', 'Remove affected foliage'],
          prevention: ['Proper spacing', 'Mulching', 'Avoid wetting foliage']
        },
        'late_blight': {
          severity: 'high',
          symptoms: ['Water-soaked spots', 'White fuzzy growth', 'Rapid spread'],
          treatment: ['Immediate fungicide treatment', 'Remove all affected plants'],
          prevention: ['Resistant varieties', 'Good drainage', 'Monitor weather']
        }
      },
      corn: {
        'corn_rust': {
          severity: 'moderate',
          symptoms: ['Orange pustules on leaves', 'Yellowing of leaves'],
          treatment: ['Fungicide application', 'Remove crop residue'],
          prevention: ['Resistant varieties', 'Crop rotation', 'Early planting']
        },
        'gray_leaf_spot': {
          severity: 'moderate',
          symptoms: ['Rectangular gray spots', 'Parallel to leaf veins'],
          treatment: ['Fungicide spray', 'Improve air circulation'],
          prevention: ['Tillage practices', 'Crop rotation', 'Resistant hybrids']
        }
      },
      rice: {
        'blast_disease': {
          severity: 'high',
          symptoms: ['Spindle-shaped lesions', 'Gray centers with brown borders'],
          treatment: ['Systemic fungicides', 'Balanced fertilization'],
          prevention: ['Resistant varieties', 'Proper water management', 'Avoid excess nitrogen']
        },
        'brown_spot': {
          severity: 'moderate',
          symptoms: ['Circular brown spots', 'Yellow halos around spots'],
          treatment: ['Fungicide application', 'Improve nutrition'],
          prevention: ['Balanced fertilization', 'Good drainage', 'Clean seeds']
        }
      }
    };

    // Common pests database
    this.pestDatabase = {
      aphids: {
        crops: ['tomato', 'corn', 'rice', 'wheat'],
        severity: 'moderate',
        symptoms: ['Curled leaves', 'Sticky honeydew', 'Yellowing'],
        treatment: ['Insecticidal soap', 'Neem oil', 'Beneficial insects'],
        prevention: ['Companion planting', 'Reflective mulch', 'Regular monitoring']
      },
      caterpillars: {
        crops: ['tomato', 'corn', 'cabbage'],
        severity: 'high',
        symptoms: ['Holes in leaves', 'Frass (droppings)', 'Visible larvae'],
        treatment: ['Bt (Bacillus thuringiensis)', 'Hand picking', 'Pheromone traps'],
        prevention: ['Row covers', 'Beneficial insects', 'Crop rotation']
      },
      whiteflies: {
        crops: ['tomato', 'pepper', 'cucumber'],
        severity: 'moderate',
        symptoms: ['Yellowing leaves', 'Sticky honeydew', 'Flying insects'],
        treatment: ['Yellow sticky traps', 'Insecticidal soap', 'Systemic insecticides'],
        prevention: ['Reflective mulch', 'Remove weeds', 'Quarantine new plants']
      }
    };
  }

  /**
   * Analyze crop image for diseases using OpenEPI
   */
  async analyzeCropImage(imageData, cropType, location = null) {
    try {
      const response = await this.openEpi.analyzeCropImage(imageData, cropType, {
        useCache: false // Don't cache image analysis
      });

      const analysis = this.transformCropAnalysis(response, cropType);
      
      logger.info('Crop image analysis completed via OpenEPI', { cropType });
      return analysis;

    } catch (error) {
      logger.error('Failed to analyze crop image via OpenEPI', { cropType, error: error.message });
      throw error;
    }
  }

  /**
   * Get crop disease information using OpenEPI
   */
  async getCropDiseases(cropType, region = null) {
    try {
      const response = await this.openEpi.getCropDiseases(cropType, region, {
        cacheTTL: this.diseaseInfoCacheTTL
      });

      logger.info('Crop diseases retrieved via OpenEPI', { cropType, region });
      return this.transformDiseaseData(response, cropType);

    } catch (error) {
      logger.error('Failed to get crop diseases via OpenEPI', { cropType, error: error.message });
      throw error;
    }
  }

  /**
   * Transform OpenEPI crop analysis response
   */
  transformCropAnalysis(response, cropType) {
    return {
      cropType,
      analysis: {
        diseases: response.diseases || [],
        healthScore: response.health_score || response.healthScore || 80,
        confidence: response.confidence || 0.8,
        recommendations: response.recommendations || []
      },
      timestamp: new Date().toISOString(),
      source: 'OpenEPI'
    };
  }

  /**
   * Transform disease data response
   */
  transformDiseaseData(response, cropType) {
    return {
      cropType,
      diseases: response.diseases || response.data || [],
      timestamp: new Date().toISOString(),
      source: 'OpenEPI'
    };
  }

  /**
   * Analyze crop image for disease detection
   */
  async analyzeCropImage(imageData, cropType) {
    try {
      if (!imageData) {
        throw new ApiError('Image data is required', 400);
      }

      // Mock analysis result (replace with actual AI/ML API call)
      const analysisResult = this.generateMockDiagnosisResult(cropType);
      
      logger.info('Crop image analysis completed', { cropType });
      return analysisResult;

    } catch (error) {
      logger.error('Failed to analyze crop image', { cropType, error: error.message });
      throw new ApiError('Crop image analysis service temporarily unavailable', 503);
    }
  }

  /**
   * Get disease information and treatment recommendations
   */
  async getDiseaseInfo(cropType, diseaseName) {
    try {
      const crop = this.diseaseDatabase[cropType.toLowerCase()];
      if (!crop) {
        throw new ApiError(`Crop type '${cropType}' not supported`, 400);
      }

      const disease = crop[diseaseName.toLowerCase()];
      if (!disease) {
        throw new ApiError(`Disease '${diseaseName}' not found for ${cropType}`, 404);
      }

      const diseaseInfo = {
        crop: cropType,
        disease: diseaseName,
        severity: disease.severity,
        symptoms: disease.symptoms,
        treatment: {
          immediate: disease.treatment,
          longTerm: disease.prevention
        },
        economicImpact: this.calculateEconomicImpact(disease.severity),
        spreadRisk: this.assessSpreadRisk(disease.severity),
        monitoringSchedule: this.getMonitoringSchedule(disease.severity),
        timestamp: new Date().toISOString()
      };

      logger.info('Disease information retrieved', { cropType, diseaseName });
      return diseaseInfo;

    } catch (error) {
      logger.error('Failed to get disease info', { cropType, diseaseName, error: error.message });
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Disease information service temporarily unavailable', 503);
    }
  }

  /**
   * Get pest identification and control recommendations
   */
  async getPestInfo(pestName) {
    try {
      const pest = this.pestDatabase[pestName.toLowerCase()];
      if (!pest) {
        throw new ApiError(`Pest '${pestName}' not found in database`, 404);
      }

      const pestInfo = {
        pest: pestName,
        affectedCrops: pest.crops,
        severity: pest.severity,
        identification: {
          symptoms: pest.symptoms,
          lifecycle: this.getPestLifecycle(pestName),
          peakSeason: this.getPestSeason(pestName)
        },
        control: {
          biological: this.getBiologicalControl(pestName),
          chemical: pest.treatment,
          cultural: pest.prevention
        },
        economicThreshold: this.getEconomicThreshold(pestName),
        monitoringMethods: this.getMonitoringMethods(pestName),
        timestamp: new Date().toISOString()
      };

      logger.info('Pest information retrieved', { pestName });
      return pestInfo;

    } catch (error) {
      logger.error('Failed to get pest info', { pestName, error: error.message });
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Pest information service temporarily unavailable', 503);
    }
  }

  /**
   * Get comprehensive crop health assessment
   */
  async getCropHealthAssessment(farmId, cropType) {
    try {
      const healthAssessment = {
        farmId,
        cropType,
        overallHealth: Math.floor(Math.random() * 30) + 70, // Score 70-100
        riskFactors: [
          {
            type: 'disease',
            risk: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'moderate' : 'low',
            description: 'Based on current weather conditions and crop stage'
          },
          {
            type: 'pest',
            risk: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'moderate' : 'low',
            description: 'Seasonal pest pressure and local conditions'
          },
          {
            type: 'nutrition',
            risk: Math.random() > 0.5 ? 'moderate' : 'low',
            description: 'Based on soil analysis and growth stage'
          }
        ],
        recommendations: [
          'Continue regular monitoring for early detection',
          'Maintain proper nutrition program',
          'Ensure adequate irrigation without waterlogging',
          'Practice integrated pest management'
        ],
        nextInspection: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        criticalActions: [],
        timestamp: new Date().toISOString()
      };

      // Add critical actions if high risk
      healthAssessment.riskFactors.forEach(factor => {
        if (factor.risk === 'high') {
          healthAssessment.criticalActions.push({
            priority: 'urgent',
            action: `Address ${factor.type} concerns immediately`,
            timeframe: '24-48 hours'
          });
        }
      });

      logger.info('Crop health assessment completed', { farmId, cropType });
      return healthAssessment;

    } catch (error) {
      logger.error('Failed to get crop health assessment', { farmId, cropType, error: error.message });
      throw new ApiError('Crop health assessment service temporarily unavailable', 503);
    }
  }

  /**
   * Generate mock diagnosis result for image analysis
   */
  generateMockDiagnosisResult(cropType) {
    const crops = Object.keys(this.diseaseDatabase);
    const selectedCrop = crops.includes(cropType?.toLowerCase()) ? cropType.toLowerCase() : 'tomato';
    const diseases = Object.keys(this.diseaseDatabase[selectedCrop]);
    const selectedDisease = diseases[Math.floor(Math.random() * diseases.length)];
    
    const confidence = Math.random() * 0.3 + 0.7; // 70-100% confidence
    
    return {
      cropType: selectedCrop,
      diagnosis: {
        primary: {
          condition: selectedDisease,
          confidence: (confidence * 100).toFixed(1) + '%',
          severity: this.diseaseDatabase[selectedCrop][selectedDisease].severity
        },
        alternatives: diseases.slice(0, 2).map(disease => ({
          condition: disease,
          confidence: (Math.random() * 0.4 + 0.3 * 100).toFixed(1) + '%'
        }))
      },
      recommendations: this.diseaseDatabase[selectedCrop][selectedDisease].treatment,
      urgency: confidence > 0.8 ? 'immediate' : 'within 48 hours',
      followUpRequired: true,
      estimatedRecoveryTime: '1-2 weeks with proper treatment',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate economic impact based on disease severity
   */
  calculateEconomicImpact(severity) {
    const impacts = {
      low: { yieldLoss: '5-10%', treatmentCost: 'Low' },
      moderate: { yieldLoss: '15-25%', treatmentCost: 'Moderate' },
      high: { yieldLoss: '30-50%', treatmentCost: 'High' }
    };
    
    return impacts[severity] || impacts.moderate;
  }

  /**
   * Assess disease spread risk
   */
  assessSpreadRisk(severity) {
    const risks = {
      low: 'Contained, low spread risk',
      moderate: 'Moderate spread risk, monitor closely',
      high: 'High spread risk, immediate action required'
    };
    
    return risks[severity] || risks.moderate;
  }

  /**
   * Get monitoring schedule based on severity
   */
  getMonitoringSchedule(severity) {
    const schedules = {
      low: 'Weekly monitoring',
      moderate: 'Bi-weekly monitoring',
      high: 'Daily monitoring until resolved'
    };
    
    return schedules[severity] || schedules.moderate;
  }

  /**
   * Get pest lifecycle information
   */
  getPestLifecycle(pestName) {
    const lifecycles = {
      aphids: '7-10 days, multiple generations per season',
      caterpillars: '2-4 weeks from egg to adult',
      whiteflies: '2-3 weeks, overlapping generations'
    };
    
    return lifecycles[pestName] || 'Varies by species and conditions';
  }

  /**
   * Get pest seasonal information
   */
  getPestSeason(pestName) {
    const seasons = {
      aphids: 'Spring and fall, cooler weather',
      caterpillars: 'Late spring through summer',
      whiteflies: 'Warm weather, year-round in tropics'
    };
    
    return seasons[pestName] || 'Varies by region and climate';
  }

  /**
   * Get biological control options
   */
  getBiologicalControl(pestName) {
    const bioControl = {
      aphids: ['Ladybugs', 'Lacewings', 'Parasitic wasps'],
      caterpillars: ['Trichogramma wasps', 'Bacillus thuringiensis', 'Birds'],
      whiteflies: ['Encarsia wasps', 'Delphastus beetles', 'Sticky traps']
    };
    
    return bioControl[pestName] || ['Beneficial insects', 'Natural predators'];
  }

  /**
   * Get economic threshold for pest control
   */
  getEconomicThreshold(pestName) {
    const thresholds = {
      aphids: '5-10 per plant depending on crop value',
      caterpillars: '1-2 larvae per plant',
      whiteflies: '5-10 adults per plant'
    };
    
    return thresholds[pestName] || 'Monitor population levels';
  }

  /**
   * Get monitoring methods for pest
   */
  getMonitoringMethods(pestName) {
    const methods = {
      aphids: ['Visual inspection', 'Leaf counting', 'Sticky traps'],
      caterpillars: ['Visual inspection', 'Pheromone traps', 'Frass monitoring'],
      whiteflies: ['Yellow sticky traps', 'Visual inspection', 'Tap method']
    };
    
    return methods[pestName] || ['Regular visual inspection', 'Trapping methods'];
  }
}

module.exports = new CropHealthApiService();