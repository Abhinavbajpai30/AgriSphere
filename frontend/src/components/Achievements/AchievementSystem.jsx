import { useState, useEffect, createContext, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrophyIcon, 
  SparklesIcon, 
  CheckCircleIcon,
  StarIcon,
  FireIcon,
  BeakerIcon,
  CalendarDaysIcon,
  CameraIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'

/**
 * Achievement System
 * Gamification features to encourage user engagement
 */

const AchievementContext = createContext()

// Achievement definitions
const ACHIEVEMENTS = {
  first_diagnosis: {
    id: 'first_diagnosis',
    title: 'Plant Doctor',
    description: 'Complete your first crop diagnosis',
    icon: BeakerIcon,
    rarity: 'common',
    points: 50,
    category: 'diagnosis'
  },
  diagnosis_streak_7: {
    id: 'diagnosis_streak_7',
    title: 'Health Monitor',
    description: 'Complete 7 days of crop monitoring',
    icon: CheckCircleIcon,
    rarity: 'uncommon',
    points: 150,
    category: 'diagnosis'
  },
  irrigation_master: {
    id: 'irrigation_master',
    title: 'Water Wise',
    description: 'Save 30% water through smart irrigation',
    icon: '💧',
    rarity: 'rare',
    points: 300,
    category: 'irrigation'
  },
  planning_pro: {
    id: 'planning_pro',
    title: 'Strategic Farmer',
    description: 'Create 5 seasonal crop plans',
    icon: CalendarDaysIcon,
    rarity: 'rare',
    points: 250,
    category: 'planning'
  },
  early_adopter: {
    id: 'early_adopter',
    title: 'Pioneer',
    description: 'One of the first 100 users',
    icon: SparklesIcon,
    rarity: 'legendary',
    points: 500,
    category: 'special'
  },
  photo_expert: {
    id: 'photo_expert',
    title: 'Crop Photographer',
    description: 'Upload 50 high-quality crop photos',
    icon: CameraIcon,
    rarity: 'uncommon',
    points: 200,
    category: 'diagnosis'
  },
  consistency_champion: {
    id: 'consistency_champion',
    title: 'Dedicated Farmer',
    description: 'Use AgriSphere for 30 consecutive days',
    icon: FireIcon,
    rarity: 'epic',
    points: 750,
    category: 'engagement'
  },
  knowledge_seeker: {
    id: 'knowledge_seeker',
    title: 'Learning Enthusiast',
    description: 'Complete the interactive tutorial',
    icon: StarIcon,
    rarity: 'common',
    points: 25,
    category: 'onboarding'
  }
}

const RARITY_COLORS = {
  common: 'from-gray-400 to-gray-600',
  uncommon: 'from-green-400 to-green-600',
  rare: 'from-blue-400 to-blue-600',
  epic: 'from-purple-400 to-purple-600',
  legendary: 'from-yellow-400 to-orange-500'
}

const RARITY_GLOW = {
  common: 'shadow-gray-200',
  uncommon: 'shadow-green-200',
  rare: 'shadow-blue-200',
  epic: 'shadow-purple-200',
  legendary: 'shadow-yellow-200'
}

export const AchievementProvider = ({ children }) => {
  const { user } = useAuth()
  const [userAchievements, setUserAchievements] = useState([])
  const [unlockedAchievements, setUnlockedAchievements] = useState([])
  const [totalPoints, setTotalPoints] = useState(0)
  const [level, setLevel] = useState(1)
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(null)

  useEffect(() => {
    if (user) {
      loadUserAchievements()
    }
  }, [user])

  const loadUserAchievements = async () => {
    try {
      // In production, fetch from API
      const savedAchievements = JSON.parse(
        localStorage.getItem(`achievements_${user._id}`) || '[]'
      )
      setUserAchievements(savedAchievements)
      
      const points = savedAchievements.reduce(
        (total, achievement) => total + (ACHIEVEMENTS[achievement.id]?.points || 0), 
        0
      )
      setTotalPoints(points)
      setLevel(Math.floor(points / 1000) + 1)
    } catch (error) {
      console.error('Failed to load achievements:', error)
    }
  }

  const checkAchievement = async (achievementId, progressData = {}) => {
    if (!user || userAchievements.some(a => a.id === achievementId)) {
      return false // Already unlocked
    }

    const achievement = ACHIEVEMENTS[achievementId]
    if (!achievement) return false

    // Check if achievement criteria is met
    const isUnlocked = await evaluateAchievement(achievementId, progressData)
    
    if (isUnlocked) {
      await unlockAchievement(achievement)
      return true
    }
    
    return false
  }

  const evaluateAchievement = async (achievementId, progressData) => {
    switch (achievementId) {
      case 'first_diagnosis':
        return progressData.diagnosisCount >= 1
        
      case 'diagnosis_streak_7':
        return progressData.consecutiveDays >= 7
        
      case 'irrigation_master':
        return progressData.waterSavingsPercent >= 30
        
      case 'planning_pro':
        return progressData.plansCreated >= 5
        
      case 'photo_expert':
        return progressData.photosUploaded >= 50
        
      case 'consistency_champion':
        return progressData.consecutiveDaysUsed >= 30
        
      case 'knowledge_seeker':
        return progressData.tutorialCompleted === true
        
      case 'early_adopter':
        // Check user registration date and user count
        return progressData.userNumber <= 100
        
      default:
        return false
    }
  }

  const unlockAchievement = async (achievement) => {
    const unlockedAchievement = {
      ...achievement,
      unlockedAt: new Date().toISOString(),
      userId: user._id
    }

    // Update state
    setUserAchievements(prev => [...prev, unlockedAchievement])
    setUnlockedAchievements(prev => [...prev, unlockedAchievement])
    setTotalPoints(prev => prev + achievement.points)
    
    // Show unlock animation
    setShowUnlockAnimation(unlockedAchievement)
    setTimeout(() => setShowUnlockAnimation(null), 5000)

    // Save to storage
    const updatedAchievements = [...userAchievements, unlockedAchievement]
    localStorage.setItem(
      `achievements_${user._id}`, 
      JSON.stringify(updatedAchievements)
    )

    // Track achievement unlock
    if (window.analytics) {
      window.analytics.trackEvent('achievement_unlocked', {
        achievementId: achievement.id,
        title: achievement.title,
        rarity: achievement.rarity,
        points: achievement.points
      })
    }
  }

  const getProgress = () => {
    const totalAchievements = Object.keys(ACHIEVEMENTS).length
    const unlockedCount = userAchievements.length
    return {
      unlocked: unlockedCount,
      total: totalAchievements,
      percentage: Math.round((unlockedCount / totalAchievements) * 100)
    }
  }

  const getNextLevelProgress = () => {
    const currentLevelPoints = (level - 1) * 1000
    const nextLevelPoints = level * 1000
    const progress = totalPoints - currentLevelPoints
    const required = nextLevelPoints - currentLevelPoints
    
    return {
      current: progress,
      required,
      percentage: Math.round((progress / required) * 100)
    }
  }

  const value = {
    achievements: ACHIEVEMENTS,
    userAchievements,
    unlockedAchievements,
    totalPoints,
    level,
    checkAchievement,
    getProgress,
    getNextLevelProgress,
    showUnlockAnimation
  }

  return (
    <AchievementContext.Provider value={value}>
      {children}
      <AchievementUnlockAnimation />
    </AchievementContext.Provider>
  )
}

export const useAchievements = () => {
  const context = useContext(AchievementContext)
  if (!context) {
    throw new Error('useAchievements must be used within AchievementProvider')
  }
  return context
}

// Achievement unlock animation component
const AchievementUnlockAnimation = () => {
  const { showUnlockAnimation } = useAchievements()

  if (!showUnlockAnimation) return null

  const achievement = showUnlockAnimation
  const IconComponent = typeof achievement.icon === 'string' 
    ? () => <span className="text-4xl">{achievement.icon}</span>
    : achievement.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0, y: -100 }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Achievement card */}
        <motion.div
          initial={{ scale: 0, rotateY: 180 }}
          animate={{ 
            scale: 1, 
            rotateY: 0,
            transition: {
              type: 'spring',
              damping: 15,
              stiffness: 300
            }
          }}
          className="relative z-10 max-w-md mx-4"
        >
          {/* Particles */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0, 
                  scale: 0,
                  x: 0,
                  y: 0
                }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 1,
                  ease: 'easeOut'
                }}
                className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-400 rounded-full"
              />
            ))}
          </div>

          {/* Main card */}
          <div className={`
            bg-gradient-to-br ${RARITY_COLORS[achievement.rarity]}
            p-1 rounded-2xl shadow-2xl ${RARITY_GLOW[achievement.rarity]}
          `}>
            <div className="bg-white rounded-xl p-6 text-center">
              {/* Trophy icon */}
              <motion.div
                initial={{ scale: 0, rotateY: 180 }}
                animate={{ 
                  scale: 1, 
                  rotateY: 0,
                  transition: { delay: 0.2 }
                }}
                className="mb-4"
              >
                <div className={`
                  w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${RARITY_COLORS[achievement.rarity]}
                  flex items-center justify-center shadow-lg
                `}>
                  <IconComponent className="w-10 h-10 text-white" />
                </div>
              </motion.div>

              {/* Achievement unlocked text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { delay: 0.4 }
                }}
              >
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Achievement Unlocked!
                </h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {achievement.title}
                </h3>
                
                <p className="text-gray-600 mb-4">
                  {achievement.description}
                </p>

                <div className="flex items-center justify-center space-x-4 text-sm">
                  <div className={`
                    px-3 py-1 rounded-full bg-gradient-to-r ${RARITY_COLORS[achievement.rarity]}
                    text-white font-medium capitalize
                  `}>
                    {achievement.rarity}
                  </div>
                  
                  <div className="flex items-center space-x-1 text-yellow-600">
                    <StarIcon className="w-4 h-4" />
                    <span className="font-semibold">+{achievement.points} XP</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Glow effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: [0, 0.5, 0],
              scale: [0.8, 1.2, 1.4],
              transition: {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }
            }}
            className={`
              absolute inset-0 rounded-2xl bg-gradient-to-br ${RARITY_COLORS[achievement.rarity]}
              opacity-20 blur-xl -z-10
            `}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Achievement card component
export const AchievementCard = ({ achievement, isUnlocked = false }) => {
  const IconComponent = typeof achievement.icon === 'string' 
    ? () => <span className="text-2xl">{achievement.icon}</span>
    : achievement.icon

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`
        relative p-4 rounded-xl border-2 transition-all duration-200
        ${isUnlocked 
          ? `bg-gradient-to-br ${RARITY_COLORS[achievement.rarity]} text-white shadow-lg ${RARITY_GLOW[achievement.rarity]}`
          : 'bg-gray-100 border-gray-200 text-gray-400'
        }
      `}
    >
      {/* Rarity indicator */}
      <div className={`
        absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium
        ${isUnlocked 
          ? 'bg-white/20 text-white'
          : 'bg-gray-200 text-gray-500'
        }
      `}>
        {achievement.rarity}
      </div>

      {/* Icon */}
      <div className={`
        w-12 h-12 rounded-lg flex items-center justify-center mb-3
        ${isUnlocked 
          ? 'bg-white/20'
          : 'bg-gray-200'
        }
      `}>
        <IconComponent className={`w-6 h-6 ${isUnlocked ? 'text-white' : 'text-gray-400'}`} />
      </div>

      {/* Content */}
      <h3 className={`font-semibold mb-1 ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>
        {achievement.title}
      </h3>
      
      <p className={`text-sm mb-3 ${isUnlocked ? 'text-white/80' : 'text-gray-500'}`}>
        {achievement.description}
      </p>

      {/* Points */}
      <div className={`flex items-center space-x-1 text-sm ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
        <StarIcon className="w-4 h-4" />
        <span>{achievement.points} XP</span>
      </div>

      {/* Lock overlay for locked achievements */}
      {!isUnlocked && (
        <div className="absolute inset-0 bg-gray-100/50 rounded-xl flex items-center justify-center">
          <div className="text-4xl">🔒</div>
        </div>
      )}
    </motion.div>
  )
}

// Achievement progress bar
export const AchievementProgress = () => {
  const { getProgress, getNextLevelProgress, level, totalPoints } = useAchievements()
  const progress = getProgress()
  const levelProgress = getNextLevelProgress()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-2xl shadow-lg"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">Level {level} Farmer</h3>
          <p className="text-white/80">{totalPoints} Total XP</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{progress.unlocked}/{progress.total}</div>
          <div className="text-sm text-white/80">Achievements</div>
        </div>
      </div>

      {/* Level progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Progress to Level {level + 1}</span>
          <span>{levelProgress.current}/{levelProgress.required} XP</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelProgress.percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="bg-white rounded-full h-2"
          />
        </div>
      </div>

      {/* Achievement progress */}
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span>Achievement Progress</span>
          <span>{progress.percentage}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
            className="bg-white rounded-full h-2"
          />
        </div>
      </div>
    </motion.div>
  )
}

export default AchievementCard