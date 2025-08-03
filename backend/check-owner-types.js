require('dotenv').config();
const mongoose = require('mongoose');
const Farm = require('./models/Farm');

async function checkOwnerTypes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const farms = await Farm.find({});
    
    console.log(`\n📊 Found ${farms.length} total farms:`);
    
    farms.forEach((farm, index) => {
      console.log(`\nFarm ${index + 1}:`);
      console.log('  ID:', farm._id);
      console.log('  Name:', farm.farmInfo.name);
      console.log('  Owner:', farm.owner);
      console.log('  Owner type:', typeof farm.owner);
      console.log('  Owner is ObjectId:', farm.owner instanceof mongoose.Types.ObjectId);
      console.log('  Owner toString:', farm.owner.toString());
    });

    // Check for farms with string owners
    const farmsWithStringOwners = farms.filter(farm => typeof farm.owner === 'string');
    const farmsWithObjectIdOwners = farms.filter(farm => farm.owner instanceof mongoose.Types.ObjectId);
    
    console.log('\n🔍 Owner Type Analysis:');
    console.log('Farms with string owners:', farmsWithStringOwners.length);
    console.log('Farms with ObjectId owners:', farmsWithObjectIdOwners.length);
    
    if (farmsWithStringOwners.length > 0) {
      console.log('\n⚠️  Farms with string owners:');
      farmsWithStringOwners.forEach(farm => {
        console.log(`  - ${farm.farmInfo.name}: ${farm.owner}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkOwnerTypes(); 