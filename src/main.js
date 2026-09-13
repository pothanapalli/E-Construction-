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

  // 8. Bind Smooth Navigation Links
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href && href !== '#') {
        e.preventDefault();
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
