import { useMemo, useState } from "react";
import GamePage from "../pages/GamePage.jsx";
import LeaderboardPage from "../pages/LeaderboardPage.jsx";
import Layout from "../components/Layout.jsx";

export default function App() {
  const [view, setView] = useState("game");
  const title = useMemo(() => (view === "game" ? "NeuroLearn Play" : "Leaderboard"), [view]);

  return (
    <Layout title={title}>
      <nav className="top-nav" aria-label="Primary">
        <button onClick={() => setView("game")} aria-pressed={view === "game"}>Play</button>
        <button onClick={() => setView("leaderboard")} aria-pressed={view === "leaderboard"}>Leaderboard</button>
      </nav>
      {view === "game" ? <GamePage /> : <LeaderboardPage />}
    </Layout>
  );
}
