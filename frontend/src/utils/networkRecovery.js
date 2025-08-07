/**
 * Network Recovery Utilities
 * Handles network failures and retry strategies
 */

import { healthApi } from '../services/api'

class NetworkRecovery {
  constructor() {
    this.isOnline = navigator.onLine
    this.retryAttempts = new Map()
    this.maxRetries = 3
    this.baseDelay = 1000 // 1 second
    this.maxDelay = 30000 // 30 seconds
    this.listeners = []
    
    this.setupEventListeners()
  }

  setupEventListeners() {
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
  }

  handleOnline() {
    this.isOnline = true
    console.log('🌐 Network connection restored')
    this.notifyListeners('online')
    this.retryFailedRequests()
  }

  handleOffline() {
    this.isOnline = false
    console.log('🔌 Network connection lost')
    this.notifyListeners('offline')
  }

  /**
   * Add network status listener
   */
  addListener(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status, this.isOnline)
      } catch (error) {
        console.error('Network listener error:', error)
      }
    })
  }

  /**
   * Exponential backoff delay calculation
   */
  calculateDelay(attempt) {
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt)
    const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5)
    return Math.min(jitteredDelay, this.maxDelay)
  }

  /**
   * Retry failed requests with exponential backoff
   */
  async retryWithBackoff(requestFn, key = null) {
    const requestKey = key || `request_${Date.now()}_${Math.random()}`
    const currentAttempts = this.retryAttempts.get(requestKey) || 0

    if (currentAttempts >= this.maxRetries) {
      this.retryAttempts.delete(requestKey)
      throw new Error(`Max retries (${this.maxRetries}) exceeded for request`)
    }

    try {
      const result = await requestFn()
      this.retryAttempts.delete(requestKey)
      return result
    } catch (error) {
      const newAttempts = currentAttempts + 1
      this.retryAttempts.set(requestKey, newAttempts)

      // If network is offline, don't retry immediately
      if (!this.isOnline) {
        throw new Error('Network is offline')
      }

      // Check if error is retryable
      if (!this.isRetryableError(error)) {
        this.retryAttempts.delete(requestKey)
        throw error
      }

      const delay = this.calculateDelay(currentAttempts)
      console.log(`🔄 Retrying request (attempt ${newAttempts}/${this.maxRetries}) after ${delay}ms`)

      await this.sleep(delay)
      return this.retryWithBackoff(requestFn, requestKey)
    }
  }

  /**
   * Determine if error is retryable
   */
  isRetryableError(error) {
    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      return true
    }

    // HTTP status codes that should be retried
    if (error.response) {
      const status = error.response.status
      return status === 408 || // Request Timeout
             status === 429 || // Too Many Requests
             status === 502 || // Bad Gateway
             status === 503 || // Service Unavailable
             status === 504    // Gateway Timeout
    }

    // Fetch API errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true
    }

    return false
  }

  /**
   * Sleep utility for delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Check network connectivity by pinging the server
   */
  async checkConnectivity() {
    try {
      const response = await healthApi.check()
      return response.status === 200
    } catch (error) {
      return false
    }
  }

  /**
   * Advanced connectivity check with multiple endpoints
   */
  async comprehensiveConnectivityCheck() {
    const endpoints = [
      healthApi.check,
      healthApi.ping,
      () => fetch('/', { method: 'HEAD', cache: 'no-cache', timeout: 5000 })
    ]

    const results = await Promise.allSettled(
      endpoints.map(endpointFn => endpointFn())
    )

    const successCount = results.filter(
      result => result.status === 'fulfilled' && 
      (result.value.status === 200 || result.value.ok)
    ).length

    const connectivityScore = successCount / endpoints.length
    const isConnected = connectivityScore > 0.5

    return {
      isConnected,
      connectivityScore,
      details: results.map((result, index) => ({
        endpoint: index === 0 ? '/api/health' : index === 1 ? '/api/ping' : '/',
        success: result.status === 'fulfilled' && 
        (result.value.status === 200 || result.value.ok),
        error: result.status === 'rejected' ? result.reason.message : null
      }))
    }
  }

  /**
   * Queue requests for offline execution
   */
  queueOfflineRequest(request) {
    const offlineQueue = this.getOfflineQueue()
    const queueItem = {
      id: `offline_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      request: {
        url: request.url,
        method: request.method,
        headers: request.headers,
        body: request.body
      }
    }

    offlineQueue.push(queueItem)
    this.saveOfflineQueue(offlineQueue)
    
    console.log(`📥 Queued offline request: ${request.method} ${request.url}`)
    return queueItem.id
  }

  /**
   * Process queued offline requests when back online
   */
  async retryFailedRequests() {
    const offlineQueue = this.getOfflineQueue()
    
    if (offlineQueue.length === 0) {
      return
    }

    console.log(`🔄 Processing ${offlineQueue.length} queued offline requests`)

    const processedRequests = []

    for (const queueItem of offlineQueue) {
      try {
        const response = await fetch(queueItem.request.url, {
          method: queueItem.request.method,
          headers: queueItem.request.headers,
          body: queueItem.request.body
        })

        if (response.ok) {
          processedRequests.push(queueItem.id)
          console.log(`✅ Successfully processed offline request: ${queueItem.request.method} ${queueItem.request.url}`)
        } else {
          console.warn(`⚠️ Failed to process offline request: ${response.status} ${queueItem.request.url}`)
        }
      } catch (error) {
        console.error(`❌ Error processing offline request:`, error)
      }
    }

    // Remove successfully processed requests
    const remainingQueue = offlineQueue.filter(
      item => !processedRequests.includes(item.id)
    )
    this.saveOfflineQueue(remainingQueue)

    console.log(`✅ Processed ${processedRequests.length} requests, ${remainingQueue.length} remaining`)
  }

  /**
   * Get offline queue from localStorage
   */
  getOfflineQueue() {
    try {
      const queue = localStorage.getItem('agrisphere_offline_queue')
      return queue ? JSON.parse(queue) : []
    } catch (error) {
      console.error('Error reading offline queue:', error)
      return []
    }
  }

  /**
   * Save offline queue to localStorage
   */
  saveOfflineQueue(queue) {
    try {
      localStorage.setItem('agrisphere_offline_queue', JSON.stringify(queue))
    } catch (error) {
      console.error('Error saving offline queue:', error)
    }
  }

  /**
   * Clear offline queue
   */
  clearOfflineQueue() {
    localStorage.removeItem('agrisphere_offline_queue')
  }

  /**
   * Get retry statistics
   */
  getRetryStats() {
    return {
      activeRetries: this.retryAttempts.size,
      queuedRequests: this.getOfflineQueue().length,
      isOnline: this.isOnline,
      maxRetries: this.maxRetries
    }
  }

  /**
   * Enhanced fetch with automatic retry and offline queueing
   */
  async enhancedFetch(url, options = {}) {
    const requestKey = `${options.method || 'GET'}_${url}`
    
    // If offline and request should be queued
    if (!this.isOnline && options.queueWhenOffline !== false) {
      return this.queueOfflineRequest({ url, ...options })
    }

    // Try request with retry logic
    return this.retryWithBackoff(async () => {
      const response = await fetch(url, options)
      
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
        error.response = response
        throw error
      }
      
      return response
    }, requestKey)
  }

  /**
   * Monitor network quality
   */
  async monitorNetworkQuality() {
    if (!this.isOnline) {
      return { quality: 'offline', latency: null, speed: null }
    }

    const startTime = Date.now()
    
    try {
      const response = await healthApi.ping()
      
      const latency = Date.now() - startTime
      
      let quality = 'good'
      if (latency > 2000) quality = 'poor'
      else if (latency > 1000) quality = 'fair'
      
      return {
        quality,
        latency,
        timestamp: Date.now()
      }
    } catch (error) {
      return { quality: 'error', latency: null, error: error.message }
    }
  }
}

// Create singleton instance
const networkRecovery = new NetworkRecovery()

export default networkRecovery