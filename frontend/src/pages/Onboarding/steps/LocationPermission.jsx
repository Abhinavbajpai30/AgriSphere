import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPinIcon, SignalIcon, CheckCircleIcon, ExclamationTriangleIcon, HandIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
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

// Custom CSS for map markers
const customMarkerStyle = `
  .custom-div-icon {
    background: transparent;
    border: none;
  }
  .custom-div-icon div {
    transition: all 0.3s ease;
  }
  .custom-div-icon:hover div {
    transform: scale(1.2);
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
  }
  
  .manual-selection-mode .leaflet-container {
    cursor: crosshair !important;
  }
  
  .manual-selection-mode .leaflet-container:hover {
    cursor: crosshair !important;
  }
`

// Map click handler component
const MapClickHandler = ({ onMapClick, isManualMode }) => {
  const map = useMapEvents({
    click: (e) => {
      console.log('Map click event triggered:', e.latlng, 'Manual mode:', isManualMode)
      if (isManualMode) {
        console.log('Manual mode active, calling onMapClick')
        onMapClick(e.latlng)
      } else {
        console.log('Manual mode inactive, ignoring click')
      }
    },
    // Disable dragging when in manual mode
    dragstart: (e) => {
      if (isManualMode) {
        console.log('Preventing drag in manual mode')
        e.originalEvent.preventDefault()
        e.originalEvent.stopPropagation()
      }
    },
    // Disable zoom when in manual mode
    zoomstart: (e) => {
      if (isManualMode) {
        console.log('Preventing zoom in manual mode')
        e.originalEvent.preventDefault()
        e.originalEvent.stopPropagation()
      }
    }
  })

  // Update map options when manual mode changes
  useEffect(() => {
    console.log('Updating map controls, manual mode:', isManualMode)
    if (isManualMode) {
      map.dragging.disable()
      map.touchZoom.disable()
      map.doubleClickZoom.disable()
      map.scrollWheelZoom.disable()
      map.boxZoom.disable()
      map.keyboard.disable()
      map.tap.disable()
      console.log('Map controls disabled for manual selection')
    } else {
      map.dragging.enable()
      map.touchZoom.enable()
      map.doubleClickZoom.enable()
      map.scrollWheelZoom.enable()
      map.boxZoom.enable()
      map.keyboard.enable()
      map.tap.enable()
      console.log('Map controls enabled for normal use')
    }
  }, [isManualMode, map])

  return null
}

const LocationPermission = ({ onNext, onBack, onboardingData, updateData }) => {
  const { t } = useLanguage()
  const [locationState, setLocationState] = useState('initial') // initial, requesting, success, error, manual
  const [coordinates, setCoordinates] = useState(null)
  const [address, setAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [manualLocation, setManualLocation] = useState('')
  const [isManualMode, setIsManualMode] = useState(false)
  const [selectedCoordinates, setSelectedCoordinates] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' })

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
            
            // Show success toast
            showToast('GPS location found successfully! 📍', 'success')
            
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
      
      // Show success toast
      showToast('Location found successfully! 🎉', 'success')
      
      setLocationState('success')
    } catch (err) {
      console.error('Manual location geocoding failed:', err)
      
      // Provide specific error messages based on the error type
      let errorMessage = 'Could not find that location. Please try a different address.'
      
      if (err.message === 'Location not found') {
        errorMessage = 'Could not find that location. Please try a different address or be more specific.'
      } else if (err.message.includes('500') || err.message.includes('Internal Server Error')) {
        errorMessage = 'Geocoding service is temporarily unavailable. Please try again in a few moments.'
      } else if (err.message.includes('Network') || err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.'
      }
      
      // Show toast notification
      showToast(errorMessage, 'error')
      
      // Also set error for the input field
      setError(errorMessage)
      
      // Stay in manual state so user can try again
      setLocationState('manual')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle map click for manual location selection
  const handleMapClick = async (latlng) => {
    console.log('Map clicked:', latlng, 'Manual mode:', isManualMode)
    
    if (!isManualMode) {
      console.log('Not in manual mode, ignoring click')
      return
    }
    
    console.log('Processing manual location selection:', latlng)
    setIsLoading(true)
    setSelectedCoordinates(latlng)
    
    try {
      // Reverse geocode the clicked location
      console.log('Reverse geocoding coordinates:', latlng.lat, latlng.lng)
      const addressData = await reverseGeocode(latlng.lat, latlng.lng)
      console.log('Geocoding result:', addressData)
      setAddress(addressData)
      
      // Update onboarding data with new coordinates
      updateData({
        location: {
          ...onboardingData.location,
          coordinates: [latlng.lng, latlng.lat],
          address: addressData,
          country: addressData.split(',').pop()?.trim() || '',
          region: addressData.split(',')[addressData.split(',').length - 2]?.trim() || ''
        }
      })
      
      setCoordinates({ latitude: latlng.lat, longitude: latlng.lng })
      setIsManualMode(false)
      console.log('Location selection completed successfully')
    } catch (err) {
      console.error('Geocoding failed for clicked location:', err)
      // Still update coordinates even if geocoding fails
      setCoordinates({ latitude: latlng.lat, longitude: latlng.lng })
      setAddress(`${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`)
      setIsManualMode(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle manual selection mode
  const toggleManualMode = () => {
    const newMode = !isManualMode
    console.log('Toggling manual mode:', newMode)
    setIsManualMode(newMode)
    if (!newMode) {
      setSelectedCoordinates(null)
      console.log('Manual mode disabled, clearing selected coordinates')
    } else {
      console.log('Manual mode enabled, map is now clickable')
    }
  }

  // Clear errors when switching states
  const clearErrors = () => {
    setError('')
  }

  // Show toast notification
  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type })
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'error' })
    }, 5000)
  }

  // Hide toast
  const hideToast = () => {
    setToast({ show: false, message: '', type: 'error' })
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
      console.log('Geocoding location:', location)
      const response = await fetch(`/api/onboarding/geocode?address=${encodeURIComponent(location)}`)
      
      if (!response.ok) {
        console.error('Geocoding API error:', response.status, response.statusText)
        if (response.status === 500) {
          throw new Error('500 Internal Server Error - Geocoding service unavailable')
        } else if (response.status === 404) {
          throw new Error('Location not found')
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      }
      
      const data = await response.json()
      console.log('Geocoding response:', data)
      
      if (data.status === 'success' && data.data.coordinates) {
        return {
          latitude: data.data.coordinates[1],
          longitude: data.data.coordinates[0]
        }
      } else {
        // Handle API response with error status
        const errorMessage = data.message || 'Location not found'
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      
      // Re-throw network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - Please check your internet connection')
      }
      
      throw error
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <style>{customMarkerStyle}</style>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full"
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
                  onClick={() => {
                    setLocationState('manual')
                    clearErrors()
                  }}
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
                className="relative h-64 rounded-2xl overflow-hidden shadow-xl border border-white/40"
              >
                {/* Manual Selection Overlay */}
                {isManualMode && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-blue-500/20 flex items-center justify-center z-10"
                  >
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-center max-w-sm">
                      <HandIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-blue-800 font-semibold mb-2">Click anywhere on the map to select your farm location</p>
                      <div className="flex items-center justify-center space-x-2 text-blue-600 text-sm">
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                        <span>Map is now in selection mode</span>
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <MapContainer
                  center={[coordinates.latitude, coordinates.longitude]}
                  zoom={13}
                  style={{ height: '100%', width: '100%' }}
                  className={isManualMode ? 'manual-selection-mode' : ''}
                >
                  <MapClickHandler onMapClick={handleMapClick} isManualMode={isManualMode} />
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
                  
                  {/* Show selected coordinates if in manual mode */}
                  {isManualMode && selectedCoordinates && (
                    <Marker 
                      position={[selectedCoordinates.lat, selectedCoordinates.lng]}
                      icon={L.divIcon({
                        className: 'custom-div-icon',
                        html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                      })}
                    >
                      <Popup>
                        <div className="text-center">
                          <div className="text-2xl mb-2">📍</div>
                          <strong>Selected Location</strong>
                          <br />
                          <small>Click to confirm this location</small>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </motion.div>

              {/* Manual Selection Controls */}
              <div className="flex justify-center space-x-4">
                <motion.button
                  onClick={toggleManualMode}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 flex items-center space-x-2 ${
                    isManualMode 
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                  }`}
                >
                  <HandIcon className="w-5 h-5" />
                  <span>{isManualMode ? 'Cancel Selection' : 'Choose Different Location'}</span>
                </motion.button>
              </div>

              {/* Continue Button */}
              <div className="text-center">
                <motion.button
                  onClick={handleNext}
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.05 }}
                  whileTap={{ scale: isLoading ? 1 : 0.95 }}
                  className={`bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-full text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-3 mx-auto ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Updating Location...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue to Farm Setup</span>
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </>
                  )}
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
                  onClick={() => {
                    setLocationState('manual')
                    clearErrors()
                  }}
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
                      onChange={(e) => {
                        setManualLocation(e.target.value)
                        // Clear error when user starts typing
                        if (error) setError('')
                        // Hide toast when user starts typing
                        if (toast.show) hideToast()
                      }}
                      placeholder="e.g., Nakuru County, Kenya or 123 Farm Road, Texas, USA"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
                        error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  
                  {/* Error Display */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 rounded-xl p-4"
                    >
                      <div className="flex items-start space-x-3">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-red-800 font-medium mb-1">Location Not Found</p>
                          <p className="text-red-600 text-sm">{error}</p>
                          <div className="mt-2 text-xs text-red-500">
                            💡 Try being more specific (e.g., "Chandigarh, India" instead of just "Chandigarh")
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setLocationState('initial')
                        setError('')
                      }}
                      className="flex-1 btn-outline"
                    >
                      Try GPS Again
                    </button>
                    <motion.button
                      onClick={handleManualLocation}
                      disabled={!manualLocation.trim() || isLoading}
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      className={`flex-1 font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 ${
                        isLoading || !manualLocation.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                          <span>Locating...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirm Location</span>
                          <motion.span
                            animate={{ x: [0, 2, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            →
                          </motion.span>
                        </>
                      )}
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