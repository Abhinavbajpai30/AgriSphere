import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserIcon, EyeIcon, EyeSlashIcon, CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useLanguage } from '../../../contexts/LanguageContext'
import { useAuth } from '../../../contexts/AuthContext'

const ProfileCompletion = ({ onComplete, onBack, onboardingData, updateData, isLoading }) => {
  const { t } = useLanguage()
  const { register, user, isAuthenticated } = useAuth()
  
  // Debug: Log onboarding data
  console.log('ProfileCompletion - onboardingData:', onboardingData)
  console.log('ProfileCompletion - farmBoundary:', onboardingData.farmBoundary)
  console.log('ProfileCompletion - crops:', onboardingData.crops)
  console.log('ProfileCompletion - location:', onboardingData.location)
  console.log('ProfileCompletion - user:', user)
  console.log('ProfileCompletion - isAuthenticated:', isAuthenticated)
  const [formData, setFormData] = useState({
    firstName: onboardingData.personalInfo?.firstName || user?.personalInfo?.firstName || '',
    lastName: onboardingData.personalInfo?.lastName || user?.personalInfo?.lastName || '',
    phoneNumber: onboardingData.personalInfo?.phoneNumber || user?.personalInfo?.phoneNumber || '',
    email: onboardingData.personalInfo?.email || user?.personalInfo?.email || '',
    password: '',
    confirmPassword: '',
    farmingExperience: onboardingData.personalInfo?.farmingExperience || user?.farmingProfile?.experienceLevel || ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' })

  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 5000)
  }

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'error' })
  }

  const experienceLevels = [
    { value: 'beginner', label: 'New to Farming', emoji: '🌱', description: '0-2 years experience' },
    { value: 'intermediate', label: 'Some Experience', emoji: '🌿', description: '3-10 years experience' },
    { value: 'experienced', label: 'Very Experienced', emoji: '🌳', description: '10+ years experience' },
    { value: 'expert', label: 'Expert Farmer', emoji: '👨‍🌾', description: 'Professional/Commercial' }
  ]

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required'
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number'
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.farmingExperience) {
      newErrors.farmingExperience = 'Please select your farming experience level'
    }

    return newErrors
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    // Update onboarding data with profile info
    const completeOnboardingData = {
      ...onboardingData,
      personalInfo: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        farmingExperience: formData.farmingExperience
      },
      authentication: {
        password: formData.password
      }
    }

    updateData(completeOnboardingData)
    
    // Proceed to complete onboarding
    onComplete(completeOnboardingData)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
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
                  onClick={hideToast}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="max-w-2xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            className="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <UserIcon className="w-10 h-10 text-white" />
          </motion.div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Complete Your Profile 👤
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Just a few more details to create your AgriSphere account and start your farming journey!
          </p>
        </motion.div>

        {/* Onboarding Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-8 border border-white/40"
        >
          {/* Skip to Dashboard Option for Logged-in Users */}
          {isAuthenticated && user && onboardingData.location?.coordinates && onboardingData.farmBoundary?.coordinates && onboardingData.crops?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-blue-800 mb-1">🎉 Welcome back!</h4>
                  <p className="text-blue-600 text-sm">You've completed the setup. You can skip to your dashboard or continue to update your profile.</p>
                </div>
                <button
                  onClick={() => {
                    // Use existing user's personal info if available, otherwise require form completion
                    if (user?.personalInfo?.firstName && user?.personalInfo?.lastName && user?.personalInfo?.phoneNumber) {
                      // User already has personal info, use it
                      const completeData = {
                        ...onboardingData,
                        personalInfo: {
                          firstName: user.personalInfo.firstName,
                          lastName: user.personalInfo.lastName,
                          phoneNumber: user.personalInfo.phoneNumber,
                          email: user.personalInfo.email || '',
                          farmingExperience: user.farmingProfile?.experienceLevel || ''
                        }
                      }
                      onComplete(completeData)
                    } else {
                      // User needs to fill out the form first
                      showToast('Please fill out your personal information before proceeding to the dashboard.', 'error')
                    }
                  }}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                    isLoading 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Setting up your farm...</span>
                    </>
                  ) : (
                    <>
                      <span>Go to Dashboard</span>
                      <motion.span
                        animate={{ x: [0, 2, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
          <h3 className="font-bold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📋</span>
            Your Setup Summary
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white/60 rounded-xl p-3">
              <div className="font-medium text-gray-700">📍 Location</div>
              <div className="text-gray-600">
                {onboardingData.location?.address || 'Location set'}
              </div>
            </div>
            
            <div className="bg-white/60 rounded-xl p-3">
              <div className="font-medium text-gray-700">🗺️ Farm Area</div>
              <div className="text-gray-600">
                {onboardingData.farmBoundary?.area?.toFixed(2) || '0'} hectares
              </div>
            </div>
            
            <div className="bg-white/60 rounded-xl p-3">
              <div className="font-medium text-gray-700">🌱 Crops</div>
              <div className="text-gray-600">
                {onboardingData.crops?.length || 0} crop{onboardingData.crops?.length !== 1 ? 's' : ''} selected
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/40 shadow-xl space-y-6"
        >
          {/* Personal Information */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="mr-2">👤</span>
              Personal Information
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                    errors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                    errors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  errors.phoneNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="+1234567890"
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address (Optional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="your.email@example.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Farming Experience */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="mr-2">🚜</span>
              Farming Experience
            </h3>
            
            <div className="grid md:grid-cols-2 gap-3">
              {experienceLevels.map((level) => (
                <motion.label
                  key={level.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center space-x-3 p-4 border rounded-2xl cursor-pointer transition-all ${
                    formData.farmingExperience === level.value
                      ? 'border-primary-500 bg-primary-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="farmingExperience"
                    value={level.value}
                    checked={formData.farmingExperience === level.value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-2xl">{level.emoji}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{level.label}</div>
                    <div className="text-sm text-gray-600">{level.description}</div>
                  </div>
                  {formData.farmingExperience === level.value && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-primary-500"
                    >
                      <CheckCircleIcon className="w-6 h-6" />
                    </motion.div>
                  )}
                </motion.label>
              ))}
            </div>
            {errors.farmingExperience && (
              <p className="text-red-500 text-sm">{errors.farmingExperience}</p>
            )}
          </div>

          {/* Security */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="mr-2">🔒</span>
              Account Security
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Create a secure password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                      errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className={`w-full py-4 px-6 rounded-full text-white font-bold text-lg shadow-xl transition-all duration-300 ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-500 to-green-500 hover:from-primary-600 hover:to-green-600 hover:shadow-2xl'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Creating Your Account...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span>Complete Setup</span>
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  🎉
                </motion.span>
              </div>
            )}
          </motion.button>
        </motion.form>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex justify-between mt-8"
        >
          <button
            onClick={onBack}
            disabled={isLoading}
            className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Back
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default ProfileCompletion