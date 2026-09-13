import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { scrollToSection } from '../core/lenis.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Coordinates Timeline Stages 1 to 4 with Three.js WebGL SceneManager and HUD Readouts
 */
export function initTimeline(sceneManager) {
  const stageHud = document.getElementById('stage-hud');
  const stageCode = document.getElementById('stage-code');
  const stageTitle = document.getElementById('stage-title');
  const stageDesc = document.getElementById('stage-desc');
  const stageStatusVal = document.getElementById('stage-status-val');
  const stageMassVal = document.getElementById('stage-mass-val');
  const stageProgressBar = document.getElementById('stage-progress-bar');
  const stagePills = document.querySelectorAll('.stage-pill');

  const headerPhaseText = document.getElementById('header-phase-text');
  const headerElevation = document.getElementById('header-elevation');

  // Stage configuration data
  const stagesData = [
    {
      code: 'PHASE-01/04',
      title: 'BLUEPRINT RECONNAISSANCE',
      desc: 'Floating volumetric wireframe grid establishing geotechnical coordinates and sub-surface load mapping.',
      status: 'WIREFRAME SCHEMATIC',
      mass: '0.00 TONNES',
      phaseText: '01 // BLUEPRINT RECON',
      elevation: 'EL +00.00m',
      targetSection: '#hero',
    },
    {
      code: 'PHASE-02/04',
      title: 'DEEP SUB-GRADE FOUNDATION',
      desc: 'Reinforced concrete pilings and seismic tension anchors driving -24m into bedrock with load-bearing grade beams.',
      status: 'SUBTERRANEAN PILINGS',
      mass: '14,280 TONNES',
      phaseText: '02 // FOUNDATION SUBGRADE',
      elevation: 'EL -24.50m',
      targetSection: '#foundation-stage',
    },
    {
      code: 'PHASE-03/04',
      title: 'SUPERSTRUCTURE & CANTILEVER',
      desc: 'Grade S355 vertical steel columns erect, cantilever floor slabs lock into position with dampening, and acoustic glass facade modules snap in.',
      status: 'LATTICE & SLABS ACTIVE',
      mass: '58,400 TONNES',
      phaseText: '03 // SUPERSTRUCTURE STEEL',
      elevation: 'EL +84.20m',
      targetSection: '#structure-stage',
    },
    {
      code: 'PHASE-04/04',
      title: 'COMMISSIONING & RESOLUTION',
      desc: 'Wireframe dissolves into fully lit architectural monolithic tower. Solar-reflective glazing, atrium illumination, and rooftop aviation beacon activate.',
      status: '100% COMMISSIONED',
      mass: '82,600 TONNES',
      phaseText: '04 // FINISHED MONOLITH',
      elevation: 'EL +168.40m',
      targetSection: '#reveal-stage',
    },
  ];

  let currentStageIndex = 0;

  function updateHUD(stageIdx, progress) {
    if (stageIdx !== currentStageIndex) {
      currentStageIndex = stageIdx;
      const data = stagesData[stageIdx];

      if (stageCode) stageCode.textContent = data.code;
      if (stageTitle) stageTitle.textContent = data.title;
      if (stageDesc) stageDesc.textContent = data.desc;
      if (stageStatusVal) stageStatusVal.textContent = data.status;
      if (stageMassVal) stageMassVal.textContent = data.mass;
      if (headerPhaseText) headerPhaseText.textContent = data.phaseText;
      if (headerElevation) headerElevation.textContent = data.elevation;

      stagePills.forEach((pill, idx) => {
        if (idx === stageIdx) {
          pill.classList.add('active');
        } else {
          pill.classList.remove('active');
        }
      });
    }

    if (stageProgressBar) {
      stageProgressBar.style.width = `${Math.round(progress * 100)}%`;
    }
  }

  // Master ScrollTrigger for Construction Stages (pins or scrubs from #hero to #reveal-stage)
  ScrollTrigger.create({
    trigger: '#hero',
    endTrigger: '#reveal-stage',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.4,
    onUpdate: (self) => {
      const p = self.progress;

      // Pass progress to 3D SceneManager
      sceneManager.setTimelineProgress(p);

      // Determine active stage
      let stageIdx = 0;
      if (p < 0.22) stageIdx = 0;
      else if (p < 0.50) stageIdx = 1;
      else if (p < 0.78) stageIdx = 2;
      else stageIdx = 3;

      updateHUD(stageIdx, p);
    },
  });

  // Hide Stage HUD when user scrolls into Services / Projects / Contact
  ScrollTrigger.create({
    trigger: '#services-section',
    start: 'top 70%',
    onEnter: () => {
      if (stageHud) stageHud.classList.add('is-hidden');
    },
    onLeaveBack: () => {
      if (stageHud) stageHud.classList.remove('is-hidden');
    },
  });

  // Stage Quick-Jumper Buttons
  stagePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const stageIdx = parseInt(pill.getAttribute('data-stage'), 10);
      if (stagesData[stageIdx]) {
        scrollToSection(stagesData[stageIdx].targetSection);
      }
    });
  });

  // Hero Scroll-Down Prompt Click
  const heroPrompt = document.getElementById('hero-scroll-prompt');
  if (heroPrompt) {
    heroPrompt.addEventListener('click', () => {
      scrollToSection('#foundation-stage');
    });
  }

  // Stage HUD Mobile Collapse / Expand Toggle
  const hudToggleBtn = document.getElementById('hud-toggle-btn');
  if (hudToggleBtn && stageHud) {
    hudToggleBtn.addEventListener('click', () => {
      const isCollapsed = stageHud.classList.toggle('is-collapsed');
      hudToggleBtn.textContent = isCollapsed ? '+' : '−';
      hudToggleBtn.setAttribute('aria-label', isCollapsed ? 'Expand Stage Details' : 'Collapse Stage Details');
    });

    // Default to collapsed on small mobile screens
    if (window.innerWidth <= 768) {
      stageHud.classList.add('is-collapsed');
      hudToggleBtn.textContent = '+';
    }
  }

  // Floating Back to Top button
  const scrollTopBtn = document.getElementById('scroll-to-top-btn');
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      scrollToSection('#hero');
    });
  }
}
