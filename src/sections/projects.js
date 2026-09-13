import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Section 6: Projects Portfolio
 * Responsive Gallery:
 * - Desktop (> 768px): Horizontal scroll scrub with GSAP ScrollTrigger pinning and center focus
 * - Mobile (<= 768px): Native touch swipe / snap carousel with live progress indicator (no vertical hijack)
 */
export function initProjects() {
  const section = document.getElementById('projects-section');
  const track = document.getElementById('projects-track');
  const trackWrapper = document.querySelector('.projects-track-wrapper');
  const slides = document.querySelectorAll('.project-slide');
  const progressBar = document.getElementById('gallery-progress-bar');

  if (!section || !track || !slides.length) return;

  const mm = gsap.matchMedia();

  // 1. Desktop (> 768px): GSAP ScrollTrigger pinned horizontal scrub
  mm.add("(min-width: 769px)", () => {
    function getScrollAmount() {
      const trackWidth = track.scrollWidth;
      const windowWidth = window.innerWidth;
      return -(trackWidth - windowWidth + 96); // 96px padding buffer
    }

    const scrollTween = gsap.to(track, {
      x: getScrollAmount,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        pin: true,
        scrub: 0.35,
        start: 'top top',
        end: () => `+=${track.scrollWidth - window.innerWidth + 600}`,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (progressBar) {
            progressBar.style.width = `${Math.round(self.progress * 100)}%`;
          }
          updateCenterFocus();
        },
      },
    });

    function updateCenterFocus() {
      const viewportCenterX = window.innerWidth / 2;
      let closestSlide = null;
      let minDistance = Infinity;

      slides.forEach((slide) => {
        const rect = slide.getBoundingClientRect();
        const slideCenterX = rect.left + rect.width / 2;
        const dist = Math.abs(viewportCenterX - slideCenterX);

        if (dist < minDistance) {
          minDistance = dist;
          closestSlide = slide;
        }
      });

      slides.forEach((slide) => {
        if (slide === closestSlide) {
          slide.classList.add('is-active');
        } else {
          slide.classList.remove('is-active');
        }
      });
    }

    updateCenterFocus();

    return () => {
      gsap.set(track, { clearProps: "all" });
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

  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
  });
}
