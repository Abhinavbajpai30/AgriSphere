import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  SparklesIcon,
  TrendingUpIcon,
  CalendarIcon,
  MapPinIcon,
  StarIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  SproutIcon,
  CoinsIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  ClockIcon,
  DollarSignIcon,
  CheckCircleIcon,
  X
} from 'lucide-react';
import apiService, { farmApi } from '../../services/api';
import PlantGrowthAnimation from '../../components/Common/PlantGrowthAnimation';
import { useAuth } from '../../contexts/AuthContext';

const CropPlanning = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState('overview');
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [cropComparison, setCropComparison] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredCrop, setHoveredCrop] = useState(null);
  const [farms, setFarms] = useState([]);
  const [farmsLoading, setFarmsLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState({
    experience: 'intermediate',
    budget: 'medium',
    marketAccess: 'local',
    riskTolerance: 'medium'
  });

  // Optimized hover handlers to prevent unnecessary re-renders
  const handleHover = useCallback((crop) => {
    setHoveredCrop(crop);
  }, []);

  const handleHoverEnd = useCallback(() => {
    // Add a small delay to ensure smooth transitions
    setTimeout(() => {
      setHoveredCrop(null);
    }, 50);
  }, []);

  const handleCropSelect = useCallback((crop) => {
    setSelectedCrop(crop);
  }, []);

  // Stable key for recommendations to prevent re-renders
  const recommendationsKey = useCallback(() => {
    return recommendations?.topRecommendations?.map(crop => crop.cropKey).join('-') || '';
  }, [recommendations?.topRecommendations]);

  // Fetch farms from API
  useEffect(() => {
    const fetchFarms = async () => {
      if (!user) return; // Don't fetch if user is not authenticated
      
      setFarmsLoading(true);
      try {
        const response = await farmApi.getFarms();
        console.log('Farm API response:', response.data);
        
        if (response.data && response.data.data && response.data.data.farms && response.data.data.farms.length > 0) {
          console.log('Found farms:', response.data.data.farms.length);
          // Transform farm data to match the expected format
          const transformedFarms = response.data.data.farms.map(farm => ({
            id: farm._id,
            name: farm.farmInfo.name,
            size: farm.farmInfo.totalArea.value,
            location: farm.location.address,
            soilType: farm.fields?.[0]?.soilType || 'Unknown',
            farmType: farm.farmInfo.farmType,
            coordinates: farm.location.centerPoint.coordinates
          }));
          console.log('Transformed farms:', transformedFarms);
          setFarms(transformedFarms);
          
          // Auto-select the first farm if available
          if (transformedFarms.length > 0 && !selectedFarm) {
            setSelectedFarm(transformedFarms[0]);
          }
        } else {
          console.log('No farms found in API response');
          setFarms([]);
        }
      } catch (error) {
        console.error('Error fetching farms:', error);
        // Don't use mock data, just show empty state
        setFarms([]);
      } finally {
        setFarmsLoading(false);
      }
    };

    fetchFarms();
  }, [user]); // Add user as dependency to refresh when user changes

  useEffect(() => {
    if (selectedFarm) {
      fetchCropRecommendations();
    }
  }, [selectedFarm, userPreferences]);

  // Reset selected farm when user changes
  useEffect(() => {
    setSelectedFarm(null);
    setRecommendations(null);
    setSelectedCrop(null);
    setCropComparison(null);
  }, [user]);

  const fetchCropRecommendations = async () => {
    if (!selectedFarm) return;
    
    setIsLoading(true);
    try {
      const response = await apiService.post('/planning/recommendations', {
        farmId: selectedFarm.id,
        ...userPreferences
      });
              setRecommendations(response.data.message || response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      // Use mock data for demo
      setRecommendations({
        topRecommendations: [
          {
            cropKey: 'tomato',
            name: 'Tomato',
            image: '/images/crops/tomato.jpg',
            overallScore: 85,
            recommendation: 'highly_recommended',
            profitProjection: { profit: 45000, margin: 60, roi: '180%' },
            growing: { duration: 90, difficulty: 'medium' },
            waterRequirement: { total: 600, irrigationNeeded: 400 },
            bestPlantingTime: 'Plant now',
            benefits: ['High market demand', 'Multiple harvests possible', 'Rich in vitamins'],
            challenges: ['Pest susceptible', 'Regular watering needed', 'Temperature sensitive'],
            riskFactors: { drought: 'high', pest: 'high', market: 'low' }
          },
          {
            cropKey: 'corn',
            name: 'Corn (Maize)',
            image: '/images/crops/corn.jpg',
            overallScore: 78,
            recommendation: 'recommended',
            profitProjection: { profit: 32000, margin: 45, roi: '140%' },
            growing: { duration: 120, difficulty: 'easy' },
            waterRequirement: { total: 500, irrigationNeeded: 300 },
            bestPlantingTime: 'Best time: Apr',
            benefits: ['Stable market', 'Drought tolerant varieties', 'Multiple uses'],
            challenges: ['Large planting area needed', 'Storage challenges', 'Wind vulnerable'],
            riskFactors: { drought: 'medium', pest: 'medium', market: 'low' }
          },
          {
            cropKey: 'potato',
            name: 'Potato',
            image: '/images/crops/potato.jpg',
            overallScore: 72,
            recommendation: 'suitable_with_care',
            profitProjection: { profit: 28000, margin: 55, roi: '120%' },
            growing: { duration: 75, difficulty: 'easy' },
            waterRequirement: { total: 400, irrigationNeeded: 250 },
            bestPlantingTime: 'Best time: Nov',
            benefits: ['Short growing season', 'High yield potential', 'Good storage life'],
            challenges: ['Disease susceptible', 'Quality seed needed', 'Price volatility'],
            riskFactors: { drought: 'medium', pest: 'medium', market: 'medium' }
          }
        ],
        seasonalCalendar: {
          spring: {
            months: ['March', 'April', 'May'],
            recommendedCrops: [
              { name: 'Tomato', duration: 90, expectedYield: 25000, score: 85 }
            ]
          },
          summer: {
            months: ['June', 'July', 'August'],
            recommendedCrops: [
              { name: 'Corn', duration: 120, expectedYield: 8000, score: 78 }
            ]
          }
        },
        climateAdaptation: [
          {
            risk: 'High Temperature',
            impact: 'Heat stress on crops',
      priority: 'high',
            strategies: ['Use heat-tolerant varieties', 'Adjust planting dates'],
            affectedCrops: ['Tomato', 'Potato']
          }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRecommendationBadge = (recommendation) => {
    switch (recommendation) {
      case 'highly_recommended':
        return { text: 'Highly Recommended', color: 'bg-green-500', icon: '⭐' };
      case 'recommended':
        return { text: 'Recommended', color: 'bg-blue-500', icon: '👍' };
      case 'suitable_with_care':
        return { text: 'Suitable with Care', color: 'bg-yellow-500', icon: '⚠️' };
      default:
        return { text: 'Not Recommended', color: 'bg-red-500', icon: '❌' };
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const CropCard = ({ crop, index, isHovered, onHover, onHoverEnd, onSelect }) => {
    const badge = getRecommendationBadge(crop.recommendation);

    const handleViewDetails = useCallback((e) => {
      e.stopPropagation(); // Prevent card click
      onSelect(crop);
    }, [onSelect, crop]);

    return (
      <motion.div
        whileHover={{ scale: 1.05, y: -10 }}
        onHoverStart={() => onHover(crop)}
        onHoverEnd={onHoverEnd}
        onMouseLeave={onHoverEnd}
        className="relative cursor-pointer group"
      >
        <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-white/40 h-80">
          {/* Crop Image */}
          <div className="relative h-48 bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center overflow-hidden">
            {/* Use simple icon instead of animation to prevent re-renders */}
            <SproutIcon className="w-24 h-24 text-white opacity-80" />
            
            <div className="absolute top-4 right-4">
              <div className={`${badge.color} text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1`}>
                <span>{badge.icon}</span>
                <span>{crop.overallScore}</span>
              </div>
            </div>
            <div className="absolute bottom-4 left-4">
              <span className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
                {crop.bestPlantingTime}
              </span>
            </div>
          </div>

          {/* Crop Info */}
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">{crop.name}</h3>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CoinsIcon className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-semibold text-gray-700">₹{crop.profitProjection.profit.toLocaleString()}</span>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(crop.growing.difficulty)}`}>
                {crop.growing.difficulty}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <ClockIcon className="w-4 h-4" />
                <span>{crop.growing.duration} days</span>
              </span>
              <span className="flex items-center space-x-1">
                <TrendingUpIcon className="w-4 h-4" />
                <span>{crop.profitProjection.roi}</span>
              </span>
            </div>
          </div>

          {/* Hover Overlay */}
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onMouseLeave={onHoverEnd}
                className="absolute inset-0 bg-black/80 flex items-center justify-center p-6"
              >
                <div className="text-center text-white">
                  <h4 className="text-lg font-bold mb-3">Quick Preview</h4>
                  <div className="space-y-2 text-sm">
                    <div>Duration: {crop.growing.duration} days</div>
                    <div>Profit Margin: {crop.profitProjection.margin}%</div>
                    <div>Water Need: {crop.waterRequirement.total}mm</div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleViewDetails}
                    className="mt-4 bg-white text-black px-4 py-2 rounded-full text-sm font-semibold"
                  >
                    View Details
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  const renderFarmSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6"
    >
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center"
            >
              <SparklesIcon className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold text-gray-800">Climate-Smart Planner</h1>
          </div>
          <p className="text-xl text-gray-600">AI-powered crop recommendations for changing climate conditions</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {farmsLoading ? (
            // Loading state
            Array.from({ length: 3 }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl p-8 shadow-xl border border-white/40"
              >
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-6"></div>
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                  <div className="mt-6 h-12 bg-gray-200 rounded-xl"></div>
                </div>
              </motion.div>
            ))
          ) : farms.length === 0 ? (
            // Empty state
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🌾</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Farms Available</h3>
              <p className="text-gray-600 mb-4">
                You don't have any farms set up yet. Create a farm first to get crop recommendations.
              </p>
              <button 
                onClick={() => window.location.href = '/farm'}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
              >
                Go to Farm Management
              </button>
            </div>
          ) : (
            // Farm cards
            farms.map((farm, index) => (
              <motion.div
                key={farm.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedFarm(farm);
                  setCurrentStep('preferences');
                }}
                className="bg-white rounded-3xl p-8 shadow-xl border border-white/40 cursor-pointer hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">{farm.name}</h3>
                  <MapPinIcon className="w-6 h-6 text-green-500" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-semibold text-gray-800">{Number(farm.size).toFixed(2)} hectares</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-semibold text-green-600">{farm.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Soil Type:</span>
                    <span className="font-semibold text-gray-800">{farm.soilType}</span>
                  </div>
                  {farm.farmType && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-semibold text-gray-800 capitalize">{farm.farmType.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>

                <motion.div
                  className="mt-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center py-3 rounded-xl font-semibold"
                  whileHover={{ from: 'from-emerald-500', to: 'to-green-500' }}
                >
                  Get Crop Recommendations
                </motion.div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderPreferences = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Tell us about your preferences</h1>
          <p className="text-xl text-gray-600">This helps us provide better crop recommendations</p>
        </motion.div>

        <div className="bg-white rounded-3xl p-8 shadow-xl border border-white/40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Experience Level */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-4">Experience Level</label>
              <div className="space-y-3">
                {['beginner', 'intermediate', 'expert'].map((level) => (
                  <motion.div
                    key={level}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setUserPreferences(prev => ({ ...prev, experience: level }))}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      userPreferences.experience === level
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold capitalize">{level}</span>
                      {userPreferences.experience === level && (
                        <StarIcon className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-4">Budget Range</label>
              <div className="space-y-3">
                {['low', 'medium', 'high'].map((budget) => (
                  <motion.div
                    key={budget}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setUserPreferences(prev => ({ ...prev, budget }))}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      userPreferences.budget === budget
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold capitalize">{budget}</span>
                      {userPreferences.budget === budget && (
                        <StarIcon className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Market Access */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-4">Market Access</label>
              <div className="space-y-3">
                {['local', 'regional', 'national', 'export'].map((market) => (
                  <motion.div
                    key={market}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setUserPreferences(prev => ({ ...prev, marketAccess: market }))}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      userPreferences.marketAccess === market
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold capitalize">{market}</span>
                      {userPreferences.marketAccess === market && (
                        <StarIcon className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Risk Tolerance */}
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-4">Risk Tolerance</label>
              <div className="space-y-3">
                {['low', 'medium', 'high'].map((risk) => (
                  <motion.div
                    key={risk}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setUserPreferences(prev => ({ ...prev, riskTolerance: risk }))}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      userPreferences.riskTolerance === risk
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold capitalize">{risk}</span>
                      {userPreferences.riskTolerance === risk && (
                        <StarIcon className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentStep('overview')}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold"
            >
              ← Back to Farms
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentStep('recommendations')}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold"
            >
              Get Recommendations →
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderRecommendations = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Crop Recommendations for {selectedFarm?.name}</h1>
            <p className="text-gray-600 mt-2">Climate-smart suggestions based on your preferences</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentStep('preferences')}
            className="px-6 py-3 bg-white rounded-xl shadow-lg border border-gray-200 text-gray-700 font-semibold"
          >
            ← Adjust Preferences
          </motion.button>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <>
            {/* Top 3 Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
                <StarIcon className="w-6 h-6 text-yellow-500" />
                <span>Top 3 Recommendations</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" key={recommendationsKey()}>
                {recommendations?.topRecommendations?.map((crop, index) => (
                  <CropCard
                    key={`crop-${crop.cropKey}-${index}`}
                    crop={crop}
                    index={index}
                    isHovered={hoveredCrop?.cropKey === crop.cropKey}
                    onHover={handleHover}
                    onHoverEnd={handleHoverEnd}
                    onSelect={handleCropSelect}
                  />
                ))}
              </div>
            </motion.div>

            {/* Seasonal Calendar */}
            {recommendations?.seasonalCalendar && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
                  <CalendarIcon className="w-6 h-6 text-blue-500" />
                  <span>Seasonal Planting Calendar</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(recommendations.seasonalCalendar).map(([season, data]) => (
                    <motion.div
                      key={season}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border border-white/40"
                    >
                      <h3 className="text-xl font-bold text-gray-800 mb-4 capitalize">{season}</h3>
                      <p className="text-gray-600 mb-4">{data.months?.join(', ')}</p>
                      
                      <div className="space-y-3">
                        {data.recommendedCrops?.map((crop, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                              <div className="font-semibold text-gray-800">{crop.name}</div>
                              <div className="text-sm text-gray-600">{crop.duration} days</div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-600">{crop.score}</div>
                              <div className="text-xs text-gray-500">Score</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Climate Adaptation */}
            {recommendations?.climateAdaptation && recommendations.climateAdaptation.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
                  <ShieldCheckIcon className="w-6 h-6 text-orange-500" />
                  <span>Climate Adaptation Strategies</span>
                </h2>
                
                <div className="space-y-4">
                  {recommendations.climateAdaptation.map((adaptation, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="bg-white rounded-2xl p-6 shadow-lg border border-white/40"
                    >
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-xl ${
                          adaptation.priority === 'high' ? 'bg-red-100' : 'bg-yellow-100'
                        }`}>
                          <AlertTriangleIcon className={`w-6 h-6 ${
                            adaptation.priority === 'high' ? 'text-red-500' : 'text-yellow-500'
                          }`} />
                        </div>
                      <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-800 mb-2">{adaptation.risk}</h3>
                          <p className="text-gray-600 mb-4">{adaptation.impact}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-gray-800 mb-2">Strategies:</h4>
                              <ul className="space-y-1">
                                {adaptation.strategies?.map((strategy, i) => (
                                  <li key={i} className="text-sm text-gray-600 flex items-center space-x-2">
                                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                    <span>{strategy}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            {adaptation.affectedCrops && adaptation.affectedCrops.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">Affected Crops:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {adaptation.affectedCrops.map((crop, i) => (
                                    <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm">
                                      {crop}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Crop Details Modal */}
            <AnimatePresence>
              {selectedCrop && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                  onClick={() => setSelectedCrop(null)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">{selectedCrop.name}</h2>
                      <button
                        onClick={() => setSelectedCrop(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Info */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Basic Information</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Scientific Name:</span>
                            <span className="font-medium">{selectedCrop.scientificName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Category:</span>
                            <span className="font-medium capitalize">{selectedCrop.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Duration:</span>
                            <span className="font-medium">{selectedCrop.growing.duration} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Difficulty:</span>
                            <span className="font-medium capitalize">{selectedCrop.growing.difficulty}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Water Need:</span>
                            <span className="font-medium capitalize">{selectedCrop.growing.waterNeed}</span>
                          </div>
                        </div>
                      </div>

                      {/* Economics */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Economics</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Expected Revenue:</span>
                            <span className="font-medium">₹{selectedCrop.profitProjection.revenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Investment:</span>
                            <span className="font-medium">₹{selectedCrop.profitProjection.investment.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Profit:</span>
                            <span className="font-medium text-green-600">₹{selectedCrop.profitProjection.profit.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Profit Margin:</span>
                            <span className="font-medium">{selectedCrop.profitProjection.margin}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">ROI:</span>
                            <span className="font-medium">{selectedCrop.profitProjection.roi}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Benefits */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Benefits</h3>
                        <ul className="space-y-2">
                          {selectedCrop.benefits?.map((benefit, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Challenges */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Challenges</h3>
                        <ul className="space-y-2">
                          {selectedCrop.challenges?.map((challenge, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <AlertTriangleIcon className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-700">{challenge}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Risk Factors */}
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Risk Factors</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {Object.entries(selectedCrop.riskFactors || {}).map(([risk, level]) => (
                            <div key={risk} className="bg-gray-50 p-3 rounded-lg">
                              <div className="text-sm font-medium text-gray-800 capitalize">{risk}</div>
                              <div className={`text-xs font-semibold mt-1 ${
                                level === 'high' || level === 'very_high' ? 'text-red-600' :
                                level === 'medium' ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {level.replace('_', ' ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Water Requirements */}
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Water Requirements</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-600">Total Water</div>
                            <div className="text-lg font-semibold text-blue-600">{selectedCrop.waterRequirement.total}mm</div>
                          </div>
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-600">Natural Rainfall</div>
                            <div className="text-lg font-semibold text-green-600">{selectedCrop.waterRequirement.naturalRainfall}mm</div>
                          </div>
                          <div className="bg-orange-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-600">Irrigation Needed</div>
                            <div className="text-lg font-semibold text-orange-600">{selectedCrop.waterRequirement.irrigationNeeded}mm</div>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="text-sm text-gray-600">Efficiency</div>
                            <div className="text-lg font-semibold text-purple-600">{(selectedCrop.waterRequirement.efficiency * 100).toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen">
      <AnimatePresence mode="wait">
        {currentStep === 'overview' && (
          <motion.div key="overview">
            {renderFarmSelection()}
          </motion.div>
        )}
        {currentStep === 'preferences' && (
          <motion.div key="preferences">
            {renderPreferences()}
          </motion.div>
        )}
        {currentStep === 'recommendations' && (
          <motion.div key="recommendations">
            {renderRecommendations()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CropPlanning;