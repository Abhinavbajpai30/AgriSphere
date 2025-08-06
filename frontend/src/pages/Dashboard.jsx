import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  SunIcon, 
  CloudIcon, 
  BeakerIcon,
  CalendarDaysIcon,
  ClockIcon,
  ChevronRightIcon,
  SparklesIcon,
  TrophyIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'
import WeatherWidget from '../components/Dashboard/WeatherWidget'
import UrgentTaskCard from '../components/Dashboard/UrgentTaskCard'
import ToolNavigationCard from '../components/Dashboard/ToolNavigationCard'
import ProgressIndicator from '../components/Dashboard/ProgressIndicator'
import AnimatedMascot from '../components/Dashboard/AnimatedMascot'
import FloatingParticles from '../components/Dashboard/FloatingParticles'

const Dashboard = () => {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [particles, setParticles] = useState([])
  
  // Animation refs
  const heroRef = useRef(null)
  const tasksRef = useRef(null)

  useEffect(() => {
    fetchDashboardData()
    
    // Update time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timeInterval)
  }, [])

  // Debug effect to log dashboard data changes
  useEffect(() => {
    console.log('Dashboard data changed:', {
      hasData: !!dashboardData,
      hasActiveFarm: dashboardData?.hasActiveFarm,
      isLoading,
      timestamp: new Date().toISOString()
    })
  }, [dashboardData, isLoading])

  const fetchDashboardData = async (forceRefresh = false) => {
    try {
      console.log('Fetching dashboard data...', { forceRefresh })
      setIsLoading(true)
      
      // Add cache-busting parameter if force refresh is requested
      const url = forceRefresh ? '/dashboard/overview?t=' + Date.now() : '/dashboard/overview'
      const response = await apiService.get(url)
      console.log('Dashboard response:', response)
      
      if (response.data?.status === 'success') {
        // The actual data is in response.data.data, not response.data.message
        const newData = response.data.data || response.data
        console.log('Dashboard data set:', newData)
        setDashboardData(newData)
        
        // Log the hasActiveFarm status for debugging
        console.log('hasActiveFarm status:', newData?.hasActiveFarm)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      // Don't use mock data - set to null to show error state
      setDashboardData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return { text: 'Good Morning', emoji: '🌅', gradient: 'from-orange-400 via-yellow-400 to-pink-400' }
    if (hour < 18) return { text: 'Good Afternoon', emoji: '☀️', gradient: 'from-blue-400 via-cyan-400 to-green-400' }
    return { text: 'Good Evening', emoji: '🌅', gradient: 'from-purple-400 via-pink-400 to-red-400' }
  }

  const getWeatherGradient = () => {
    if (!dashboardData?.weather?.current) return 'from-blue-400 via-cyan-400 to-green-400'
    
    const temp = dashboardData.weather.current.temperature
    if (temp > 30) return 'from-red-400 via-orange-400 to-yellow-400'
    if (temp > 20) return 'from-green-400 via-blue-400 to-cyan-400'
    return 'from-blue-600 via-purple-500 to-indigo-500'
  }

  const coreTools = [
    {
      id: 'crop-doctor',
      title: 'AI Crop Doctor',
      subtitle: 'Instant plant diagnosis',
      description: 'Snap a photo for instant plant health analysis',
      icon: '🩺',
      gradient: 'from-teal-400 via-cyan-500 to-blue-500',
      route: '/diagnosis',
      animation: 'medical',
      stats: { usage: '156 diagnoses', accuracy: '94%' }
    },
    {
      id: 'climate-planner',
      title: 'Climate-Smart Planner',
      subtitle: 'Perfect timing, every season',
      description: 'Plan your crops with weather intelligence',
      icon: '📅',
      gradient: 'from-blue-400 via-indigo-500 to-purple-500',
      route: '/planning',
      animation: 'calendar',
      stats: { usage: '23 plans created', success: '87%' }
    },
    {
      id: 'irrigation-advisor',
      title: 'Smart Irrigation Advisor',
      subtitle: 'Water smarter, not harder',
      description: 'Optimize water usage with AI recommendations',
      icon: '💧',
      gradient: 'from-cyan-400 via-blue-500 to-indigo-500',
      route: '/irrigation',
      animation: 'water',
      stats: { savings: '30% water saved', efficiency: '92%' }
    }
  ]

  const greeting = getTimeBasedGreeting()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Loading your farm dashboard...</p>
        </div>
      </div>
    )
  }

  if (!dashboardData?.hasActiveFarm) {
    console.log('No active farm detected. Dashboard data:', dashboardData)
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🌱</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Complete Your Farm Setup</h2>
          <p className="text-gray-600 mb-6">Set up your farm to unlock the full dashboard experience</p>
          
          {/* Debug Info */}
          <div className="bg-gray-100 rounded-lg p-4 text-sm mb-4">
            <h3 className="font-bold mb-2">Debug Information:</h3>
            <p><strong>Dashboard Data:</strong> {dashboardData ? 'Present' : 'None'}</p>
            <p><strong>Has Active Farm:</strong> {dashboardData?.hasActiveFarm ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user ? user.personalInfo?.firstName || 'Unknown' : 'Not logged in'}</p>
            <p><strong>User ID:</strong> {user?._id || 'None'}</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/onboarding'}
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-3 rounded-full font-semibold"
          >
            Complete Setup
          </motion.button>
        </motion.div>
      </div>
    )
  }

  // Fallback for when dashboard data is not available
  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Dashboard Unavailable</h2>
          <p className="text-gray-600 mb-6">Unable to load dashboard data. Please try refreshing the page.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-full font-semibold"
          >
            Refresh Page
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Floating Particles */}
      <FloatingParticles weatherType={dashboardData?.weather?.animations?.primary || 'sunny'} />
      
      {/* Animated Mascot */}
      <AnimatedMascot 
        position="bottom-right" 
        mood="happy"
        message="Great job on your farming journey! 🌱"
      />
      
      {/* Invisible overlay to prevent navigation interference */}
      <div className="fixed bottom-0 left-0 w-full h-24 pointer-events-none z-[9998]"></div>

      <div className="relative z-10">
        {/* Hero Section */}
        <motion.section
          ref={heroRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className={`bg-gradient-to-br ${getWeatherGradient()} text-white relative overflow-hidden`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[url('/patterns/farm-grid.svg')] bg-repeat"></div>
          </div>

          <div className="relative z-10 px-6 py-12">
            <div className="max-w-7xl mx-auto">
              {/* Greeting Header */}
              <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="flex items-center justify-between mb-8"
              >
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-3xl">{greeting.emoji}</span>
                    <h1 className="text-2xl md:text-3xl font-bold">
                      {greeting.text}, {user?.personalInfo?.firstName}!
                    </h1>
                  </div>
                  <p className="text-white/90 text-lg">
                    {dashboardData?.farm?.name || 'Your Farm'} • {dashboardData?.weather?.location?.name || 'Coordinates'} • {currentTime.toLocaleDateString()}
                  </p>
                </div>
                
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1] 
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                  className="hidden md:block"
                >
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <TrophyIcon className="w-10 h-10" />
                  </div>
                </motion.div>
              </motion.div>

              {/* Weather Widget */}
              <motion.div
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                <WeatherWidget weatherData={dashboardData?.weather} isLoading={isLoading} />
              </motion.div>
            </div>
          </div>

          {/* Decorative Wave */}
          <div className="absolute bottom-0 left-0 w-full">
            <svg viewBox="0 0 1200 120" fill="none" className="w-full h-12">
              <path
                d="m0,60 C240,0 960,120 1200,60 L1200,120 L0,120 z"
                fill="rgb(248 250 252)"
              />
            </svg>
          </div>
        </motion.section>

        {/* Main Content */}
        <section className="px-6 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Today's Urgent Task */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <UrgentTaskCard 
                task={dashboardData?.tasks?.urgent?.[0]}
                onComplete={() => fetchDashboardData(true)}
              />
            </motion.div>

            {/* Progress Overview */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <ProgressIndicator
                title="Farm Health"
                value={dashboardData?.progress?.farmHealth || 85}
                icon="🌱"
                color="green"
              />
              <ProgressIndicator
                title="Sustainability Score"
                value={dashboardData?.progress?.sustainabilityScore || 78}
                icon="🌍"
                color="blue"
              />
              <ProgressIndicator
                title="Weekly Goals"
                value={dashboardData?.progress?.weeklyGoals?.percentage || 60}
                icon="🎯"
                color="purple"
                subtitle={`${dashboardData?.progress?.weeklyGoals?.completed || 3}/${dashboardData?.progress?.weeklyGoals?.total || 5} completed`}
              />
            </motion.div>

            {/* Core Tools Navigation */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                  <SparklesIcon className="w-7 h-7 text-yellow-500" />
                  <span>Your Farming Toolkit</span>
                </h2>
                <p className="text-gray-600">Choose your next action</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {coreTools.map((tool, index) => (
                  <motion.div
                    key={tool.id}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.9 + index * 0.1, duration: 0.6 }}
                  >
                    <ToolNavigationCard tool={tool} />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Crop Progress */}
            {dashboardData?.progress?.cropGrowth?.length > 0 && (
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                  <span className="text-2xl">🌱</span>
                  <span>Crop Growth Progress</span>
                </h3>
                
                <div className="space-y-4">
                  {dashboardData.progress.cropGrowth.map((crop, index) => (
                    <motion.div
                      key={crop.cropName}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 1.2 + index * 0.1 }}
                      className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl"
                    >
                      <div className="text-3xl">{crop.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800 capitalize">
                            {crop.cropName}
                          </h4>
                          <span className="text-sm text-gray-600 capitalize">
                            {crop.stage} stage
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${crop.percentage}%` }}
                            transition={{ delay: 1.3 + index * 0.1, duration: 1 }}
                            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full relative"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                          </motion.div>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                          <span>{crop.percentage}% grown</span>
                          <span>{crop.daysToHarvest} days to harvest</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { icon: '📊', label: 'Analytics', color: 'from-blue-400 to-blue-600' },
                { icon: '⚙️', label: 'Settings', color: 'from-gray-400 to-gray-600' },
                { icon: '📚', label: 'Learning', color: 'from-purple-400 to-purple-600' },
                { icon: '💬', label: 'Support', color: 'from-green-400 to-green-600' }
              ].map((action, index) => (
                <motion.button
                  key={action.label}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ delay: 1.4 + index * 0.1 }}
                  className={`bg-gradient-to-br ${action.color} text-white p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 group`}
                >
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    {action.icon}
                  </div>
                  <div className="text-sm font-medium">{action.label}</div>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Dashboard