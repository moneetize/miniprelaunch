import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Briefcase, ChevronLeft, MessageCircle, Search } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import aiBubble from 'figma:asset/36fff8878cf3ea6d1ef44d3f08bbc2346c733ebc.png';
import greenMorphicBall from 'figma:asset/8fd559d05db8d67dee13e79dc6418365220fd613.png';
import { getUserPoints } from '../utils/pointsManager';
import { getStoredProfileSettings, PROFILE_SETTINGS_STORAGE_KEYS, PROFILE_SETTINGS_UPDATED_EVENT } from '../utils/profileSettings';
import { getQuestStats, getQuests, initializeQuests, type Quest } from '../utils/questManager';
import {
  ContentCreationModal,
  DailyCheckInModal,
  PersonalityQuizModal,
  PortfolioActivityModal,
  ReviewItemsModal,
  ShareProductsModal,
  SurveyModal,
} from '../components/QuestModals';
import { QuestToast } from '../components/QuestToast';

export function GameplayScreen() {
  const navigate = useNavigate();
  const [userPoints, setUserPointsState] = useState(10);
  const [userName, setUserName] = useState('Jess Wu');
  const [userPhoto, setUserPhoto] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('blueAvatar');
  const [quests, setQuests] = useState<Quest[]>([]);
  const [activeQuestModal, setActiveQuestModal] = useState<{ type: string; questId: number } | null>(null);

  useEffect(() => {
    initializeQuests();
    setQuests(getQuests());
    setUserPointsState(getUserPoints());

    const applyProfileSettings = () => {
      const profileSettings = getStoredProfileSettings({ fallbackName: 'Jess Wu' });
      setUserName(profileSettings.name);
      setSelectedAvatar(profileSettings.selectedAvatar);
      setUserPhoto(profileSettings.photo);
    };

    applyProfileSettings();

    const handleQuestCompleteEvent = () => {
      setQuests(getQuests());
      setUserPointsState(getUserPoints());
    };
    const handleProfileSettingsUpdated = () => applyProfileSettings();
    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key || PROFILE_SETTINGS_STORAGE_KEYS.includes(event.key)) {
        applyProfileSettings();
      }
    };

    window.addEventListener('questCompleted', handleQuestCompleteEvent);
    window.addEventListener(PROFILE_SETTINGS_UPDATED_EVENT, handleProfileSettingsUpdated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('questCompleted', handleQuestCompleteEvent);
      window.removeEventListener(PROFILE_SETTINGS_UPDATED_EVENT, handleProfileSettingsUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

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
  const stats = getQuestStats();
  const levelProgress = stats.total ? Math.max(5, Math.round((stats.completed / stats.total) * 100)) : 64;
  const findQuest = (type: string) => quests.find((quest) => quest.type === type && !quest.completed) || quests.find((quest) => quest.type === type);
  const handleQuestComplete = () => {
    setQuests(getQuests());
    setUserPointsState(getUserPoints());
  };

  const earnPointActions = [
    { label: 'Referring\na friend', points: 10, className: 'left-1 top-3 h-[118px] w-[118px] -rotate-[15deg]', quest: findQuest('share') },
    { label: 'Sharing\nwith a friend', points: 10, className: 'right-1 top-3 h-[118px] w-[118px] rotate-[16deg]', quest: findQuest('share') },
    { label: 'Signing\nup', points: 10, className: 'left-[-26px] top-[128px] h-[132px] w-[132px] rotate-[4deg]', quest: undefined },
    { label: 'Performing\na first-time action', points: 5, className: 'left-1/2 top-[78px] h-[190px] w-[190px] -translate-x-1/2 rotate-[7deg] z-20', quest: quests[0] },
    { label: 'Daily\ncheck-in', points: 2, className: 'right-[-28px] top-[128px] h-[132px] w-[132px] -rotate-[8deg]', quest: findQuest('checkin') },
    { label: 'Taking a personality\nquiz', points: '5-30', className: 'left-0 top-[258px] h-[180px] w-[180px] -rotate-[2deg]', quest: findQuest('quiz') },
    { label: 'Discovering hidden\nproducts', points: 10, className: 'right-0 top-[258px] h-[180px] w-[180px] -rotate-[13deg]', quest: findQuest('portfolio') },
    { label: 'Product portfolio\nperformance', points: 10, className: 'left-1/2 top-[425px] h-[172px] w-[172px] -translate-x-1/2 -rotate-[8deg]', quest: findQuest('portfolio') },
  ];

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
              onClick={() => tab.path !== '/gameplay' && navigate(tab.path)}
              className={`rounded-full px-2 py-2.5 text-xs font-semibold transition-colors ${
                tab.path === '/gameplay'
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

        <main className="overflow-hidden px-3 pb-32 pt-4">
          <section className="-mx-3 min-h-[485px] overflow-hidden text-center">
            <h2 className="mb-6 text-xl font-black text-white">Level Up to Unlock Rewards!</h2>
            <div className="relative mx-auto h-[300px] max-w-[420px]">
              <div className="absolute left-[-64px] top-20 h-40 w-40 rounded-full bg-[radial-gradient(circle,#8ed3ff_0%,rgba(84,163,255,0.54)_45%,rgba(84,163,255,0)_76%)] blur-sm" />
              <div className="absolute right-[-64px] top-20 h-40 w-40 rounded-full bg-[radial-gradient(circle,#8ff0a8_0%,rgba(97,255,141,0.52)_45%,rgba(97,255,141,0)_76%)] blur-sm" />
              <div className="absolute left-1/2 top-6 h-64 w-64 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_28%,rgba(255,236,141,0.9)_0%,rgba(249,179,43,0.92)_38%,rgba(219,88,0,0.92)_74%)] shadow-[0_0_48px_rgba(252,187,43,0.7)]">
                <div className="absolute inset-4 rounded-full border-[3px] border-orange-700/45" />
                <div className="absolute inset-x-0 top-[105px] text-center">
                  <p className="mb-2 text-xl font-black text-white">{levelProgress}%</p>
                  <div className="mx-auto h-1 w-24 rounded-full bg-black/35">
                    <div className="h-full rounded-full bg-white" style={{ width: `${levelProgress}%` }} />
                  </div>
                </div>
              </div>
              <div className="absolute left-1/2 top-[250px] -translate-x-1/2 rounded-full border border-white/12 bg-white/10 px-8 py-3 text-base font-black text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                Rookie
              </div>
            </div>

            <div className="space-y-7 text-center">
              <div>
                <p className="text-base font-black text-white">Requirement</p>
                <p className="mt-1 text-sm font-semibold text-white/70">Sign up</p>
              </div>
              <div>
                <p className="text-base font-black text-white">Unlocks</p>
                <p className="mt-1 text-sm font-semibold text-white/70">Access to Wishlist & profile</p>
              </div>
            </div>
          </section>

          <section className="-mx-4 mt-2 min-h-[650px] overflow-hidden px-0">
            <h2 className="mb-6 text-center text-xl font-black text-white">How to Earn Points</h2>
            <div className="relative h-[610px]">
              {earnPointActions.map((action, index) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => action.quest && setActiveQuestModal({ questId: action.quest.id, type: action.quest.type })}
                  className={`group absolute rounded-full focus:outline-none focus:ring-2 focus:ring-white/30 ${action.className}`}
                >
                  <motion.span
                    animate={{
                      x: [0, index % 2 === 0 ? 14 : -13, index % 3 === 0 ? -9 : 8, 0],
                      y: [0, index % 2 === 0 ? -18 : 16, index % 3 === 0 ? 12 : -11, 0],
                      rotate: [0, index % 2 === 0 ? 2.8 : -2.4, index % 3 === 0 ? -1.8 : 1.7, 0],
                      scale: [1, 1.055, 0.98, 1],
                    }}
                    transition={{
                      duration: 4.8 + index * 0.38,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: index * 0.11,
                    }}
                    whileHover={{ scale: 1.06 }}
                    className="flex h-full w-full flex-col items-center justify-center rounded-full border border-[#343760] bg-[radial-gradient(circle_at_50%_38%,#2d2d66_0%,#171842_60%,#10112c_100%)] p-4 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_42px_rgba(0,0,0,0.36)] transition-shadow group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_22px_54px_rgba(143,240,168,0.18)]"
                    style={{ transformOrigin: '50% 50%', willChange: 'transform' }}
                  >
                    <span className="mb-2 flex items-center gap-1 text-base font-black text-[#8ff0a8]">
                      +{action.points}
                      <img src={gemIcon} alt="Gem" className="h-6 w-6" />
                    </span>
                    <span className="whitespace-pre-line text-sm font-medium leading-tight text-white/62">
                      {action.label}
                    </span>
                  </motion.span>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>

      <QuestToast />
      {renderFloatingFooterNav()}

      <AnimatePresence>
        {activeQuestModal?.type === 'quiz' && (
          <PersonalityQuizModal questId={activeQuestModal.questId} onClose={() => setActiveQuestModal(null)} onComplete={handleQuestComplete} />
        )}
        {activeQuestModal?.type === 'checkin' && (
          <DailyCheckInModal questId={activeQuestModal.questId} onClose={() => setActiveQuestModal(null)} onComplete={handleQuestComplete} />
        )}
        {activeQuestModal?.type === 'share' && (
          <ShareProductsModal questId={activeQuestModal.questId} onClose={() => setActiveQuestModal(null)} onComplete={handleQuestComplete} />
        )}
        {activeQuestModal?.type === 'review' && (
          <ReviewItemsModal questId={activeQuestModal.questId} onClose={() => setActiveQuestModal(null)} onComplete={handleQuestComplete} />
        )}
        {activeQuestModal?.type === 'survey' && (
          <SurveyModal questId={activeQuestModal.questId} onClose={() => setActiveQuestModal(null)} onComplete={handleQuestComplete} />
        )}
        {activeQuestModal?.type === 'content' && (
          <ContentCreationModal questId={activeQuestModal.questId} onClose={() => setActiveQuestModal(null)} onComplete={handleQuestComplete} />
        )}
        {activeQuestModal?.type === 'portfolio' && (
          <PortfolioActivityModal questId={activeQuestModal.questId} onClose={() => setActiveQuestModal(null)} onComplete={handleQuestComplete} />
        )}
      </AnimatePresence>
    </div>
  );
}
