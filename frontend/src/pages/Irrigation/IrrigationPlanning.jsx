import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DropletIcon, 
  SunIcon, 
  CloudRainIcon,
  ThermometerIcon,
  WindIcon,
  CalendarIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BeakerIcon,
  MapPinIcon
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
    try {
      // Fetch irrigation recommendation
      const recommendationResponse = await apiService.post('/irrigation/recommendation', {
        farmId: selectedFarm.id,
        fieldId: 'field_001',
        cropType: selectedFarm.crop.toLowerCase(),
        growthStage: 'mid',
        fieldSize: selectedFarm.size
      });

      // Fetch weather forecast
      const weatherResponse = await apiService.get('/irrigation/weather', {
        params: { farmId: selectedFarm.id, days: 7 }
      });

      // Fetch irrigation history
      const historyResponse = await apiService.get('/irrigation/history', {
        params: { farmId: selectedFarm.id, limit: 10 }
      });

      setRecommendation(recommendationResponse.data.message);
      setWeatherForecast(weatherResponse.data.message);
      setIrrigationHistory(historyResponse.data.message.logs);

    } catch (error) {
      console.error('Error fetching irrigation data:', error);
      // Use mock data for demo
      setRecommendation({
        recommendation: {
          status: 'needed',
          priority: 'medium',
          action: 'irrigate_soon',
          amount: 500,
          timing: 'within_24_hours',
          reason: 'Soil moisture below optimal level. Irrigation recommended before crop stress occurs.',
          optimalTimes: {
            recommended: [
              { time: '05:30 - 07:00', reason: 'Low evaporation, good water absorption', efficiency: 95 },
              { time: '18:30 - 20:00', reason: 'Cooler temperatures, reduced water loss', efficiency: 85 }
            ]
          }
        },
        waterBalance: {
          currentMoisture: 120,
          totalCapacity: 200,
          moisturePercentage: 60,
          isCritical: false,
          isOptimal: false
        },
        weather: {
          current: { temperature: 28, humidity: 65, windSpeed: 12 },
          forecast: [
            { date: '2025-08-02', temperature: { value: 30 }, precipitation: { value: 0 }, summary: 'sunny' },
            { date: '2025-08-03', temperature: { value: 32 }, precipitation: { value: 2 }, summary: 'cloudy' },
            { date: '2025-08-04', temperature: { value: 28 }, precipitation: { value: 15 }, summary: 'rain' }
          ]
        }
      });
      setWeatherForecast({
        forecast: [
          { date: '2025-08-02', temperature: { value: 30 }, precipitation: { value: 0 }, summary: 'sunny' },
          { date: '2025-08-03', temperature: { value: 32 }, precipitation: { value: 2 }, summary: 'cloudy' },
          { date: '2025-08-04', temperature: { value: 28 }, precipitation: { value: 15 }, summary: 'rain' }
        ]
      });
    } finally {
      setIsLoading(false);
    }
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
    switch (summary) {
      case 'sunny': return <SunIcon className="w-6 h-6 text-yellow-500" />;
      case 'cloudy': return <CloudRainIcon className="w-6 h-6 text-gray-500" />;
      case 'rain': return <CloudRainIcon className="w-6 h-6 text-blue-500" />;
      default: return <SunIcon className="w-6 h-6 text-yellow-500" />;
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
                  <span className="font-semibold text-gray-800">{farm.size} hectares</span>
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
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{selectedFarm?.name} Irrigation Status</h1>
            <p className="text-gray-600 mt-2">{selectedFarm?.crop} • {selectedFarm?.size} hectares</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Status Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Irrigation Recommendation */}
              <div className={`bg-gradient-to-r ${getStatusColor(recommendation?.recommendation?.status)} rounded-3xl p-8 text-white shadow-2xl`}>
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
                  <div className="bg-white/20 rounded-2xl p-4">
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
                </div>

              {/* Soil Moisture Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl p-8 shadow-xl border border-white/40"
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
              </motion.div>
            </motion.div>

            {/* Weather Forecast Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-white/40">
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
                  <TrendingUpIcon className="w-6 h-6 text-blue-500" />
                  <span>7-Day Forecast</span>
                </h3>

                <div className="space-y-4">
                  {weatherForecast?.forecast?.slice(0, 5).map((day, index) => (
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
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                          <div className="text-sm text-gray-600">{day.temperature?.value}°C</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-blue-600 font-semibold">{day.precipitation?.value}mm</div>
                        <div className="text-xs text-gray-500">Rain</div>
                    </div>
                    </motion.div>
                  ))}
                  </div>
              </div>

            {/* Quick Actions */}
              <div className="bg-white rounded-3xl p-6 shadow-xl border border-white/40">
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