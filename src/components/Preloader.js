/**
 * Preloader: Branded Fast Architectural Loading Sequence
 * Displays building rising animation, blueprint status logs, and rapidly unlocks page
 */
export function initPreloader(onComplete) {
  const preloaderEl = document.getElementById('preloader');
  const barEl = document.getElementById('preloader-bar');
  const pctEl = document.getElementById('preloader-pct');
  const statusEl = document.getElementById('preloader-status');

  if (!preloaderEl) {
    if (onComplete) onComplete();
    return;
  }

  const milestones = [
    { pct: 20, status: 'MAPPING GEOTECHNICAL AXIS...' },
    { pct: 50, status: 'COMPILING STEEL EXOSKELETON...' },
    { pct: 80, status: 'CALIBRATING CANTILEVER TOLERANCE...' },
    { pct: 100, status: 'SYSTEM CALIBRATION COMPLETE // READY' },
  ];

  let currentPct = 0;
  let milestoneIdx = 0;

  // Fast, crisp loading interval (~500ms total)
  const interval = setInterval(() => {
    currentPct += Math.floor(Math.random() * 10) + 8;
    if (currentPct >= 100) {
      currentPct = 100;
      clearInterval(interval);
    }

    if (milestoneIdx < milestones.length && currentPct >= milestones[milestoneIdx].pct) {
      if (statusEl) statusEl.textContent = milestones[milestoneIdx].status;
      milestoneIdx++;
    }

    if (pctEl) pctEl.textContent = `${currentPct.toString().padStart(2, '0')}%`;
    if (barEl) barEl.style.width = `${currentPct}%`;

    if (currentPct === 100) {
      setTimeout(() => {
        preloaderEl.classList.add('is-loaded');
        document.body.classList.remove('loading');
        if (onComplete) onComplete();
      }, 180);
    }
  }, 22);
}
