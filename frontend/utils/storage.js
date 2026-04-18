const STORAGE_KEYS = {
  progress: "neurolearn_progress",
  leaderboard: "neurolearn_leaderboard",
  settings: "neurolearn_settings"
};

export function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getProgress() {
  return readStorage(STORAGE_KEYS.progress, {
    unlockedLevelIndex: 0,
    totalPoints: 0,
    streak: 0,
    completedLevels: []
  });
}

export function saveProgress(progress) {
  writeStorage(STORAGE_KEYS.progress, progress);
}

export function getLocalLeaderboard() {
  return readStorage(STORAGE_KEYS.leaderboard, []);
}

export function saveLocalLeaderboard(entries) {
  writeStorage(STORAGE_KEYS.leaderboard, entries);
}

export function getSettings() {
  return readStorage(STORAGE_KEYS.settings, {
    lowSensoryMode: false,
    timerChallenge: true,
    playerName: "Player"
  });
}

export function saveSettings(settings) {
  writeStorage(STORAGE_KEYS.settings, settings);
}
