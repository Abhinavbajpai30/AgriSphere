/**
 * Dashboard Routes for AgriSphere
 * Provides aggregated data for the main dashboard including weather, tasks, progress, and insights
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateUser } = require('../middleware/auth');
const logger = require('../utils/logger');
const { success, error } = require('../utils/apiResponse');

// Import API services
const weatherApi = require('../services/weatherApi');
const soilApi = require('../services/soilApi');
const Farm = require('../models/Farm');
const User = require('../models/User');

/**
 * @route   GET /api/dashboard/overview
 * @desc    Get dashboard overview data including weather, tasks, and progress
 * @access  Private
 */
router.get('/overview', authenticateUser, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  try {
    // Get user's farms
    const farms = await Farm.find({ owner: userId }).limit(1);
    const primaryFarm = farms[0];
    
    if (!primaryFarm) {
      return success(res, 'Dashboard data retrieved', {
        hasActiveFarm: false,
        onboardingRequired: true,
        message: 'Complete farm setup to unlock dashboard features'
      });
    }

    // Check if farm has coordinates, otherwise use user's location
    let lat, lon;
    if (!primaryFarm.location.centerPoint || !primaryFarm.location.centerPoint.coordinates) {
      logger.warn('Farm missing coordinates, using user location', { farmId: primaryFarm._id });
      // Use user's location coordinates from onboarding
      const user = await User.findById(userId);
      logger.info('User data for coordinates', { 
        userId, 
        hasUser: !!user, 
        hasLocation: !!(user && user.location),
        hasCoordinates: !!(user && user.location && user.location.coordinates),
        coordinates: user?.location?.coordinates
      });
      
      if (user && user.location && user.location.coordinates) {
        const [userLon, userLat] = user.location.coordinates;
        lat = userLat;
        lon = userLon;
        logger.info('Using user location coordinates', { lat, lon });
      } else {
        // Use a default location (Delhi, India) if coordinates are missing
        lat = 28.7041;
        lon = 77.1025;
        logger.warn('No user coordinates found, using default location');
      }
    } else {
      // Coordinates are stored as [longitude, latitude] in GeoJSON format
      const [longitude, latitude] = primaryFarm.location.centerPoint.coordinates;
      lat = latitude;
      lon = longitude;
    }

    // Log coordinates for debugging
    logger.info('Using coordinates for weather data', { lat, lon, farmId: primaryFarm._id });

    // Fetch data in parallel for better performance
    logger.info('Starting to fetch dashboard data', { lat, lon });
    
    // Fetch data individually to isolate the issue
    logger.info('Starting to fetch dashboard data', { lat, lon });
    
    let weatherData, agriculturalInsights, tasksSummary, progressData;
    
    try {
      weatherData = await getWeatherSummary(lat, lon);
      logger.info('Weather data fetched successfully');
    } catch (error) {
      logger.error('Weather data fetch failed', { error: error.message });
      weatherData = {
        current: { temperature: '--', description: 'Weather unavailable' },
        forecast: [],
        alerts: []
      };
    }
    
    try {
      agriculturalInsights = await getAgriculturalInsights(primaryFarm);
      logger.info('Agricultural insights fetched successfully');
    } catch (error) {
      logger.error('Agricultural insights fetch failed', { error: error.message });
      agriculturalInsights = [];
    }
    
    try {
      tasksSummary = await getTasksSummary(primaryFarm);
      logger.info('Tasks summary fetched successfully');
    } catch (error) {
      logger.error('Tasks summary fetch failed', { error: error.message });
      tasksSummary = { urgent: [], recommended: [], completed: 0, total: 0 };
    }
    
    try {
      progressData = await getProgressData(primaryFarm);
      logger.info('Progress data fetched successfully');
    } catch (error) {
      logger.error('Progress data fetch failed', { error: error.message });
      progressData = { cropGrowth: [], farmHealth: 0, sustainabilityScore: 0, weeklyGoals: { completed: 0, total: 0, percentage: 0 } };
    }
    
    logger.info('Dashboard data fetched successfully', { 
      weatherData: !!weatherData,
      agriculturalInsights: agriculturalInsights?.length,
      tasksSummary: !!tasksSummary,
      progressData: !!progressData
    });

    const dashboardData = {
      hasActiveFarm: true,
      farm: {
        id: primaryFarm._id,
        name: primaryFarm.farmInfo.name,
        location: primaryFarm.location.address,
        area: primaryFarm.farmInfo.totalArea
      },
      weather: {
        ...weatherData,
        location: weatherData.location || {
          name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
          country: 'Coordinates'
        }
      },
      insights: agriculturalInsights,
      tasks: tasksSummary,
      progress: progressData,
      timestamp: new Date().toISOString()
    };

    logger.info('Dashboard overview data retrieved', { userId, farmId: primaryFarm._id });
    return success(res, 'Dashboard data retrieved successfully', dashboardData);

  } catch (err) {
    logger.error('Failed to fetch dashboard overview', { error: err.message, userId });
    return error(res, 'Failed to load dashboard data. Please try again.', 500);
  }
}));

/**
 * @route   GET /api/dashboard/weather
 * @desc    Get detailed weather information for dashboard weather widget
 * @access  Private
 */
router.get('/weather', authenticateUser, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  try {
    const farms = await Farm.find({ owner: userId }).limit(1);
    const primaryFarm = farms[0];
    
    if (!primaryFarm) {
      return error(res, 'No farm found. Please complete farm setup first.', 404);
    }

    // Check if farm has coordinates
    let lat, lon;
    if (!primaryFarm.location.centerPoint || !primaryFarm.location.centerPoint.coordinates) {
      logger.warn('Farm missing coordinates, using default location', { farmId: primaryFarm._id });
      // Use a default location (Delhi, India) if coordinates are missing
      lat = 28.7041;
      lon = 77.1025;
    } else {
      // Coordinates are stored as [longitude, latitude] in GeoJSON format
      const [longitude, latitude] = primaryFarm.location.centerPoint.coordinates;
      lat = latitude;
      lon = longitude;
    }

    const [currentWeather, forecast, agriculturalInsights] = await Promise.all([
      weatherApi.getCurrentWeather(lat, lon),
      weatherApi.getWeatherForecast(lat, lon, 5),
      weatherApi.getAgriculturalInsights(lat, lon, primaryFarm.currentCrops[0]?.cropName)
    ]);

    // Format location name with coordinates
    const locationName = currentWeather.location?.name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    const coordinates = `(${lat.toFixed(4)}, ${lon.toFixed(4)})`;
    const formattedLocationName = `${locationName} ${coordinates}`;
    
    // Update the location name with coordinates
    const updatedCurrentWeather = {
      ...currentWeather,
      location: {
        ...currentWeather.location,
        name: formattedLocationName,
        lat: lat,
        lon: lon
      }
    };

    const weatherWidget = {
      current: updatedCurrentWeather,
      forecast: forecast.forecast.slice(0, 5),
      insights: agriculturalInsights.insights,
      alerts: generateWeatherAlerts(currentWeather, forecast),
      animations: determineWeatherAnimations(currentWeather)
    };

    return success(res, 'Weather data retrieved successfully', weatherWidget);

  } catch (err) {
    logger.error('Failed to fetch weather data', { error: err.message, userId });
    return error(res, 'Failed to load weather data. Please try again.', 500);
  }
}));

/**
 * @route   GET /api/dashboard/tasks
 * @desc    Get urgent tasks and recommendations for today
 * @access  Private
 */
router.get('/tasks', authenticateUser, asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  try {
    const farms = await Farm.find({ owner: userId }).limit(1);
    const primaryFarm = farms[0];
    
    if (!primaryFarm) {
      return error(res, 'No farm found. Please complete farm setup first.', 404);
    }

    const tasks = await generateDailyTasks(primaryFarm, req.user);
    
    return success(res, 'Tasks retrieved successfully', {
      urgentTasks: tasks.urgent,
      recommendedTasks: tasks.recommended,
      completedToday: tasks.completedToday,
      totalTasks: tasks.total
    });

  } catch (err) {
    logger.error('Failed to fetch tasks', { error: err.message, userId });
    return error(res, 'Failed to load tasks. Please try again.', 500);
  }
}));

/**
 * @route   POST /api/dashboard/task/:taskId/complete
 * @desc    Mark a task as completed
 * @access  Private
 */
router.post('/task/:taskId/complete', authenticateUser, asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user._id;
  
  try {
    // In a real app, you'd update the task in the database
    // For now, we'll simulate task completion
    
    const completionData = {
      taskId,
      completedAt: new Date(),
      userId,
      points: calculateTaskPoints(taskId),
      achievements: checkForAchievements(userId, taskId)
    };

    logger.info('Task completed', { taskId, userId });
    return success(res, 'Task completed successfully! Great job! 🎉', completionData);

  } catch (err) {
    logger.error('Failed to complete task', { error: err.message, userId, taskId });
    return error(res, 'Failed to complete task. Please try again.', 500);
  }
}));

/**
 * Helper function to get weather summary for dashboard
 */
async function getWeatherSummary(lat, lon) {
  try {
    logger.info('Fetching weather data', { lat, lon });
    
    const [current, forecast] = await Promise.all([
      weatherApi.getCurrentWeather(lat, lon),
      weatherApi.getWeatherForecast(lat, lon, 3)
    ]);

    logger.info('Weather data received', { 
      current: current.current?.temperature,
      forecast: forecast.forecast?.length 
    });

    logger.info('Weather data structure', { 
      current: current.current?.temperature,
      forecast: forecast.forecast?.length,
      currentKeys: Object.keys(current.current || {}),
      forecastKeys: Object.keys(forecast.forecast?.[0] || {})
    });

    // Format location name with coordinates
    const locationName = current.location?.name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    const coordinates = `(${lat.toFixed(4)}, ${lon.toFixed(4)})`;
    const formattedLocationName = `${locationName} ${coordinates}`;
    
    return {
      location: {
        ...current.location,
        name: formattedLocationName,
        lat: lat,
        lon: lon
      },
      current: {
        temperature: Math.round(current.current.temperature),
        description: current.current.description,
        humidity: current.current.humidity,
        windSpeed: current.current.windSpeed,
        icon: current.current.icon,
        uvIndex: current.current.uvIndex
      },
      forecast: forecast.forecast.slice(0, 3).map(day => ({
        date: day.date,
        high: Math.round(day.temperature.max),
        low: Math.round(day.temperature.min),
        description: day.description,
        icon: day.icon,
        precipitation: day.precipitationProbability
      })),
      alerts: generateWeatherAlerts(current, forecast)
    };
  } catch (error) {
    logger.warn('Failed to fetch weather summary', { error: error.message, stack: error.stack });
    // Format location name with coordinates for error case
    const coordinates = `(${lat.toFixed(4)}, ${lon.toFixed(4)})`;
    const formattedLocationName = `${lat.toFixed(4)}, ${lon.toFixed(4)} ${coordinates}`;
    
    return {
      location: {
        name: formattedLocationName,
        country: 'Coordinates',
        lat: lat,
        lon: lon
      },
      current: { temperature: '--', description: 'Weather unavailable' },
      forecast: [],
      alerts: []
    };
  }
}

/**
 * Helper function to get agricultural insights
 */
async function getAgriculturalInsights(farm) {
  const insights = [];
  
  // Generate insights based on farm data
  if (farm.currentCrops && farm.currentCrops.length > 0) {
    const crop = farm.currentCrops[0];
    const daysSincePlanting = Math.floor((new Date() - crop.plantingDate) / (1000 * 60 * 60 * 24));
    
    insights.push({
      type: 'crop_growth',
      title: `${crop.cropName} Growth Update`,
      message: `Your ${crop.cropName} has been growing for ${daysSincePlanting} days`,
      icon: '🌱',
      priority: 'medium'
    });
  }

  // Soil health insight
  insights.push({
    type: 'soil_health',
    title: 'Soil Health Check',
    message: 'Consider testing soil pH this week for optimal crop nutrition',
    icon: '🌍',
    priority: 'low'
  });

  return insights;
}

/**
 * Helper function to get tasks summary
 */
async function getTasksSummary(farm) {
  const tasks = {
    urgent: [],
    recommended: [],
    completed: 0,
    total: 0
  };

  // Generate sample urgent task
  if (farm.currentCrops && farm.currentCrops.length > 0) {
    tasks.urgent.push({
      id: 'irrigation_check',
      title: 'Check Irrigation System',
      description: 'Ensure proper water distribution across your farm',
      priority: 'high',
      estimatedTime: '30 min',
      icon: '💧',
      points: 50
    });
  }

  // Generate recommended tasks
  tasks.recommended.push(
    {
      id: 'soil_testing',
      title: 'Schedule Soil Testing',
      description: 'Test soil nutrients for next planting season',
      priority: 'medium',
      estimatedTime: '1 hour',
      icon: '🧪',
      points: 30
    },
    {
      id: 'pest_inspection',
      title: 'Inspect for Pests',
      description: 'Check crops for signs of pest damage',
      priority: 'medium',
      estimatedTime: '45 min',
      icon: '🔍',
      points: 40
    }
  );

  tasks.total = tasks.urgent.length + tasks.recommended.length;
  
  return tasks;
}

/**
 * Helper function to get progress data
 */
async function getProgressData(farm) {
  const progress = {
    cropGrowth: [],
    farmHealth: 85,
    sustainabilityScore: 78,
    weeklyGoals: {
      completed: 3,
      total: 5,
      percentage: 60
    }
  };

  // Generate crop growth progress
  if (farm.currentCrops && farm.currentCrops.length > 0) {
    farm.currentCrops.forEach(crop => {
      const daysSincePlanting = Math.floor((new Date() - crop.plantingDate) / (1000 * 60 * 60 * 24));
      const estimatedDaysToHarvest = 90; // Example: 90 days
      const growthPercentage = Math.min((daysSincePlanting / estimatedDaysToHarvest) * 100, 100);

      progress.cropGrowth.push({
        cropName: crop.cropName,
        stage: determineGrowthStage(daysSincePlanting),
        percentage: Math.round(growthPercentage),
        daysToHarvest: Math.max(estimatedDaysToHarvest - daysSincePlanting, 0),
        health: 'good',
        icon: getCropIcon(crop.cropName)
      });
    });
  }

  return progress;
}

/**
 * Helper function to generate weather alerts
 */
function generateWeatherAlerts(current, forecast) {
  const alerts = [];

  // Check if weather data exists before accessing properties
  if (current?.current?.temperature > 35) {
    alerts.push({
      type: 'heat_warning',
      title: 'High Temperature Alert',
      message: 'Consider extra irrigation during hot weather',
      severity: 'moderate',
      icon: '🌡️'
    });
  }

  if (forecast?.forecast?.some(day => day.precipitationProbability > 70)) {
    alerts.push({
      type: 'rain_forecast',
      title: 'Rain Expected',
      message: 'Reduce irrigation schedule for the next few days',
      severity: 'info',
      icon: '🌧️'
    });
  }

  return alerts;
}

/**
 * Helper function to determine weather animations
 */
function determineWeatherAnimations(weather) {
  const temp = weather.current.temperature;
  const description = weather.current.description.toLowerCase();
  
  let animation = 'sunny';
  if (description.includes('rain')) animation = 'rain';
  else if (description.includes('cloud')) animation = 'cloudy';
  else if (description.includes('snow')) animation = 'snow';
  else if (temp > 30) animation = 'hot';
  
  return {
    primary: animation,
    particles: getParticleConfig(animation),
    background: getBackgroundGradient(animation, temp)
  };
}

/**
 * Helper function to get particle configuration for weather animations
 */
function getParticleConfig(animation) {
  const configs = {
    rain: { type: 'raindrops', count: 50, speed: 'fast' },
    sunny: { type: 'sunrays', count: 20, speed: 'slow' },
    cloudy: { type: 'clouds', count: 10, speed: 'medium' },
    snow: { type: 'snowflakes', count: 30, speed: 'slow' },
    hot: { type: 'heatwaves', count: 15, speed: 'medium' }
  };
  
  return configs[animation] || configs.sunny;
}

/**
 * Helper function to get background gradient based on weather
 */
function getBackgroundGradient(animation, temperature) {
  const gradients = {
    sunny: 'from-yellow-400 via-orange-500 to-red-500',
    rain: 'from-gray-600 via-blue-600 to-blue-800',
    cloudy: 'from-gray-400 via-gray-600 to-gray-700',
    snow: 'from-blue-200 via-white to-gray-300',
    hot: 'from-red-400 via-orange-500 to-yellow-500'
  };
  
  return gradients[animation] || gradients.sunny;
}

/**
 * Helper functions for task management
 */
async function generateDailyTasks(farm, user) {
  // This would normally query a tasks database
  // For now, generating sample tasks based on farm data
  
  return {
    urgent: [
      {
        id: 'irrigation_check',
        title: 'Check Irrigation System',
        description: 'Morning irrigation system inspection needed',
        priority: 'high',
        estimatedTime: '30 min',
        icon: '💧',
        points: 50,
        category: 'maintenance'
      }
    ],
    recommended: [
      {
        id: 'soil_testing',
        title: 'Schedule Soil Testing',
        description: 'Plan soil nutrient analysis for next week',
        priority: 'medium',
        estimatedTime: '1 hour',
        icon: '🧪',
        points: 30,
        category: 'planning'
      }
    ],
    completedToday: 2,
    total: 5
  };
}

function calculateTaskPoints(taskId) {
  const pointsMap = {
    'irrigation_check': 50,
    'soil_testing': 30,
    'pest_inspection': 40,
    'crop_monitoring': 35
  };
  
  return pointsMap[taskId] || 25;
}

function checkForAchievements(userId, taskId) {
  // Sample achievement system
  return {
    newAchievements: [],
    totalPoints: 450,
    level: 'Green Thumb',
    nextLevelProgress: 75
  };
}

function determineGrowthStage(daysSincePlanting) {
  if (daysSincePlanting < 14) return 'seedling';
  if (daysSincePlanting < 45) return 'vegetative';
  if (daysSincePlanting < 75) return 'flowering';
  return 'maturation';
}

function getCropIcon(cropName) {
  const icons = {
    tomato: '🍅',
    corn: '🌽',
    wheat: '🌾',
    rice: '🌾',
    potato: '🥔',
    carrot: '🥕',
    pepper: '🌶️',
    cucumber: '🥒',
    lettuce: '🥬'
  };
  
  return icons[cropName.toLowerCase()] || '🌱';
}

module.exports = router;