import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, PawPrint, Sparkles, Camera, BookOpen, Home, Monitor, Film, Heart } from 'lucide-react';
import { safeSetItem } from '../utils/storage';
import { getSelectedAvatarImage } from '../utils/avatarUtils';

export function OnboardingInterests() {
  const navigate = useNavigate();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const userName = localStorage.getItem('userName') || 'there';

  const interests = [
    { id: 'pets', label: 'Pets', icon: PawPrint },
    { id: 'beauty', label: 'Beauty', icon: Sparkles },
    { id: 'photo', label: 'Photo', icon: Camera },
    { id: 'books', label: 'Books', icon: BookOpen },
    { id: 'home', label: 'Home', icon: Home },
    { id: 'tech', label: 'Tech', icon: Monitor },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'lifestyle', label: 'Lifestyle', icon: Heart },
  ];

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleNext = () => {
    // Save selected interests to localStorage
    safeSetItem('selectedInterests', JSON.stringify(selectedInterests));
    navigate('/onboarding-investment');
  };

  const handleSkip = () => {
    // Save empty interests if skipped
    safeSetItem('selectedInterests', JSON.stringify([]));
    navigate('/onboarding-investment');
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-y-auto bg-gradient-to-b from-[#0a0e1a] via-[#0f1623] to-[#0a0e1a]">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-4 sm:px-6 text-white text-sm z-50">
        <span className="font-semibold">9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-3 bg-white/80 rounded-sm" />
          <div className="w-4 h-3 bg-white/80 rounded-sm" />
          <div className="w-6 h-3 bg-white/80 rounded-sm" />
        </div>
      </div>

      {/* Back Button & Page Indicator */}
      <div className="absolute top-14 sm:top-16 left-0 right-0 flex items-center justify-between px-4 sm:px-6 z-40">
        <button
          onClick={() => navigate('/welcome-ai')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-white text-base sm:text-lg font-semibold">
          1 <span className="text-white/60">/ 5</span>
        </span>
      </div>

      <div className="pt-28 sm:pt-32 pb-20 sm:pb-24 px-4 sm:px-6">
        {/* Globe/Orb */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-6 sm:mb-8"
        >
          <motion.div
            animate={{ 
              rotate: 360,
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
            className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden"
          >
            <img 
              src={getSelectedAvatarImage()} 
              alt="AI Avatar" 
              className="w-full h-full object-cover drop-shadow-2xl"
            />
          </motion.div>
        </motion.div>

        {/* Title & Description */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 px-2">
            What inspires you, {userName}?
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed px-2 sm:px-4">
            Choose up to 4 interests to help me connect you with curated opportunities and communities aligned with your goals.
          </p>
        </motion.div>

        {/* Interest Bubbles */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative h-[400px] sm:h-[450px] w-full mb-8 sm:mb-12"
        >
          {interests.map((interest, index) => {
            const positions = [
              { x: 8, y: 0 },
              { x: 60, y: 2 },
              { x: 6, y: 35 },
              { x: 58, y: 37 },
              { x: 10, y: 70 },
              { x: 62, y: 68 },
              { x: 32, y: 15 },
              { x: 34, y: 52 },
            ];
            
            const position = positions[index];
            const Icon = interest.icon;
            const isSelected = selectedInterests.includes(interest.id);
            
            // Generate random animation values for each bubble
            const randomDuration = 3 + Math.random() * 2; // 3-5 seconds
            const randomScale = 1 + Math.random() * 0.15; // 1.0-1.15 scale
            const randomDelay = Math.random() * 2; // 0-2 seconds delay
            const randomX = (Math.random() - 0.5) * 10; // -5 to +5 horizontal drift
            const randomY = (Math.random() - 0.5) * 6; // -3 to +3 vertical drift

            return (
              <motion.div
                key={interest.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1, type: "spring" }}
                className="absolute w-24 h-24 sm:w-28 sm:h-28"
                style={{
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                }}
              >
                <button
                  onClick={() => toggleInterest(interest.id)}
                  className="relative w-full h-full"
                >
                  <motion.div
                    animate={{ 
                      y: [0, -8 + randomY, 0],
                      x: [0, randomX, 0],
                      scale: [1, randomScale, 1],
                    }}
                    transition={{ 
                      y: {
                        duration: randomDuration,
                        repeat: Infinity,
                        ease: "easeInOut"
                      },
                      x: {
                        duration: randomDuration * 1.3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: randomDelay * 0.3,
                      },
                      scale: {
                        duration: randomDuration * 0.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: randomDelay,
                      }
                    }}
                    className="relative w-full h-full"
                  >
                    {/* Glow */}
                    <motion.div 
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.4, 0.6, 0.4],
                      }}
                      transition={{
                        duration: randomDuration * 1.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: randomDelay * 0.5,
                      }}
                      className={`absolute inset-0 rounded-full blur-xl transition-all ${
                        isSelected 
                          ? 'bg-gradient-to-br from-purple-500/40 to-pink-500/40' 
                          : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'
                      }`} 
                    />
                    
                    {/* Bubble */}
                    <div className={`relative w-full h-full rounded-full flex flex-col items-center justify-center shadow-xl transition-all ${
                      isSelected
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-white/30 scale-105'
                        : 'bg-gradient-to-br from-[#1a2847] to-[#0f1623] border-white/10'
                    } border hover:scale-105 cursor-pointer`}>
                      <Icon className={`w-6 h-6 sm:w-8 sm:h-8 mb-1 sm:mb-2 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                      <p className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                        {interest.label}
                      </p>
                    </div>
                  </motion.div>
                </button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Next Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-4"
        >
          <button
            onClick={handleNext}
            disabled={selectedInterests.length === 0}
            className="w-full bg-white text-black py-3.5 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-gray-100 transition-colors shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
          <button
            onClick={handleSkip}
            className="w-full text-white text-sm sm:text-base font-medium hover:text-gray-300 transition-colors"
          >
            Skip now
          </button>
        </motion.div>
      </div>
    </div>
  );
}