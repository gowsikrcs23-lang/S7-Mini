import { Activity, HeartPulse } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <main className="loading-screen" aria-live="polite" aria-busy="true">
      <div className="loading-grid" aria-hidden="true" />
      <div className="loading-glow loading-glow-one" aria-hidden="true" />
      <div className="loading-glow loading-glow-two" aria-hidden="true" />

      <section className="loading-card">
        <div className="loading-mark" aria-hidden="true">
          <span className="loading-orbit loading-orbit-one" />
          <span className="loading-orbit loading-orbit-two" />
          <span className="loading-orbit loading-orbit-three" />
          <div className="loading-icon-wrap">
            <HeartPulse className="loading-heart" size={34} strokeWidth={2.4} />
          </div>
          <span className="loading-orbit-dot loading-orbit-dot-one" />
          <span className="loading-orbit-dot loading-orbit-dot-two" />
        </div>

        <div className="loading-copy">
          <div className="loading-brand"><Activity size={15} /> CareFlow</div>
          <h1>Preparing your workspace</h1>
          <p>Synchronizing your secure hospital operations dashboard</p>
        </div>

        <div className="loading-progress" aria-hidden="true">
          <span />
        </div>
        <div className="loading-status"><span className="loading-status-dot" /> Checking secure session</div>
      </section>
    </main>
  );
}
