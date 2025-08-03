const path = require('path')
const fs = require('fs')

/**
 * Environment Configuration Management
 * Handles environment-specific settings with validation and defaults
 */

class EnvironmentConfig {
  constructor() {
    this.env = process.env.NODE_ENV || 'development'
    this.config = this.loadConfiguration()
    this.validateConfiguration()
  }

  loadConfiguration() {
    const baseConfig = {
      // Server Configuration
      server: {
        port: parseInt(process.env.PORT) || 5000,
        host: process.env.HOST || '0.0.0.0',
        cors: {
          origin: this.getCorsOrigins(),
          credentials: true
        },
        compression: {
          level: parseInt(process.env.COMPRESSION_LEVEL) || 6,
          threshold: parseInt(process.env.COMPRESSION_THRESHOLD) || 1024
        },
        rateLimit: {
          windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
          max: parseInt(process.env.RATE_LIMIT_MAX) || 100
        }
      },

      // Database Configuration
      database: {
        mongodb: {
          uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/agrisphere',
          options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
            serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT) || 5000,
            socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 45000,
            bufferMaxEntries: 0,
            bufferCommands: false
          }
        },
        redis: {
          url: process.env.REDIS_URL,
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB) || 0,
          maxRetriesPerRequest: 3,
          retryDelayOnFailover: 100,
          lazyConnect: true
        }
      },

      // Authentication & Security
      auth: {
        jwt: {
          secret: process.env.JWT_SECRET || this.generateDefaultSecret(),
          expiresIn: process.env.JWT_EXPIRES_IN || '7d',
          refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
          issuer: process.env.JWT_ISSUER || 'agrisphere',
          audience: process.env.JWT_AUDIENCE || 'agrisphere-users'
        },
        bcrypt: {
          rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
        },
        session: {
          secret: process.env.SESSION_SECRET || this.generateDefaultSecret(),
          maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours
          secure: this.isProduction(),
          httpOnly: true,
          sameSite: 'strict'
        },
        apiKeys: {
          enabled: this.parseBoolean(process.env.API_KEYS_ENABLED, false),
          headerName: process.env.API_KEY_HEADER || 'x-api-key'
        }
      },

      // External API Configuration
      apis: {
        openEpi: {
          baseUrl: process.env.OPENEPI_BASE_URL || 'https://api.openepi.io',
          clientId: process.env.OPENEPI_CLIENT_ID,
          clientSecret: process.env.OPENEPI_CLIENT_SECRET,
          timeout: parseInt(process.env.OPENEPI_TIMEOUT) || 30000,
          retries: parseInt(process.env.OPENEPI_RETRIES) || 3
        },
        weather: {
          provider: process.env.WEATHER_PROVIDER || 'openweathermap',
          apiKey: process.env.WEATHER_API_KEY,
          baseUrl: process.env.WEATHER_BASE_URL,
          timeout: parseInt(process.env.WEATHER_TIMEOUT) || 10000
        },
        geocoding: {
          provider: process.env.GEOCODING_PROVIDER || 'nominatim',
          apiKey: process.env.GEOCODING_API_KEY,
          baseUrl: process.env.GEOCODING_BASE_URL
        }
      },

      // File Storage Configuration
      storage: {
        provider: process.env.STORAGE_PROVIDER || 'local',
        local: {
          uploadPath: process.env.UPLOAD_PATH || path.join(__dirname, '../uploads'),
          maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
          allowedTypes: this.parseArray(process.env.ALLOWED_FILE_TYPES, ['image/jpeg', 'image/png', 'image/webp'])
        },
        aws: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || 'us-east-1',
          bucket: process.env.AWS_S3_BUCKET,
          cloudFrontUrl: process.env.AWS_CLOUDFRONT_URL
        },
        gcp: {
          projectId: process.env.GCP_PROJECT_ID,
          keyFilename: process.env.GCP_KEY_FILE,
          bucket: process.env.GCP_STORAGE_BUCKET
        }
      },

      // Logging Configuration
      logging: {
        level: process.env.LOG_LEVEL || (this.isDevelopment() ? 'debug' : 'info'),
        format: process.env.LOG_FORMAT || 'combined',
        file: {
          enabled: this.parseBoolean(process.env.LOG_FILE_ENABLED, true),
          path: process.env.LOG_FILE_PATH || path.join(__dirname, '../logs'),
          maxSize: process.env.LOG_MAX_SIZE || '10m',
          maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
        },
        database: {
          enabled: this.parseBoolean(process.env.LOG_DB_ENABLED, false),
          collection: process.env.LOG_DB_COLLECTION || 'logs'
        }
      },

      // Monitoring & Analytics
      monitoring: {
        enabled: this.parseBoolean(process.env.MONITORING_ENABLED, this.isProduction()),
        healthCheck: {
          enabled: this.parseBoolean(process.env.HEALTH_CHECK_ENABLED, true),
          interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 60000,
          timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000
        },
        metrics: {
          enabled: this.parseBoolean(process.env.METRICS_ENABLED, true),
          interval: parseInt(process.env.METRICS_INTERVAL) || 60000
        },
        sentry: {
          dsn: process.env.SENTRY_DSN,
          environment: this.env,
          release: process.env.APP_VERSION || 'unknown'
        }
      },

      // Email Configuration
      email: {
        provider: process.env.EMAIL_PROVIDER || 'smtp',
        smtp: {
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: this.parseBoolean(process.env.SMTP_SECURE, false),
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        },
        sendgrid: {
          apiKey: process.env.SENDGRID_API_KEY,
          fromEmail: process.env.SENDGRID_FROM_EMAIL
        },
        ses: {
          region: process.env.AWS_SES_REGION || 'us-east-1',
          accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY
        },
        templates: {
          path: process.env.EMAIL_TEMPLATES_PATH || path.join(__dirname, '../templates/email')
        }
      },

      // Caching Configuration
      cache: {
        provider: process.env.CACHE_PROVIDER || 'memory',
        ttl: {
          default: parseInt(process.env.CACHE_TTL_DEFAULT) || 300, // 5 minutes
          short: parseInt(process.env.CACHE_TTL_SHORT) || 60, // 1 minute
          medium: parseInt(process.env.CACHE_TTL_MEDIUM) || 900, // 15 minutes
          long: parseInt(process.env.CACHE_TTL_LONG) || 3600 // 1 hour
        },
        maxSize: parseInt(process.env.CACHE_MAX_SIZE) || 100 * 1024 * 1024 // 100MB
      },

      // Feature Flags
      features: {
        registration: this.parseBoolean(process.env.FEATURE_REGISTRATION, true),
        socialLogin: this.parseBoolean(process.env.FEATURE_SOCIAL_LOGIN, false),
        paymentIntegration: this.parseBoolean(process.env.FEATURE_PAYMENTS, false),
        analytics: this.parseBoolean(process.env.FEATURE_ANALYTICS, true),
        backgroundJobs: this.parseBoolean(process.env.FEATURE_BACKGROUND_JOBS, true),
        websockets: this.parseBoolean(process.env.FEATURE_WEBSOCKETS, false),
        apiVersioning: this.parseBoolean(process.env.FEATURE_API_VERSIONING, false)
      },

      // Application Metadata
      app: {
        name: process.env.APP_NAME || 'AgriSphere',
        version: process.env.APP_VERSION || '1.0.0',
        environment: this.env,
        debug: this.parseBoolean(process.env.DEBUG, this.isDevelopment()),
        timezone: process.env.TZ || 'UTC',
        locale: process.env.DEFAULT_LOCALE || 'en',
        supportedLocales: this.parseArray(process.env.SUPPORTED_LOCALES, ['en', 'hi', 'es'])
      }
    }

    return this.applyEnvironmentOverrides(baseConfig)
  }

  applyEnvironmentOverrides(config) {
    switch (this.env) {
      case 'development':
        return this.applyDevelopmentOverrides(config)
      case 'test':
        return this.applyTestOverrides(config)
      case 'staging':
        return this.applyStagingOverrides(config)
      case 'production':
        return this.applyProductionOverrides(config)
      default:
        return config
    }
  }

  applyDevelopmentOverrides(config) {
    return {
      ...config,
      server: {
        ...config.server,
        cors: {
          ...config.server.cors,
          origin: ['http://localhost:3000', 'http://localhost:5173']
        }
      },
      auth: {
        ...config.auth,
        bcrypt: {
          ...config.auth.bcrypt,
          rounds: 4 // Faster for development
        }
      },
      logging: {
        ...config.logging,
        level: 'debug'
      }
    }
  }

  applyTestOverrides(config) {
    return {
      ...config,
      database: {
        ...config.database,
        mongodb: {
          ...config.database.mongodb,
          uri: process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/agrisphere_test'
        }
      },
      auth: {
        ...config.auth,
        bcrypt: {
          ...config.auth.bcrypt,
          rounds: 4 // Faster for tests
        }
      },
      logging: {
        ...config.logging,
        level: 'error', // Reduce log noise in tests
        file: {
          ...config.logging.file,
          enabled: false
        }
      },
      monitoring: {
        ...config.monitoring,
        enabled: false
      }
    }
  }

  applyStagingOverrides(config) {
    return {
      ...config,
      logging: {
        ...config.logging,
        level: 'info'
      },
      monitoring: {
        ...config.monitoring,
        enabled: true
      }
    }
  }

  applyProductionOverrides(config) {
    return {
      ...config,
      server: {
        ...config.server,
        cors: {
          ...config.server.cors,
          origin: this.parseArray(process.env.ALLOWED_ORIGINS, [])
        }
      },
      logging: {
        ...config.logging,
        level: 'warn'
      },
      monitoring: {
        ...config.monitoring,
        enabled: true
      },
      auth: {
        ...config.auth,
        session: {
          ...config.auth.session,
          secure: true // Force HTTPS in production
        }
      }
    }
  }

  validateConfiguration() {
    const requiredVars = this.getRequiredVariables()
    const missing = []

    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        missing.push(varName)
      }
    })

    if (missing.length > 0) {
      console.error('Missing required environment variables:', missing.join(', '))
      
      if (this.isProduction()) {
        process.exit(1)
      } else {
        console.warn('Using default values for missing variables in non-production environment')
      }
    }

    // Validate specific configurations
    this.validateDatabaseConfig()
    this.validateAuthConfig()
    this.validateStorageConfig()
  }

  getRequiredVariables() {
    const baseRequired = ['JWT_SECRET']
    
    switch (this.env) {
      case 'production':
        return [
          ...baseRequired,
          'MONGODB_URI',
          'OPENEPI_CLIENT_ID',
          'OPENEPI_CLIENT_SECRET'
        ]
      case 'staging':
        return [
          ...baseRequired,
          'MONGODB_URI'
        ]
      default:
        return baseRequired
    }
  }

  validateDatabaseConfig() {
    const { mongodb } = this.config.database
    
    if (!mongodb.uri) {
      throw new Error('Database URI is required')
    }
    
    try {
      new URL(mongodb.uri)
    } catch (error) {
      throw new Error('Invalid database URI format')
    }
  }

  validateAuthConfig() {
    const { jwt } = this.config.auth
    
    if (!jwt.secret || jwt.secret.length < 32) {
      if (this.isProduction()) {
        throw new Error('JWT secret must be at least 32 characters in production')
      }
    }
  }

  validateStorageConfig() {
    const { storage } = this.config
    
    if (storage.provider === 'local') {
      const uploadPath = storage.local.uploadPath
      if (!fs.existsSync(uploadPath)) {
        try {
          fs.mkdirSync(uploadPath, { recursive: true })
        } catch (error) {
          throw new Error(`Cannot create upload directory: ${uploadPath}`)
        }
      }
    }
  }

  // Helper methods
  isDevelopment() {
    return this.env === 'development'
  }

  isTest() {
    return this.env === 'test'
  }

  isStaging() {
    return this.env === 'staging'
  }

  isProduction() {
    return this.env === 'production'
  }

  parseBoolean(value, defaultValue = false) {
    if (value === undefined || value === null) {
      return defaultValue
    }
    return value === 'true' || value === '1' || value === 'yes'
  }

  parseArray(value, defaultValue = []) {
    if (!value) return defaultValue
    return value.split(',').map(item => item.trim())
  }

  getCorsOrigins() {
    const origins = process.env.CORS_ORIGINS
    if (origins) {
      return this.parseArray(origins)
    }
    
    // Default origins based on environment
    switch (this.env) {
      case 'development':
        return ['http://localhost:3000', 'http://localhost:5173']
      case 'test':
        return ['http://localhost:3000']
      default:
        return []
    }
  }

  generateDefaultSecret() {
    if (this.isProduction()) {
      throw new Error('Secret must be provided in production environment')
    }
    return 'default-development-secret-change-in-production-' + Math.random().toString(36)
  }

  // Export configuration for specific modules
  getDatabaseConfig() {
    return this.config.database
  }

  getAuthConfig() {
    return this.config.auth
  }

  getServerConfig() {
    return this.config.server
  }

  getStorageConfig() {
    return this.config.storage
  }

  getLoggingConfig() {
    return this.config.logging
  }

  getApiConfig() {
    return this.config.apis
  }

  getFeatureFlags() {
    return this.config.features
  }

  // Get all configuration
  getAll() {
    return this.config
  }
}

// Create singleton instance
const environmentConfig = new EnvironmentConfig()

module.exports = environmentConfig