import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import LoadingScreen from '../../components/Common/LoadingScreen'

const Register = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Farming Profile
    experienceLevel: '',
    farmingType: '',
    primaryCrops: [],
    farmSize: '',
    
    // Location
    country: '',
    region: '',
    coordinates: null
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const { register } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const experienceLevels = [
    { value: 'beginner', label: 'Beginner (0-2 years)', emoji: '🌱' },
    { value: 'intermediate', label: 'Intermediate (3-10 years)', emoji: '🌿' },
    { value: 'experienced', label: 'Experienced (10+ years)', emoji: '🌳' }
  ]

  const farmingTypes = [
    { value: 'subsistence', label: 'Subsistence Farming', emoji: '🏠' },
    { value: 'commercial', label: 'Commercial Farming', emoji: '🏭' },
    { value: 'organic', label: 'Organic Farming', emoji: '🌿' },
    { value: 'mixed', label: 'Mixed Farming', emoji: '🔄' }
  ]

  const cropOptions = [
    { value: 'maize', label: 'Maize/Corn', emoji: '🌽' },
    { value: 'rice', label: 'Rice', emoji: '🌾' },
    { value: 'wheat', label: 'Wheat', emoji: '🌾' },
    { value: 'tomatoes', label: 'Tomatoes', emoji: '🍅' },
    { value: 'potatoes', label: 'Potatoes', emoji: '🥔' },
    { value: 'beans', label: 'Beans', emoji: '🫘' },
    { value: 'cassava', label: 'Cassava', emoji: '🍠' },
    { value: 'sorghum', label: 'Sorghum', emoji: '🌾' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (step < 3) {
      setStep(step + 1)
      return
    }

    // Validate final step
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Prepare user data for registration
      const userData = {
        personalInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          email: formData.email
        },
        authentication: {
          password: formData.password
        },
        farmingProfile: {
          experienceLevel: formData.experienceLevel,
          farmingType: formData.farmingType,
          primaryCrops: formData.primaryCrops,
          farmSize: parseFloat(formData.farmSize) || 0
        },
        location: {
          country: formData.country,
          region: formData.region,
          coordinates: formData.coordinates || [0, 0]
        },
        preferences: {
          language: 'en',
          units: 'metric',
          notifications: {
            weather: true,
            irrigation: true,
            pests: true,
            harvest: true
          }
        }
      }

      const result = await register(userData)
      
      if (result.success) {
        navigate('/dashboard')
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (type === 'checkbox') {
      if (name === 'primaryCrops') {
        setFormData(prev => ({
          ...prev,
          primaryCrops: checked 
            ? [...prev.primaryCrops, value]
            : prev.primaryCrops.filter(crop => crop !== value)
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
    
    if (error) setError('')
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            coordinates: [position.coords.longitude, position.coords.latitude]
          }))
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  if (isLoading) {
    return <LoadingScreen message="Creating your account..." />
  }

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 safe-top">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="card">
          {/* Header */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow"
            >
              <span className="text-2xl">🌾</span>
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Join AgriSphere
            </h1>
            <p className="text-gray-600">
              Create your farming assistant account
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center mb-6">
            <div className="flex space-x-2">
              {[1, 2, 3].map((stepNum) => (
                <div
                  key={stepNum}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    stepNum <= step ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl"
            >
              <p className="text-red-700 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <motion.div
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <h3 className="font-semibold text-gray-800 mb-4">Personal Information</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label className="input-label">{t('firstName')}</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="input-primary"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">{t('lastName')}</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="input-primary"
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">{t('phoneNumber')}</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+1234567890"
                    className="input-primary"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">{t('email')} (Optional)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-primary"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Farming Profile */}
            {step === 2 && (
              <motion.div
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <h3 className="font-semibold text-gray-800 mb-4">Farming Profile</h3>
                
                <div className="input-group">
                  <label className="input-label">Experience Level</label>
                  <div className="space-y-2">
                    {experienceLevels.map((level) => (
                      <label key={level.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-2xl hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="experienceLevel"
                          value={level.value}
                          checked={formData.experienceLevel === level.value}
                          onChange={handleChange}
                          className="text-primary-600"
                        />
                        <span className="text-2xl">{level.emoji}</span>
                        <span className="text-sm text-gray-700">{level.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Farming Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {farmingTypes.map((type) => (
                      <label key={type.value} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-2xl hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="farmingType"
                          value={type.value}
                          checked={formData.farmingType === type.value}
                          onChange={handleChange}
                          className="text-primary-600"
                        />
                        <span className="text-lg">{type.emoji}</span>
                        <span className="text-xs text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Primary Crops (Select all that apply)</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {cropOptions.map((crop) => (
                      <label key={crop.value} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          name="primaryCrops"
                          value={crop.value}
                          checked={formData.primaryCrops.includes(crop.value)}
                          onChange={handleChange}
                          className="text-primary-600"
                        />
                        <span>{crop.emoji}</span>
                        <span className="text-xs text-gray-700">{crop.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Farm Size (hectares)</label>
                  <input
                    type="number"
                    name="farmSize"
                    value={formData.farmSize}
                    onChange={handleChange}
                    placeholder="0.5"
                    step="0.1"
                    min="0"
                    className="input-primary"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Location & Security */}
            {step === 3 && (
              <motion.div
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <h3 className="font-semibold text-gray-800 mb-4">Location & Security</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="input-group">
                    <label className="input-label">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="input-primary"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Region/State</label>
                    <input
                      type="text"
                      name="region"
                      value={formData.region}
                      onChange={handleChange}
                      className="input-primary"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="btn-outline flex items-center space-x-2"
                  >
                    <MapPinIcon className="w-4 h-4" />
                    <span>Get Location</span>
                  </button>
                  {formData.coordinates && (
                    <span className="text-xs text-green-600">✓ Location set</span>
                  )}
                </div>

                <div className="input-group">
                  <label className="input-label">{t('password')}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="input-primary pr-12"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">{t('confirmPassword')}</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input-primary"
                    required
                  />
                </div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex space-x-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 btn-outline"
                >
                  {t('back')}
                </button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="flex-1 btn-primary"
              >
                {step === 3 ? 'Create Account' : t('next')}
              </motion.button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-gray-600 text-sm">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              {t('login')}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Register