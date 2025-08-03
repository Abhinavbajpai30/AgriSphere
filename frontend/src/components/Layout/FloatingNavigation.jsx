import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  HomeIcon,
  BeakerIcon,
  CalendarDaysIcon,
  MapIcon,
  UserIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  BeakerIcon as BeakerIconSolid,
  CalendarDaysIcon as CalendarDaysIconSolid,
  MapIcon as MapIconSolid,
  UserIcon as UserIconSolid
} from '@heroicons/react/24/solid'

const FloatingNavigation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [activeItem, setActiveItem] = useState('')

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
      path: '/dashboard',
      color: 'from-blue-400 to-blue-600',
      emoji: '🏠'
    },
    {
      id: 'diagnosis',
      label: 'AI Doctor',
      icon: BeakerIcon,
      activeIcon: BeakerIconSolid,
      path: '/diagnosis',
      color: 'from-teal-400 to-cyan-600',
      emoji: '🩺'
    },
    {
      id: 'planning',
      label: 'Planner',
      icon: CalendarDaysIcon,
      activeIcon: CalendarDaysIconSolid,
      path: '/planning',
      color: 'from-purple-400 to-indigo-600',
      emoji: '📅'
    },
    {
      id: 'irrigation',
      label: 'Irrigation',
      icon: MapIcon,
      activeIcon: MapIconSolid,
      path: '/irrigation',
      color: 'from-cyan-400 to-blue-600',
      emoji: '💧'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: UserIcon,
      activeIcon: UserIconSolid,
      path: '/profile',
      color: 'from-green-400 to-emerald-600',
      emoji: '👤'
    }
  ]

  useEffect(() => {
    const currentPath = location.pathname
    const activeNav = navigationItems.find(item => currentPath.startsWith(item.path))
    setActiveItem(activeNav?.id || '')
  }, [location.pathname])

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const handleNavigation = (item) => {
    setActiveItem(item.id)
    navigate(item.path)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-[9999]"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Main Navigation Container */}
          <motion.div
            className="bg-white/90 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl px-2 py-2"
            whileHover={{ scale: 1.02 }}
            style={{ pointerEvents: 'auto' }}
          >
            <div className="flex items-center space-x-1">
              {/* Navigation Items */}
              {navigationItems.map((item, index) => {
                const isActive = activeItem === item.id
                const IconComponent = isActive ? item.activeIcon : item.icon

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item)}
                    className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 cursor-pointer ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  >
                    <IconComponent className="w-6 h-6" />
                  </button>
                )
              })}

              {/* Divider */}
              <div className="w-px h-8 bg-gray-200 mx-2"></div>

              {/* Quick Action Button */}
              <button
                onClick={() => navigate('/farm/add')}
                className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              >
                <PlusIcon className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FloatingNavigation