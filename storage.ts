export interface ScoreEntry {
  date: string;
  score: number;
}

const SNAKE_KEY = 'snake_high_scores';
const SOKOBAN_KEY = 'sokoban_best_moves';
const MAX_SCORES = 5;

// --- Snake Scores ---

export const getSnakeScores = (): ScoreEntry[] => {
  try {
    const stored = localStorage.getItem(SNAKE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn("Failed to load snake scores", e);
    return [];
  }
};

export const saveSnakeScore = (score: number): ScoreEntry[] => {
  const scores = getSnakeScores();
  
  // Add new score
  scores.push({
    date: new Date().toISOString(),
    score
  });

  // Sort descending
  scores.sort((a, b) => b.score - a.score);

  // Keep top N
  const topScores = scores.slice(0, MAX_SCORES);

  try {
    localStorage.setItem(SNAKE_KEY, JSON.stringify(topScores));
  } catch (e) {
    console.warn("Failed to save snake score", e);
  }

  return topScores;
};

// --- Sokoban Bests ---

// Map level index to best moves count
type SokobanBests = Record<number, number>;

export const getSokobanBests = (): SokobanBests => {
  try {
    const stored = localStorage.getItem(SOKOBAN_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
};

export const saveSokobanBest = (levelIdx: number, moves: number): boolean => {
  const bests = getSokobanBests();
  const currentBest = bests[levelIdx];
  
  // Save if no previous best, or if current moves is lower (better)
  if (currentBest === undefined || moves < currentBest) {
    bests[levelIdx] = moves;
    try {
      localStorage.setItem(SOKOBAN_KEY, JSON.stringify(bests));
    } catch (e) {
      console.warn("Failed to save sokoban best", e);
    }
    return true; // New Record
  }
  
  return false; // Not a record
};
