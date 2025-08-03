require('dotenv').config();
const mongoose = require('mongoose');
const Farm = require('./models/Farm');

async function checkFarmStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const farms = await Farm.find({}).sort({ createdAt: -1 });
    
    console.log(`\n📊 Found ${farms.length} total farms:`);
    
    farms.forEach((farm, index) => {
      console.log(`\nFarm ${index + 1}:`);
      console.log('  ID:', farm._id);
      console.log('  Name:', farm.farmInfo.name);
      console.log('  Owner:', farm.owner);
      console.log('  Status object:', JSON.stringify(farm.status, null, 2));
      console.log('  status.isActive:', farm.status?.isActive);
      console.log('  status (string):', farm.status);
      console.log('  Created:', farm.createdAt);
    });

    // Check farms with different status structures
    const activeFarms = await Farm.find({ 'status.isActive': true });
    const stringStatusFarms = await Farm.find({ status: 'active' });
    const allFarms = await Farm.find({});
    
    console.log('\n🔍 Status Analysis:');
    console.log('Farms with status.isActive = true:', activeFarms.length);
    console.log('Farms with status = "active":', stringStatusFarms.length);
    console.log('Total farms:', allFarms.length);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkFarmStatus(); 