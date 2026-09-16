import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { getLenis } from '../core/lenis.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Section 6: Projects Portfolio
 * Responsive Gallery:
 * - Desktop (> 768px): Horizontal scroll scrub with GSAP ScrollTrigger pinning, anticipatePin layout stabilization, center focus, and pointer drag with momentum
 * - Mobile (<= 768px): Native touch swipe / snap carousel with live progress indicator (no vertical hijack)
 */
export function initProjects() {
  const section = document.getElementById('projects-section');
  const track = document.getElementById('projects-track');
  const trackWrapper = document.getElementById('projects-track-wrapper') || document.querySelector('.projects-track-wrapper');
  const slides = document.querySelectorAll('.project-slide');
  const progressBar = document.getElementById('gallery-progress-bar');

  if (!section || !track || !slides.length) return;

  const mm = gsap.matchMedia();

  // 1. Desktop (> 768px): GSAP ScrollTrigger pinned horizontal scrub + drag interaction
  mm.add("(min-width: 769px)", () => {
    function getScrollAmount() {
      const trackWidth = track.scrollWidth;
      const windowWidth = window.innerWidth;
      return -(trackWidth - windowWidth + 96); // 96px padding buffer
    }

    // High-performance $O(1)$ mathematical center focus (0 forced reflows, 0 getBoundingClientRect calls)
    let currentActiveIndex = -1;
    function updateCenterFocus(progress) {
      const count = slides.length;
      if (!count) return;
      const activeIndex = Math.min(count - 1, Math.max(0, Math.round(progress * (count - 1))));
      if (activeIndex === currentActiveIndex) return;
      currentActiveIndex = activeIndex;

      slides.forEach((slide, idx) => {
        if (idx === activeIndex) {
          slide.classList.add('is-active');
        } else {
          slide.classList.remove('is-active');
        }
      });
    }

    const scrollTween = gsap.to(track, {
      x: getScrollAmount,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        pin: true,
        anticipatePin: 1,
        scrub: 0.35,
        start: 'top top',
        end: () => `+=${track.scrollWidth - window.innerWidth + 600}`,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (progressBar) {
            progressBar.style.width = `${Math.round(self.progress * 100)}%`;
          }
          updateCenterFocus(self.progress);
        },
      },
    });

    const st = scrollTween.scrollTrigger;

    // Pointer / Mouse Drag Logic for Desktop Track (dynamic listeners attached on mousedown only)
    let isDown = false;
    let startX = 0;
    let startScrollY = 0;
    let hasDragged = false;
    let lastX = 0;
    let velocityX = 0;

    const onMouseMove = (e) => {
      if (!isDown || !st) return;
      const currentX = e.pageX;
      const deltaX = currentX - startX;
      velocityX = currentX - lastX;
      lastX = currentX;

      if (Math.abs(deltaX) > 4) {
        hasDragged = true;
        e.preventDefault();
      }

      const trackTravel = Math.abs(getScrollAmount());
      const scrollRange = st.end - st.start;
      const ratio = trackTravel > 0 ? scrollRange / trackTravel : 1;

      const targetScroll = startScrollY - (deltaX * ratio);
      const clampedScroll = Math.max(st.start, Math.min(st.end, targetScroll));

      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(clampedScroll, { immediate: true });
      } else {
        window.scrollTo(0, clampedScroll);
      }
    };

    const onMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      if (trackWrapper) {
        trackWrapper.classList.remove('is-dragging');
      }

      // Add gentle momentum damping if dragged with speed
      if (hasDragged && Math.abs(velocityX) > 2 && st) {
        const trackTravel = Math.abs(getScrollAmount());
        const scrollRange = st.end - st.start;
        const ratio = trackTravel > 0 ? scrollRange / trackTravel : 1;
        const momentumDelta = -velocityX * ratio * 6;
        const targetScroll = Math.max(st.start, Math.min(st.end, window.scrollY + momentumDelta));

        const lenis = getLenis();
        if (lenis) {
          lenis.scrollTo(targetScroll, { duration: 0.6, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
        }
      }
    };

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      isDown = true;
      hasDragged = false;
      startX = e.pageX;
      lastX = e.pageX;
      velocityX = 0;
      startScrollY = window.scrollY;
      if (trackWrapper) {
        trackWrapper.classList.add('is-dragging');
      }
      window.addEventListener('mousemove', onMouseMove, { passive: false });
      window.addEventListener('mouseup', onMouseUp);
    };

    const onClickCapture = (e) => {
      if (hasDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    if (trackWrapper) {
      trackWrapper.addEventListener('mousedown', onMouseDown);
      trackWrapper.addEventListener('click', onClickCapture, true);
    }

    updateCenterFocus(0);

    return () => {
      if (scrollTween.scrollTrigger) {
        scrollTween.scrollTrigger.kill();
      }
      scrollTween.kill();
      gsap.set(track, { clearProps: "all" });

      if (trackWrapper) {
        trackWrapper.removeEventListener('mousedown', onMouseDown);
        trackWrapper.removeEventListener('click', onClickCapture, true);
        trackWrapper.classList.remove('is-dragging');
      }
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  });

  // 2. Mobile / Tablet (<= 768px): Native touch swipe & scroll-snap
  mm.add("(max-width: 768px)", () => {
    gsap.set(track, { clearProps: "all" });
    slides.forEach((slide) => slide.classList.add('is-active'));

    if (trackWrapper) {
      const onMobileScroll = () => {
        const maxScroll = trackWrapper.scrollWidth - trackWrapper.clientWidth;
        if (maxScroll > 0 && progressBar) {
          const progress = Math.min(1, Math.max(0, trackWrapper.scrollLeft / maxScroll));
          progressBar.style.width = `${Math.round(progress * 100)}%`;
        }
      };

      trackWrapper.addEventListener('scroll', onMobileScroll, { passive: true });
      onMobileScroll();

      return () => {
        trackWrapper.removeEventListener('scroll', onMobileScroll);
      };
    }
  });
}
