import { useEffect, useState } from "react";
import { fetchLeaderboard } from "../utils/api.js";
import { getLocalLeaderboard } from "../utils/storage.js";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const response = await fetchLeaderboard();
        setEntries(response.leaderboard);
      } catch {
        setEntries(getLocalLeaderboard());
      }
    }

    loadLeaderboard();
  }, []);

  return (
    <section className="card" aria-label="Leaderboard">
      <h2>Top Players</h2>
      {entries.length === 0 ? (
        <p>No scores yet. Complete a level to appear here.</p>
      ) : (
        <ol className="leaderboard-list">
          {entries.map((entry, index) => (
            <li key={`${entry.playerName}-${index}`}>
              <span>{index + 1}. {entry.playerName}</span>
              <span>{entry.points} pts</span>
              <span>{Math.round(entry.timeMs / 1000)}s</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
