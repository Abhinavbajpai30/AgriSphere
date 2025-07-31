/**
 * MongoDB Initialization Script for Docker
 * Sets up the AgriSphere database with proper user permissions
 */

// Switch to admin database for user creation
db = db.getSiblingDB('admin');

// Create application user for AgriSphere database
db.createUser({
  user: 'agrisphere',
  pwd: 'agrisphere123',
  roles: [
    {
      role: 'readWrite',
      db: 'agrisphere'
    }
  ]
});

// Switch to AgriSphere database
db = db.getSiblingDB('agrisphere');

// Create collections with validation (optional - Mongoose will create these)
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['personalInfo', 'authentication', 'location'],
      properties: {
        personalInfo: {
          bsonType: 'object',
          required: ['firstName', 'lastName', 'phoneNumber'],
          properties: {
            firstName: { bsonType: 'string' },
            lastName: { bsonType: 'string' },
            phoneNumber: { bsonType: 'string' }
          }
        }
      }
    }
  }
});

db.createCollection('farms');
db.createCollection('diagnosishistories');
db.createCollection('irrigationlogs');

// Create initial indexes for performance
db.users.createIndex({ 'personalInfo.phoneNumber': 1 }, { unique: true });
db.users.createIndex({ 'personalInfo.email': 1 }, { unique: true, sparse: true });
db.users.createIndex({ 'location.coordinates': '2dsphere' });

db.farms.createIndex({ owner: 1 });
db.farms.createIndex({ 'location.centerPoint': '2dsphere' });

db.diagnosishistories.createIndex({ user: 1, createdAt: -1 });
db.diagnosishistories.createIndex({ farm: 1, fieldId: 1 });

db.irrigationlogs.createIndex({ user: 1, createdAt: -1 });
db.irrigationlogs.createIndex({ farm: 1, fieldId: 1 });

print('AgriSphere database initialization completed successfully!');