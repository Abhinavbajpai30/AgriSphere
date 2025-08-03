/**
 * Notification Service for AgriSphere
 * Handles automated irrigation reminders and crop management notifications
 */

const cron = require('node-cron');
const logger = require('../utils/logger');
const irrigationService = require('./irrigationService');
const cropRecommendationService = require('./cropRecommendationService');
const User = require('../models/User');
const Farm = require('../models/Farm');
const IrrigationLog = require('../models/IrrigationLog');

class NotificationService {
  constructor() {
    this.isInitialized = false;
    this.activeJobs = new Map();
  }

  /**
   * Initialize notification service and start cron jobs
   */
  initialize() {
    if (this.isInitialized) return;

    logger.info('Initializing notification service...');

    // Daily irrigation check at 6:00 AM
    this.scheduleJob('daily-irrigation-check', '0 6 * * *', this.checkDailyIrrigation.bind(this));

    // Weather alert check at 8:00 AM and 6:00 PM
    this.scheduleJob('weather-alerts', '0 8,18 * * *', this.checkWeatherAlerts.bind(this));

    // Weekly crop planning reminders on Sundays at 9:00 AM
    this.scheduleJob('weekly-planning', '0 9 * * 0', this.sendWeeklyPlanningReminders.bind(this));

    // Monthly farm analytics on the 1st at 10:00 AM
    this.scheduleJob('monthly-analytics', '0 10 1 * *', this.sendMonthlyAnalytics.bind(this));

    this.isInitialized = true;
    logger.info('Notification service initialized successfully');
  }

  /**
   * Schedule a cron job
   */
  scheduleJob(name, schedule, task) {
    try {
      const job = cron.schedule(schedule, task, {
        scheduled: true,
        timezone: 'Asia/Kolkata' // Adjust based on your target region
      });
      
      this.activeJobs.set(name, job);
      logger.info(`Scheduled job: ${name} with schedule: ${schedule}`);
    } catch (error) {
      logger.error(`Failed to schedule job ${name}:`, { error: error.message });
    }
  }

  /**
   * Daily irrigation check for all active farms
   */
  async checkDailyIrrigation() {
    logger.info('Running daily irrigation check...');

    try {
      // Get all active farms
      const farms = await Farm.find({ isActive: true })
        .populate('owner', 'profile.phone profile.email preferences.notifications')
        .lean();

      let checkCount = 0;
      let notificationsSent = 0;

      for (const farm of farms) {
        try {
          checkCount++;
          
          // Skip if user has disabled irrigation notifications
          if (!farm.owner?.preferences?.notifications?.irrigation) {
            continue;
          }

          // Get farm location
          const [longitude, latitude] = farm.location.coordinates;

          // Get irrigation recommendation
          const recommendation = await irrigationService.calculateIrrigationRecommendation({
            latitude,
            longitude,
            cropType: farm.primaryCrop || 'unknown',
            growthStage: 'mid',
            soilType: farm.soilType || 'unknown',
            fieldSize: farm.totalArea || 1
          });

          // Check if irrigation is needed
          if (recommendation.recommendation.status === 'urgent' || 
              recommendation.recommendation.status === 'needed') {
            
            await this.sendIrrigationNotification(farm, recommendation);
            notificationsSent++;

            // Log the notification
            const notificationLog = new IrrigationLog({
              user: farm.owner._id,
              farm: farm._id,
              fieldId: 'general',
              irrigationDate: new Date(),
              recommendationType: 'scheduled',
              recommendation: {
                status: recommendation.recommendation.status,
                priority: recommendation.recommendation.priority,
                action: recommendation.recommendation.action,
                amount: recommendation.recommendation.amount,
                timing: recommendation.recommendation.timing
              },
              weatherConditions: {
                temperature: recommendation.weather.current.temperature,
                humidity: recommendation.weather.current.humidity,
                windSpeed: recommendation.weather.current.windSpeed
              },
              soilMoisture: {
                percentage: recommendation.waterBalance.moisturePercentage,
                status: recommendation.waterBalance.isCritical ? 'critical' : 
                        recommendation.waterBalance.isOptimal ? 'optimal' : 'adequate'
              },
              notes: `Automated daily irrigation check - ${recommendation.recommendation.status}`
            });

            await notificationLog.save();
          }

        } catch (farmError) {
          logger.error(`Error checking irrigation for farm ${farm._id}:`, { 
            error: farmError.message,
            farmId: farm._id
          });
        }
      }

      logger.info('Daily irrigation check completed', { 
        farmsChecked: checkCount,
        notificationsSent
      });

    } catch (error) {
      logger.error('Failed to run daily irrigation check:', { error: error.message });
    }
  }

  /**
   * Check for weather alerts
   */
  async checkWeatherAlerts() {
    logger.info('Checking weather alerts...');

    try {
      const farms = await Farm.find({ isActive: true })
        .populate('owner', 'profile.phone profile.email preferences.notifications')
        .lean();

      let alertsSent = 0;

      for (const farm of farms) {
        try {
          // Skip if user has disabled weather notifications
          if (!farm.owner?.preferences?.notifications?.weather) {
            continue;
          }

          const [longitude, latitude] = farm.location.coordinates;
          
          // Get weather forecast
          const weatherData = await irrigationService.getWeatherForecast(latitude, longitude);
          
          // Check for severe weather in next 24 hours
          const next24Hours = weatherData.forecast.slice(0, 1);
          let alerts = [];

          for (const day of next24Hours) {
            // Heavy rain alert
            if (day.precipitation > 50) {
              alerts.push({
                type: 'heavy_rain',
                severity: 'high',
                message: `Heavy rainfall expected: ${day.precipitation}mm. Consider postponing irrigation and ensure proper drainage.`,
                recommendations: [
                  'Postpone any planned irrigation',
                  'Check and clear drainage channels',
                  'Protect vulnerable crops',
                  'Monitor for waterlogging'
                ]
              });
            }

            // High temperature alert
            if (day.temperature > 40) {
              alerts.push({
                type: 'extreme_heat',
                severity: 'high',
                message: `Extreme heat expected: ${day.temperature}°C. Take measures to protect crops from heat stress.`,
                recommendations: [
                  'Increase irrigation frequency',
                  'Irrigate during early morning or evening',
                  'Provide shade for sensitive crops',
                  'Monitor for heat stress symptoms'
                ]
              });
            }

            // Strong wind alert
            if (day.windSpeed > 25) {
              alerts.push({
                type: 'strong_wind',
                severity: 'medium',
                message: `Strong winds expected: ${day.windSpeed} km/h. Secure equipment and avoid overhead irrigation.`,
                recommendations: [
                  'Secure farm equipment and structures',
                  'Avoid overhead irrigation systems',
                  'Support tall plants if needed',
                  'Check for wind damage after the event'
                ]
              });
            }
          }

          // Send alerts if any
          if (alerts.length > 0) {
            await this.sendWeatherAlert(farm, alerts);
            alertsSent++;
          }

        } catch (farmError) {
          logger.error(`Error checking weather for farm ${farm._id}:`, { 
            error: farmError.message,
            farmId: farm._id
          });
        }
      }

      logger.info('Weather alerts check completed', { alertsSent });

    } catch (error) {
      logger.error('Failed to check weather alerts:', { error: error.message });
    }
  }

  /**
   * Send weekly crop planning reminders
   */
  async sendWeeklyPlanningReminders() {
    logger.info('Sending weekly planning reminders...');

    try {
      const users = await User.find({ 
        'preferences.notifications.planning': true,
        isActive: true 
      }).lean();

      let remindersSent = 0;

      for (const user of users) {
        try {
          const userFarms = await Farm.find({ owner: user._id, isActive: true }).lean();
          
          if (userFarms.length === 0) continue;

          // Generate planning suggestions for the week
          const planningSuggestions = await this.generateWeeklyPlanningSuggestions(userFarms);
          
          await this.sendPlanningReminder(user, planningSuggestions);
          remindersSent++;

        } catch (userError) {
          logger.error(`Error sending planning reminder to user ${user._id}:`, { 
            error: userError.message,
            userId: user._id
          });
        }
      }

      logger.info('Weekly planning reminders completed', { remindersSent });

    } catch (error) {
      logger.error('Failed to send weekly planning reminders:', { error: error.message });
    }
  }

  /**
   * Send monthly analytics
   */
  async sendMonthlyAnalytics() {
    logger.info('Generating monthly analytics...');

    try {
      const users = await User.find({ 
        'preferences.notifications.analytics': true,
        isActive: true 
      }).lean();

      let analyticsSent = 0;

      for (const user of users) {
        try {
          const analytics = await this.generateMonthlyAnalytics(user._id);
          
          if (analytics) {
            await this.sendAnalyticsReport(user, analytics);
            analyticsSent++;
          }

        } catch (userError) {
          logger.error(`Error generating analytics for user ${user._id}:`, { 
            error: userError.message,
            userId: user._id
          });
        }
      }

      logger.info('Monthly analytics completed', { analyticsSent });

    } catch (error) {
      logger.error('Failed to send monthly analytics:', { error: error.message });
    }
  }

  /**
   * Send irrigation notification
   */
  async sendIrrigationNotification(farm, recommendation) {
    const notification = {
      type: 'irrigation_reminder',
      farmName: farm.name,
      status: recommendation.recommendation.status,
      priority: recommendation.recommendation.priority,
      amount: recommendation.recommendation.amount,
      timing: recommendation.recommendation.timing,
      reason: recommendation.recommendation.reason,
      optimalTimes: recommendation.recommendation.optimalTimes?.recommended || [],
      moistureLevel: recommendation.waterBalance.moisturePercentage,
      weatherInfo: {
        temperature: recommendation.weather.current.temperature,
        humidity: recommendation.weather.current.humidity,
        upcomingRain: recommendation.weather.forecast
          .slice(0, 3)
          .reduce((sum, day) => sum + (day.precipitation || 0), 0)
      }
    };

    // In a real implementation, this would send actual notifications
    // via SMS, email, push notifications, etc.
    logger.info('Irrigation notification sent', {
      userId: farm.owner._id,
      farmId: farm._id,
      status: notification.status,
      amount: notification.amount
    });

    // For demo purposes, we'll store this as a system notification
    // In production, integrate with SMS/Email/Push notification services
    return notification;
  }

  /**
   * Send weather alert
   */
  async sendWeatherAlert(farm, alerts) {
    const notification = {
      type: 'weather_alert',
      farmName: farm.name,
      alerts: alerts,
      timestamp: new Date()
    };

    logger.info('Weather alert sent', {
      userId: farm.owner._id,
      farmId: farm._id,
      alertCount: alerts.length,
      types: alerts.map(a => a.type)
    });

    return notification;
  }

  /**
   * Send planning reminder
   */
  async sendPlanningReminder(user, suggestions) {
    const notification = {
      type: 'planning_reminder',
      suggestions: suggestions,
      timestamp: new Date()
    };

    logger.info('Planning reminder sent', {
      userId: user._id,
      suggestionCount: suggestions.length
    });

    return notification;
  }

  /**
   * Send analytics report
   */
  async sendAnalyticsReport(user, analytics) {
    const notification = {
      type: 'monthly_analytics',
      analytics: analytics,
      timestamp: new Date()
    };

    logger.info('Analytics report sent', {
      userId: user._id,
      reportPeriod: analytics.period
    });

    return notification;
  }

  /**
   * Generate weekly planning suggestions
   */
  async generateWeeklyPlanningSuggestions(farms) {
    const suggestions = [];

    for (const farm of farms) {
      try {
        const [longitude, latitude] = farm.location.coordinates;
        
        // Get current season recommendations
        const recommendations = await cropRecommendationService.getRecommendations({
          latitude,
          longitude,
          farmSize: farm.totalArea || 1,
          soilType: farm.soilType || 'unknown'
        });

        // Extract actionable suggestions for this week
        const currentMonth = new Date().getMonth() + 1;
        const seasonalActions = this.getSeasonalActions(recommendations.seasonalCalendar, currentMonth);

        if (seasonalActions.length > 0) {
          suggestions.push({
            farmName: farm.name,
            actions: seasonalActions
          });
        }

      } catch (error) {
        logger.error(`Error generating suggestions for farm ${farm._id}:`, { error: error.message });
      }
    }

    return suggestions;
  }

  /**
   * Generate monthly analytics
   */
  async generateMonthlyAnalytics(userId) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Get irrigation statistics
      const irrigationStats = await IrrigationLog.getStatistics(userId, null, 'month');

      // Get user farms
      const farms = await Farm.find({ owner: userId }).lean();

      // Calculate water usage efficiency
      const efficiency = irrigationStats.avgEfficiency || 0;
      const waterUsed = irrigationStats.totalWaterUsed || 0;
      const irrigationCount = irrigationStats.totalIrrigations || 0;

      // Generate insights
      const insights = [];
      
      if (efficiency < 70) {
        insights.push({
          type: 'improvement',
          message: 'Your irrigation efficiency could be improved',
          suggestion: 'Consider switching to drip irrigation for better water conservation'
        });
      }

      if (irrigationCount > 0) {
        insights.push({
          type: 'achievement',
          message: `You completed ${irrigationCount} irrigation sessions this month`,
          suggestion: 'Consistent irrigation helps maintain optimal crop health'
        });
      }

      return {
        period: `${startOfMonth.toLocaleDateString()} - ${endOfMonth.toLocaleDateString()}`,
        irrigationStats,
        farmCount: farms.length,
        insights,
        recommendations: [
          'Continue monitoring soil moisture levels',
          'Plan for upcoming seasonal changes',
          'Consider crop rotation for soil health'
        ]
      };

    } catch (error) {
      logger.error('Error generating monthly analytics:', { error: error.message, userId });
      return null;
    }
  }

  /**
   * Get seasonal actions for current time
   */
  getSeasonalActions(seasonalCalendar, currentMonth) {
    const actions = [];
    
    // Determine current season
    let currentSeason;
    if (currentMonth >= 3 && currentMonth <= 5) currentSeason = 'spring';
    else if (currentMonth >= 6 && currentMonth <= 8) currentSeason = 'summer';
    else if (currentMonth >= 9 && currentMonth <= 11) currentSeason = 'autumn';
    else currentSeason = 'winter';

    if (seasonalCalendar[currentSeason]?.recommendedCrops) {
      seasonalCalendar[currentSeason].recommendedCrops.forEach(crop => {
        actions.push(`Consider planting ${crop.name} this season`);
      });
    }

    return actions;
  }

  /**
   * Stop all scheduled jobs
   */
  stopAll() {
    logger.info('Stopping all notification jobs...');
    
    for (const [name, job] of this.activeJobs) {
      job.stop();
      logger.info(`Stopped job: ${name}`);
    }
    
    this.activeJobs.clear();
    this.isInitialized = false;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      activeJobs: Array.from(this.activeJobs.keys()),
      jobCount: this.activeJobs.size
    };
  }
}

module.exports = new NotificationService();