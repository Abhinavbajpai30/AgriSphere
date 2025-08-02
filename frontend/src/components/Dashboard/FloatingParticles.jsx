import { motion } from 'framer-motion'

const FloatingParticles = ({ weatherType = 'sunny', count = 20 }) => {
  const getParticleConfig = (type) => {
    switch (type) {
      case 'rain':
        return {
          particles: Array.from({ length: count }, (_, i) => ({
            id: i,
            symbol: '💧',
            color: 'text-blue-400',
            size: 'text-sm',
            duration: Math.random() * 2 + 1,
            delay: Math.random() * 2
          }))
        }
      
      case 'snow':
        return {
          particles: Array.from({ length: count }, (_, i) => ({
            id: i,
            symbol: '❄️',
            color: 'text-blue-200',
            size: 'text-xs',
            duration: Math.random() * 4 + 2,
            delay: Math.random() * 3
          }))
        }
      
      case 'cloudy':
        return {
          particles: Array.from({ length: Math.floor(count / 3) }, (_, i) => ({
            id: i,
            symbol: '☁️',
            color: 'text-gray-300',
            size: 'text-lg',
            duration: Math.random() * 8 + 5,
            delay: Math.random() * 4
          }))
        }
      
      case 'windy':
        return {
          particles: Array.from({ length: count }, (_, i) => ({
            id: i,
            symbol: ['🍃', '🌿'][i % 2],
            color: 'text-green-300',
            size: 'text-sm',
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 2
          }))
        }
      
      case 'hot':
        return {
          particles: Array.from({ length: Math.floor(count / 2) }, (_, i) => ({
            id: i,
            symbol: '🔥',
            color: 'text-orange-400',
            size: 'text-sm',
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 3
          }))
        }
      
      case 'sunny':
      default:
        return {
          particles: Array.from({ length: Math.floor(count / 4) }, (_, i) => ({
            id: i,
            symbol: ['✨', '🌟', '⭐'][i % 3],
            color: 'text-yellow-300',
            size: 'text-xs',
            duration: Math.random() * 6 + 4,
            delay: Math.random() * 5
          }))
        }
    }
  }

  const getParticleMovement = (type, index) => {
    switch (type) {
      case 'rain':
        return {
          initial: { 
            y: -20, 
            x: Math.random() * window.innerWidth,
            opacity: 0.7,
            rotate: 15
          },
          animate: { 
            y: window.innerHeight + 50,
            opacity: [0.7, 1, 0.3]
          },
          transition: {
            duration: Math.random() * 2 + 1,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "linear"
          }
        }
      
      case 'snow':
        return {
          initial: { 
            y: -20, 
            x: Math.random() * window.innerWidth,
            opacity: 0.8,
            rotate: 0
          },
          animate: { 
            y: window.innerHeight + 50,
            x: [
              Math.random() * window.innerWidth,
              Math.random() * window.innerWidth + (Math.random() - 0.5) * 100,
              Math.random() * window.innerWidth
            ],
            rotate: [0, 180, 360],
            opacity: [0.8, 1, 0.2]
          },
          transition: {
            duration: Math.random() * 4 + 3,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut"
          }
        }
      
      case 'cloudy':
        return {
          initial: { 
            y: Math.random() * window.innerHeight * 0.3,
            x: -100,
            opacity: 0.4,
            scale: 0.8
          },
          animate: { 
            x: window.innerWidth + 100,
            y: [
              Math.random() * window.innerHeight * 0.3,
              Math.random() * window.innerHeight * 0.3 + 50,
              Math.random() * window.innerHeight * 0.3
            ],
            scale: [0.8, 1.2, 0.8],
            opacity: [0.4, 0.6, 0.3]
          },
          transition: {
            duration: Math.random() * 8 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear"
          }
        }
      
      case 'windy':
        return {
          initial: { 
            y: Math.random() * window.innerHeight,
            x: -50,
            opacity: 0.6,
            rotate: 0
          },
          animate: { 
            x: window.innerWidth + 50,
            y: [
              Math.random() * window.innerHeight,
              Math.random() * window.innerHeight - 100,
              Math.random() * window.innerHeight + 100,
              Math.random() * window.innerHeight
            ],
            rotate: [0, 180, 360, 540],
            opacity: [0.6, 0.8, 0.4, 0.2]
          },
          transition: {
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut"
          }
        }
      
      case 'hot':
        return {
          initial: { 
            y: window.innerHeight + 20,
            x: Math.random() * window.innerWidth,
            opacity: 0.7,
            scale: 0.5
          },
          animate: { 
            y: -50,
            x: [
              Math.random() * window.innerWidth,
              Math.random() * window.innerWidth + (Math.random() - 0.5) * 50
            ],
            scale: [0.5, 1, 0.3],
            opacity: [0.7, 1, 0]
          },
          transition: {
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeOut"
          }
        }
      
      case 'sunny':
      default:
        return {
          initial: { 
            y: Math.random() * window.innerHeight,
            x: Math.random() * window.innerWidth,
            opacity: 0.3,
            scale: 0.5
          },
          animate: { 
            y: [
              Math.random() * window.innerHeight,
              Math.random() * window.innerHeight - 30,
              Math.random() * window.innerHeight + 30,
              Math.random() * window.innerHeight
            ],
            x: [
              Math.random() * window.innerWidth,
              Math.random() * window.innerWidth + 20,
              Math.random() * window.innerWidth - 20,
              Math.random() * window.innerWidth
            ],
            scale: [0.5, 1, 0.7, 0.5],
            opacity: [0.3, 0.7, 0.5, 0.3],
            rotate: [0, 180, 360]
          },
          transition: {
            duration: Math.random() * 6 + 8,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut"
          }
        }
    }
  }

  const config = getParticleConfig(weatherType)

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {config.particles.map((particle) => {
        const movement = getParticleMovement(weatherType, particle.id)
        
        return (
          <motion.div
            key={particle.id}
            {...movement}
            className={`absolute ${particle.color} ${particle.size} select-none`}
            style={{ willChange: 'transform' }}
          >
            {particle.symbol}
          </motion.div>
        )
      })}

      {/* Additional Environmental Effects */}
      {weatherType === 'sunny' && (
        <div className="absolute inset-0">
          {/* Sun Rays */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`sunray-${i}`}
              initial={{ 
                scale: 0,
                rotate: i * 45,
                transformOrigin: 'center bottom'
              }}
              animate={{ 
                scale: [0, 1, 0],
                opacity: [0, 0.2, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
              className="absolute top-10 left-1/2 w-1 h-32 bg-yellow-200 origin-bottom"
              style={{
                transformOrigin: '50% 100%',
                left: '50%',
                marginLeft: '-2px'
              }}
            />
          ))}
        </div>
      )}

      {weatherType === 'rain' && (
        <div className="absolute inset-0">
          {/* Lightning Effect (Occasional) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute inset-0 bg-white/20 pointer-events-none"
          />
        </div>
      )}

      {weatherType === 'windy' && (
        <div className="absolute inset-0">
          {/* Wind Lines */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={`windline-${i}`}
              initial={{ 
                x: -200,
                y: (i * 100) + Math.random() * 50
              }}
              animate={{ 
                x: window.innerWidth + 200,
                opacity: [0, 0.3, 0.6, 0.3, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut"
              }}
              className="absolute h-0.5 w-16 bg-gray-300/50"
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default FloatingParticles