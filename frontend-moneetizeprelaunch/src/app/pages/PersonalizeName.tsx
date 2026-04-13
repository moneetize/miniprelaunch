import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import logoIcon from 'figma:asset/746c11c1d1a858661e98a281466971b7f59f4116.png';
import { safeSetItem } from '../utils/storage';
import { updateUserProfile } from '../services/authService';

export function PersonalizeName() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    if (!name.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Store name in localStorage
      safeSetItem('userName', name);
      const result = await updateUserProfile({ name: name.trim() });
      if (!result.success) {
        console.error('Failed to update Supabase profile:', result.error);
      }
      
      console.log('Name saved locally and synced to Supabase:', name);

      await new Promise(resolve => setTimeout(resolve, 300));

      navigate('/personalize-photo');
    } catch (err) {
      console.error('Error updating name:', err);
      // Continue anyway - name is stored locally
      navigate('/personalize-photo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/personalize-photo');
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-y-auto bg-black">
      {/* Gradient overlay at top */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#5B6FD8] via-[#2A3350] via-20% to-black to-40%" />
      
      {/* Content */}
      <div className="relative z-10">
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

        <div className="pt-20 sm:pt-24 pb-12 px-6 sm:px-8 min-h-screen flex flex-col items-center justify-between">
          <div className="w-full max-w-md flex flex-col items-center flex-1 justify-center">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <div className="relative w-52 h-52 sm:w-56 sm:h-56">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 blur-xl opacity-60" />
                <img 
                  src={logoIcon} 
                  alt="Moneetize Logo" 
                  className="relative w-full h-full object-contain"
                />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-16"
            >
              <h1 className="text-white text-3xl sm:text-4xl font-bold leading-tight mb-2">
                Your journey is unique.
              </h1>
              <h2 className="text-white text-3xl sm:text-4xl font-bold leading-tight">
                Let's make it truly personal
              </h2>
            </motion.div>

            {/* Form */}
            <motion.form
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              onSubmit={handleSubmit}
              className="w-full"
            >
              <input
                type="text"
                placeholder="What's your name?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="w-full bg-[#2A2A35]/80 text-white placeholder-gray-400 px-6 py-5 rounded-full border border-transparent focus:border-blue-500 focus:outline-none transition-colors text-base"
              />
            </motion.form>
            
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>

          {/* Submit Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-md space-y-5"
          >
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || isLoading}
              className="w-full bg-white text-black py-5 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Submit'}
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
