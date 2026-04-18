export default function FocusOverlay({ onResume }) {
  return (
    <div className="focus-overlay" role="dialog" aria-modal="true" aria-label="Focus mode">
      <h3>Focus Mode</h3>
      <p>Let us return to one simple step.</p>
      <button onClick={onResume}>Continue Task</button>
    </div>
  );
}
