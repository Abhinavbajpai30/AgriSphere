import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'

const AnimatedMascot = ({ position = 'bottom-right', mood = 'happy', message }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [currentMessage, setCurrentMessage] = useState(message)
  const [showMessage, setShowMessage] = useState(false)

  useEffect(() => {
    // Show mascot after a delay
    const timer = setTimeout(() => {
      setIsVisible(true)
      
      // Show message after mascot appears
      if (message) {
        setTimeout(() => setShowMessage(true), 1000)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [message])

  useEffect(() => {
    if (message) {
      setCurrentMessage(message)
      setShowMessage(true)
    }
  }, [message])

  const getMascotEmoji = (mood) => {
    switch (mood) {
      case 'happy': return '🌱'
      case 'excited': return '🌿'
      case 'proud': return '🌳'
      case 'thinking': return '🤔'
      case 'celebrating': return '🎉'
      default: return '🌱'
    }
  }

  const getPositionClasses = (position) => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-6 right-6'
      case 'bottom-left':
        return 'bottom-6 left-6'
      case 'top-right':
        return 'top-6 right-6'
      case 'top-left':
        return 'top-6 left-6'
      default:
        return 'bottom-6 right-6'
    }
  }

  const getMoodAnimation = (mood) => {
    switch (mood) {
      case 'happy':
        return {
          animate: { 
            y: [0, -5, 0],
            rotate: [0, 2, -2, 0],
            scale: [1, 1.05, 1]
          },
          transition: { 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut"
          }
        }
      case 'excited':
        return {
          animate: { 
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0],
            scale: [1, 1.1, 1]
          },
          transition: { 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }
        }
      case 'celebrating':
        return {
          animate: { 
            y: [0, -15, 0],
            rotate: [0, 15, -15, 0],
            scale: [1, 1.2, 1]
          },
          transition: { 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }
        }
      default:
        return {
          animate: { 
            y: [0, -3, 0],
            scale: [1, 1.02, 1]
          },
          transition: { 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }
        }
    }
  }

  const handleDismiss = () => {
    setShowMessage(false)
    setTimeout(() => setIsVisible(false), 500)
  }

  const moodAnimation = getMoodAnimation(mood)

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className={`fixed ${getPositionClasses(position)} z-50`}
        >
          {/* Message Bubble */}
          <AnimatePresence>
            {showMessage && currentMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                className="absolute bottom-full mb-4 right-0"
              >
                <div className="bg-white rounded-2xl p-4 shadow-xl border border-gray-200 max-w-xs relative">
                  {/* Speech Bubble Tail */}
                  <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
                  
                  {/* Message Content */}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-gray-700 pr-2">
                        {currentMessage}
                      </p>
                      <button
                        onClick={handleDismiss}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Animated Background */}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.02, 1],
                      opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-green-100 rounded-2xl"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mascot Character */}
          <motion.div
            {...moodAnimation}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMessage(!showMessage)}
            className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-300 relative overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-full h-full bg-gradient-to-r from-white/30 to-transparent"
              />
            </div>

            {/* Mascot Emoji */}
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-2xl z-10"
            >
              {getMascotEmoji(mood)}
            </motion.div>

            {/* Pulsing Ring */}
            <motion.div
              animate={{ 
                scale: [1, 1.4, 1],
                opacity: [0.6, 0.2, 0.6]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 border-2 border-green-400 rounded-full"
            />

            {/* Notification Dot */}
            {showMessage && (
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [1, 0.7, 1]
                }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full border-2 border-white"
              />
            )}
          </motion.div>

          {/* Floating Particles */}
          {mood === 'celebrating' && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    y: 0,
                    x: 0,
                    scale: 0,
                    opacity: 1
                  }}
                  animate={{ 
                    y: [-20, -40, -60],
                    x: [0, (i % 2 === 0 ? 20 : -20), (i % 2 === 0 ? 40 : -40)],
                    scale: [0, 1, 0],
                    opacity: [1, 0.7, 0]
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1,
                    repeat: Infinity
                  }}
                  className="absolute top-1/2 left-1/2 text-sm"
                >
                  {['🎉', '⭐', '✨', '🌟'][i % 4]}
                </motion.div>
              ))}
            </div>
          )}

          {/* Helpful Tips Indicator */}
          {mood === 'thinking' && (
            <motion.div
              animate={{ 
                opacity: [0, 1, 0],
                y: [-5, -10, -5]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-xs"
            >
              💭
            </motion.div>
          )}

          {/* Happy Sparkles */}
          {mood === 'happy' && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    scale: 0,
                    opacity: 0.8,
                    x: 0,
                    y: 0
                  }}
                  animate={{ 
                    scale: [0, 1, 0],
                    opacity: [0.8, 0.4, 0],
                    x: [0, (i % 2 === 0 ? 15 : -15)],
                    y: [0, -15]
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.3,
                    repeat: Infinity
                  }}
                  className="absolute top-1/2 left-1/2 text-xs"
                >
                  ✨
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AnimatedMascot