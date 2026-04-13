import { addUserPoints } from './pointsManager';

export interface Quest {
  id: number;
  title: string;
  description: string;
  points: number;
  type: 'quiz' | 'checkin' | 'share' | 'review' | 'survey' | 'content' | 'portfolio' | 'team';
  category: 'daily' | 'weekly' | 'special';
  requirement?: number; // For quests that need X actions
  progress?: number; // Current progress
  completed: boolean;
  completedAt?: string;
}

const QUEST_STORAGE_KEY = 'user_quests';
const QUEST_PROGRESS_KEY = 'quest_progress';

// Default quests
export const DEFAULT_QUESTS: Omit<Quest, 'completed' | 'progress'>[] = [
  { id: 1, title: 'Personality\nQuiz', description: 'Take a personality quiz', points: 15, type: 'quiz', category: 'daily' },
  { id: 2, title: 'Daily\nCheck-in', description: 'Complete daily check-in', points: 10, type: 'checkin', category: 'daily' },
  { id: 3, title: 'Share\nProducts', description: 'Share 3 products', points: 15, type: 'share', category: 'daily', requirement: 3 },
  { id: 4, title: 'Share\nProducts', description: 'Share 5 products from marketplace', points: 20, type: 'share', category: 'weekly', requirement: 5 },
  { id: 5, title: 'Review\nItems', description: 'Write 2 product reviews', points: 25, type: 'review', category: 'weekly', requirement: 2 },
  { id: 6, title: 'Take\nSurvey', description: 'Complete a survey', points: 12, type: 'survey', category: 'daily' },
  { id: 7, title: 'Create\nContent', description: 'Post content', points: 18, type: 'content', category: 'weekly' },
  { id: 8, title: 'Portfolio\nActivity', description: 'Participate in portfolio', points: 20, type: 'portfolio', category: 'weekly' },
];

// Get all quests
export function getQuests(): Quest[] {
  const stored = localStorage.getItem(QUEST_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  // Initialize with default quests
  const quests = DEFAULT_QUESTS.map(q => ({
    ...q,
    completed: false,
    progress: 0
  }));
  localStorage.setItem(QUEST_STORAGE_KEY, JSON.stringify(quests));
  return quests;
}

// Save quests
export function saveQuests(quests: Quest[]): void {
  localStorage.setItem(QUEST_STORAGE_KEY, JSON.stringify(quests));
}

// Get quest by ID
export function getQuestById(id: number): Quest | null {
  const quests = getQuests();
  return quests.find(q => q.id === id) || null;
}

// Update quest progress
export function updateQuestProgress(questId: number, progress: number): Quest | null {
  const quests = getQuests();
  const quest = quests.find(q => q.id === questId);
  
  if (!quest || quest.completed) return null;
  
  quest.progress = progress;
  
  // Check if quest is complete
  if (quest.requirement && progress >= quest.requirement) {
    completeQuest(questId);
  }
  
  saveQuests(quests);
  return quest;
}

// Complete a quest
export function completeQuest(questId: number): boolean {
  const quests = getQuests();
  const quest = quests.find(q => q.id === questId);
  
  if (!quest || quest.completed) return false;
  
  quest.completed = true;
  quest.completedAt = new Date().toISOString();
  
  // Award points
  addUserPoints(quest.points, `quest-${quest.type}`);
  
  saveQuests(quests);
  
  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('questCompleted', { 
    detail: { questId, points: quest.points, title: quest.title } 
  }));
  
  return true;
}

// Reset daily quests (call this once per day)
export function resetDailyQuests(): void {
  const quests = getQuests();
  const lastReset = localStorage.getItem('last_quest_reset');
  const today = new Date().toDateString();
  
  if (lastReset === today) return;
  
  quests.forEach(quest => {
    if (quest.category === 'daily') {
      quest.completed = false;
      quest.progress = 0;
      delete quest.completedAt;
    }
  });
  
  saveQuests(quests);
  localStorage.setItem('last_quest_reset', today);
}

// Reset weekly quests (call this once per week)
export function resetWeeklyQuests(): void {
  const quests = getQuests();
  const lastReset = localStorage.getItem('last_weekly_quest_reset');
  const thisWeek = getWeekNumber();
  
  if (lastReset === thisWeek) return;
  
  quests.forEach(quest => {
    if (quest.category === 'weekly') {
      quest.completed = false;
      quest.progress = 0;
      delete quest.completedAt;
    }
  });
  
  saveQuests(quests);
  localStorage.setItem('last_weekly_quest_reset', thisWeek);
}

// Get week number
function getWeekNumber(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const week = Math.floor(diff / oneWeek);
  return `${now.getFullYear()}-W${week}`;
}

// Increment quest progress (for multi-step quests)
export function incrementQuestProgress(questId: number): Quest | null {
  const quest = getQuestById(questId);
  if (!quest || quest.completed) return null;
  
  const newProgress = (quest.progress || 0) + 1;
  return updateQuestProgress(questId, newProgress);
}

// Get quest stats
export function getQuestStats() {
  const quests = getQuests();
  const completed = quests.filter(q => q.completed).length;
  const totalPoints = quests.reduce((sum, q) => sum + (q.completed ? q.points : 0), 0);
  const availablePoints = quests.reduce((sum, q) => sum + (!q.completed ? q.points : 0), 0);
  
  return {
    total: quests.length,
    completed,
    remaining: quests.length - completed,
    totalPoints,
    availablePoints,
    completionRate: quests.length > 0 ? (completed / quests.length) * 100 : 0
  };
}

// Initialize quests on app load
export function initializeQuests(): void {
  resetDailyQuests();
  resetWeeklyQuests();
}
