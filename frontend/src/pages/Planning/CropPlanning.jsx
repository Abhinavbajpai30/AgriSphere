import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CalendarDaysIcon,
  ChartBarIcon,
  LightBulbIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

const CropPlanning = () => {
  const [selectedView, setSelectedView] = useState('calendar')
  const [selectedSeason, setSelectedSeason] = useState('current')

  const seasons = [
    { id: 'current', label: 'Current Season', period: 'Jan - Apr 2024' },
    { id: 'next', label: 'Next Season', period: 'May - Aug 2024' },
    { id: 'annual', label: 'Annual Plan', period: '2024 Overview' }
  ]

  const cropCalendar = [
    {
      crop: 'Tomatoes',
      emoji: '🍅',
      planted: '2024-01-15',
      harvest: '2024-04-15',
      status: 'growing',
      progress: 65
    },
    {
      crop: 'Maize',
      emoji: '🌽',
      planted: '2024-02-01',
      harvest: '2024-05-01',
      status: 'growing',
      progress: 45
    },
    {
      crop: 'Beans',
      emoji: '🫘',
      planted: '2024-03-01',
      harvest: '2024-05-15',
      status: 'planned',
      progress: 0
    }
  ]

  const rotationPlan = [
    { field: 'Field A', current: 'Tomatoes', next: 'Beans', benefit: 'Nitrogen fixation' },
    { field: 'Field B', current: 'Maize', next: 'Cassava', benefit: 'Soil recovery' },
    { field: 'Field C', current: 'Fallow', next: 'Tomatoes', benefit: 'Pest control' }
  ]

  const recommendations = [
    {
      type: 'planting',
      title: 'Optimal Planting Window',
      description: 'Best time to plant beans is in the next 2 weeks for optimal yield.',
      priority: 'high',
      emoji: '🌱'
    },
    {
      type: 'rotation',
      title: 'Crop Rotation Suggestion',
      description: 'Consider rotating tomatoes with legumes to improve soil nitrogen.',
      priority: 'medium',
      emoji: '🔄'
    },
    {
      type: 'harvest',
      title: 'Harvest Planning',
      description: 'Tomato harvest expected in 6 weeks. Plan storage and market timing.',
      priority: 'medium',
      emoji: '📦'
    }
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 safe-top">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto px-4 py-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Crop Planning 📅
          </h1>
          <p className="text-gray-600">
            Plan your seasons, optimize rotations, and maximize yields
          </p>
        </motion.div>

        {/* Season Selector */}
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-soft">
            <div className="flex space-x-2">
              {seasons.map((season) => (
                <button
                  key={season.id}
                  onClick={() => setSelectedSeason(season.id)}
                  className={`
                    px-4 py-3 rounded-xl transition-all duration-200 text-sm
                    ${selectedSeason === season.id 
                      ? 'bg-primary-500 text-white shadow-glow' 
                      : 'hover:bg-primary-50 text-gray-600'
                    }
                  `}
                >
                  <div className="font-medium">{season.label}</div>
                  <div className="text-xs opacity-80">{season.period}</div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* View Toggle */}
        <motion.div variants={itemVariants} className="flex justify-center mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-1 shadow-soft">
            <div className="flex space-x-1">
              {[
                { id: 'calendar', label: 'Calendar', icon: CalendarDaysIcon },
                { id: 'rotation', label: 'Rotation', icon: ArrowPathIcon },
                { id: 'analytics', label: 'Analytics', icon: ChartBarIcon }
              ].map((view) => (
                <button
                  key={view.id}
                  onClick={() => setSelectedView(view.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200
                    ${selectedView === view.id 
                      ? 'bg-white text-primary-600 shadow-soft' 
                      : 'hover:bg-white/50 text-gray-600'
                    }
                  `}
                >
                  <view.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{view.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Content Area */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedView === 'calendar' && (
              <motion.div variants={itemVariants} className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Crop Calendar</h2>
                {cropCalendar.map((crop, index) => (
                  <div key={crop.crop} className="card">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">{crop.emoji}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-800">{crop.crop}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            crop.status === 'growing' ? 'bg-green-100 text-green-800' :
                            crop.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {crop.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <span className="font-medium">Planted:</span> {crop.planted}
                          </div>
                          <div>
                            <span className="font-medium">Harvest:</span> {crop.harvest}
                          </div>
                        </div>
                        {crop.status === 'growing' && (
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Growth Progress</span>
                              <span>{crop.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${crop.progress}%` }}
                                transition={{ delay: index * 0.2, duration: 1 }}
                                className="bg-gradient-primary h-2 rounded-full"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {selectedView === 'rotation' && (
              <motion.div variants={itemVariants} className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Rotation Plan</h2>
                {rotationPlan.map((rotation) => (
                  <div key={rotation.field} className="card">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl">🔄</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-2">{rotation.field}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <div>
                            <span className="font-medium">Current:</span> {rotation.current}
                          </div>
                          <span>→</span>
                          <div>
                            <span className="font-medium">Next:</span> {rotation.next}
                          </div>
                        </div>
                        <div className="text-sm text-green-600">
                          💡 Benefit: {rotation.benefit}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {selectedView === 'analytics' && (
              <motion.div variants={itemVariants} className="text-center py-16">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Analytics Dashboard</h3>
                <p className="text-gray-600 mb-6">
                  Detailed crop performance analytics coming soon
                </p>
                <button className="btn-primary">
                  View Crop Performance
                </button>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Recommendations */}
            <motion.div variants={itemVariants}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">AI Recommendations</h2>
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div key={index} className="card">
                    <div className="flex items-start space-x-3">
                      <div className="text-xl">{rec.emoji}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-800 text-sm">{rec.title}</h4>
                          <span className={`w-2 h-2 rounded-full ${
                            rec.priority === 'high' ? 'bg-red-400' : 'bg-orange-400'
                          }`} />
                        </div>
                        <p className="text-xs text-gray-600">{rec.description}</p>
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
                  <CalendarDaysIcon className="w-4 h-4" />
                  <span>Plan New Season</span>
                </button>
                <button className="w-full btn-outline flex items-center justify-center space-x-2">
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Set Rotation Schedule</span>
                </button>
                <button className="w-full btn-outline flex items-center justify-center space-x-2">
                  <LightBulbIcon className="w-4 h-4" />
                  <span>Get AI Suggestions</span>
                </button>
              </div>
            </motion.div>

            {/* Seasonal Tips */}
            <motion.div variants={itemVariants}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Seasonal Tips</h2>
              <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <div className="text-center">
                  <div className="text-2xl mb-2">🌱</div>
                  <h4 className="font-semibold text-gray-800 text-sm mb-2">Spring Planting</h4>
                  <p className="text-xs text-gray-600">
                    Perfect time for warm-season crops. Soil temperature should be above 15°C for optimal germination.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default CropPlanning