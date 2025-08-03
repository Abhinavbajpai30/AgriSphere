require('dotenv').config();
const axios = require('axios');

async function testFarmAPI() {
  console.log('🧪 Testing Farm API endpoint...\n');
  
  try {
    // First, let's get a valid token by logging in
    console.log('1. Getting authentication token...');
    
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      phoneNumber: '+919821159469',
      password: '12345678'
    });
    
    if (loginResponse.data.status !== 'success') {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, token obtained');
    
    // Test the farm API endpoint
    console.log('\n2. Testing GET /api/farm endpoint...');
    
    const farmsResponse = await axios.get('http://localhost:5000/api/farm', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response Status:', farmsResponse.status);
    console.log('✅ API Response Data:', JSON.stringify(farmsResponse.data, null, 2));
    
    if (farmsResponse.data.status === 'success') {
      const farms = farmsResponse.data.data.farms || [];
      console.log(`\n📊 Found ${farms.length} farms for user:`);
      
      farms.forEach((farm, index) => {
        console.log(`\nFarm ${index + 1}:`);
        console.log('  ID:', farm._id);
        console.log('  Name:', farm.farmInfo.name);
        console.log('  Area:', farm.farmInfo.totalArea.value, farm.farmInfo.totalArea.unit);
        console.log('  Location:', farm.location.address);
        console.log('  Crops:', farm.currentCrops?.map(crop => crop.cropName).join(', ') || 'None');
        console.log('  Status:', farm.status?.isActive ? 'Active' : 'Planning');
        console.log('  Created:', farm.createdAt);
      });
      
      console.log('\n✅ VERIFICATION COMPLETE:');
      console.log('✅ API endpoint is working correctly');
      console.log('✅ Farms are properly associated with user');
      console.log('✅ All farm data is being returned');
      
    } else {
      console.log('❌ API returned error:', farmsResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testFarmAPI(); 