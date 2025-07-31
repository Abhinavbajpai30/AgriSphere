import { motion } from 'framer-motion'
import { useLanguage } from '../../contexts/LanguageContext'

const LoadingScreen = ({ 
  message = null, 
  fullScreen = true, 
  showLogo = true,
  showProgress = false,
  progress = 0 
}) => {
  const { t } = useLanguage()

  const loadingMessages = [
    'Preparing your farming assistant...',
    'Loading crop data...',
    'Connecting to agricultural insights...',
    'Setting up your dashboard...',
    'Gathering weather information...',
    'Optimizing for your region...'
  ]

  const displayMessage = message || t('loading') || 'Loading...'

  const containerClass = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-orange-50'
    : 'flex items-center justify-center p-8'

  return (
    <div className={containerClass}>
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary-200 rounded-full mix-blend-multiply"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-sky-200 rounded-full mix-blend-multiply"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -180, -360],
            opacity: [0.12, 0.22, 0.12]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute top-1/2 left-1/2 w-36 h-36 bg-orange-200 rounded-full mix-blend-multiply transform -translate-x-1/2 -translate-y-1/2"
        />
      </div>

      <div className="relative z-10 text-center max-w-sm mx-auto">
        {/* Logo Section */}
        {showLogo && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 200, 
              damping: 15,
              duration: 0.8 
            }}
            className="mb-8"
          >
            <div className="relative mx-auto w-24 h-24">
              {/* Main Logo */}
              <motion.div
                animate={{ 
                  rotateY: [0, 360],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center shadow-lg"
              >
                <span className="text-4xl">🌾</span>
              </motion.div>

              {/* Orbiting Elements */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0"
              >
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-sky-400 rounded-full shadow-lg">
                  <span className="text-xs">💧</span>
                </div>
              </motion.div>

              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0"
              >
                <div className="absolute -bottom-2 right-0 w-5 h-5 bg-orange-400 rounded-full shadow-lg">
                  <span className="text-xs">☀️</span>
                </div>
              </motion.div>

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0"
              >
                <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-4 h-4 bg-earth-400 rounded-full">
                  <span className="absolute inset-0 flex items-center justify-center text-xs">🌱</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Loading Spinner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="relative mx-auto w-16 h-16">
            {/* Spinning Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 border-4 border-transparent border-t-primary-500 border-r-primary-300 rounded-full"
            />
            
            {/* Inner Ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-2 border-2 border-transparent border-t-sky-400 border-l-sky-200 rounded-full"
            />

            {/* Center Dot */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-6 bg-gradient-primary rounded-full"
            />
          </div>
        </motion.div>

        {/* Progress Bar */}
        {showProgress && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '100%' }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ type: 'spring', stiffness: 100 }}
                className="h-full bg-gradient-primary rounded-full relative overflow-hidden"
              >
                {/* Shimmer effect */}
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </motion.div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{progress}% Complete</p>
          </motion.div>
        )}

        {/* Loading Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-4"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {displayMessage}
          </h2>
          
          {/* Animated dots */}
          <motion.div className="flex justify-center space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut'
                }}
                className="w-2 h-2 bg-primary-400 rounded-full"
              />
            ))}
          </motion.div>
        </motion.div>

        {/* Helpful Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-sm text-gray-600"
        >
          <motion.p
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            💡 Tip: Make sure you have good lighting for crop photos
          </motion.p>
        </motion.div>

        {/* Fun Loading Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Floating Emojis */}
          {['🌱', '🚜', '💧', '☀️', '🌾', '🍃'].map((emoji, index) => (
            <motion.div
              key={emoji}
              initial={{ 
                opacity: 0,
                x: Math.random() * 400 - 200,
                y: Math.random() * 400 - 200 
              }}
              animate={{
                opacity: [0, 0.3, 0],
                y: [0, -100],
                rotate: [0, 360]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: index * 0.8,
                ease: 'easeOut'
              }}
              className="absolute text-2xl"
              style={{
                left: `${20 + (index * 15)}%`,
                top: `${30 + (index * 10)}%`
              }}
            >
              {emoji}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LoadingScreen