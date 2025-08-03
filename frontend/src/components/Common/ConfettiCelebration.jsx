import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const ConfettiCelebration = ({ show, onComplete, color = 'multi' }) => {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const particlesRef = useRef([])

  useEffect(() => {
    if (!show) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Create particles
    const colors = color === 'multi' 
      ? ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899']
      : color === 'green' 
      ? ['#10B981', '#059669', '#34D399', '#6EE7B7']
      : ['#3B82F6', '#1D4ED8', '#60A5FA', '#93C5FD']

    const particles = []
    const particleCount = 100

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -10,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 2,
        gravity: 0.1,
        life: 1,
        decay: Math.random() * 0.01 + 0.005,
        shape: Math.random() > 0.5 ? 'circle' : 'square'
      })
    }

    particlesRef.current = particles

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += particle.gravity
        particle.life -= particle.decay

        // Remove dead particles
        if (particle.life <= 0 || particle.y > canvas.height + 50) {
          particles.splice(index, 1)
          return
        }

        // Draw particle
        ctx.save()
        ctx.globalAlpha = particle.life
        ctx.fillStyle = particle.color
        
        if (particle.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(
            particle.x - particle.size / 2,
            particle.y - particle.size / 2,
            particle.size,
            particle.size
          )
        }
        ctx.restore()
      })

      if (particles.length > 0) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        onComplete?.()
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [show, color, onComplete])

  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 pointer-events-none z-50"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </motion.div>
  )
}

export default ConfettiCelebration