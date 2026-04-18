const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4001/api";

export async function fetchLevels() {
  const response = await fetch(`${API_BASE}/levels`);
  if (!response.ok) throw new Error("Could not fetch levels");
  return response.json();
}

export async function submitScore(payload) {
  const response = await fetch(`${API_BASE}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) throw new Error("Could not submit score");
  return response.json();
}

export async function fetchLeaderboard() {
  const response = await fetch(`${API_BASE}/leaderboard`);
  if (!response.ok) throw new Error("Could not fetch leaderboard");
  return response.json();
}
