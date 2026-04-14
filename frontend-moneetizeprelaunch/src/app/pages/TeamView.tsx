import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, MessageCircle } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import aiBubble from 'figma:asset/36fff8878cf3ea6d1ef44d3f08bbc2346c733ebc.png';
import greenMorphicBall from 'figma:asset/8fd559d05db8d67dee13e79dc6418365220fd613.png';
import { getUserPoints } from '../utils/pointsManager';
import { getStoredProfileSettings, PROFILE_SETTINGS_STORAGE_KEYS, PROFILE_SETTINGS_UPDATED_EVENT } from '../utils/profileSettings';

interface TeamMember {
  id: number;
  name: string;
  handle: string;
  points: number;
  avatar: string;
  isCurrentUser?: boolean;
}

export function TeamView() {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState("John's Team");
  const [userPoints, setUserPointsState] = useState(10);
  const [userName, setUserName] = useState('Jess Wu');
  const [userHandle, setUserHandle] = useState('@jesswu');
  const [userPhoto, setUserPhoto] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('blueAvatar');

  useEffect(() => {
    const points = getUserPoints();

    const applyProfileSettings = () => {
      const profileSettings = getStoredProfileSettings({
        fallbackName: 'Jess Wu',
        fallbackHandle: '@jesswu',
      });

      setUserName(profileSettings.name);
      setUserHandle(profileSettings.handle);
      setSelectedAvatar(profileSettings.selectedAvatar);
      setUserPhoto(profileSettings.photo);
    };

    setTeamName(localStorage.getItem('teamName') || "John's Team");
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

  const aiAgentImage = selectedAvatar === 'greenAvatar' ? greenMorphicBall : aiBubble;
  const teamMembers: TeamMember[] = [
    { id: 1, name: `${userName} (You)`, handle: userHandle, points: userPoints, avatar: userPhoto, isCurrentUser: true },
    { id: 2, name: 'Russell Westbrook', handle: '@russell', points: 42, avatar: 'https://images.unsplash.com/photo-1629507208649-70919ca33793?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMG1hbiUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NDA4MzYxOXww&ixlib=rb-4.1.0&q=80&w=1080' },
    { id: 3, name: 'Alex McKein', handle: '@alex', points: 40, avatar: 'https://images.unsplash.com/photo-1768853972795-2739a9685567?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMGF0aGxldGUlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzQxNDA1NDh8MA&ixlib=rb-4.1.0&q=80&w=1080' },
    { id: 4, name: 'Bill Winston', handle: '@bill', points: 35, avatar: 'https://images.unsplash.com/photo-1758876204244-930299843f07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB5b3VuZyUyMG1hbiUyMHNtaWxpbmd8ZW58MXx8fHwxNzc0MTQwNTQ5fDA&ixlib=rb-4.1.0&q=80&w=1080' },
    { id: 5, name: 'John Black', handle: '@john', points: 30, avatar: 'https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBidXNpbmVzcyUyMHBlcnNvbiUyMGhlYWRzaG90fGVufDF8fHx8MTc3NDA2NzIwNnww&ixlib=rb-4.1.0&q=80&w=1080' },
  ];
  const sortedTeam = [...teamMembers].sort((a, b) => b.points - a.points);
  const teamTotalPoints = sortedTeam.reduce((sum, member) => sum + member.points, 0);

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors hover:bg-white/14"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/8 px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <span className="text-sm font-black text-[#8ff0a8]">{userPoints}</span>
            <img src={gemIcon} alt="Gem" className="h-5 w-5" />
          </div>
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
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            aria-label="AI chat"
          >
            <img src={aiAgentImage} alt="AI" className="h-9 w-9 rounded-full object-cover" />
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
              onClick={() => tab.path !== '/team-view' && navigate(tab.path)}
              className={`rounded-full px-2 py-2.5 text-xs font-semibold transition-colors ${
                tab.path === '/team-view'
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

  const splitName = (name?: string) => {
    const parts = (name || '').replace(' (You)', '').split(' ');
    return [parts[0] || '', parts[1] || ''];
  };

  return (
    <div className="h-screen w-full overflow-y-auto bg-[#0a0e1a] text-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="mx-auto min-h-full w-full max-w-2xl">
        {renderCompactHeader()}

        <main className="px-4 pb-12 pt-2">
          <div className="space-y-4 pb-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-2xl font-black text-white">{teamName}</h2>
              <span className="text-sm font-bold text-white">{sortedTeam.length}/5</span>
            </div>

            <div className="relative overflow-hidden rounded-[1.35rem] border border-white/12 bg-gradient-to-r from-[#25292d]/96 to-[#15181c]/98 px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_16px_44px_rgba(0,0,0,0.34)]">
              <div className="absolute right-5 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-emerald-300/18 blur-2xl" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="mb-1 text-base font-semibold text-white/50">Team's Progress:</p>
                  <p className="text-2xl font-black text-white">{teamTotalPoints} pts</p>
                </div>
                <img src={gemIcon} alt="gem" className="h-20 w-20 drop-shadow-[0_0_32px_rgba(134,255,166,0.62)]" />
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-white/8 bg-gradient-to-b from-[#1b1b2b]/98 to-[#151624]/98 px-4 pb-5 pt-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.38)]">
              <div className="mb-8 flex items-end justify-center gap-4">
                {[
                  { member: sortedTeam[1], place: 2, color: 'text-sky-300', border: 'border-sky-300', avatarSize: 'h-[70px] w-[70px]', crownSize: 'h-7 w-7', rankSize: 'h-7 w-7 text-sm' },
                  { member: sortedTeam[0], place: 1, color: 'text-yellow-400', border: 'border-white', avatarSize: 'h-[92px] w-[92px]', crownSize: 'h-9 w-9', rankSize: 'h-8 w-8', lift: '-mt-4' },
                  { member: sortedTeam[2], place: 3, color: 'text-red-400', border: 'border-red-400', avatarSize: 'h-[70px] w-[70px]', crownSize: 'h-7 w-7', rankSize: 'h-7 w-7 text-sm' },
                ].map((podium) => {
                  const [firstName, lastName] = splitName(podium.member?.name);
                  return (
                    <div key={podium.place} className={`flex flex-col items-center ${podium.lift || ''}`}>
                      <svg className={`mb-2 ${podium.crownSize} ${podium.color}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
                      </svg>
                      <div className={`mb-2 overflow-hidden rounded-full border-[3px] ${podium.border} ${podium.avatarSize} bg-gradient-to-br from-purple-500 to-pink-500`}>
                        {podium.member?.avatar && (
                          <img src={podium.member.avatar} alt={podium.member.name} className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div className={`-mt-5 mb-2 flex ${podium.rankSize} items-center justify-center rounded-full bg-white shadow-lg`}>
                        <span className="font-black text-black">{podium.place}</span>
                      </div>
                      <p className="mb-1 max-w-[92px] text-center text-sm font-bold leading-tight text-white">
                        {firstName}<br />{lastName}
                      </p>
                      <p className="text-xs font-bold text-[#8ff0a8]">{podium.member?.points} pts</p>
                    </div>
                  );
                })}
              </div>

              {sortedTeam.slice(3).map((member, index) => (
                <div
                  key={member.id}
                  className="mb-3 flex items-center gap-3 rounded-[1rem] border border-white/8 bg-white/[0.07] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="flex h-8 w-8 items-center justify-center">
                    <span className="text-sm font-black text-white">{index + 4}</span>
                  </div>
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                    {member.avatar && <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {member.name.replace(' (You)', '')}
                      {member.isCurrentUser && <span className="text-white/45"> (You)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#8ff0a8]">{member.points}</span>
                    <img src={gemIcon} alt="gem" className="h-5 w-5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
