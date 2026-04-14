import aiBubble from 'figma:asset/36fff8878cf3ea6d1ef44d3f08bbc2346c733ebc.png';
import greenMorphicBall from 'figma:asset/8fd559d05db8d67dee13e79dc6418365220fd613.png';
import { safeGetItem } from './storage';

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

/**
 * Get the currently selected avatar image URL from localStorage
 * @returns The image URL of the selected avatar, or the default blue avatar
 */
export function getSelectedAvatarImage(): string {
  const selectedAvatar = safeGetItem('selectedAvatar') || 'blueAvatar';
  return avatarImageMap[selectedAvatar] || aiBubble;
}
