/**
 * Damped Custom Cursor & Crane Hook Attraction Physics
 * Clean architectural reticle with zero debug overlays
 */

export function initCursor() {
  const cursorEl = document.getElementById('custom-cursor');
  const girderBlock = document.getElementById('crane-girder-block');
  const ctaZone = document.getElementById('form-cta-zone');
  const magneticSlot = document.getElementById('cta-magnetic-slot');

  if (!cursorEl) return;

  const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches || ('ontouchstart' in window && window.innerWidth <= 768);
  if (isTouchDevice) {
    cursorEl.style.display = 'none';
    if (girderBlock) girderBlock.style.display = 'none';
    return {
      refreshHoverables: () => {},
      destroy: () => {},
    };
  }

  // Real mouse targets (raw)
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;

  // Damped interpolated positions
  let currentX = targetX;
  let currentY = targetY;

  // Secondary ring lag for fluid dual-stage feel
  let ringX = targetX;
  let ringY = targetY;

  // Girder block positions (spring-lerped)
  let girderX = targetX;
  let girderY = targetY;

  // Lerp damping coefficients (tuned for fast, snappy tracking)
  const CURSOR_LERP = 0.22;
  const RING_LERP = 0.14;
  const GIRDER_LERP = 0.16;

  let isHovering = false;
  let isCraneMode = false;
  let isGirderSnapped = false;
  let isMouseInside = false;

  // Mouse move listener: update raw targets
  window.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;

    if (!isMouseInside) {
      isMouseInside = true;
      currentX = targetX;
      currentY = targetY;
      ringX = targetX;
      ringY = targetY;
    }
  });

  // Track hoverables
  function updateHoverListeners() {
    const hoverElements = document.querySelectorAll('a, button, input, textarea, select, .mat-btn, .stage-pill, .chip-item, .hero-scroll-prompt');
    hoverElements.forEach((el) => {
      el.addEventListener('mouseenter', () => {
        isHovering = true;
        cursorEl.classList.add('is-hovering');
      });
      el.addEventListener('mouseleave', () => {
        isHovering = false;
        cursorEl.classList.remove('is-hovering');
      });
    });
  }

  updateHoverListeners();

  // RAF loop for smooth damped interpolation
  function renderCursor() {
    if (isMouseInside) {
      // Primary cursor lerp
      currentX += (targetX - currentX) * CURSOR_LERP;
      currentY += (targetY - currentY) * CURSOR_LERP;

      // Secondary ring lag
      ringX += (targetX - ringX) * RING_LERP;
      ringY += (targetY - ringY) * RING_LERP;

      // Apply transform using 3D hardware acceleration
      cursorEl.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;

      // Check Crane Hook Attraction Physics near the CTA Button
      if (ctaZone && magneticSlot) {
        const ctaRect = ctaZone.getBoundingClientRect();
        const slotRect = magneticSlot.getBoundingClientRect();

        const slotCenterX = slotRect.left + slotRect.width / 2;
        const slotCenterY = slotRect.top + slotRect.height / 2;

        const distToCta = Math.hypot(targetX - (ctaRect.left + ctaRect.width / 2), targetY - (ctaRect.top + ctaRect.height / 2));
        const distToSlot = Math.hypot(targetX - slotCenterX, targetY - slotCenterY);

        const PROXIMITY_THRESHOLD = 320;
        const SNAP_THRESHOLD = 90;

        if (distToCta < PROXIMITY_THRESHOLD) {
          if (!isCraneMode) {
            isCraneMode = true;
            cursorEl.classList.add('is-crane-mode');
            if (girderBlock) girderBlock.classList.add('is-visible');
          }

          if (distToSlot < SNAP_THRESHOLD) {
            // Magnetically snap girder to slot
            isGirderSnapped = true;
            girderX += (slotCenterX - girderX) * 0.25;
            girderY += (slotCenterY - girderY) * 0.25;

            if (girderBlock) {
              girderBlock.classList.add('is-snapped');
              girderBlock.style.transform = `translate3d(${girderX}px, ${girderY}px, 0) scale(1.04)`;
            }
            if (magneticSlot) magneticSlot.classList.add('is-active');
          } else {
            // Girder follows suspended hook with damped physics
            isGirderSnapped = false;
            if (girderBlock) girderBlock.classList.remove('is-snapped');
            if (magneticSlot) magneticSlot.classList.remove('is-active');

            const targetGirderX = currentX;
            const targetGirderY = currentY + 45; // Suspended 45px below hook

            girderX += (targetGirderX - girderX) * GIRDER_LERP;
            girderY += (targetGirderY - girderY) * GIRDER_LERP;

            if (girderBlock) {
              girderBlock.style.transform = `translate3d(${girderX}px, ${girderY}px, 0) rotate(${(targetX - currentX) * 0.15}deg)`;
            }
          }
        } else {
          if (isCraneMode) {
            isCraneMode = false;
            cursorEl.classList.remove('is-crane-mode');
            if (girderBlock) girderBlock.classList.remove('is-visible');
            if (magneticSlot) magneticSlot.classList.remove('is-active');
          }
        }
      }
    }

    requestAnimationFrame(renderCursor);
  }

  requestAnimationFrame(renderCursor);

  return {
    getNormalizedMouse: () => ({
      x: (currentX / window.innerWidth) * 2 - 1,
      y: -(currentY / window.innerHeight) * 2 + 1,
    }),
    refreshHoverables: updateHoverListeners,
  };
}
