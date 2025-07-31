import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon, LanguageIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '../../contexts/LanguageContext'

const LanguageSelector = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { 
    currentLanguage, 
    changeLanguage, 
    getSupportedLanguages, 
    getCurrentLanguage,
    isLoading 
  } = useLanguage()

  const supportedLanguages = getSupportedLanguages()
  const current = getCurrentLanguage()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLanguageSelect = async (languageCode) => {
    if (languageCode !== currentLanguage) {
      await changeLanguage(languageCode)
    }
    setIsOpen(false)
  }

  const dropdownVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: -10
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Language Selector Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-2xl
          ${isOpen ? 'bg-primary-100 text-primary-700' : 'bg-white/60 text-gray-700'}
          hover:bg-primary-50 transition-all duration-200
          backdrop-blur-sm border border-white/20
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          focus:outline-none focus:ring-2 focus:ring-primary-400
        `}
      >
        {/* Flag emoji */}
        <span className="text-lg leading-none">
          {current?.flag || '🌍'}
        </span>
        
        {/* Language code */}
        <span className="text-sm font-semibold uppercase hidden sm:block">
          {current?.code || 'EN'}
        </span>

        {/* Loading indicator or dropdown arrow */}
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4"
          >
            <LanguageIcon className="w-4 h-4" />
          </motion.div>
        ) : (
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDownIcon className="w-4 h-4" />
          </motion.div>
        )}
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={dropdownVariants}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-lg rounded-2xl shadow-strong border border-white/20 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-primary-50/50 border-b border-primary-100">
              <p className="text-sm font-semibold text-primary-800">
                Select Language
              </p>
              <p className="text-xs text-primary-600">
                Choose your preferred language
              </p>
            </div>

            {/* Language Options */}
            <div className="max-h-64 overflow-y-auto py-2">
              {supportedLanguages.map((language, index) => (
                <motion.button
                  key={language.code}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3
                    hover:bg-primary-50 transition-colors duration-150
                    ${currentLanguage === language.code ? 'bg-primary-100 text-primary-800' : 'text-gray-700'}
                    group
                  `}
                >
                  {/* Flag */}
                  <span className="text-2xl flex-shrink-0">
                    {language.flag}
                  </span>

                  {/* Language Info */}
                  <div className="flex-1 text-left">
                    <p className="font-medium text-sm">
                      {language.nativeName}
                    </p>
                    <p className="text-xs opacity-70">
                      {language.name}
                    </p>
                  </div>

                  {/* Current indicator */}
                  {currentLanguage === language.code && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-primary-500 rounded-full"
                    />
                  )}

                  {/* Hover effect */}
                  <motion.div
                    className="absolute right-3 opacity-0 group-hover:opacity-100"
                    initial={{ x: -10 }}
                    animate={{ x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="text-primary-500 text-sm">→</span>
                  </motion.div>
                </motion.button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50/50 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                🌍 Supporting {supportedLanguages.length} languages
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LanguageSelector