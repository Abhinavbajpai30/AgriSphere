# AgriSphere Backend

AI-powered digital agronomist backend for smallholder farmers. This RESTful API provides comprehensive agricultural services including crop health diagnosis, irrigation management, farm planning, and agricultural data analytics.

## 🌾 Features

### Core Functionality
- **User Authentication**: Secure JWT-based authentication with role-based access control
- **Farm Management**: GPS-based farm boundaries, field management, and soil data tracking
- **Crop Health Diagnosis**: AI-powered disease detection and pest identification
- **Irrigation Management**: Smart irrigation recommendations and water usage optimization
- **Crop Planning**: Seasonal planning, crop rotation, and harvest predictions
- **Agricultural Analytics**: Farm performance metrics and insights

### Technical Features
- **Production-Ready**: Comprehensive error handling, logging, and monitoring
- **Scalable Architecture**: Modular design with separation of concerns
- **Data Integrity**: Robust validation and sanitization
- **Security**: Rate limiting, authentication, input validation
- **Monitoring**: Health checks, metrics, and performance tracking
- **Mobile-First**: Optimized for low-bandwidth environments

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/agrisphere-backend.git
   cd agrisphere-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/agrisphere
   JWT_SECRET=your-super-secret-jwt-key
   
   # API Keys (obtain from respective services)
   WEATHER_API_KEY=your-weather-api-key
   SOIL_API_KEY=your-soil-api-key
   GEOCODING_API_KEY=your-geocoding-api-key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user info

### Farm Management
- `POST /api/farm` - Create new farm
- `GET /api/farm` - List user's farms
- `GET /api/farm/:id` - Get farm details
- `PUT /api/farm/:id` - Update farm
- `POST /api/farm/:id/fields` - Add field to farm
- `GET /api/farm/:id/soil-analysis` - Get soil analysis

### Crop Health Diagnosis
- `POST /api/diagnosis` - Create diagnosis
- `GET /api/diagnosis` - Get diagnosis history
- `GET /api/diagnosis/:id` - Get diagnosis details
- `PUT /api/diagnosis/:id/treatment` - Update treatment
- `POST /api/diagnosis/:id/progress` - Add progress update

### Irrigation Management
- `POST /api/irrigation/recommend` - Get irrigation recommendation
- `PUT /api/irrigation/:id/implement` - Record irrigation implementation
- `GET /api/irrigation` - Get irrigation history
- `GET /api/irrigation/schedule/:farmId` - Get irrigation schedule

### Crop Planning
- `POST /api/planning/crop-plan` - Create crop plan
- `GET /api/planning/recommendations/:farmId` - Get crop recommendations
- `POST /api/planning/rotation` - Create rotation plan
- `GET /api/planning/calendar/:farmId` - Get farming calendar

### Health & Monitoring
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system health
- `GET /health/ready` - Readiness probe
- `GET /health/live` - Liveness probe
- `GET /health/metrics` - System metrics

## 🗄️ Database Schema

### User Model
```javascript
{
  personalInfo: {
    firstName: String,
    lastName: String,
    phoneNumber: String,
    email: String
  },
  location: {
    address: String,
    coordinates: { latitude: Number, longitude: Number },
    country: String
  },
  farmingProfile: {
    experienceLevel: String,
    farmingType: String,
    primaryCrops: [String]
  },
  preferences: {
    language: String,
    units: Object,
    notifications: Object
  }
}
```

### Farm Model
```javascript
{
  farmInfo: {
    name: String,
    farmType: String,
    totalArea: { value: Number, unit: String }
  },
  location: {
    centerPoint: GeoJSON Point,
    boundary: GeoJSON Polygon
  },
  fields: [Field Schema],
  soilData: Object,
  currentCrops: [Crop Schema]
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment (development/production) | No | development |
| `PORT` | Server port | No | 5000 |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_EXPIRE` | JWT expiration time | No | 7d |
| `WEATHER_API_KEY` | Weather service API key | Yes | - |
| `SOIL_API_KEY` | Soil data API key | Yes | - |
| `GEOCODING_API_KEY` | Geocoding service API key | Yes | - |

### Database Configuration

The application uses MongoDB with Mongoose ODM. Key configuration options:

- **Connection Pooling**: Configured for optimal performance
- **Retry Logic**: Automatic reconnection for unreliable networks
- **Indexes**: Optimized for common query patterns
- **Validation**: Schema-level validation for data integrity

## 🛡️ Security Features

### Authentication & Authorization
- JWT-based authentication
- Password hashing with bcrypt
- Account lockout after failed attempts
- Role-based access control

### Input Validation & Sanitization
- Express-validator for input validation
- MongoDB injection prevention
- XSS protection
- HTTP parameter pollution prevention

### Security Headers
- Helmet.js security headers
- CORS configuration
- Rate limiting per user/IP
- Request size limits

## 📊 Monitoring & Logging

### Health Checks
- Basic health endpoint for load balancers
- Detailed health with dependency status
- Kubernetes-ready probes (readiness/liveness)
- System metrics endpoint

### Logging
- Structured JSON logging
- Request/response tracking with IDs
- Error logging with stack traces
- Performance monitoring
- User activity tracking

### Metrics
- Response time tracking
- Request counting
- Error rate monitoring
- Database connection health
- Memory usage tracking

## 🚀 Deployment

### Production Checklist

1. **Environment Setup**
   - Set `NODE_ENV=production`
   - Configure production database
   - Set secure JWT secret
   - Configure API keys

2. **Security**
   - Enable HTTPS
   - Configure CORS origins
   - Set up rate limiting
   - Review security headers

3. **Monitoring**
   - Set up log aggregation
   - Configure health check monitoring
   - Set up error alerting
   - Monitor performance metrics

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agrisphere-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agrisphere-backend
  template:
    metadata:
      labels:
        app: agrisphere-backend
    spec:
      containers:
      - name: backend
        image: agrisphere/backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: agrisphere-secrets
              key: mongodb-uri
        livenessProbe:
          httpGet:
            path: /health/live
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure
- Unit tests for utilities and helpers
- Integration tests for API endpoints
- Database tests with test fixtures
- Authentication and authorization tests

## 🔄 Development Workflow

### Code Style
- ESLint configuration for code quality
- Prettier for code formatting
- Pre-commit hooks for validation

### API Development
1. Define route in appropriate router file
2. Add validation middleware
3. Implement business logic
4. Add error handling
5. Write tests
6. Update documentation

### Database Changes
1. Update Mongoose models
2. Create migration scripts if needed
3. Update seed data
4. Test with existing data

## 📖 API Examples

### User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "personalInfo": {
      "firstName": "John",
      "lastName": "Farmer",
      "phoneNumber": "+1234567890"
    },
    "authentication": {
      "password": "securepassword"
    },
    "location": {
      "address": "123 Farm Road, Rural Area",
      "coordinates": {
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "country": "Kenya"
    },
    "farmingProfile": {
      "experienceLevel": "intermediate",
      "farmingType": "mixed_farming"
    }
  }'
```

### Create Farm
```bash
curl -X POST http://localhost:5000/api/farm \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "farmInfo": {
      "name": "Green Valley Farm",
      "farmType": "crop_farm",
      "totalArea": {
        "value": 5.2,
        "unit": "hectares"
      }
    },
    "location": {
      "address": "Green Valley, Rural County",
      "centerPoint": {
        "coordinates": [-74.0060, 40.7128]
      },
      "boundary": {
        "coordinates": [[
          [-74.010, 40.710],
          [-74.000, 40.710],
          [-74.000, 40.715],
          [-74.010, 40.715],
          [-74.010, 40.710]
        ]]
      }
    }
  }'
```

### Get Crop Health Diagnosis
```bash
curl -X POST http://localhost:5000/api/diagnosis \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "farmId": "FARM_ID",
    "fieldId": "field_1",
    "cropInfo": {
      "cropName": "tomato",
      "growthStage": "flowering"
    },
    "diagnosisRequest": {
      "requestType": "symptom_description",
      "symptoms": [{
        "type": "spots_on_leaves",
        "severity": "moderate",
        "location": "leaves"
      }],
      "affectedArea": {
        "percentage": 15
      }
    }
  }'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation for API changes
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Email: support@agrisphere.com
- Documentation: https://docs.agrisphere.com
- Issues: GitHub Issues page

## 🙏 Acknowledgments

- OpenWeatherMap for weather data
- MongoDB for database technology
- Express.js community for the framework
- All contributors and agricultural experts who provided domain knowledge

---

**AgriSphere** - Empowering smallholder farmers with AI-driven agricultural insights.