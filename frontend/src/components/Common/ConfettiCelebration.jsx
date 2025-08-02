import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

const ConfettiCelebration = ({ isActive, duration = 3000, particleCount = 50 }) => {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    if (isActive) {
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20,
        color: ['#10b981', '#34d399', '#f59e0b', '#fb923c', '#ef4444', '#8b5cf6', '#06b6d4'][i % 7],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        velocityX: (Math.random() - 0.5) * 4,
        velocityY: Math.random() * 3 + 2,
        shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)]
      }))
      setParticles(newParticles)

      // Clear particles after animation
      const timer = setTimeout(() => {
        setParticles([])
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isActive, duration, particleCount])

  if (!isActive || particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute ${particle.shape === 'circle' ? 'rounded-full' : 
            particle.shape === 'triangle' ? 'polygon' : 'rounded-sm'}`}
          style={{
            backgroundColor: particle.color,
            width: particle.size,
            height: particle.size,
            left: particle.x,
            top: particle.y,
          }}
          initial={{
            opacity: 1,
            scale: 0,
            rotate: particle.rotation
          }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0, 1, 0.8],
            x: particle.velocityX * 100,
            y: window.innerHeight + 100,
            rotate: particle.rotation + 720
          }}
          transition={{
            duration: duration / 1000,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  )
}

export default ConfettiCelebration