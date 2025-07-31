# AgriSphere Frontend

Modern, mobile-first React application for the AgriSphere platform - an AI-powered digital agronomist for smallholder farmers.

## 🌟 Features

- **Modern Design**: Beautiful, engaging UI with nature-inspired colors and micro-animations
- **PWA Ready**: Progressive Web App with offline capabilities and installable on mobile devices
- **Mobile-First**: Optimized for smartphones with touch-friendly interactions
- **Multi-Language**: Support for 8+ languages targeting developing regions
- **Offline Support**: Core features work without internet connection
- **Accessibility**: Designed for users with varying literacy levels
- **Real-time**: Live weather updates, notifications, and sync capabilities

## 🛠️ Technology Stack

- **React 19** - Latest React with modern hooks and features
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **Framer Motion** - Smooth animations and micro-interactions
- **React Router DOM** - Client-side routing with protected routes
- **Axios** - HTTP client with retry logic and offline handling
- **Leaflet** - Interactive maps for farm visualization
- **Headless UI** - Accessible UI components
- **Heroicons** - Beautiful SVG icons
- **Workbox** - Service worker for PWA features

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ 
- npm 8+

### Installation

```bash
# From project root
npm run install:frontend

# Or directly in frontend directory
cd frontend
npm install
```

### Development

```bash
# Start development server
npm run dev

# Runs on http://localhost:3000
```

### Environment Setup

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=AgriSphere
VITE_ENABLE_PWA=true
```

## 📱 PWA Features

The app includes comprehensive PWA capabilities:

- **Installable**: Can be installed on mobile devices and desktops
- **Offline Mode**: Core features work without internet
- **Background Sync**: Data syncs when connection is restored
- **Push Notifications**: Weather alerts and farming reminders
- **App Shell**: Fast loading with cached resources

### PWA Installation

1. Open the app in a supported browser
2. Look for the install prompt or "Add to Home Screen"
3. Follow the installation instructions
4. The app will appear on your device's home screen

## 🎨 Design System

### Color Palette

```css
/* Primary Colors - Fresh Greens */
--primary-50: #f0fdf4
--primary-500: #22c55e
--primary-600: #16a34a

/* Sky Blues */
--sky-500: #0ea5e9
--sky-600: #0284c7

/* Warm Oranges */
--orange-500: #f97316
--orange-600: #ea580c

/* Earth Browns */
--earth-500: #d4a649
--earth-600: #b8922d
```

### Component Classes

```css
/* Buttons */
.btn-primary    /* Green gradient button */
.btn-secondary  /* Blue gradient button */
.btn-warning    /* Orange gradient button */
.btn-outline    /* Outline button */

/* Cards */
.card           /* Standard card */
.card-interactive /* Hoverable card */
.card-glass     /* Glass morphism effect */

/* Inputs */
.input-primary  /* Standard input field */
.input-group    /* Input with label */
```

## 📂 Project Structure

```
frontend/
├── public/                 # Static assets
│   ├── pwa-192x192.png    # PWA icons
│   ├── pwa-512x512.png
│   └── manifest.json      # PWA manifest
├── src/
│   ├── components/        # Reusable components
│   │   ├── Common/       # Shared components
│   │   ├── Layout/       # Layout components
│   │   └── Auth/         # Authentication components
│   ├── contexts/         # React context providers
│   │   ├── AuthContext.jsx
│   │   ├── LanguageContext.jsx
│   │   └── OfflineContext.jsx
│   ├── pages/            # Page components
│   │   ├── Auth/         # Login, Register
│   │   ├── Farm/         # Farm management
│   │   ├── Diagnosis/    # Crop health
│   │   ├── Irrigation/   # Water management
│   │   ├── Planning/     # Crop planning
│   │   ├── Profile/      # User profile
│   │   └── Settings/     # App settings
│   ├── services/         # API and external services
│   │   └── api.js        # API client with retry logic
│   ├── utils/            # Utility functions
│   ├── index.css         # Global styles and design system
│   ├── App.jsx           # Main app component
│   └── main.jsx          # App entry point
├── tailwind.config.js    # Tailwind configuration
├── vite.config.js        # Vite configuration with PWA
└── package.json          # Dependencies and scripts
```

## 🌐 Multi-Language Support

The app supports 8 languages for farmers in developing regions:

- English (en)
- Spanish (es) 
- French (fr)
- Hindi (hi)
- Swahili (sw)
- Amharic (am)
- Yoruba (yo)
- Hausa (ha)

### Adding Translations

1. Update `TRANSLATIONS` object in `src/contexts/LanguageContext.jsx`
2. Add new language to `SUPPORTED_LANGUAGES`
3. Use the `t()` function in components: `{t('welcome')}`

## 📱 Mobile Optimization

### Touch Targets
- Minimum 44px touch targets for accessibility
- Generous spacing between interactive elements
- Large, satisfying buttons with press animations

### Performance
- Code splitting for faster loading
- Image optimization and lazy loading
- Service worker caching
- Smooth 60fps animations

### Responsive Design
- Mobile-first approach
- Flexible layouts that work on all screen sizes
- Safe area support for notched devices
- Landscape and portrait orientations

## 🔧 Development Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues

# Testing
npm test             # Run tests (when implemented)
```

## 🎯 User Experience Design

### For Low-Literacy Users
- **Visual Communication**: Icons and emojis convey meaning
- **Voice Guidance**: Audio prompts for important actions
- **Simple Navigation**: Clear, consistent layout
- **Error Prevention**: Helpful hints and validation

### Engaging Elements
- **Micro-animations**: Delightful feedback on interactions
- **Progress Indicators**: Clear visual progress for operations
- **Celebrations**: Success animations for achievements
- **Gamification**: Achievement badges and progress tracking

## 🔒 Security & Privacy

- **Data Validation**: Client-side input validation
- **Secure Storage**: Encrypted local storage for sensitive data
- **HTTPS Only**: Secure communication with backend
- **Privacy Controls**: User control over data sharing

## 📊 Performance Monitoring

The app includes built-in performance monitoring:

- **API Response Times**: Track backend performance
- **Render Performance**: Monitor component rendering
- **Network Usage**: Optimize for slow connections
- **Error Tracking**: Automatic error reporting

## 🚀 Deployment

### Production Build

```bash
# Build optimized production bundle
npm run build

# Files will be in dist/ directory
```

### Docker Deployment

```dockerfile
# Build stage
FROM node:16-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### Environment Variables

Production environment variables:

```env
VITE_API_URL=https://api.agrisphere.com/api
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PWA=true
```

## 🤝 Contributing

1. Follow the established component patterns
2. Use the design system classes
3. Ensure mobile responsiveness
4. Add proper accessibility attributes
5. Test on multiple devices and browsers

## 📱 Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **PWA Support**: Chrome, Edge, Firefox, Safari

## 🎨 Design Guidelines

### Animation Principles
- **Smooth**: 60fps animations using transform properties
- **Purposeful**: Animations should provide feedback or guide attention
- **Respectful**: Reduced motion support for accessibility
- **Delightful**: Micro-interactions that feel natural and fun

### Color Usage
- **Primary Green**: Main actions, success states
- **Sky Blue**: Water/irrigation related features
- **Orange**: Warnings, alerts, urgent actions
- **Earth Tones**: Farm/land related features

### Typography
- **Headings**: Poppins for display text
- **Body**: Inter for readability
- **Sizes**: Mobile-optimized text scales

## 🌟 Future Enhancements

- **Voice Commands**: Voice input for hands-free operation
- **Augmented Reality**: AR crop scanning and field visualization
- **Machine Learning**: Personalized recommendations
- **Social Features**: Farmer community and knowledge sharing
- **Advanced Analytics**: Detailed farm performance insights

---

**Built with ❤️ for smallholder farmers worldwide** 🌾