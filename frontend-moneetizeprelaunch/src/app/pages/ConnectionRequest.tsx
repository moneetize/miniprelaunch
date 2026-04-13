import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { ChevronLeft, UserPlus, CheckCircle, MessageCircle, Share2 } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';

export function ConnectionRequest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Mock user data - in real app, this would be fetched from backend using userId
  const [targetUser, setTargetUser] = useState({
    name: '',
    handle: '',
    bio: '',
    avatar: '',
    interests: [] as string[],
    followers: 0,
    following: 0,
    points: 0,
  });

  useEffect(() => {
    // In a real app, fetch user data from backend using userId
    // For now, we'll simulate getting data from a scanned user
    
    // Try to get data from a temporary storage that the QR code might have set
    const scannedUserData = sessionStorage.getItem('scannedUser');
    if (scannedUserData) {
      const userData = JSON.parse(scannedUserData);
      setTargetUser(userData);
      sessionStorage.removeItem('scannedUser'); // Clean up
    } else {
      // Fallback: show a demo user
      setTargetUser({
        name: 'Jane Doe',
        handle: '@janedoe',
        bio: 'Revenue Generator | Strategic Communicator | Social Media Connector | Content Marketer',
        avatar: '',
        interests: ['Technology', 'Finance', 'Marketing'],
        followers: 234,
        following: 156,
        points: 1250,
      });
    }

    // Check if already connected
    const connections = JSON.parse(localStorage.getItem('connections') || '[]');
    const isAlreadyConnected = connections.some((c: any) => c.userId === userId);
    if (isAlreadyConnected) {
      setRequestSent(true);
    }
  }, [userId]);

  const handleSendRequest = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save connection request locally
      const connections = JSON.parse(localStorage.getItem('connections') || '[]');
      const newConnection = {
        userId: userId,
        name: targetUser.name,
        handle: targetUser.handle,
        avatar: targetUser.avatar,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      };
      
      connections.push(newConnection);
      localStorage.setItem('connections', JSON.stringify(connections));
      
      // Award points for connecting
      const currentPoints = parseInt(localStorage.getItem('userPoints') || '10', 10);
      const newPoints = currentPoints + 10;
      localStorage.setItem('userPoints', newPoints.toString());
      
      setRequestSent(true);
    } catch (error) {
      console.error('Error sending connection request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = () => {
    // Navigate to chat with this user
    navigate(`/chat/user/${userId}`);
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

      {/* Header */}
      <div className="sticky top-11 left-0 right-0 bg-[#0a0e1a]/80 backdrop-blur-md border-b border-white/5 z-50">
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">Connect</h1>
          <div className="w-10 h-10" /> {/* Spacer */}
        </div>
      </div>

      {/* Content */}
      <div className="pt-8 pb-20 px-4 sm:px-6 max-w-2xl mx-auto">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-b from-[#1a1d2e] to-[#0f1318] rounded-3xl shadow-2xl p-8 sm:p-12 border border-white/5 mb-6"
        >
          {/* User Avatar */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500">
                {targetUser.avatar ? (
                  <img
                    src={targetUser.avatar}
                    alt={targetUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                    {targetUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">M</span>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-1">{targetUser.name}</h2>
            <p className="text-blue-400 text-lg mb-3">{targetUser.handle}</p>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto mb-6">
              {targetUser.bio}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <div className="text-2xl font-bold text-white mb-1">{targetUser.points}</div>
              <div className="text-xs text-gray-400">Points</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <div className="text-2xl font-bold text-white mb-1">{targetUser.followers}</div>
              <div className="text-xs text-gray-400">Followers</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <div className="text-2xl font-bold text-white mb-1">{targetUser.following}</div>
              <div className="text-xs text-gray-400">Following</div>
            </div>
          </div>

          {/* Interests */}
          {targetUser.interests.length > 0 && (
            <div className="mb-8">
              <h3 className="text-white font-semibold mb-3">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {targetUser.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-full text-sm border border-blue-500/30"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!requestSent ? (
              <button
                onClick={handleSendRequest}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-full font-semibold flex items-center justify-center gap-2 hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-5 h-5" />
                {loading ? 'Sending...' : 'Connect'}
              </button>
            ) : (
              <button
                disabled
                className="w-full bg-green-600/20 text-green-400 py-4 rounded-full font-semibold flex items-center justify-center gap-2 border-2 border-green-500/30"
              >
                <CheckCircle className="w-5 h-5" />
                Connection Request Sent
              </button>
            )}
            
            <button
              onClick={handleMessage}
              className="w-full bg-white/10 text-white py-4 rounded-full font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition-all border-2 border-white/20"
            >
              <MessageCircle className="w-5 h-5" />
              Send Message
            </button>
          </div>
        </motion.div>

        {/* Success Message */}
        {requestSent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-green-500/20"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <img src={gemIcon} alt="Gem" className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-green-400 font-semibold mb-2">+10 Points Earned!</h3>
                <p className="text-gray-300 text-sm">
                  Your connection request has been sent to {targetUser.name}. You earned 10 points for expanding your network!
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/20"
        >
          <h3 className="text-blue-400 font-semibold mb-3 text-lg">What happens next?</h3>
          <ul className="space-y-3 text-gray-300 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-blue-500 font-bold text-lg">•</span>
              <span>{targetUser.name} will receive your connection request</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-500 font-bold text-lg">•</span>
              <span>Once accepted, you can message each other and collaborate</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-500 font-bold text-lg">•</span>
              <span>You'll see each other's posts and activities in your feeds</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-500 font-bold text-lg">•</span>
              <span>Build your network to unlock exclusive features and rewards</span>
            </li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}