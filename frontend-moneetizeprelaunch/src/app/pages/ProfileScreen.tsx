import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronUp, History, MessageCircle, MoreHorizontal, Share2, Settings, UserPlus, Plus, Trash2, Link as LinkIcon, Copy, Check, ChevronRight, User, Mail, Calendar, Heart, Target, Award, TrendingUp, Users, LogOut, X, Shield } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import wildcardIcon from 'figma:asset/f632203f248e2d298246c5ffb0789bc0cac99ea5.png';
import tshirtRewardIcon from '../../assets/moneetize-tshirt-reward.png';
import { getUserPoints, POINTS_UPDATED_EVENT } from '../utils/pointsManager';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { isUserAdmin, logoutUser } from '../services/authService';
import { getStoredScratchCredits, getStoredUsdtBalance, loadScratchProfile, type ScratchCredits, type ScratchDrawResult } from '../services/scratchService';
import { LOCAL_NETWORK_PROFILES_UPDATED_EVENT, loadNetworkFollowStates, loadRecommendedFriends, saveNetworkFollowState, syncCurrentUserNetworkProfile, type RecommendedFriendProfile } from '../services/networkService';
import { getStoredProfileSettings, isStoredProfileComplete, PROFILE_SETTINGS_STORAGE_KEYS, PROFILE_SETTINGS_UPDATED_EVENT, writeStoredProfileSettings } from '../utils/profileSettings';
import { hydrateRemoteProfileSettings } from '../services/profilePersistenceService';

interface TeamMember {
  id: string;
  name: string;
  email?: string;
  points: number;
  avatar?: string;
  status: 'active' | 'pending';
  isCurrentUser?: boolean;
  handle?: string;
}

interface InvitedTeam {
  id: string;
  name: string;
  createdAt: string;
  members: TeamMember[];
  pendingInvites: {
    id: string;
    email: string;
    sentAt: string;
  }[];
}

interface NetworkProfile {
  id: string;
  name: string;
  avatar?: string;
  handle?: string;
  initialRank: number;
  initiallyFollowing: boolean;
  followsMe?: boolean;
  isCurrentUser?: boolean;
}

type HistoryRewardIcon = {
  id: string;
  type: 'points' | 'tripto' | 'wildcard' | 'merch';
  amount?: number;
};

const NETWORK_FOLLOW_STATES_KEY = 'networkFollowStates';

const defaultNetworkFollowStates: Record<string, boolean> = {
  'john-black': true,
  'jim-kerry': false,
  'maria-chen': false,
  'taylor-owens': false,
  'nina-patel': false,
  'omar-brooks': false,
  'lena-watts': false,
  'diego-rivera': false,
};

function getStoredNetworkFollowStates() {
  try {
    const storedStates = safeGetItem(NETWORK_FOLLOW_STATES_KEY);
    const parsed = storedStates ? JSON.parse(storedStates) : {};
    return parsed && typeof parsed === 'object' ? parsed as Record<string, boolean> : {};
  } catch {
    return {};
  }
}

function getStoredScratchHistory(): ScratchDrawResult[] {
  try {
    const history = safeGetItem('scratchHistory');
    const parsed = history ? JSON.parse(history) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getScratchHistoryUsdtTotal(history: ScratchDrawResult[]) {
  return history.reduce((total, draw) => total + (Number(draw.reward?.usdt) || 0), 0);
}

function formatUsdtBalance(value: number) {
  return value.toFixed(2);
}

function formatHistoryDate(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date).replace(/\//g, '.');
}

function formatHistoryTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

function getHistoryTitle(draw: ScratchDrawResult) {
  return draw.ticket.isGolden ? 'Golden scratch' : 'Basic scratch';
}

function getHistoryRewards(draw: ScratchDrawResult): HistoryRewardIcon[] {
  const rewards: HistoryRewardIcon[] = [];
  const awardedItems = draw.reward.items || [];

  if (awardedItems.some(item => item.type === 'merch')) {
    rewards.push({ id: `${draw.id}-merch`, type: 'merch' });
  }

  if (draw.ticket.isGolden || awardedItems.some(item => item.type === 'wildcard' && draw.ticket.isGolden)) {
    rewards.push({ id: `${draw.id}-wildcard`, type: 'wildcard' });
  }

  if (draw.reward.triptoPoints > 0) {
    rewards.push({ id: `${draw.id}-tripto`, type: 'tripto', amount: draw.reward.triptoPoints });
  }

  if (draw.reward.moneetizePoints > 0) {
    rewards.push({ id: `${draw.id}-points`, type: 'points', amount: draw.reward.moneetizePoints });
  }

  return rewards;
}

export function ProfileScreen() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'network' | 'your-team' | 'invited-team' | 'winnings' | 'gameplay' | 'settings'>('network');
  const [userPoints, setUserPoints] = useState(0);
  const [userName, setUserName] = useState('');
  const [userHandle, setUserHandle] = useState('');
  const [userPhoto, setUserPhoto] = useState<string>('');
  const [balance, setBalance] = useState(0);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitedTeams, setInvitedTeams] = useState<InvitedTeam[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<InvitedTeam | null>(null);
  const [selectedTeamForInvite, setSelectedTeamForInvite] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [investmentProfile, setInvestmentProfile] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [showPhotoEditModal, setShowPhotoEditModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showRewardHistory, setShowRewardHistory] = useState(false);
  const [scratchHistory, setScratchHistory] = useState<ScratchDrawResult[]>(() => getStoredScratchHistory());
  const [scratchCredits, setScratchCredits] = useState<ScratchCredits | null>(() => getStoredScratchCredits());
  const [isProfileComplete, setIsProfileComplete] = useState(() => isStoredProfileComplete());
  const [recommendedFriends, setRecommendedFriends] = useState<RecommendedFriendProfile[]>([]);
  const [networkFollowStates, setNetworkFollowStates] = useState<Record<string, boolean>>(() => ({
    ...defaultNetworkFollowStates,
    ...getStoredNetworkFollowStates(),
  }));

  useEffect(() => {
    let cancelled = false;

    const syncScratchCredits = () => {
      void loadScratchProfile()
        .then((profile) => {
          if (cancelled) return;
          if (profile?.scratchCredits) setScratchCredits(profile.scratchCredits);
          if (profile?.history) {
            setScratchHistory(profile.history);
            setBalance((currentBalance) => Math.max(currentBalance, getScratchHistoryUsdtTotal(profile.history || [])));
          }
          if (profile?.balances) {
            setUserPoints(getUserPoints());
            setBalance((currentBalance) => Math.max(currentBalance, profile.balances?.usdt || 0));
          }
        })
        .catch((error) => {
          console.warn('Scratch credit refresh skipped:', error);
        });
    };

    const refreshTimer = window.setInterval(syncScratchCredits, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Check if user is admin
    setIsAdmin(isUserAdmin());
    const applyProfileSettings = () => {
      const profileSettings = getStoredProfileSettings({
        fallbackName: 'Jess Wu',
      });

      setUserName(profileSettings.name);
      setUserHandle(profileSettings.handle);
      setUserPhoto(profileSettings.photo);
      setUserEmail(profileSettings.email);
      setUserInterests(profileSettings.interests);
      setInvestmentProfile(profileSettings.investmentProfile || 'Not set');
      setIsProfileComplete(isStoredProfileComplete());

      return profileSettings;
    };

    // Load user data
    const points = getUserPoints();
    const storedScratchHistory = getStoredScratchHistory();
    setUserPoints(points);
    setScratchHistory(storedScratchHistory);
    setBalance(Math.max(getStoredUsdtBalance(), getScratchHistoryUsdtTotal(storedScratchHistory)));
    const profileSettings = applyProfileSettings();

    void hydrateRemoteProfileSettings()
      .then((settings) => {
        if (!settings || cancelled) return;
        writeStoredProfileSettings(settings);
        const nextProfileSettings = applyProfileSettings();
        syncCurrentUserNetworkProfile();
        setTeamMembers((members) =>
          members.map((member) =>
            member.isCurrentUser
              ? {
                  ...member,
                  name: nextProfileSettings.name,
                  handle: nextProfileSettings.handle,
                  avatar: nextProfileSettings.photo,
                }
              : member
          )
        );
      })
      .catch((error) => {
        console.warn('Remote profile settings sync skipped:', error);
      });

    void loadScratchProfile()
      .then((profile) => {
        if (!cancelled && profile?.balances) {
          const latestPoints = getUserPoints();
          setUserPoints(latestPoints);
          setBalance(profile.balances.usdt);
          setTeamMembers((members) =>
            members.map((member) =>
              member.isCurrentUser ? { ...member, points: latestPoints } : member
            )
          );
        }
        if (!cancelled && profile?.scratchCredits) {
          setScratchCredits(profile.scratchCredits);
        }
        if (!cancelled && profile?.history) {
          setScratchHistory(profile.history);
          setBalance((currentBalance) => Math.max(currentBalance, getScratchHistoryUsdtTotal(profile.history || [])));
        }
      })
      .catch((error) => {
        console.warn('Scratch profile sync skipped:', error);
      });

    void loadRecommendedFriends()
      .then((profiles) => {
        if (!cancelled) {
          setRecommendedFriends(profiles);
        }
      })
      .catch((error) => {
        console.warn('Network profile sync skipped:', error);
      });

    void loadNetworkFollowStates()
      .then((states) => {
        if (!cancelled) {
          const nextStates = {
            ...defaultNetworkFollowStates,
            ...getStoredNetworkFollowStates(),
            ...states,
          };
          safeSetItem(NETWORK_FOLLOW_STATES_KEY, JSON.stringify(nextStates));
          setNetworkFollowStates(nextStates);
        }
      })
      .catch((error) => {
        console.warn('Network follows sync skipped:', error);
      });

    // Set member since date
    const userProfileData = safeGetItem('userProfile');
    const parsedProfile = userProfileData ? JSON.parse(userProfileData) : {};
    const createdAt = parsedProfile.completedAt || new Date().toISOString();
    setMemberSince(createdAt);

    // Mock team data
    const mockTeam: TeamMember[] = [
      {
        id: '1',
        name: profileSettings.name,
        points: points,
        avatar: profileSettings.photo,
        status: 'active',
        isCurrentUser: true,
        handle: profileSettings.handle
      },
      {
        id: '2',
        name: 'John Black',
        points: 30,
        avatar: 'https://images.unsplash.com/photo-1651684215020-f7a5b6610f23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbGUlMjBidXNpbmVzc3xlbnwxfHx8fDE3NzQxMjU0OTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
        status: 'active',
        handle: '@healthyhabits'
      },
      {
        id: '3',
        name: 'Jim Kerry',
        points: 27,
        avatar: 'https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGZlbWFsZSUyMGJ1c2luZXNzfGVufDF8fHx8MTc3NDEyNTQ5OXww&ixlib=rb-4.1.0&q=80&w=1080',
        status: 'active',
        handle: '@jimkerry'
      },
      {
        id: '4',
        email: 'test@mail.com',
        name: 'test@mail.com',
        points: 0,
        status: 'pending'
      }
    ];
    
    setTeamMembers(mockTeam);
    const syncPointBalance = () => {
      const latestPoints = getUserPoints();
      setUserPoints(latestPoints);
      syncCurrentUserNetworkProfile();
      setTeamMembers((members) =>
        members.map((member) =>
          member.isCurrentUser ? { ...member, points: latestPoints } : member
        )
      );
    };
    const handleProfileSettingsUpdated = () => {
      const nextProfileSettings = applyProfileSettings();
      syncCurrentUserNetworkProfile();
      setTeamMembers((members) =>
        members.map((member) =>
          member.isCurrentUser
            ? {
                ...member,
                name: nextProfileSettings.name,
                handle: nextProfileSettings.handle,
                avatar: nextProfileSettings.photo,
              }
            : member
        )
      );
    };
    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key || PROFILE_SETTINGS_STORAGE_KEYS.includes(event.key)) {
        handleProfileSettingsUpdated();
      }
      if (!event.key || ['userPoints', 'pointsHistory', 'userUsdtBalance', 'scratchHistory', 'scratchCredits', NETWORK_FOLLOW_STATES_KEY].includes(event.key)) {
        const latestHistory = getStoredScratchHistory();
        syncPointBalance();
        setScratchHistory(latestHistory);
        setScratchCredits(getStoredScratchCredits());
        setBalance(Math.max(getStoredUsdtBalance(), getScratchHistoryUsdtTotal(latestHistory)));
        setNetworkFollowStates({
          ...defaultNetworkFollowStates,
          ...getStoredNetworkFollowStates(),
        });
      }
    };
    const syncNetworkProfiles = () => {
      void loadRecommendedFriends()
        .then((profiles) => {
          if (!cancelled) {
            setRecommendedFriends(profiles);
          }
        })
        .catch((error) => {
          console.warn('Network profile sync skipped:', error);
        });
    };

    window.addEventListener(PROFILE_SETTINGS_UPDATED_EVENT, handleProfileSettingsUpdated);
    window.addEventListener(POINTS_UPDATED_EVENT, syncPointBalance);
    window.addEventListener(LOCAL_NETWORK_PROFILES_UPDATED_EVENT, syncNetworkProfiles);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      cancelled = true;
      window.removeEventListener(PROFILE_SETTINGS_UPDATED_EVENT, handleProfileSettingsUpdated);
      window.removeEventListener(POINTS_UPDATED_EVENT, syncPointBalance);
      window.removeEventListener(LOCAL_NETWORK_PROFILES_UPDATED_EVENT, syncNetworkProfiles);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleConfirmDelete = () => {
    if (memberToDelete) {
      setTeamMembers(teamMembers.filter(member => member.id !== memberToDelete.id));
      setShowDeleteModal(false);
      setMemberToDelete(null);
    }
  };

  const handleCreateTeam = () => {
    if (newTeamName.trim()) {
      const newTeam: InvitedTeam = {
        id: 'team-' + Date.now(),
        name: newTeamName,
        createdAt: new Date().toISOString(),
        members: [],
        pendingInvites: []
      };
      setInvitedTeams([...invitedTeams, newTeam]);
      setNewTeamName('');
      setShowCreateTeamModal(false);
    }
  };

  const handleAddMember = () => {
    if (newMemberEmail.trim() && selectedTeamForInvite) {
      setInvitedTeams(invitedTeams.map(team => {
        if (team.id === selectedTeamForInvite) {
          return {
            ...team,
            pendingInvites: [
              ...team.pendingInvites,
              {
                id: 'invite-' + Date.now(),
                email: newMemberEmail,
                sentAt: new Date().toISOString()
              }
            ]
          };
        }
        return team;
      }));
      setNewMemberEmail('');
      setShowAddMemberModal(false);
      setSelectedTeamForInvite(null);
    }
  };

  const handleDeleteTeam = (teamId: string) => {
    setInvitedTeams(invitedTeams.filter(team => team.id !== teamId));
    setTeamToDelete(null);
  };

  const handleRemoveInvite = (teamId: string, inviteId: string) => {
    setInvitedTeams(invitedTeams.map(team => {
      if (team.id === teamId) {
        return {
          ...team,
          pendingInvites: team.pendingInvites.filter(invite => invite.id !== inviteId)
        };
      }
      return team;
    }));
  };

  const visibleScratchHistory = scratchHistory.slice(0, 7);

  const renderHistoryReward = (reward: HistoryRewardIcon) => {
    if (reward.type === 'wildcard') {
      return <img src={wildcardIcon} alt="Wild Card" className="h-6 w-6 rounded-[0.3rem] object-contain" />;
    }

    if (reward.type === 'merch') {
      return <img src={tshirtRewardIcon} alt="Moneetize Merch" className="h-6 w-6 object-contain" />;
    }

    if (reward.type === 'tripto') {
      return (
        <span className="flex items-center gap-1 text-xs font-black text-white">
          + {reward.amount}
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff_0%,#c9c9c3_34%,#6e6f6f_72%,#36393c_100%)] text-[10px] text-[#333] shadow-[inset_0_1px_3px_rgba(255,255,255,0.9),0_0_14px_rgba(255,255,255,0.18)]">
            T
          </span>
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 text-xs font-black text-emerald-200">
        +{reward.amount}
        <img src={gemIcon} alt="Gem" className="h-6 w-6 drop-shadow-[0_0_14px_rgba(134,255,166,0.58)]" />
      </span>
    );
  };

  const totalUsdtWon = Math.max(balance, getScratchHistoryUsdtTotal(scratchHistory));
  const displayBalance = formatUsdtBalance(totalUsdtWon);
  const availableScratchCredits = scratchCredits?.available || 0;
  const hasScratchOpportunity = availableScratchCredits > 0;
  const userInitials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'JW';

  const compactProfileActions = [
    { label: 'Profile home', icon: <User className="h-3 w-3" /> },
    { label: 'Rewards', icon: <Award className="h-3 w-3" /> },
    { label: 'Network', icon: <Users className="h-3 w-3" /> },
    { label: 'Winnings', icon: <History className="h-3 w-3" /> },
  ];

  const fallbackNetworkProfiles: NetworkProfile[] = [
    {
      id: 'john-black',
      name: 'John Black',
      initialRank: 2,
      initiallyFollowing: true,
      followsMe: true,
      avatar: 'https://images.unsplash.com/photo-1651684215020-f7a5b6610f23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1hbGUlMjBidXNpbmVzc3xlbnwxfHx8fDE3NzQxMjU0OTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 'jim-kerry',
      name: 'Jim Kerry',
      initialRank: 3,
      initiallyFollowing: false,
      followsMe: true,
      avatar: 'https://images.unsplash.com/photo-1769636929132-e4e7b50cfac0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMGZlbWFsZSUyMGJ1c2luZXNzfGVufDF8fHx8MTc3NDEyNTQ5OXww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 'maria-chen',
      name: 'Maria Chen',
      initialRank: 4,
      initiallyFollowing: false,
      followsMe: false,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
    },
    {
      id: 'taylor-owens',
      name: 'Taylor Owens',
      initialRank: 5,
      initiallyFollowing: false,
      followsMe: true,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
    },
    {
      id: 'nina-patel',
      name: 'Nina Patel',
      initialRank: 6,
      initiallyFollowing: false,
      followsMe: false,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80',
    },
    {
      id: 'omar-brooks',
      name: 'Omar Brooks',
      initialRank: 7,
      initiallyFollowing: false,
      followsMe: false,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
    },
    {
      id: 'lena-watts',
      name: 'Lena Watts',
      initialRank: 8,
      initiallyFollowing: false,
      followsMe: false,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80',
    },
    {
      id: 'diego-rivera',
      name: 'Diego Rivera',
      initialRank: 9,
      initiallyFollowing: false,
      followsMe: true,
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80',
    },
  ];

  const loadedNetworkProfiles: NetworkProfile[] = recommendedFriends.map((profile, index) => ({
    id: profile.id,
    name: profile.name,
    avatar: profile.avatar,
    handle: profile.handle,
    initialRank: fallbackNetworkProfiles.length + index + 2,
    initiallyFollowing: false,
    followsMe: profile.followsMe ?? index % 2 === 0,
  }));
  const currentUserNetworkProfile: NetworkProfile = {
    id: 'current-user',
    name: `${userName || 'Jess Wu'} (Me)`,
    avatar: userPhoto,
    handle: userHandle,
    initialRank: 1,
    initiallyFollowing: false,
    followsMe: false,
    isCurrentUser: true,
  };
  const currentUserId = safeGetItem('user_id') || safeGetItem('user_email') || 'current-user';
  const networkProfilesByKey = new Map<string, NetworkProfile>();
  [...loadedNetworkProfiles, ...fallbackNetworkProfiles].forEach((profile) => {
    const profileName = profile.name.replace(/\s+\(Me\)$/i, '');
    const profileKey = `${profile.id || profileName}`.toLowerCase();

    if (
      profile.id === currentUserId ||
      profile.id === 'current-user' ||
      profileName === userName ||
      networkProfilesByKey.has(profileKey)
    ) {
      return;
    }

    networkProfilesByKey.set(profileKey, {
      ...profile,
      initialRank: networkProfilesByKey.size + 2,
    });
  });
  const candidateNetworkProfiles = [...networkProfilesByKey.values()];

  const isNetworkProfileFollowing = (profile: NetworkProfile) =>
    !profile.isCurrentUser && (networkFollowStates[profile.id] ?? profile.initiallyFollowing);

  const myNetworkProfiles = [
    currentUserNetworkProfile,
    ...candidateNetworkProfiles.filter((profile) => isNetworkProfileFollowing(profile)),
  ];
  const peopleYouMayKnowProfiles = candidateNetworkProfiles.filter((profile) => !isNetworkProfileFollowing(profile));
  const peopleYouMayKnowGroups = Array.from(
    { length: Math.ceil(peopleYouMayKnowProfiles.length / 3) },
    (_, index) => peopleYouMayKnowProfiles.slice(index * 3, index * 3 + 3),
  );
  const followingCount = candidateNetworkProfiles.filter((profile) => isNetworkProfileFollowing(profile)).length;
  const followersCount = candidateNetworkProfiles.filter((profile) => profile.followsMe).length;
  const displayNetworkingPoints = Math.min(
    10,
    candidateNetworkProfiles.reduce((total, profile) => {
      if (!isNetworkProfileFollowing(profile)) return total;
      return total + 1 + (profile.followsMe ? 2 : 0);
    }, 0),
  );

  const handleToggleNetworkFollow = (profile: NetworkProfile) => {
    if (profile.isCurrentUser) return;

    const isFollowing = isNetworkProfileFollowing(profile);
    setNetworkFollowStates((states) => {
      const nextStates = {
        ...states,
        [profile.id]: !isFollowing,
      };
      safeSetItem(NETWORK_FOLLOW_STATES_KEY, JSON.stringify(nextStates));
      return nextStates;
    });

    void saveNetworkFollowState(profile.id, !isFollowing)
      .then((remoteStates) => {
        setNetworkFollowStates((states) => {
          const nextStates = {
            ...states,
            ...remoteStates,
          };
          safeSetItem(NETWORK_FOLLOW_STATES_KEY, JSON.stringify(nextStates));
          return nextStates;
        });
      })
      .catch((error) => {
        console.warn('Network follow save skipped:', error);
      });
  };

  const profileStats = [
    { label: 'USDT (Locked)', value: `$ ${displayBalance}`, icon: <Copy className="h-3 w-3" /> },
    { label: 'Following', value: followingCount, icon: <ChevronUp className="h-3 w-3" /> },
    { label: 'Followers', value: followersCount, icon: <ChevronUp className="h-3 w-3 rotate-180" /> },
  ];

  const renderNetworkProfileRow = (profile: NetworkProfile, index: number) => {
    const isFollowing = isNetworkProfileFollowing(profile);
    const actionLabel = profile.isCurrentUser ? 'Me' : isFollowing ? 'Following' : 'Follow';

    return (
      <button
        key={`${profile.id}-${index}`}
        type="button"
        onClick={() => handleToggleNetworkFollow(profile)}
        disabled={profile.isCurrentUser}
        className={`flex min-h-[58px] w-full items-center gap-3 rounded-[1rem] border border-white/10 bg-white/[0.08] px-4 py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors ${
          profile.isCurrentUser ? 'cursor-default' : 'hover:bg-white/[0.12]'
        }`}
      >
        <span className="w-5 shrink-0 text-center text-sm font-black text-white/72">{profile.initialRank}</span>
        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/10">
          {profile.avatar ? (
            <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-black text-white/48">
              {profile.name.charAt(0)}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-black text-white">
          {profile.name}
        </span>
        <span
          className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition-colors ${
            profile.isCurrentUser
              ? 'border border-emerald-300/30 bg-emerald-300/12 text-emerald-100'
              : isFollowing
              ? 'bg-white text-black'
              : 'border border-white/10 bg-white/[0.06] text-white/82'
          }`}
        >
          {actionLabel}
        </span>
      </button>
    );
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-y-auto bg-[#0a0e1a] text-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Status Bar */}
      <div className="absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-4 sm:px-6 text-white text-sm z-50">
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

      <div className="mx-auto w-full max-w-[430px] overflow-x-hidden px-3 pb-6 pt-16 min-[390px]:px-4">
        {!isProfileComplete && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 overflow-hidden rounded-[1rem] border border-white/10 bg-white/[0.075] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_44px_rgba(0,0,0,0.32)] backdrop-blur-md"
          >
            <div className="flex min-w-0 flex-col items-start gap-3 min-[360px]:flex-row min-[360px]:justify-between">
              <div className="min-w-0">
                <p className="text-[12px] font-bold leading-snug text-white">
                  Complete your onboarding process and receive bonus points!
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/12">
                    <div className="h-full w-3/4 rounded-full bg-[#f5a83d]" />
                  </div>
                  <span className="text-[10px] font-black text-white/70">75%</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <img src={gemIcon} alt="Gem" className="h-4 w-4" />
                  <span className="text-[11px] font-black text-emerald-300">{userPoints.toLocaleString('en-US')} pts</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="shrink-0 rounded-full bg-white px-3.5 py-2 text-[11px] font-black text-black transition-colors hover:bg-gray-100"
              >
                Register
              </button>
            </div>
          </motion.div>
        )}

        {hasScratchOpportunity && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 overflow-hidden rounded-[1rem] border border-emerald-300/20 bg-emerald-300/[0.075] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_44px_rgba(0,0,0,0.32)] backdrop-blur-md"
          >
            <div className="flex min-w-0 flex-col items-start gap-3 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <motion.img
                  src={gemIcon}
                  alt=""
                  animate={{ y: [0, -3, 0], scale: [1, 1.08, 1] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="mt-0.5 h-7 w-7 shrink-0 drop-shadow-[0_0_14px_rgba(134,255,166,0.55)]"
                />
                <div className="min-w-0">
                  <p className="text-[12px] font-black leading-snug text-white">
                    You have unlocked another scratch-and-win. Try your luck now.
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-emerald-100/62">
                    {availableScratchCredits} of {scratchCredits?.max || 5} scratch chance{availableScratchCredits === 1 ? '' : 's'} available.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/scratch-and-win')}
                className="shrink-0 rounded-full bg-white px-3.5 py-2 text-[11px] font-black text-black transition-colors hover:bg-gray-100"
              >
                Back to Scratch
              </button>
            </div>
          </motion.div>
        )}

        {/* Profile Card */}
        <motion.section
          layout
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative mb-5 overflow-hidden rounded-[1.7rem] border border-white/10 bg-gradient-to-b from-[#242629] via-[#1b1d20] to-[#17191c] px-3 pb-2.5 pt-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_80px_rgba(0,0,0,0.42)]"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.08),transparent_28%)]" />
          <div className="pointer-events-none absolute -left-16 top-20 h-36 w-36 rounded-full bg-white/[0.04] blur-3xl" />
          <button
            type="button"
            onClick={() => {
              logoutUser();
              navigate('/login');
            }}
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:bg-white/14 hover:text-white"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>

          <div className="relative mx-auto mb-3 flex max-w-[260px] items-start justify-center">
            <button
              type="button"
              onClick={() => navigate('/chat-list')}
              className="absolute left-0 top-8 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:bg-white/14 hover:text-white"
              aria-label="Messages"
            >
              <MessageCircle className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowPhotoEditModal(true)}
              className="relative flex h-[82px] w-[82px] items-center justify-center rounded-full bg-gradient-to-b from-[#ffd23f] via-[#ff8d25] to-[#ef3d28] p-[3px] shadow-[0_0_24px_rgba(255,145,30,0.36)]"
              aria-label="Edit profile photo"
            >
              <span className="h-full w-full overflow-hidden rounded-full border-[3px] border-[#202124] bg-[#2d3035]">
                {userPhoto ? (
                  <img src={userPhoto} alt={userName} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xl font-black text-white/70">
                    {userInitials}
                  </span>
                )}
              </span>
              <span className="absolute bottom-0 rounded-full bg-[#7f3b20]/95 px-2.5 py-0.5 text-[10px] font-black text-[#ffd060] shadow-[0_4px_10px_rgba(0,0,0,0.32)]">
                Rookie
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="absolute right-0 top-8 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:bg-white/16 hover:text-white"
              aria-label="Profile options"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          <div className="relative mb-2 flex items-center justify-center gap-2">
            {compactProfileActions.map((action) => (
              <button
                key={action.label}
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/75"
                aria-label={action.label}
              >
                {action.icon}
              </button>
            ))}
            <span className="pl-1 text-xs font-black text-white/80">+8</span>
          </div>

          <div className="relative flex items-center justify-center gap-2">
            <span className="max-w-[140px] truncate text-sm font-black text-white">{userName}</span>
            <img src={gemIcon} alt="Gem" className="h-5 w-5 drop-shadow-[0_0_12px_rgba(134,255,166,0.55)]" />
            <span className="text-sm font-black text-[#8ff0a8]">{userPoints}</span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/20 text-[10px] font-black text-white/55">
              i
            </span>
          </div>

          <div className="relative mt-2 flex justify-center">
            <span className="max-w-[170px] truncate rounded-full bg-white/8 px-3 py-1 text-xs font-bold text-white/38">
              {userHandle}
            </span>
          </div>

          {isAdmin && (
            <div className="relative mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => navigate('/admin-panel')}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.075] px-4 py-2 text-xs font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_26px_rgba(0,0,0,0.18)] transition-colors hover:bg-white/[0.12]"
              >
                <Shield className="h-3.5 w-3.5 text-emerald-200" />
                Admin Panel
              </button>
            </div>
          )}

          <div className="relative mt-4 grid grid-cols-[repeat(3,minmax(0,1fr))] gap-1.5">
            {profileStats.map((stat) => (
              <button
                key={stat.label}
                type="button"
                className="min-h-[76px] min-w-0 rounded-[1rem] border border-white/12 bg-white/[0.095] px-2.5 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] min-[390px]:px-3"
              >
                <span className="mb-1 flex min-w-0 items-center gap-1.5 text-sm font-black text-white">
                  <span className="min-w-0 truncate">{stat.value}</span>
                  <span className="text-white/52">{stat.icon}</span>
                </span>
                <span className="block truncate text-[10px] font-bold text-white/50 min-[390px]:text-[11px]">{stat.label}</span>
              </button>
            ))}
          </div>
        </motion.section>

          {/* Tab Navigation */}
          <div className="mb-5 grid grid-cols-[repeat(4,minmax(0,1fr))] rounded-full border border-white/10 bg-[#101215]/95 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_32px_rgba(0,0,0,0.22)]">
            <button
              onClick={() => setActiveTab('network')}
              className={`min-w-0 truncate rounded-full px-1 py-2.5 text-[11px] font-semibold transition-colors min-[390px]:text-xs ${
                activeTab === 'network'
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Network
            </button>
            <button
              onClick={() => navigate('/team-view')}
              className="min-w-0 truncate rounded-full px-1 py-2.5 text-[11px] font-semibold text-white/70 transition-colors hover:text-white min-[390px]:text-xs"
            >
              Team
            </button>
            <button
              onClick={() => navigate('/winnings')}
              className="min-w-0 truncate rounded-full px-1 py-2.5 text-[11px] font-semibold text-white/70 transition-colors hover:text-white min-[390px]:text-xs"
            >
              Winnings
            </button>
            <button
              onClick={() => navigate('/gameplay')}
              className={`min-w-0 truncate rounded-full px-1 py-2.5 text-[11px] font-semibold transition-colors min-[390px]:text-xs ${
                activeTab === 'gameplay'
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Gameplay
            </button>
          </div>

        {/* Network */}
        {activeTab === 'network' && (
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="space-y-6 pb-2"
          >
            <div className="relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-gradient-to-r from-[#24272c]/98 to-[#171b1f]/98 px-6 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_16px_44px_rgba(0,0,0,0.34)]">
              <div className="absolute right-5 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-emerald-300/16 blur-2xl" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="mb-1 text-sm font-bold text-white/46">Networking Points</p>
                  <p className="text-2xl font-black text-white">{displayNetworkingPoints} pts</p>
                </div>
                <motion.div
                  animate={{ y: [0, -6, 0], scale: [1, 1.04, 1] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative flex h-[74px] w-[74px] items-center justify-center"
                >
                  <motion.span
                    className="absolute h-[74px] w-[74px] rounded-full bg-emerald-300/24 blur-xl"
                    animate={{ opacity: [0.38, 0.72, 0.38], scale: [0.86, 1.08, 0.86] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <img src={gemIcon} alt="Gem" className="relative h-[74px] w-[74px] drop-shadow-[0_0_28px_rgba(134,255,166,0.62)]" />
                </motion.div>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center">
                <h3 className="text-xl font-black tracking-tight text-white">My Network</h3>
              </div>
              <div className="space-y-2 rounded-[1.35rem] bg-[#151624]/80 p-0 shadow-[0_18px_50px_rgba(0,0,0,0.26)]">
                {myNetworkProfiles.map(renderNetworkProfileRow)}
              </div>
            </div>

            {peopleYouMayKnowGroups.map((profiles, groupIndex) => (
              <div key={`people-you-may-know-${groupIndex}`}>
                <div className="mb-3 flex items-center">
                  <h3 className="text-xl font-black tracking-tight text-white">People You May Know</h3>
                </div>
                <div className="space-y-2">
                  {profiles.map(renderNetworkProfileRow)}
                </div>
              </div>
            ))}
          </motion.section>
        )}

        {/* Invited Team Tab */}
        {activeTab === 'invited-team' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white text-lg font-bold">Invited Teams</h3>
              <button
                onClick={() => setShowCreateTeamModal(true)}
                className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 hover:from-purple-700 hover:to-violet-700 transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" />
                Create Team
              </button>
            </div>

            {invitedTeams.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No invited teams yet</p>
                <p className="text-gray-500 text-sm mb-6">Create your first team and start inviting members!</p>
                <button
                  onClick={() => setShowCreateTeamModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-violet-600 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:from-purple-700 hover:to-violet-700 transition-all shadow-lg mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Team
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {invitedTeams.map((team, teamIndex) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: teamIndex * 0.1 }}
                    className="bg-gradient-to-br from-[#1a1d2e] to-[#0f1318] rounded-2xl p-5 border border-white/5"
                  >
                    {/* Team Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-white font-bold text-lg">{team.name}</h4>
                        <p className="text-gray-400 text-xs mt-1">
                          Created {new Date(team.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedTeamForInvite(team.id);
                            setShowAddMemberModal(true);
                          }}
                          className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center hover:bg-purple-700 transition-colors"
                        >
                          <UserPlus className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => {
                            setTeamToDelete(team);
                          }}
                          className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* Accepted Members */}
                    {team.members.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-emerald-400 text-sm font-semibold mb-2 flex items-center gap-2">
                          <Check className="w-4 h-4" />
                          Accepted Members ({team.members.length})
                        </h5>
                        <div className="space-y-2">
                          {team.members.map((member) => (
                            <div
                              key={member.id}
                              className="bg-[#2a2d3e] rounded-xl p-3 flex items-center gap-3"
                            >
                              {member.avatar ? (
                                <img
                                  src={member.avatar}
                                  alt={member.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {member.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div className="flex-1">
                                <p className="text-white text-sm font-medium">{member.name}</p>
                                {member.email && (
                                  <p className="text-gray-400 text-xs">{member.email}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-white text-sm font-bold">{member.points}</span>
                                <img src={gemIcon} alt="Gem" className="w-4 h-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pending Invitations */}
                    {team.pendingInvites.length > 0 && (
                      <div>
                        <h5 className="text-yellow-400 text-sm font-semibold mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Pending Invitations ({team.pendingInvites.length})
                        </h5>
                        <div className="space-y-2">
                          {team.pendingInvites.map((invite) => (
                            <div
                              key={invite.id}
                              className="bg-[#2a2d3e]/50 rounded-xl p-3 flex items-center gap-3 border border-yellow-500/20"
                            >
                              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center border-2 border-yellow-500/50">
                                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-300 text-sm">{invite.email}</p>
                                <p className="text-gray-500 text-xs">
                                  Sent {new Date(invite.sentAt).toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                onClick={() => handleRemoveInvite(team.id, invite.id)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {team.members.length === 0 && team.pendingInvites.length === 0 && (
                      <div className="text-center py-6">
                        <p className="text-gray-500 text-sm">No members yet</p>
                        <p className="text-gray-600 text-xs mt-1">Start inviting people!</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Profile Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl p-6 mb-4 border border-white/10"
            >
              <div className="flex items-center gap-4 mb-4">
                {userPhoto ? (
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20">
                    <img 
                      src={userPhoto} 
                      alt={userName} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-white text-xl font-bold">{userName}</h2>
                  <p className="text-gray-400 text-sm flex items-center gap-1.5 mt-1">
                    <Mail className="w-3.5 h-3.5" />
                    {userEmail}
                  </p>
                </div>
              </div>
              
              {memberSince && (
                <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-3 pt-3 border-t border-white/10">
                  <Calendar className="w-3.5 h-3.5" />
                  Member since {new Date(memberSince).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              )}
            </motion.div>

            {/* User Interests */}
            {userInterests && userInterests.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl p-6 mb-4 border border-white/10"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-pink-400" />
                  <h3 className="text-white text-lg font-semibold">Interests</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {userInterests.map((interest, idx) => (
                    <span 
                      key={idx}
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white text-sm capitalize"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Investment Profile */}
            {investmentProfile && investmentProfile !== 'Not set' && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.18, duration: 0.5 }}
                className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl p-6 mb-4 border border-white/10"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-blue-400" />
                  <h3 className="text-white text-lg font-semibold">Investment Profile</h3>
                </div>
                <p className="text-gray-300 text-base capitalize">{investmentProfile}</p>
              </motion.div>
            )}

            {/* Points & Rewards Summary */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="grid grid-cols-2 gap-4 mb-4"
            >
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <motion.div 
                    className="w-11 h-11 relative"
                    animate={{ 
                      y: [0, -4, 0],
                      rotate: [0, 3, -3, 0],
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="absolute inset-0 bg-emerald-400 rounded-lg blur-lg opacity-60" />
                    <img 
                      src={gemIcon} 
                      alt="Gem" 
                      className="relative w-full h-full object-contain"
                    />
                  </motion.div>
                </div>
                <p className="text-white text-2xl font-bold mb-1">{userPoints}</p>
                <p className="text-gray-400 text-xs">Total Points</p>
              </div>

              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-xl p-5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-8 h-8 text-yellow-400" />
                </div>
                <p className="text-white text-2xl font-bold mb-1">02</p>
                <p className="text-gray-400 text-xs">Current Level</p>
              </div>
            </motion.div>

            {/* Menu Options */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="space-y-3 mb-4"
            >
              <button
                onClick={() => navigate('/rewards')}
                className="w-full bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center justify-between hover:bg-white/15 transition-all"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span className="text-white font-medium">Rewards & Progress</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => navigate('/onboarding-interests')}
                className="w-full bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center justify-between hover:bg-white/15 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium">Update Interests</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => navigate('/share-invites')}
                className="w-full bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-md rounded-xl p-4 border border-emerald-500/30 flex items-center justify-between hover:bg-emerald-500/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-emerald-400" />
                  <div className="flex flex-col items-start">
                    <span className="text-white font-medium">Share Invites</span>
                    <span className="text-emerald-400 text-xs">Earn 5 pts per invite</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>

              <button
                onClick={() => navigate('/groups')}
                className="w-full bg-gradient-to-br from-purple-500/10 to-violet-500/10 backdrop-blur-md rounded-xl p-4 border border-purple-500/30 flex items-center justify-between hover:bg-purple-500/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-medium">Groups</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </motion.div>

            {/* Logout Button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <button
                onClick={() => {
                  logoutUser();
                  navigate('/login');
                }}
                className="w-full bg-red-500/10 border border-red-500/30 text-red-400 py-3.5 rounded-full font-semibold text-base hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </motion.div>
          </motion.div>
        )}

      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-[#2a2d3e] to-[#1a1d2e] rounded-3xl p-8 w-full max-w-sm border border-white/10 shadow-2xl"
            >
              <h3 className="text-white text-2xl font-bold mb-3 text-center">Invite friends</h3>
              <p className="text-gray-400 text-sm mb-6 text-center">
                Copy link to invite your friends<br />and form a team
              </p>

              {/* Link Box */}
              <div className="bg-[#1a1d2e] rounded-2xl p-4 mb-6 flex items-center gap-3 border border-white/5">
                <LinkIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
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

              {/* Close Button */}
              <button
                onClick={() => setShowInviteModal(false)}
                className="w-full bg-white text-black py-4 rounded-full font-bold text-base hover:bg-gray-100 transition-colors shadow-lg"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && memberToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-[#2a2d3e] to-[#1a1d2e] rounded-3xl p-8 w-full max-w-sm border border-white/10 shadow-2xl relative"
            >
              {/* Close X button */}
              <button
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-white text-2xl font-bold mb-4 text-center">Are you sure?</h3>
              <p className="text-gray-400 text-sm mb-8 text-center">
                {memberToDelete.name} will no longer be a member<br />of this group. Continue?
              </p>

              {/* Delete Button */}
              <button
                onClick={handleConfirmDelete}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-full font-bold text-base hover:from-red-600 hover:to-red-700 transition-colors shadow-lg"
              >
                Delete member
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddMemberModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowAddMemberModal(false);
              setSelectedTeamForInvite(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-[#2a2d3e] to-[#1a1d2e] rounded-3xl p-8 w-full max-w-sm border border-white/10 shadow-2xl"
            >
              <h3 className="text-white text-2xl font-bold mb-3 text-center">Invite Member</h3>
              <p className="text-gray-400 text-sm mb-6 text-center">
                Enter an email address to invite
              </p>

              {/* Input */}
              <input
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-[#1a1d2e] text-white px-4 py-3 rounded-xl outline-none border border-white/5 focus:border-purple-500/50 transition-colors mb-6"
              />

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setNewMemberEmail('');
                    setShowAddMemberModal(false);
                    setSelectedTeamForInvite(null);
                  }}
                  className="flex-1 bg-white/10 text-white py-3 rounded-full font-semibold hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMember}
                  disabled={!newMemberEmail.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3 rounded-full font-bold hover:from-purple-700 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send Invite
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Team Modal */}
      <AnimatePresence>
        {teamToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setTeamToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-[#2a2d3e] to-[#1a1d2e] rounded-3xl p-8 w-full max-w-sm border border-white/10 shadow-2xl relative"
            >
              {/* Close X button */}
              <button
                onClick={() => setTeamToDelete(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-white text-2xl font-bold mb-4 text-center">Delete Team?</h3>
              <p className="text-gray-400 text-sm mb-8 text-center">
                Are you sure you want to delete <span className="text-white font-semibold">"{teamToDelete.name}"</span>?<br />
                This action cannot be undone.
              </p>

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteTeam(teamToDelete.id)}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-full font-bold text-base hover:from-red-600 hover:to-red-700 transition-colors shadow-lg"
              >
                Delete Team
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Edit Modal */}
      <AnimatePresence>
        {showPhotoEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPhotoEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-[#2a2d3e] to-[#1a1d2e] rounded-3xl p-8 w-full max-w-sm border border-white/10 shadow-2xl"
            >
              <h3 className="text-white text-2xl font-bold mb-3 text-center">Edit Profile Photo</h3>
              <p className="text-gray-400 text-sm mb-6 text-center">
                Change your profile photo
              </p>

              {/* Current Photo */}
              <div className="flex justify-center mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20">
                  {userPhoto ? (
                    <img 
                      src={userPhoto} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <User className="w-16 h-16 text-white" />
                    </div>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => {
                    setShowPhotoEditModal(false);
                    navigate('/personalize-photo');
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3 rounded-full font-semibold hover:from-purple-700 hover:to-violet-700 transition-all"
                >
                  Choose Avatar
                </button>
                <button
                  onClick={() => {
                    // In a real app, this would open file picker
                    alert('Photo upload feature coming soon!');
                  }}
                  className="w-full bg-white/10 text-white py-3 rounded-full font-semibold hover:bg-white/20 transition-colors"
                >
                  Upload Photo
                </button>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowPhotoEditModal(false)}
                className="w-full bg-white/5 text-gray-400 py-3 rounded-full font-semibold hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Team Modal */}
      <AnimatePresence>
        {showCreateTeamModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCreateTeamModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-b from-[#2a2d3e] to-[#1a1d2e] rounded-3xl p-8 w-full max-w-sm border border-white/10 shadow-2xl"
            >
              <h3 className="text-white text-2xl font-bold mb-3 text-center">Create New Team</h3>
              <p className="text-gray-400 text-sm mb-6 text-center">
                Enter a name for your team
              </p>

              {/* Input */}
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Team name..."
                className="w-full bg-[#1a1d2e] text-white px-4 py-3 rounded-xl outline-none border border-white/5 focus:border-purple-500/50 transition-colors mb-6"
              />

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setNewTeamName('');
                    setShowCreateTeamModal(false);
                  }}
                  className="flex-1 bg-white/10 text-white py-3 rounded-full font-semibold hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTeam}
                  disabled={!newTeamName.trim()}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 text-white py-3 rounded-full font-bold hover:from-purple-700 hover:to-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Team
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
