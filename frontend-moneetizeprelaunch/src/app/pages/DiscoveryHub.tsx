import { ChevronLeft, Search, TrendingUp, X, Home, Camera, Users, FileText } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import exampleImage from 'figma:asset/5d00333b72946915da713b689a3c309bae58f2f9.png';
import { getSelectedAvatarImage } from '../utils/avatarUtils';

export function DiscoveryHub() {
  const navigate = useNavigate();
  const [followedPeople, setFollowedPeople] = useState<string[]>([]);
  const [followedGroups, setFollowedGroups] = useState<string[]>([]);
  const [dismissedPeople, setDismissedPeople] = useState<string[]>([]);
  const userName = localStorage.getItem('userName') || 'there';

  const people = [
    {
      id: '1',
      name: 'Olivia Bennett',
      title: 'Software Engineer | AI Enthusiast | Transforming...',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    },
    {
      id: '2',
      name: 'Olivia Bennett',
      title: 'Software Engineer | AI Enthusiast | Transforming...',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    },
  ];

  const groups = [
    {
      id: '1',
      name: 'Clean Eating',
      handle: '@cleaneating',
      members: '23.5k',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop',
    },
    {
      id: '2',
      name: 'Clean Eating',
      handle: '@cleaneating',
      members: '23.5k',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
    },
    {
      id: '3',
      name: 'Clean Eating',
      handle: '@cleaneating',
      members: '23.5k',
      image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=300&fit=crop',
    },
  ];

  const toggleFollowPerson = (id: string) => {
    setFollowedPeople(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleFollowGroup = (id: string) => {
    setFollowedGroups(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const dismissPerson = (id: string) => {
    setDismissedPeople(prev => [...prev, id]);
  };

  const handleNext = () => {
    // Complete onboarding
    navigate('/onboarding-complete');
  };

  const handleSkip = () => {
    navigate('/onboarding-complete');
  };

  const visiblePeople = people.filter(p => !dismissedPeople.includes(p.id));

  return (
    <div className="absolute inset-0 w-full h-full overflow-y-auto bg-gradient-to-b from-[#0a0e1a] via-[#0f1623] to-[#0a0e1a]">
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
            <div className="w-1 h-1 rounded-full bg-yellow-400" />
          </div>
        </div>
      </div>

      {/* Back Button & Page Indicator */}
      <div className="absolute top-16 left-0 right-0 flex items-center justify-between px-6 z-40">
        <button
          onClick={() => navigate('/rewards')}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-white text-lg font-semibold">
          5 <span className="text-white/60">/ 5</span>
        </span>
      </div>

      <div className="pt-32 pb-24 px-6">
        {/* AI Orb */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
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
            className="relative w-20 h-20 rounded-full overflow-hidden"
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
          className="text-center mb-8"
        >
          <h1 className="text-white text-2xl font-bold mb-4">
            Your Personalized Discovery Hub
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Here's your personalized hub for exploring industries, and connecting with communities that align with your interests.
          </p>
        </motion.div>

        {/* You May Interested Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-white text-xl font-bold mb-4">You May Interested</h2>
          
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
            {visiblePeople.map((person, index) => (
              <motion.div
                key={person.id}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="relative flex-shrink-0 w-[280px] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10"
              >
                {/* Dismiss Button */}
                <button
                  onClick={() => dismissPerson(person.id)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Profile Image */}
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/20">
                    <img 
                      src={person.image} 
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Name & Title */}
                <div className="text-center mb-4">
                  <h3 className="text-white font-bold mb-1">{person.name}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{person.title}</p>
                </div>

                {/* Social Icons */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Home className="w-4 h-4 text-white" />
                  </button>
                  <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                  <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Users className="w-4 h-4 text-white" />
                  </button>
                  <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <FileText className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Follow Button */}
                <button
                  onClick={() => toggleFollowPerson(person.id)}
                  className={`w-full py-2.5 rounded-full font-semibold text-sm transition-colors ${
                    followedPeople.includes(person.id)
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  {followedPeople.includes(person.id) ? 'Following' : 'Follow'}
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Groups You Might Like Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-white text-xl font-bold mb-4">Groups You Might Like</h2>
          
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex-shrink-0 w-[180px] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10"
              >
                {/* Group Image */}
                <div className="w-full h-32 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                  <img 
                    src={group.image} 
                    alt={group.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Group Info */}
                <div className="p-4">
                  <h3 className="text-white font-bold mb-1">{group.name}</h3>
                  <p className="text-gray-400 text-xs mb-3">{group.handle}</p>
                  
                  {/* Members */}
                  <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
                    <Users className="w-3 h-3" />
                    <span>{group.members}</span>
                  </div>

                  {/* Follow Button */}
                  <button
                    onClick={() => toggleFollowGroup(group.id)}
                    className={`w-full py-2 rounded-full font-semibold text-sm transition-colors ${
                      followedGroups.includes(group.id)
                        ? 'bg-white/20 text-white'
                        : 'bg-white text-black hover:bg-gray-100'
                    }`}
                  >
                    {followedGroups.includes(group.id) ? 'Following' : 'Follow'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Next Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 space-y-4"
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

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
