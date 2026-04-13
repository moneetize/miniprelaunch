import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { AvatarCarousel } from '../components/AvatarCarousel';
import { safeSetItem } from '../utils/storage';

export function WelcomeAI() {
  const navigate = useNavigate();
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  const avatars = [
    { id: 0, image: 'blueAvatar', name: 'Blue Avatar', color: 'blue' },
    { id: 1, image: 'greenAvatar', name: 'Green Avatar', color: 'green' },
    { id: 2, image: 'purpleAvatar', name: 'Purple Avatar', color: 'purple' },
    { id: 3, image: 'orangeAvatar', name: 'Orange Avatar', color: 'orange' },
    { id: 4, image: 'redAvatar', name: 'Red Avatar', color: 'red' },
    { id: 5, image: 'tealAvatar', name: 'Teal Avatar', color: 'teal' },
    { id: 6, image: 'aquaAvatar', name: 'Aqua Avatar', color: 'aqua' },
  ];

  const handleContinue = () => {
    // Save the selected avatar to localStorage
    safeSetItem('selectedAvatar', avatars[selectedAvatar].image);
    navigate('/onboarding-interests');
  };

  const handleSkip = () => {
    safeSetItem('selectedAvatar', avatars[selectedAvatar].image);
    navigate('/onboarding-interests');
  };

  const handlePrevious = () => {
    setSelectedAvatar((prev) => (prev === 0 ? avatars.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedAvatar((prev) => (prev === avatars.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#1a1d2e]">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-4 sm:px-6 text-white text-sm z-50">
        <div className="flex items-center gap-2">
          <span className="font-semibold">9:41</span>
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-3" fill="currentColor" viewBox="0 0 16 12">
            <path d="M0 2a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H2a2 2 0 01-2-2V2z" />
          </svg>
          <svg className="w-4 h-3" fill="currentColor" viewBox="0 0 16 12">
            <path d="M14 0a2 2 0 012 2v8a2 2 0 01-2 2H2a2 2 0 01-2-2V2a2 2 0 012-2h12z" />
          </svg>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-4" fill="currentColor" viewBox="0 0 12 16">
              <rect width="10" height="14" x="1" y="1" rx="2" />
            </svg>
            <span className="text-xs bg-yellow-600 text-white px-1 rounded">32</span>
          </div>
        </div>
      </div>

      {/* Dynamic Island / Notch */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 sm:w-32 h-7 sm:h-8 bg-black rounded-full z-40" />

      <div className="pt-24 sm:pt-28 pb-8 sm:pb-12 px-6 sm:px-8 h-full flex flex-col">
        {/* Title & Description */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">
            Meet me, your personal A.I.
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed px-4">
            I'm your guide to a smarter income. I help you track your progress, find tokenized opportunities, and personalize your experience every step of the way.
          </p>
        </motion.div>

        {/* AI Orb Image */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="flex-1 flex flex-col items-center justify-center min-h-0"
        >
          <div 
            className="relative w-full max-w-[280px] sm:max-w-sm mb-6 sm:mb-8"
          >
            <AvatarCarousel
              avatars={avatars}
              selectedAvatar={selectedAvatar}
              setSelectedAvatar={setSelectedAvatar}
              handlePrevious={handlePrevious}
              handleNext={handleNext}
            />
          </div>

          {/* Avatar Selection Dots - Hidden */}
          {/* <div className="flex items-center justify-center gap-2">
            {avatars.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedAvatar(index)}
                className={`h-2 rounded-full transition-all ${
                  selectedAvatar === index
                    ? 'w-8 bg-white'
                    : 'w-2 bg-gray-600 hover:bg-gray-500'
                }`}
              />
            ))}
          </div> */}
        </motion.div>

        {/* Bottom Text */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mb-6 sm:mb-8"
        >
          <p className="text-gray-400 text-sm sm:text-base">
            Choose an avatar
          </p>
          <p className="text-gray-400 text-sm sm:text-base">
            that represents me
          </p>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="space-y-4"
        >
          <button
            onClick={handleContinue}
            className="w-full bg-white text-black py-3.5 sm:py-4 rounded-full font-semibold text-base sm:text-lg hover:bg-gray-100 transition-colors shadow-xl"
          >
            Continue
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
