import { motion } from 'motion/react';

interface AvatarOrbProps {
  type: 'iridescent' | 'cosmic' | 'energy' | 'neural' | 'quantum';
  isSelected?: boolean;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchMove?: (e: React.TouchEvent) => void;
  onTouchEnd?: () => void;
}

export function AvatarOrb({ type, isSelected = false, onTouchStart, onTouchMove, onTouchEnd }: AvatarOrbProps) {
  const getOrbStyles = () => {
    switch (type) {
      case 'iridescent':
        return {
          gradient: 'bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400',
          glow: 'from-blue-500 via-purple-500 to-pink-500',
          animation: 'pulse-slow',
        };
      case 'cosmic':
        return {
          gradient: 'bg-gradient-to-br from-indigo-500 via-purple-600 to-violet-700',
          glow: 'from-indigo-500 via-purple-600 to-violet-700',
          animation: 'spin-slow',
        };
      case 'energy':
        return {
          gradient: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600',
          glow: 'from-emerald-400 via-teal-500 to-cyan-600',
          animation: 'pulse-fast',
        };
      case 'neural':
        return {
          gradient: 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-600',
          glow: 'from-orange-400 via-red-500 to-pink-600',
          animation: 'rotate-slow',
        };
      case 'quantum':
        return {
          gradient: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600',
          glow: 'from-cyan-400 via-blue-500 to-indigo-600',
          animation: 'pulse-rotate',
        };
    }
  };

  const styles = getOrbStyles();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className="relative flex items-center justify-center w-full h-full"
    >
      {/* Selection Ring */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute inset-0 rounded-full border-4 border-green-400 z-20"
          style={{ padding: '20px' }}
        >
          <div className="w-full h-full rounded-full border-2 border-green-400/50" />
        </motion.div>
      )}

      {/* Glow Effect */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute w-full h-full rounded-full bg-gradient-to-br ${styles.glow} blur-3xl opacity-60`}
      />

      {/* Main Orb with Animation */}
      <motion.div
        animate={
          type === 'cosmic'
            ? { rotate: 360 }
            : type === 'neural'
            ? { rotate: [0, 15, -15, 0] }
            : type === 'quantum'
            ? { 
                rotate: 360,
                scale: [1, 1.05, 1]
              }
            : type === 'energy'
            ? {
                scale: [1, 1.1, 1],
              }
            : {
                y: [0, -10, 0],
              }
        }
        transition={
          type === 'cosmic'
            ? { duration: 20, repeat: Infinity, ease: 'linear' }
            : type === 'neural'
            ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
            : type === 'quantum'
            ? { duration: 8, repeat: Infinity, ease: 'easeInOut' }
            : type === 'energy'
            ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        }
        className="relative w-72 h-72 rounded-full"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Base Sphere */}
        <div className={`absolute inset-0 rounded-full ${styles.gradient} shadow-2xl`}>
          {/* Inner Highlights */}
          <div className="absolute inset-8 rounded-full bg-gradient-to-br from-white/40 via-white/10 to-transparent" />
          <div className="absolute top-12 left-12 w-20 h-20 rounded-full bg-white/30 blur-2xl" />
          
          {/* Animated Particles for Cosmic */}
          {type === 'cosmic' && (
            <>
              <motion.div
                animate={{
                  x: [0, 100, 0],
                  y: [0, -50, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute top-20 left-20 w-3 h-3 bg-white rounded-full blur-sm"
              />
              <motion.div
                animate={{
                  x: [0, -80, 0],
                  y: [0, 60, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1,
                }}
                className="absolute bottom-20 right-20 w-2 h-2 bg-white rounded-full blur-sm"
              />
            </>
          )}

          {/* Energy Waves */}
          {type === 'energy' && (
            <>
              <motion.div
                animate={{
                  scale: [0, 1.5],
                  opacity: [0.6, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                className="absolute inset-0 rounded-full border-4 border-emerald-300"
              />
              <motion.div
                animate={{
                  scale: [0, 1.5],
                  opacity: [0.6, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeOut',
                  delay: 1,
                }}
                className="absolute inset-0 rounded-full border-4 border-cyan-300"
              />
            </>
          )}

          {/* Neural Network Lines */}
          {type === 'neural' && (
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
              <motion.circle
                cx="100"
                cy="50"
                r="4"
                fill="white"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.circle
                cx="150"
                cy="100"
                r="4"
                fill="white"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              />
              <motion.circle
                cx="50"
                cy="100"
                r="4"
                fill="white"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
              />
              <motion.circle
                cx="100"
                cy="150"
                r="4"
                fill="white"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 }}
              />
              <motion.line
                x1="100"
                y1="50"
                x2="150"
                y2="100"
                stroke="white"
                strokeWidth="1"
                opacity="0.4"
                animate={{ opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.line
                x1="100"
                y1="50"
                x2="50"
                y2="100"
                stroke="white"
                strokeWidth="1"
                opacity="0.4"
                animate={{ opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
            </svg>
          )}

          {/* Quantum Particles */}
          {type === 'quantum' && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    rotate: 360,
                    scale: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: i * 0.5,
                  }}
                  className="absolute top-1/2 left-1/2 w-full h-full"
                  style={{
                    transformOrigin: '0 0',
                  }}
                >
                  <div
                    className="absolute w-2 h-2 bg-white rounded-full blur-sm"
                    style={{
                      top: '50%',
                      left: `${50 + 40 * Math.cos((i * Math.PI) / 4)}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                </motion.div>
              ))}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}