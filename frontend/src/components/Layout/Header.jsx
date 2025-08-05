import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bars3Icon, 
  XMarkIcon, 
  BellIcon, 
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { useOffline } from '../../contexts/OfflineContext'
import LanguageSelector from '../Common/LanguageSelector'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()
  const { t } = useLanguage()
  const { isOnline } = useOffline()
  const navigate = useNavigate()
  const notificationRef = useRef(null)

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setIsMenuOpen(false)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t('goodMorning')
    if (hour < 18) return t('goodAfternoon')
    return t('goodEvening')
  }

  const menuVariants = {
    hidden: {
      opacity: 0,
      y: -20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1
    }
  }

  return (
    <header className="relative z-40 safe-top">
      <div className="bg-white/80 backdrop-blur-lg border-b border-white/20 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and App Name */}
            <Link 
              to={isAuthenticated ? '/dashboard' : '/'}
              className="flex items-center space-x-3 group"
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
                  <span className="text-white text-xl font-bold">🌾</span>
                </div>
              </motion.div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gradient-primary">
                  {t('appName')}
                </h1>
                <p className="text-xs text-gray-600 -mt-1">
                  {t('tagline')}
                </p>
              </div>
            </Link>

            {/* Center - User Greeting (when authenticated) */}
            {isAuthenticated && user && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden md:flex flex-col items-center"
              >
                <p className="text-sm text-gray-600">{getGreeting()}</p>
                <p className="font-semibold text-gray-800">
                  {user.personalInfo?.firstName || 'Farmer'}! 👋
                </p>
              </motion.div>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* About Link (when not authenticated) */}
              {!isAuthenticated && (
                <Link
                  to="/about"
                  className="hidden md:block text-gray-700 hover:text-emerald-600 font-medium transition-colors"
                >
                  About
                </Link>
              )}
              
              {/* Language Selector */}
              <LanguageSelector />

              {/* Notifications (when authenticated) */}
              {isAuthenticated && (
                <div className="relative" ref={notificationRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2 text-gray-600 hover:text-primary-600 rounded-full hover:bg-primary-50 transition-colors"
                  >
                    <BellIcon className="w-6 h-6" />
                    {/* Notification badge */}
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                      2
                    </span>
                  </motion.button>

                  {/* Notification Dropdown */}
                  <AnimatePresence>
                    {isNotificationOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50"
                      >
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-800">Notifications</h3>
                            <button 
                              onClick={() => setIsNotificationOpen(false)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {/* Sample notifications */}
                            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-xl">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">Weather Alert</p>
                                <p className="text-xs text-gray-600">Heavy rain expected in your area tomorrow</p>
                                <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-xl">
                              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">Irrigation Reminder</p>
                                <p className="text-xs text-gray-600">Time to water your tomato plants</p>
                                <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-xl">
                              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800">Crop Health</p>
                                <p className="text-xs text-gray-600">Your wheat crop needs attention</p>
                                <p className="text-xs text-gray-400 mt-1">3 days ago</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <button className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium">
                              View All Notifications
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Menu Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-600 hover:text-primary-600 rounded-full hover:bg-primary-50 transition-colors"
              >
                {isMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={menuVariants}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-white/20 shadow-strong"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                {isAuthenticated ? (
                  <div className="space-y-4">
                    {/* User Info */}
                    <div className="flex items-center space-x-3 p-3 bg-primary-50 rounded-2xl">
                      <div className="w-12 h-12 bg-gradient-primary rounded-2xl flex items-center justify-center">
                        <UserCircleIcon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {user?.personalInfo?.firstName} {user?.personalInfo?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {user?.personalInfo?.phoneNumber}
                        </p>
                        <p className="text-xs text-primary-600 capitalize">
                          {user?.farmingProfile?.experienceLevel} Farmer
                        </p>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        to="/profile"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-primary-50 transition-colors group"
                      >
                        <UserCircleIcon className="w-6 h-6 text-gray-600 group-hover:text-primary-600" />
                        <span className="font-medium text-gray-700 group-hover:text-primary-700">
                          {t('profile')}
                        </span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center space-x-3 p-3 rounded-2xl hover:bg-primary-50 transition-colors group"
                      >
                        <Cog6ToothIcon className="w-6 h-6 text-gray-600 group-hover:text-primary-600" />
                        <span className="font-medium text-gray-700 group-hover:text-primary-700">
                          {t('settings')}
                        </span>
                      </Link>
                    </div>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center space-x-2 p-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-5 h-5" />
                      <span className="font-medium">{t('logout')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link
                      to="/about"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full text-center py-3 px-4 text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-colors font-medium"
                    >
                      About AgriSphere
                    </Link>
                    <Link
                      to="/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full btn-primary text-center"
                    >
                      {t('login')}
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full btn-outline text-center"
                    >
                      {t('register')}
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}

export default Header