import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  HomeIcon, 
  MapIcon, 
  HeartIcon, 
  BeakerIcon, 
  CalendarDaysIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline'
import { 
  HomeIcon as HomeIconSolid, 
  MapIcon as MapIconSolid, 
  HeartIcon as HeartIconSolid, 
  BeakerIcon as BeakerIconSolid, 
  CalendarDaysIcon as CalendarDaysIconSolid,
  Squares2X2Icon as Squares2X2IconSolid
} from '@heroicons/react/24/solid'
import { useLanguage } from '../../contexts/LanguageContext'
import NavigationItem from '../Common/NavigationItem'

const Navigation = () => {
  const location = useLocation()
  const { t } = useLanguage()

  const navigationItems = [
    {
      path: '/dashboard',
      label: t('dashboard'),
      icon: Squares2X2Icon,
      activeIcon: Squares2X2IconSolid,
      color: 'primary',
      emoji: '📊'
    },
    {
      path: '/farm',
      label: t('farm'),
      icon: MapIcon,
      activeIcon: MapIconSolid,
      color: 'earth',
      emoji: '🚜'
    },
    {
      path: '/diagnosis',
      label: t('diagnosis'),
      icon: HeartIcon,
      activeIcon: HeartIconSolid,
      color: 'orange',
      emoji: '🩺'
    },
    {
      path: '/irrigation',
      label: 'Water',
      icon: BeakerIcon,
      activeIcon: BeakerIconSolid,
      color: 'sky',
      emoji: '💧'
    },
    {
      path: '/planning',
      label: t('planning'),
      icon: CalendarDaysIcon,
      activeIcon: CalendarDaysIconSolid,
      color: 'primary',
      emoji: '📅'
    }
  ]

  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <nav className="safe-bottom">
      <div className="glass-strong rounded-t-3xl mx-4 mb-4 overflow-hidden">
        <div className="flex items-center justify-around py-2">
          {navigationItems.map((item, index) => (
            <NavigationItem
              key={item.path}
              {...item}
              isActive={isActive(item.path)}
              index={index}
            />
          ))}
        </div>
        
        {/* Active indicator */}
        <motion.div
          className="h-1 bg-gradient-primary rounded-full mx-8 mb-2"
          initial={false}
          animate={{
            x: `${(navigationItems.findIndex(item => isActive(item.path)) * 100) / navigationItems.length}%`,
            opacity: navigationItems.some(item => isActive(item.path)) ? 1 : 0
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ width: `${100 / navigationItems.length}%` }}
        />
      </div>
    </nav>
  )
}

export default Navigation