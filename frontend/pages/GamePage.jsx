import { useEffect, useMemo, useRef, useState } from "react";
import LevelSelector from "../components/LevelSelector.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import ScoreBoard from "../components/ScoreBoard.jsx";
import TaskCard from "../components/TaskCard.jsx";
import FocusOverlay from "../components/FocusOverlay.jsx";
import { fetchLevels, submitScore } from "../utils/api.js";
import { calculatePoints } from "../utils/adaptiveEngine.js";
import { getProgress, getSettings, saveLocalLeaderboard, saveProgress, saveSettings, getLocalLeaderboard } from "../utils/storage.js";
import { playFeedbackSound } from "../utils/sound.js";

const TIMER_SECONDS = 20;
const IDLE_LIMIT_MS = 15000;
const TASKS_PER_LEVEL = 5;

function shuffleArray(items) {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

export default function GamePage() {
  const initialProgress = getProgress();
  const initialSettings = getSettings();

  const [levels, setLevels] = useState([]);
  const [selectedLevelId, setSelectedLevelId] = useState("");
  const [task, setTask] = useState(null);
  const [taskIndex, setTaskIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [feedback, setFeedback] = useState(null);
  const [hint, setHint] = useState("");
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const [levelTaskQueue, setLevelTaskQueue] = useState([]);
  const [showFinalCheckpoint, setShowFinalCheckpoint] = useState(false);
  const [levelRunKey, setLevelRunKey] = useState(0);

  const [unlockedLevelIndex, setUnlockedLevelIndex] = useState(initialProgress.unlockedLevelIndex);
  const [totalPoints, setTotalPoints] = useState(initialProgress.totalPoints);
  const [streak, setStreak] = useState(initialProgress.streak);
  const [completedLevels, setCompletedLevels] = useState(initialProgress.completedLevels);

  const [playerName, setPlayerName] = useState(initialSettings.playerName);
  const [timerChallenge, setTimerChallenge] = useState(initialSettings.timerChallenge);
  const [lowSensoryMode, setLowSensoryMode] = useState(initialSettings.lowSensoryMode);
  const recentTaskIdsRef = useRef([]);
  const taskDeckByLevelRef = useRef({});
  const lastRunTaskIdsByLevelRef = useRef({});

  useEffect(() => {
    async function loadLevels() {
      const response = await fetchLevels();
      setLevels(response.levels);
      setSelectedLevelId(response.levels[0]?.id || "");
    }

    loadLevels().catch(() => {
      setFeedback({ type: "wrong", message: "Could not load backend data. Start backend on port 4001." });
    });
  }, []);

  const selectedLevel = useMemo(
    () => levels.find((level) => level.id === selectedLevelId),
    [levels, selectedLevelId]
  );

  function buildNextLevelQueue(level) {
    const levelId = level.id;
    const allTasks = level.tasks;
    const queueSize = Math.min(TASKS_PER_LEVEL, allTasks.length);

    let deck = taskDeckByLevelRef.current[levelId];
    if (!deck || deck.length === 0) {
      const lastRunIds = lastRunTaskIdsByLevelRef.current[levelId] || [];
      const freshPool = allTasks.filter((task) => !lastRunIds.includes(task.id));
      deck = shuffleArray(freshPool.length > 0 ? freshPool : allTasks);
    }

    let queue = [];
    let remainingDeck = [...deck];

    while (queue.length < queueSize) {
      if (remainingDeck.length === 0) {
        const usedIds = queue.map((task) => task.id);
        const refillPool = allTasks.filter((task) => !usedIds.includes(task.id));
        remainingDeck = shuffleArray(refillPool.length > 0 ? refillPool : allTasks);
      }

      const nextTask = remainingDeck.shift();
      if (!nextTask) break;
      if (!queue.some((task) => task.id === nextTask.id)) {
        queue.push(nextTask);
      }
    }

    taskDeckByLevelRef.current[levelId] = remainingDeck;
    lastRunTaskIdsByLevelRef.current[levelId] = queue.map((task) => task.id);

    return queue;
  }

  useEffect(() => {
    if (!selectedLevel) return;

    const queue = buildNextLevelQueue(selectedLevel);

    if (queue.length > 0) {
      setLevelTaskQueue(queue);
      setTask(queue[0]);
      setTaskIndex(0);
      setShowFinalCheckpoint(false);
      setHint("");
      setTimeLeft(TIMER_SECONDS);
    }
  }, [selectedLevel, levelRunKey]);

  useEffect(() => {
    if (!selectedLevel) return;
    if (showFinalCheckpoint) {
      setTask({
        id: "final-checkpoint",
        mode: "test",
        prompt: "Final focus check: Tap READY to complete level.",
        options: ["READY", "LATER"],
        answer: "READY",
        hint: "You are one step away from finishing."
      });
      setHint("");
      setTimeLeft(TIMER_SECONDS);
      return;
    }

    if (levelTaskQueue.length > 0 && taskIndex < levelTaskQueue.length) {
      setTask(levelTaskQueue[taskIndex]);
      setHint("");
      setTimeLeft(TIMER_SECONDS);
    }
  }, [selectedLevel, levelTaskQueue, taskIndex, showFinalCheckpoint]);

  useEffect(() => {
    if (!timerChallenge || !task) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [task, timerChallenge]);

  useEffect(() => {
    if (timeLeft !== 0) return;
    setFeedback({ type: "wrong", message: "Time is up. Retry with hint." });
  }, [timeLeft]);

  useEffect(() => {
    const idleWatcher = setInterval(() => {
      if (Date.now() - lastInteraction > IDLE_LIMIT_MS) {
        setShowFocusMode(true);
      }
    }, 1000);

    return () => clearInterval(idleWatcher);
  }, [lastInteraction]);

  useEffect(() => {
    saveProgress({ unlockedLevelIndex, totalPoints, streak, completedLevels });
  }, [unlockedLevelIndex, totalPoints, streak, completedLevels]);

  useEffect(() => {
    saveSettings({ playerName, timerChallenge, lowSensoryMode });
  }, [playerName, timerChallenge, lowSensoryMode]);

  function handleAnswer(option) {
    if (!task) return;
    setLastInteraction(Date.now());
    setAttemptCount((prev) => prev + 1);

    const isCorrect = option === task.answer;

    if (task.id === "final-checkpoint") {
      if (isCorrect) {
        finishLevel();
      } else {
        setFeedback({ type: "hint", message: "Take a breath, then press READY when prepared." });
      }
      return;
    }

    if (isCorrect) {
      const earned = calculatePoints({ isCorrect: true, timeLeft, streak });
      const nextStreak = streak + 1;
      setCorrectCount((prev) => prev + 1);
      setStreak(nextStreak);
      setTotalPoints((prev) => prev + earned);
      setFeedback({ type: "correct", message: `Great work! +${earned} points` });
      playFeedbackSound("success", !lowSensoryMode);

      const nextTaskIndex = taskIndex + 1;
      recentTaskIdsRef.current = [...recentTaskIdsRef.current, task.id].slice(-6);

      if (nextTaskIndex >= levelTaskQueue.length) {
        setShowFinalCheckpoint(true);
      } else {
        setTaskIndex(nextTaskIndex);
      }
    } else {
      setStreak(0);
      setFeedback({ type: "wrong", message: "Nice try. Use a hint and retry." });
      playFeedbackSound("error", !lowSensoryMode);
    }
  }

  async function finishLevel() {
    if (!selectedLevel) return;

    const completed = Array.from(new Set([...completedLevels, selectedLevel.id]));
    setCompletedLevels(completed);

    const currentLevelIndex = levels.findIndex((level) => level.id === selectedLevel.id);
    if (currentLevelIndex >= unlockedLevelIndex && currentLevelIndex + 1 < levels.length) {
      setUnlockedLevelIndex(currentLevelIndex + 1);
    }

    const scorePayload = {
      playerName: playerName.trim() || "Player",
      points: totalPoints,
      timeMs: (TIMER_SECONDS - timeLeft + taskIndex * TIMER_SECONDS) * 1000,
      completedLevels: completed
    };

    try {
      await submitScore(scorePayload);
    } catch {
      const entries = getLocalLeaderboard();
      const merged = [...entries, scorePayload]
        .sort((a, b) => b.points - a.points || a.timeMs - b.timeMs)
        .slice(0, 20);
      saveLocalLeaderboard(merged);
    }

    setFeedback({ type: "correct", message: "Level completed. Next level unlocked!" });
    setTaskIndex(0);
    setShowFinalCheckpoint(false);
    setLevelTaskQueue([]);
    setLevelRunKey((value) => value + 1);
    // Keep memory between resets to reduce repeatedness.
  }

  const progressPercent = Math.min(100, Math.round((taskIndex / TASKS_PER_LEVEL) * 100));

  return (
    <div className="game-grid" onClick={() => setLastInteraction(Date.now())}>
      <ScoreBoard
        points={totalPoints}
        streak={streak}
        timerChallenge={timerChallenge}
        onToggleTimer={() => setTimerChallenge((value) => !value)}
        lowSensoryMode={lowSensoryMode}
        onToggleLowSensory={() => setLowSensoryMode((value) => !value)}
      />

      <section className="card">
        <label htmlFor="playerName">Player name</label>
        <input
          id="playerName"
          value={playerName}
          onChange={(event) => setPlayerName(event.target.value)}
          onBlur={() => {
            if (!playerName.trim()) setPlayerName("Player");
          }}
          aria-label="Player name"
        />
      </section>

      <LevelSelector
        levels={levels}
        unlockedLevelIndex={unlockedLevelIndex}
        selectedLevelId={selectedLevelId}
        onSelect={(id) => {
          setSelectedLevelId(id);
          setTaskIndex(0);
          setFeedback(null);
          setShowFinalCheckpoint(false);
          setLevelTaskQueue([]);
          setLevelRunKey((value) => value + 1);
          recentTaskIdsRef.current = [];
        }}
      />

      <ProgressBar value={progressPercent} />

      <TaskCard
        task={task}
        timeLeft={timeLeft}
        onAnswer={handleAnswer}
        feedback={feedback}
        lowSensoryMode={lowSensoryMode}
        onRetryWithHint={() => {
          setHint(task?.hint || "Take one small step.");
          setFeedback({ type: "hint", message: hint || task?.hint || "Try once more." });
          setLastInteraction(Date.now());
        }}
      />

      {showFocusMode && <FocusOverlay onResume={() => {
        setShowFocusMode(false);
        setLastInteraction(Date.now());
      }} />}
    </div>
  );
}
