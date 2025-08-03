/**
 * Script to test the dashboard weather function directly
 */

const weatherApi = require('./services/weatherApi');
require('dotenv').config();

async function testDashboardWeather() {
  try {
    console.log('Testing Dashboard Weather Function...');
    
    const lat = 28.7041;
    const lon = 77.1025;
    
    console.log('Testing coordinates:', { lat, lon });
    
    // Test current weather
    console.log('\nTesting current weather...');
    const currentWeather = await weatherApi.getCurrentWeather(lat, lon);
    console.log('Current weather response:', JSON.stringify(currentWeather, null, 2));
    
    // Test forecast
    console.log('\nTesting weather forecast...');
    const forecast = await weatherApi.getWeatherForecast(lat, lon, 3);
    console.log('Forecast response:', JSON.stringify(forecast, null, 2));
    
    // Test the dashboard weather summary function
    console.log('\nTesting dashboard weather summary...');
    const { getWeatherSummary } = require('./routes/dashboard');
    
    // We need to mock the logger since it's not available in this context
    const mockLogger = {
      info: console.log,
      warn: console.log,
      error: console.log
    };
    
    // Temporarily replace the logger
    const originalLogger = require('./utils/logger');
    require('./utils/logger').info = mockLogger.info;
    require('./utils/logger').warn = mockLogger.warn;
    require('./utils/logger').error = mockLogger.error;
    
    const weatherSummary = await getWeatherSummary(lat, lon);
    console.log('Weather summary:', JSON.stringify(weatherSummary, null, 2));
    
  } catch (error) {
    console.error('Dashboard weather test failed:', error.message);
    console.error('Full error:', error);
  }
}

testDashboardWeather(); 