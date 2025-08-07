import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { onboardingApi } from '../../services/api'

// Onboarding Step Components
import LanguageSelection from './steps/LanguageSelection'
import LocationPermission from './steps/LocationPermission'
import FarmPlotting from './steps/FarmPlotting'
import CropSelection from './steps/CropSelection'
import Welcome from './steps/Welcome'
import ProfileCompletion from './steps/ProfileCompletion'

// Onboarding State Management
const OnboardingFlow = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, user, refreshUser } = useAuth()
  const { t } = useLanguage()

  // Onboarding data state
  const [onboardingData, setOnboardingData] = useState({
    language: 'en',
    location: {
      country: '',
      region: '',
      coordinates: null,
      address: ''
    },
    farmBoundary: {
      coordinates: [],
      area: 0,
      name: ''
    },
    crops: [],
    personalInfo: {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      farmingExperience: ''
    },
    preferences: {
      units: 'metric',
      notifications: {
        weather: true,
        irrigation: true,
        pests: true,
        harvest: true
      }
    }
  })

  // Progress tracking
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' })
    }, 5000)
  }

  // Define onboarding steps
  const steps = [
    { path: '', component: Welcome, title: 'Welcome', required: false },
    { path: 'language', component: LanguageSelection, title: 'Language', required: true },
    { path: 'location', component: LocationPermission, title: 'Location', required: true },
    { path: 'farm', component: FarmPlotting, title: 'Farm Setup', required: true },
    { path: 'crops', component: CropSelection, title: 'Crops', required: true },
    { path: 'profile', component: ProfileCompletion, title: 'Profile', required: true }
  ]

  // Auto-save progress to localStorage
  useEffect(() => {
    if (dataLoaded) {
      console.log('Saving onboarding data to localStorage:', onboardingData)
      localStorage.setItem('agrisphere_onboarding_data', JSON.stringify(onboardingData))
    }
  }, [onboardingData, dataLoaded])

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem('agrisphere_onboarding_data')
    if (saved) {
      try {
        const parsedData = JSON.parse(saved)
        console.log('Loaded saved onboarding data:', parsedData)
        // Merge with initial state to ensure all required fields exist
        setOnboardingData(prev => ({
          ...prev,
          ...parsedData
        }))
        setDataLoaded(true)
      } catch (error) {
        console.error('Failed to load saved onboarding data:', error)
        setDataLoaded(true)
      }
    } else {
      console.log('No saved onboarding data found')
      setDataLoaded(true)
    }
  }, [])

  // Determine current step from URL
  useEffect(() => {
    const currentPath = location.pathname.replace('/onboarding', '').replace(/^\//, '') || ''
    const stepIndex = steps.findIndex(step => step.path === currentPath)
    if (stepIndex !== -1) {
      setCurrentStep(stepIndex)
    }
  }, [location.pathname, steps])

  // Update onboarding data
  const updateOnboardingData = (stepData) => {
    console.log('Updating onboarding data with:', stepData)
    setOnboardingData(prev => {
      const updated = {
        ...prev,
        ...stepData
      }
      console.log('Updated onboarding data:', updated)
      return updated
    })
  }

  // Mark step as completed
  const completeStep = (stepIndex) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]))
  }

  // Navigate to next step
  const goToNextStep = () => {
    const nextStepIndex = currentStep + 1
    if (nextStepIndex < steps.length) {
      completeStep(currentStep)
      const nextPath = steps[nextStepIndex].path
      const fullPath = nextPath === '' ? '/onboarding' : `/onboarding/${nextPath}`
      navigate(fullPath)
    } else {
      // Complete onboarding
      completeOnboarding()
    }
  }

  // Navigate to previous step
  const goToPreviousStep = () => {
    const prevStepIndex = currentStep - 1
    if (prevStepIndex >= 0) {
      const prevPath = steps[prevStepIndex].path
      const fullPath = prevPath === '' ? '/onboarding' : `/onboarding/${prevPath}`
      navigate(fullPath)
    }
  }

  // Complete the entire onboarding process
  const completeOnboarding = async (finalData = onboardingData) => {
    setIsLoading(true)
    try {
      // Prepare data for backend
      const requestData = {
        personalInfo: finalData.personalInfo,
        authentication: finalData.authentication,
        location: {
          coordinates: finalData.location.coordinates,
          address: finalData.location.address,
          country: finalData.location.country,
          region: finalData.location.region
        },
        farmBoundary: {
          coordinates: finalData.farmBoundary.coordinates,
          area: finalData.farmBoundary.area,
          name: finalData.farmBoundary.name || `${finalData.personalInfo.firstName}'s Farm`
        },
        crops: finalData.crops,
        language: finalData.language,
        preferences: finalData.preferences
      }

      console.log('Completing onboarding with data:', requestData)
      console.log('User authenticated:', isAuthenticated)
      console.log('User data:', user)
      console.log('Token exists:', !!localStorage.getItem('agrisphere_token'))
      console.log('Token value:', localStorage.getItem('agrisphere_token')?.substring(0, 20) + '...')

      let response
      if (isAuthenticated && user) {
        // User is already logged in, update their profile and farm data
        console.log('Updating existing user profile')
        response = await onboardingApi.update(requestData)
      } else {
        // Create new user account and farm
        console.log('Creating new user account')
        response = await onboardingApi.complete(requestData)
      }

      const data = response.data
      
      console.log('Onboarding response:', {
        status: response.status,
        data: data,
        responseOk: response.ok,
        dataStatus: data.status,
        nestedData: data.data
      })

      // Check if the response has the expected structure
      if (data.status === 'success') {
        // Store authentication token if it's a new user
        if (!isAuthenticated && data.data.token) {
          localStorage.setItem('agrisphere_token', data.data.token)
        }
        
        // Clear onboarding data
        localStorage.removeItem('agrisphere_onboarding_data')
        
        // Refresh user data to get updated onboarding status
        if (isAuthenticated && user) {
          try {
            const refreshResult = await refreshUser()
            if (refreshResult.success) {
              console.log('User data refreshed successfully')
            } else {
              console.error('Failed to refresh user data:', refreshResult.error)
            }
          } catch (refreshError) {
            console.error('Failed to refresh user data:', refreshError)
          }
        }
        
        // Show success message
        console.log('Onboarding completed successfully:', data.message)
        
        // Show success toast
        showToast('Farm setup completed successfully! Welcome to AgriSphere! 🎉', 'success')
        
        // Redirect to dashboard
        navigate('/dashboard')
      } else {
        throw new Error(data.message || 'Failed to complete onboarding')
      }
    } catch (error) {
      console.error('Onboarding completion failed:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      })
      showToast('Failed to complete onboarding. Please try again.', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate progress percentage
  const progressPercentage = Math.round((completedSteps.size / (steps.length - 1)) * 100)

  // Page transition variants
  const pageVariants = {
    initial: { opacity: 0, x: 50, scale: 0.98 },
    in: { opacity: 1, x: 0, scale: 1 },
    out: { opacity: 0, x: -50, scale: 1.02 }
  }

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4
  }

  // Check if user should be in onboarding, and redirect if not
  useEffect(() => {
    console.log('OnboardingFlow - Auth check:', {
      isAuthenticated,
      user: user ? 'exists' : 'null',
      isProfileIncomplete: user ? isProfileIncomplete(user) : 'no user',
      currentPath: location.pathname,
      onboardingData: onboardingData ? 'exists' : 'null'
    })
    
    // Check if user has completed onboarding steps
    const hasCompletedOnboardingSteps = onboardingData && 
      onboardingData.location?.coordinates && 
      onboardingData.farmBoundary?.coordinates && 
      onboardingData.crops?.length > 0
    
    console.log('Has completed onboarding steps:', hasCompletedOnboardingSteps)
    
    // Only redirect if user has completed onboarding AND we're not already in the onboarding flow
    if (isAuthenticated && user && user.appUsage?.onboardingCompleted && !location.pathname.startsWith('/onboarding')) {
      console.log('Redirecting to dashboard - user has completed onboarding')
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate, location.pathname, onboardingData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-orange-50 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] max-w-md w-full"
          >
            <div className={`rounded-xl shadow-2xl border-l-4 p-4 ${
              toast.type === 'error' 
                ? 'bg-red-50 border-red-400 text-red-800' 
                : 'bg-green-50 border-green-400 text-green-800'
            }`}>
              <div className="flex items-start space-x-3">
                {toast.type === 'error' ? (
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                ) : (
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{toast.message}</p>
                </div>
                <button
                  onClick={() => setToast({ show: false, message: '', type: 'success' })}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Progress Bar - Only show after welcome step */}
      {currentStep > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-white/20"
        >
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                {steps[currentStep]?.title}
              </span>
              <span className="text-sm text-gray-500">
                {currentStep}/{steps.length - 1}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className={`${currentStep > 0 ? 'pt-20' : ''}`}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes>
            <Route 
              path="/" 
              element={
                <motion.div
                  key="welcome"
                  variants={pageVariants}
                  initial="initial"
                  animate="in"
                  exit="out"
                  transition={pageTransition}
                >
                  <Welcome 
                    onNext={goToNextStep}
                    onboardingData={onboardingData}
                    updateData={updateOnboardingData}
                  />
                </motion.div>
              } 
            />
            <Route 
              path="/language" 
              element={
                <motion.div
                  key="language"
                  variants={pageVariants}
                  initial="initial"
                  animate="in"
                  exit="out"
                  transition={pageTransition}
                >
                  <LanguageSelection 
                    onNext={goToNextStep}
                    onBack={goToPreviousStep}
                    onboardingData={onboardingData}
                    updateData={updateOnboardingData}
                  />
                </motion.div>
              } 
            />
            <Route 
              path="/location" 
              element={
                <motion.div
                  key="location"
                  variants={pageVariants}
                  initial="initial"
                  animate="in"
                  exit="out"
                  transition={pageTransition}
                >
                  <LocationPermission 
                    onNext={goToNextStep}
                    onBack={goToPreviousStep}
                    onboardingData={onboardingData}
                    updateData={updateOnboardingData}
                  />
                </motion.div>
              } 
            />
            <Route 
              path="/farm" 
              element={
                <motion.div
                  key="farm"
                  variants={pageVariants}
                  initial="initial"
                  animate="in"
                  exit="out"
                  transition={pageTransition}
                >
                  <FarmPlotting 
                    onNext={goToNextStep}
                    onBack={goToPreviousStep}
                    onboardingData={onboardingData}
                    updateData={updateOnboardingData}
                  />
                </motion.div>
              } 
            />
            <Route 
              path="/crops" 
              element={
                <motion.div
                  key="crops"
                  variants={pageVariants}
                  initial="initial"
                  animate="in"
                  exit="out"
                  transition={pageTransition}
                >
                  <CropSelection 
                    onNext={goToNextStep}
                    onBack={goToPreviousStep}
                    onboardingData={onboardingData}
                    updateData={updateOnboardingData}
                  />
                </motion.div>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <motion.div
                  key="profile"
                  variants={pageVariants}
                  initial="initial"
                  animate="in"
                  exit="out"
                  transition={pageTransition}
                >
                  <ProfileCompletion 
                    onComplete={completeOnboarding}
                    onBack={goToPreviousStep}
                    onboardingData={onboardingData}
                    updateData={updateOnboardingData}
                    isLoading={isLoading}
                  />
                </motion.div>
              } 
            />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  )
}

// Helper function to check if profile needs completion
const isProfileIncomplete = (user) => {
  // If user has completed onboarding, they shouldn't be in onboarding flow
  if (user?.appUsage?.onboardingCompleted) {
    return false
  }
  
  // Check if user has basic profile info
  const hasBasicInfo = user?.personalInfo?.firstName && 
                      user?.personalInfo?.lastName &&
                      user?.personalInfo?.phoneNumber
  
  // Check if user has location
  const hasLocation = user?.location?.coordinates
  
  // Check if user has farm setup (this is what onboarding is for)
  const hasFarmSetup = user?.farms && user.farms.length > 0
  
  // User is incomplete if they don't have basic info OR location
  // Note: farmingProfile.experienceLevel is optional and not required for onboarding completion
  if (hasBasicInfo && hasLocation) {
    // User has basic profile info and location, they just need to complete onboarding
    return !hasFarmSetup
  }
  
  // User is incomplete if they don't have basic profile info or location
  return !hasBasicInfo || !hasLocation
}

export default OnboardingFlow