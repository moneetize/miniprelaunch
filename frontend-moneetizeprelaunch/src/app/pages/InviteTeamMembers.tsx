import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Mail, X, UserPlus, CheckCircle, AlertCircle, Copy, Check } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import { buildInviteLink } from '../utils/invitationLinks';

export function InviteTeamMembers() {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState('');
  const [emails, setEmails] = useState(['', '', '', '']);
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Get team name from localStorage
    const savedTeamName = localStorage.getItem('teamName') || 'My Team';
    setTeamName(savedTeamName);

    // Generate an invite link tied to the current inviter profile.
    setInviteLink(buildInviteLink());
  }, []);

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
    setError(null);
  };

  const handleRemoveEmail = (index: number) => {
    const newEmails = [...emails];
    newEmails[index] = '';
    setEmails(newEmails);
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleSendInvites = () => {
    setError(null);
    setSuccessMessage(null);

    // Filter out empty emails
    const validEmails = emails.filter(email => email.trim() !== '');
    
    // Validate all emails
    if (validEmails.length > 0) {
      const invalidEmails = validEmails.filter(email => !validateEmail(email));
      if (invalidEmails.length > 0) {
        setError('Please enter valid email addresses');
        return;
      }
    }

    // Save pending invites to localStorage
    const pendingInvites = validEmails.map(email => ({
      email,
      invitedAt: new Date().toISOString(),
      teamName
    }));

    const existingInvites = JSON.parse(localStorage.getItem('pendingTeamInvites') || '[]');
    localStorage.setItem('pendingTeamInvites', JSON.stringify([...existingInvites, ...pendingInvites]));

    setSuccessMessage(`${validEmails.length > 0 ? `Invites sent to ${validEmails.length} member${validEmails.length > 1 ? 's' : ''}!` : 'Team created successfully!'}`);

    // Navigate to team view after a short delay
    setTimeout(() => {
      navigate('/team-view');
    }, 1500);
  };

  const handleSkipInvites = () => {
    // Save team without invites
    navigate('/team-view');
  };

  const filledEmailsCount = emails.filter(email => email.trim() !== '').length;

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
              y: [0, -8, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="flex justify-center mb-4"
          >
            <div className="relative">
              <UserPlus className="relative w-24 h-24 text-emerald-400" />
              <div className="absolute inset-0 bg-emerald-500 rounded-full blur-2xl opacity-40" />
            </div>
          </motion.div>
          <h1 className="text-white text-2xl sm:text-3xl font-bold mb-2">Invite Team Members</h1>
          <p className="text-gray-400 text-sm sm:text-base">
            Add friends to <span className="text-white font-semibold">{teamName}</span>
          </p>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-6 flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-400 text-sm flex-1">{successMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm flex-1">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Team Stats Preview */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-emerald-500/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-400 text-sm mb-1">Team Size</p>
              <p className="text-white text-3xl font-bold">{filledEmailsCount + 1}/5</p>
              <p className="text-gray-400 text-xs mt-1">Including you</p>
            </div>
            <div className="relative w-20 h-20">
              <img src={gemIcon} alt="Gem" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-xl" />
            </div>
          </div>
        </motion.div>

        {/* Invite Link Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/10"
        >
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Share Invite Link
          </h3>
          <div className="bg-[#1a1d2e] rounded-xl p-4 flex items-center gap-3 border border-white/5">
            <input
              type="text"
              value={inviteLink}
              readOnly
              className="flex-1 bg-transparent text-white text-sm outline-none"
            />
            <button
              onClick={handleCopyLink}
              className="text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
            >
              {linkCopied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-gray-400 text-xs mt-3 text-center">
            Share this link with friends to join your team instantly
          </p>
        </motion.div>

        {/* Email Inputs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/10"
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Or Send Email Invites
          </h3>
          <div className="space-y-4">
            {emails.map((email, index) => (
              <div key={index} className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  placeholder={`Member ${index + 1} email`}
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  className="w-full bg-[#1a1d2e] text-white placeholder-gray-500 pl-12 pr-12 py-4 rounded-xl border border-white/10 focus:border-emerald-500 focus:outline-none transition-colors"
                />
                {email && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEmail(index)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-gray-400 text-xs mt-4 text-center">
            You can invite up to 4 members (5 total including you)
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <button
            onClick={handleSendInvites}
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 rounded-full font-bold text-base sm:text-lg hover:from-emerald-700 hover:to-green-700 transition-all shadow-xl"
          >
            {filledEmailsCount > 0 ? 'Send Invites & Create Team' : 'Create Team'}
          </button>

          <button
            onClick={handleSkipInvites}
            className="w-full bg-white/10 border border-white/20 text-white py-4 rounded-full font-semibold text-base hover:bg-white/20 transition-all"
          >
            Skip & Create Team Now
          </button>
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
        >
          <h3 className="text-blue-400 text-sm font-semibold mb-2">💡 Quick Tip</h3>
          <p className="text-gray-300 text-xs">
            You can always invite more members later from your team dashboard. Team members earn bonus points when completing challenges together!
          </p>
        </motion.div>
      </div>
    </div>
  );
}
