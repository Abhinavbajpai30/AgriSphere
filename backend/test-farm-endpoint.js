require('dotenv').config();
const axios = require('axios');

async function testFarmEndpoint() {
  console.log('🧪 Testing farm endpoint accessibility...\n');
  
  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    try {
      const healthResponse = await axios.get('http://localhost:5000/api/health');
      console.log('✅ Server is running, health endpoint works');
    } catch (error) {
      console.log('❌ Server not accessible:', error.message);
      return;
    }
    
    // Test 2: Test farm endpoint without auth
    console.log('\n2. Testing farm endpoint without authentication...');
    try {
      const farmResponse = await axios.get('http://localhost:5000/api/farm');
      console.log('❌ Farm endpoint accessible without auth (should not be)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Farm endpoint properly protected (401 Unauthorized)');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test 3: Test with invalid token
    console.log('\n3. Testing farm endpoint with invalid token...');
    try {
      const farmResponse = await axios.get('http://localhost:5000/api/farm', {
        headers: {
          'Authorization': 'Bearer invalid-token',
          'Content-Type': 'application/json'
        }
      });
      console.log('❌ Farm endpoint accessible with invalid token');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Farm endpoint properly rejects invalid token');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
    // Test 4: Test with valid token
    console.log('\n4. Testing farm endpoint with valid token...');
    try {
      // Login first
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        phoneNumber: '+919821159469',
        password: '12345678'
      });
      
      if (loginResponse.data.status !== 'success') {
        console.log('❌ Login failed:', loginResponse.data.message);
        return;
      }
      
      const token = loginResponse.data.data.token;
      console.log('✅ Login successful, testing farm endpoint...');
      
      const farmResponse = await axios.get('http://localhost:5000/api/farm', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Farm endpoint accessible with valid token');
      console.log('   Status:', farmResponse.status);
      console.log('   Farms returned:', farmResponse.data.data.farms.length);
      console.log('   Total farms in pagination:', farmResponse.data.data.pagination.totalFarms);
      
    } catch (error) {
      console.log('❌ Farm endpoint failed with valid token:', error.message);
      if (error.response) {
        console.log('   Response status:', error.response.status);
        console.log('   Response data:', error.response.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFarmEndpoint(); 