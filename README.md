# AgriSphere

AI-powered digital agronomist platform for smallholder farmers. A comprehensive solution providing crop health diagnosis, irrigation management, farm planning, and agricultural analytics through mobile-first web applications.

## 🌾 Project Overview

AgriSphere empowers smallholder farmers in developing regions with AI-driven agricultural insights, helping them make informed decisions about crop management, irrigation, pest control, and harvest planning.

### Key Features
- **AI-Powered Crop Diagnosis**: Disease detection and pest identification with treatment recommendations
- **Smart Irrigation Management**: Water optimization based on weather, soil, and crop conditions
- **Crop Planning & Rotation**: Seasonal planning with sustainability recommendations
- **Farm Analytics**: Performance metrics and productivity insights
- **Multi-Language Support**: Designed for farmers with limited literacy
- **Offline-First**: Works with unreliable internet connections

## 📁 Project Structure

```
AgriSphere/
├── backend/                 # Node.js + Express API Server
│   ├── config/             # Database and environment configuration
│   ├── middleware/         # Authentication, validation, error handling
│   ├── models/            # MongoDB/Mongoose data models
│   ├── routes/            # API endpoint definitions
│   ├── services/          # External API integrations
│   ├── utils/             # Helper functions and utilities
│   ├── scripts/           # Setup and maintenance scripts
│   ├── package.json       # Backend dependencies
│   └── server.js          # Main application entry point
├── frontend/               # React.js Web Application
│   └── (React app files)
├── package.json           # Root workspace configuration
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5.0 or higher)
- npm or yarn

### 1. Clone and Setup
```bash
git clone https://github.com/your-org/agrisphere.git
cd agrisphere
npm install
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Edit .env with your configuration
# - MongoDB connection string
# - JWT secret key
# - API keys for external services

# Initialize database and create sample data
npm run setup
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment template (if exists)
cp .env.example .env
```

### 4. Development Mode
```bash
# From project root - runs both backend and frontend
npm run dev

# Or run individually:
npm run dev:backend    # Backend only (http://localhost:5000)
npm run dev:frontend   # Frontend only (http://localhost:3000)
```

## 🛠️ Backend Development

The backend is a robust Node.js API built with Express.js and MongoDB, featuring:

### Architecture
- **RESTful API Design**: Clean, consistent endpoints
- **MongoDB with Mongoose**: Flexible document-based storage
- **JWT Authentication**: Secure user authentication
- **Role-Based Access**: Different permission levels
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive data validation
- **Error Handling**: Standardized error responses
- **Logging**: Structured logging for monitoring

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `GET /api/auth/me` - Get current user

#### Farm Management
- `POST /api/farm` - Create farm
- `GET /api/farm` - List user's farms
- `GET /api/farm/:id` - Get farm details
- `PUT /api/farm/:id` - Update farm
- `GET /api/farm/:id/analytics` - Farm analytics

#### Crop Health Diagnosis
- `POST /api/diagnosis` - Create diagnosis
- `GET /api/diagnosis` - Diagnosis history
- `PUT /api/diagnosis/:id/treatment` - Update treatment
- `GET /api/diagnosis/stats` - Diagnosis statistics

#### Irrigation Management
- `POST /api/irrigation/recommend` - Get irrigation recommendation
- `PUT /api/irrigation/:id/implement` - Record implementation
- `GET /api/irrigation/analytics/:farmId` - Water usage analytics

#### Crop Planning
- `POST /api/planning/crop-plan` - Create crop plan
- `GET /api/planning/recommendations/:farmId` - Get recommendations
- `GET /api/planning/calendar/:farmId` - Farming calendar

#### System Health
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system status
- `GET /health/metrics` - System metrics

### Backend Configuration

Key environment variables (see `backend/env.example`):

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/agrisphere

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# External APIs
WEATHER_API_KEY=your-weather-api-key
SOIL_API_KEY=your-soil-api-key
GEOCODING_API_KEY=your-geocoding-api-key
```

### Backend Scripts
```bash
npm run dev          # Development server with hot reload
npm start           # Production server
npm run setup       # Initialize database and sample data
npm test           # Run tests
npm run lint       # Code linting
```

## 🎨 Frontend Development

The frontend is a React.js application optimized for mobile-first usage by farmers.

### Technology Stack
- **React.js**: Component-based UI framework
- **Mobile-First Design**: Responsive layouts for smartphones
- **Progressive Web App**: Offline capabilities
- **Multi-Language**: Support for 8+ languages
- **Accessibility**: Designed for users with limited literacy

### Frontend Scripts
```bash
npm run dev          # Development server
npm run build        # Production build
npm test            # Run tests
npm run lint        # Code linting
```

## 📱 Mobile-First Design

AgriSphere is specifically designed for smallholder farmers using smartphones in areas with:
- Limited internet connectivity
- Varying literacy levels
- Multiple local languages
- Resource constraints

### Design Principles
- **Simple Navigation**: Large, clear buttons and intuitive flow
- **Visual Communication**: Icons and images over text where possible
- **Offline Support**: Core features work without internet
- **Low Bandwidth**: Optimized for 2G/3G networks
- **Voice Assistance**: Audio prompts and instructions

## 🌍 Supported Languages

- English (en)
- Spanish (es)
- French (fr)
- Hindi (hi)
- Swahili (sw)
- Amharic (am)
- Yoruba (yo)
- Hausa (ha)

## 🔧 Configuration

### Development Environment
```bash
# Install all dependencies
npm run install:all

# Start development servers
npm run dev

# Backend: http://localhost:5000
# Frontend: http://localhost:3000
```

### Production Deployment
```bash
# Build frontend
npm run build

# Start production backend
cd backend && npm start
```

## 📊 Monitoring & Health Checks

### Backend Health Endpoints
- `/health` - Basic health status
- `/health/detailed` - Database, services, and system status
- `/health/ready` - Kubernetes readiness probe
- `/health/live` - Kubernetes liveness probe
- `/health/metrics` - Performance metrics

### Logging
- Structured JSON logging
- Request tracking with unique IDs
- Performance monitoring
- Error tracking and alerting

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test              # Run all tests
npm run test:coverage # Test coverage report
npm run test:watch    # Watch mode for development
```

### Frontend Testing
```bash
cd frontend
npm test              # Run component tests
npm run test:coverage # Coverage report
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build backend container
cd backend
docker build -t agrisphere-backend .

# Build frontend container
cd frontend
docker build -t agrisphere-frontend .
```

### Environment Setup
1. **Production Database**: Set up MongoDB Atlas or dedicated MongoDB server
2. **API Keys**: Configure external service API keys
3. **Security**: Set strong JWT secrets and HTTPS
4. **Monitoring**: Set up logging and health check monitoring

## 📈 Performance Considerations

### Backend Optimizations
- Database indexing for common queries
- Request rate limiting and caching
- Compression middleware
- Connection pooling
- Graceful error handling

### Frontend Optimizations
- Code splitting for faster loading
- Image optimization and lazy loading
- Service worker for offline functionality
- Progressive loading for slow connections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add tests for new functionality
- Update documentation for changes
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: See individual README files in `backend/` and `frontend/`
- **Issues**: GitHub Issues for bug reports and feature requests
- **Email**: support@agrisphere.com

## 🙏 Acknowledgments

- Agricultural experts and farmers who provided domain knowledge
- Open source community for tools and libraries
- External API providers for weather, soil, and geographic data

---

**AgriSphere** - Empowering smallholder farmers with AI-driven agricultural insights.