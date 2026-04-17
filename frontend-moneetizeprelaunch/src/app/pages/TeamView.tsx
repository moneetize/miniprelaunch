import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ChevronLeft, MessageCircle, RefreshCw, Trash2 } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import { getUserPoints, POINTS_UPDATED_EVENT } from '../utils/pointsManager';
import { getStoredProfileSettings, PROFILE_SETTINGS_STORAGE_KEYS, PROFILE_SETTINGS_UPDATED_EVENT } from '../utils/profileSettings';
import { buildInviteLink } from '../utils/invitationLinks';
import { getAgentAvatarTone, getSelectedAvatarImage } from '../utils/avatarUtils';
import { hydrateRemoteProfileSettings } from '../services/profilePersistenceService';
import { loadInviteTeam } from '../services/inviteService';
import {
  deletePendingInvite,
  getPendingTeamInviteMembers,
  INVITES_UPDATED_EVENT,
  updatePendingInviteSentAt,
  type InviteDeliveryType,
} from '../utils/inviteSync';

interface TeamMember {
  id: number | string;
  name: string;
  handle: string;
  points: number;
  avatar: string;
  isCurrentUser?: boolean;
  debt?: string;
  status?: 'active' | 'pending';
  email?: string;
  phone?: string;
  contact?: string;
  inviteType?: InviteDeliveryType;
  inviteUrl?: string;
  sentAt?: string;
  canRemove?: boolean;
}

const getUserTeamName = (name: string) => {
  const firstName = name.trim().split(/\s+/)[0];
  return firstName ? `${firstName}'s Team` : 'My Team';
};

const getStoredTeamName = (name: string) => {
  const storedTeamName = localStorage.getItem('teamName')?.trim();
  return storedTeamName && storedTeamName !== "John's Team" ? storedTeamName : getUserTeamName(name);
};

export function TeamView() {
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState("Jess's Team");
  const [userPoints, setUserPointsState] = useState(10);
  const [userName, setUserName] = useState('Jess Wu');
  const [userHandle, setUserHandle] = useState('@jesswu');
  const [userPhoto, setUserPhoto] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('blueAvatar');
  const [removedMemberIds, setRemovedMemberIds] = useState<Array<number | string>>([]);
  const [acceptedInviteMembers, setAcceptedInviteMembers] = useState<TeamMember[]>([]);
  const [pendingInviteMembers, setPendingInviteMembers] = useState<TeamMember[]>([]);
  const [teamLimit, setTeamLimit] = useState(5);
  const [inviteActionMessage, setInviteActionMessage] = useState('');

  useEffect(() => {
    const points = getUserPoints();

    const applyProfileSettings = () => {
      const profileSettings = getStoredProfileSettings({
        fallbackName: 'Jess Wu',
      });

      setUserName(profileSettings.name);
      setUserHandle(profileSettings.handle);
      setSelectedAvatar(profileSettings.selectedAvatar);
      setUserPhoto(profileSettings.photo);
      setTeamName(getStoredTeamName(profileSettings.name));
    };
    const refreshPendingInviteMembers = () => {
      setPendingInviteMembers(
        getPendingTeamInviteMembers().map((invite) => ({
          id: invite.id,
          name: invite.name,
          email: invite.email,
          phone: invite.phone,
          contact: invite.contact,
          handle: '',
          points: 0,
          avatar: '',
          inviteType: invite.type,
          inviteUrl: invite.inviteUrl,
          sentAt: invite.sentAt,
          status: 'pending' as const,
        }))
      );
    };
    const refreshInviteTeam = () => {
      void loadInviteTeam()
        .then((team) => {
          if (!team) return;

          setTeamLimit(team.maxAccepted || 5);
          setAcceptedInviteMembers((team.members || []).map((member) => ({
            id: member.id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            contact: member.contact,
            handle: member.handle || '',
            points: member.points || 0,
            avatar: member.avatar || '',
            inviteUrl: member.inviteUrl,
            sentAt: member.sentAt,
            status: 'active' as const,
          })));

          if (team.pending?.length) {
            setPendingInviteMembers((currentPending) => {
              const localIds = new Set(currentPending.map((invite) => String(invite.id)));
              const remotePending = (team.pending || [])
                .filter((invite) => !localIds.has(String(invite.id)))
                .map((invite) => ({
                  id: invite.id,
                  name: invite.name,
                  email: invite.email,
                  phone: invite.phone,
                  contact: invite.contact,
                  handle: invite.handle || '',
                  points: 0,
                  avatar: '',
                  inviteType: invite.type,
                  inviteUrl: invite.inviteUrl,
                  sentAt: invite.sentAt,
                  status: 'pending' as const,
                }));

              return [...currentPending, ...remotePending];
            });
          }
        })
        .catch((error) => {
          console.warn('Invite team sync skipped:', error);
        });
    };

    setUserPointsState(points);
    applyProfileSettings();
    void hydrateRemoteProfileSettings()
      .then((settings) => {
        if (settings) applyProfileSettings();
      })
      .catch((error) => {
        console.warn('Remote team profile hydration skipped:', error);
      });
    refreshPendingInviteMembers();
    refreshInviteTeam();

    const syncPointBalance = () => setUserPointsState(getUserPoints());
    const handleProfileSettingsUpdated = () => applyProfileSettings();
    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key || PROFILE_SETTINGS_STORAGE_KEYS.includes(event.key)) {
        applyProfileSettings();
      }
      if (!event.key || ['sentInvites', 'pendingInvitations', 'pendingTeamInvites'].includes(event.key)) {
        refreshPendingInviteMembers();
        refreshInviteTeam();
      }
      if (!event.key || event.key === 'teamName') {
        applyProfileSettings();
      }
      if (!event.key || ['userPoints', 'pointsHistory', 'scratchHistory'].includes(event.key)) {
        syncPointBalance();
      }
    };

    window.addEventListener(PROFILE_SETTINGS_UPDATED_EVENT, handleProfileSettingsUpdated);
    window.addEventListener(POINTS_UPDATED_EVENT, syncPointBalance);
    const handleInvitesUpdated = () => {
      refreshPendingInviteMembers();
      refreshInviteTeam();
    };
    window.addEventListener(INVITES_UPDATED_EVENT, handleInvitesUpdated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(PROFILE_SETTINGS_UPDATED_EVENT, handleProfileSettingsUpdated);
      window.removeEventListener(POINTS_UPDATED_EVENT, syncPointBalance);
      window.removeEventListener(INVITES_UPDATED_EVENT, handleInvitesUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const aiAgentImage = getSelectedAvatarImage(selectedAvatar);
  const aiAgentTone = getAgentAvatarTone(selectedAvatar);
  const getPendingInviteLabel = (member: TeamMember) => member.email || member.phone || member.contact || member.name;
  const getMemberInitials = (name: string) => {
    const cleanName = `${name || 'Moneetize Member'}`.replace(' (You)', '').trim();
    const parts = cleanName.split(/\s+/).filter(Boolean);
    return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : cleanName.slice(0, 2)).toUpperCase();
  };
  const getInviteMessage = (inviteUrl: string) =>
    `Hey! I invited you to Moneetize. Start here and scratch to win rewards: ${inviteUrl} Reply STOP to opt out.`;
  const getSmsUrl = (recipient: string, message: string) => {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const separator = /iPad|iPhone|iPod/i.test(userAgent) ? '&' : '?';
    const cleanedRecipient = recipient.replace(/[^\d+]/g, '');

    return `sms:${cleanedRecipient}${separator}body=${encodeURIComponent(message)}`;
  };
  const handleResendPendingInvite = (member: TeamMember) => {
    if (member.status !== 'pending') return;

    const inviteUrl = member.inviteUrl || buildInviteLink();
    const recipient = getPendingInviteLabel(member);
    const message = getInviteMessage(inviteUrl);
    const deliveryType: InviteDeliveryType = member.inviteType || (member.phone ? 'sms' : 'email');
    const invitePayload = {
      id: String(member.id),
      type: deliveryType,
      email: member.email,
      phone: member.phone,
      contact: member.contact,
      inviteUrl,
    };

    updatePendingInviteSentAt(invitePayload);
    setInviteActionMessage(`Invite resent to ${recipient}.`);

    if (deliveryType === 'sms' && (member.phone || member.contact)) {
      window.location.href = getSmsUrl(member.phone || member.contact || '', message);
      return;
    }

    const email = member.email || member.contact;
    if (email) {
      window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Your Moneetize invite')}&body=${encodeURIComponent(message)}`;
    }
  };
  const handleDeletePendingInvite = (member: TeamMember) => {
    if (member.status !== 'pending') return;

    deletePendingInvite({
      id: String(member.id),
      type: member.inviteType || (member.phone ? 'sms' : 'email'),
      email: member.email,
      phone: member.phone,
      contact: member.contact,
    });
    setPendingInviteMembers((members) => members.filter((pendingMember) => pendingMember.id !== member.id));
    setInviteActionMessage(`Removed pending invite for ${getPendingInviteLabel(member)}.`);
  };

  const renderAnimatedAiAvatar = () => {
    return (
      <span className="relative block h-12 w-12">
        <motion.span
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${aiAgentTone.gradientClass} blur-lg opacity-40`}
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
          className={`relative block h-12 w-12 overflow-hidden rounded-full border-2 ${aiAgentTone.borderClass} transition-colors`}
          style={{
            maskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
          }}
        >
          <img src={aiAgentImage} alt="AI Agent" className={`h-full w-full object-cover opacity-90 ${aiAgentTone.imageClass}`} />
        </motion.span>
      </span>
    );
  };
  const teamMembers: TeamMember[] = [
    {
      id: 'current-user',
      name: `${userName} (You)`,
      handle: userHandle,
      points: userPoints,
      debt: 'Your points',
      avatar: userPhoto || aiAgentImage,
      status: 'active',
      isCurrentUser: true,
    },
    ...acceptedInviteMembers.slice(0, teamLimit),
    ...pendingInviteMembers,
  ];
  const visibleTeamMembers = teamMembers.filter((member) => !removedMemberIds.includes(member.id));
  const activeTeamMembers = visibleTeamMembers.filter((member) => member.status !== 'pending');
  const pendingTeamMembers = visibleTeamMembers.filter((member) => member.status === 'pending');
  const sortedTeam = [...activeTeamMembers].sort((a, b) => b.points - a.points);
  const displayedTeamProgress = activeTeamMembers.reduce((total, member) => total + (member.points || 0), 0);
  const rosterMembers = activeTeamMembers;

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
            { label: 'Network', path: '/profile-screen' },
            { label: 'Team', path: '/team-view' },
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
    <div className="h-[100dvh] w-full overflow-y-auto bg-[#0a0e1a] text-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="mx-auto min-h-full w-full max-w-2xl">
        {renderCompactHeader()}

        <main className="px-4 pb-12 pt-2">
          <div className="space-y-4 pb-4">
            <div className="flex items-center px-1">
              <h2 className="text-2xl font-black text-white">{teamName}</h2>
            </div>

            <div className="relative overflow-hidden rounded-[1.35rem] border border-white/12 bg-gradient-to-r from-[#282b30]/96 to-[#171b1f]/98 px-7 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_16px_44px_rgba(0,0,0,0.34)]">
              <div className="absolute right-7 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-emerald-300/18 blur-2xl" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="mb-1 text-base font-bold text-white/50">Team's Progress:</p>
                  <p className="text-2xl font-black text-white">{displayedTeamProgress} pts</p>
                </div>
                <motion.div
                  animate={{ y: [0, -6, 0], scale: [1, 1.04, 1] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative flex h-20 w-20 items-center justify-center"
                >
                  <motion.span
                    className="absolute h-20 w-20 rounded-full bg-emerald-300/24 blur-xl"
                    animate={{ opacity: [0.38, 0.72, 0.38], scale: [0.86, 1.08, 0.86] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <img src={gemIcon} alt="Gem" className="relative h-20 w-20 drop-shadow-[0_0_32px_rgba(134,255,166,0.62)]" />
                </motion.div>
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-white/8 bg-gradient-to-b from-[#121322]/98 via-[#151524]/98 to-[#151523]/98 px-4 pb-6 pt-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_70px_rgba(0,0,0,0.38)]">
              <div className="mb-9 flex items-end justify-center gap-5">
                {[
                  { member: sortedTeam[1], place: 2, color: 'text-sky-300', border: 'border-sky-300', avatarSize: 'h-[72px] w-[72px]', crownSize: 'h-6 w-6', rankSize: 'h-7 w-7 text-sm' },
                  { member: sortedTeam[0], place: 1, color: 'text-yellow-400', border: 'border-white', avatarSize: 'h-[94px] w-[94px]', crownSize: 'h-9 w-9', rankSize: 'h-8 w-8', lift: '-mt-6' },
                  { member: sortedTeam[2], place: 3, color: 'text-red-400', border: 'border-red-400', avatarSize: 'h-[72px] w-[72px]', crownSize: 'h-6 w-6', rankSize: 'h-7 w-7 text-sm' },
                ].map((podium) => {
                  const [firstName, lastName] = splitName(podium.member?.name);
                  return (
                    <div key={podium.place} className={`flex flex-col items-center ${podium.lift || ''}`}>
                      <svg className={`mb-2 ${podium.crownSize} ${podium.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 18h16M5 9l4 4 3-7 3 7 4-4v8H5V9z" />
                      </svg>
                      <motion.div
                        animate={{ y: [0, -4, 0], scale: [1, podium.place === 1 ? 1.025 : 1.018, 1] }}
                        transition={{
                          duration: podium.place === 1 ? 2.4 : 2.8,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: podium.place * 0.16,
                        }}
                        className="flex flex-col items-center"
                      >
                        <div className={`mb-2 overflow-hidden rounded-full border-[3px] ${podium.border} ${podium.avatarSize} bg-gradient-to-br from-purple-500 to-pink-500 shadow-[0_12px_28px_rgba(0,0,0,0.42)]`}>
                          {podium.member?.avatar && (
                            <img src={podium.member.avatar} alt={podium.member.name} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className={`-mt-5 mb-2 flex ${podium.rankSize} items-center justify-center rounded-full bg-white shadow-[0_7px_18px_rgba(0,0,0,0.42)]`}>
                          <span className="font-black text-[#151515]">{podium.place}</span>
                        </div>
                      </motion.div>
                      <p className="mb-1 max-w-[96px] text-center text-sm font-black leading-tight text-white">
                        {firstName}<br />{lastName}
                      </p>
                      <p className="text-xs font-bold text-[#8ff0a8]">{podium.member?.points} pts</p>
                      <p className="mt-0.5 text-xs font-bold text-white/40">{podium.member?.debt}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mb-4 flex items-center justify-between px-1">
                <h3 className="text-lg font-black text-white">Team Members</h3>
                <span className="text-xs font-bold text-white/42">{rosterMembers.length} active</span>
              </div>

              <div className="space-y-3">
                {rosterMembers.map((member) => (
                  <div
                    key={`roster-${member.id}`}
                    className="flex min-h-[62px] items-center gap-3 rounded-[1rem] border border-white/10 bg-white/[0.08] px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  >
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-white/[0.07] text-sm font-black text-white/68">
                          {getMemberInitials(member.name)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-black text-white">
                        {member.name}
                      </p>
                      <p className="truncate text-xs font-bold text-white/42">
                        {member.isCurrentUser ? 'You' : member.handle || member.email || 'Team member'}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-black text-[#8ff0a8]">{member.points}</span>
                      <img src={gemIcon} alt="Gem" className="h-6 w-6 drop-shadow-[0_0_14px_rgba(134,255,166,0.58)]" />
                    </div>
                  </div>
                ))}
              </div>

              {pendingTeamMembers.length > 0 && (
                <div className="mb-4 mt-6 flex items-center justify-between px-1">
                  <h3 className="text-lg font-black text-white">Pending Invites</h3>
                  <span className="text-xs font-bold text-white/42">{pendingTeamMembers.length} pending</span>
                </div>
              )}

              {pendingTeamMembers.map((member) => (
                <div
                  key={member.id}
                  className="mb-3 flex min-h-[62px] items-center gap-3 rounded-[1rem] border border-white/10 bg-white/[0.08] px-5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                >
                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/10">
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/26 text-[9px] font-black text-white/38">?</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-black text-white">
                      {getPendingInviteLabel(member)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-sm font-bold text-white/48">Pending...</span>
                    <button
                      type="button"
                      onClick={() => handleResendPendingInvite(member)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[#8ff0a8] transition-colors hover:bg-[#8ff0a8]/10 hover:text-[#b9ffc8]"
                      aria-label={`Resend invite to ${getPendingInviteLabel(member)}`}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePendingInvite(member)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-red-400/75 transition-colors hover:bg-red-400/10 hover:text-red-300"
                      aria-label={`Delete pending invite for ${getPendingInviteLabel(member)}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {inviteActionMessage && (
                <p className="mt-2 rounded-full border border-white/8 bg-white/[0.06] px-4 py-2 text-center text-xs font-bold text-white/62">
                  {inviteActionMessage}
                </p>
              )}

              <button
                type="button"
                onClick={() => navigate('/share-invites')}
                className="mt-5 flex min-h-[62px] w-full items-center justify-between rounded-[1rem] border border-dashed border-white/10 px-6 py-3 text-base font-bold text-white/58 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                <span>Send invite</span>
                <span className="text-2xl leading-none text-white/72">+</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
