import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';

interface SectionPageProps {
  title: string;
  points: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  content?: React.ReactNode;
}

export function SectionPage({ title, points, description, color, icon, content }: SectionPageProps) {
  const navigate = useNavigate();

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

      {/* Back Button */}
      <div className="absolute top-14 sm:top-16 left-4 sm:left-6 z-40">
        <button
          onClick={() => navigate('/rewards')}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="pt-28 sm:pt-32 pb-20 sm:pb-24 px-4 sm:px-6">
        {/* Header Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-4 sm:mb-6"
        >
          <div className="relative w-20 h-20 sm:w-24 sm:h-24">
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${color} blur-xl opacity-60`} />
            <div className={`relative w-full h-full rounded-full bg-gradient-to-br ${color} shadow-2xl flex items-center justify-center text-3xl sm:text-4xl`}>
              {icon}
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-white text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 px-2">{title}</h1>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed px-2 sm:px-4">
            {description}
          </p>
        </motion.div>

        {/* Points Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8 border border-white/10"
        >
          <div className="text-center">
            <p className="text-gray-400 text-xs sm:text-sm mb-2">Earn Points</p>
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              <p className="text-emerald-400 text-4xl sm:text-5xl font-bold">{points}</p>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded bg-emerald-400/80" />
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {content}
        </motion.div>
      </div>
    </div>
  );
}