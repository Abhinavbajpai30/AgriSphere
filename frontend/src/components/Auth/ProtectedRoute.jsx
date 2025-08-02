import { Navigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import LoadingScreen from '../Common/LoadingScreen'

const ProtectedRoute = ({ children, requireAuth = true, redirectTo = '/login' }) => {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen message="Checking authentication..." />
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    )
  }

  // If user is authenticated but shouldn't be (e.g., accessing login page)
  if (!requireAuth && isAuthenticated) {
    return (
      <Navigate 
        to="/dashboard" 
        replace 
      />
    )
  }

  // User profile completion check - redirect to onboarding if incomplete
  if (isAuthenticated && user && !isProfileComplete(user)) {
    // If user hasn't completed onboarding, redirect to onboarding flow
    if (!location.pathname.startsWith('/onboarding')) {
      return (
        <Navigate 
          to="/onboarding" 
          state={{ from: location }} 
          replace 
        />
      )
    }
  }

  // Render children with authentication context
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}

// Helper function to check if user profile is complete
const isProfileComplete = (user) => {
  if (!user || !user.personalInfo) return false
  
  // Check if user has completed onboarding
  return user.appUsage?.onboardingCompleted === true &&
         user.personalInfo?.firstName &&
         user.personalInfo?.lastName &&
         user.location?.coordinates &&
         user.farmingProfile?.experienceLevel
}

// HOC for role-based access control
export const withRoleAccess = (allowedRoles = []) => {
  return function RoleProtectedRoute({ children }) {
    const { user, isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
      return <LoadingScreen message="Checking permissions..." />
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }

    // Check if user has required role
    const userRole = user?.status?.role || 'user'
    const hasAccess = allowedRoles.length === 0 || allowedRoles.includes(userRole)

    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-white rounded-3xl shadow-strong p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🚫</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Access Restricted
            </h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this area. Please contact support if you believe this is an error.
            </p>
            <button
              onClick={() => window.history.back()}
              className="btn-primary w-full"
            >
              Go Back
            </button>
          </motion.div>
        </div>
      )
    }

    return children
  }
}

// HOC for subscription-based access control
export const withSubscriptionAccess = (requiredTier = 'free') => {
  return function SubscriptionProtectedRoute({ children }) {
    const { user, isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
      return <LoadingScreen message="Checking subscription..." />
    }

    if (!isAuthenticated) {
      return <Navigate to="/login" replace />
    }

    const userTier = user?.status?.subscriptionType || 'free'
    const tierLevels = { free: 0, basic: 1, premium: 2, enterprise: 3 }
    
    const hasAccess = tierLevels[userTier] >= tierLevels[requiredTier]

    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-white rounded-3xl shadow-strong p-8 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Premium Feature
            </h2>
            <p className="text-gray-600 mb-6">
              This feature requires a {requiredTier} subscription. Upgrade your plan to access advanced farming tools.
            </p>
            <div className="space-y-3">
              <button className="btn-primary w-full">
                Upgrade Now
              </button>
              <button
                onClick={() => window.history.back()}
                className="btn-outline w-full"
              >
                Go Back
              </button>
            </div>
          </motion.div>
        </div>
      )
    }

    return children
  }
}

export default ProtectedRoute