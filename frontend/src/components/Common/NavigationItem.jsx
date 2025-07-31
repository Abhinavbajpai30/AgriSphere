import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const NavigationItem = ({ 
  path, 
  label, 
  icon: Icon, 
  activeIcon: ActiveIcon, 
  isActive, 
  color = 'primary',
  emoji,
  index = 0 
}) => {
  const colorClasses = {
    primary: {
      text: isActive ? 'text-primary-600' : 'text-gray-600',
      bg: 'bg-primary-50',
      glow: 'shadow-glow'
    },
    sky: {
      text: isActive ? 'text-sky-600' : 'text-gray-600',
      bg: 'bg-sky-50',
      glow: 'shadow-glow-sky'
    },
    orange: {
      text: isActive ? 'text-orange-600' : 'text-gray-600',
      bg: 'bg-orange-50',
      glow: 'shadow-glow-orange'
    },
    earth: {
      text: isActive ? 'text-earth-600' : 'text-gray-600',
      bg: 'bg-earth-50',
      glow: 'shadow-soft'
    }
  }

  const shadowVariants = {
    default: 'shadow-md',
    glow: 'shadow-lg',
    glowSky: 'shadow-lg',
    glowOrange: 'shadow-lg',
    soft: 'shadow-md'
  };

  const classes = colorClasses[color] || colorClasses.primary
  const DisplayIcon = isActive ? ActiveIcon : Icon

  return (
    <Link to={path} className="flex-1">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          delay: index * 0.1,
          type: 'spring',
          stiffness: 400,
          damping: 25
        }}
        whileHover={{ 
          scale: 1.1,
          y: -2
        }}
        whileTap={{ 
          scale: 0.95,
          y: 1
        }}
        className={`
          nav-item group relative
          ${isActive ? classes.bg : 'hover:bg-gray-50/50'}
          ${isActive ? classes.glow : ''}
        `}
      >
        {/* Emoji Background */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center opacity-10 text-4xl"
          animate={{ 
            rotate: isActive ? [0, 10, -10, 0] : 0,
            scale: isActive ? [1, 1.2, 1] : 1
          }}
          transition={{ 
            duration: 0.6,
            ease: 'easeInOut'
          }}
        >
          {emoji}
        </motion.div>

        {/* Icon */}
        <motion.div
          className="relative z-10"
          animate={{ 
            y: isActive ? [0, -2, 0] : 0
          }}
          transition={{ 
            duration: 0.4,
            ease: 'easeInOut'
          }}
        >
          <DisplayIcon className={`icon-md ${classes.text} transition-colors duration-200`} />
        </motion.div>

        {/* Label */}
        <motion.span
          className={`
            text-xs font-medium transition-colors duration-200 relative z-10
            ${classes.text}
          `}
          animate={{ 
            opacity: isActive ? [1, 0.8, 1] : 1
          }}
          transition={{ 
            duration: 0.4,
            ease: 'easeInOut'
          }}
        >
          {label}
        </motion.span>

        {/* Active pulse effect */}
        {isActive && (
          <motion.div
            className={`absolute inset-0 rounded-2xl border-2 border-${color}-200 opacity-50`}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.2, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}

        {/* Haptic feedback indicator */}
        <motion.div
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-orange-400"
          initial={{ scale: 0 }}
          animate={{ 
            scale: isActive ? [0, 1, 0] : 0,
            opacity: isActive ? [0, 1, 0] : 0
          }}
          transition={{ 
            duration: 0.3,
            ease: 'easeOut'
          }}
        />
      </motion.div>
    </Link>
  )
}

export default NavigationItem