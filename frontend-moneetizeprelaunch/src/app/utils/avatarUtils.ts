import aiBubble from 'figma:asset/36fff8878cf3ea6d1ef44d3f08bbc2346c733ebc.png';
import greenMorphicBall from 'figma:asset/8fd559d05db8d67dee13e79dc6418365220fd613.png';
import { safeGetItem } from './storage';

export type AgentAvatarTone = {
  accent: string;
  glow: string;
  gradientClass: string;
  borderClass: string;
  imageClass: string;
};

export type AgentAvatarVisual = AgentAvatarTone & {
  id: string;
  image?: string;
  background?: string;
};

function looksLikeImageSource(value: string) {
  return /^(https?:|data:|blob:|\/|figma:asset\/)/.test(value);
}

// Avatar image mapping
export const avatarImageMap: Record<string, string> = {
  blueAvatar: aiBubble,
  greenAvatar: greenMorphicBall,
  mazeAvatar: aiBubble,
  latticeAvatar: aiBubble,
  vortexAvatar: aiBubble,
  weaveAvatar: greenMorphicBall,
  bloomAvatar: greenMorphicBall,
  sandAvatar: aiBubble,
  crystalAvatar: greenMorphicBall,
  purpleAvatar: aiBubble,
  orangeAvatar: aiBubble,
  redAvatar: aiBubble,
  tealAvatar: 'https://images.unsplash.com/photo-1588972368504-30542aa0c815?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob2xvZ3JhcGhpYyUyMGJ1YmJsZSUyMHRlYWwlMjBhcXVhJTIwaXJpZGVzY2VudCUyMG9yYnxlbnwxfHx8fDE3NzI1Nzc0NjV8MA&ixlib=rb-4.1.0&q=80&w=1080',
  aquaAvatar: 'https://images.unsplash.com/photo-1588972368504-30542aa0c815?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob2xvZ3JhcGhpYyUyMGJ1YmJsZSUyMHRlYWwlMjBhcXVhJTIwaXJpZGVzY2VudCUyMG9yYnxlbnwxfHx8fDE3NzI1Nzc0NjV8MA&ixlib=rb-4.1.0&q=80&w=1080',
};

export const avatarVisualMap: Record<string, AgentAvatarVisual> = {
  blueAvatar: {
    id: 'blueAvatar',
    image: aiBubble,
    accent: '#9b87f5',
    glow: 'rgba(139, 116, 246, 0.54)',
    gradientClass: 'from-purple-400 via-blue-500 to-cyan-400',
    borderClass: 'border-purple-500 hover:border-purple-400',
    imageClass: '',
  },
  greenAvatar: {
    id: 'greenAvatar',
    image: greenMorphicBall,
    accent: '#10b981',
    glow: 'rgba(16, 185, 129, 0.5)',
    gradientClass: 'from-green-400 via-emerald-500 to-lime-400',
    borderClass: 'border-emerald-400 hover:border-emerald-300',
    imageClass: '',
  },
  mazeAvatar: {
    id: 'mazeAvatar',
    accent: '#8b8f98',
    glow: 'rgba(169, 172, 180, 0.36)',
    gradientClass: 'from-zinc-300 via-zinc-500 to-neutral-800',
    borderClass: 'border-zinc-300 hover:border-zinc-100',
    imageClass: '',
    background:
      'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2), rgba(40,43,48,0.08) 34%, rgba(6,7,8,0.96) 72%), repeating-conic-gradient(from 45deg, rgba(230,230,230,0.55) 0deg 9deg, rgba(12,13,14,0.95) 9deg 18deg)',
  },
  latticeAvatar: {
    id: 'latticeAvatar',
    accent: '#a6a6a6',
    glow: 'rgba(190, 190, 190, 0.34)',
    gradientClass: 'from-white via-zinc-400 to-neutral-700',
    borderClass: 'border-zinc-200 hover:border-white',
    imageClass: '',
    background:
      'radial-gradient(circle at 52% 48%, rgba(255,255,255,0.25), rgba(95,97,102,0.22) 28%, rgba(10,11,12,0.96) 74%), repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.42) 0 3px, rgba(0,0,0,0.68) 3px 8px)',
  },
  vortexAvatar: {
    id: 'vortexAvatar',
    image: aiBubble,
    accent: '#4664f0',
    glow: 'rgba(78, 97, 242, 0.45)',
    gradientClass: 'from-blue-300 via-indigo-500 to-cyan-300',
    borderClass: 'border-blue-400 hover:border-cyan-300',
    imageClass: 'hue-rotate-[70deg] saturate-150 contrast-125',
  },
  weaveAvatar: {
    id: 'weaveAvatar',
    accent: '#72c7a2',
    glow: 'rgba(114, 199, 162, 0.42)',
    gradientClass: 'from-emerald-200 via-teal-400 to-indigo-500',
    borderClass: 'border-teal-300 hover:border-emerald-200',
    imageClass: '',
    background:
      'radial-gradient(circle at 42% 35%, rgba(119,255,188,0.7), transparent 23%), radial-gradient(circle at 66% 58%, rgba(92,111,255,0.46), transparent 26%), repeating-linear-gradient(150deg, rgba(120,255,183,0.32) 0 3px, rgba(32,43,50,0.8) 3px 7px), #151a1c',
  },
  bloomAvatar: {
    id: 'bloomAvatar',
    image: greenMorphicBall,
    accent: '#4fbf87',
    glow: 'rgba(79, 191, 135, 0.42)',
    gradientClass: 'from-lime-200 via-emerald-400 to-sky-400',
    borderClass: 'border-emerald-300 hover:border-lime-200',
    imageClass: 'hue-rotate-[35deg] saturate-125 contrast-110',
  },
  sandAvatar: {
    id: 'sandAvatar',
    image: aiBubble,
    accent: '#9c7d68',
    glow: 'rgba(156, 125, 104, 0.4)',
    gradientClass: 'from-stone-200 via-rose-300 to-sky-300',
    borderClass: 'border-stone-300 hover:border-white',
    imageClass: 'hue-rotate-[145deg] saturate-90 contrast-125',
  },
  crystalAvatar: {
    id: 'crystalAvatar',
    image: greenMorphicBall,
    accent: '#7fb8b7',
    glow: 'rgba(127, 184, 183, 0.4)',
    gradientClass: 'from-cyan-100 via-teal-300 to-fuchsia-300',
    borderClass: 'border-cyan-200 hover:border-white',
    imageClass: 'hue-rotate-[300deg] saturate-125 brightness-110',
  },
};

export const avatarToneMap: Record<string, AgentAvatarTone> = avatarVisualMap;

export function getAgentAvatarVisual(selectedAvatarOverride?: string): AgentAvatarVisual {
  const selectedAvatar = selectedAvatarOverride || safeGetItem('selectedAvatar') || 'blueAvatar';
  if (avatarVisualMap[selectedAvatar]) return avatarVisualMap[selectedAvatar];
  if (avatarImageMap[selectedAvatar]) {
    return {
      ...avatarVisualMap.blueAvatar,
      id: selectedAvatar,
      image: avatarImageMap[selectedAvatar],
    };
  }
  if (looksLikeImageSource(selectedAvatar)) {
    return {
      ...avatarVisualMap.blueAvatar,
      id: 'customAvatar',
      image: selectedAvatar,
    };
  }

  return avatarVisualMap.blueAvatar;
}

/**
 * Get the currently selected avatar image URL from localStorage
 * @returns The image URL of the selected avatar, or the default blue avatar
 */
export function getSelectedAvatarImage(selectedAvatarOverride?: string): string {
  return getAgentAvatarVisual(selectedAvatarOverride).image || aiBubble;
}

export function getAgentAvatarTone(selectedAvatarOverride?: string): AgentAvatarTone {
  return getAgentAvatarVisual(selectedAvatarOverride);
}
