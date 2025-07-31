/**
 * Docker Health Check Script for AgriSphere Backend
 * Simple health check script used by Docker to verify container health
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 5000,
  path: '/health',
  method: 'GET',
  timeout: 2000
};

const request = http.request(options, (response) => {
  console.log(`Health check response: ${response.statusCode}`);
  
  if (response.statusCode === 200) {
    process.exit(0); // Success
  } else {
    process.exit(1); // Failure
  }
});

request.on('error', (error) => {
  console.error('Health check failed:', error.message);
  process.exit(1); // Failure
});

request.on('timeout', () => {
  console.error('Health check timed out');
  request.destroy();
  process.exit(1); // Failure
});

request.end();