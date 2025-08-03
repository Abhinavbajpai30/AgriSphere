require('dotenv').config();
const mongoose = require('mongoose');
const Farm = require('./models/Farm');

async function testDirectQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const userId = '688f6486b5e78dcbd1da6618';
    
    console.log('\n🔍 Testing direct queries...');
    
    // Test 1: Query with string
    console.log('1. Query with string owner:');
    const stringQuery = { owner: userId };
    const stringResult = await Farm.find(stringQuery);
    console.log(`   Result: ${stringResult.length} farms`);
    
    // Test 2: Query with ObjectId
    console.log('\n2. Query with ObjectId owner:');
    const objectIdQuery = { owner: new mongoose.Types.ObjectId(userId) };
    const objectIdResult = await Farm.find(objectIdQuery);
    console.log(`   Result: ${objectIdResult.length} farms`);
    
    // Test 3: Query with direct ObjectId
    console.log('\n3. Query with direct ObjectId:');
    const directObjectId = new mongoose.Types.ObjectId(userId);
    const directResult = await Farm.find({ owner: directObjectId });
    console.log(`   Result: ${directResult.length} farms`);
    
    // Test 4: Check what the API actually uses
    console.log('\n4. Simulating API query:');
    const apiUser = { _id: new mongoose.Types.ObjectId(userId) };
    const apiQuery = { owner: apiUser._id };
    const apiResult = await Farm.find(apiQuery);
    console.log(`   API-style query result: ${apiResult.length} farms`);
    
    // Test 5: Check if there's a limit issue
    console.log('\n5. Testing with limit and sort:');
    const limitedResult = await Farm.find(apiQuery)
      .sort({ createdAt: -1 })
      .limit(10);
    console.log(`   With limit and sort: ${limitedResult.length} farms`);
    
    // Test 6: Check if there's a populate issue
    console.log('\n6. Testing with populate:');
    const populatedResult = await Farm.find(apiQuery)
      .populate('owner', 'personalInfo.firstName personalInfo.lastName')
      .sort({ createdAt: -1 });
    console.log(`   With populate: ${populatedResult.length} farms`);
    
    // Show the actual farms found
    if (populatedResult.length > 0) {
      console.log('\n📊 Farms found:');
      populatedResult.forEach((farm, index) => {
        console.log(`   Farm ${index + 1}: ${farm.farmInfo.name} (${farm._id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testDirectQuery(); 