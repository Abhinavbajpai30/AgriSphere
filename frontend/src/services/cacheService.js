/**
 * Client-side API response caching service
 * Provides intelligent caching with TTL and offline support
 */

class CacheService {
  constructor() {
    this.cache = new Map()
    this.ttlMap = new Map()
    this.maxCacheSize = 100 // Maximum number of cached items
    
    // Default TTL values in milliseconds
    this.defaultTTL = {
      weather: 10 * 60 * 1000,      // 10 minutes
      dashboard: 5 * 60 * 1000,     // 5 minutes
      profile: 30 * 60 * 1000,      // 30 minutes
      farm: 15 * 60 * 1000,         // 15 minutes
      irrigation: 20 * 60 * 1000,   // 20 minutes
      planning: 60 * 60 * 1000,     // 1 hour
      diagnosis: 5 * 60 * 1000,     // 5 minutes
      auth: 60 * 60 * 1000,         // 1 hour
    }
    
    // Initialize IndexedDB for persistent caching
    this.initIndexedDB()
  }

  /**
   * Initialize IndexedDB for offline storage
   */
  async initIndexedDB() {
    try {
      this.db = await this.openDB('AgriSphereCache', 1)
    } catch (error) {
      console.warn('Failed to initialize IndexedDB:', error)
      this.db = null
    }
  }

  /**
   * Open IndexedDB database
   */
  openDB(name, version) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, version)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // Create object stores
        if (!db.objectStoreNames.contains('apiCache')) {
          const store = db.createObjectStore('apiCache', { keyPath: 'key' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('category', 'category', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('offlineQueue')) {
          db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true })
        }
      }
    })
  }

  /**
   * Get cached data for a key
   */
  async get(key, category = 'default') {
    // Check memory cache first
    const memoryData = this.getFromMemory(key)
    if (memoryData && !this.isExpired(key)) {
      return memoryData
    }

    // Check IndexedDB for persistent cache
    if (this.db) {
      try {
        const persistentData = await this.getFromIndexedDB(key)
        if (persistentData && !this.isExpiredPersistent(persistentData)) {
          // Restore to memory cache
          this.setInMemory(key, persistentData.data, this.getTTL(category))
          return persistentData.data
        }
      } catch (error) {
        console.warn('Failed to get from IndexedDB:', error)
      }
    }

    return null
  }

  /**
   * Set cached data for a key
   */
  async set(key, data, category = 'default', ttl = null) {
    const finalTTL = ttl || this.getTTL(category)
    
    // Set in memory cache
    this.setInMemory(key, data, finalTTL)
    
    // Set in IndexedDB for persistence
    if (this.db) {
      try {
        await this.setInIndexedDB(key, data, category, finalTTL)
      } catch (error) {
        console.warn('Failed to set in IndexedDB:', error)
      }
    }
    
    // Manage cache size
    this.manageCacheSize()
  }

  /**
   * Invalidate cache for a key or pattern
   */
  async invalidate(keyOrPattern) {
    if (typeof keyOrPattern === 'string') {
      // Single key
      this.cache.delete(keyOrPattern)
      this.ttlMap.delete(keyOrPattern)
      
      if (this.db) {
        try {
          await this.deleteFromIndexedDB(keyOrPattern)
        } catch (error) {
          console.warn('Failed to delete from IndexedDB:', error)
        }
      }
    } else if (keyOrPattern instanceof RegExp) {
      // Pattern-based invalidation
      const keysToDelete = []
      
      for (const key of this.cache.keys()) {
        if (keyOrPattern.test(key)) {
          keysToDelete.push(key)
        }
      }
      
      for (const key of keysToDelete) {
        await this.invalidate(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    this.cache.clear()
    this.ttlMap.clear()
    
    if (this.db) {
      try {
        const transaction = this.db.transaction(['apiCache'], 'readwrite')
        const store = transaction.objectStore('apiCache')
        await store.clear()
      } catch (error) {
        console.warn('Failed to clear IndexedDB:', error)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const memorySize = this.cache.size
    const memoryKeys = Array.from(this.cache.keys())
    const expiredKeys = memoryKeys.filter(key => this.isExpired(key))
    
    return {
      memorySize,
      expiredKeys: expiredKeys.length,
      validKeys: memorySize - expiredKeys.length,
      totalSize: this.calculateMemoryUsage()
    }
  }

  // Private methods

  /**
   * Get from memory cache
   */
  getFromMemory(key) {
    return this.cache.get(key)
  }

  /**
   * Set in memory cache
   */
  setInMemory(key, data, ttl) {
    this.cache.set(key, data)
    this.ttlMap.set(key, Date.now() + ttl)
  }

  /**
   * Get from IndexedDB
   */
  getFromIndexedDB(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['apiCache'], 'readonly')
      const store = transaction.objectStore('apiCache')
      const request = store.get(key)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  /**
   * Set in IndexedDB
   */
  setInIndexedDB(key, data, category, ttl) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['apiCache'], 'readwrite')
      const store = transaction.objectStore('apiCache')
      
      const cacheItem = {
        key,
        data,
        category,
        timestamp: Date.now(),
        ttl,
        expiresAt: Date.now() + ttl
      }
      
      const request = store.put(cacheItem)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  /**
   * Delete from IndexedDB
   */
  deleteFromIndexedDB(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['apiCache'], 'readwrite')
      const store = transaction.objectStore('apiCache')
      const request = store.delete(key)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  /**
   * Check if memory cache item is expired
   */
  isExpired(key) {
    const expiryTime = this.ttlMap.get(key)
    return !expiryTime || Date.now() > expiryTime
  }

  /**
   * Check if persistent cache item is expired
   */
  isExpiredPersistent(cacheItem) {
    return Date.now() > cacheItem.expiresAt
  }

  /**
   * Get TTL for category
   */
  getTTL(category) {
    return this.defaultTTL[category] || this.defaultTTL.default || 5 * 60 * 1000
  }

  /**
   * Manage cache size to prevent memory issues
   */
  manageCacheSize() {
    if (this.cache.size <= this.maxCacheSize) return
    
    // Remove expired items first
    const expiredKeys = []
    for (const [key, expiryTime] of this.ttlMap.entries()) {
      if (Date.now() > expiryTime) {
        expiredKeys.push(key)
      }
    }
    
    for (const key of expiredKeys) {
      this.cache.delete(key)
      this.ttlMap.delete(key)
    }
    
    // If still over limit, remove oldest items
    if (this.cache.size > this.maxCacheSize) {
      const entries = Array.from(this.ttlMap.entries())
      entries.sort((a, b) => a[1] - b[1]) // Sort by expiry time
      
      const toRemove = entries.slice(0, this.cache.size - this.maxCacheSize)
      for (const [key] of toRemove) {
        this.cache.delete(key)
        this.ttlMap.delete(key)
      }
    }
  }

  /**
   * Calculate approximate memory usage
   */
  calculateMemoryUsage() {
    let size = 0
    for (const [key, value] of this.cache.entries()) {
      size += JSON.stringify({ key, value }).length
    }
    return size
  }

  /**
   * Clean up expired items periodically
   */
  startCleanupTimer() {
    setInterval(() => {
      this.manageCacheSize()
    }, 5 * 60 * 1000) // Clean up every 5 minutes
  }
}

// Create singleton instance
const cacheService = new CacheService()

// Start cleanup timer
cacheService.startCleanupTimer()

export default cacheService