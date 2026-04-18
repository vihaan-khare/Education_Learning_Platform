export default function LevelSelector({ levels, unlockedLevelIndex, selectedLevelId, onSelect }) {
  return (
    <section className="card">
      <h2>Levels</h2>
      <div className="level-grid" role="list" aria-label="Learning levels">
        {levels.map((level, index) => {
          const isLocked = index > unlockedLevelIndex;
          return (
            <button
              key={level.id}
              role="listitem"
              className={selectedLevelId === level.id ? "active" : ""}
              disabled={isLocked}
              onClick={() => onSelect(level.id)}
              aria-label={`${level.title} ${isLocked ? "locked" : "unlocked"}`}
            >
              {level.title}
            </button>
          );
        })}
      </div>
    </section>
  );
}
