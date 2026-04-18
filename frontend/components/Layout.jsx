export default function Layout({ title, children }) {
  return (
    <main className="layout" aria-live="polite">
      <header className="app-header">
        <h1>{title}</h1>
        <p className="subtitle">ADHD + Autism friendly micro-learning</p>
      </header>
      {children}
    </main>
  );
}
