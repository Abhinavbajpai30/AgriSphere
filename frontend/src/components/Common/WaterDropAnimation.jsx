import React from 'react';
import { motion } from 'framer-motion';

const WaterDropAnimation = ({ isActive = false, intensity = 'medium' }) => {
  const getDropCount = () => {
    switch (intensity) {
      case 'light': return 10;
      case 'medium': return 20;
      case 'heavy': return 35;
      default: return 20;
    }
  };

  const getDropSize = () => {
    switch (intensity) {
      case 'light': return { min: 0.3, max: 0.6 };
      case 'medium': return { min: 0.4, max: 0.8 };
      case 'heavy': return { min: 0.5, max: 1.2 };
      default: return { min: 0.4, max: 0.8 };
    }
  };

  const dropCount = getDropCount();
  const sizeRange = getDropSize();

  if (!isActive) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(dropCount)].map((_, i) => {
        const size = Math.random() * (sizeRange.max - sizeRange.min) + sizeRange.min;
        const delay = Math.random() * 2;
        const duration = Math.random() * 2 + 2;
        const x = Math.random() * 100;

        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${x}%`,
              top: '-10px',
              width: `${size}rem`,
              height: `${size * 1.2}rem`,
            }}
            initial={{ y: -20, opacity: 0 }}
            animate={{ 
              y: window.innerHeight + 20, 
              opacity: [0, 1, 1, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
              ease: "easeIn"
            }}
          >
            {/* Water Drop SVG */}
            <svg
              viewBox="0 0 20 24"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <motion.path
                d="M10 0C10 0 2 8 2 14C2 18.4183 5.58172 22 10 22C14.4183 22 18 18.4183 18 14C18 8 10 0 10 0Z"
                fill="url(#waterGradient)"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay }}
              />
              <defs>
                <linearGradient id="waterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0.8 }} />
                  <stop offset="50%" style={{ stopColor: '#1D4ED8', stopOpacity: 0.9 }} />
                  <stop offset="100%" style={{ stopColor: '#1E40AF', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              
              {/* Shine effect */}
              <motion.ellipse
                cx="8"
                cy="8"
                rx="2"
                ry="3"
                fill="rgba(255, 255, 255, 0.4)"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: delay + 0.5 }}
              />
            </svg>
          </motion.div>
        );
      })}
      
      {/* Splash effects */}
      {intensity === 'heavy' && (
        <div className="absolute bottom-0 left-0 right-0">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`splash-${i}`}
              className="absolute"
              style={{ left: `${Math.random() * 100}%` }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 1.5, 0], 
                opacity: [0, 0.6, 0] 
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: Math.random() * 3,
                repeatDelay: Math.random() * 2 + 1
              }}
            >
              <div className="w-8 h-2 bg-blue-400 rounded-full opacity-40" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WaterDropAnimation;