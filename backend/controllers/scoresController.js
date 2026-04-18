import { saveScore } from "../models/dataStore.js";

export function storeScore(req, res) {
  const { playerName, points, timeMs, completedLevels } = req.body;

  if (!playerName || typeof points !== "number" || typeof timeMs !== "number") {
    return res.status(400).json({ message: "Invalid score payload" });
  }

  const leaderboard = saveScore({ playerName, points, timeMs, completedLevels: completedLevels || [] });
  return res.status(201).json({ message: "Score saved", leaderboard });
}
