import { motion, AnimatePresence } from 'motion/react';
import aiBubble from 'figma:asset/36fff8878cf3ea6d1ef44d3f08bbc2346c733ebc.png';
import { avatarImageMap } from '../utils/avatarUtils';

interface AvatarCarouselProps {
  avatars: Array<{ id: number; image: string; name: string; color: string }>;
  selectedAvatar: number;
  setSelectedAvatar: (index: number) => void;
  handlePrevious: () => void;
  handleNext: () => void;
}

// Color-based glow gradients
const glowColors: Record<string, { primary: string; secondary: string }> = {
  blue: { primary: 'from-purple-400 via-blue-500 to-cyan-400', secondary: 'from-pink-400 via-purple-400 to-blue-500' },
  green: { primary: 'from-green-400 via-emerald-500 to-lime-400', secondary: 'from-teal-400 via-green-400 to-emerald-500' },
  purple: { primary: 'from-purple-400 via-blue-500 to-cyan-400', secondary: 'from-pink-400 via-purple-400 to-blue-500' },
  orange: { primary: 'from-orange-400 via-amber-500 to-yellow-400', secondary: 'from-red-400 via-orange-400 to-amber-500' },
  red: { primary: 'from-red-400 via-pink-500 to-rose-400', secondary: 'from-purple-400 via-red-400 to-pink-500' },
  teal: { primary: 'from-teal-400 via-cyan-500 to-sky-400', secondary: 'from-blue-400 via-teal-400 to-cyan-500' },
  aqua: { primary: 'from-cyan-400 via-teal-500 to-turquoise-400', secondary: 'from-sky-400 via-cyan-400 to-teal-500' },
};

export function AvatarCarousel({
  avatars,
  selectedAvatar,
  setSelectedAvatar,
  handlePrevious,
  handleNext,
}: AvatarCarouselProps) {
  const currentColor = avatars[selectedAvatar]?.color || 'blue';
  const glowGradients = glowColors[currentColor] || glowColors.blue;

  // Handle swipe gestures
  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x > swipeThreshold) {
      handlePrevious();
    } else if (info.offset.x < -swipeThreshold) {
      handleNext();
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Avatar Display */}
      <motion.div 
        className="w-64 h-64 sm:w-80 sm:h-80 relative cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedAvatar}
            initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            {/* Glow Effect */}
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${glowGradients.primary} blur-3xl opacity-50 animate-pulse`} />
            <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${glowGradients.secondary} blur-2xl opacity-40`} />
            
            {/* Avatar Image */}
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.05, 1],
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
              }}
              className="relative w-full h-full rounded-full overflow-hidden shadow-2xl"
              style={{
                maskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
                WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
              }}
            >
              <img 
                src={avatarImageMap[avatars[selectedAvatar].image] || aiBubble}
                alt={avatars[selectedAvatar].name}
                className="w-full h-full object-cover opacity-90"
              />
              {/* Ethereal overlay blend */}
              <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#1a1d2e] opacity-50" />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}