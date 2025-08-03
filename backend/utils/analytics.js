const logger = require('./logger')

class AnalyticsService {
  constructor() {
    this.events = []
    this.maxEvents = 10000 // Keep last 10k events in memory
    this.sessionData = new Map()
    this.metricsBuffer = []
    this.flushInterval = 60000 // Flush every minute
    
    this.startFlushTimer()
  }

  /**
   * Track user events
   */
  trackEvent(eventName, properties = {}, userId = null) {
    const event = {
      id: this.generateEventId(),
      name: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        userId,
        sessionId: this.getSessionId(userId),
        userAgent: properties.userAgent || 'unknown',
        ip: properties.ip || 'unknown',
        path: properties.path || 'unknown'
      }
    }

    // Add to events buffer
    this.events.push(event)
    
    // Maintain buffer size
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Log important events immediately
    if (this.isImportantEvent(eventName)) {
      logger.info('Important event tracked', event)
    }

    return event.id
  }

  /**
   * Track user journey/funnel
   */
  trackUserJourney(step, userId, metadata = {}) {
    this.trackEvent('user_journey', {
      step,
      ...metadata
    }, userId)
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(feature, action, userId, metadata = {}) {
    this.trackEvent('feature_usage', {
      feature,
      action,
      ...metadata
    }, userId)
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric, value, context = {}) {
    const performanceEvent = {
      type: 'performance',
      metric,
      value,
      context,
      timestamp: new Date().toISOString()
    }

    this.metricsBuffer.push(performanceEvent)
    
    // Log performance issues immediately
    if (this.isPerformanceIssue(metric, value)) {
      logger.warn('Performance issue detected', performanceEvent)
    }
  }

  /**
   * Track errors with context
   */
  trackError(error, context = {}) {
    const errorEvent = {
      id: this.generateEventId(),
      type: 'error',
      message: error.message,
      stack: error.stack,
      name: error.name,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        userId: context.userId || 'anonymous',
        sessionId: this.getSessionId(context.userId),
        environment: process.env.NODE_ENV || 'unknown',
        version: process.env.APP_VERSION || 'unknown'
      }
    }

    this.events.push(errorEvent)
    logger.error('Error tracked', errorEvent)

    // Send critical errors immediately to external service
    if (this.isCriticalError(error)) {
      this.sendCriticalError(errorEvent)
    }

    return errorEvent.id
  }

  /**
   * Track API usage and response times
   */
  trackApiUsage(endpoint, method, statusCode, responseTime, userId = null) {
    this.trackEvent('api_usage', {
      endpoint,
      method,
      statusCode,
      responseTime,
      category: this.categorizeEndpoint(endpoint)
    }, userId)

    // Track performance metrics
    this.trackPerformance('api_response_time', responseTime, {
      endpoint,
      method,
      statusCode
    })
  }

  /**
   * Track business metrics
   */
  trackBusinessMetric(metric, value, userId = null, metadata = {}) {
    this.trackEvent('business_metric', {
      metric,
      value,
      ...metadata
    }, userId)
  }

  /**
   * Get analytics dashboard data
   */
  getDashboardData(timeframe = '24h') {
    const cutoffTime = this.getTimeframeCutoff(timeframe)
    const recentEvents = this.events.filter(
      event => new Date(event.properties?.timestamp || event.timestamp) > cutoffTime
    )

    return {
      totalEvents: recentEvents.length,
      uniqueUsers: this.getUniqueUsers(recentEvents),
      topEvents: this.getTopEvents(recentEvents),
      errorRate: this.getErrorRate(recentEvents),
      performanceMetrics: this.getPerformanceMetrics(timeframe),
      userJourney: this.getUserJourneyData(recentEvents),
      featureUsage: this.getFeatureUsageData(recentEvents),
      timeframe
    }
  }

  /**
   * Get user behavior insights
   */
  getUserInsights(userId, timeframe = '7d') {
    const cutoffTime = this.getTimeframeCutoff(timeframe)
    const userEvents = this.events.filter(
      event => 
        event.properties?.userId === userId && 
        new Date(event.properties?.timestamp || event.timestamp) > cutoffTime
    )

    return {
      userId,
      totalEvents: userEvents.length,
      sessions: this.getUserSessions(userEvents),
      topFeatures: this.getUserTopFeatures(userEvents),
      journey: this.getUserJourneySteps(userEvents),
      lastActive: this.getUserLastActive(userEvents),
      errors: this.getUserErrors(userEvents)
    }
  }

  /**
   * Generate session ID
   */
  getSessionId(userId) {
    if (!userId) {
      return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    const existingSession = this.sessionData.get(userId)
    const now = Date.now()
    const sessionTimeout = 30 * 60 * 1000 // 30 minutes

    if (existingSession && (now - existingSession.lastActivity) < sessionTimeout) {
      existingSession.lastActivity = now
      return existingSession.sessionId
    }

    // Create new session
    const newSessionId = `${userId}_${now}_${Math.random().toString(36).substr(2, 9)}`
    this.sessionData.set(userId, {
      sessionId: newSessionId,
      startTime: now,
      lastActivity: now
    })

    return newSessionId
  }

  /**
   * Helper methods
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  isImportantEvent(eventName) {
    const importantEvents = [
      'user_registered',
      'user_login',
      'user_logout',
      'farm_created',
      'diagnosis_completed',
      'irrigation_scheduled',
      'crop_planned',
      'payment_completed'
    ]
    return importantEvents.includes(eventName)
  }

  isPerformanceIssue(metric, value) {
    const thresholds = {
      api_response_time: 5000, // 5 seconds
      page_load_time: 10000, // 10 seconds
      memory_usage: 90, // 90% memory usage
      cpu_usage: 85 // 85% CPU usage
    }
    return value > (thresholds[metric] || Infinity)
  }

  isCriticalError(error) {
    const criticalErrors = [
      'DATABASE_CONNECTION_FAILED',
      'PAYMENT_PROCESSING_ERROR',
      'SECURITY_VIOLATION',
      'DATA_CORRUPTION'
    ]
    return criticalErrors.some(critical => 
      error.message?.includes(critical) || error.name?.includes(critical)
    )
  }

  categorizeEndpoint(endpoint) {
    if (endpoint.includes('/auth/')) return 'authentication'
    if (endpoint.includes('/farm/')) return 'farm_management'
    if (endpoint.includes('/diagnosis/')) return 'crop_diagnosis'
    if (endpoint.includes('/irrigation/')) return 'irrigation'
    if (endpoint.includes('/planning/')) return 'crop_planning'
    if (endpoint.includes('/dashboard/')) return 'dashboard'
    return 'other'
  }

  getTimeframeCutoff(timeframe) {
    const now = new Date()
    const timeframes = {
      '1h': new Date(now - 60 * 60 * 1000),
      '24h': new Date(now - 24 * 60 * 60 * 1000),
      '7d': new Date(now - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now - 30 * 24 * 60 * 60 * 1000)
    }
    return timeframes[timeframe] || timeframes['24h']
  }

  getUniqueUsers(events) {
    const userIds = new Set()
    events.forEach(event => {
      if (event.properties?.userId) {
        userIds.add(event.properties.userId)
      }
    })
    return userIds.size
  }

  getTopEvents(events) {
    const eventCounts = {}
    events.forEach(event => {
      eventCounts[event.name] = (eventCounts[event.name] || 0) + 1
    })
    
    return Object.entries(eventCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))
  }

  getErrorRate(events) {
    const totalEvents = events.length
    const errorEvents = events.filter(event => event.type === 'error').length
    return totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0
  }

  getPerformanceMetrics(timeframe) {
    const cutoffTime = this.getTimeframeCutoff(timeframe)
    const recentMetrics = this.metricsBuffer.filter(
      metric => new Date(metric.timestamp) > cutoffTime
    )

    const metrics = {}
    recentMetrics.forEach(metric => {
      if (!metrics[metric.metric]) {
        metrics[metric.metric] = []
      }
      metrics[metric.metric].push(metric.value)
    })

    // Calculate averages
    const averages = {}
    Object.entries(metrics).forEach(([metric, values]) => {
      averages[metric] = {
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length
      }
    })

    return averages
  }

  getUserJourneyData(events) {
    const journeyEvents = events.filter(event => event.name === 'user_journey')
    const stepCounts = {}
    
    journeyEvents.forEach(event => {
      const step = event.properties?.step
      if (step) {
        stepCounts[step] = (stepCounts[step] || 0) + 1
      }
    })

    return stepCounts
  }

  getFeatureUsageData(events) {
    const featureEvents = events.filter(event => event.name === 'feature_usage')
    const usage = {}

    featureEvents.forEach(event => {
      const feature = event.properties?.feature
      if (feature) {
        if (!usage[feature]) {
          usage[feature] = { total: 0, actions: {} }
        }
        usage[feature].total++
        
        const action = event.properties?.action
        if (action) {
          usage[feature].actions[action] = (usage[feature].actions[action] || 0) + 1
        }
      }
    })

    return usage
  }

  /**
   * Flush metrics to external service
   */
  async flushMetrics() {
    if (this.metricsBuffer.length === 0) {
      return
    }

    try {
      // In production, send to analytics service (e.g., Mixpanel, Google Analytics)
      logger.info('Flushing metrics', { count: this.metricsBuffer.length })
      
      // Clear buffer after successful flush
      this.metricsBuffer = []
    } catch (error) {
      logger.error('Failed to flush metrics', error)
    }
  }

  /**
   * Send critical errors to external monitoring
   */
  async sendCriticalError(errorEvent) {
    try {
      // In production, send to error monitoring service (e.g., Sentry, Bugsnag)
      logger.error('Critical error detected', errorEvent)
    } catch (error) {
      logger.error('Failed to send critical error', error)
    }
  }

  /**
   * Start periodic metrics flushing
   */
  startFlushTimer() {
    setInterval(() => {
      this.flushMetrics()
    }, this.flushInterval)
  }

  /**
   * Get system health metrics
   */
  getSystemHealth() {
    const memoryUsage = process.memoryUsage()
    const uptime = process.uptime()

    return {
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        usage_percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      uptime_seconds: uptime,
      events_tracked: this.events.length,
      metrics_buffered: this.metricsBuffer.length,
      active_sessions: this.sessionData.size,
      timestamp: new Date().toISOString()
    }
  }
}

// Create singleton instance
const analytics = new AnalyticsService()

module.exports = analytics