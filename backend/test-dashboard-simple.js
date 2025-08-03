/**
 * Simple test to debug dashboard weather issue
 */

const weatherApi = require('./services/weatherApi');
require('dotenv').config();

async function testSimple() {
  try {
    console.log('Testing simple weather call...');
    
    const lat = 28.7041;
    const lon = 77.1025;
    
    // Test the weather API service directly
    console.log('Calling weatherApi.getCurrentWeather...');
    const current = await weatherApi.getCurrentWeather(lat, lon);
    console.log('Current weather result:', current.current?.temperature);
    
    console.log('Calling weatherApi.getWeatherForecast...');
    const forecast = await weatherApi.getWeatherForecast(lat, lon, 3);
    console.log('Forecast result:', forecast.forecast?.length);
    
    // Test the transformation
    console.log('Testing transformation...');
    const weatherData = weatherApi.transformWeatherData(current, { lat, lon });
    console.log('Transformed weather data:', weatherData.current?.temperature);
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSimple(); 