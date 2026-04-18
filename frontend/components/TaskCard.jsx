import { getRoutineLabel } from "../utils/levelFlow.js";

export default function TaskCard({ task, timeLeft, onAnswer, feedback, onRetryWithHint, lowSensoryMode }) {
  if (!task) {
    return <section className="card"><p>Pick a level to begin.</p></section>;
  }

  return (
    <section className={`card task-card ${lowSensoryMode ? "low-sensory" : ""}`}>
      <p className="routine-badge">{getRoutineLabel(task.mode)}</p>
      <h2>{task.prompt}</h2>
      <p className="timer">Time left: {timeLeft}s</p>
      <div className="options">
        {task.options.map((option) => (
          <button key={option} onClick={() => onAnswer(option)}>{option}</button>
        ))}
      </div>
      {feedback && <p className={`feedback ${feedback.type}`}>{feedback.message}</p>}
      <button className="hint-btn" onClick={onRetryWithHint}>Retry with hint</button>
    </section>
  );
}
