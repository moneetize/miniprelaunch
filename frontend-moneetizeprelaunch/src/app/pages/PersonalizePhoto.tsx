import { useState, useRef, type ChangeEvent } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { Edit2 } from 'lucide-react';
import SembolVariants from '../../imports/SembolVariants';
import { safeGetItem } from '../utils/storage';
import { saveProfilePhoto } from '../utils/profileSettings';
import { resizeProfilePhoto } from '../utils/profilePhoto';

export function PersonalizePhoto() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photoMessage, setPhotoMessage] = useState('');
  const userName = safeGetItem('userName') || 'there';

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoMessage('Preparing your photo...');

    try {
      const photo = await resizeProfilePhoto(file);
      setProfilePhoto(photo);
      saveProfilePhoto(photo);
      setPhotoMessage('');
    } catch (error) {
      setPhotoMessage(error instanceof Error ? error.message : 'Unable to process this photo.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmit = () => {
    navigate('/personalize-ready');
  };

  const handleSkip = () => {
    navigate('/personalize-ready');
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
      {/* Gradient overlay at top */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#66CC7B] via-[#082C0E] via-20% to-black to-40% overflow-hidden">
        {/* Greenish blur effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#8FE7A1] rounded-full blur-[150px] opacity-30" />
        <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-[#66CC7B] rounded-full blur-[100px] opacity-20" />
        <div className="absolute top-40 right-1/4 w-[350px] h-[350px] bg-[#082C0E] rounded-full blur-[120px] opacity-25" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden">
        {/* Status Bar */}
        <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-4 sm:px-6 text-white text-sm z-50">
          <div className="flex items-center gap-2">
            <span className="font-semibold">9:41</span>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3" fill="currentColor" viewBox="0 0 16 12">
              <rect width="14" height="10" x="1" y="1" rx="1.5" stroke="currentColor" fill="none" strokeWidth="1.5" />
              <rect width="3" height="3" x="2.5" y="3.5" rx="0.5" />
              <rect width="3" height="3" x="6.5" y="3.5" rx="0.5" />
              <rect width="3" height="3" x="10.5" y="3.5" rx="0.5" />
            </svg>
            <svg className="w-3.5 h-3" fill="currentColor" viewBox="0 0 16 12">
              <rect width="14" height="10" x="1" y="1" rx="1.5" stroke="currentColor" fill="none" strokeWidth="1.5" />
            </svg>
            <div className="flex items-center">
              <svg className="w-5 h-4" fill="none" viewBox="0 0 24 18">
                <rect width="18" height="12" x="1" y="3" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M20 7v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-[10px] bg-yellow-500 text-black px-1 rounded ml-0.5 font-bold">32</span>
            </div>
          </div>
        </div>

        {/* Dynamic Island */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 sm:w-32 h-7 sm:h-8 bg-black rounded-full z-40" />

        <div className="pt-20 sm:pt-24 pb-12 px-6 sm:px-8 min-h-[100dvh] flex flex-col items-center justify-between">
          <div className="w-full max-w-md flex flex-col items-center flex-1 justify-center">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <div className="relative w-[84px] h-[84px]">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#66CC7B] to-[#8FE7A1] blur-2xl opacity-40" />
                <div className="relative w-full h-full flex items-center justify-center">
                  <SembolVariants />
                </div>
              </div>
            </motion.div>

            {/* Greeting */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white text-4xl sm:text-5xl font-bold mb-16"
            >
              Hey {userName},
            </motion.h1>

            {/* Profile Photo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="relative mb-8"
            >
              <div 
                onClick={handlePhotoClick}
                className="w-[180px] h-[180px] rounded-full overflow-hidden cursor-pointer relative group shadow-[0px_24px_60px_0px_rgba(0,0,0,0.4)]"
                style={{
                  background: profilePhoto ? 'transparent' : 'radial-gradient(circle at 30px 30px, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)'
                }}
              >
                {profilePhoto ? (
                  <img 
                    src={profilePhoto} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                )}
              </div>
              <button
                onClick={handlePhotoClick}
                className="absolute bottom-2 right-2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              >
                <Edit2 className="w-5 h-5 text-gray-800" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </motion.div>

            {/* Instruction Text */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 text-base text-center"
            >
              Choose a profile picture
            </motion.p>
            {photoMessage && (
              <p className="mt-4 text-center text-sm font-semibold text-white/70">{photoMessage}</p>
            )}
          </div>

          {/* Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full max-w-md space-y-6"
          >
            <button
              onClick={handleSubmit}
              className="w-full bg-white text-black py-5 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors shadow-xl"
            >
              Submit
            </button>
            <button
              onClick={handleSkip}
              className="w-full text-white text-lg font-medium hover:underline"
            >
              Skip now
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
