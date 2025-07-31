import { motion } from 'framer-motion'
import { 
  WifiIcon, 
  ExclamationTriangleIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'
import { useOffline } from '../../contexts/OfflineContext'
import { useLanguage } from '../../contexts/LanguageContext'

const OfflineIndicator = () => {
  const { isOnline, syncQueue } = useOffline()
  const { t } = useLanguage()

  if (isOnline) return null

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed top-16 left-0 right-0 z-40 safe-top"
    >
      <div className="mx-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl shadow-strong overflow-hidden">
        <div className="relative px-4 py-3">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_white_1px,_transparent_1px),radial-gradient(circle_at_80%_20%,_white_1px,_transparent_1px)] bg-[length:20px_20px]" />
          </div>

          <div className="relative flex items-center space-x-3">
            {/* Warning Icon */}
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="flex-shrink-0"
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5" />
              </div>
            </motion.div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-sm">
                  {t('offline')} Mode
                </h3>
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 bg-red-300 rounded-full"
                />
              </div>
              <p className="text-xs opacity-90 mt-0.5">
                You're working offline. Changes will sync when connected.
              </p>
            </div>

            {/* Sync Queue Indicator */}
            {syncQueue > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center space-x-2 bg-white/20 rounded-full px-3 py-1"
              >
                <CloudArrowUpIcon className="w-4 h-4" />
                <span className="text-xs font-semibold">{syncQueue}</span>
              </motion.div>
            )}

            {/* WiFi Off Icon */}
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex-shrink-0"
            >
              <WifiIcon className="w-5 h-5 opacity-70" />
              {/* Diagonal line to indicate "off" */}
              <div className="absolute -mt-5 ml-1 w-3 h-0.5 bg-white rotate-45 rounded-full" />
            </motion.div>
          </div>

          {/* Progress Bar for Sync */}
          {syncQueue > 0 && (
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden"
            >
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="h-full w-1/3 bg-white/40 rounded-full"
              />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default OfflineIndicator