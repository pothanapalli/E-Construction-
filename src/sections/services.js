/**
 * Section 5: Services Section
 * Features:
 * 1. Damped 3D perspective tilt following cursor position
 * 2. Interactive material swap & texture crossfade (Concrete, Glass, Steel) on 2D canvas visualizers
 */

export function initServices() {
  const cards = document.querySelectorAll('[data-tilt-card]');
  if (!cards.length) return;

  // -------------------------------------------------------------
  // 1. Procedural Material Canvas Visualizer
  // -------------------------------------------------------------
  const cardStates = {};

  cards.forEach((card) => {
    const serviceName = card.getAttribute('data-service');
    const canvas = card.querySelector('.material-canvas');
    const badge = card.querySelector(`#mat-badge-${serviceName}`);
    const matButtons = card.querySelectorAll('.mat-btn');

    let currentMaterial = serviceName === 'residential' ? 'concrete' : (serviceName === 'commercial' ? 'glass' : 'steel');
    let transitionProgress = 1;
    let targetMaterial = currentMaterial;

    cardStates[serviceName] = {
      canvas,
      ctx: canvas ? canvas.getContext('2d') : null,
      currentMaterial,
      targetMaterial,
      transitionProgress,
      badge,
      tiltX: 0,
      tiltY: 0,
      currentTiltX: 0,
      currentTiltY: 0,
      glareX: 50,
      glareY: 50,
    };

    // Material switch buttons click listener
    matButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const chosenMat = btn.getAttribute('data-mat');
        if (cardStates[serviceName].currentMaterial === chosenMat) return;

        matButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        cardStates[serviceName].targetMaterial = chosenMat;
        cardStates[serviceName].transitionProgress = 0; // Trigger crossfade
        if (badge) badge.textContent = `MATERIAL: ${chosenMat.toUpperCase()}`;
      });
    });

    // -------------------------------------------------------------
    // 2. Damped 3D Tilt Effect (Desktop) / Scroll Observer (Touch)
    // -------------------------------------------------------------
    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches || ('ontouchstart' in window);
    const TILT_MAX = 14; // Max tilt degrees

    if (!isTouch) {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width; // 0 to 1
        const y = (e.clientY - rect.top) / rect.height; // 0 to 1

        // Target tilt: rotating around Y based on X, rotating around X based on -Y
        cardStates[serviceName].tiltY = (x - 0.5) * TILT_MAX * 2;
        cardStates[serviceName].tiltX = -(y - 0.5) * TILT_MAX * 2;

        cardStates[serviceName].glareX = x * 100;
        cardStates[serviceName].glareY = y * 100;
      });

      card.addEventListener('mouseleave', () => {
        cardStates[serviceName].tiltX = 0;
        cardStates[serviceName].tiltY = 0;
      });
    }
  });

  // Mobile scroll-focus observer
  const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches || ('ontouchstart' in window);
  if (isTouchDevice && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const cardInner = entry.target.querySelector('.card-inner');
        if (cardInner) {
          if (entry.isIntersecting) {
            cardInner.style.borderColor = 'var(--text-primary)';
            cardInner.style.boxShadow = '0 20px 45px rgba(37, 35, 32, 0.08)';
          } else {
            cardInner.style.borderColor = 'var(--hairline)';
            cardInner.style.boxShadow = '0 16px 40px rgba(37, 35, 32, 0.04)';
          }
        }
      });
    }, { threshold: 0.5 });

    cards.forEach((card) => observer.observe(card));
  }

  // Material Draw Functions (Strict Tonal System: #EDEAE4, #DFDBD2, #252320, #6B655C, #B5532E, #C4BFB5)
  function drawConcrete(ctx, w, h, time) {
    ctx.fillStyle = '#DFDBD2';
    ctx.fillRect(0, 0, w, h);

    // Concrete formwork lines
    ctx.strokeStyle = '#C4BFB5';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.moveTo(w / 3, 0);
    ctx.lineTo(w / 3, h);
    ctx.moveTo((w * 2) / 3, 0);
    ctx.lineTo((w * 2) / 3, h);
    ctx.stroke();

    // Tie-rod holes
    const tieHoles = [
      [w / 6, h / 4], [w / 2, h / 4], [(w * 5) / 6, h / 4],
      [w / 6, (h * 3) / 4], [w / 2, (h * 3) / 4], [(w * 5) / 6, (h * 3) / 4],
    ];
    tieHoles.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#6B655C';
      ctx.fill();
      ctx.strokeStyle = '#C4BFB5';
      ctx.stroke();
    });

    // Aggregate speckles
    ctx.fillStyle = 'rgba(37, 35, 32, 0.05)';
    for (let i = 0; i < 30; i++) {
      const rx = (Math.sin(i * 99 + time * 0.1) * 0.5 + 0.5) * w;
      const ry = (Math.cos(i * 33 + time * 0.1) * 0.5 + 0.5) * h;
      ctx.fillRect(rx, ry, 2, 2);
    }
  }

  function drawGlass(ctx, w, h, time) {
    // Tinted architectural solar glass gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#DFDBD2');
    grad.addColorStop(0.5, '#EDEAE4');
    grad.addColorStop(1, '#DFDBD2');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Specular diagonal reflection sweep
    const sweepOffset = (time * 80) % (w * 2);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sweepOffset - 80, 0);
    ctx.lineTo(sweepOffset, 0);
    ctx.lineTo(sweepOffset - 120, h);
    ctx.lineTo(sweepOffset - 200, h);
    ctx.closePath();
    ctx.fillStyle = 'rgba(237, 234, 228, 0.35)';
    ctx.fill();
    ctx.restore();

    // Architectural mullion grid
    ctx.strokeStyle = '#C4BFB5';
    ctx.lineWidth = 1.5;
    for (let x = 60; x < w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }

  function drawSteel(ctx, w, h, time) {
    // Deep charcoal steel gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#252320');
    grad.addColorStop(0.5, '#6B655C');
    grad.addColorStop(1, '#252320');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Horizontal brush strokes
    ctx.fillStyle = 'rgba(237, 234, 228, 0.05)';
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 1);
    }

    // Terracotta flange accent
    ctx.fillStyle = '#B5532E';
    ctx.fillRect(10, 10, w - 20, 3);
    ctx.fillRect(10, h - 13, w - 20, 3);

    // Terracotta rivets
    ctx.fillStyle = '#B5532E';
    for (let x = 30; x < w - 20; x += 40) {
      ctx.beginPath();
      ctx.arc(x, 22, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, h - 25, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Animation Loop for Damped Tilt and Material Rendering
  let time = 0;
  function renderServices() {
    time += 0.016;

    cards.forEach((card) => {
      const serviceName = card.getAttribute('data-service');
      const state = cardStates[serviceName];
      if (!state) return;

      if (!isTouchDevice) {
        // 1. Fast Damped Lerp for 3D Tilt (lerp factor 0.18)
        state.currentTiltX += (state.tiltX - state.currentTiltX) * 0.18;
        state.currentTiltY += (state.tiltY - state.currentTiltY) * 0.18;
        card.style.transform = `perspective(1000px) rotateX(${state.currentTiltX.toFixed(2)}deg) rotateY(${state.currentTiltY.toFixed(2)}deg)`;
      } else {
        card.style.transform = 'none';
      }

      // 2. Material Canvas Crossfade & Rendering (Fast & Crisp)
      const ctx = state.ctx;
      const canvas = state.canvas;
      if (ctx && canvas) {
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        if (state.transitionProgress < 1) {
          state.transitionProgress += 0.1; // Fast crossfade
          if (state.transitionProgress >= 1) {
            state.transitionProgress = 1;
            state.currentMaterial = state.targetMaterial;
          }
        }

        // Draw active material
        if (state.targetMaterial === 'concrete') drawConcrete(ctx, w, h, time);
        else if (state.targetMaterial === 'glass') drawGlass(ctx, w, h, time);
        else if (state.targetMaterial === 'steel') drawSteel(ctx, w, h, time);
      }
    });

    requestAnimationFrame(renderServices);
  }

  requestAnimationFrame(renderServices);
}
