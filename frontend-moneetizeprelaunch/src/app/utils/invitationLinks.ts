import { avatarImageMap } from './avatarUtils';
import { safeGetItem, safeSetItem } from './storage';

export interface InvitationContext {
  inviterId?: string;
  inviterName: string;
  inviterAvatar?: string;
  inviterInitials: string;
  mailchimpCampaignId?: string;
  mailchimpEmailId?: string;
  promptId?: string;
}

const INVITER_QUERY_KEYS = ['invited_by', 'inviter', 'inviter_name', 'referrer', 'referrer_name', 'from_name', 'user_name'];
const INVITER_ID_QUERY_KEYS = ['inviter_id', 'referrer_id', 'user_id'];
const INVITER_AVATAR_QUERY_KEYS = ['inviter_avatar', 'inviter_photo', 'avatar'];
const INVITER_INITIALS_QUERY_KEYS = ['inviter_initials', 'initials'];
const MAILCHIMP_CAMPAIGN_QUERY_KEYS = ['mc_cid', 'campaign_id', 'campaignId'];
const PROMPT_QUERY_KEYS = ['prompt_id', 'promptID', 'promptId'];

const DEFAULT_PROMPT_ID = 'mini_scratch_v1';

const safeParseJson = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const cleanInviteValue = (value: string | null | undefined, maxLength = 120) => {
  const cleaned = value?.trim();
  if (!cleaned || /\*\|.+\|\*/.test(cleaned)) return '';
  return cleaned.slice(0, maxLength);
};

const firstQueryValue = (params: URLSearchParams, keys: string[], maxLength = 120) => {
  for (const key of keys) {
    const value = cleanInviteValue(params.get(key), maxLength);
    if (value) return value;
  }

  return '';
};

const isShareableAvatarSource = (value: string) => {
  const source = value.trim();
  if (!source || source.length > 900) return false;
  if (source.startsWith('data:') || source.startsWith('blob:')) return false;

  return /^(https?:\/\/|\/)/.test(source);
};

export const getInviteInitials = (name: string) => {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return 'AF';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
};

const getOrCreateLocalInviterId = () => {
  const storedId = safeGetItem('moneetizeLocalInviterId');
  if (storedId) return storedId;

  const nextId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const localId = `guest-${nextId}`;
  safeSetItem('moneetizeLocalInviterId', localId);
  return localId;
};

const getStoredInviterName = () => {
  const profile = safeParseJson<Record<string, unknown>>(safeGetItem('userProfile'), {});
  const profileName = typeof profile.name === 'string' ? profile.name : '';
  const email = safeGetItem('user_email') || '';
  const emailName = email.includes('@') ? email.split('@')[0] : email;

  return (
    cleanInviteValue(safeGetItem('userName'), 60) ||
    cleanInviteValue(profileName, 60) ||
    cleanInviteValue(emailName, 60) ||
    'A friend'
  );
};

const getStoredInviterAvatar = () => {
  const uploadedPhoto =
    (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('userPhoto') : '') ||
    safeGetItem('userPhoto') ||
    '';

  if (isShareableAvatarSource(uploadedPhoto)) return uploadedPhoto;

  const selectedAvatar = safeGetItem('selectedAvatar') || '';
  const selectedAvatarSource = avatarImageMap[selectedAvatar] || selectedAvatar;

  return isShareableAvatarSource(selectedAvatarSource) ? selectedAvatarSource : '';
};

export const getCurrentInviterShareProfile = (): InvitationContext => {
  const inviterName = getStoredInviterName();
  const inviterAvatar = getStoredInviterAvatar();

  return {
    inviterId: safeGetItem('user_id') || getOrCreateLocalInviterId(),
    inviterName,
    inviterAvatar: inviterAvatar || undefined,
    inviterInitials: getInviteInitials(inviterName),
    promptId: DEFAULT_PROMPT_ID,
  };
};

export const buildInviteLink = (pathname = '/sign-up') => {
  const profile = getCurrentInviterShareProfile();
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://moneetize.com';
  const url = new URL(pathname, origin);

  if (profile.inviterId) url.searchParams.set('inviter_id', profile.inviterId);
  url.searchParams.set('invited_by', profile.inviterName);
  url.searchParams.set('inviter_initials', profile.inviterInitials);
  if (profile.inviterAvatar) url.searchParams.set('inviter_avatar', profile.inviterAvatar);
  url.searchParams.set('prompt_id', DEFAULT_PROMPT_ID);

  return url.toString();
};

export const resolveInvitationContext = (): InvitationContext => {
  const storedInviteName = safeGetItem('moneetizeInviteName') || '';
  const fallbackName = storedInviteName || 'A friend';

  if (typeof window === 'undefined') {
    return { inviterName: fallbackName, inviterInitials: getInviteInitials(fallbackName) };
  }

  const params = new URLSearchParams(window.location.search);
  const inviteNameFromUrl = firstQueryValue(params, INVITER_QUERY_KEYS, 60);
  const inviterIdFromUrl = firstQueryValue(params, INVITER_ID_QUERY_KEYS, 160);
  const inviterAvatarFromUrl = firstQueryValue(params, INVITER_AVATAR_QUERY_KEYS, 900);
  const inviterInitialsFromUrl = firstQueryValue(params, INVITER_INITIALS_QUERY_KEYS, 6);
  const mailchimpCampaignFromUrl = firstQueryValue(params, MAILCHIMP_CAMPAIGN_QUERY_KEYS, 120);
  const mailchimpEmailFromUrl = firstQueryValue(params, ['mc_eid'], 160);
  const promptIdFromUrl = firstQueryValue(params, PROMPT_QUERY_KEYS, 80);
  const inviterName = inviteNameFromUrl || fallbackName;
  const storedInviteAvatar = safeGetItem('moneetizeInviteAvatar') || '';
  const inviterAvatar =
    (isShareableAvatarSource(inviterAvatarFromUrl) ? inviterAvatarFromUrl : '') ||
    (isShareableAvatarSource(storedInviteAvatar) ? storedInviteAvatar : '');
  const inviterInitials =
    inviterInitialsFromUrl ||
    safeGetItem('moneetizeInviteInitials') ||
    getInviteInitials(inviterName);
  const inviterId = inviterIdFromUrl || safeGetItem('moneetizeInviteUserId') || '';
  const mailchimpCampaignId = mailchimpCampaignFromUrl || safeGetItem('moneetizeMailchimpCampaignId') || '';
  const mailchimpEmailId = mailchimpEmailFromUrl || safeGetItem('moneetizeMailchimpEmailId') || '';
  const promptId = promptIdFromUrl || safeGetItem('moneetizePromptId') || '';

  if (inviteNameFromUrl) safeSetItem('moneetizeInviteName', inviteNameFromUrl);
  if (inviterIdFromUrl) safeSetItem('moneetizeInviteUserId', inviterIdFromUrl);
  if (inviterAvatarFromUrl && isShareableAvatarSource(inviterAvatarFromUrl)) {
    safeSetItem('moneetizeInviteAvatar', inviterAvatarFromUrl);
  }
  if (inviterInitialsFromUrl) safeSetItem('moneetizeInviteInitials', inviterInitialsFromUrl);
  if (mailchimpCampaignFromUrl) safeSetItem('moneetizeMailchimpCampaignId', mailchimpCampaignFromUrl);
  if (mailchimpEmailFromUrl) safeSetItem('moneetizeMailchimpEmailId', mailchimpEmailFromUrl);
  if (promptIdFromUrl) safeSetItem('moneetizePromptId', promptIdFromUrl);

  return {
    inviterId: inviterId || undefined,
    inviterName,
    inviterAvatar: inviterAvatar || undefined,
    inviterInitials,
    mailchimpCampaignId: mailchimpCampaignId || undefined,
    mailchimpEmailId: mailchimpEmailId || undefined,
    promptId: promptId || undefined,
  };
};
