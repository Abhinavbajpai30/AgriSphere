import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeftIcon, 
  MapPinIcon, 
  CheckCircleIcon,
  PlusIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import FarmPlotting from '../Onboarding/steps/FarmPlotting'
import CropSelection from '../Onboarding/steps/CropSelection'
import apiService, { farmApi, onboardingApi } from '../../services/api'

const AddFarm = () => {
  const navigate = useNavigate()
  const { t } = useLanguage()
  const { user } = useAuth()
  
  const [currentStep, setCurrentStep] = useState('location')
  const [farmData, setFarmData] = useState({
    location: {
      coordinates: null,
      address: '',
      country: '',
      region: ''
    },
    farmBoundary: {
      coordinates: [],
      area: 0,
      name: ''
    },
    crops: []
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000)
  }

  const steps = [
    { id: 'location', title: 'Farm Location', icon: MapPinIcon },
    { id: 'boundary', title: 'Farm Boundary', icon: MapPinIcon },
    { id: 'crops', title: 'Select Crops', icon: CheckCircleIcon }
  ]

  const updateFarmData = (newData) => {
    setFarmData(prev => ({ ...prev, ...newData }))
  }

  const handleNext = async () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep)
    
    // If we're on the location step, geocode the address before proceeding
    if (currentStep === 'location') {
      try {
        setIsLoading(true)
        setError('')
        
        // Check if manual coordinates are already provided
        if (farmData.location.coordinates && farmData.location.coordinates.length === 2) {
          console.log('Using manual coordinates:', farmData.location.coordinates)
          setCurrentStep(steps[currentIndex + 1].id)
          return
        }
        
        // Try multiple address variations for better geocoding success
        const addressVariations = [
          `${farmData.location.address}, ${farmData.location.region}, ${farmData.location.country}`,
          `${farmData.location.address}, ${farmData.location.country}`,
          `${farmData.location.address}`
        ]
        
        let geocodingSuccess = false
        let coordinates = null
        
        for (const address of addressVariations) {
          try {
            console.log('Trying geocoding with:', address)
            
            // Use centralized API service
            const response = await onboardingApi.geocode({ address })
            
            const data = response.data
            
            if (data.status === 'success' && data.data.coordinates) {
              coordinates = data.data.coordinates
              geocodingSuccess = true
              console.log('Geocoding successful with address:', address)
              console.log('Coordinates:', coordinates)
              break
            }
          } catch (error) {
            console.log('Geocoding failed for address:', address, error.message)
            continue
          }
        }
        
        if (geocodingSuccess && coordinates) {
          // Update farm data with coordinates
          updateFarmData({
            location: {
              ...farmData.location,
              coordinates: coordinates
            }
          })
          
          // Proceed to next step
          setCurrentStep(steps[currentIndex + 1].id)
        } else {
          throw new Error('Could not find location with any address variation. Please check the address or use manual coordinates.')
        }
      } catch (error) {
        console.error('Geocoding error:', error)
        setError('Could not find the location. Please check the address and try again, or use manual coordinates.')
      } finally {
        setIsLoading(false)
      }
    } else {
      // For other steps, just proceed normally
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1].id)
      }
    }
  }

  const handleBack = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id)
    }
  }

  const handleComplete = async () => {
    if (!farmData.location.coordinates || !farmData.farmBoundary.coordinates || farmData.crops.length === 0) {
      setError('Please complete all steps before creating the farm')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Validate that we have boundary coordinates
      if (!farmData.farmBoundary.coordinates || farmData.farmBoundary.coordinates.length < 3) {
        throw new Error('Farm boundary must have at least 3 points');
      }
      
      // Convert boundary coordinates to proper GeoJSON format [lng, lat]
      const boundaryCoordinates = farmData.farmBoundary.coordinates.map(coord => [coord[1], coord[0]]); // Convert [lat, lng] to [lng, lat]
      
      console.log('Original boundary coordinates:', farmData.farmBoundary.coordinates);
      console.log('Converted boundary coordinates:', boundaryCoordinates);
      
      // Validate coordinates are within valid ranges
      const validCoordinates = boundaryCoordinates.every(coord => 
        coord[0] >= -180 && coord[0] <= 180 && 
        coord[1] >= -90 && coord[1] <= 90
      );
      
      if (!validCoordinates) {
        throw new Error('Invalid coordinates detected. Please redraw the farm boundary.');
      }
      
      // Ensure polygon is closed (first and last point should be the same)
      if (boundaryCoordinates.length > 0 && 
          (boundaryCoordinates[0][0] !== boundaryCoordinates[boundaryCoordinates.length - 1][0] || 
           boundaryCoordinates[0][1] !== boundaryCoordinates[boundaryCoordinates.length - 1][1])) {
        boundaryCoordinates.push([boundaryCoordinates[0][0], boundaryCoordinates[0][1]]); // Close the polygon
        console.log('Polygon closed, final coordinates:', boundaryCoordinates);
      }
      
      const farmPayload = {
        farmInfo: {
          name: farmData.farmBoundary.name || 'New Farm',
          farmType: 'crop_farm',
          totalArea: {
            value: farmData.farmBoundary.area,
            unit: 'hectares'
          }
        },
        location: {
          address: farmData.location.address,
          centerPoint: {
            type: 'Point',
            coordinates: farmData.location.coordinates
          },
          boundary: {
            type: 'Polygon',
            coordinates: [boundaryCoordinates] // Wrap in array for GeoJSON Polygon
          },
          country: farmData.location.country,
          region: farmData.location.region,
          timezone: 'UTC'
        },
        currentCrops: farmData.crops.map(crop => ({
          cropName: crop.name,
          plantingDate: new Date(),
          expectedHarvestDate: null,
          area: {
            value: crop.area || farmData.farmBoundary.area / farmData.crops.length,
            unit: 'hectares'
          },
          growthStage: 'planting'
        })),
        status: 'active'
      }

      const response = await farmApi.createFarm(farmPayload)
      
      console.log('Farm creation response:', response.data)
      
      if (response.data && response.data.status === 'success') {
        // Show success message and redirect
        const farmId = response.data.data?.farm?._id || response.data.farm?._id
        
        // Show success toast
        showToast('Farm created successfully! 🎉', 'success')
        
        // Redirect to farm management page
        navigate('/farm', { 
          state: { 
            message: 'Farm created successfully! 🎉',
            farmId: farmId
          }
        })
      } else {
        throw new Error('Farm creation failed. Please try again.')
      }
    } catch (error) {
      console.error('Error creating farm:', error)
      setError('Failed to create farm. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'location':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">📍 Farm Location</h2>
              <p className="text-gray-600">Set the location of your new farm</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Farm Address
                  </label>
                  <input
                    type="text"
                    placeholder="Enter farm address or location"
                    value={farmData.location.address}
                    onChange={(e) => updateFarmData({
                      location: { ...farmData.location, address: e.target.value }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      placeholder="Country"
                      value={farmData.location.country}
                      onChange={(e) => updateFarmData({
                        location: { ...farmData.location, country: e.target.value }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Region/State
                    </label>
                    <input
                      type="text"
                      placeholder="Region"
                      value={farmData.location.region}
                      onChange={(e) => updateFarmData({
                        location: { ...farmData.location, region: e.target.value }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                
                {/* Manual Coordinates Option */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Manual Coordinates (Optional)</h4>
                  <p className="text-xs text-gray-600 mb-3">If geocoding fails, you can manually enter coordinates</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g., 28.6139"
                        value={farmData.location.coordinates?.[1] || ''}
                        onChange={(e) => {
                          const lat = parseFloat(e.target.value)
                          const lng = farmData.location.coordinates?.[0] || 0
                          updateFarmData({
                            location: {
                              ...farmData.location,
                              coordinates: [lng, lat]
                            }
                          })
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g., 77.2090"
                        value={farmData.location.coordinates?.[0] || ''}
                        onChange={(e) => {
                          const lng = parseFloat(e.target.value)
                          const lat = farmData.location.coordinates?.[1] || 0
                          updateFarmData({
                            location: {
                              ...farmData.location,
                              coordinates: [lng, lat]
                            }
                          })
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-6">
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors flex items-center space-x-2"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Back</span>
                  </button>
                  
                  <button
                    onClick={handleNext}
                    disabled={!farmData.location.address || !farmData.location.country || !farmData.location.region || isLoading}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 border-2 ${
                      farmData.location.address && farmData.location.country && farmData.location.region && !isLoading
                        ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500'
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                    }`}
                    title={`Address: ${farmData.location.address || 'empty'}, Country: ${farmData.location.country || 'empty'}, Region: ${farmData.location.region || 'empty'}`}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span>Finding location...</span>
                      </>
                    ) : (
                      <>
                        <span>Next</span>
                        <ArrowLeftIcon className="w-5 h-5 rotate-180" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'boundary':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">🗺️ Farm Boundary</h2>
              <p className="text-gray-600">Draw the boundary of your farm area</p>
            </div>
            
            <FarmPlotting
              onNext={handleNext}
              onBack={handleBack}
              onboardingData={farmData}
              updateData={updateFarmData}
              isAddFarm={true}
            />
          </div>
        )

      case 'crops':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">🌱 Select Crops</h2>
              <p className="text-gray-600">Choose crops for your new farm</p>
            </div>
            
            <CropSelection
              onNext={handleComplete}
              onBack={handleBack}
              onboardingData={farmData}
              updateData={updateFarmData}
              isAddFarm={true}
            />
          </div>
        )

      default:
        return null
    }
  }

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/farm')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back to Farms</span>
            </button>
            
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-800">Add New Farm</h1>
              <p className="text-sm text-gray-600">Step {currentStepIndex + 1} of {steps.length}</p>
            </div>
            
            <button
              onClick={() => navigate('/farm')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-4xl mx-auto px-6 py-2">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex
              const isCurrent = index === currentStepIndex
              const IconComponent = step.icon
              
              return (
                <div key={step.id} className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted 
                      ? 'bg-green-500 text-white' 
                      : isCurrent 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                      <IconComponent className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    isCompleted 
                      ? 'text-green-600' 
                      : isCurrent 
                        ? 'text-blue-600' 
                        : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-1 rounded ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-red-600 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <span className="text-gray-700">Creating your farm...</span>
            </div>
          </motion.div>
        )}

        {/* Toast Notification */}
        <AnimatePresence>
          {toast.show && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[9999] px-6 py-3 rounded-lg shadow-lg ${
                toast.type === 'success' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-red-500 text-white'
              }`}
            >
              <div className="flex items-center space-x-2">
                {toast.type === 'success' ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5" />
                )}
                <span className="font-medium">{toast.message}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AddFarm 