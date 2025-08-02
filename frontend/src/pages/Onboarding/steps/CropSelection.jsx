import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HeartIcon, CalendarIcon, SunIcon, SparklesIcon, CheckIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { useLanguage } from '../../../contexts/LanguageContext'

const CropSelection = ({ onNext, onBack, onboardingData, updateData }) => {
  const { t } = useLanguage()
  const [selectedCrops, setSelectedCrops] = useState(onboardingData.crops || [])
  const [currentStep, setCurrentStep] = useState('selection') // selection, planting, growth
  const [showCelebration, setShowCelebration] = useState(false)

  // Comprehensive crop database with beautiful data
  const cropDatabase = [
    {
      id: 'maize',
      name: 'Maize/Corn',
      emoji: '🌽',
      color: 'from-yellow-400 to-orange-500',
      image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400',
      season: 'Rainy Season',
      difficulty: 'Easy',
      growthDays: 90,
      yieldPerHectare: '3-5 tons',
      nutritionFacts: ['High in carbs', 'Rich in fiber', 'Good source of vitamin C'],
      benefits: ['High yield', 'Market demand', 'Food security'],
      plantingTip: 'Plant after first rains for best results'
    },
    {
      id: 'tomatoes',
      name: 'Tomatoes',
      emoji: '🍅',
      color: 'from-red-400 to-red-600',
      image: 'https://images.unsplash.com/photo-1546470427-e3f94b9b9ebe?w=400',
      season: 'All Season',
      difficulty: 'Medium',
      growthDays: 75,
      yieldPerHectare: '20-40 tons',
      nutritionFacts: ['Rich in lycopene', 'High vitamin C', 'Low calories'],
      benefits: ['High market value', 'Multiple harvests', 'Year-round growing'],
      plantingTip: 'Requires consistent watering and support'
    },
    {
      id: 'beans',
      name: 'Beans',
      emoji: '🫘',
      color: 'from-green-400 to-green-600',
      image: 'https://images.unsplash.com/photo-1583223292650-0296a6b5fbb5?w=400',
      season: 'Rainy Season',
      difficulty: 'Easy',
      growthDays: 60,
      yieldPerHectare: '1-2 tons',
      nutritionFacts: ['High protein', 'Rich in fiber', 'Iron source'],
      benefits: ['Nitrogen fixation', 'Soil improvement', 'Drought resistant'],
      plantingTip: 'Great companion crop with maize'
    },
    {
      id: 'potatoes',
      name: 'Potatoes',
      emoji: '🥔',
      color: 'from-amber-400 to-orange-500',
      image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400',
      season: 'Cool Season',
      difficulty: 'Medium',
      growthDays: 80,
      yieldPerHectare: '15-25 tons',
      nutritionFacts: ['High in potassium', 'Vitamin C', 'Complex carbs'],
      benefits: ['High yield', 'Storage friendly', 'Market demand'],
      plantingTip: 'Plant in well-drained, loose soil'
    },
    {
      id: 'rice',
      name: 'Rice',
      emoji: '🌾',
      color: 'from-amber-300 to-yellow-500',
      image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
      season: 'Rainy Season',
      difficulty: 'Hard',
      growthDays: 120,
      yieldPerHectare: '4-6 tons',
      nutritionFacts: ['Primary carbs', 'B vitamins', 'Minerals'],
      benefits: ['Staple food', 'High demand', 'Cultural importance'],
      plantingTip: 'Requires flooded fields and consistent water'
    },
    {
      id: 'cassava',
      name: 'Cassava',
      emoji: '🍠',
      color: 'from-orange-400 to-red-500',
      image: 'https://images.unsplash.com/photo-1621332104012-e59bc9a7ef00?w=400',
      season: 'All Season',
      difficulty: 'Easy',
      growthDays: 240,
      yieldPerHectare: '10-20 tons',
      nutritionFacts: ['High carbs', 'Vitamin C', 'Calcium'],
      benefits: ['Drought resistant', 'Food security', 'Easy to grow'],
      plantingTip: 'Very hardy, grows in poor soils'
    },
    {
      id: 'cabbage',
      name: 'Cabbage',
      emoji: '🥬',
      color: 'from-green-300 to-green-500',
      image: 'https://images.unsplash.com/photo-1594282054458-5f3a55b05e3a?w=400',
      season: 'Cool Season',
      difficulty: 'Medium',
      growthDays: 70,
      yieldPerHectare: '30-50 tons',
      nutritionFacts: ['Vitamin K', 'Vitamin C', 'Folate'],
      benefits: ['Quick growing', 'High value', 'Market demand'],
      plantingTip: 'Prefers cool weather and rich soil'
    },
    {
      id: 'onions',
      name: 'Onions',
      emoji: '🧅',
      color: 'from-purple-400 to-pink-500',
      image: 'https://images.unsplash.com/photo-1518375285767-c0ce1388b4b0?w=400',
      season: 'Dry Season',
      difficulty: 'Medium',
      growthDays: 100,
      yieldPerHectare: '15-25 tons',
      nutritionFacts: ['Antioxidants', 'Vitamin C', 'Sulfur compounds'],
      benefits: ['Long storage', 'High value', 'Medicinal properties'],
      plantingTip: 'Plant in dry season for best bulb formation'
    }
  ]

  // Growth stages for selected crops
  const growthStages = [
    { stage: 'seedbed_preparation', name: 'Seedbed Prep', emoji: '🌱', days: 0 },
    { stage: 'planting', name: 'Just Planted', emoji: '🌿', days: 7 },
    { stage: 'germination', name: 'Sprouting', emoji: '🌱', days: 14 },
    { stage: 'vegetative', name: 'Growing', emoji: '🌿', days: 30 },
    { stage: 'flowering', name: 'Flowering', emoji: '🌸', days: 60 },
    { stage: 'harvest_ready', name: 'Ready to Harvest', emoji: '🎉', days: 90 }
  ]

  // Handle crop selection
  const toggleCropSelection = (crop) => {
    const isSelected = selectedCrops.some(c => c.id === crop.id)
    
    if (isSelected) {
      setSelectedCrops(prev => prev.filter(c => c.id !== crop.id))
    } else {
      const newCrop = {
        ...crop,
        plantingDate: new Date().toISOString().split('T')[0],
        growthStage: 'seedbed_preparation',
        area: Math.round(onboardingData.farmBoundary?.area / 4 * 100) / 100 || 1 // Default to 1/4 of farm area
      }
      setSelectedCrops(prev => [...prev, newCrop])
      
      // Show celebration for first selection
      if (selectedCrops.length === 0) {
        triggerCelebration()
      }
    }
  }

  // Update crop details
  const updateCropDetails = (cropId, updates) => {
    setSelectedCrops(prev => 
      prev.map(crop => 
        crop.id === cropId ? { ...crop, ...updates } : crop
      )
    )
  }

  // Trigger celebration animation
  const triggerCelebration = () => {
    setShowCelebration(true)
    setTimeout(() => setShowCelebration(false), 2000)
  }

  // Handle step navigation
  const proceedToPlanting = () => {
    if (selectedCrops.length > 0) {
      setCurrentStep('planting')
    }
  }

  const proceedToGrowth = () => {
    setCurrentStep('growth')
  }

  const handleComplete = () => {
    updateData({ crops: selectedCrops })
    onNext()
  }

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100'
      case 'Medium': return 'text-yellow-600 bg-yellow-100'
      case 'Hard': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Confetti component
  const Confetti = () => (
    <div className="fixed inset-0 pointer-events-none z-50">
      {Array.from({ length: 50 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            backgroundColor: ['#10b981', '#34d399', '#f59e0b', '#fb923c', '#ef4444'][i % 5]
          }}
          initial={{
            x: Math.random() * window.innerWidth,
            y: -50,
            scale: 0,
            rotate: 0
          }}
          animate={{
            y: window.innerHeight + 100,
            scale: [0, 1, 0],
            rotate: 360
          }}
          transition={{
            duration: 3,
            delay: Math.random() * 2,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  )

  return (
    <div className="min-h-screen p-4">
      {/* Confetti */}
      {showCelebration && <Confetti />}
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            className="w-20 h-20 bg-gradient-to-br from-green-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <SparklesIcon className="w-10 h-10 text-white" />
          </motion.div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Choose Your Crops 🌱
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select the crops you want to grow. We'll help you manage them with smart recommendations!
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* Step 1: Crop Selection */}
          {currentStep === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-8"
            >
              {/* Selection Counter */}
              <motion.div
                className="text-center mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="inline-flex items-center space-x-2 bg-primary-50 px-4 py-2 rounded-full">
                  <HeartIconSolid className="w-5 h-5 text-primary-500" />
                  <span className="font-medium text-primary-700">
                    {selectedCrops.length} crop{selectedCrops.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
              </motion.div>

              {/* Crop Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cropDatabase.map((crop, index) => {
                  const isSelected = selectedCrops.some(c => c.id === crop.id)
                  
                  return (
                    <motion.div
                      key={crop.id}
                      initial={{ opacity: 0, y: 30, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      whileHover={{ 
                        scale: 1.05, 
                        y: -10,
                        transition: { type: 'spring', stiffness: 300 }
                      }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleCropSelection(crop)}
                      className={`
                        relative cursor-pointer rounded-3xl overflow-hidden shadow-xl transition-all duration-300 group
                        ${isSelected 
                          ? 'ring-4 ring-primary-400 ring-opacity-60 shadow-2xl' 
                          : 'hover:shadow-2xl'
                        }
                      `}
                    >
                      {/* Background Image */}
                      <div className={`h-48 bg-gradient-to-br ${crop.color} relative overflow-hidden`}>
                        <motion.div
                          className="absolute inset-0 bg-black/20"
                          animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        
                        {/* Crop Emoji */}
                        <motion.div
                          className="absolute top-4 left-4 text-6xl"
                          animate={{ 
                            rotate: [0, 10, -10, 0],
                            scale: isSelected ? [1, 1.1, 1] : 1
                          }}
                          transition={{ 
                            duration: 3 + index * 0.2, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          {crop.emoji}
                        </motion.div>
                        
                        {/* Selection indicator */}
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg"
                          >
                            <CheckIcon className="w-5 h-5 text-primary-600" />
                          </motion.div>
                        )}
                        
                        {/* Difficulty badge */}
                        <div className={`absolute bottom-4 right-4 px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(crop.difficulty)}`}>
                          {crop.difficulty}
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="bg-white p-4">
                        <h3 className="font-bold text-lg text-gray-800 mb-2 group-hover:text-primary-600 transition-colors">
                          {crop.name}
                        </h3>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="w-4 h-4" />
                            <span>{crop.growthDays} days</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <SunIcon className="w-4 h-4" />
                            <span>{crop.season}</span>
                          </div>
                          
                          <div className="text-xs bg-gray-50 p-2 rounded-lg">
                            💡 {crop.plantingTip}
                          </div>
                        </div>
                        
                        {/* Selection glow effect */}
                        {isSelected && (
                          <motion.div
                            className="absolute inset-0 bg-primary-500/10 rounded-3xl"
                            animate={{ opacity: [0.1, 0.3, 0.1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
              
              {/* Continue Button */}
              {selectedCrops.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <motion.button
                    onClick={proceedToPlanting}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-gradient-to-r from-primary-500 to-green-500 hover:from-primary-600 hover:to-green-600 text-white font-bold py-4 px-8 rounded-full text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center space-x-3 mx-auto"
                  >
                    <span>Set Planting Details</span>
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 2: Planting Details */}
          {currentStep === 'planting' && (
            <motion.div
              key="planting"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Planting Schedule 📅
                </h2>
                <p className="text-gray-600">
                  When do you plan to plant each crop?
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {selectedCrops.map((crop, index) => (
                  <motion.div
                    key={crop.id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg"
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${crop.color} rounded-full flex items-center justify-center text-2xl`}>
                        {crop.emoji}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800">{crop.name}</h3>
                        <p className="text-sm text-gray-600">{crop.growthDays} days to harvest</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Planting Date
                        </label>
                        <input
                          type="date"
                          value={crop.plantingDate}
                          onChange={(e) => updateCropDetails(crop.id, { plantingDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Area (hectares)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          value={crop.area}
                          onChange={(e) => updateCropDetails(crop.id, { area: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setCurrentStep('selection')}
                  className="btn-outline"
                >
                  ← Back to Selection
                </button>
                <motion.button
                  onClick={proceedToGrowth}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary"
                >
                  Set Growth Stages →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Growth Stages */}
          {currentStep === 'growth' && (
            <motion.div
              key="growth"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Current Growth Stage 🌱
                </h2>
                <p className="text-gray-600">
                  What stage are your crops currently in?
                </p>
              </div>
              
              <div className="space-y-6">
                {selectedCrops.map((crop, index) => (
                  <motion.div
                    key={crop.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg"
                  >
                    <div className="flex items-center space-x-4 mb-6">
                      <div className={`w-16 h-16 bg-gradient-to-r ${crop.color} rounded-full flex items-center justify-center text-3xl`}>
                        {crop.emoji}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{crop.name}</h3>
                        <p className="text-gray-600">Planted: {new Date(crop.plantingDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      {growthStages.map((stage) => (
                        <motion.button
                          key={stage.stage}
                          onClick={() => updateCropDetails(crop.id, { growthStage: stage.stage })}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`
                            p-3 rounded-xl text-center transition-all duration-200
                            ${crop.growthStage === stage.stage
                              ? 'bg-gradient-to-r from-primary-500 to-green-500 text-white shadow-lg'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }
                          `}
                        >
                          <div className="text-2xl mb-2">{stage.emoji}</div>
                          <div className="text-xs font-medium">{stage.name}</div>
                          <div className="text-xs opacity-70">{stage.days}+ days</div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setCurrentStep('planting')}
                  className="btn-outline"
                >
                  ← Back to Planting
                </button>
                <motion.button
                  onClick={handleComplete}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  Complete Crop Setup ✨
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
        </motion.div>
      </div>
    </div>
  )
}

export default CropSelection