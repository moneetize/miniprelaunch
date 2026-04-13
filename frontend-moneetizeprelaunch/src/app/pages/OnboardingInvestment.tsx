import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Heart, DollarSign, TrendingUp, Zap } from 'lucide-react';
import { safeSetItem } from '../utils/storage';
import { getSelectedAvatarImage } from '../utils/avatarUtils';

export function OnboardingInvestment() {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const options = [
    {
      id: 'passion',
      title: 'Support passion projects',
      description: 'Fund interests like travel or education',
      icon: Heart,
    },
    {
      id: 'income',
      title: 'Earn supplemental income',
      description: 'Small steady returns',
      icon: DollarSign,
    },
    {
      id: 'save',
      title: 'Save for a big goal',
      description: 'Long-term growth',
      icon: TrendingUp,
    },
    {
      id: 'maximize',
      title: 'Maximize returns quickly',
      description: 'High risk, high reward',
      icon: Zap,
    },
  ];

  const handleNext = () => {
    // Save selected investment profile to localStorage
    if (selectedOption) {
      safeSetItem('investmentProfile', selectedOption);
    }
    navigate('/onboarding-dashboard');
  };

  const handleSkip = () => {
    // Save empty investment profile if skipped
    safeSetItem('investmentProfile', '');
    navigate('/onboarding-dashboard');
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
          onClick={() => navigate('/onboarding-interests')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-white text-base sm:text-lg font-semibold">
          2 <span className="text-white/60">/ 5</span>
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
          className="text-center mb-8 sm:mb-12"
        >
          <h1 className="text-white text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 px-2">
            Investment Profile Options
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed px-2 sm:px-4">
            Whether it's extra income, debt payoff, or saving for something big, I'll help you create a plan to reach your goal. You can update it anytime.
          </p>
        </motion.div>

        {/* Options */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 sm:space-y-4 mb-8 sm:mb-12"
        >
          {options.map((option, index) => {
            const Icon = option.icon;
            const isSelected = selectedOption === option.id;

            return (
              <motion.button
                key={option.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ 
                  scale: 1.03,
                  x: 5,
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedOption(option.id)}
                className={`w-full rounded-2xl p-4 sm:p-5 border transition-all ${
                  isSelected
                    ? 'bg-gradient-to-br from-white/15 to-white/5 border-white/30'
                    : 'bg-gradient-to-br from-white/5 to-white/10 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-left pr-3">
                    <motion.h3 
                      className="text-white font-semibold mb-1 text-sm sm:text-base"
                      animate={isSelected ? { x: [0, 3, 0] } : {}}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    >
                      {option.title}
                    </motion.h3>
                    <p className="text-gray-400 text-xs sm:text-sm">{option.description}</p>
                  </div>
                  <motion.div 
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                      isSelected
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                        : 'bg-white/5'
                    }`}
                    animate={isSelected ? { 
                      rotate: [0, 360],
                      scale: [1, 1.15, 1],
                    } : {
                      scale: [1, 1.05, 1],
                    }}
                    transition={isSelected ? { 
                      rotate: { duration: 0.6, ease: "easeOut" },
                      scale: { duration: 0.6, ease: "easeOut" }
                    } : {
                      scale: { 
                        duration: 2 + index * 0.3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                  </motion.div>
                </div>
                
                {/* Animated glow effect when selected */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 pointer-events-none"
                  />
                )}
              </motion.button>
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
            disabled={!selectedOption}
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