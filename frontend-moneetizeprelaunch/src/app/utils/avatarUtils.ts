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

export const avatarToneMap: Record<string, AgentAvatarTone> = {
  blueAvatar: {
    accent: '#9b87f5',
    glow: 'rgba(139, 116, 246, 0.54)',
    gradientClass: 'from-purple-400 via-blue-500 to-cyan-400',
    borderClass: 'border-purple-500 hover:border-purple-400',
    imageClass: '',
  },
  greenAvatar: {
    accent: '#10b981',
    glow: 'rgba(16, 185, 129, 0.5)',
    gradientClass: 'from-green-400 via-emerald-500 to-lime-400',
    borderClass: 'border-emerald-400 hover:border-emerald-300',
    imageClass: '',
  },
  mazeAvatar: {
    accent: '#8b8f98',
    glow: 'rgba(169, 172, 180, 0.36)',
    gradientClass: 'from-zinc-300 via-zinc-500 to-neutral-800',
    borderClass: 'border-zinc-300 hover:border-zinc-100',
    imageClass: 'grayscale contrast-150 brightness-90',
  },
  latticeAvatar: {
    accent: '#a6a6a6',
    glow: 'rgba(190, 190, 190, 0.34)',
    gradientClass: 'from-white via-zinc-400 to-neutral-700',
    borderClass: 'border-zinc-200 hover:border-white',
    imageClass: 'grayscale contrast-125 brightness-110',
  },
  vortexAvatar: {
    accent: '#4664f0',
    glow: 'rgba(78, 97, 242, 0.45)',
    gradientClass: 'from-blue-300 via-indigo-500 to-cyan-300',
    borderClass: 'border-blue-400 hover:border-cyan-300',
    imageClass: 'hue-rotate-[70deg] saturate-150 contrast-125',
  },
  weaveAvatar: {
    accent: '#72c7a2',
    glow: 'rgba(114, 199, 162, 0.42)',
    gradientClass: 'from-emerald-200 via-teal-400 to-indigo-500',
    borderClass: 'border-teal-300 hover:border-emerald-200',
    imageClass: 'hue-rotate-[20deg] saturate-125 contrast-110',
  },
  bloomAvatar: {
    accent: '#4fbf87',
    glow: 'rgba(79, 191, 135, 0.42)',
    gradientClass: 'from-lime-200 via-emerald-400 to-sky-400',
    borderClass: 'border-emerald-300 hover:border-lime-200',
    imageClass: 'hue-rotate-[35deg] saturate-125 contrast-110',
  },
  sandAvatar: {
    accent: '#9c7d68',
    glow: 'rgba(156, 125, 104, 0.4)',
    gradientClass: 'from-stone-200 via-rose-300 to-sky-300',
    borderClass: 'border-stone-300 hover:border-white',
    imageClass: 'hue-rotate-[145deg] saturate-90 contrast-125',
  },
  crystalAvatar: {
    accent: '#7fb8b7',
    glow: 'rgba(127, 184, 183, 0.4)',
    gradientClass: 'from-cyan-100 via-teal-300 to-fuchsia-300',
    borderClass: 'border-cyan-200 hover:border-white',
    imageClass: 'hue-rotate-[300deg] saturate-125 brightness-110',
  },
};

/**
 * Get the currently selected avatar image URL from localStorage
 * @returns The image URL of the selected avatar, or the default blue avatar
 */
export function getSelectedAvatarImage(selectedAvatarOverride?: string): string {
  const selectedAvatar = selectedAvatarOverride || safeGetItem('selectedAvatar') || 'blueAvatar';
  return avatarImageMap[selectedAvatar] || aiBubble;
}

export function getAgentAvatarTone(selectedAvatarOverride?: string): AgentAvatarTone {
  const selectedAvatar = selectedAvatarOverride || safeGetItem('selectedAvatar') || 'blueAvatar';
  return avatarToneMap[selectedAvatar] || avatarToneMap.blueAvatar;
}
