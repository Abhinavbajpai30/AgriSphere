import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronRightIcon, StarIcon } from '@heroicons/react/24/outline'

const ToolNavigationCard = ({ tool }) => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate(tool.route)
  }

  const getAnimationVariants = (animationType) => {
    switch (animationType) {
      case 'medical':
        return {
          hover: { 
            rotateY: [0, 15, 0],
            rotateX: [0, 5, 0]
          }
        }
      case 'calendar':
        return {
          hover: { 
            scale: [1, 1.05, 1.02],
            rotateZ: [0, 2, 0]
          }
        }
      case 'water':
        return {
          hover: { 
            y: [0, -5, -2],
            scale: [1, 1.03, 1.01]
          }
        }
      default:
        return {
          hover: { scale: 1.02 }
        }
    }
  }

  const getIconAnimation = (animationType) => {
    switch (animationType) {
      case 'medical':
        return {
          animate: { 
            rotateZ: [0, 5, -5, 0],
            scale: [1, 1.1, 1]
          },
          transition: { 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut"
          }
        }
      case 'calendar':
        return {
          animate: { 
            rotateY: [0, 15, 0],
            scale: [1, 1.05, 1]
          },
          transition: { 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }
        }
      case 'water':
        return {
          animate: { 
            y: [0, -3, 0],
            scale: [1, 1.1, 1]
          },
          transition: { 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut"
          }
        }
      default:
        return {}
    }
  }

  const animationVariants = getAnimationVariants(tool.animation)
  const iconAnimation = getIconAnimation(tool.animation)

  return (
    <motion.div
      whileHover={animationVariants.hover}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="group cursor-pointer relative overflow-hidden"
    >
      {/* Background Card */}
      <div className={`bg-gradient-to-br ${tool.gradient} rounded-2xl p-6 h-full shadow-lg hover:shadow-2xl transition-all duration-500 relative overflow-hidden`}>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/patterns/dots.svg')] bg-repeat"></div>
        </div>

        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ 
              x: [0, 50, 0],
              y: [0, -30, 0],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 20, 
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl"
          />
          <motion.div
            animate={{ 
              x: [0, -30, 0],
              y: [0, 20, 0],
              rotate: [0, -90, -180]
            }}
            transition={{ 
              duration: 15, 
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute -bottom-6 -left-6 w-16 h-16 bg-white/10 rounded-full blur-lg"
          />
        </div>

        <div className="relative z-10 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <motion.div
              {...iconAnimation}
              className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-3xl group-hover:bg-white/30 transition-colors duration-300 shadow-lg"
            >
              {tool.icon}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-white/80 group-hover:text-white transition-colors duration-300"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white transition-colors duration-300">
              {tool.title}
            </h3>
            
            <p className="text-white/90 text-sm font-medium mb-3">
              {tool.subtitle}
            </p>
            
            <p className="text-white/80 text-sm leading-relaxed mb-4">
              {tool.description}
            </p>

            {/* Stats */}
            <div className="space-y-2">
              {Object.entries(tool.stats).map(([key, value], index) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-white/70 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                  <span className="text-white/90 font-medium">
                    {value}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Action Area */}
          <div className="pt-4 border-t border-white/20">
            <motion.div
              whileHover={{ x: 5 }}
              className="flex items-center space-x-2 text-white/90 group-hover:text-white transition-colors duration-300"
            >
              <span className="text-sm font-medium">Open Tool</span>
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ChevronRightIcon className="w-4 h-4" />
              </motion.div>
            </motion.div>
          </div>

          {/* Success Badge */}
          {tool.stats.accuracy && parseInt(tool.stats.accuracy) > 90 && (
            <motion.div
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: -12 }}
              className="absolute top-4 right-4"
            >
              <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 shadow-lg">
                <StarIcon className="w-3 h-3" />
                <span>TOP RATED</span>
              </div>
            </motion.div>
          )}

          {/* Hover Glow Effect */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-white/10 rounded-2xl pointer-events-none"
          />

          {/* Click Ripple Effect */}
          <motion.div
            initial={{ scale: 0, opacity: 0.6 }}
            whileTap={{ scale: 4, opacity: 0 }}
            className="absolute inset-0 bg-white/20 rounded-full pointer-events-none"
            style={{ originX: 0.5, originY: 0.5 }}
          />
        </div>

        {/* Special Animation Effects */}
        {tool.animation === 'water' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  y: -10,
                  x: 20 + i * 40,
                  opacity: 0.6
                }}
                animate={{ 
                  y: 300,
                  opacity: [0.6, 0.3, 0]
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
                className="absolute w-1 h-4 bg-blue-200/50 rounded-full"
              />
            ))}
          </div>
        )}

        {tool.animation === 'medical' && (
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-white/20 rounded-full"
          />
        )}
      </div>
    </motion.div>
  )
}

export default ToolNavigationCard