import { motion } from 'framer-motion'
import { CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline'

const SuccessAnimation = ({ 
  message = "Success!", 
  description = "", 
  icon = "🎉",
  isVisible = true,
  onComplete = () => {}
}) => {
  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onAnimationComplete={onComplete}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm mx-4 text-center"
      >
        {/* Animated Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            delay: 0.2,
            type: "spring",
            stiffness: 200
          }}
          className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
        >
          <motion.span
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-3xl"
          >
            {icon}
          </motion.span>
        </motion.div>

        {/* Success Message */}
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-gray-800 mb-2"
        >
          {message}
        </motion.h3>

        {description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-gray-600 mb-6"
          >
            {description}
          </motion.p>
        )}

        {/* Sparkle Effects */}
        <div className="relative">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-yellow-400"
              style={{
                left: `${20 + (i * 15) % 60}%`,
                top: `${i % 2 === 0 ? '10%' : '90%'}`
              }}
              animate={{
                scale: [0, 1, 0],
                rotate: [0, 180, 360],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2,
                delay: 0.8 + (i * 0.2),
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              ✨
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default SuccessAnimation