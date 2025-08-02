import { motion } from 'framer-motion'

const ProgressIndicator = ({ title, value, icon, color, subtitle }) => {
  const getColorClasses = (color) => {
    switch (color) {
      case 'green':
        return {
          gradient: 'from-green-400 to-green-600',
          bg: 'bg-green-50',
          text: 'text-green-600',
          ring: 'ring-green-200'
        }
      case 'blue':
        return {
          gradient: 'from-blue-400 to-blue-600',
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          ring: 'ring-blue-200'
        }
      case 'purple':
        return {
          gradient: 'from-purple-400 to-purple-600',
          bg: 'bg-purple-50',
          text: 'text-purple-600',
          ring: 'ring-purple-200'
        }
      case 'orange':
        return {
          gradient: 'from-orange-400 to-orange-600',
          bg: 'bg-orange-50',
          text: 'text-orange-600',
          ring: 'ring-orange-200'
        }
      default:
        return {
          gradient: 'from-gray-400 to-gray-600',
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          ring: 'ring-gray-200'
        }
    }
  }

  const colors = getColorClasses(color)
  const radius = 45
  const strokeWidth = 8
  const normalizedRadius = radius - strokeWidth * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDasharray = `${circumference} ${circumference}`
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`${colors.bg} rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 ${colors.ring} ring-1`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-2xl"
            >
              {icon}
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-800">
              {title}
            </h3>
          </div>
          
          <div className="mb-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className={`text-3xl font-bold ${colors.text}`}
            >
              {value}%
            </motion.div>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${value}%` }}
              transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${colors.gradient} rounded-full relative`}
            >
              {/* Shimmer Effect */}
              <motion.div
                animate={{ x: [-100, 200] }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"
                style={{ width: '100px' }}
              />
            </motion.div>
          </div>
        </div>

        {/* Circular Progress */}
        <div className="relative ml-4">
          <motion.svg
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: -90 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="w-24 h-24"
            width={radius * 2}
            height={radius * 2}
          >
            {/* Background Circle */}
            <circle
              stroke="currentColor"
              className="text-gray-200"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
            />
            
            {/* Progress Circle */}
            <motion.circle
              stroke="currentColor"
              className={colors.text}
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ delay: 0.8, duration: 1.5, ease: "easeInOut" }}
            />
          </motion.svg>
          
          {/* Center Value */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className={`text-lg font-bold ${colors.text}`}>
              {value}
            </span>
          </motion.div>

          {/* Pulsing Dot for High Values */}
          {value > 80 && (
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className={`absolute -top-1 -right-1 w-3 h-3 ${colors.gradient.includes('green') ? 'bg-green-400' : colors.gradient.includes('blue') ? 'bg-blue-400' : 'bg-purple-400'} rounded-full`}
            />
          )}
        </div>
      </div>

      {/* Achievement Indicators */}
      {value > 90 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mt-4 p-2 bg-yellow-50 rounded-lg border border-yellow-200"
        >
          <div className="flex items-center space-x-2">
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-lg"
            >
              🏆
            </motion.span>
            <span className="text-sm text-yellow-700 font-medium">
              Excellent performance!
            </span>
          </div>
        </motion.div>
      )}

      {/* Floating Particles for High Scores */}
      {value > 85 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                y: 100,
                x: Math.random() * 200,
                scale: 0,
                opacity: 0.8
              }}
              animate={{ 
                y: -20,
                scale: [0, 1, 0],
                opacity: [0.8, 0.4, 0]
              }}
              transition={{
                duration: 3,
                delay: i * 0.5,
                repeat: Infinity
              }}
              className="absolute text-lg"
            >
              ✨
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

export default ProgressIndicator