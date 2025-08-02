import { motion } from 'framer-motion'
import { SparklesIcon, GlobeAltIcon, MapIcon, SunIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useAuth } from '../../../contexts/AuthContext'

const Welcome = ({ onNext, onboardingData, updateData }) => {
  const { t } = useLanguage()
  const { user, isAuthenticated } = useAuth()
  
  // Check if user has completed onboarding
  // Only show completed status if user is authenticated and has completed onboarding
  const isOnboardingCompleted = isAuthenticated && user?.appUsage?.onboardingCompleted === true

  const features = [
    {
      icon: GlobeAltIcon,
      title: 'Smart Weather Alerts',
      description: 'Get personalized weather forecasts for your farm',
      color: 'from-blue-400 to-blue-600',
      emoji: '🌤️'
    },
    {
      icon: MapIcon,
      title: 'Farm Mapping',
      description: 'Plot your farm boundaries with precision',
      color: 'from-green-400 to-green-600',
      emoji: '🗺️'
    },
    {
      icon: SunIcon,
      title: 'Crop Management',
      description: 'Track growth stages and optimize yields',
      color: 'from-yellow-400 to-orange-500',
      emoji: '🌱'
    },
    {
      icon: SparklesIcon,
      title: 'AI Insights',
      description: 'Get personalized farming recommendations',
      color: 'from-purple-400 to-pink-500',
      emoji: '🤖'
    }
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          {/* Logo and Title */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-8"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <span className="text-4xl">🌾</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary-600 via-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
              Welcome to AgriSphere
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Your AI-powered digital agronomist is here to help you grow better crops, 
              save water, and increase yields. Let's set up your smart farming assistant!
            </p>
          </motion.div>

          {/* Floating Farm Elements */}
          <div className="relative mb-12">
            {['🌽', '🍅', '🥕', '🌶️', '🍆', '🥒'].map((emoji, index) => (
              <motion.div
                key={emoji}
                className="absolute text-3xl md:text-4xl"
                initial={{ 
                  opacity: 0, 
                  scale: 0,
                  x: Math.random() * 200 - 100,
                  y: Math.random() * 200 - 100
                }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  x: 0,
                  y: 0,
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  delay: 0.5 + index * 0.1,
                  duration: 1,
                  rotate: {
                    repeat: Infinity,
                    duration: 3 + index * 0.5,
                    ease: "easeInOut"
                  }
                }}
                style={{
                  left: `${15 + (index * 15) % 70}%`,
                  top: `${20 + Math.sin(index) * 20}%`
                }}
              >
                {emoji}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 text-center border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <motion.div
                className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center shadow-lg`}
                whileHover={{ rotate: 5 }}
              >
                <span className="text-3xl">{feature.emoji}</span>
              </motion.div>
              <h3 className="font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Setup Time Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/40"
        >
          <div className="flex items-center justify-center space-x-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`w-3 h-3 rounded-full bg-primary-${i}00 border-2 border-white`} />
              ))}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Quick setup in</p>
              <p className="font-bold text-2xl text-primary-600">2 minutes</p>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="text-2xl"
            >
              ⏱️
            </motion.div>
          </div>
        </motion.div>

        {/* Onboarding Status */}
        {isOnboardingCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mb-8"
          >
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
                <h3 className="text-lg font-bold text-green-800">Onboarding Completed!</h3>
              </div>
              <p className="text-green-700 text-sm">
                Your farm is already set up and ready to go. You can access your dashboard anytime.
              </p>
            </div>
          </motion.div>
        )}

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-center"
        >
          {isOnboardingCompleted ? (
            <motion.button
              onClick={() => window.location.href = '/dashboard'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-12 rounded-full text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-3 mx-auto"
            >
              <span className="text-white">Go to Dashboard</span>
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-white"
              >
                📊
              </motion.span>
            </motion.button>
          ) : (
            <motion.button
              onClick={onNext}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-12 rounded-full text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-3 mx-auto"
            >
              <span className="text-white">Let's Get Started</span>
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-white"
              >
                🚀
              </motion.span>
            </motion.button>
          )}
          
          <p className="text-sm text-gray-500 mt-4">
            {isOnboardingCompleted 
              ? "Your farm is ready to use • Access anytime • All data saved"
              : "No credit card required • Free to start • Secure & private"
            }
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default Welcome