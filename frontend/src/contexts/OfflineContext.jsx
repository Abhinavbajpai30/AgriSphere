import { createContext, useContext, useState, useEffect } from 'react'
import { Workbox } from 'workbox-window'

const OfflineContext = createContext()

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isPWAInstalled, setIsPWAInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [syncQueue, setSyncQueue] = useState([])
  const [offlineData, setOfflineData] = useState({})
  const [workbox, setWorkbox] = useState(null)

  // Initialize service worker and PWA functionality
  useEffect(() => {
    initializeServiceWorker()
    setupPWAListeners()
    loadOfflineData()
  }, [])

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      syncOfflineData()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const initializeServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const wb = new Workbox('/sw.js')
        setWorkbox(wb)

        // Listen for service worker updates
        wb.addEventListener('waiting', () => {
          setIsUpdateAvailable(true)
        })

        wb.addEventListener('controlling', () => {
          setIsUpdateAvailable(false)
          setIsUpdating(false)
          // Reload page to get fresh content
          window.location.reload()
        })

        wb.addEventListener('installed', (event) => {
          if (event.isUpdate) {
            console.log('New version installed, update available')
          } else {
            console.log('Service worker installed for the first time')
          }
        })

        // Register the service worker
        await wb.register()
        console.log('Service Worker registered successfully')
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  }

  const setupPWAListeners = () => {
    // Listen for PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    })

    // Check if app is already installed
    window.addEventListener('appinstalled', () => {
      setIsPWAInstalled(true)
      setDeferredPrompt(null)
    })

    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPWAInstalled(true)
    }
  }

  const loadOfflineData = () => {
    try {
      const stored = localStorage.getItem('agrisphere_offline_data')
      if (stored) {
        setOfflineData(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Failed to load offline data:', error)
    }
  }

  const saveOfflineData = (key, data) => {
    try {
      const newOfflineData = { ...offlineData, [key]: data }
      setOfflineData(newOfflineData)
      localStorage.setItem('agrisphere_offline_data', JSON.stringify(newOfflineData))
    } catch (error) {
      console.error('Failed to save offline data:', error)
    }
  }

  const getOfflineData = (key) => {
    return offlineData[key] || null
  }

  const clearOfflineData = (key = null) => {
    if (key) {
      const newOfflineData = { ...offlineData }
      delete newOfflineData[key]
      setOfflineData(newOfflineData)
      localStorage.setItem('agrisphere_offline_data', JSON.stringify(newOfflineData))
    } else {
      setOfflineData({})
      localStorage.removeItem('agrisphere_offline_data')
    }
  }

  const addToSyncQueue = (action) => {
    const newQueue = [...syncQueue, { ...action, timestamp: Date.now() }]
    setSyncQueue(newQueue)
    localStorage.setItem('agrisphere_sync_queue', JSON.stringify(newQueue))
  }

  const syncOfflineData = async () => {
    if (!isOnline || syncQueue.length === 0) return

    console.log('Syncing offline data...', syncQueue.length, 'items')

    const successfulSyncs = []
    
    for (const action of syncQueue) {
      try {
        // Execute the queued action
        await executeQueuedAction(action)
        successfulSyncs.push(action)
      } catch (error) {
        console.error('Failed to sync action:', action, error)
        // Keep failed actions in queue for retry
      }
    }

    // Remove successfully synced actions
    const remainingQueue = syncQueue.filter(
      action => !successfulSyncs.includes(action)
    )
    
    setSyncQueue(remainingQueue)
    localStorage.setItem('agrisphere_sync_queue', JSON.stringify(remainingQueue))

    if (successfulSyncs.length > 0) {
      console.log(`Successfully synced ${successfulSyncs.length} items`)
    }
  }

  const executeQueuedAction = async (action) => {
    // This would contain the actual API calls to sync data
    // For now, just simulate the sync
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Synced action:', action.type)
        resolve()
      }, 100)
    })
  }

  const installPWA = async () => {
    if (!deferredPrompt) return false

    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setIsPWAInstalled(true)
        setDeferredPrompt(null)
        return true
      }
      
      return false
    } catch (error) {
      console.error('PWA installation failed:', error)
      return false
    }
  }

  const updateApp = async () => {
    if (!workbox || !isUpdateAvailable) return

    setIsUpdating(true)
    
    try {
      // Tell the waiting service worker to skip waiting and become active
      if (workbox.waiting) {
        workbox.messageSkipWaiting()
      }
    } catch (error) {
      console.error('App update failed:', error)
      setIsUpdating(false)
    }
  }

  const getConnectionInfo = () => {
    if (!navigator.connection) {
      return { effectiveType: 'unknown', downlink: 0, rtt: 0 }
    }

    return {
      effectiveType: navigator.connection.effectiveType,
      downlink: navigator.connection.downlink,
      rtt: navigator.connection.rtt,
      saveData: navigator.connection.saveData
    }
  }

  const isSlowConnection = () => {
    const connection = getConnectionInfo()
    return connection.effectiveType === '2g' || 
           connection.effectiveType === 'slow-2g' ||
           connection.saveData
  }

  // Cache management
  const clearCache = async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
        console.log('All caches cleared')
      } catch (error) {
        console.error('Failed to clear cache:', error)
      }
    }
  }

  const getCacheSize = async () => {
    if ('caches' in window && 'storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        return {
          used: estimate.usage || 0,
          available: estimate.quota || 0,
          percentage: estimate.quota ? (estimate.usage / estimate.quota * 100).toFixed(1) : 0
        }
      } catch (error) {
        console.error('Failed to get cache size:', error)
        return { used: 0, available: 0, percentage: 0 }
      }
    }
    return { used: 0, available: 0, percentage: 0 }
  }

  const value = {
    // Online/Offline state
    isOnline,
    isSlowConnection: isSlowConnection(),
    connectionInfo: getConnectionInfo(),
    
    // PWA state
    isPWAInstalled,
    canInstallPWA: !!deferredPrompt,
    installPWA,
    
    // App updates
    isUpdateAvailable,
    isUpdating,
    updateApp,
    
    // Offline data management
    saveOfflineData,
    getOfflineData,
    clearOfflineData,
    
    // Sync queue
    syncQueue: syncQueue.length,
    addToSyncQueue,
    syncOfflineData,
    
    // Cache management
    clearCache,
    getCacheSize,
    
    // Utility functions
    getConnectionInfo
  }

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  )
}

export const useOffline = () => {
  const context = useContext(OfflineContext)
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider')
  }
  return context
}

export default OfflineContext