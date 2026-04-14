import { safeGetItem, safeSetItem } from './storage';

const SCRATCH_TEASER_PENDING_KEY = 'scratchTeaserPending';
const SCRATCH_TEASER_AUTH_INTENT_KEY = 'scratchTeaserAuthIntent';

type ScratchTeaserAuthIntent = 'register' | 'login';

export function startScratchTeaser(intent: ScratchTeaserAuthIntent = 'register') {
  safeSetItem(SCRATCH_TEASER_PENDING_KEY, 'true');
  safeSetItem(SCRATCH_TEASER_AUTH_INTENT_KEY, intent);
  try {
    localStorage.removeItem('splashNextPath');
  } catch (error) {
    console.warn('Unable to clear splash next path:', error);
  }
}

export function markScratchTeaserPending() {
  safeSetItem(SCRATCH_TEASER_PENDING_KEY, 'true');

  if (!safeGetItem(SCRATCH_TEASER_AUTH_INTENT_KEY)) {
    safeSetItem(SCRATCH_TEASER_AUTH_INTENT_KEY, 'register');
  }
}

export function isScratchTeaserPending() {
  return safeGetItem(SCRATCH_TEASER_PENDING_KEY) === 'true';
}

export function getScratchTeaserAuthRoute() {
  return safeGetItem(SCRATCH_TEASER_AUTH_INTENT_KEY) === 'login'
    ? '/login'
    : '/sign-up';
}

export function getPostAuthDestination() {
  return safeGetItem('onboardingComplete') === 'true'
    ? '/profile-screen'
    : '/personalize-name';
}

export function completeScratchTeaserFlow() {
  try {
    localStorage.removeItem(SCRATCH_TEASER_PENDING_KEY);
    localStorage.removeItem(SCRATCH_TEASER_AUTH_INTENT_KEY);
    localStorage.removeItem('scratchTeaserReward');
  } catch (error) {
    console.warn('Unable to clear scratch teaser flow flags:', error);
  }
}
