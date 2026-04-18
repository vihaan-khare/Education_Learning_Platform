export default function ProgressBar({ value }) {
  return (
    <div className="progress-wrap" aria-label="Progress">
      <div className="progress-fill" style={{ width: `${value}%` }} />
      <span>{value}%</span>
    </div>
  );
}
