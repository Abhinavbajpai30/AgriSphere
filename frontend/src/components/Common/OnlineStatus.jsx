import { motion } from 'framer-motion'
import { 
  WifiIcon, 
  ExclamationTriangleIcon,
  SignalIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'
import { useOffline } from '../../contexts/OfflineContext'
import { useLanguage } from '../../contexts/LanguageContext'

const OnlineStatus = () => {
  const { 
    isOnline, 
    connectionInfo, 
    isSlowConnection, 
    syncQueue 
  } = useOffline()
  const { t } = useLanguage()

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500'
    if (isSlowConnection) return 'text-orange-500'
    return 'text-green-500'
  }

  const getStatusText = () => {
    if (!isOnline) return t('offline')
    if (isSlowConnection) return 'Slow'
    return t('online')
  }

  const getStatusIcon = () => {
    if (!isOnline) return ExclamationTriangleIcon
    if (isSlowConnection) return SignalIcon
    return WifiIcon
  }

  const StatusIcon = getStatusIcon()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center space-x-2"
    >
      {/* Connection Status */}
      <motion.div
        className="flex items-center space-x-1 px-2 py-1 rounded-full bg-white/60 backdrop-blur-sm"
        whileHover={{ scale: 1.05 }}
      >
        {/* Status Icon with Animation */}
        <motion.div
          animate={{
            y: isOnline ? [0, -2, 0] : 0,
            rotate: !isOnline ? [0, -5, 5, 0] : 0
          }}
          transition={{
            duration: isOnline ? 1.5 : 0.5,
            repeat: isOnline ? Infinity : 3,
            ease: 'easeInOut'
          }}
        >
          <StatusIcon className={`w-4 h-4 ${getStatusColor()}`} />
        </motion.div>

        {/* Status Indicator Dot */}
        <motion.div
          className={`w-2 h-2 rounded-full ${
            isOnline ? (isSlowConnection ? 'bg-orange-400' : 'bg-green-400') : 'bg-red-400'
          }`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />

        {/* Status Text (hidden on mobile) */}
        <span className={`text-xs font-medium hidden sm:block ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </motion.div>

      {/* Sync Queue Indicator */}
      {syncQueue > 0 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="relative"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="p-1 rounded-full bg-sky-100"
          >
            <CloudArrowUpIcon className="w-4 h-4 text-sky-600" />
          </motion.div>
          
          {/* Sync count badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-sky-500 text-white text-xs rounded-full flex items-center justify-center"
          >
            {syncQueue}
          </motion.div>
        </motion.div>
      )}

      {/* Connection Quality Indicator */}
      {isOnline && (
        <motion.div
          className="hidden lg:flex items-center space-x-1"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {/* Signal Bars */}
          {[1, 2, 3, 4].map((bar) => {
            const isActive = getSignalStrength() >= bar
            return (
              <motion.div
                key={bar}
                className={`w-1 rounded-sm ${
                  isActive ? 'bg-green-400' : 'bg-gray-300'
                }`}
                style={{ height: `${bar * 3 + 2}px` }}
                animate={{
                  scaleY: isActive ? [1, 1.2, 1] : 1,
                  opacity: isActive ? [1, 0.7, 1] : 0.3
                }}
                transition={{
                  duration: 0.8,
                  delay: bar * 0.1,
                  repeat: isActive ? Infinity : 0,
                  ease: 'easeInOut'
                }}
              />
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )

  function getSignalStrength() {
    if (!isOnline) return 0
    if (!connectionInfo.effectiveType) return 4

    switch (connectionInfo.effectiveType) {
      case 'slow-2g':
        return 1
      case '2g':
        return 2
      case '3g':
        return 3
      case '4g':
      default:
        return 4
    }
  }
}

export default OnlineStatus