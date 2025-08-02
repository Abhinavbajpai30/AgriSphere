import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPinIcon, SignalIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useLanguage } from '../../../contexts/LanguageContext'

// Fix for default markers in react-leaflet
import L from 'leaflet'
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const LocationPermission = ({ onNext, onBack, onboardingData, updateData }) => {
  const { t } = useLanguage()
  const [locationState, setLocationState] = useState('initial') // initial, requesting, success, error, manual
  const [coordinates, setCoordinates] = useState(null)
  const [address, setAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [manualLocation, setManualLocation] = useState('')

  // Benefits of location access
  const benefits = [
    {
      icon: '🌤️',
      title: 'Hyper-Local Weather',
      description: 'Get weather forecasts specific to your exact farm location'
    },
    {
      icon: '💧',
      title: 'Smart Irrigation',
      description: 'Receive irrigation recommendations based on local rainfall'
    },
    {
      icon: '🌱',
      title: 'Crop Optimization',
      description: 'Get variety suggestions perfect for your climate zone'
    },
    {
      icon: '🚨',
      title: 'Early Warnings',
      description: 'Receive alerts about weather events affecting your area'
    }
  ]

  // Request GPS location
  const requestLocation = () => {
    setLocationState('requesting')
    setIsLoading(true)
    setError('')

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          
          setCoordinates(coords)
          
          // Reverse geocode to get address
          try {
            console.log('Reverse geocoding coordinates:', coords.latitude, coords.longitude)
            const addressData = await reverseGeocode(coords.latitude, coords.longitude)
            console.log('Geocoding result:', addressData)
            setAddress(addressData)
            
            // Update onboarding data
            updateData({
              location: {
                ...onboardingData.location,
                coordinates: [coords.longitude, coords.latitude],
                address: addressData,
                country: addressData.split(',').pop()?.trim() || '',
                region: addressData.split(',')[addressData.split(',').length - 2]?.trim() || ''
              }
            })
            
            setLocationState('success')
          } catch (err) {
            console.error('Geocoding failed:', err)
            setLocationState('success') // Still proceed with coordinates
          }
          
          setIsLoading(false)
        },
        (error) => {
          console.error('Geolocation error:', error)
          setError(getLocationErrorMessage(error))
          setLocationState('error')
          setIsLoading(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000
        }
      )
    } else {
      setError('Geolocation is not supported by this browser')
      setLocationState('error')
      setIsLoading(false)
    }
  }

  // Manual location entry
  const handleManualLocation = async () => {
    if (!manualLocation.trim()) return

    setIsLoading(true)
    setError('')

    try {
      // Geocode the manual location
      const coords = await geocodeLocation(manualLocation)
      setCoordinates(coords)
      setAddress(manualLocation)
      
      updateData({
        location: {
          ...onboardingData.location,
          coordinates: [coords.longitude, coords.latitude],
          address: manualLocation,
          country: manualLocation.split(',').pop()?.trim() || '',
          region: manualLocation.split(',')[manualLocation.split(',').length - 2]?.trim() || ''
        }
      })
      
      setLocationState('success')
    } catch (err) {
      setError('Could not find that location. Please try a different address.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle proceed to next step
  const handleNext = () => {
    if (coordinates || manualLocation) {
      onNext()
    }
  }

  // Error message helper
  const getLocationErrorMessage = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Location access was denied. You can enter your location manually below."
      case error.POSITION_UNAVAILABLE:
        return "Location information is unavailable. Please enter your location manually."
      case error.TIMEOUT:
        return "Location request timed out. Please try again or enter manually."
      default:
        return "An unknown error occurred. Please enter your location manually."
    }
  }

  // Geocoding functions using backend API
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`/api/onboarding/geocode?lat=${lat}&lng=${lng}`)
      const data = await response.json()
      
      if (data.status === 'success' && data.data.address) {
        return data.data.address
      } else {
        // Fallback to coordinates if geocoding fails
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      // Fallback to coordinates if API call fails
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
  }

  const geocodeLocation = async (location) => {
    try {
      const response = await fetch(`/api/onboarding/geocode?address=${encodeURIComponent(location)}`)
      const data = await response.json()
      
      if (data.status === 'success' && data.data.coordinates) {
        return {
          latitude: data.data.coordinates[1],
          longitude: data.data.coordinates[0]
        }
      } else {
        throw new Error('Location not found')
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      throw error
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <MapPinIcon className="w-8 h-8 text-white" />
          </motion.div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Where is your farm? 📍
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Help us provide you with accurate weather forecasts, soil data, and 
            farming recommendations specific to your location.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Initial State - Benefits & GPS Request */}
          {locationState === 'initial' && (
            <motion.div
              key="initial"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-8"
            >
              {/* Benefits Grid */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg"
                  >
                    <div className="flex items-start space-x-4">
                      <motion.div
                        className="text-3xl"
                        animate={{ 
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{ 
                          duration: 3 + index,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        {benefit.icon}
                      </motion.div>
                      <div>
                        <h3 className="font-bold text-gray-800 mb-2">{benefit.title}</h3>
                        <p className="text-sm text-gray-600">{benefit.description}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Location Request Button */}
              <div className="text-center">
                <motion.button
                  onClick={requestLocation}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-bold py-4 px-8 rounded-full text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-3 mx-auto mb-4"
                >
                  <MapPinIcon className="w-6 h-6" />
                  <span>Share My Location</span>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    📡
                  </motion.div>
                </motion.button>
                
                <p className="text-sm text-gray-500 mb-4">
                  We'll only use this to provide you with local farming data
                </p>
                
                <button
                  onClick={() => setLocationState('manual')}
                  className="text-primary-600 hover:text-primary-700 underline text-sm"
                >
                  Or enter your location manually
                </button>
              </div>
            </motion.div>
          )}

          {/* Requesting State - Loading Animation */}
          {locationState === 'requesting' && (
            <motion.div
              key="requesting"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center py-12"
            >
              <motion.div
                className="w-32 h-32 bg-gradient-to-br from-blue-400 to-green-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                  scale: { duration: 1.5, repeat: Infinity }
                }}
              >
                <SignalIcon className="w-12 h-12 text-white" />
              </motion.div>
              
              <motion.h2
                className="text-2xl font-bold text-gray-800 mb-4"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Finding your location... 🛰️
              </motion.h2>
              
              <p className="text-gray-600 mb-8">
                Please allow location access when prompted by your browser
              </p>
              
              {/* Animated GPS waves */}
              <div className="relative">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 border-2 border-blue-400 rounded-full"
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ 
                      scale: 2 + i * 0.5,
                      opacity: 0
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Success State - Map View */}
          {locationState === 'success' && coordinates && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-6"
            >
              {/* Success Message */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center"
              >
                <motion.div
                  className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <CheckCircleIcon className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-green-800 mb-2">
                  Perfect! Location found! 🎯
                </h3>
                <p className="text-green-600">
                  {address || `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`}
                </p>
              </motion.div>

              {/* Map Display */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-64 rounded-2xl overflow-hidden shadow-xl border border-white/40"
              >
                <MapContainer
                  center={[coordinates.latitude, coordinates.longitude]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={[coordinates.latitude, coordinates.longitude]}>
                    <Popup>
                      <div className="text-center">
                        <div className="text-2xl mb-2">🚜</div>
                        <strong>Your Farm Location</strong>
                        <br />
                        <small>{address}</small>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </motion.div>

              {/* Continue Button */}
              <div className="text-center">
                <motion.button
                  onClick={handleNext}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-full text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-3 mx-auto"
                >
                  <span>Continue to Farm Setup</span>
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {locationState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="text-center space-y-6"
            >
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
                <motion.div
                  className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <ExclamationTriangleIcon className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="text-xl font-bold text-orange-800 mb-2">
                  No worries! 😊
                </h3>
                <p className="text-orange-600 mb-4">{error}</p>
                <button
                  onClick={() => setLocationState('manual')}
                  className="btn-primary"
                >
                  Enter Location Manually
                </button>
              </div>
            </motion.div>
          )}

          {/* Manual Entry State */}
          {locationState === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-6"
            >
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg">
                <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                  Enter Your Farm Location 📝
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Farm Address or General Location
                    </label>
                    <input
                      type="text"
                      value={manualLocation}
                      onChange={(e) => setManualLocation(e.target.value)}
                      placeholder="e.g., Nakuru County, Kenya or 123 Farm Road, Texas, USA"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setLocationState('initial')}
                      className="flex-1 btn-outline"
                    >
                      Try GPS Again
                    </button>
                    <motion.button
                      onClick={handleManualLocation}
                      disabled={!manualLocation.trim() || isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Locating...' : 'Confirm Location'}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-between mt-8"
        >
          <button
            onClick={onBack}
            className="btn-outline"
          >
            ← Back
          </button>
          
          {locationState === 'success' && (
            <motion.button
              onClick={handleNext}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="btn-primary"
            >
              Next: Plot Your Farm →
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default LocationPermission