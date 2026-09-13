import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Section 6: Projects Portfolio
 * Horizontal scroll gallery with GSAP ScrollTrigger pinning and center-focus scale/blur
 */
export function initProjects() {
  const section = document.getElementById('projects-section');
  const track = document.getElementById('projects-track');
  const slides = document.querySelectorAll('.project-slide');
  const progressBar = document.getElementById('gallery-progress-bar');

  if (!section || !track || !slides.length) return;

  // Calculate total horizontal scroll width
  function getScrollAmount() {
    const trackWidth = track.scrollWidth;
    const windowWidth = window.innerWidth;
    return -(trackWidth - windowWidth + 96); // 96px padding buffer
  }

  // Horizontal scrub tween
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
        // Update progress bar
        if (progressBar) {
          progressBar.style.width = `${Math.round(self.progress * 100)}%`;
        }
        updateCenterFocus();
      },
    },
  });

  // Calculate which card is closest to the center of the viewport
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

  // Initial check
  updateCenterFocus();

  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
    updateCenterFocus();
  });
}
