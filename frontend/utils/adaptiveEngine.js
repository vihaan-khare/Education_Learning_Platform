export function pickAdaptiveTask(tasks, accuracy, recentTaskIds = []) {
  const freshPool = tasks.filter((task) => !recentTaskIds.includes(task.id));
  const candidatePool = freshPool.length ? freshPool : tasks;

  let targetDifficulty = "medium";
  if (accuracy > 0.75) targetDifficulty = "hard";
  if (accuracy < 0.45) targetDifficulty = "easy";

  const byDifficulty = candidatePool.filter((task) => task.difficulty === targetDifficulty);
  const finalPool = byDifficulty.length ? byDifficulty : candidatePool;
  const randomIndex = Math.floor(Math.random() * finalPool.length);
  return finalPool[randomIndex];
}

export function calculatePoints({ isCorrect, timeLeft, streak }) {
  if (!isCorrect) return 0;

  const base = 10;
  const speedBonus = Math.max(0, Math.floor(timeLeft / 2));
  const streakBonus = streak >= 2 ? streak * 2 : 0;
  const surpriseBonus = Math.random() < 0.12 ? 15 : 0;

  return base + speedBonus + streakBonus + surpriseBonus;
}

export function shouldShowCheckpoint(taskIndex) {
  return taskIndex > 0 && taskIndex % 3 === 0;
}
