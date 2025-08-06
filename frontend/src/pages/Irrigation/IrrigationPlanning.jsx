import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DropletIcon, 
  SunIcon, 
  CloudRainIcon,
  CloudIcon,
  ThermometerIcon,
  WindIcon,
  CalendarIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BeakerIcon,
  MapPinIcon,
  XCircleIcon,
  ZapIcon,
  LeafIcon,
  DollarSignIcon
} from 'lucide-react';
import apiService, { farmApi } from '../../services/api';
import WaterDropAnimation from '../../components/Common/WaterDropAnimation';

const IrrigationPlanning = () => {
  const [currentStep, setCurrentStep] = useState('overview');
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [weatherForecast, setWeatherForecast] = useState(null);
  const [irrigationHistory, setIrrigationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showWaterDrops, setShowWaterDrops] = useState(false);
  const [farms, setFarms] = useState([]);
  const [farmsLoading, setFarmsLoading] = useState(true);

  // Fetch farms from API
  useEffect(() => {
    const fetchFarms = async () => {
      setFarmsLoading(true);
      try {
        const response = await farmApi.getFarms();
        console.log('Irrigation farms API response:', response.data);
        
        if (response.data && response.data.status === 'success' && response.data.data && response.data.data.farms) {
          // Transform farm data to match the expected format
          const transformedFarms = response.data.data.farms.map(farm => ({
            id: farm._id,
            name: farm.farmInfo.name,
            size: farm.farmInfo.totalArea.value,
            location: farm.location.address,
            soilType: farm.fields?.[0]?.soilType || 'Unknown',
            farmType: farm.farmInfo.farmType,
            coordinates: farm.location.centerPoint.coordinates,
            // Add mock crop data for irrigation (since crops aren't stored in farm model)
            crop: farm.currentCrops?.[0]?.cropName || 'Mixed Crops',
            lastIrrigation: '2 days ago' // This would come from irrigation logs
          }));
          setFarms(transformedFarms);
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
  }, []);

  useEffect(() => {
    if (selectedFarm) {
      fetchIrrigationData();
    }
  }, [selectedFarm]);

  const fetchIrrigationData = async () => {
    if (!selectedFarm) return;
    
    setIsLoading(true);
    
    // Initialize with empty data
    let recommendationData = null;
    let weatherData = null;
    let historyData = [];
    
    try {
      // Fetch irrigation recommendation
      const recommendationResponse = await apiService.post('/irrigation/recommendation', {
        farmId: selectedFarm.id,
        fieldId: 'field_001',
        cropType: selectedFarm.crop.toLowerCase(),
        growthStage: 'mid',
        fieldSize: Number(selectedFarm.size).toFixed(2)
      });

      recommendationData = recommendationResponse.data.message || recommendationResponse.data.data || recommendationResponse.data;
      weatherData = recommendationData?.weather || {};
      
    } catch (error) {
      console.error('Error fetching irrigation recommendation:', error);
      // Keep recommendationData as null - will show error card
    }

    try {
      // Fetch irrigation history
      const historyResponse = await apiService.get('/irrigation/history', {
        params: { farmId: selectedFarm.id, limit: 10 }
      });
      
      historyData = (historyResponse.data.data || historyResponse.data)?.logs || [];
    } catch (error) {
      console.error('Error fetching irrigation history:', error);
      // Keep historyData as empty array - will show empty state
    }

    // Set all data (some may be null/empty)
    setRecommendation(recommendationData);
    setWeatherForecast(weatherData);
    setIrrigationHistory(historyData);
    
    setIsLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'urgent': return 'from-red-500 to-orange-500';
      case 'needed': return 'from-blue-500 to-cyan-500';
      case 'skip': return 'from-green-500 to-teal-500';
      case 'optimal': return 'from-emerald-500 to-green-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'urgent': return <AlertTriangleIcon className="w-8 h-8" />;
      case 'needed': return <DropletIcon className="w-8 h-8" />;
      case 'skip': return <CloudRainIcon className="w-8 h-8" />;
      case 'optimal': return <CheckCircleIcon className="w-8 h-8" />;
      default: return <ClockIcon className="w-8 h-8" />;
    }
  };

  const getWeatherIcon = (summary) => {
    switch (summary?.toLowerCase()) {
      case 'sunny':
      case 'clear-day':
      case 'clear':
        return <SunIcon className="w-6 h-6 text-yellow-500" />;
      case 'cloudy':
      case 'partly-cloudy-day':
      case 'overcast':
        return <CloudIcon className="w-6 h-6 text-gray-500" />;
      case 'rain':
      case 'lightrain':
      case 'rainy':
        return <CloudRainIcon className="w-6 h-6 text-blue-500" />;
      case 'snow':
      case 'snowy':
        return <CloudRainIcon className="w-6 h-6 text-blue-300" />;
      case 'thunderstorm':
      case 'storm':
        return <CloudRainIcon className="w-6 h-6 text-purple-500" />;
      case 'fog':
      case 'mist':
        return <CloudIcon className="w-6 h-6 text-gray-400" />;
      default:
        return <SunIcon className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getDataReliabilityColor = (reliability) => {
    switch (reliability) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'limited': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getDataSourceBadge = (source) => {
    switch (source) {
      case 'real':
        return null; // No badge for real data - cleaner interface
      case 'limited':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Limited Data
          </span>
        );
      case 'unavailable':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Unavailable
          </span>
        );
      default:
        return null;
    }
  };


  const renderFarmSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6"
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
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center"
            >
              <DropletIcon className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold text-gray-800">Smart Irrigation Advisor</h1>
          </div>
          <p className="text-xl text-gray-600">AI-powered irrigation recommendations for optimal crop health</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {farmsLoading ? (
            // Loading state
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading farms...</p>
            </div>
          ) : farms.length === 0 ? (
            // Empty state
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🌾</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Farms Available</h3>
              <p className="text-gray-600 mb-4">
                You don't have any farms set up yet. Create a farm first to get irrigation recommendations.
              </p>
              <button 
                onClick={() => window.location.href = '/farm'}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors"
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
                setCurrentStep('analysis');
              }}
              className="bg-white rounded-3xl p-8 shadow-xl border border-white/40 cursor-pointer hover:shadow-2xl transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">{farm.name}</h3>
                <MapPinIcon className="w-6 h-6 text-blue-500" />
          </div>
          
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-semibold text-gray-800">{Number(farm.size).toFixed(2)} hectares</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Crop:</span>
                  <span className="font-semibold text-green-600">{farm.crop}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Last Irrigation:</span>
                  <span className="font-semibold text-gray-800">{farm.lastIrrigation}</span>
                </div>
          </div>
          
              <motion.div
                className="mt-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-center py-3 rounded-xl font-semibold"
                whileHover={{ from: 'from-cyan-500', to: 'to-blue-500' }}
              >
                Check Irrigation Status
              </motion.div>
            </motion.div>
          ))
          )}
        </div>
          </div>
    </motion.div>
  );

  const renderIrrigationAnalysis = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6"
    >
      <WaterDropAnimation 
        isActive={showWaterDrops} 
        intensity={recommendation?.recommendation?.status === 'urgent' ? 'heavy' : 'medium'} 
      />
      
      <div className="max-w-6xl mx-auto py-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{selectedFarm?.name} Irrigation Status</h1>
            <p className="text-gray-600 mt-2">{selectedFarm?.crop} • {Number(selectedFarm?.size).toFixed(2)} hectares</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentStep('overview')}
            className="px-6 py-3 bg-white rounded-xl shadow-lg border border-gray-200 text-gray-700 font-semibold"
          >
            ← Back to Farms
          </motion.button>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-4">
            {/* Data Reliability Warning */}
            {recommendation?.metadata?.warnings && recommendation.metadata.warnings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:col-span-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-6 text-white shadow-lg"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <AlertTriangleIcon className="w-6 h-6" />
                  <h3 className="text-lg font-semibold">Limited Data Available</h3>
                </div>
                <div className="space-y-2">
                  {recommendation.metadata.warnings.map((warning, index) => (
                    <p key={index} className="text-white/90">• {warning}</p>
                  ))}
                </div>
                <div className="mt-4 flex items-center space-x-4">
                  <span className="text-sm text-white/80">Data Reliability:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getDataReliabilityColor(recommendation?.metadata?.dataReliability || 'unknown')
                  }`}>
                    {recommendation?.metadata?.dataReliability === 'high' ? 'High' :
                     recommendation?.metadata?.dataReliability === 'limited' ? 'Limited' :
                     recommendation?.metadata?.dataReliability === 'low' ? 'Low' : 'Unknown'}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Main Status Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-2 space-y-8"
            >
              {/* Irrigation Recommendation */}
              {recommendation ? (
                <div className={`bg-gradient-to-r ${getStatusColor(recommendation?.recommendation?.status)} rounded-3xl p-8 text-white shadow-2xl border-2 border-white/20`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(recommendation?.recommendation?.status)}
                      <div>
                        <h2 className="text-2xl font-bold">
                          {recommendation?.recommendation?.status === 'needed' ? 'Irrigation Needed' :
                           recommendation?.recommendation?.status === 'urgent' ? 'Urgent Irrigation' :
                           recommendation?.recommendation?.status === 'skip' ? 'Skip Irrigation' :
                           recommendation?.recommendation?.status === 'optimal' ? 'Optimal Moisture' :
                           'Monitor Status'}
                        </h2>
                        <p className="text-white/80">Priority: {recommendation?.recommendation?.priority}</p>
                        {/* Data Source Indicators */}
                        <div className="flex items-center space-x-2 mt-2">
                          {getDataSourceBadge(recommendation?.recommendation?.dataSource?.weather)}
                          {getDataSourceBadge(recommendation?.recommendation?.dataSource?.soil)}
                          {getDataSourceBadge(recommendation?.recommendation?.dataSource?.soilType)}
                        </div>
                      </div>
                    </div>
                    
                    {recommendation?.recommendation?.amount > 0 && (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-center"
                      >
                        <div className="text-3xl font-bold">{recommendation?.recommendation?.amount}L</div>
                        <div className="text-white/80">Recommended</div>
                      </motion.div>
                    )}
                  </div>

                  <p className="text-lg text-white/90 mb-6">
                    {recommendation?.recommendation?.reason}
                  </p>

                {recommendation?.recommendation?.optimalTimes?.recommended && (
                  <div className="bg-white/20 rounded-2xl p-4 mb-4">
                    <h3 className="font-semibold mb-3 flex items-center space-x-2">
                      <ClockIcon className="w-5 h-5" />
                      <span>Optimal Irrigation Times</span>
                    </h3>
                    <div className="space-y-2">
                      {recommendation.recommendation.optimalTimes.recommended.map((time, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span>{time.time}</span>
                          <span className="text-sm bg-white/20 px-2 py-1 rounded">{time.efficiency}% efficiency</span>
                      </div>
                      ))}
                    </div>
                  </div>
                )}

                {recommendation?.recommendation?.optimalTimes?.avoid && (
                  <div className="bg-red-500/20 rounded-2xl p-4 mb-4">
                    <h3 className="font-semibold mb-3 flex items-center space-x-2 text-red-100">
                      <XCircleIcon className="w-5 h-5" />
                      <span>Avoid These Times</span>
                    </h3>
                    <div className="space-y-2">
                      {recommendation.recommendation.optimalTimes.avoid.map((time, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-red-100">{time.time}</span>
                          <span className="text-sm bg-red-500/30 px-2 py-1 rounded text-red-100">{time.efficiency}% efficiency</span>
                      </div>
                      ))}
                    </div>
                  </div>
                )}

                {recommendation?.recommendation?.conservationTips && (
                  <div className="bg-green-500/20 rounded-2xl p-4 mb-4">
                    <h3 className="font-semibold mb-3 flex items-center space-x-2 text-green-100">
                      <ZapIcon className="w-5 h-5" />
                      <span>Water Conservation Tips</span>
                    </h3>
                    <div className="space-y-3">
                      {recommendation.recommendation.conservationTips.map((tip, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            tip.impact === 'high' ? 'bg-green-400' : 'bg-yellow-400'
                          }`} />
                          <div>
                            <p className="text-green-100 font-medium">{tip.tip}</p>
                            <p className="text-green-200 text-sm">Potential savings: {tip.savings}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {recommendation?.recommendation?.environmentalImpact && (
                  <div className="bg-blue-500/20 rounded-2xl p-4 mb-4">
                    <h3 className="font-semibold mb-3 flex items-center space-x-2 text-blue-100">
                      <LeafIcon className="w-5 h-5" />
                      <span>Environmental Impact</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-blue-100">
                      <div>
                        <p className="text-sm opacity-80">Sustainability</p>
                        <p className="font-semibold capitalize">{recommendation.recommendation.environmentalImpact.sustainability}</p>
                      </div>
                      <div>
                        <p className="text-sm opacity-80">Water Efficiency</p>
                        <p className="font-semibold capitalize">{recommendation.recommendation.environmentalImpact.waterEfficiency}</p>
                      </div>
                    </div>
                    <p className="text-blue-200 text-sm mt-3">{recommendation.recommendation.environmentalImpact.recommendation}</p>
                  </div>
                )}

                {recommendation?.recommendation?.costEstimate && (
                  <div className="bg-yellow-500/20 rounded-2xl p-4">
                    <h3 className="font-semibold mb-3 flex items-center space-x-2 text-yellow-100">
                      <DollarSignIcon className="w-5 h-5" />
                      <span>Cost Estimate</span>
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-yellow-100">
                      <div className="text-center">
                        <p className="text-sm opacity-80">Water</p>
                        <p className="font-semibold">${recommendation.recommendation.costEstimate.water}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm opacity-80">Energy</p>
                        <p className="font-semibold">${recommendation.recommendation.costEstimate.energy}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm opacity-80">Total</p>
                        <p className="font-semibold">${recommendation.recommendation.costEstimate.total}</p>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              ) : (
                /* Error Card for Recommendation */
                <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl p-8 text-white shadow-2xl border-2 border-white/20">
                  <div className="flex items-center space-x-4 mb-6">
                    <AlertTriangleIcon className="w-8 h-8" />
                    <div>
                      <h2 className="text-2xl font-bold">Irrigation Data Unavailable</h2>
                      <p className="text-white/80">Real weather and soil data required</p>
                    </div>
                  </div>
                  <p className="text-lg text-white/90 mb-6">
                    Unable to provide irrigation recommendations due to insufficient real data for this location. 
                    Weather and soil data from OpenEPI is required for accurate calculations.
                  </p>
                  <div className="bg-white/20 rounded-2xl p-4">
                    <h3 className="font-semibold mb-3 flex items-center space-x-2">
                      <AlertTriangleIcon className="w-5 h-5" />
                      <span>Data Requirements</span>
                    </h3>
                    <div className="space-y-2 text-white/90">
                      <div>• Real-time weather data from OpenEPI</div>
                      <div>• Soil composition data (clay, sand, silt percentages)</div>
                      <div>• Location-specific environmental conditions</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Soil Moisture Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl p-8 shadow-2xl border-2 border-gray-100 hover:shadow-3xl hover:border-gray-200 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                    <BeakerIcon className="w-6 h-6 text-blue-500" />
                    <span>Soil Moisture Analysis</span>
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-gray-200"
                        />
                        <motion.circle
                          cx="60"
                          cy="60"
                          r="50"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeLinecap="round"
                          className={`${
                            recommendation?.waterBalance?.moisturePercentage > 70 ? 'text-green-500' :
                            recommendation?.waterBalance?.moisturePercentage > 40 ? 'text-yellow-500' :
                            'text-red-500'
                          }`}
                          initial={{ strokeDasharray: 0, strokeDashoffset: 0 }}
                          animate={{ 
                            strokeDasharray: 314, 
                            strokeDashoffset: 314 - (314 * (recommendation?.waterBalance?.moisturePercentage || 0) / 100)
                          }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-800">
                            {recommendation?.waterBalance?.moisturePercentage || 0}%
                        </div>
                          <div className="text-sm text-gray-600">Moisture</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Current:</span>
                      <span className="font-semibold">{recommendation?.waterBalance?.currentMoisture || 0}mm</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-semibold">{recommendation?.waterBalance?.totalCapacity || 0}mm</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`font-semibold ${
                        recommendation?.waterBalance?.isOptimal ? 'text-green-600' :
                        recommendation?.waterBalance?.isCritical ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {recommendation?.waterBalance?.isOptimal ? 'Optimal' :
                         recommendation?.waterBalance?.isCritical ? 'Critical' :
                         'Adequate'}
                      </span>
                    </div>
                  </div>
              </div>

              {/* Evapotranspiration Data */}
              {recommendation?.evapotranspiration && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-gray-100 hover:shadow-3xl transition-shadow duration-300"
                >
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                    <ThermometerIcon className="w-5 h-5 text-orange-500" />
                    <span>Evapotranspiration Data</span>
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">ET₀ (Reference)</p>
                      <p className="text-xl font-bold text-gray-800">{recommendation.evapotranspiration.et0} mm/day</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">ET Crop</p>
                      <p className="text-xl font-bold text-gray-800">{recommendation.evapotranspiration.etCrop} mm/day</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Crop Coefficient</p>
                      <p className="text-xl font-bold text-gray-800">{recommendation.evapotranspiration.cropCoefficient}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Soil Details */}
              {recommendation?.soil ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-gray-100 hover:shadow-3xl transition-shadow duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                      <BeakerIcon className="w-5 h-5 text-brown-500" />
                      <span>Soil Properties</span>
                    </h3>
                    {getDataSourceBadge(recommendation.soil.source)}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Soil Type</p>
                      <p className="font-semibold text-gray-800 capitalize">{recommendation.soil.type || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">pH Level</p>
                      <p className="font-semibold text-gray-800">{recommendation.soil.ph || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Organic Matter</p>
                      <p className="font-semibold text-gray-800">{recommendation.soil.organicMatter || 'N/A'}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Drainage</p>
                      <p className="font-semibold text-gray-800 capitalize">{recommendation.soil.drainage}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Water Holding Capacity</p>
                      <p className="font-semibold text-gray-800">{recommendation.soil.waterHoldingCapacity} mm/m</p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                      <BeakerIcon className="w-5 h-5 text-brown-500" />
                      <span>Soil Properties</span>
                    </h3>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Unavailable
                    </span>
                  </div>
                  <div className="text-center py-4 text-gray-500">
                    <BeakerIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="font-medium">Soil data unavailable</p>
                    <p className="text-sm mt-1">Soil composition data is required for accurate irrigation calculations</p>
                  </div>
                </motion.div>
              )}
              </motion.div>
            </motion.div>

            {/* Weather Forecast Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-8"
            >
              {/* Current Weather */}
              {weatherForecast?.current ? (
                <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-gray-100 hover:shadow-3xl transition-shadow duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                      <SunIcon className="w-6 h-6 text-yellow-500" />
                      <span>Current Weather</span>
                    </h3>
                    {getDataSourceBadge(weatherForecast.source)}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Temperature</span>
                      <span className="font-semibold text-gray-800">{weatherForecast.current.temperature}°C</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Humidity</span>
                      <span className="font-semibold text-gray-800">{weatherForecast.current.humidity}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Wind Speed</span>
                      <span className="font-semibold text-gray-800">{weatherForecast.current.windSpeed} km/h</span>
                    </div>
                    {weatherForecast.current.solarRadiation && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Solar Radiation</span>
                        <span className="font-semibold text-gray-800">{weatherForecast.current.solarRadiation} MJ/m²</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                      <SunIcon className="w-6 h-6 text-yellow-500" />
                      <span>Current Weather</span>
                    </h3>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Unavailable
                    </span>
                  </div>
                  <div className="text-center py-4 text-gray-500">
                    <CloudIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="font-medium">Weather data unavailable</p>
                    <p className="text-sm mt-1">Real-time weather data is required for irrigation calculations</p>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-gray-100 hover:shadow-3xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                    <TrendingUpIcon className="w-6 h-6 text-blue-500" />
                    <span>7-Day Forecast</span>
                  </h3>
                  {weatherForecast?.source && getDataSourceBadge(weatherForecast.source)}
                </div>

                <div className="space-y-4">
                  {weatherForecast?.forecast && weatherForecast.forecast.length > 0 ? (
                    weatherForecast.forecast.slice(0, 5).map((day, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                      >
                      <div className="flex items-center space-x-3">
                          {getWeatherIcon(day.summary)}
                          <div>
                            <div className="font-semibold text-gray-800">
                              {day.time ? new Date(day.time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 
                               day.date ? new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }) : 'N/A'}
                          </div>
                            <div className="text-sm text-gray-600">
                              {day.time ? new Date(day.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''} • {typeof day.temperature === 'object' ? day.temperature?.value || 'N/A' : day.temperature || 'N/A'}°C
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-blue-600 font-semibold">
                            {(() => {
                              let precipValue = 'N/A';
                              if (typeof day.precipitation === 'object' && day.precipitation !== null) {
                                precipValue = day.precipitation.value || day.precipitation.amount || 'N/A';
                              } else if (typeof day.precipitation === 'number') {
                                precipValue = day.precipitation;
                              } else if (day.precipitation !== null && day.precipitation !== undefined) {
                                precipValue = day.precipitation;
                              }
                              return precipValue === 'N/A' ? 'N/A' : `${precipValue}mm`;
                            })()}
                          </div>
                          <div className="text-xs text-gray-500">Rain</div>
                      </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <CloudIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="font-medium">Weather forecast data not available</p>
                      <p className="text-sm mt-1">Real-time forecast data is required</p>
                    </div>
                  )}
                  </div>
              </div>

            {/* Quick Actions */}
              <div className="bg-white rounded-3xl p-6 shadow-2xl border-2 border-gray-100 hover:shadow-3xl transition-shadow duration-300">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowWaterDrops(!showWaterDrops)}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-semibold"
                  >
                    Start Irrigation
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-white border-2 border-blue-500 text-blue-600 py-3 rounded-xl font-semibold"
                  >
                    Schedule Later
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold"
                  >
                    View History
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
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
        {currentStep === 'analysis' && (
          <motion.div key="analysis">
            {renderIrrigationAnalysis()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IrrigationPlanning;