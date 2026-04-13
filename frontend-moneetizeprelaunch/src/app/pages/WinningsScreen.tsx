import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Briefcase, ChevronLeft, MessageCircle, Search, X } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import tokenCardImage from 'figma:asset/954d4954fffe47cc32573cbcfb0096fb00164115.png';
import aiBubble from 'figma:asset/36fff8878cf3ea6d1ef44d3f08bbc2346c733ebc.png';
import greenMorphicBall from 'figma:asset/8fd559d05db8d67dee13e79dc6418365220fd613.png';
import tshirtRewardIcon from '../../assets/moneetize-tshirt-reward.png';
import { getUserPoints, setUserPoints } from '../utils/pointsManager';
import { getStoredProfileSettings, PROFILE_SETTINGS_STORAGE_KEYS, PROFILE_SETTINGS_UPDATED_EVENT } from '../utils/profileSettings';
import { submitEarlyAccessRequest } from '../services/earlyAccessService';

interface RewardItem {
  id: string;
  label: string;
  image: string;
  isEarlyAccess?: boolean;
}

function WinningsScreen() {
  const navigate = useNavigate();
  const [userPoints, setUserPointsState] = useState(0);
  const [userName, setUserName] = useState('Jess Wu');
  const [userPhoto, setUserPhoto] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('blueAvatar');
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestError, setRequestError] = useState('');

  useEffect(() => {
    const points = getUserPoints();

    const applyProfileSettings = () => {
      const profileSettings = getStoredProfileSettings({ fallbackName: 'Jess Wu' });

      setUserName(profileSettings.name);
      setFormName(profileSettings.name);
      setFormEmail(profileSettings.email);
      setSelectedAvatar(profileSettings.selectedAvatar);
      setUserPhoto(profileSettings.photo);
    };

    setUserPointsState(points);
    applyProfileSettings();

    const handleProfileSettingsUpdated = () => applyProfileSettings();
    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key || PROFILE_SETTINGS_STORAGE_KEYS.includes(event.key)) {
        applyProfileSettings();
      }
    };

    window.addEventListener(PROFILE_SETTINGS_UPDATED_EVENT, handleProfileSettingsUpdated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(PROFILE_SETTINGS_UPDATED_EVENT, handleProfileSettingsUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const rewardItems: RewardItem[] = [
    { id: 'tripto-multiplier', label: 'Tripto\nMultiplier', image: tokenCardImage },
    { id: 'shopping-spree-extender', label: 'Shopping\nSpree Extender', image: tokenCardImage },
    { id: 'team-sync-booster', label: 'Team Sync\nBooster', image: tokenCardImage },
    { id: 'founders-grace', label: "Founder's\nGrace", image: tokenCardImage },
    { id: 'golden-window-extender', label: 'Golden Window\nExtender', image: tokenCardImage },
    { id: 'boost-amplifier', label: 'Boost\nAmplifier', image: tokenCardImage },
    { id: 'token-early-access', label: 'Token Early\nAccess', image: tokenCardImage, isEarlyAccess: true },
    { id: 'moneetize-shirt', label: 'Moneetize\nT-Shirt', image: tshirtRewardIcon },
  ];

  const aiAgentImage = selectedAvatar === 'greenAvatar' ? greenMorphicBall : aiBubble;
  const renderAnimatedAiAvatar = () => {
    const isGreenAgent = selectedAvatar === 'greenAvatar';

    return (
      <span className="relative block h-12 w-12">
        <motion.span
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${
            isGreenAgent
              ? 'from-green-400 via-emerald-500 to-lime-400'
              : 'from-purple-400 via-blue-500 to-cyan-400'
          } blur-lg opacity-40`}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.span
          animate={{
            rotate: 360,
            scale: [1, 1.05, 1],
          }}
          transition={{
            rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
            scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          }}
          className={`relative block h-12 w-12 overflow-hidden rounded-full border-2 ${
            isGreenAgent ? 'border-emerald-400 hover:border-emerald-300' : 'border-purple-500 hover:border-purple-400'
          } transition-colors`}
          style={{
            maskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
          }}
        >
          <img src={aiAgentImage} alt="AI Agent" className="h-full w-full object-cover opacity-90" />
        </motion.span>
      </span>
    );
  };

  const closeTokenModal = () => {
    setShowTokenModal(false);
    setShowRequestForm(false);
    setRequestError('');
    setRequestMessage('');
  };

  const handleSubmitEarlyAccess = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setRequestError('');
    setRequestMessage('');

    try {
      const result = await submitEarlyAccessRequest({
        name: formName.trim(),
        email: formEmail.trim(),
      });

      const newTotal = typeof result.newTotalPoints === 'number' ? result.newTotalPoints : getUserPoints() + (result.pointsEarned || 0);
      setUserPoints(newTotal);
      setUserPointsState(newTotal);
      setRequestMessage(
        result.pointsEarned && result.pointsEarned > 0
          ? `Request submitted. +${result.pointsEarned} points added to your profile.`
          : 'Request already submitted. The admin team can review it from the control panel.'
      );
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to submit early access request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatusBar = () => (
    <div className="h-11 flex items-center justify-between px-4 text-white text-sm">
      <div className="flex items-center gap-2">
        <span className="font-semibold">9:41</span>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
        </svg>
      </div>
      <div className="flex items-center gap-2">
        <svg className="w-4 h-3" fill="currentColor" viewBox="0 0 16 12">
          <rect width="14" height="10" x="1" y="1" rx="1.5" stroke="currentColor" fill="none" strokeWidth="1.5" />
          <rect width="3" height="3" x="2.5" y="3.5" rx="0.5" />
          <rect width="3" height="3" x="6.5" y="3.5" rx="0.5" />
          <rect width="3" height="3" x="10.5" y="3.5" rx="0.5" />
        </svg>
        <div className="flex items-center gap-0.5">
          <div className="w-1 h-1 rounded-full bg-yellow-400" />
          <div className="w-3.5 h-3.5 rounded-sm border-2 border-white flex items-center justify-center">
            <div className="w-full h-2 bg-yellow-400 rounded-sm" />
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompactHeader = () => (
    <div className="bg-[#0a0e1a]">
      {renderStatusBar()}
      <div className="flex items-center justify-between px-4 pb-4 pt-2">
        <div className="flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <span className="text-sm font-black text-[#8ff0a8]">{userPoints}</span>
          <img src={gemIcon} alt="Gem" className="h-5 w-5" />
        </div>

        <button
          onClick={() => navigate('/profile-screen')}
          className="flex h-10 items-center gap-3 rounded-full bg-white px-4 text-black shadow-[0_8px_24px_rgba(0,0,0,0.32)]"
        >
          <div className="h-7 w-7 overflow-hidden rounded-full bg-gradient-to-br from-orange-300 to-orange-600">
            <img src={userPhoto} alt={userName} className="h-full w-full object-cover" />
          </div>
          <span className="max-w-[112px] truncate text-sm font-bold">{userName}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/chat/agent')}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-transparent"
            aria-label="AI chat"
          >
            {renderAnimatedAiAvatar()}
          </button>
          <button
            onClick={() => navigate('/chat-list')}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            aria-label="Messages"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-5">
        <div className="grid grid-cols-4 rounded-full border border-white/10 bg-[#101215]/95 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_32px_rgba(0,0,0,0.22)]">
          {[
            { label: 'Your Team', path: '/team-view' },
            { label: 'Invited Team', path: '/team-view' },
            { label: 'Winnings', path: '/winnings' },
            { label: 'Gameplay', path: '/gameplay' },
          ].map((tab) => (
            <button
              key={tab.label}
              onClick={() => tab.path !== '/winnings' && navigate(tab.path)}
              className={`rounded-full px-2 py-2.5 text-xs font-semibold transition-colors ${
                tab.path === '/winnings'
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFloatingFooterNav = () => (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto flex w-full max-w-md items-center justify-between px-7 pb-6 pt-8">
        <button
          onClick={() => navigate(-1)}
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#17191d]/95 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_34px_rgba(0,0,0,0.45)] transition-colors hover:bg-[#202329]"
          aria-label="Go back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => navigate('/portfolio')}
          className="pointer-events-auto flex h-12 items-center gap-2 rounded-full bg-[#17191d]/95 px-6 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_14px_36px_rgba(0,0,0,0.46)] transition-colors hover:bg-[#202329]"
          aria-label="Open portfolio"
        >
          <Briefcase className="h-4 w-4" />
          <span className="text-sm font-bold">Portfolio</span>
        </button>
        <button
          className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#17191d]/95 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_34px_rgba(0,0,0,0.45)] transition-colors hover:bg-[#202329]"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full overflow-y-auto bg-[#0a0e1a] text-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="mx-auto min-h-full w-full max-w-2xl">
        {renderCompactHeader()}

        <main className="px-8 pb-32 pt-3">
          <section className="relative overflow-hidden rounded-[1.8rem] border border-white/[0.03] bg-black px-5 py-7 shadow-[0_22px_60px_rgba(0,0,0,0.4)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(134,255,166,0.08),transparent_32%)]" />
            <div className="relative grid grid-cols-3 gap-x-8 gap-y-8">
              {rewardItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  type="button"
                  initial={{ opacity: 0, y: 12, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => item.isEarlyAccess && setShowTokenModal(true)}
                  className="flex min-h-[88px] flex-col items-center justify-start text-center transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/40 rounded-xl"
                >
                  <img
                    src={item.image}
                    alt={item.label.replace(/\n/g, ' ')}
                    className={`${item.id === 'moneetize-shirt' ? 'h-12 w-12' : 'h-11 w-11'} object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.45)]`}
                  />
                  <span className="mt-2 whitespace-pre-line text-[12px] font-black leading-tight text-white">
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </section>
        </main>
      </div>

      {renderFloatingFooterNav()}

      <AnimatePresence>
        {showTokenModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 px-4 backdrop-blur-sm"
            onClick={closeTokenModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 22, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 22, scale: 0.96 }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-[370px] overflow-hidden rounded-[1.9rem] border border-white/12 bg-gradient-to-b from-[#25282d] via-[#1c1f23] to-[#15171a] px-8 pb-12 pt-12 text-center shadow-[0_24px_80px_rgba(0,0,0,0.58)]"
            >
              <button
                type="button"
                onClick={closeTokenModal}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/16 hover:text-white"
                aria-label="Close token early access modal"
              >
                <X className="h-4 w-4" />
              </button>

              {!showRequestForm ? (
                <>
                  <img src={tokenCardImage} alt="Token Early Access" className="mx-auto mb-8 h-24 w-24 object-contain" />
                  <h2 className="mb-3 text-2xl font-black text-white">Token Early Access</h2>
                  <p className="mx-auto mb-8 max-w-[220px] text-base font-medium leading-snug text-white/55">
                    Description of what a wild card gives
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowRequestForm(true)}
                    className="mx-auto rounded-full bg-white px-8 py-3.5 font-black text-black shadow-[0_14px_34px_rgba(255,255,255,0.16)] transition-colors hover:bg-gray-100"
                  >
                    Activate
                  </button>
                </>
              ) : (
                <form onSubmit={handleSubmitEarlyAccess} className="text-left">
                  <div className="mb-6 text-center">
                    <img src={tokenCardImage} alt="" className="mx-auto mb-4 h-16 w-16 object-contain" />
                    <h2 className="text-2xl font-black text-white">Request access</h2>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">
                      Send your name and email to request Token Early Access.
                    </p>
                  </div>

                  <label className="mb-4 block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-white/45">Name</span>
                    <input
                      value={formName}
                      onChange={(event) => setFormName(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition focus:border-white/35"
                      placeholder="Your name"
                      required
                    />
                  </label>

                  <label className="mb-5 block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-white/45">Email</span>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(event) => setFormEmail(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none transition focus:border-white/35"
                      placeholder="you@example.com"
                      required
                    />
                  </label>

                  {requestError && (
                    <p className="mb-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                      {requestError}
                    </p>
                  )}
                  {requestMessage && (
                    <p className="mb-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                      {requestMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-full bg-white py-3.5 font-black text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Request'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WinningsScreen;
