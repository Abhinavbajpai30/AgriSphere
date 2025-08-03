require('dotenv').config();
const mongoose = require('mongoose');
const Farm = require('./models/Farm');

async function debugFarmQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const userId = '688f6486b5e78dcbd1da6618';
    
    console.log('\n🔍 Testing different queries...');
    
    // Test 1: All farms for user
    const allFarms = await Farm.find({ owner: userId });
    console.log(`1. All farms for user: ${allFarms.length}`);
    
    // Test 2: Farms with status.isActive = true
    const activeFarms = await Farm.find({ 
      owner: userId,
      'status.isActive': true 
    });
    console.log(`2. Farms with status.isActive = true: ${activeFarms.length}`);
    
    // Test 3: Farms with status.isActive = true (without owner filter)
    const allActiveFarms = await Farm.find({ 'status.isActive': true });
    console.log(`3. All farms with status.isActive = true: ${allActiveFarms.length}`);
    
    // Test 4: Check the actual query that the API uses
    const apiQuery = { 
      owner: userId,
      'status.isActive': true 
    };
    console.log('\n4. API Query:', JSON.stringify(apiQuery, null, 2));
    
    const apiResult = await Farm.find(apiQuery);
    console.log(`   Result: ${apiResult.length} farms`);
    
    // Test 5: Check each farm individually
    console.log('\n5. Checking each farm individually:');
    const allUserFarms = await Farm.find({ owner: userId });
    
    allUserFarms.forEach((farm, index) => {
      const isActive = farm.status?.isActive;
      const matchesQuery = farm.owner.toString() === userId && isActive === true;
      console.log(`   Farm ${index + 1}: ${farm.farmInfo.name} - isActive: ${isActive}, matches query: ${matchesQuery}`);
    });
    
    // Test 6: Check if there's a limit issue
    console.log('\n6. Testing with limit:');
    const limitedResult = await Farm.find(apiQuery).limit(10);
    console.log(`   With limit(10): ${limitedResult.length} farms`);
    
    // Test 7: Check if there's a sort issue
    console.log('\n7. Testing with sort:');
    const sortedResult = await Farm.find(apiQuery).sort({ createdAt: -1 });
    console.log(`   With sort: ${sortedResult.length} farms`);
    
    // Test 8: Check if there's a populate issue
    console.log('\n8. Testing with populate:');
    const populatedResult = await Farm.find(apiQuery).populate('owner', 'personalInfo.firstName personalInfo.lastName');
    console.log(`   With populate: ${populatedResult.length} farms`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

debugFarmQuery(); 