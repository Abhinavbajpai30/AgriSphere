const mongoose = require('mongoose');
const Farm = require('./models/Farm');
const User = require('./models/User');
require('dotenv').config();

async function testDashboardFarmDetection() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test user ID from the debug info
    const testUserId = '6891903b3504714928d0cb47';
    console.log('Testing with user ID:', testUserId);

    // Check if user exists
    const user = await User.findById(testUserId);
    console.log('User found:', !!user);
    if (user) {
      console.log('User details:', {
        name: user.personalInfo?.firstName,
        email: user.email,
        hasLocation: !!(user.location)
      });
    }

    // Check farms for this user
    const farms = await Farm.find({ owner: testUserId });
    console.log('Farms found:', farms.length);
    
    if (farms.length > 0) {
      farms.forEach((farm, index) => {
        console.log(`Farm ${index + 1}:`, {
          id: farm._id,
          name: farm.farmInfo?.name,
          owner: farm.owner,
          hasCoordinates: !!(farm.location?.centerPoint?.coordinates),
          coordinates: farm.location?.centerPoint?.coordinates
        });
      });
    } else {
      console.log('No farms found for this user');
      
      // Check all farms in the database
      const allFarms = await Farm.find({}).limit(5);
      console.log('All farms in database:', allFarms.length);
      allFarms.forEach((farm, index) => {
        console.log(`Farm ${index + 1}:`, {
          id: farm._id,
          name: farm.farmInfo?.name,
          owner: farm.owner,
          ownerType: typeof farm.owner
        });
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testDashboardFarmDetection(); 