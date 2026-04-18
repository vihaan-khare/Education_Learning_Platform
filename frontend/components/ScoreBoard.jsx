export default function ScoreBoard({ points, streak, timerChallenge, onToggleTimer, lowSensoryMode, onToggleLowSensory }) {
  return (
    <section className="card stats" aria-label="Game stats and settings">
      <p><strong>Points:</strong> {points}</p>
      <p><strong>Streak:</strong> {streak}</p>
      <label>
        <input type="checkbox" checked={timerChallenge} onChange={onToggleTimer} />
        Timer challenge
      </label>
      <label>
        <input type="checkbox" checked={lowSensoryMode} onChange={onToggleLowSensory} />
        Low sensory mode
      </label>
    </section>
  );
}
