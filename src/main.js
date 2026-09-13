import './styles/index.css';
import { initLenis, scrollToSection } from './core/lenis.js';
import { initCursor } from './core/cursor.js';
import { SceneManager } from './webgl/SceneManager.js';
import { initPreloader } from './components/Preloader.js';
import { initTimeline } from './sections/timeline.js';
import { initServices } from './sections/services.js';
import { initProjects } from './sections/projects.js';
import { initContact } from './sections/contact.js';

/**
 * Main Application Orchestrator for E Construction
 * Initializes Smooth Scroll, 3D WebGL Scene, GSAP Timelines, Cursor, and Interactive Sections
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Lenis Smooth Scroll
  const lenis = initLenis();

  // 2. Initialize Damped Custom Cursor & Crane Hook Physics
  const cursorSystem = initCursor();

  // 3. Initialize Three.js WebGL Scene Canvas
  const canvas = document.getElementById('webgl-canvas');
  let sceneManager = null;
  if (canvas) {
    sceneManager = new SceneManager(canvas);
  }

  // 4. Initialize Construction Timeline (Stages 1–4)
  if (sceneManager) {
    initTimeline(sceneManager);
  }

  // 5. Initialize Section 5: Services (3D Tilt & Material Swapping)
  initServices();

  // 6. Initialize Section 6: Projects Portfolio (Horizontal Pinned Scroll)
  initProjects();

  // 7. Initialize Section 7: Contact Form & Crane Hook CTA
  initContact();

  // 8. Bind Mobile Navigation Drawer & Smooth Links
  const mobileNavToggle = document.getElementById('mobile-nav-toggle');
  const siteNav = document.getElementById('site-nav');

  function closeMobileNav() {
    if (siteNav && mobileNavToggle) {
      siteNav.classList.remove('is-open');
      mobileNavToggle.classList.remove('is-active');
      mobileNavToggle.setAttribute('aria-expanded', 'false');
    }
  }

  if (mobileNavToggle && siteNav) {
    mobileNavToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = siteNav.classList.toggle('is-open');
      mobileNavToggle.classList.toggle('is-active', isOpen);
      mobileNavToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (siteNav.classList.contains('is-open') && !siteNav.contains(e.target) && !mobileNavToggle.contains(e.target)) {
        closeMobileNav();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileNav();
    });
  }

  // Bind Smooth Navigation Links & auto-close mobile nav
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href !== '#') {
        e.preventDefault();
        closeMobileNav();
        scrollToSection(href);
      }
    });
  });

  // 9. Initialize Preloader
  initPreloader(() => {
    console.log('[E Construction] System Initialized: 60FPS WebGL & Motion Ready.');
    if (cursorSystem) {
      cursorSystem.refreshHoverables();
    }
  });
});
