import axios from 'axios'
import cacheService from './cacheService'

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
const REQUEST_TIMEOUT = 15000 // 15 seconds
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Cacheable endpoints with their categories
const CACHEABLE_ENDPOINTS = {
  '/dashboard/overview': 'dashboard',
  '/dashboard/weather': 'weather',
  '/auth/profile': 'profile',
  '/farm': 'farm',
  '/irrigation': 'irrigation',
  '/planning': 'planning',
}

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor for adding auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('agrisphere_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          console.log('Adding auth token to request:', config.url)
        } else {
          console.log('No auth token found for request:', config.url)
        }
        
        // Add request timestamp for tracking
        config.metadata = { startTime: Date.now() }
        
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor for handling errors and retries
    this.client.interceptors.response.use(
      (response) => {
        // Log response time
        const responseTime = Date.now() - response.config.metadata.startTime
        console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${responseTime}ms`)
        console.log('Response status:', response.status)
        console.log('Response data:', response.data)
        
        return response
      },
      async (error) => {
        const originalRequest = error.config

        // Handle network errors with retry logic
        if (this.isNetworkError(error) && !originalRequest._retry) {
          return this.retryRequest(originalRequest)
        }

        // Handle 401 errors (unauthorized) - but not for auth endpoints
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Don't attempt token refresh for login/register endpoints
          const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                                originalRequest.url?.includes('/auth/register') ||
                                originalRequest.url?.includes('/auth/forgot-password') ||
                                originalRequest.url?.includes('/auth/reset-password');
          
          if (!isAuthEndpoint) {
            originalRequest._retry = true
            
            try {
              await this.refreshToken()
              // Retry the original request with new token
              const token = localStorage.getItem('agrisphere_token')
              if (token) {
                originalRequest.headers.Authorization = `Bearer ${token}`
                return this.client(originalRequest)
              }
            } catch (refreshError) {
              // Refresh failed, redirect to login
              this.handleAuthError()
              return Promise.reject(refreshError)
            }
          }
        }

        // Handle other errors
        return this.handleError(error)
      }
    )
  }

  // Network error detection
  isNetworkError(error) {
    return !error.response && (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'ECONNABORTED' ||
      error.message === 'Network Error' ||
      error.message.includes('timeout')
    )
  }

  // Retry logic for failed requests
  async retryRequest(config, attempt = 1) {
    if (attempt > MAX_RETRIES) {
      throw new Error('Max retries exceeded')
    }

    // Exponential backoff
    const delay = RETRY_DELAY * Math.pow(2, attempt - 1)
    await new Promise(resolve => setTimeout(resolve, delay))

    console.log(`Retrying request (attempt ${attempt}/${MAX_RETRIES}):`, config.url)

    try {
      config._retry = true
      return await this.client(config)
    } catch (error) {
      if (this.isNetworkError(error)) {
        return this.retryRequest(config, attempt + 1)
      }
      throw error
    }
  }

  // Error handling
  handleError(error) {
    const errorInfo = {
      message: 'An unexpected error occurred',
      status: null,
      data: null
    }

    if (error.response) {
      // Server responded with error status
      errorInfo.status = error.response.status
      errorInfo.data = error.response.data
      errorInfo.message = error.response.data?.message || `Server error (${error.response.status})`
    } else if (error.request) {
      // Request was made but no response received
      errorInfo.message = 'Network error. Please check your connection.'
    } else {
      // Something else happened
      errorInfo.message = error.message
    }

    console.error('API Error:', errorInfo)
    return Promise.reject(errorInfo)
  }

  // Auth error handling
  handleAuthError() {
    localStorage.removeItem('agrisphere_token')
    // In a real app, you might want to redirect to login
    // window.location.href = '/login'
    console.log('Authentication failed, token removed')
  }

  // Token refresh
  async refreshToken() {
    const token = localStorage.getItem('agrisphere_token')
    if (!token) {
      throw new Error('No token available for refresh')
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data?.token) {
        localStorage.setItem('agrisphere_token', response.data.token)
        return response.data.token
      } else {
        throw new Error('Invalid refresh response')
      }
    } catch (error) {
      localStorage.removeItem('agrisphere_token')
      throw error
    }
  }

  // Set auth token
  setAuthToken(token) {
    if (token) {
      this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete this.client.defaults.headers.common['Authorization']
    }
  }

  // Clear auth token
  clearAuthToken() {
    delete this.client.defaults.headers.common['Authorization']
  }

  // Generic HTTP methods with caching
  async get(url, config = {}) {
    const cacheKey = this.getCacheKey('GET', url, config)
    const category = this.getCacheCategory(url)
    
    // Skip cache if explicitly disabled
    if (config.skipCache) {
      return this.client.get(url, config)
    }
    
    // Try to get from cache first
    if (category) {
      try {
        const cachedData = await cacheService.get(cacheKey, category)
        if (cachedData) {
          console.log('API: Serving from cache:', url)
          return { data: cachedData }
        }
      } catch (error) {
        console.warn('Cache get failed:', error)
      }
    }
    
    // Make network request
    try {
      const response = await this.client.get(url, config)
      
      // Cache successful responses
      if (category && response.data) {
        try {
          await cacheService.set(cacheKey, response.data, category)
          console.log('API: Cached response:', url)
        } catch (error) {
          console.warn('Cache set failed:', error)
        }
      }
      
      return response
    } catch (error) {
      // Try to serve stale cache on network error
      if (category && this.isNetworkError(error)) {
        try {
          const staleData = await cacheService.get(cacheKey, category)
          if (staleData) {
            console.log('API: Serving stale cache due to network error:', url)
            return { 
              data: { 
                ...staleData, 
                _stale: true, 
                _cached: true 
              } 
            }
          }
        } catch (cacheError) {
          console.warn('Stale cache get failed:', cacheError)
        }
      }
      
      throw error
    }
  }

  async post(url, data = {}, config = {}) {
    return this.client.post(url, data, config)
  }

  async put(url, data = {}, config = {}) {
    return this.client.put(url, data, config)
  }

  async patch(url, data = {}, config = {}) {
    return this.client.patch(url, data, config)
  }

  async delete(url, config = {}) {
    return this.client.delete(url, config)
  }

  // File upload with progress
  async uploadFile(url, file, onProgress = null) {
    const formData = new FormData()
    formData.append('file', file)

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(progress)
      }
    }

    return this.client.post(url, formData, config)
  }

  // Download file
  async downloadFile(url, filename = null) {
    try {
      const response = await this.client.get(url, {
        responseType: 'blob',
      })

      // Create download link
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)

      return response
    } catch (error) {
      console.error('Download failed:', error)
      throw error
    }
  }

  // Offline support - cache request for later sync
  cacheForOfflineSync(method, url, data = null) {
    const request = {
      method,
      url,
      data,
      timestamp: Date.now(),
      id: Date.now().toString()
    }

    const cachedRequests = JSON.parse(localStorage.getItem('agrisphere_offline_requests') || '[]')
    cachedRequests.push(request)
    localStorage.setItem('agrisphere_offline_requests', JSON.stringify(cachedRequests))

    return request.id
  }

  // Sync cached offline requests
  async syncOfflineRequests() {
    const cachedRequests = JSON.parse(localStorage.getItem('agrisphere_offline_requests') || '[]')
    
    if (cachedRequests.length === 0) {
      return { success: true, synced: 0, failed: 0 }
    }

    let synced = 0
    let failed = 0
    const failedRequests = []

    for (const request of cachedRequests) {
      try {
        await this.client({
          method: request.method,
          url: request.url,
          data: request.data
        })
        synced++
      } catch (error) {
        console.error('Failed to sync offline request:', request, error)
        failedRequests.push(request)
        failed++
      }
    }

    // Keep only failed requests for retry
    localStorage.setItem('agrisphere_offline_requests', JSON.stringify(failedRequests))

    return { success: true, synced, failed }
  }

  // Check API health
  async checkHealth() {
    try {
      const response = await this.get('/health')
      return {
        status: 'healthy',
        data: response.data
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      }
    }
  }

  // Get API info
  async getApiInfo() {
    try {
      const response = await this.get('/')
      return response.data
    } catch (error) {
      console.error('Failed to get API info:', error)
      return null
    }
  }

  // Cache helper methods
  getCacheKey(method, url, config = {}) {
    const params = config.params ? JSON.stringify(config.params) : ''
    return `${method}:${url}:${params}`
  }

  getCacheCategory(url) {
    for (const [endpoint, category] of Object.entries(CACHEABLE_ENDPOINTS)) {
      if (url.includes(endpoint)) {
        return category
      }
    }
    return null
  }

  // Cache invalidation methods
  async invalidateCache(pattern) {
    try {
      await cacheService.invalidate(pattern)
      console.log('Cache invalidated:', pattern)
    } catch (error) {
      console.warn('Cache invalidation failed:', error)
    }
  }

  async clearCache() {
    try {
      await cacheService.clear()
      console.log('All cache cleared')
    } catch (error) {
      console.warn('Cache clearing failed:', error)
    }
  }
}

// Create singleton instance
export const apiService = new ApiService()

// Specific API endpoints for different features
export const authApi = {
  login: (phoneNumber, password) => apiService.post('/auth/login', { phoneNumber, password }),
  register: (userData) => apiService.post('/auth/register', userData),
  logout: () => apiService.post('/auth/logout'),
  getProfile: () => apiService.get('/auth/me'),
  updateProfile: (data) => apiService.put('/auth/profile', data),
  forgotPassword: (phoneNumber) => apiService.post('/auth/forgot-password', { phoneNumber }),
  resetPassword: (token, newPassword) => apiService.post('/auth/reset-password', { token, newPassword }),
  refreshToken: () => apiService.post('/auth/refresh-token'),
}

export const farmApi = {
  getFarms: (params = {}) => apiService.get('/farm', { params }),
  getFarm: (farmId) => apiService.get(`/farm/${farmId}`),
  createFarm: (farmData) => apiService.post('/farm', farmData),
  updateFarm: (farmId, farmData) => apiService.put(`/farm/${farmId}`, farmData),
  deleteFarm: (farmId) => apiService.delete(`/farm/${farmId}`),
  addField: (farmId, fieldData) => apiService.post(`/farm/${farmId}/fields`, fieldData),
  getSoilAnalysis: (farmId) => apiService.get(`/farm/${farmId}/soil-analysis`),
  getAnalytics: (farmId, timeRange) => apiService.get(`/farm/${farmId}/analytics`, { params: { timeRange } }),
  getNearby: (lat, lon, radius) => apiService.get(`/farm/nearby/${lat}/${lon}`, { params: { radius } }),
}

export const diagnosisApi = {
  getDiagnoses: (params = {}) => apiService.get('/diagnosis', { params }),
  getDiagnosis: (diagnosisId) => apiService.get(`/diagnosis/${diagnosisId}`),
  createDiagnosis: (diagnosisData) => apiService.post('/diagnosis', diagnosisData),
  updateTreatment: (diagnosisId, treatmentData) => apiService.put(`/diagnosis/${diagnosisId}/treatment`, treatmentData),
  addProgress: (diagnosisId, progressData) => apiService.post(`/diagnosis/${diagnosisId}/progress`, progressData),
  getStats: (timeRange) => apiService.get('/diagnosis/stats/overview', { params: { timeRange } }),
  getConditions: (cropName) => apiService.get(`/diagnosis/conditions/${cropName}`),
}

export const irrigationApi = {
  getRecommendation: (requestData) => apiService.post('/irrigation/recommend', requestData),
  implement: (logId, implementationData) => apiService.put(`/irrigation/${logId}/implement`, implementationData),
  getLogs: (params = {}) => apiService.get('/irrigation', { params }),
  getSchedule: (farmId, days) => apiService.get(`/irrigation/schedule/${farmId}`, { params: { days } }),
  getAnalytics: (farmId, timeRange) => apiService.get(`/irrigation/analytics/${farmId}`, { params: { timeRange } }),
  getStats: (params = {}) => apiService.get('/irrigation/stats', { params }),
}

export const planningApi = {
  createCropPlan: (planData) => apiService.post('/planning/crop-plan', planData),
  getRecommendations: (farmId, season) => apiService.get(`/planning/recommendations/${farmId}`, { params: { season } }),
  createRotation: (rotationData) => apiService.post('/planning/rotation', rotationData),
  getCalendar: (farmId, year, months) => apiService.get(`/planning/calendar/${farmId}`, { params: { year, months } }),
  getHarvestPlanning: (farmId, timeRange) => apiService.get(`/planning/harvest/${farmId}`, { params: { timeRange } }),
}

export const dashboardApi = {
  getOverview: () => apiService.get('/dashboard/overview'),
  getWeather: () => apiService.get('/dashboard/weather'),
  getTasks: () => apiService.get('/dashboard/tasks'),
  completeTask: (taskId) => apiService.post(`/dashboard/task/${taskId}/complete`),
  getProgress: () => apiService.get('/dashboard/progress'),
  getInsights: () => apiService.get('/dashboard/insights'),
}

export const onboardingApi = {
  update: (data) => apiService.put('/onboarding/update', data),
  complete: (data) => apiService.post('/onboarding/complete', data),
  geocode: (params) => apiService.get('/onboarding/geocode', { params }),
}

export const healthApi = {
  check: () => apiService.get('/health'),
  ping: () => apiService.get('/ping'),
}

export const errorApi = {
  report: (errorData) => apiService.post('/errors/report', errorData),
}

export default apiService