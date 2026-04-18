import { getLeaderboard } from "../models/dataStore.js";

export function fetchLeaderboard(req, res) {
  return res.json({ leaderboard: getLeaderboard() });
}
