import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DevicePhoneMobileIcon,
  XMarkIcon,
  ArrowDownIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import { useOffline } from '../../contexts/OfflineContext'

const PWAPrompt = () => {
  const { canInstallPWA, installPWA, isPWAInstalled } = useOffline()
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Check if user has already dismissed the prompt
  useEffect(() => {
    const dismissed = localStorage.getItem('agrisphere_pwa_dismissed')
    if (dismissed) {
      setDismissed(true)
    }
  }, [])

  // Show prompt after a delay if PWA can be installed
  useEffect(() => {
    if (canInstallPWA && !dismissed && !isPWAInstalled) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 5000) // Show after 5 seconds

      return () => clearTimeout(timer)
    }
  }, [canInstallPWA, dismissed, isPWAInstalled])

  const handleInstall = async () => {
    const success = await installPWA()
    if (success) {
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('agrisphere_pwa_dismissed', 'true')
  }

  const handleRemindLater = () => {
    setShowPrompt(false)
    // Set reminder for 24 hours
    setTimeout(() => {
      if (!isPWAInstalled) {
        setShowPrompt(true)
      }
    }, 24 * 60 * 60 * 1000)
  }

  if (!showPrompt || isPWAInstalled) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      >
        <motion.div
          initial={{ y: 100, scale: 0.95, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 100, scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4">
              <motion.div
                animate={{ 
                  bounceY: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center"
              >
                <span className="text-3xl">📱</span>
              </motion.div>

              <div>
                <h2 className="text-xl font-bold mb-1">
                  Install AgriSphere
                </h2>
                <p className="text-sm opacity-90">
                  Get the full farming experience
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4 mb-6">
              {/* Benefits */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">🚀</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Faster Access</p>
                    <p className="text-xs text-gray-600">Launch instantly from your home screen</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">📶</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Works Offline</p>
                    <p className="text-xs text-gray-600">Access features without internet</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">🔔</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">Smart Notifications</p>
                    <p className="text-xs text-gray-600">Get farming reminders and updates</p>
                  </div>
                </div>
              </div>

              {/* Installation Instructions */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <h3 className="font-semibold text-gray-800 text-sm mb-2 flex items-center">
                  <DevicePhoneMobileIcon className="w-4 h-4 mr-2" />
                  How to Install
                </h3>
                
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>Tap the "Install" button below</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>Confirm installation in the popup</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>Find AgriSphere on your home screen</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleInstall}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center space-x-2"
              >
                <ArrowDownIcon className="w-5 h-5" />
                <span>Install AgriSphere</span>
              </motion.button>

              <div className="flex space-x-3">
                <button
                  onClick={handleRemindLater}
                  className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-2xl hover:bg-gray-200 transition-colors text-sm"
                >
                  Remind Later
                </button>
                <button
                  onClick={handleDismiss}
                  className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-2xl hover:bg-gray-200 transition-colors text-sm"
                >
                  Not Now
                </button>
              </div>
            </div>

            {/* Alternative Installation */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center mb-2">
                Having trouble? Try manual installation:
              </p>
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-600">
                <ShareIcon className="w-4 h-4" />
                <span>Browser menu → "Add to Home Screen"</span>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-4 left-4 text-xl opacity-20">🌾</div>
          <div className="absolute bottom-4 right-4 text-xl opacity-20">🚜</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PWAPrompt