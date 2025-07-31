import { motion } from 'framer-motion'
import { 
  ArrowDownTrayIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { useOffline } from '../../contexts/OfflineContext'

const UpdatePrompt = () => {
  const { isUpdateAvailable, updateApp, isUpdating } = useOffline()

  if (!isUpdateAvailable) return null

  const handleUpdate = () => {
    updateApp()
  }

  const handleDismiss = () => {
    // You can implement logic to dismiss the update prompt
    // For now, we'll keep it persistent until the user updates
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-4 left-4 right-4 z-50 safe-bottom"
    >
      <div className="max-w-md mx-auto bg-gradient-to-r from-sky-500 to-primary-500 text-white rounded-3xl shadow-strong overflow-hidden">
        <div className="relative p-4">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,_white_2px,_transparent_2px),radial-gradient(circle_at_70%_30%,_white_2px,_transparent_2px)] bg-[length:30px_30px]" />
          </div>

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>

          <div className="relative flex items-center space-x-3">
            {/* Update Icon */}
            <motion.div
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="flex-shrink-0"
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <SparklesIcon className="w-6 h-6" />
              </div>
            </motion.div>

            {/* Update Message */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm mb-1">
                New Update Available! ✨
              </h3>
              <p className="text-xs opacity-90 leading-relaxed">
                We've improved your farming experience with new features and bug fixes.
              </p>
            </div>

            {/* Update Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUpdate}
              disabled={isUpdating}
              className={`
                flex-shrink-0 px-4 py-2 bg-white text-sky-600 rounded-2xl font-semibold text-sm
                ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}
                transition-all duration-200 flex items-center space-x-2
              `}
            >
              {isUpdating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-sky-600 border-t-transparent rounded-full"
                  />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span>Update</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Progress Bar */}
          {isUpdating && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden"
            >
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="h-full w-1/3 bg-white/60 rounded-full"
              />
            </motion.div>
          )}

          {/* New Features Highlight */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 pt-3 border-t border-white/20"
          >
            <p className="text-xs opacity-80 mb-2 font-medium">What's New:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-1">
                <span>🚀</span>
                <span className="opacity-90">Faster loading</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🔧</span>
                <span className="opacity-90">Bug fixes</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>📱</span>
                <span className="opacity-90">Better mobile</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🌟</span>
                <span className="opacity-90">New features</span>
              </div>
            </div>
          </motion.div>

          {/* Floating Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0,
                  x: Math.random() * 200 - 100,
                  y: 50 
                }}
                animate={{
                  opacity: [0, 0.6, 0],
                  y: -50,
                  x: Math.random() * 50 - 25
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                  ease: 'easeOut'
                }}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${20 + (i * 15)}%`,
                  bottom: '10%'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default UpdatePrompt