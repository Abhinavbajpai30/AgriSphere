import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PlantGrowthAnimation = ({ 
  isActive = false, 
  growthStage = 'seedling', 
  cropType = 'generic',
  size = 'medium'
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [showParticles, setShowParticles] = useState(false);

  const stages = [
    { name: 'seed', height: 0, leaves: 0, color: '#8B5A2B' },
    { name: 'sprout', height: 20, leaves: 2, color: '#10B981' },
    { name: 'seedling', height: 40, leaves: 4, color: '#059669' },
    { name: 'young', height: 60, leaves: 6, color: '#047857' },
    { name: 'mature', height: 100, leaves: 8, color: '#065F46' }
  ];

  const getSizeMultiplier = () => {
    switch (size) {
      case 'small': return 0.7;
      case 'medium': return 1;
      case 'large': return 1.5;
      default: return 1;
    }
  };

  const getCropIcon = () => {
    switch (cropType) {
      case 'tomato': return '🍅';
      case 'corn': return '🌽';
      case 'potato': return '🥔';
      case 'rice': return '🌾';
      case 'wheat': return '🌾';
      case 'cassava': return '🍠';
      default: return '🌱';
    }
  };

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setCurrentStage(prev => {
        if (prev < stages.length - 1) {
          setShowParticles(true);
          setTimeout(() => setShowParticles(false), 1000);
          return prev + 1;
        }
        return prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    // Reset growth when activated
    if (isActive) {
      setCurrentStage(0);
    }
  }, [isActive]);

  const currentPlant = stages[currentStage];
  const sizeMultiplier = getSizeMultiplier();

  if (!isActive) return null;

  return (
    <div className="relative flex items-end justify-center">
      {/* Soil base */}
      <motion.div
        className="absolute bottom-0 w-32 h-8 bg-gradient-to-t from-amber-800 to-amber-600 rounded-t-lg"
        style={{ transform: `scale(${sizeMultiplier})` }}
        initial={{ width: 0 }}
        animate={{ width: '8rem' }}
        transition={{ duration: 0.5 }}
      />

      {/* Plant stem */}
      <motion.div
        className="relative z-10"
        style={{ transform: `scale(${sizeMultiplier})` }}
      >
        <motion.div
          className="w-2 bg-gradient-to-t from-green-600 to-green-400 rounded-t-full mx-auto"
          initial={{ height: 0 }}
          animate={{ height: `${currentPlant.height}px` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ backgroundColor: currentPlant.color }}
        />

        {/* Leaves */}
        <AnimatePresence>
          {[...Array(currentPlant.leaves)].map((_, i) => {
            const side = i % 2 === 0 ? 'left' : 'right';
            const level = Math.floor(i / 2);
            
            return (
              <motion.div
                key={i}
                className="absolute w-6 h-3 bg-green-500 rounded-full"
                style={{
                  [side]: side === 'left' ? '-1.5rem' : '-1.5rem',
                  bottom: `${10 + level * 15}px`,
                  transformOrigin: side === 'left' ? 'right center' : 'left center'
                }}
                initial={{ scale: 0, rotate: side === 'left' ? -45 : 45 }}
                animate={{ 
                  scale: 1, 
                  rotate: side === 'left' ? -25 : 25,
                  backgroundColor: currentPlant.color
                }}
                exit={{ scale: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: i * 0.2,
                  type: "spring",
                  stiffness: 300,
                  damping: 25
                }}
              />
            );
          })}
        </AnimatePresence>

        {/* Fruit/Crop (appears at mature stage) */}
        <AnimatePresence>
          {currentStage >= 4 && (
            <motion.div
              className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-2xl"
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 400,
                damping: 15,
                delay: 0.5
              }}
            >
              {getCropIcon()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Growth particles */}
        <AnimatePresence>
          {showParticles && (
            <div className="absolute inset-0">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`
                  }}
                  initial={{ 
                    scale: 0, 
                    x: 0, 
                    y: 0,
                    opacity: 1
                  }}
                  animate={{ 
                    scale: [0, 1, 0],
                    x: (Math.random() - 0.5) * 40,
                    y: (Math.random() - 0.5) * 40,
                    opacity: [1, 1, 0]
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Growth stage indicator */}
      <motion.div
        className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-white rounded-full px-3 py-1 shadow-lg border border-gray-200"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-xs font-semibold text-gray-700 capitalize">
          {currentPlant.name}
        </div>
        <div className="text-xs text-gray-500">
          Stage {currentStage + 1}/{stages.length}
        </div>
      </motion.div>

      {/* Progress indicator */}
      <motion.div
        className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 w-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStage + 1) / stages.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="text-xs text-center text-gray-600 mt-1">
          {Math.round(((currentStage + 1) / stages.length) * 100)}% grown
        </div>
      </motion.div>
    </div>
  );
};

export default PlantGrowthAnimation;