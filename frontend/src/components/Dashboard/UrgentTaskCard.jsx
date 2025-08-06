import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ClockIcon, 
  FireIcon, 
  CheckCircleIcon, 
  ChevronRightIcon,
  StarIcon 
} from '@heroicons/react/24/outline'
import { apiService } from '../../services/api'
import cacheService from '../../services/cacheService'
import SuccessAnimation from '../Common/SuccessAnimation'

const UrgentTaskCard = ({ task, onComplete }) => {
  const [isCompleting, setIsCompleting] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  if (!task) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100"
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">All Caught Up!</h3>
            <p className="text-gray-600">No urgent tasks for today</p>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Great job staying on top of your farm management! 🎉
        </p>
      </motion.div>
    )
  }

  const handleCompleteTask = async () => {
    try {
      setIsCompleting(true)
      
      const response = await apiService.post(`/dashboard/task/${task.id}/complete`)
      
      if (response.data?.status === 'success') {
        setIsCompleted(true)
        setShowSuccess(true)
        
        // Invalidate dashboard cache to ensure fresh data
        try {
          await cacheService.invalidate('/dashboard/overview')
          console.log('Dashboard cache invalidated after task completion')
        } catch (cacheError) {
          console.warn('Failed to invalidate cache:', cacheError)
        }
        
        // Hide success animation after 3 seconds
        setTimeout(() => {
          setShowSuccess(false)
          onComplete && onComplete()
        }, 3000)
      }
    } catch (error) {
      console.error('Failed to complete task:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'from-red-400 to-red-600'
      case 'medium': return 'from-yellow-400 to-yellow-600'
      case 'low': return 'from-green-400 to-green-600'
      default: return 'from-blue-400 to-blue-600'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <FireIcon className="w-5 h-5" />
      case 'medium': return <ClockIcon className="w-5 h-5" />
      case 'low': return <StarIcon className="w-5 h-5" />
      default: return <ClockIcon className="w-5 h-5" />
    }
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: isCompleted ? 0.7 : 1, 
          y: 0,
          scale: isCompleted ? 0.98 : 1
        }}
        className={`relative overflow-hidden rounded-2xl border-2 ${
          task.priority === 'high' 
            ? 'border-red-200 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50' 
            : 'border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
        }`}
      >
        {/* Animated Border Glow */}
        <motion.div
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.02, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute inset-0 bg-gradient-to-r ${getPriorityColor(task.priority)} opacity-20 blur-sm`}
        />

        <div className="relative z-10 p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`w-12 h-12 bg-gradient-to-r ${getPriorityColor(task.priority)} rounded-full flex items-center justify-center text-white shadow-lg`}
              >
                <span className="text-xl">{task.icon}</span>
              </motion.div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-bold text-gray-800">
                    Today's Priority Task
                  </h3>
                  {task.priority === 'high' && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-red-500"
                    >
                      🔥
                    </motion.div>
                  )}
                </div>
                <p className="text-gray-600">Complete this to stay on track</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`px-3 py-1 bg-gradient-to-r ${getPriorityColor(task.priority)} text-white text-xs font-medium rounded-full flex items-center space-x-1`}
              >
                {getPriorityIcon(task.priority)}
                <span className="uppercase">{task.priority}</span>
              </motion.div>
            </div>
          </div>

          {/* Task Details */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 mb-4">
            <h4 className="text-lg font-semibold text-gray-800 mb-2 flex items-center space-x-2">
              <span>{task.icon}</span>
              <span>{task.title}</span>
            </h4>
            
            <p className="text-gray-600 mb-3">
              {task.description}
            </p>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 text-gray-500">
                  <ClockIcon className="w-4 h-4" />
                  <span>{task.estimatedTime}</span>
                </div>
                
                <div className="flex items-center space-x-1 text-yellow-600">
                  <StarIcon className="w-4 h-4" />
                  <span>{task.points} points</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-full">
                {task.category}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <motion.button
            onClick={handleCompleteTask}
            disabled={isCompleting || isCompleted}
            whileHover={{ scale: isCompleted ? 1 : 1.02 }}
            whileTap={{ scale: isCompleted ? 1 : 0.98 }}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 ${
              isCompleted 
                ? 'bg-green-500 cursor-not-allowed' 
                : isCompleting
                ? 'bg-gray-400 cursor-not-allowed'
                : `bg-gradient-to-r ${getPriorityColor(task.priority)} hover:shadow-xl`
            }`}
          >
            <AnimatePresence mode="wait">
              {isCompleting ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-2"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Completing...</span>
                </motion.div>
              ) : isCompleted ? (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center space-x-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Completed! Great Job! 🎉</span>
                </motion.div>
              ) : (
                <motion.div
                  key="default"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center space-x-2"
                >
                  <span>Complete Task</span>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Floating Success Particles */}
          {isCompleted && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    y: 100,
                    x: Math.random() * 300,
                    scale: 0,
                    opacity: 1
                  }}
                  animate={{ 
                    y: -50,
                    scale: [0, 1, 0],
                    opacity: [1, 1, 0]
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.1
                  }}
                  className="absolute text-2xl"
                >
                  {['🎉', '⭐', '🌟', '✨'][i % 4]}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Success Animation Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <SuccessAnimation
            message="Task Completed Successfully! 🎉"
            onComplete={() => setShowSuccess(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default UrgentTaskCard