import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from 'react-leaflet'
import { PencilIcon, TrashIcon, CheckCircleIcon, MapIcon } from '@heroicons/react/24/outline'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useLanguage } from '../../../contexts/LanguageContext'

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Drawing component for map interactions
const FarmDrawer = ({ isDrawing, onPointAdd, onComplete, farmBoundary, currentPoints, setCurrentPoints }) => {

  useMapEvents({
    click(e) {
      if (!isDrawing) return
      
      const newPoint = [e.latlng.lat, e.latlng.lng]
      const updatedPoints = [...currentPoints, newPoint]
      
      console.log('Adding point:', newPoint)
      console.log('Updated points:', updatedPoints)
      
      setCurrentPoints(updatedPoints)
      onPointAdd(updatedPoints)
      
      // Auto-complete polygon if we have enough points and user clicks near start
      if (updatedPoints.length >= 3) {
        const firstPoint = updatedPoints[0]
        const firstLatLng = L.latLng(firstPoint[0], firstPoint[1])
        const distance = e.latlng.distanceTo(firstLatLng)
        console.log('Distance to first point:', distance, 'meters')
        console.log('First point:', firstPoint, 'Current click:', [e.latlng.lat, e.latlng.lng])
        if (distance < 50) { // 50 meters threshold
          console.log('Completing polygon automatically')
          onComplete(updatedPoints)
          setCurrentPoints([])
        }
      }
    },
  })

  useEffect(() => {
    if (!isDrawing) {
      setCurrentPoints([])
    }
  }, [isDrawing])

  return (
    <>
      {/* Current drawing points */}
      {currentPoints.length > 0 && (
        <>
          {currentPoints.map((point, index) => (
            <Marker key={index} position={point} />
          ))}
          
          {/* Show partial polygon if we have 3+ points */}
          {currentPoints.length >= 3 && (
            <Polygon
              positions={currentPoints}
              color="#10b981"
              fillColor="#10b981"
              fillOpacity={0.2}
              weight={2}
            />
          )}
        </>
      )}
      
      {/* Final farm boundary */}
      {farmBoundary.length > 0 && (
        <Polygon
          positions={farmBoundary}
          color="#059669"
          fillColor="#34d399"
          fillOpacity={0.3}
          weight={3}
        />
      )}
    </>
  )
}

const FarmPlotting = ({ onNext, onBack, onboardingData, updateData }) => {
  const { t } = useLanguage()
  const [isDrawing, setIsDrawing] = useState(false)
  const [farmBoundary, setFarmBoundary] = useState(onboardingData.farmBoundary?.coordinates || [])
  const [farmName, setFarmName] = useState(onboardingData.farmBoundary?.name || '')
  const [calculatedArea, setCalculatedArea] = useState(0)
  const [showInstructions, setShowInstructions] = useState(true)
  const [isComplete, setIsComplete] = useState(false)
  const [currentPoints, setCurrentPoints] = useState([])
  const mapRef = useRef()

  // Get initial map center from onboarding data
  const mapCenter = onboardingData.location?.coordinates 
    ? [onboardingData.location.coordinates[1], onboardingData.location.coordinates[0]]
    : [20.5937, 78.9629] // Default to India coordinates if no location data

  console.log('FarmPlotting - Raw coordinates:', onboardingData.location?.coordinates)
  console.log('FarmPlotting - Calculated mapCenter:', mapCenter)

  // Debug: Log location data
  useEffect(() => {
    console.log('FarmPlotting - onboardingData:', onboardingData)
    console.log('FarmPlotting - location data:', onboardingData.location)
    console.log('FarmPlotting - mapCenter:', mapCenter)
  }, [onboardingData, mapCenter])

  // Debug: Monitor state changes
  useEffect(() => {
    console.log('State update - isComplete:', isComplete, 'farmBoundary length:', farmBoundary.length, 'calculatedArea:', calculatedArea)
  }, [isComplete, farmBoundary, calculatedArea])

  // Handle map centering when coordinates change
  useEffect(() => {
    if (mapRef.current && onboardingData.location?.coordinates) {
      const map = mapRef.current;
      const newCenter = [onboardingData.location.coordinates[1], onboardingData.location.coordinates[0]];
      console.log('Centering map to:', newCenter);
      map.setView(newCenter, 15);
    }
  }, [onboardingData.location?.coordinates])

  // Calculate area of polygon in hectares using proper geographic calculations
  const calculateArea = (points) => {
    if (points.length < 3) return 0
    
    // Use the Shoelace formula for polygon area
    let area = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      area += points[i][0] * points[j][1]
      area -= points[j][0] * points[i][1]
    }
    area = Math.abs(area) / 2
    
    // Convert to square meters using proper geographic conversion
    // 1 degree of latitude ≈ 111,320 meters
    // 1 degree of longitude ≈ 111,320 * cos(latitude) meters
    const avgLat = points.reduce((sum, point) => sum + point[0], 0) / points.length
    const latMeters = 111320
    const lngMeters = 111320 * Math.cos(avgLat * Math.PI / 180)
    
    // Convert to square meters
    const areaSqMeters = area * latMeters * lngMeters
    
    // Convert to hectares (1 hectare = 10,000 square meters)
    const hectares = areaSqMeters / 10000
    
    return Math.max(hectares, 0.01) // Ensure minimum value for display
  }

  // Start drawing
  const startDrawing = () => {
    setIsDrawing(true)
    setShowInstructions(false)
    setFarmBoundary([])
    setIsComplete(false)
    setCurrentPoints([])
  }

  // Handle point addition during drawing
  const handlePointAdd = (points) => {
    // Real-time area calculation
    const area = calculateArea(points)
    console.log('Points:', points)
    console.log('Calculated area:', area)
    setCalculatedArea(area)
  }

  // Complete polygon drawing
  const completeBoundary = (points) => {
    console.log('Completing boundary with points:', points)
    setFarmBoundary(points)
    setIsDrawing(false)
    setIsComplete(true)
    
    const area = calculateArea(points)
    console.log('Final calculated area:', area)
    setCalculatedArea(area)
    
    // Update onboarding data
    updateData({
      farmBoundary: {
        coordinates: points,
        area: area,
        name: farmName || 'My Farm'
      }
    })
    
    // Show celebration
    showCelebration()
    
    console.log('isComplete set to true, farmBoundary length:', points.length)
  }

  // Clear current boundary
  const clearBoundary = () => {
    setFarmBoundary([])
    setIsComplete(false)
    setCalculatedArea(0)
    setIsDrawing(false)
    setCurrentPoints([])
  }

  // Show celebration animation
  const showCelebration = () => {
    // Create confetti effect
    const confetti = Array.from({ length: 30 }, (_, i) => {
      const element = document.createElement('div')
      element.style.position = 'fixed'
      element.style.width = '10px'
      element.style.height = '10px'
      element.style.backgroundColor = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'][i % 4]
      element.style.borderRadius = '50%'
      element.style.pointerEvents = 'none'
      element.style.zIndex = '1000'
      element.style.left = Math.random() * window.innerWidth + 'px'
      element.style.top = '-10px'
      
      document.body.appendChild(element)
      
      // Animate
      element.animate([
        { transform: 'translateY(-10px) rotate(0deg)', opacity: 1 },
        { transform: `translateY(${window.innerHeight + 10}px) rotate(360deg)`, opacity: 0 }
      ], {
        duration: 3000,
        easing: 'ease-out'
      }).onfinish = () => {
        document.body.removeChild(element)
      }
    })
  }

  // Handle next step
  const handleNext = () => {
    console.log('handleNext called - isComplete:', isComplete, 'farmBoundary length:', farmBoundary.length)
    if (isComplete && farmBoundary.length >= 3) {
      console.log('Proceeding to next step')
      onNext()
    } else {
      console.log('Cannot proceed - isComplete:', isComplete, 'farmBoundary length:', farmBoundary.length)
    }
  }

  // Drawing tips
  const drawingTips = [
    {
      icon: '👆',
      title: 'Tap to Place Points',
      description: 'Tap around your farm boundary to create points'
    },
    {
      icon: '🔄',
      title: 'Close the Polygon',
      description: 'Tap near your first point to complete the boundary'
    },
    {
      icon: '📏',
      title: 'Real-time Area',
      description: 'See your farm area calculated as you draw'
    },
    {
      icon: '✨',
      title: 'Perfect Results',
      description: 'Don\'t worry about precision - you can edit later!'
    }
  ]

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <motion.div
            className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <MapIcon className="w-8 h-8 text-white" />
          </motion.div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Plot Your Farm Boundary 🗺️
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Draw your farm boundaries on the map to get accurate weather and soil data
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden border border-white/40"
            >
              {/* Map Controls */}
              <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {!isDrawing && !isComplete && (
                      <motion.button
                        onClick={startDrawing}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                      >
                        <PencilIcon className="w-5 h-5" />
                        <span>Start Drawing</span>
                      </motion.button>
                    )}
                    
                    {(isDrawing || isComplete) && (
                      <motion.button
                        onClick={clearBoundary}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-red-500/20 hover:bg-red-500/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                        <span>Clear</span>
                      </motion.button>
                    )}
                    
                    {isDrawing && currentPoints.length >= 3 && (
                      <motion.button
                        onClick={() => completeBoundary(currentPoints)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-green-500/20 hover:bg-green-500/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>Complete Boundary ({currentPoints.length} points)</span>
                      </motion.button>
                    )}
                  </div>
                  
                  {/* Real-time area display */}
                  {calculatedArea > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white/20 px-4 py-2 rounded-lg"
                    >
                      <div className="text-sm">Farm Area</div>
                      <div className="font-bold text-lg">
                        {calculatedArea.toFixed(2)} hectares
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
              
              {/* Map Container */}
              <div className="h-96 relative">
                <MapContainer
                  key={`map-${mapCenter[0]}-${mapCenter[1]}`}
                  center={mapCenter}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  ref={mapRef}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Center marker */}
                  <Marker position={mapCenter}>
                    <motion.div
                      className="text-2xl"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      📍
                    </motion.div>
                  </Marker>
                  
                                      {/* Drawing component */}
                    <FarmDrawer
                      isDrawing={isDrawing}
                      onPointAdd={handlePointAdd}
                      onComplete={completeBoundary}
                      farmBoundary={farmBoundary}
                      currentPoints={currentPoints}
                      setCurrentPoints={setCurrentPoints}
                    />
                </MapContainer>
                
                {/* Drawing cursor indicator */}
                {isDrawing && (
                  <motion.div
                    className="absolute top-4 left-4 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg z-[1000]"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center space-x-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="w-3 h-3 bg-white rounded-full"
                      />
                      <span className="text-sm font-medium">Click to add points</span>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Farm Name Input */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">Farm Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Farm Name
                  </label>
                  <input
                    type="text"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="e.g., Green Valley Farm"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
                
                {calculatedArea > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border border-green-200 rounded-xl p-4"
                  >
                    <div className="text-sm text-green-600 mb-1">Calculated Area</div>
                    <div className="text-2xl font-bold text-green-800">
                      {calculatedArea.toFixed(2)} hectares
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      ≈ {(calculatedArea * 2.47).toFixed(1)} acres
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Instructions/Tips */}
            <AnimatePresence>
              {showInstructions && (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg"
                >
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2">📝</span>
                    How to Draw
                  </h3>
                  <div className="space-y-3">
                    {drawingTips.map((tip, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="flex items-start space-x-3"
                      >
                        <span className="text-xl">{tip.icon}</span>
                        <div>
                          <div className="font-medium text-gray-800 text-sm">{tip.title}</div>
                          <div className="text-xs text-gray-600">{tip.description}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success State */}
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 rounded-2xl p-6"
              >
                <motion.div
                  className="text-center"
                  initial={{ y: 10 }}
                  animate={{ y: 0 }}
                >
                  <motion.div
                    className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4"
                    animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.6 }}
                  >
                    <CheckCircleIcon className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-green-800 mb-2">
                    Excellent! 🎉
                  </h3>
                  <p className="text-green-600 text-sm mb-4">
                    Your farm boundary looks perfect! Ready to add some crops?
                  </p>
                  <motion.button
                    onClick={handleNext}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                  >
                    Continue to Crop Selection →
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex justify-between mt-8"
        >
          <button
            onClick={onBack}
            className="btn-outline"
          >
            ← Back
          </button>
          
          {isComplete && (
            <motion.button
              onClick={handleNext}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="btn-primary"
            >
              Next: Choose Crops →
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default FarmPlotting