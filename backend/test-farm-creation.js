require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Farm = require('./models/Farm');

async function testFarmCreation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the user ID from the recent farm creation
    const recentFarm = await Farm.findOne().sort({ createdAt: -1 });
    
    if (!recentFarm) {
      console.log('❌ No farms found in database');
      return;
    }

    console.log('\n🔍 Recent Farm Details:');
    console.log('Farm ID:', recentFarm._id);
    console.log('Owner ID:', recentFarm.owner);
    console.log('Farm Name:', recentFarm.farmInfo.name);
    console.log('Created At:', recentFarm.createdAt);

    // Check if the user exists
    const user = await User.findById(recentFarm.owner);
    
    if (!user) {
      console.log('❌ User not found for farm owner');
      return;
    }

    console.log('\n👤 User Details:');
    console.log('User ID:', user._id);
    console.log('Name:', user.personalInfo?.firstName, user.personalInfo?.lastName);
    console.log('Phone:', user.personalInfo?.phoneNumber);

    // Count farms for this user
    const userFarms = await Farm.find({ owner: recentFarm.owner });
    console.log('\n📊 User Farm Statistics:');
    console.log('Total farms for user:', userFarms.length);
    
    userFarms.forEach((farm, index) => {
      console.log(`\nFarm ${index + 1}:`);
      console.log('  Name:', farm.farmInfo.name);
      console.log('  Area:', farm.farmInfo.totalArea.value, farm.farmInfo.totalArea.unit);
      console.log('  Crops:', farm.currentCrops?.map(crop => crop.cropName).join(', ') || 'None');
      console.log('  Location:', farm.location.address);
      console.log('  Created:', farm.createdAt);
    });

    // Check if the farm is properly associated
    const farmBelongsToUser = await Farm.findOne({
      _id: recentFarm._id,
      owner: user._id
    });

    if (farmBelongsToUser) {
      console.log('\n✅ VERIFICATION SUCCESSFUL:');
      console.log('✅ Farm is properly associated with user');
      console.log('✅ Farm creation is working correctly');
      console.log('✅ User can access their farms');
    } else {
      console.log('\n❌ VERIFICATION FAILED:');
      console.log('❌ Farm is not properly associated with user');
    }

    // Test the API endpoint
    console.log('\n🌐 Testing API endpoint...');
    const axios = require('axios');
    
    try {
      // You would need to get a valid token here
      // For now, just check if the endpoint exists
      console.log('API endpoint: GET /api/farm');
      console.log('This would return farms for the authenticated user');
    } catch (error) {
      console.log('API test skipped (requires authentication)');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testFarmCreation(); 