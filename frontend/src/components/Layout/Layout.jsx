import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { useOffline } from '../../contexts/OfflineContext'
import Header from './Header'
import Navigation from './Navigation'
import OfflineIndicator from '../Common/OfflineIndicator'
import PWAPrompt from '../Common/PWAPrompt'
import UpdatePrompt from '../Common/UpdatePrompt'

const Layout = ({ children }) => {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const { isOnline, isUpdateAvailable } = useOffline()
  const [showNavigation, setShowNavigation] = useState(false)

  // Determine if current page should show navigation
  useEffect(() => {
    const pathsWithNavigation = ['/dashboard', '/farm', '/diagnosis', '/irrigation', '/planning', '/profile', '/settings']
    setShowNavigation(isAuthenticated && pathsWithNavigation.some(path => location.pathname.startsWith(path)))
  }, [location.pathname, isAuthenticated])

  // Page transition variants
  const pageVariants = {
    initial: {
      opacity: 0,
      y: 20,
      scale: 0.98
    },
    in: {
      opacity: 1,
      y: 0,
      scale: 1
    },
    out: {
      opacity: 0,
      y: -20,
      scale: 1.02
    }
  }

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-sky-200 rounded-full mix-blend-multiply filter blur-xl animate-blob delay-200"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl animate-blob delay-500"></div>
      </div>

      {/* Header */}
      <Header />

      {/* Offline Indicator */}
      <AnimatePresence>
        {!isOnline && <OfflineIndicator />}
      </AnimatePresence>

      {/* Update Prompt */}
      <AnimatePresence>
        {isUpdateAvailable && <UpdatePrompt />}
      </AnimatePresence>

      {/* PWA Install Prompt */}
      <PWAPrompt />

      {/* Main Content */}
      <main className={`relative z-10 ${showNavigation ? 'pb-20' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="min-h-screen"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <AnimatePresence>
        {showNavigation && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <Navigation />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Add blob animation to Tailwind
const style = document.createElement('style')
style.textContent = `
  @keyframes blob {
    0% {
      transform: translate(0px, 0px) scale(1);
    }
    33% {
      transform: translate(30px, -50px) scale(1.1);
    }
    66% {
      transform: translate(-20px, 20px) scale(0.9);
    }
    100% {
      transform: translate(0px, 0px) scale(1);
    }
  }
  .animate-blob {
    animation: blob 7s infinite;
  }
  .delay-200 {
    animation-delay: 2s;
  }
  .delay-500 {
    animation-delay: 4s;
  }
`
document.head.appendChild(style)

export default Layout