import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  PlusIcon,
  MapIcon,
  HeartIcon,
  BeakerIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import LoadingScreen from '../components/Common/LoadingScreen'

const Dashboard = () => {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboard = async () => {
      setIsLoading(true)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock dashboard data
      setDashboardData({
        farms: 2,
        totalArea: 15.5,
        activeAlerts: 3,
        todayTasks: 5,
        weatherToday: {
          temperature: 28,
          humidity: 65,
          condition: 'Partly Cloudy',
          emoji: '⛅'
        },
        recentDiagnoses: [
          { id: 1, crop: 'Tomatoes', condition: 'Early Blight', status: 'treated', date: '2024-01-15' },
          { id: 2, crop: 'Maize', condition: 'Healthy', status: 'healthy', date: '2024-01-14' },
        ],
        upcomingTasks: [
          { id: 1, task: 'Water tomato field', time: '08:00 AM', priority: 'high' },
          { id: 2, task: 'Apply fertilizer to maize', time: '10:00 AM', priority: 'medium' },
          { id: 3, task: 'Check irrigation system', time: '02:00 PM', priority: 'low' },
        ]
      })
      setIsLoading(false)
    }

    loadDashboard()
  }, [])

  if (isLoading) {
    return <LoadingScreen message="Loading your dashboard..." />
  }

  const quickActions = [
    {
      title: 'Add Farm',
      description: 'Register a new farm',
      icon: PlusIcon,
      color: 'primary',
      link: '/farm/add',
      emoji: '🏡'
    },
    {
      title: 'Crop Diagnosis',
      description: 'Check crop health',
      icon: HeartIcon,
      color: 'orange',
      link: '/diagnosis',
      emoji: '🩺'
    },
    {
      title: 'Water Planning',
      description: 'Plan irrigation',
      icon: BeakerIcon,
      color: 'sky',
      link: '/irrigation',
      emoji: '💧'
    },
    {
      title: 'Farm Planning',
      description: 'Seasonal planning',
      icon: CalendarDaysIcon,
      color: 'primary',
      link: '/planning',
      emoji: '📅'
    }
  ]

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t('goodMorning')
    if (hour < 18) return t('goodAfternoon')
    return t('goodEvening')
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-orange-50 safe-top">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-4 py-6 space-y-6"
      >
        {/* Welcome Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            {getGreeting()}, {user?.personalInfo?.firstName || 'Farmer'}! 👋
          </h1>
          <p className="text-gray-600">
            Here's your farming overview for today
          </p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card text-center">
            <div className="text-2xl mb-2">🏡</div>
            <div className="text-2xl font-bold text-primary-600">{dashboardData?.farms || 0}</div>
            <div className="text-sm text-gray-600">Farms</div>
          </div>
          
          <div className="card text-center">
            <div className="text-2xl mb-2">📏</div>
            <div className="text-2xl font-bold text-sky-600">{dashboardData?.totalArea || 0}</div>
            <div className="text-sm text-gray-600">Hectares</div>
          </div>
          
          <div className="card text-center">
            <div className="text-2xl mb-2">🚨</div>
            <div className="text-2xl font-bold text-orange-600">{dashboardData?.activeAlerts || 0}</div>
            <div className="text-sm text-gray-600">Alerts</div>
          </div>
          
          <div className="card text-center">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-2xl font-bold text-green-600">{dashboardData?.todayTasks || 0}</div>
            <div className="text-sm text-gray-600">Tasks Today</div>
          </div>
        </motion.div>

        {/* Weather Card */}
        <motion.div variants={itemVariants} className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Today's Weather</h3>
              <p className="text-gray-600 text-sm">{dashboardData?.weatherToday?.condition}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl mb-1">{dashboardData?.weatherToday?.emoji}</div>
              <div className="text-xl font-bold text-gray-800">
                {dashboardData?.weatherToday?.temperature}°C
              </div>
              <div className="text-sm text-gray-600">
                {dashboardData?.weatherToday?.humidity}% humidity
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={action.title}
                to={action.link}
                className="group"
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="card-interactive text-center relative overflow-hidden"
                >
                  {/* Background Emoji */}
                  <div className="absolute top-2 right-2 text-2xl opacity-20">
                    {action.emoji}
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-12 h-12 bg-${action.color}-100 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:shadow-glow-${action.color} transition-all duration-300`}>
                    <action.icon className={`w-6 h-6 text-${action.color}-600`} />
                  </div>
                  
                  {/* Content */}
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {action.description}
                  </p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Today's Tasks */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Today's Tasks</h2>
          <div className="card">
            {dashboardData?.upcomingTasks?.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl">
                    <div className={`w-2 h-2 rounded-full ${
                      task.priority === 'high' ? 'bg-red-400' :
                      task.priority === 'medium' ? 'bg-orange-400' : 'bg-green-400'
                    }`} />
                    <ClockIcon className="w-4 h-4 text-gray-500" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{task.task}</p>
                      <p className="text-xs text-gray-600">{task.time}</p>
                    </div>
                    <button className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                      <CheckCircleIcon className="w-5 h-5 text-gray-400 hover:text-green-500" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✅</div>
                <p className="text-gray-600">No tasks scheduled for today</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Diagnoses */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Crop Health</h2>
          <div className="card">
            {dashboardData?.recentDiagnoses?.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentDiagnoses.map((diagnosis) => (
                  <div key={diagnosis.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      diagnosis.status === 'healthy' ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      {diagnosis.status === 'healthy' ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{diagnosis.crop}</p>
                      <p className="text-xs text-gray-600">{diagnosis.condition}</p>
                    </div>
                    <div className="text-xs text-gray-500">{diagnosis.date}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🌱</div>
                <p className="text-gray-600">No recent diagnoses</p>
                <Link to="/diagnosis" className="btn-primary mt-4 inline-flex">
                  Start Health Check
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Dashboard