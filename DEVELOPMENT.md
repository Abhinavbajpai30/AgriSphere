# AgriSphere Development Guide

This guide provides comprehensive instructions for setting up and developing the AgriSphere platform.

## 📋 Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Backend Development](#backend-development)
4. [Frontend Development](#frontend-development)
5. [Database Management](#database-management)
6. [API Documentation](#api-documentation)
7. [Testing](#testing)
8. [Docker Development](#docker-development)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

## 🚀 Development Setup

### Prerequisites

- **Node.js**: v16 or higher
- **MongoDB**: v5.0 or higher
- **Git**: Latest version
- **Docker** (optional): For containerized development

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/agrisphere.git
   cd agrisphere
   ```

2. **Install root dependencies**
   ```bash
   npm install
   ```

3. **Setup backend**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env with your configuration
   npm run setup
   ```

4. **Setup frontend** (when available)
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   ```

5. **Start development**
   ```bash
   # From project root
   npm run dev
   ```

### Environment Configuration

Edit `backend/.env` with your settings:

```env
# Essential configuration
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/agrisphere
JWT_SECRET=your-development-jwt-secret

# External API keys (get from respective providers)
WEATHER_API_KEY=your-weather-api-key
SOIL_API_KEY=your-soil-api-key
GEOCODING_API_KEY=your-geocoding-api-key
```

## 📁 Project Structure

```
AgriSphere/
├── backend/                    # Node.js API Server
│   ├── config/
│   │   └── database.js        # MongoDB connection setup
│   ├── middleware/
│   │   ├── auth.js           # Authentication middleware
│   │   └── errorHandler.js   # Error handling utilities
│   ├── models/
│   │   ├── User.js           # User schema and methods
│   │   ├── Farm.js           # Farm schema and methods
│   │   ├── DiagnosisHistory.js # Diagnosis tracking
│   │   └── IrrigationLog.js  # Irrigation management
│   ├── routes/
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── farm.js           # Farm management endpoints
│   │   ├── diagnosis.js      # Crop health endpoints
│   │   ├── irrigation.js     # Irrigation endpoints
│   │   ├── planning.js       # Crop planning endpoints
│   │   └── health.js         # System health endpoints
│   ├── services/
│   │   ├── weatherApi.js     # Weather data integration
│   │   ├── soilApi.js        # Soil data integration
│   │   ├── cropHealthApi.js  # Crop health AI service
│   │   ├── floodApi.js       # Flood monitoring service
│   │   └── geocodingApi.js   # Location services
│   ├── utils/
│   │   ├── logger.js         # Structured logging
│   │   └── apiResponse.js    # Standardized responses
│   ├── scripts/
│   │   ├── setup.js          # Database initialization
│   │   └── init-mongo.js     # MongoDB Docker setup
│   ├── server.js             # Main application entry
│   ├── package.json          # Backend dependencies
│   └── Dockerfile            # Container configuration
├── frontend/                  # React.js Application
│   └── (to be implemented)
├── docker-compose.yml         # Production Docker setup
├── docker-compose.dev.yml     # Development Docker setup
├── package.json              # Root workspace configuration
└── README.md                 # Project documentation
```

## 🔧 Backend Development

### API Architecture

The backend follows RESTful design principles with:

- **Express.js**: Web framework
- **MongoDB + Mongoose**: Database and ODM
- **JWT**: Authentication
- **Helmet**: Security headers
- **Morgan**: Request logging
- **Rate limiting**: API protection

### Adding New Endpoints

1. **Create route handler**
   ```javascript
   // routes/newFeature.js
   const express = require('express');
   const { authenticateUser } = require('../middleware/auth');
   const { asyncHandler } = require('../middleware/errorHandler');
   
   const router = express.Router();
   
   router.get('/', authenticateUser, asyncHandler(async (req, res) => {
     // Implementation
     res.success(data, 'Success message');
   }));
   
   module.exports = router;
   ```

2. **Add validation middleware**
   ```javascript
   const { body } = require('express-validator');
   const { handleValidationErrors } = require('../middleware/errorHandler');
   
   const validateInput = [
     body('field').notEmpty().withMessage('Field is required'),
     handleValidationErrors
   ];
   ```

3. **Register route in server.js**
   ```javascript
   const newFeatureRoutes = require('./routes/newFeature');
   app.use('/api/new-feature', newFeatureRoutes);
   ```

### Database Models

When creating new models:

1. **Define schema with validation**
   ```javascript
   const mongoose = require('mongoose');
   
   const newSchema = new mongoose.Schema({
     field: {
       type: String,
       required: [true, 'Field is required'],
       trim: true
     }
   }, {
     timestamps: true,
     toJSON: { virtuals: true }
   });
   ```

2. **Add indexes for performance**
   ```javascript
   newSchema.index({ field: 1 });
   newSchema.index({ createdAt: -1 });
   ```

3. **Add instance and static methods**
   ```javascript
   newSchema.methods.customMethod = function() {
     // Instance method
   };
   
   newSchema.statics.findByField = function(field) {
     // Static method
   };
   ```

### External Services Integration

When adding new external services:

1. **Create service class in `services/`**
   ```javascript
   class NewApiService {
     constructor() {
       this.baseURL = process.env.NEW_API_URL;
       this.apiKey = process.env.NEW_API_KEY;
     }
     
     async fetchData(params) {
       // Implementation with retry logic
     }
   }
   
   module.exports = new NewApiService();
   ```

2. **Add retry logic for reliability**
3. **Include proper error handling**
4. **Add environment variables**

## 🎨 Frontend Development

*Frontend documentation will be added when React application is implemented.*

### Planned Features

- **React.js** with functional components
- **Mobile-first** responsive design
- **Progressive Web App** capabilities
- **Offline-first** architecture
- **Multi-language** support
- **Accessibility** features

## 🗄️ Database Management

### MongoDB Setup

**Local Development:**
```bash
# Install MongoDB
brew install mongodb/brew/mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community

# Connect to database
mongosh mongodb://localhost:27017/agrisphere
```

**Using Docker:**
```bash
# Start MongoDB container
docker-compose up mongodb

# Access MongoDB shell
docker exec -it agrisphere-mongodb mongosh

# Access Mongo Express (web UI)
# http://localhost:8081 (admin/admin)
```

### Database Migrations

When schema changes are needed:

1. **Create migration script**
   ```javascript
   // scripts/migrations/001_add_new_field.js
   const mongoose = require('mongoose');
   
   async function up() {
     // Migration logic
   }
   
   async function down() {
     // Rollback logic
   }
   ```

2. **Test migration thoroughly**
3. **Document changes in commit**

### Indexing Strategy

Key indexes for performance:

```javascript
// User searches
db.users.createIndex({ "personalInfo.phoneNumber": 1 })
db.users.createIndex({ "location.coordinates": "2dsphere" })

// Farm queries
db.farms.createIndex({ owner: 1 })
db.farms.createIndex({ "location.centerPoint": "2dsphere" })

// Diagnosis history
db.diagnosishistories.createIndex({ user: 1, createdAt: -1 })
db.diagnosishistories.createIndex({ "cropInfo.cropName": 1 })

// Irrigation logs
db.irrigationlogs.createIndex({ user: 1, createdAt: -1 })
db.irrigationlogs.createIndex({ farm: 1, fieldId: 1 })
```

## 📖 API Documentation

### Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

### Standard Response Format

**Success Response:**
```json
{
  "status": "success",
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Error description",
  "errors": [...],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Key Endpoints

**User Management:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Current user info

**Farm Management:**
- `POST /api/farm` - Create farm
- `GET /api/farm` - List farms
- `GET /api/farm/:id/analytics` - Farm analytics

**Crop Health:**
- `POST /api/diagnosis` - Create diagnosis
- `GET /api/diagnosis` - Diagnosis history
- `GET /api/diagnosis/stats` - Statistics

**Irrigation:**
- `POST /api/irrigation/recommend` - Get recommendation
- `GET /api/irrigation/analytics/:farmId` - Water analytics

## 🧪 Testing

### Backend Testing

**Unit Tests:**
```bash
cd backend
npm test                # Run all tests
npm run test:coverage   # Coverage report
npm run test:watch      # Watch mode
```

**Test Structure:**
```
backend/tests/
├── unit/
│   ├── models/
│   ├── services/
│   └── utils/
├── integration/
│   └── routes/
└── fixtures/
    └── sampleData.js
```

**Writing Tests:**
```javascript
const request = require('supertest');
const app = require('../server');

describe('Authentication', () => {
  test('should register new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send(userData)
      .expect(201);
      
    expect(response.body.status).toBe('success');
  });
});
```

### API Testing

Use tools like Postman or Insomnia for manual API testing.

**Sample Requests:**
```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"personalInfo": {...}}'

# Get diagnosis
curl -X GET http://localhost:5000/api/diagnosis \
  -H "Authorization: Bearer <token>"
```

## 🐳 Docker Development

### Docker Compose Setup

**Development environment:**
```bash
# Start all services
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Start specific service
docker-compose up backend

# View logs
docker-compose logs -f backend

# Shell into container
docker-compose exec backend sh
```

**Available Services:**
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017
- **Mongo Express**: http://localhost:8081 (admin/admin)
- **Redis**: localhost:6379
- **Redis Commander**: http://localhost:8082

### Building Images

```bash
# Build backend image
cd backend
docker build -t agrisphere-backend .

# Build for different environments
docker build --target development -t agrisphere-backend:dev .
docker build --target production -t agrisphere-backend:prod .
```

## 🚀 Deployment

### Environment Preparation

1. **Production Environment Variables**
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/agrisphere
   JWT_SECRET=strong-production-secret
   # Real API keys
   ```

2. **Security Checklist**
   - [ ] Strong JWT secret
   - [ ] HTTPS enabled
   - [ ] CORS configured
   - [ ] Rate limiting active
   - [ ] Input validation enabled
   - [ ] Error logging configured

### Docker Production

```bash
# Build production image
docker build --target production -t agrisphere-backend:latest .

# Run production container
docker run -d \
  --name agrisphere-backend \
  -p 5000:5000 \
  --env-file .env.production \
  agrisphere-backend:latest
```

### Health Monitoring

**Health Check Endpoints:**
- `/health` - Basic health
- `/health/detailed` - Comprehensive status
- `/health/ready` - Kubernetes readiness
- `/health/live` - Kubernetes liveness

**Monitoring Setup:**
- Configure log aggregation (ELK stack)
- Set up error alerting (Sentry)
- Monitor performance metrics
- Database health monitoring

## 🔧 Troubleshooting

### Common Issues

**Database Connection:**
```bash
# Check MongoDB status
brew services list | grep mongodb

# Check connection
mongosh mongodb://localhost:27017/agrisphere

# Reset database
npm run setup
```

**Port Conflicts:**
```bash
# Check port usage
lsof -i :5000
lsof -i :27017

# Kill process
kill -9 <PID>
```

**Module Issues:**
```bash
# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Clear npm cache
npm cache clean --force
```

**Docker Issues:**
```bash
# Clean up containers
docker-compose down
docker system prune

# Rebuild images
docker-compose build --no-cache
```

### Debugging

**Backend Debugging:**
```bash
# Enable debug logs
DEBUG=agrisphere:* npm run dev

# Node.js debugger
node --inspect server.js
```

**Database Debugging:**
```bash
# MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log

# Query performance
db.users.explain("executionStats").find({...})
```

### Performance Issues

**Database Optimization:**
- Check slow queries in MongoDB logs
- Ensure proper indexing
- Monitor connection pool usage

**API Performance:**
- Use response time logging
- Check for N+1 query problems
- Monitor memory usage

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 🤝 Contributing

1. **Code Style**
   - Use ESLint configuration
   - Follow existing patterns
   - Add JSDoc comments
   - Write tests for new features

2. **Git Workflow**
   - Create feature branches
   - Write descriptive commit messages
   - Update documentation
   - Ensure tests pass

3. **Pull Request Process**
   - Fill out PR template
   - Request code review
   - Address feedback
   - Squash commits before merge

---

**Happy coding! 🌾**