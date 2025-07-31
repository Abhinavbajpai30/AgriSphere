import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BeakerIcon,
  CloudIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

const IrrigationPlanning = () => {
  const [selectedField, setSelectedField] = useState('main-field')

  const fields = [
    { id: 'main-field', name: 'Main Field', crop: 'Tomatoes', size: '2.5 ha' },
    { id: 'north-plot', name: 'North Plot', crop: 'Maize', size: '1.8 ha' }
  ]

  const wateringSchedule = [
    {
      id: 1,
      time: '06:00 AM',
      field: 'Main Field',
      duration: '45 minutes',
      amount: '120L',
      status: 'completed'
    },
    {
      id: 2,
      time: '07:30 AM',
      field: 'North Plot',
      duration: '30 minutes',
      amount: '85L',
      status: 'upcoming'
    },
    {
      id: 3,
      time: '05:00 PM',
      field: 'Main Field',
      duration: '40 minutes',
      amount: '110L',
      status: 'upcoming'
    }
  ]

  const weatherForecast = [
    { day: 'Today', condition: 'Sunny', temp: '28°C', humidity: '65%', rain: '0%', emoji: '☀️' },
    { day: 'Tomorrow', condition: 'Partly Cloudy', temp: '26°C', humidity: '70%', rain: '10%', emoji: '⛅' },
    { day: 'Day 3', condition: 'Rain', temp: '24°C', humidity: '85%', rain: '80%', emoji: '🌧️' }
  ]

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-green-50 safe-top">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-4 py-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Smart Irrigation 💧
          </h1>
          <p className="text-gray-600">
            Optimize water usage with AI-powered irrigation planning
          </p>
        </motion.div>

        {/* Current Status Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <div className="text-2xl mb-2">💧</div>
            <div className="text-2xl font-bold text-sky-600">350L</div>
            <div className="text-sm text-gray-600">Today's Usage</div>
          </div>
          
          <div className="card text-center">
            <div className="text-2xl mb-2">⏱️</div>
            <div className="text-2xl font-bold text-primary-600">2.5h</div>
            <div className="text-sm text-gray-600">Active Time</div>
          </div>
          
          <div className="card text-center">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-2xl font-bold text-green-600">$12</div>
            <div className="text-sm text-gray-600">Water Cost</div>
          </div>
          
          <div className="card text-center">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-2xl font-bold text-orange-600">85%</div>
            <div className="text-sm text-gray-600">Efficiency</div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Field Selection */}
            <motion.div variants={itemVariants}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Select Field</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {fields.map((field) => (
                  <motion.button
                    key={field.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedField(field.id)}
                    className={`
                      card-interactive text-left
                      ${selectedField === field.id ? 'ring-2 ring-sky-500 bg-sky-50' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">{field.name}</h3>
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Crop: {field.crop}</div>
                      <div>Size: {field.size}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Irrigation Recommendation */}
            <motion.div variants={itemVariants}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">AI Recommendation</h2>
              <div className="card bg-gradient-to-r from-sky-50 to-blue-50 border-sky-200">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-sky-100 rounded-full flex items-center justify-center">
                    <BeakerIcon className="w-6 h-6 text-sky-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      Recommended Irrigation Schedule
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Based on weather forecast, soil moisture, and crop requirements, 
                      we recommend watering your tomatoes twice today with 40% reduced duration 
                      due to expected rain tomorrow.
                    </p>
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <span className="text-sky-600">💧</span>
                        <span>230L total</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ClockIcon className="w-4 h-4 text-sky-600" />
                        <span>85 minutes</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-sky-200">
                  <button className="btn-secondary">
                    Apply Recommendation
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Today's Schedule */}
            <motion.div variants={itemVariants}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Today's Schedule</h2>
              <div className="space-y-3">
                {wateringSchedule.map((schedule) => (
                  <div key={schedule.id} className="card">
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-2 rounded-full ${
                        schedule.status === 'completed' ? 'bg-green-400' : 'bg-orange-400'
                      }`} />
                      <ClockIcon className="w-4 h-4 text-gray-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800">{schedule.time}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            schedule.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                            {schedule.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {schedule.field} • {schedule.duration} • {schedule.amount}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Weather */}
          <div className="space-y-6">
            <motion.div variants={itemVariants}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Weather Forecast</h2>
              <div className="space-y-3">
                {weatherForecast.map((forecast, index) => (
                  <div key={forecast.day} className="card">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{forecast.emoji}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-800">{forecast.day}</span>
                          <span className="text-sm text-gray-600">{forecast.temp}</span>
                        </div>
                        <div className="text-sm text-gray-600">{forecast.condition}</div>
                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                          <span>💧 {forecast.humidity}</span>
                          <span>🌧️ {forecast.rain}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full btn-primary flex items-center justify-center space-x-2">
                  <span>💧</span>
                  <span>Start Manual Watering</span>
                </button>
                <button className="w-full btn-outline flex items-center justify-center space-x-2">
                  <CalendarIcon className="w-4 h-4" />
                  <span>Schedule Custom Irrigation</span>
                </button>
                <button className="w-full btn-outline flex items-center justify-center space-x-2">
                  <CloudIcon className="w-4 h-4" />
                  <span>View Weather Details</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default IrrigationPlanning