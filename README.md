# 🌾 AgriSphere - AI-Powered Digital Agronomist

> **Empowering smallholder farmers with AI-driven agricultural insights, crop diagnosis, smart irrigation, and climate-adaptive planning.**

## ✨ Features

### 🩺 AI Crop Doctor
- **Intelligent Diagnosis**: AI-powered plant disease detection and health assessment
- **Image Recognition**: Upload crop photos for instant analysis using OpenEPI Crop Health API
- **Treatment Recommendations**: Personalized treatment plans and prevention strategies
- **History Tracking**: Complete diagnosis history with progress monitoring

### 💧 Smart Irrigation Advisor
- **Water Optimization**: Advanced evapotranspiration calculations for precise water management
- **Weather Integration**: Real-time weather data for informed irrigation decisions
- **Soil Analysis**: Moisture monitoring and soil health assessments
- **Automated Scheduling**: Smart irrigation timing based on crop needs and weather forecasts

### 📅 Climate-Smart Planner
- **Seasonal Planning**: Data-driven crop selection based on climate patterns
- **Risk Assessment**: Flood risk analysis and climate change adaptation strategies
- **Market Intelligence**: Price trends and demand forecasting
- **Yield Optimization**: Maximize productivity through scientific planning

### 🌍 Comprehensive Farm Management
- **Digital Farm Mapping**: GeoJSON-based farm boundary plotting
- **Multi-language Support**: Available in English, Hindi, Spanish, French, and German
- **Offline Capability**: PWA with offline sync for rural connectivity
- **Analytics Dashboard**: Comprehensive insights and performance metrics


### Technology Stack

#### Backend
- **Runtime**: Node.js 18+ with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis for session management and API caching
- **Authentication**: JWT-based with bcrypt password hashing
- **File Storage**: Multer with Sharp for image processing
- **External APIs**: OpenEPI for weather, soil, and crop health data
- **Validation**: Express-validator with custom security rules

#### Frontend
- **Framework**: React 19 with modern hooks and concurrent features
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion for smooth, engaging interactions
- **Maps**: React Leaflet for farm boundary visualization
- **State Management**: Context API with optimized providers
- **PWA**: Service Worker with offline sync capabilities

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB 5.0+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/agrisphere/agrisphere.git
   cd agrisphere
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend environment
   cd backend
   cp env.example .env
   # Edit .env with your configuration
   
   # Frontend environment
   cd ../frontend
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB (if not running)
   mongod
   
   # Run database migrations
   cd backend
   npm run migrate
   ```

5. **Start Development Servers**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api/docs

## 📖 Documentation

### API Documentation

Our REST API is fully documented with OpenAPI/Swagger:

- **Interactive Docs**: `/api/docs` (Swagger UI)
- **OpenAPI Spec**: `/api/docs/openapi.json`

#### Key Endpoints

```javascript
// Authentication
POST   /api/auth/register     // User registration
POST   /api/auth/login        // User login
GET    /api/auth/me           // Get user profile

// Farm Management
GET    /api/farm              // List user farms
POST   /api/farm              // Create new farm
PUT    /api/farm/:id          // Update farm details

// Crop Diagnosis
POST   /api/diagnosis/upload  // Upload crop images
POST   /api/diagnosis/analyze // Analyze crop health
GET    /api/diagnosis/history // Get diagnosis history

// Irrigation
POST   /api/irrigation/recommendation // Get irrigation advice
POST   /api/irrigation/log           // Log irrigation activity
GET    /api/irrigation/history       // Get irrigation history

// Planning
GET    /api/planning/recommendations // Get crop recommendations
GET    /api/planning/calendar        // Get seasonal calendar
POST   /api/planning/compare-crops   // Compare crop options
```

### Environment Variables

#### Backend (.env)
```bash
# Server Configuration
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key

# Database
MONGODB_URI=mongodb://localhost:27017/agrisphere
REDIS_URL=redis://localhost:6379

# External APIs
OPENEPI_CLIENT_ID=your-openepi-client-id
OPENEPI_CLIENT_SECRET=your-openepi-client-secret
WEATHER_API_KEY=your-weather-api-key

# File Storage
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=52428800
```

#### Frontend (.env.local)
```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_BUILD_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PUSH_NOTIFICATIONS=false

# External Services
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## 🚀 Deployment

### Production Deployment with Docker

1. **Build Production Images**
   ```bash
   # Build backend
   docker build -t agrisphere-backend:latest ./backend
   
   # Build frontend
   docker build -t agrisphere-frontend:latest ./frontend
   ```

2. **Deploy with Docker Compose**
   ```bash
   # Production deployment
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```


### Health Checks

Monitor application health with built-in endpoints:

```bash
# Basic health check
curl http://localhost:5000/api/health
```

## 📊 Monitoring

### Application Monitoring

- **Health Checks**: Kubernetes-compatible liveness and readiness probes
- **Metrics Collection**: System and business metrics tracking
- **Error Tracking**: Comprehensive error logging and reporting
- **Performance Monitoring**: API response times and resource usage
- **User Analytics**: Feature usage and user journey tracking

### Monitoring Endpoints

```bash
# System health
GET /api/health/detailed

# Application metrics
GET /api/health/metrics

# Analytics dashboard
GET /api/analytics/dashboard

# Error reports
GET /api/errors/summary
```


## 🌐 Internationalization

### Supported Languages

- 🇺🇸 English (en)
- 🇮🇳 Hindi (hi)
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)

### Adding New Languages

```javascript
// Add translation files
src/locales/
├── en.json
├── hi.json
├── es.json
└── your-language.json

// Usage in components
import { useTranslation } from '@/contexts/LanguageContext'

const { t } = useTranslation()
return <h1>{t('welcome.title')}</h1>
```

## 🙏 Acknowledgments

- **OpenEPI** for providing agricultural APIs
- **MongoDB** for database support


---

<div align="center">
  <strong>🌾 Building the future of agriculture, one farmer at a time 🌾</strong>
  <br><br>
  Made with ❤️ by the AgriSphere Team
</div>