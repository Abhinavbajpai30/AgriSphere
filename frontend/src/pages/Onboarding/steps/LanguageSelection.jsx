import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '../../../contexts/LanguageContext'

const LanguageSelection = ({ onNext, onBack, onboardingData, updateData }) => {
  const { getSupportedLanguages, changeLanguage, currentLanguage } = useLanguage()
  const [selectedLanguage, setSelectedLanguage] = useState();
  const [showConfetti, setShowConfetti] = useState(false)

  const supportedLanguages = getSupportedLanguages()

  // Plant illustrations for each language region
  const languageIllustrations = {
    en: { plant: '🌽', gradient: 'from-blue-400 to-blue-600' },
    es: { plant: '🌶️', gradient: 'from-red-400 to-orange-500' },
    fr: { plant: '🥖', gradient: 'from-purple-400 to-pink-500' },
    hi: { plant: '🌾', gradient: 'from-yellow-400 to-orange-500' },
    sw: { plant: '🍌', gradient: 'from-green-400 to-green-600' },
    am: { plant: '☕', gradient: 'from-amber-600 to-yellow-600' },
    yo: { plant: '🍠', gradient: 'from-orange-400 to-red-500' },
    ha: { plant: '🥜', gradient: 'from-amber-500 to-orange-600' }
  }

  const handleLanguageSelect = async (languageCode) => {
    console.log('Language selected:', languageCode);
    setSelectedLanguage(languageCode)
    
    // Update language context
    await changeLanguage(languageCode)
    
    // Update onboarding data
    updateData({ language: languageCode })
    
    // Show celebration animation
    setShowConfetti(true)
    
    // Auto-proceed after short delay
    setTimeout(() => {
      onNext()
    }, 1500)
  }

  // Confetti animation
  const confettiElements = Array.from({ length: 50 }, (_, i) => (
    <motion.div
      key={i}
      className="absolute w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
      initial={{
        opacity: 0,
        scale: 0,
        x: Math.random() * window.innerWidth,
        y: -50
      }}
      animate={showConfetti ? {
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        y: window.innerHeight + 100,
        rotate: 360
      } : {}}
      transition={{
        duration: 3,
        delay: Math.random() * 2,
        ease: "easeOut"
      }}
    />
  ))

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {confettiElements}
        </div>
      )}

      <div className="max-w-4xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
          >
            <span className="text-3xl">🌍</span>
          </motion.div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Choose Your Language
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select your preferred language to get started with AgriSphere. 
            We speak your language! 🗣️
          </p>
        </motion.div>

        {/* Language Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {supportedLanguages.map((language, index) => {
            const illustration = languageIllustrations[language.code] || { plant: '🌱', gradient: 'from-green-400 to-green-600' }
            const isSelected = selectedLanguage === language.code
            
            return (
              <motion.button
                key={language.code}
                onClick={() => handleLanguageSelect(language.code)}
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -5,
                  transition: { type: 'spring', stiffness: 300 }
                }}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative p-6 rounded-3xl transition-all duration-300 group overflow-hidden
                  ${isSelected 
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-2xl' 
                    : 'bg-white/80 backdrop-blur-sm text-gray-800 border border-white/40 shadow-xl hover:shadow-2xl'
                  }
                `}
              >
                {/* Animated Background Pattern */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${illustration.gradient} opacity-10`}
                  animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                {/* Flag */}
                <motion.div
                  className="text-4xl mb-4"
                  animate={isSelected ? { 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {language.flag}
                </motion.div>

                {/* Plant Illustration */}
                <motion.div
                  className="text-2xl mb-3"
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    y: [0, -2, 0]
                  }}
                  transition={{ 
                    duration: 3 + index * 0.2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {illustration.plant}
                </motion.div>

                {/* Language Info */}
                <div className="relative z-10">
                  <h3 className="font-bold text-lg mb-1 group-hover:scale-105 transition-transform">
                    {language.nativeName}
                  </h3>
                  <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-gray-600'}`}>
                    {language.name}
                  </p>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                  >
                    <CheckIcon className="w-4 h-4 text-primary-600" />
                  </motion.div>
                )}

                {/* Bounce Animation on Hover */}
                <motion.div
                  className="absolute bottom-2 left-1/2 transform -translate-x-1/2"
                  animate={isSelected ? {
                    y: [0, -5, 0],
                    scale: [1, 1.1, 1]
                  } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {isSelected && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs font-medium"
                    >
                      ✨ Selected ✨
                    </motion.span>
                  )}
                </motion.div>
              </motion.button>
            )
          })}
        </motion.div>

        {/* Encouraging Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/40 inline-block">
            <p className="text-sm text-gray-600 flex items-center space-x-2">
              <span>🌱</span>
              <span>Your farming journey begins with the right language!</span>
              <span>🌱</span>
            </p>
          </div>
        </motion.div>

        {/* Success Message */}
        {selectedLanguage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-xl z-40"
          >
            <div className="flex items-center space-x-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🎉
              </motion.span>
              <span className="font-medium">Great choice! Moving to the next step...</span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default LanguageSelection