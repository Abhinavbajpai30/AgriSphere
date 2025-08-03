import { motion } from 'framer-motion'
import { CheckCircleIcon, SparklesIcon, HeartIcon } from '@heroicons/react/24/outline'

const SuccessAnimation = ({ 
  type = 'diagnosis', 
  title = 'Success!', 
  message = 'Operation completed successfully',
  icon = null,
  onComplete,
  autoHide = true,
  delay = 3000
}) => {
  // Auto-hide after delay
  if (autoHide && onComplete) {
    setTimeout(onComplete, delay)
  }

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: {
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 15
      }
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 200
      }
    }
  }

  const getSuccessIcon = () => {
    if (icon) return icon

    switch (type) {
      case 'diagnosis':
        return (
          <div className="relative">
            <CheckCircleIcon className="w-16 h-16 text-green-500" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute -top-2 -right-2"
            >
              <SparklesIcon className="w-6 h-6 text-yellow-400" />
            </motion.div>
          </div>
        )
      case 'upload':
        return <CheckCircleIcon className="w-16 h-16 text-blue-500" />
      case 'heart':
        return <HeartIcon className="w-16 h-16 text-red-500 fill-current" />
      default:
        return <CheckCircleIcon className="w-16 h-16 text-green-500" />
    }
  }

  const getBackgroundGradient = () => {
    switch (type) {
      case 'diagnosis':
        return 'from-green-400 via-teal-500 to-cyan-600'
      case 'upload':
        return 'from-blue-400 via-indigo-500 to-purple-600'
      case 'heart':
        return 'from-pink-400 via-red-500 to-rose-600'
      default:
        return 'from-green-400 via-teal-500 to-cyan-600'
    }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm"
    >
      <motion.div
        className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-sm mx-4 text-center overflow-hidden"
        whileHover={{ scale: 1.02 }}
      >
        {/* Background Animation */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${getBackgroundGradient()} opacity-5`}
          animate={{
            opacity: [0.05, 0.1, 0.05],
            scale: [1, 1.02, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* Floating Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
            style={{
              left: `${20 + (i * 12)}%`,
              top: `${15 + Math.sin(i) * 10}%`
            }}
            animate={{
              y: [-10, -20, -10],
              opacity: [0.3, 1, 0.3],
              scale: [0.8, 1.2, 0.8]
            }}
            transition={{
              duration: 2 + (i * 0.2),
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.2
            }}
          />
        ))}

        <div className="relative z-10">
          {/* Success Icon */}
          <motion.div
            variants={iconVariants}
            className="flex justify-center mb-6"
          >
            {getSuccessIcon()}
          </motion.div>

          {/* Success Message */}
          <motion.div variants={itemVariants}>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {title}
            </h2>
            <p className="text-gray-600 mb-6">
              {message}
            </p>
          </motion.div>

          {/* Pulse Animation */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            animate={{
              scale: [1, 2, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut'
            }}
          >
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${getBackgroundGradient()}`} />
          </motion.div>

          {/* Action Buttons (if needed) */}
          {!autoHide && onComplete && (
            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onComplete}
              className={`bg-gradient-to-r ${getBackgroundGradient()} text-white font-semibold py-3 px-6 rounded-xl shadow-lg`}
            >
              Continue
            </motion.button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default SuccessAnimation