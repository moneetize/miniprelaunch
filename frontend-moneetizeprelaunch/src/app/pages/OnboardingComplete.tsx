import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { completeScratchTeaserFlow } from '../utils/flowManager';

export function OnboardingComplete() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState('');

  useEffect(() => {
    // Get user data from localStorage and sessionStorage
    const name = safeGetItem('userName') || 'there';
    // Try sessionStorage first (where photo upload stores it), then fall back to localStorage
    const photo = sessionStorage.getItem('userPhoto') || safeGetItem('userPhoto') || '';
    const selectedAvatar = safeGetItem('selectedAvatar') || '';
    
    setUserName(name);
    
    // Use uploaded photo if available, otherwise use selected avatar
    if (photo) {
      setUserPhoto(photo);
    } else if (selectedAvatar) {
      setUserPhoto(selectedAvatar);
    }

    // Collect all user profile data (without storing the large photo base64)
    const interests = safeGetItem('selectedInterests') || '[]';
    const investmentProfile = safeGetItem('investmentProfile') || '';
    
    // Create complete user profile object (store reference, not the actual photo data)
    const userProfile = {
      name,
      hasPhoto: !!(photo || selectedAvatar), // Just store whether they have a photo
      interests: JSON.parse(interests),
      investmentProfile,
      registrationComplete: true,
      completedAt: new Date().toISOString()
    };

    // Save complete profile (without the large photo base64)
    safeSetItem('userProfile', JSON.stringify(userProfile));
    safeSetItem('onboardingComplete', 'true');
  }, []);

  const handleStartNow = () => {
    completeScratchTeaserFlow();
    navigate('/profile-screen');
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-[#0a0e1a] via-[#0f1623] to-[#0a0e1a]">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-4 sm:px-6 text-white text-sm z-50">
        <span className="font-semibold">9:41</span>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-3" fill="currentColor" viewBox="0 0 16 12">
            <path d="M0 2a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H2a2 2 0 01-2-2V2z" />
          </svg>
          <svg className="w-5 h-4" fill="currentColor" viewBox="0 0 20 16">
            <path d="M2 0a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V2a2 2 0 00-2-2H2z" />
          </svg>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-4" fill="currentColor" viewBox="0 0 12 16">
              <rect width="10" height="14" x="1" y="1" rx="2" />
            </svg>
            <div className="w-1 h-1 rounded-full bg-green-400" />
          </div>
        </div>
      </div>

      <div className="h-full flex items-center justify-center px-6 pt-16 pb-8">
        {/* Card Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md bg-gradient-to-br from-[#1a1d2e]/90 to-[#0f1623]/90 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-10 border border-white/10 shadow-2xl"
        >
          {/* User Photo with Animation */}
          <div className="relative flex justify-center mb-8">
            {userPhoto && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1, 
                  rotate: 0,
                  y: [0, -8, 0]
                }}
                transition={{ 
                  scale: { duration: 0.8 },
                  opacity: { duration: 0.8 },
                  rotate: { duration: 0.8 },
                  y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                }}
                className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl"
              >
                <img 
                  src={userPhoto} 
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            )}
          </div>

          {/* Success Message */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-white text-2xl sm:text-3xl font-bold mb-4">
              You're all set, {userName}!
            </h1>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
              You've successfully completed the registration and personalization process. I'm ready to guide you!
            </p>
          </motion.div>

          {/* Start Now Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            <button
              onClick={handleStartNow}
              className="w-full bg-white text-black py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 shadow-xl"
            >
              Start now!
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Ambient Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ 
            opacity: [0.1, 0.2, 0.1],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            opacity: [0.1, 0.15, 0.1],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
        />
      </div>
    </div>
  );
}
