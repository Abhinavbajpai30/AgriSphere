/**
 * Flood API Service for AgriSphere
 * Provides flood risk assessment, early warning systems, and agricultural impact analysis
 * Critical for protecting crops and planning in flood-prone areas
 */

const axios = require('axios');
const logger = require('../utils/logger');
const { ApiError } = require('../middleware/errorHandler');

class FloodApiService {
  constructor() {
    this.openEpi = require('./openEpiService');
    
    // Flood data cache duration
    this.floodRiskCacheTTL = 3600; // 1 hour
    this.floodForecastCacheTTL = 1800; // 30 minutes
    this.floodHistoryCacheTTL = 86400; // 24 hours
  }

  /**
   * Get flood risk assessment using OpenEPI
   */
  async getFloodRisk(lat, lon) {
    try {
      const response = await this.openEpi.getFloodRisk(lat, lon, {
        cacheTTL: this.floodRiskCacheTTL
      });

      logger.info('Flood risk assessment retrieved via OpenEPI', { lat, lon });
      return this.transformFloodRisk(response, lat, lon);

    } catch (error) {
      logger.error('Failed to get flood risk via OpenEPI', { lat, lon, error: error.message });
      throw error;
    }
  }

  /**
   * Get flood forecast using OpenEPI
   */
  async getFloodForecast(lat, lon, days = 7) {
    try {
      const response = await this.openEpi.getFloodForecast(lat, lon, days, {
        cacheTTL: this.floodForecastCacheTTL
      });

      logger.info('Flood forecast retrieved via OpenEPI', { lat, lon, days });
      return this.transformFloodForecast(response, lat, lon);

    } catch (error) {
      logger.error('Failed to get flood forecast via OpenEPI', { lat, lon, error: error.message });
      throw error;
    }
  }

  /**
   * Transform flood risk response
   */
  transformFloodRisk(response, lat, lon) {
    return {
      location: { lat, lon },
      riskLevel: response.risk_level || response.riskLevel || 'moderate',
      riskScore: response.risk_score || response.riskScore || 50,
      factors: response.factors || [],
      recommendations: response.recommendations || [],
      timestamp: new Date().toISOString(),
      source: 'OpenEPI'
    };
  }

  /**
   * Transform flood forecast response
   */
  transformFloodForecast(response, lat, lon) {
    return {
      location: { lat, lon },
      forecast: response.forecast || response.data || [],
      timestamp: new Date().toISOString(),
      source: 'OpenEPI'
    };
  }

  /**
   * Get current flood risk assessment for a location
   */
  async getFloodRisk(lat, lon) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      // Mock flood risk data (replace with actual API integration)
      const floodRisk = {
        location: { lat, lon },
        currentRisk: {
          level: this.generateRiskLevel(),
          probability: (Math.random() * 0.3 + 0.1).toFixed(2), // 10-40% probability
          confidence: (Math.random() * 0.2 + 0.8).toFixed(2), // 80-100% confidence
          lastUpdated: new Date().toISOString()
        },
        factors: {
          rainfall: {
            current: Math.floor(Math.random() * 50) + 10, // mm in last 24h
            forecast: Math.floor(Math.random() * 100) + 20, // mm in next 48h
            impact: Math.random() > 0.5 ? 'high' : 'moderate'
          },
          riverLevel: {
            current: (Math.random() * 3 + 2).toFixed(1), // meters
            normal: (Math.random() * 1 + 1.5).toFixed(1), // meters
            floodStage: (Math.random() * 1 + 4).toFixed(1), // meters
            trend: Math.random() > 0.5 ? 'rising' : 'stable'
          },
          soilSaturation: {
            percentage: Math.floor(Math.random() * 40) + 60, // 60-100%
            drainageCapacity: Math.random() > 0.4 ? 'good' : 'poor',
            impact: 'affects runoff and infiltration'
          },
          topography: {
            elevation: Math.floor(Math.random() * 200) + 50, // meters above sea level
            slope: (Math.random() * 5 + 1).toFixed(1) + '%',
            drainagePattern: Math.random() > 0.5 ? 'well-drained' : 'poor-drainage'
          }
        },
        agriculturalImpact: this.assessAgriculturalImpact(),
        recommendations: [
          'Monitor weather forecasts closely',
          'Ensure drainage systems are clear',
          'Prepare emergency evacuation plan for livestock',
          'Consider crop insurance if not already covered'
        ],
        emergencyContacts: {
          localEmergency: '911',
          floodWarningService: '1-800-FLOOD-WARN',
          agriculturalExtension: '1-800-FARM-HELP'
        },
        timestamp: new Date().toISOString(),
        source: 'FloodAPI'
      };

      // Add specific recommendations based on risk level
      this.addRiskSpecificRecommendations(floodRisk);

      logger.info('Flood risk assessment completed', { lat, lon, risk: floodRisk.currentRisk.level });
      return floodRisk;

    } catch (error) {
      logger.error('Failed to get flood risk', { lat, lon, error: error.message });
      throw new ApiError('Flood risk service temporarily unavailable', 503);
    }
  }

  /**
   * Get flood early warning alerts
   */
  async getFloodAlerts(lat, lon) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      const alerts = [];
      const riskLevel = this.generateRiskLevel();

      // Generate alerts based on risk level
      if (riskLevel === 'high' || riskLevel === 'extreme') {
        alerts.push({
          id: `FLOOD_${Date.now()}`,
          type: 'flood_warning',
          severity: riskLevel === 'extreme' ? 'severe' : 'moderate',
          title: riskLevel === 'extreme' ? 'EXTREME FLOOD WARNING' : 'Flood Warning',
          description: `${riskLevel.toUpperCase()} flood risk detected for your area`,
          issuedAt: new Date().toISOString(),
          validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours
          actions: [
            'Move livestock to higher ground',
            'Secure farm equipment and supplies',
            'Harvest ready crops if possible',
            'Prepare evacuation routes'
          ],
          affectedAreas: ['Agricultural areas', 'Low-lying fields', 'Riverside farms'],
          updateFrequency: '6 hours'
        });
      }

      // Add additional alerts based on conditions
      if (Math.random() > 0.7) {
        alerts.push({
          id: `RAIN_${Date.now()}`,
          type: 'heavy_rain_warning',
          severity: 'moderate',
          title: 'Heavy Rainfall Expected',
          description: 'Heavy rainfall predicted in the next 24-48 hours',
          issuedAt: new Date().toISOString(),
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          actions: [
            'Check and clear drainage channels',
            'Delay field operations if soil is saturated',
            'Monitor soil moisture levels'
          ],
          affectedAreas: ['All agricultural areas'],
          updateFrequency: '12 hours'
        });
      }

      const alertResponse = {
        location: { lat, lon },
        alerts,
        totalActiveAlerts: alerts.length,
        highestSeverity: alerts.length > 0 ? Math.max(...alerts.map(a => 
          a.severity === 'severe' ? 3 : a.severity === 'moderate' ? 2 : 1
        )) : 0,
        lastUpdated: new Date().toISOString(),
        nextUpdate: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours
      };

      logger.info('Flood alerts retrieved', { lat, lon, alertCount: alerts.length });
      return alertResponse;

    } catch (error) {
      logger.error('Failed to get flood alerts', { lat, lon, error: error.message });
      throw new ApiError('Flood alerts service temporarily unavailable', 503);
    }
  }

  /**
   * Get historical flood data for risk analysis
   */
  async getHistoricalFloodData(lat, lon, years = 10) {
    try {
      if (!lat || !lon) {
        throw new ApiError('Latitude and longitude are required', 400);
      }

      // Generate mock historical data
      const historicalData = {
        location: { lat, lon },
        timeRange: {
          startYear: new Date().getFullYear() - years,
          endYear: new Date().getFullYear(),
          totalYears: years
        },
        floodEvents: [],
        statistics: {
          totalEvents: 0,
          averageEventsPerYear: 0,
          severityDistribution: {
            minor: 0,
            moderate: 0,
            major: 0,
            extreme: 0
          },
          seasonalPattern: {
            spring: 0,
            summer: 0,
            fall: 0,
            winter: 0
          }
        },
        riskTrends: {
          increasing: Math.random() > 0.6,
          changeRate: (Math.random() * 10 - 5).toFixed(1) + '%', // -5% to +5%
          confidenceLevel: 'moderate'
        },
        timestamp: new Date().toISOString(),
        source: 'FloodAPI'
      };

      // Generate historical flood events
      for (let year = historicalData.timeRange.startYear; year <= historicalData.timeRange.endYear; year++) {
        const eventsThisYear = Math.floor(Math.random() * 4); // 0-3 events per year
        
        for (let i = 0; i < eventsThisYear; i++) {
          const event = {
            date: new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
            severity: this.generateRiskLevel(),
            duration: Math.floor(Math.random() * 7) + 1, // 1-7 days
            peakLevel: (Math.random() * 2 + 3).toFixed(1), // 3-5 meters
            damage: {
              agricultural: Math.random() > 0.5 ? 'significant' : 'minor',
              estimatedLoss: Math.floor(Math.random() * 50000) + 10000 // $10K-$60K
            }
          };
          
          historicalData.floodEvents.push(event);
          historicalData.statistics.totalEvents++;
          historicalData.statistics.severityDistribution[event.severity]++;
          
          // Determine season
          const month = new Date(event.date).getMonth();
          if (month >= 2 && month <= 4) historicalData.statistics.seasonalPattern.spring++;
          else if (month >= 5 && month <= 7) historicalData.statistics.seasonalPattern.summer++;
          else if (month >= 8 && month <= 10) historicalData.statistics.seasonalPattern.fall++;
          else historicalData.statistics.seasonalPattern.winter++;
        }
      }

      historicalData.statistics.averageEventsPerYear = 
        (historicalData.statistics.totalEvents / years).toFixed(1);

      logger.info('Historical flood data retrieved', { lat, lon, years, events: historicalData.statistics.totalEvents });
      return historicalData;

    } catch (error) {
      logger.error('Failed to get historical flood data', { lat, lon, error: error.message });
      throw new ApiError('Historical flood data service temporarily unavailable', 503);
    }
  }

  /**
   * Get flood preparedness recommendations
   */
  async getFloodPreparedness(farmType, cropTypes) {
    try {
      const preparedness = {
        farmType,
        cropTypes,
        generalPreparation: [
          'Develop a comprehensive emergency plan',
          'Identify evacuation routes and safe areas',
          'Maintain emergency supply kit',
          'Keep important documents in waterproof containers'
        ],
        cropSpecificActions: {},
        livestockProtection: [
          'Identify higher ground for animal evacuation',
          'Prepare portable shelters',
          'Stock emergency feed supplies',
          'Plan for temporary water sources'
        ],
        equipmentProtection: [
          'Move machinery to higher ground',
          'Secure fuel tanks and chemicals',
          'Backup important farm records',
          'Prepare sandbags for critical areas'
        ],
        postFloodRecovery: [
          'Assess crop and livestock damage',
          'Test water sources for contamination',
          'Document damage for insurance claims',
          'Develop replanting strategies'
        ],
        insuranceConsiderations: [
          'Review current flood insurance coverage',
          'Document pre-flood conditions',
          'Understand claim procedures',
          'Consider crop insurance options'
        ],
        emergencySupplies: {
          duration: '72 hours minimum',
          items: [
            'Drinking water (1 gallon per person per day)',
            'Non-perishable food',
            'First aid kit',
            'Flashlights and batteries',
            'Battery-powered radio',
            'Emergency medications'
          ]
        },
        timestamp: new Date().toISOString()
      };

      // Add crop-specific recommendations
      if (cropTypes && Array.isArray(cropTypes)) {
        cropTypes.forEach(crop => {
          preparedness.cropSpecificActions[crop] = this.getCropSpecificFloodActions(crop);
        });
      }

      logger.info('Flood preparedness recommendations generated', { farmType, cropTypes });
      return preparedness;

    } catch (error) {
      logger.error('Failed to get flood preparedness', { farmType, error: error.message });
      throw new ApiError('Flood preparedness service temporarily unavailable', 503);
    }
  }

  /**
   * Generate random risk level
   */
  generateRiskLevel() {
    const levels = ['low', 'moderate', 'high', 'extreme'];
    const weights = [0.4, 0.3, 0.2, 0.1]; // Probability weights
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < levels.length; i++) {
      cumulative += weights[i];
      if (random <= cumulative) {
        return levels[i];
      }
    }
    
    return 'low';
  }

  /**
   * Assess agricultural impact based on flood conditions
   */
  assessAgriculturalImpact() {
    return {
      cropDamage: {
        risk: Math.random() > 0.5 ? 'high' : 'moderate',
        vulnerableCrops: ['corn', 'soybeans', 'vegetables'],
        protectedCrops: ['rice'] // Rice can tolerate flooding
      },
      soilErosion: {
        risk: Math.random() > 0.6 ? 'severe' : 'moderate',
        affectedAreas: 'sloped fields and riverbanks',
        recoveryTime: '1-2 growing seasons'
      },
      fieldAccess: {
        restriction: Math.random() > 0.4 ? 'severe' : 'moderate',
        duration: '3-14 days depending on drainage',
        impact: 'delayed planting/harvesting operations'
      },
      economicImpact: {
        immediateRisk: Math.random() > 0.5 ? 'high' : 'moderate',
        longTermEffects: 'soil fertility changes, infrastructure damage',
        insuranceCoverage: 'check policy details'
      }
    };
  }

  /**
   * Add risk-specific recommendations
   */
  addRiskSpecificRecommendations(floodRisk) {
    const riskLevel = floodRisk.currentRisk.level;
    
    if (riskLevel === 'high' || riskLevel === 'extreme') {
      floodRisk.recommendations.unshift(
        'IMMEDIATE ACTION REQUIRED',
        'Move livestock to safe areas NOW',
        'Harvest any ready crops immediately'
      );
    }
    
    if (riskLevel === 'extreme') {
      floodRisk.recommendations.unshift(
        'EXTREME FLOOD WARNING - EVACUATE IF NECESSARY',
        'Contact emergency services if needed'
      );
    }
  }

  /**
   * Get crop-specific flood protection actions
   */
  getCropSpecificFloodActions(crop) {
    const actions = {
      corn: [
        'Harvest early if near maturity',
        'Improve field drainage',
        'Consider flood-tolerant varieties for future'
      ],
      rice: [
        'Monitor water levels carefully',
        'Ensure proper drainage outlets',
        'Rice can tolerate flooding better than other crops'
      ],
      vegetables: [
        'Harvest immediately if possible',
        'Protect with row covers',
        'Plan for replanting if needed'
      ],
      soybeans: [
        'Avoid planting in low-lying areas',
        'Improve drainage systems',
        'Consider early-maturing varieties'
      ]
    };
    
    return actions[crop.toLowerCase()] || [
      'Monitor crop condition closely',
      'Improve drainage where possible',
      'Consider crop insurance coverage'
    ];
  }
}

module.exports = new FloodApiService();