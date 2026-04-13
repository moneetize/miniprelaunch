import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ChevronLeft, Users, Sparkles } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';

export function CreateTeam() {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!teamName.trim()) {
      setError('Please enter a team name');
      return;
    }

    if (teamName.trim().length < 3) {
      setError('Team name must be at least 3 characters');
      return;
    }

    // Save team name to localStorage
    localStorage.setItem('teamName', teamName.trim());
    
    // Navigate to invite members screen
    navigate('/invite-team-members');
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

      {/* Back Button */}
      <div className="absolute top-14 sm:top-16 left-4 sm:left-6 z-40">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="pt-28 sm:pt-32 pb-20 sm:pb-24 px-4 sm:px-6 max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="flex justify-center mb-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-50" />
              <Users className="relative w-24 h-24 text-purple-400" />
            </div>
          </motion.div>
          <h1 className="text-white text-2xl sm:text-3xl font-bold mb-2">Create Your Team</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Start by giving your team a unique name
          </p>
        </motion.div>

        {/* Benefits Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-purple-500/30"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">Team Benefits</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-gray-300 text-sm">
              <span className="text-purple-400 mt-0.5">✓</span>
              <span>Compete together and climb the leaderboard</span>
            </li>
            <li className="flex items-start gap-3 text-gray-300 text-sm">
              <span className="text-purple-400 mt-0.5">✓</span>
              <span>Earn bonus points for team achievements</span>
            </li>
            <li className="flex items-start gap-3 text-gray-300 text-sm">
              <span className="text-purple-400 mt-0.5">✓</span>
              <span>Unlock exclusive team rewards and perks</span>
            </li>
            <li className="flex items-start gap-3 text-gray-300 text-sm">
              <span className="text-purple-400 mt-0.5">✓</span>
              <span>Connect with friends and grow together</span>
            </li>
          </ul>
        </motion.div>

        {/* Team Name Input */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/10"
        >
          <label className="text-white font-semibold text-sm mb-3 block">
            Team Name
          </label>
          <input
            type="text"
            placeholder="e.g., The Champions, Dream Team, etc."
            value={teamName}
            onChange={(e) => {
              setTeamName(e.target.value);
              setError('');
            }}
            maxLength={30}
            className="w-full bg-[#1a1d2e] text-white placeholder-gray-500 px-4 py-4 rounded-xl border border-white/10 focus:border-purple-500 focus:outline-none transition-colors text-base"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-gray-400 text-xs">
              Choose a memorable name for your team
            </p>
            <span className="text-gray-400 text-xs">
              {teamName.length}/30
            </span>
          </div>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm mt-2"
            >
              {error}
            </motion.p>
          )}
        </motion.div>

        {/* Example Teams */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <p className="text-gray-400 text-sm mb-3">Popular team names:</p>
          <div className="flex flex-wrap gap-2">
            {['Victory Squad', 'Power Players', 'Elite Force', 'Rising Stars'].map((name) => (
              <button
                key={name}
                onClick={() => setTeamName(name)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white text-sm hover:bg-white/10 transition-colors"
              >
                {name}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={handleContinue}
            disabled={!teamName.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-4 rounded-full font-bold text-base sm:text-lg hover:from-purple-700 hover:to-violet-700 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </motion.div>

        {/* Skip Option */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-4"
        >
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 text-sm hover:text-white transition-colors"
          >
            I'll create a team later
          </button>
        </motion.div>
      </div>
    </div>
  );
}
