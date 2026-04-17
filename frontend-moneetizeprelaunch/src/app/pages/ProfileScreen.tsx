import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronUp, History, MessageCircle, MoreHorizontal, Share2, Settings, UserPlus, Plus, Trash2, Link as LinkIcon, Copy, Check, ChevronRight, User, Mail, Calendar, Heart, Target, Award, TrendingUp, Users, LogOut, X, Shield, ShoppingBag } from 'lucide-react';
import gemIcon from 'figma:asset/296d8aa06fd9c7e60192bc7368a4a032ec5bc17e.png';
import wildcardIcon from 'figma:asset/f632203f248e2d298246c5ffb0789bc0cac99ea5.png';
import tshirtRewardIcon from '../../assets/moneetize-tshirt-reward.png';
import { addUserPoints, getPointsHistory, getUserPoints, POINTS_UPDATED_EVENT } from '../utils/pointsManager';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { isUserAdmin, logoutUser } from '../services/authService';
import { getStoredScratchCredits, getStoredUsdtBalance, loadScratchProfile, type ScratchCredits, type ScratchDrawResult } from '../services/scratchService';
import { LOCAL_NETWORK_PROFILES_UPDATED_EVENT, loadNetworkFollowSnapshot, loadRecommendedFriends, saveNetworkFollowState, syncCurrentUserNetworkProfile, type RecommendedFriendProfile } from '../services/networkService';
import { clearProfilePhoto, getStoredProfileSettings, isStoredProfileComplete, notifyProfileSettingsUpdated, PROFILE_SETTINGS_STORAGE_KEYS, PROFILE_SETTINGS_UPDATED_EVENT, saveProfilePhoto, writeStoredProfileSettings } from '../utils/profileSettings';
import { resizeProfilePhoto } from '../utils/profilePhoto';
import { hydrateRemoteProfileSettings, saveRemoteProfileSettings } from '../services/profilePersistenceService';
import { loadChatPreviews } from '../services/chatService';
import { loadProfileNotifications, type NetworkNotification } from '../services/notificationService';

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
const NETWORK_FOLLOW_AWARDS_KEY = 'networkFollowPointAwards';
const NETWORK_VISIBLE_LIMIT = 5;

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

function getStoredNetworkFollowAwardState() {
  try {
    const storedState = safeGetItem(NETWORK_FOLLOW_AWARDS_KEY);
    const parsed = storedState ? JSON.parse(storedState) : {};
    return parsed && typeof parsed === 'object'
      ? parsed as { date?: string; points?: number; profiles?: Record<string, boolean> }
      : {};
  } catch {
    return {};
  }
}

function getLocalNetworkFollowPoints() {
  return Math.max(0, getPointsHistory().reduce((total, transaction) => {
    if (transaction.source !== 'network-follow') return total;
    return transaction.type === 'subtract'
      ? total - transaction.amount
      : total + transaction.amount;
  }, 0));
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function awardLocalNetworkFollowPoint(profileId: string) {
  const today = getTodayKey();
  const storedState = getStoredNetworkFollowAwardState();
  const isSameDay = storedState.date === today;
  const pointsToday = isSameDay ? Math.max(0, Number(storedState.points) || 0) : 0;
  const profiles = isSameDay && storedState.profiles ? storedState.profiles : {};

  if (pointsToday >= 3 || profiles[profileId]) return false;

  profiles[profileId] = true;
  safeSetItem(NETWORK_FOLLOW_AWARDS_KEY, JSON.stringify({
    date: today,
    points: pointsToday + 1,
    profiles,
  }));

  await addUserPoints(1, 'network-follow');
  return true;
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
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'network' | 'your-team' | 'invited-team' | 'winnings' | 'gameplay' | 'settings'>('network');
  const [userPoints, setUserPoints] = useState(0);
  const [networkPoints, setNetworkPoints] = useState(() => getLocalNetworkFollowPoints());
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
  const [photoEditMessage, setPhotoEditMessage] = useState('');
  const [hasUnreadChats, setHasUnreadChats] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showRewardHistory, setShowRewardHistory] = useState(false);
  const [showPointsInfo, setShowPointsInfo] = useState(false);
  const [relationshipModal, setRelationshipModal] = useState<'following' | 'followers' | null>(null);
  const [networkListExpanded, setNetworkListExpanded] = useState(false);
  const [scratchHistory, setScratchHistory] = useState<ScratchDrawResult[]>(() => getStoredScratchHistory());
  const [scratchCredits, setScratchCredits] = useState<ScratchCredits | null>(() => getStoredScratchCredits());
  const [isProfileComplete, setIsProfileComplete] = useState(() => isStoredProfileComplete());
  const [profileNotifications, setProfileNotifications] = useState<NetworkNotification[]>([]);
  const [activeProfileNotificationIndex, setActiveProfileNotificationIndex] = useState(0);
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

    void loadNetworkFollowSnapshot()
      .then((snapshot) => {
        if (!cancelled) {
          const nextStates = {
            ...defaultNetworkFollowStates,
            ...getStoredNetworkFollowStates(),
            ...snapshot.states,
          };
          safeSetItem(NETWORK_FOLLOW_STATES_KEY, JSON.stringify(nextStates));
          setNetworkFollowStates(nextStates);
          setNetworkPoints(snapshot.networkPointsTotal);
        }
      })
      .catch((error) => {
        console.warn('Network follows sync skipped:', error);
      });

    void loadProfileNotifications()
      .then((notifications) => {
        if (!cancelled) setProfileNotifications(notifications);
      })
      .catch((error) => {
        console.warn('Profile notifications sync skipped:', error);
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
      setNetworkPoints(getLocalNetworkFollowPoints());
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

  useEffect(() => {
    let cancelled = false;

    const refreshChatIndicator = () => {
      void loadChatPreviews('all')
        .then((chats) => {
          if (!cancelled) setHasUnreadChats(chats.some((chat) => (chat.unreadCount || 0) > 0));
        })
        .catch(() => {
          if (!cancelled) setHasUnreadChats(false);
        });
    };

    refreshChatIndicator();
    const timer = window.setInterval(refreshChatIndicator, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
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

  const handleChooseProfilePhoto = () => {
    setPhotoEditMessage('');
    photoInputRef.current?.click();
  };

  const handleProfilePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setPhotoEditMessage('Saving profile photo...');
      const photo = await resizeProfilePhoto(file);
      setUserPhoto(photo);
      saveProfilePhoto(photo);
      notifyProfileSettingsUpdated();
      syncCurrentUserNetworkProfile();

      try {
        const savedSettings = await saveRemoteProfileSettings({ photo });
        if (savedSettings) {
          writeStoredProfileSettings(savedSettings);
          setUserPhoto(getStoredProfileSettings({ fallbackName: userName, fallbackEmail: userEmail }).photo || photo);
          notifyProfileSettingsUpdated();
          syncCurrentUserNetworkProfile();
        }
        setPhotoEditMessage('Profile photo updated.');
      } catch (error) {
        console.warn('Remote profile photo sync skipped:', error);
        setPhotoEditMessage('Photo is ready locally. Tap Save Profile in Settings if it needs a retry.');
      }
    } catch (error) {
      console.error('Profile photo update failed:', error);
      setPhotoEditMessage(error instanceof Error ? error.message : 'Profile photo update failed.');
    } finally {
      event.target.value = '';
    }
  };

  const handleRemoveProfilePhoto = () => {
    setUserPhoto('');
    clearProfilePhoto();
    notifyProfileSettingsUpdated();
    syncCurrentUserNetworkProfile();
    setPhotoEditMessage('Profile photo removed.');
    void saveRemoteProfileSettings({ photo: '' }).catch((error) => {
      console.warn('Remote profile photo removal sync skipped:', error);
    });
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
    { label: 'Change profile photo', icon: <User className="h-3 w-3" />, onClick: () => setShowPhotoEditModal(true) },
    { label: 'Rewards', icon: <Award className="h-3 w-3" />, path: '/winnings' },
    { label: 'Team', icon: <Users className="h-3 w-3" />, path: '/team-view' },
    { label: 'Gameplay', icon: <History className="h-3 w-3" />, path: '/gameplay' },
    { label: 'Marketplace', icon: <ShoppingBag className="h-3 w-3" />, path: '/marketplace' },
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
  const followingCount = candidateNetworkProfiles.filter((profile) => isNetworkProfileFollowing(profile)).length;
  const followersCount = candidateNetworkProfiles.filter((profile) => profile.followsMe).length;
  const displayNetworkingPoints = networkPoints;
  const visibleMyNetworkProfiles = networkListExpanded ? myNetworkProfiles : myNetworkProfiles.slice(0, NETWORK_VISIBLE_LIMIT);
  const visiblePeopleYouMayKnowProfiles = networkListExpanded
    ? peopleYouMayKnowProfiles
    : peopleYouMayKnowProfiles.slice(0, NETWORK_VISIBLE_LIMIT);
  const hiddenNetworkProfileCount = Math.max(
    0,
    (myNetworkProfiles.length + peopleYouMayKnowProfiles.length) -
      (visibleMyNetworkProfiles.length + visiblePeopleYouMayKnowProfiles.length),
  );
  const relationshipProfiles = relationshipModal === 'following'
    ? candidateNetworkProfiles.filter((profile) => isNetworkProfileFollowing(profile))
    : relationshipModal === 'followers'
      ? candidateNetworkProfiles.filter((profile) => profile.followsMe)
      : [];

  const handleToggleNetworkFollow = (profile: NetworkProfile) => {
    if (profile.isCurrentUser) return;

    const isFollowing = isNetworkProfileFollowing(profile);
    const nextFollowing = !isFollowing;
    setNetworkFollowStates((states) => {
      const nextStates = {
        ...states,
        [profile.id]: nextFollowing,
      };
      safeSetItem(NETWORK_FOLLOW_STATES_KEY, JSON.stringify(nextStates));
      return nextStates;
    });

    if (nextFollowing && !safeGetItem('access_token')) {
      void awardLocalNetworkFollowPoint(profile.id).then(() => {
        setUserPoints(getUserPoints());
        setNetworkPoints(getLocalNetworkFollowPoints());
      });
    }

    void saveNetworkFollowState(profile.id, nextFollowing)
      .then(({ states: remoteStates, pointsAward, networkPointsTotal }) => {
        setNetworkFollowStates((states) => {
          const nextStates = {
            ...states,
            ...remoteStates,
          };
          safeSetItem(NETWORK_FOLLOW_STATES_KEY, JSON.stringify(nextStates));
          return nextStates;
        });
        if ((Number(pointsAward?.pointsAwarded) || 0) > 0) {
          setNetworkListExpanded(true);
        }
        setUserPoints(getUserPoints());
        setNetworkPoints(
          Number.isFinite(networkPointsTotal) && networkPointsTotal >= 0
            ? networkPointsTotal
            : getLocalNetworkFollowPoints()
        );
      })
      .catch((error) => {
        console.warn('Network follow save skipped:', error);
      });
  };

  const profileStats = [
    { label: 'USDT (Locked)', value: `$ ${displayBalance}`, icon: <Copy className="h-3 w-3" />, onClick: () => navigate('/winnings') },
    { label: 'Following', value: followingCount, icon: <ChevronUp className="h-3 w-3" />, onClick: () => setRelationshipModal('following') },
    { label: 'Followers', value: followersCount, icon: <ChevronUp className="h-3 w-3 rotate-180" />, onClick: () => setRelationshipModal('followers') },
  ];

  const notificationItems = [
    !isProfileComplete
      ? {
          id: 'register-profile',
          title: 'Complete your onboarding process and receive bonus points!',
          message: `${userPoints.toLocaleString('en-US')} pts`,
          actionLabel: 'Register',
          onAction: () => navigate('/settings'),
          tone: 'neutral',
        }
      : null,
    hasScratchOpportunity
      ? {
          id: 'scratch-unlocked',
          title: 'You have unlocked another scratch-and-win. Try your luck now.',
          message: `${availableScratchCredits} of ${scratchCredits?.max || 5} scratch chance${availableScratchCredits === 1 ? '' : 's'} available.`,
          actionLabel: 'Back to Scratch',
          onAction: () => navigate('/scratch-and-win'),
          tone: 'success',
        }
      : null,
    ...profileNotifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      imageUrl: notification.imageUrl,
      actionLabel: '',
      onAction: undefined,
      tone: 'broadcast',
    })),
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const activeNotificationIndex = notificationItems.length
    ? activeProfileNotificationIndex % notificationItems.length
    : 0;
  const activeNotification = notificationItems[activeNotificationIndex];
  const hasMultipleNotifications = notificationItems.length > 1;

  const moveProfileNotification = (direction: 1 | -1) => {
    if (!notificationItems.length) return;
    setActiveProfileNotificationIndex((index) => (
      (index + direction + notificationItems.length) % notificationItems.length
    ));
  };

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
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handleProfilePhotoChange}
        className="hidden"
      />
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
        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-5"
          >
            {hasMultipleNotifications && (
              <>
                <div className="absolute inset-x-3 top-2 h-full rounded-[1rem] border border-white/8 bg-white/[0.045] blur-[0.1px]" />
                <div className="absolute inset-x-6 top-4 h-full rounded-[1rem] border border-white/6 bg-white/[0.03]" />
              </>
            )}
            <div
              className={`relative overflow-hidden rounded-[1rem] border px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_44px_rgba(0,0,0,0.32)] backdrop-blur-md ${
                activeNotification.tone === 'success'
                  ? 'border-emerald-300/20 bg-emerald-300/[0.075]'
                  : 'border-white/10 bg-white/[0.075]'
              }`}
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
                      {activeNotification.title}
                    </p>
                    {activeNotification.message && (
                      <p className="mt-1 whitespace-pre-line text-[11px] font-bold text-white/62">
                        {activeNotification.message}
                      </p>
                    )}
                    {activeNotification.id === 'register-profile' && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/12">
                          <div className="h-full w-3/4 rounded-full bg-[#f5a83d]" />
                        </div>
                        <span className="text-[10px] font-black text-white/70">75%</span>
                      </div>
                    )}
                    {activeNotification.imageUrl && (
                      <img
                        src={activeNotification.imageUrl}
                        alt=""
                        className="mt-3 max-h-32 w-full rounded-[0.8rem] border border-white/8 object-cover"
                      />
                    )}
                    {hasMultipleNotifications && (
                      <p className="mt-2 text-[10px] font-black text-white/36">
                        {activeNotificationIndex + 1} of {notificationItems.length}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {hasMultipleNotifications && (
                    <>
                      <button
                        type="button"
                        onClick={() => moveProfileNotification(-1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white/78 transition-colors hover:bg-white/[0.14]"
                        aria-label="Previous notification"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveProfileNotification(1)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white/78 transition-colors hover:bg-white/[0.14]"
                        aria-label="Next notification"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  {activeNotification.actionLabel && activeNotification.onAction && (
                    <button
                      type="button"
                      onClick={activeNotification.onAction}
                      className="rounded-full bg-white px-3.5 py-2 text-[11px] font-black text-black transition-colors hover:bg-gray-100"
                    >
                      {activeNotification.actionLabel}
                    </button>
                  )}
                </div>
              </div>
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

          <div className="relative mx-auto mb-3 flex max-w-[286px] items-start justify-center">
            <button
              type="button"
              onClick={() => navigate('/chat-list')}
              className="absolute left-0 top-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:bg-white/14 hover:text-white"
              aria-label="Messages"
            >
              <MessageCircle className="h-4 w-4" />
              <span
                className={`absolute right-2 top-2 h-3.5 w-3.5 rounded-full border-2 border-[#202124] ${
                  hasUnreadChats ? 'bg-[#ff4d55] shadow-[0_0_12px_rgba(255,77,85,0.75)]' : 'bg-[#5dea86] shadow-[0_0_12px_rgba(93,234,134,0.58)]'
                }`}
                aria-hidden="true"
              />
            </button>

            <button
              type="button"
              onClick={() => setShowPhotoEditModal(true)}
              className="relative flex h-[96px] w-[96px] items-center justify-center rounded-full bg-gradient-to-b from-[#ffd23f] via-[#ff8d25] to-[#ef3d28] p-[3px] shadow-[0_0_28px_rgba(255,145,30,0.38)]"
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
              className="absolute right-0 top-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-colors hover:bg-white/16 hover:text-white"
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
                onClick={() => action.onClick ? action.onClick() : action.path && navigate(action.path)}
                className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/75 transition-colors hover:bg-white/16 hover:text-white"
                aria-label={action.label}
              >
                {action.icon}
              </button>
            ))}
          </div>

          <div className="relative flex items-center justify-center gap-2">
            <span className="max-w-[140px] truncate text-sm font-black text-white">{userName}</span>
            <img src={gemIcon} alt="Gem" className="h-5 w-5 drop-shadow-[0_0_12px_rgba(134,255,166,0.55)]" />
            <span className="text-sm font-black text-[#8ff0a8]">{userPoints}</span>
            <button
              type="button"
              onClick={() => setShowPointsInfo(true)}
              className="flex h-4 w-4 items-center justify-center rounded-full border border-white/20 text-[10px] font-black text-white/55 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="What points mean"
            >
              i
            </button>
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
                onClick={stat.onClick}
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
                  className="relative flex h-[74px] w-[74px] items-center justify-center overflow-visible"
                >
                  <motion.span
                    className="absolute h-[74px] w-[74px] rounded-full bg-emerald-300/24 blur-xl"
                    animate={{ opacity: [0.38, 0.72, 0.38], scale: [0.86, 1.08, 0.86] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <img src={gemIcon} alt="Gem" className="relative h-[56px] w-[56px] drop-shadow-[0_0_28px_rgba(134,255,166,0.62)]" />
                </motion.div>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center">
                <h3 className="text-xl font-black tracking-tight text-white">My Network</h3>
              </div>
              <div className="space-y-2 rounded-[1.35rem] bg-[#151624]/80 p-0 shadow-[0_18px_50px_rgba(0,0,0,0.26)]">
                {visibleMyNetworkProfiles.map(renderNetworkProfileRow)}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-xl font-black tracking-tight text-white">People You May Know</h3>
              </div>
              <div className="space-y-2">
                {visiblePeopleYouMayKnowProfiles.map(renderNetworkProfileRow)}
              </div>
              {hiddenNetworkProfileCount > 0 && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setNetworkListExpanded((expanded) => !expanded)}
                    className="flex h-10 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white/80 shadow-[0_12px_30px_rgba(0,0,0,0.28)] transition-colors hover:bg-white/[0.14] hover:text-white"
                    aria-label={networkListExpanded ? 'Collapse network list' : 'Expand network list'}
                  >
                    <ChevronUp className={`h-5 w-5 transition-transform ${networkListExpanded ? '' : 'rotate-180'}`} />
                  </button>
                </div>
              )}
            </div>
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

      {/* Points Info Modal */}
      <AnimatePresence>
        {showPointsInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setShowPointsInfo(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-sm rounded-[1.4rem] border border-white/10 bg-gradient-to-b from-[#22262b] to-[#121519] p-6 text-center shadow-2xl"
            >
              <img src={gemIcon} alt="" className="mx-auto mb-3 h-12 w-12 drop-shadow-[0_0_20px_rgba(134,255,166,0.58)]" />
              <h3 className="text-xl font-black text-white">What Points Mean</h3>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-white/62">
                Points track your pre-launch progress. You earn them by scratching, activating rewards, following members, completing gameplay tasks, and inviting friends who join.
              </p>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-white/62">
                Following members earns 1 point per follow, up to 3 points per day.
              </p>
              <button
                type="button"
                onClick={() => setShowPointsInfo(false)}
                className="mt-6 w-full rounded-full bg-white px-5 py-3 text-sm font-black text-black transition-colors hover:bg-gray-100"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Following / Followers Modal */}
      <AnimatePresence>
        {relationshipModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setRelationshipModal(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-sm rounded-[1.4rem] border border-white/10 bg-gradient-to-b from-[#22262b] to-[#121519] p-5 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-black text-white">
                  {relationshipModal === 'following' ? 'Following' : 'Followers'}
                </h3>
                <button
                  type="button"
                  onClick={() => setRelationshipModal(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/70 transition-colors hover:bg-white/14 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {relationshipProfiles.length ? relationshipProfiles.map((profile) => (
                  <div key={profile.id} className="flex min-h-[56px] items-center gap-3 rounded-[1rem] border border-white/8 bg-white/[0.06] px-3 py-2">
                    <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/10">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt={profile.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xs font-black text-white/48">
                          {profile.name.charAt(0)}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-white">{profile.name}</span>
                      {profile.handle && <span className="block truncate text-xs font-bold text-white/42">{profile.handle}</span>}
                    </span>
                  </div>
                )) : (
                  <p className="rounded-[1rem] border border-white/8 bg-white/[0.04] px-4 py-5 text-center text-sm font-semibold text-white/52">
                    No profiles here yet.
                  </p>
                )}
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
            onClick={() => setShowPhotoEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[340px] overflow-hidden rounded-[1.55rem] border border-white/10 bg-gradient-to-b from-[#24272c]/98 via-[#191c20]/98 to-[#111315]/98 px-5 pb-5 pt-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_80px_rgba(0,0,0,0.58)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(126,234,145,0.12),transparent_40%)]" />
              <button
                type="button"
                onClick={() => setShowPhotoEditModal(false)}
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] text-white/70 transition-colors hover:bg-white/[0.14] hover:text-white"
                aria-label="Close photo editor"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative">
                <h3 className="mb-2 text-center text-xl font-black text-white">Edit Profile Photo</h3>
                <p className="mx-auto mb-6 max-w-[230px] text-center text-xs font-bold leading-relaxed text-white/48">
                  Update your profile image or switch back to your initials.
                </p>

                <div className="mb-6 flex justify-center">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-gradient-to-b from-[#ffd23f] via-[#ff8d25] to-[#ef3d28] p-[3px] shadow-[0_0_30px_rgba(255,145,30,0.34)]">
                  <div className="h-full w-full overflow-hidden rounded-full border-[3px] border-[#202124] bg-[#2d3035]">
                  {userPhoto ? (
                    <img src={userPhoto} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-2xl font-black text-white/72">
                      {userInitials}
                    </span>
                  )}
                  </div>
                </div>
              </div>

              {photoEditMessage && (
                <p className="mb-4 rounded-2xl border border-emerald-300/18 bg-emerald-300/[0.08] px-3 py-2 text-center text-xs font-bold text-emerald-100/86">
                  {photoEditMessage}
                </p>
              )}

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleChooseProfilePhoto}
                  className="w-full rounded-full bg-white px-5 py-3.5 text-sm font-black text-black shadow-[0_16px_38px_rgba(0,0,0,0.34)] transition-colors hover:bg-gray-100"
                >
                  Upload Photo
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPhotoEditModal(false);
                    navigate('/settings?view=agent');
                  }}
                  className="w-full rounded-full border border-white/10 bg-white/[0.08] px-5 py-3.5 text-sm font-black text-white transition-colors hover:bg-white/[0.14]"
                >
                  Change AI Avatar
                </button>
                {userPhoto && (
                  <button
                    type="button"
                    onClick={handleRemoveProfilePhoto}
                    className="w-full rounded-full border border-red-300/20 bg-red-500/[0.08] px-5 py-3 text-sm font-black text-red-100 transition-colors hover:bg-red-500/[0.14]"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
              </div>
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
