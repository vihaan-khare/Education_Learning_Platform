import { getLevels } from "../models/dataStore.js";

export function fetchLevels(req, res) {
  const levels = getLevels();
  res.json({ levels });
}
