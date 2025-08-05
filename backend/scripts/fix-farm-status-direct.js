/**
 * Direct MongoDB migration script to fix Farm status field
 * Bypasses Mongoose schema validation to fix the issue
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixFarmStatusDirect() {
  let client;
  
  try {
    // Connect directly to MongoDB
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const farmsCollection = db.collection('farms');
    
    // Find all farms where status is a string
    const farmsWithStringStatus = await farmsCollection.find({
      $or: [
        { status: { $type: 'string' } },
        { 'status.isActive': { $exists: false } }
      ]
    }).toArray();
    
    console.log(`Found ${farmsWithStringStatus.length} farms with string status`);
    
    for (const farm of farmsWithStringStatus) {
      console.log(`Processing farm: ${farm._id}`);
      
      // Check if status is a string
      if (typeof farm.status === 'string') {
        console.log(`  - Status is string: "${farm.status}"`);
        
        // Convert string status to proper object
        const newStatus = {
          isActive: farm.status === 'active' || farm.status === 'true',
          lastUpdated: new Date(),
          verificationStatus: 'unverified',
          dataQuality: {
            completeness: 0,
            accuracy: 'unknown'
          }
        };
        
        // Update the farm directly
        await farmsCollection.updateOne(
          { _id: farm._id },
          { 
            $set: { 
              status: newStatus 
            }
          }
        );
        
        console.log(`  - Updated status to object`);
      } else if (!farm.status || typeof farm.status !== 'object') {
        console.log(`  - Status is missing or invalid`);
        
        // Set default status object
        const defaultStatus = {
          isActive: true,
          lastUpdated: new Date(),
          verificationStatus: 'unverified',
          dataQuality: {
            completeness: 0,
            accuracy: 'unknown'
          }
        };
        
        // Update the farm directly
        await farmsCollection.updateOne(
          { _id: farm._id },
          { 
            $set: { 
              status: defaultStatus 
            }
          }
        );
        
        console.log(`  - Set default status object`);
      }
    }
    
    // Also fix farms where status object is missing required fields
    const farmsWithIncompleteStatus = await farmsCollection.find({
      status: { $type: 'object' },
      $or: [
        { 'status.isActive': { $exists: false } },
        { 'status.lastUpdated': { $exists: false } },
        { 'status.verificationStatus': { $exists: false } }
      ]
    }).toArray();
    
    console.log(`Found ${farmsWithIncompleteStatus.length} farms with incomplete status object`);
    
    for (const farm of farmsWithIncompleteStatus) {
      console.log(`Processing farm: ${farm._id}`);
      
      const currentStatus = farm.status || {};
      const updatedStatus = {
        isActive: currentStatus.isActive !== undefined ? currentStatus.isActive : true,
        lastUpdated: currentStatus.lastUpdated || new Date(),
        verificationStatus: currentStatus.verificationStatus || 'unverified',
        dataQuality: {
          completeness: currentStatus.dataQuality?.completeness || 0,
          accuracy: currentStatus.dataQuality?.accuracy || 'unknown',
          lastValidated: currentStatus.dataQuality?.lastValidated || null
        }
      };
      
      // Update the farm directly
      await farmsCollection.updateOne(
        { _id: farm._id },
        { 
          $set: { 
            status: updatedStatus 
          }
        }
      );
      
      console.log(`  - Updated incomplete status object`);
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Disconnected from MongoDB');
    }
  }
}

// Run the migration
fixFarmStatusDirect(); 