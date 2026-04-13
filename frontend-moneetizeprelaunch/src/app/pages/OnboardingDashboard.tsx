import { ChevronLeft, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { getSelectedAvatarImage } from '../utils/avatarUtils';

export function OnboardingDashboard() {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'there';

  const handleNext = () => {
    navigate('/rewards');
  };

  const handleSkip = () => {
    navigate('/rewards');
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
          onClick={() => navigate('/onboarding-investment')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-white text-base sm:text-lg font-semibold">
          3 <span className="text-white/60">/ 5</span>
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
            Welcome to Your Dashboard, {userName}!
          </h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed px-2">
            Here's your personalized hub for tracking growth, exploring industries, and connecting with opportunities that align with your interests. Let's unlock real rewards and build your financial future together.
          </p>
        </motion.div>

        {/* Total Income */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 mb-5 sm:mb-6 border border-white/10"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs sm:text-sm">Total Income</span>
            <button className="flex items-center gap-1 text-white text-xs sm:text-sm">
              Today <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          <p className="text-white text-2xl sm:text-3xl font-bold">$40.00</p>
        </motion.div>

        {/* ABI Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-[#1a2847] to-[#0f1623] rounded-2xl p-6 mb-6 border border-white/10"
        >
          <div className="text-center mb-6">
            <p className="text-white text-5xl font-bold mb-1">$ 1 000<span className="text-gray-500">.00</span></p>
            <p className="text-gray-400 text-sm">ABI</p>
          </div>

          {/* Progress Bar */}
          <div className="h-3 bg-[#0a0e1a] rounded-full overflow-hidden mb-4">
            <div className="h-full flex">
              <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-500" style={{ width: '55%' }} />
              <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500" style={{ width: '25%' }} />
              <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: '20%' }} />
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-gray-300 text-sm">Fitness</span>
              </div>
              <span className="text-white text-sm font-semibold">55%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-gray-300 text-sm">Tech</span>
              </div>
              <span className="text-white text-sm font-semibold">25%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-gray-300 text-sm">Fashion</span>
              </div>
              <span className="text-white text-sm font-semibold">20%</span>
            </div>
          </div>

          <p className="text-gray-500 text-xs mt-4 text-center">(%) you've invested in each industry</p>
        </motion.div>

        {/* Portfolio Breakdown */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <h2 className="text-white text-lg font-bold mb-4">Portfolio Breakdown</h2>
          <div className="space-y-3">
            {[
              { name: 'Product 01', percentage: '50%', trend: 'up', color: 'emerald' },
              { name: 'Product 02', percentage: '25%', trend: 'neutral', color: 'gray' },
              { name: 'Product 03', percentage: '25%', trend: 'down', color: 'red' },
            ].map((product, index) => (
              <motion.div
                key={index}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-white/20" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{product.name}</p>
                    <p className="text-gray-400 text-sm">{product.percentage}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-16 h-8" viewBox="0 0 64 32">
                    <path
                      d={product.trend === 'up' 
                        ? 'M0,24 Q16,16 32,12 Q48,8 64,4' 
                        : product.trend === 'down'
                        ? 'M0,8 Q16,12 32,16 Q48,20 64,24'
                        : 'M0,16 Q16,14 32,16 Q48,18 64,16'
                      }
                      fill="none"
                      stroke={product.trend === 'up' ? '#10b981' : product.trend === 'down' ? '#ef4444' : '#6b7280'}
                      strokeWidth="2"
                    />
                  </svg>
                  <span className={`text-sm font-semibold ${
                    product.trend === 'up' ? 'text-emerald-400' : product.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    $ {product.trend === 'up' ? '+' : product.trend === 'down' ? '-' : ''}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* My Industries */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mb-8"
        >
          <h2 className="text-white text-lg font-bold mb-4">My Industries</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'Fitness', description: 'Workout equipment', amount: '$52,200', change: '- 5.9%', color: 'from-gray-600 to-gray-800' },
              { name: 'Fashion', description: 'Men\'s Apparel...', amount: '$76,800', change: '+ 4.2%', color: 'from-yellow-600 to-orange-800' },
            ].map((industry, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1 + index * 0.1 }}
                className={`bg-gradient-to-br ${industry.color} rounded-xl p-4 h-40 flex flex-col justify-between relative overflow-hidden`}
              >
                <div className="relative z-10">
                  <h3 className="text-white font-bold text-lg mb-1">{industry.name}</h3>
                  <p className="text-white/70 text-xs">{industry.description}</p>
                </div>
                <div className="relative z-10">
                  <p className="text-white font-bold text-xl">{industry.amount}</p>
                  <p className={`text-sm font-semibold ${industry.change.includes('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                    {industry.change}
                  </p>
                </div>
                {/* Decorative circle */}
                <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Next Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="space-y-4"
        >
          <button
            onClick={handleNext}
            className="w-full bg-white text-black py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors shadow-xl"
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
