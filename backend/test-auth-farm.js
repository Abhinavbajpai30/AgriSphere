require('dotenv').config();
const axios = require('axios');

async function testAuthFarm() {
  console.log('🧪 Testing authentication and farm API...\n');
  
  try {
    // Step 1: Login and get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      phoneNumber: '+919821159469',
      password: '12345678'
    });
    
    if (loginResponse.data.status !== 'success') {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    const userId = loginResponse.data.data.user._id;
    console.log('✅ Login successful');
    console.log('   User ID:', userId);
    console.log('   Token:', token.substring(0, 20) + '...');
    
    // Step 2: Test farm API with token
    console.log('\n2. Testing farm API...');
    const farmsResponse = await axios.get('http://localhost:5000/api/farm', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Farm API Response:');
    console.log('   Status:', farmsResponse.status);
    console.log('   Total farms:', farmsResponse.data.data.farms.length);
    console.log('   Pagination total:', farmsResponse.data.data.pagination.totalFarms);
    
    // Step 3: Check if we can get user info
    console.log('\n3. Testing user info...');
    try {
      const userResponse = await axios.get('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ User info:');
      console.log('   User ID:', userResponse.data.data._id);
      console.log('   Name:', userResponse.data.data.personalInfo?.firstName, userResponse.data.data.personalInfo?.lastName);
    } catch (error) {
      console.log('❌ User info failed:', error.response?.data?.message || error.message);
    }
    
    // Step 4: Test direct database query
    console.log('\n4. Testing direct database query...');
    const mongoose = require('mongoose');
    const Farm = require('./models/Farm');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    const directFarms = await Farm.find({ owner: userId });
    console.log('✅ Direct database query:');
    console.log('   User ID used:', userId);
    console.log('   Farms found:', directFarms.length);
    
    directFarms.forEach((farm, index) => {
      console.log(`   Farm ${index + 1}: ${farm.farmInfo.name} (${farm._id})`);
    });
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAuthFarm(); 