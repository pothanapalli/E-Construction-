import * as THREE from 'three';
import { BuildingModel } from './BuildingModel.js';

/**
 * SceneManager: Handles WebGL Renderer, Camera Waypoints, Damped Mouse Parallax, and Cinematic Orbit
 */
export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // 1. Scene & Fog Setup (Dark Warm Architectural Base: #1E1C1A)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1E1C1A);
    this.scene.fog = new THREE.FogExp2(0x1E1C1A, 0.007);

    // 2. Camera Setup with Portrait-Adaptive Framing
    this.isMobile = window.innerWidth <= 768 || ('ontouchstart' in window);
    const initialAspect = this.width / this.height;
    const initialFov = initialAspect < 1.0 
      ? Math.min(62, Math.max(50, 42 / initialAspect * 0.58))
      : 42;
    this.camera = new THREE.PerspectiveCamera(initialFov, initialAspect, 0.5, 300);
    this.camera.position.set(38, 22, 38);

    // Camera target vector
    this.target = new THREE.Vector3(0, 10, 0);
    this.currentTarget = new THREE.Vector3(0, 10, 0);

    // Damped camera positions
    this.camCurrentPos = new THREE.Vector3(38, 22, 38);
    this.camTargetPos = new THREE.Vector3(38, 22, 38);

    // 3. WebGL Renderer with performance caps
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    this.renderer.setSize(this.width, this.height);
    // CRITICAL: Cap devicePixelRatio at 1.5 on mobile, 2.0 on desktop
    const initialMaxDpr = this.isMobile ? 1.5 : 2.0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, initialMaxDpr));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 4. Procedural Building Model with mobile structural weight adaptation
    this.building = new BuildingModel(this.scene, this.isMobile);

    // Mouse Tracking (lerped)
    this.mouseTarget = { x: 0, y: 0 };
    this.mouseCurrent = { x: 0, y: 0 };
    this.MOUSE_LERP = 0.12; // Fast, responsive mouse tracking

    // Construction scrub state (0 to 1)
    this.scrubProgress = 0;
    this.activeStage = 0;

    // Cinematic Orbit state (active during Stage 4)
    this.orbitAngle = 0;
    this.isCinematicOrbit = false;

    // Performance & Tab Visibility state
    this.isVisible = true;
    this.rafId = null;
    this.clock = new THREE.Clock();

    this.bindEvents();
    this.startLoop();
  }

  bindEvents() {
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.onResize(), 200);
    });

    if (!this.isMobile) {
      window.addEventListener('mousemove', this.onMouseMove.bind(this));
    } else {
      this.bindMobileSensors();
    }

    // Performance requirement: Pause/reduce rendering when tab is hidden
    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
      if (this.isVisible) {
        this.clock.start();
        this.startLoop();
      } else {
        if (this.rafId) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
      }
    });
  }

  bindMobileSensors() {
    // Gyroscope tilt support if available and permission granted
    const handleOrientation = (e) => {
      if (e.gamma !== null && e.beta !== null) {
        const x = Math.max(-1, Math.min(1, e.gamma / 25));
        const y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
        this.mouseTarget.x = x * 0.6;
        this.mouseTarget.y = -y * 0.4;
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    }

    // Scroll-driven subtle tilt fallback for mobile
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const scrollDelta = (scrollY - lastScrollY) * 0.003;
      this.mouseTarget.y = Math.max(-0.5, Math.min(0.5, this.mouseTarget.y + scrollDelta));
      lastScrollY = scrollY;
    }, { passive: true });
  }

  onResize() {
    this.isMobile = window.innerWidth <= 768 || ('ontouchstart' in window);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const aspect = this.width / this.height;
    this.camera.aspect = aspect;
    // Portrait recalculation: expand vertical FOV so the tower width fills ~65-75% of mobile screen
    if (aspect < 1.0) {
      this.camera.fov = Math.min(62, Math.max(50, 42 / aspect * 0.58));
    } else {
      this.camera.fov = 42;
    }
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
    const maxDpr = this.isMobile ? 1.5 : 2.0;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr));
    if (this.building && typeof this.building.setMobileMode === 'function') {
      this.building.setMobileMode(this.isMobile);
    }
    this.updateCameraWaypoints();
  }

  onMouseMove(e) {
    // Normalized device coordinates (-1 to 1)
    this.mouseTarget.x = (e.clientX / this.width) * 2 - 1;
    this.mouseTarget.y = -(e.clientY / this.height) * 2 + 1;
  }

  /**
   * Set timeline scrub progress (0.0 to 1.0)
   * Calculates camera position and building construction state
   */
  setTimelineProgress(progress) {
    this.scrubProgress = Math.max(0, Math.min(1, progress));
    this.building.setScrubProgress(this.scrubProgress);

    // Calculate active stage for HUD and camera waypoints
    // 0: Blueprint (0 - 0.22)
    // 1: Foundation (0.22 - 0.50)
    // 2: Structure (0.50 - 0.78)
    // 3: Finished Reveal (0.78 - 1.0)
    if (this.scrubProgress < 0.22) {
      this.activeStage = 0;
      this.isCinematicOrbit = false;
    } else if (this.scrubProgress < 0.50) {
      this.activeStage = 1;
      this.isCinematicOrbit = false;
    } else if (this.scrubProgress < 0.78) {
      this.activeStage = 2;
      this.isCinematicOrbit = false;
    } else {
      this.activeStage = 3;
      this.isCinematicOrbit = true;
    }

    this.updateCameraWaypoints();
  }

  /**
   * Interpolates camera positions across construction phases
   * Mobile portrait viewports use tighter distance scaling to frame the building heroically
   */
  updateCameraWaypoints() {
    const p = this.scrubProgress;
    const aspect = this.width / this.height;
    const isPortrait = aspect < 1.0;
    const distScale = isPortrait ? 0.74 : 1.0;
    const yOffset = isPortrait ? 2.5 : 0.0;

    if (p <= 0.25) {
      // Stage 1: Isometric Blueprint View
      const subP = p / 0.25;
      this.camTargetPos.set(
        (38 - subP * 6) * distScale,
        (22 - subP * 10) * distScale + yOffset,
        (38 - subP * 6) * distScale
      );
      this.target.set(0, 10 - subP * 6, 0);
    } else if (p <= 0.60) {
      // Stage 2: Low Subgrade View framing rising pilings & columns
      const subP = (p - 0.25) / 0.35;
      this.camTargetPos.set(
        (32 - subP * 4) * distScale,
        (12 + subP * 12) * distScale + yOffset,
        (32 + subP * 4) * distScale
      );
      this.target.set(0, 4 + subP * 8, 0);
    } else if (p <= 0.82) {
      // Stage 3: Superstructure cantilever angle
      const subP = (p - 0.60) / 0.22;
      this.camTargetPos.set(
        (28 + subP * 8) * distScale,
        (24 + subP * 4) * distScale + yOffset,
        (36 - subP * 2) * distScale
      );
      this.target.set(0, 12 + subP * 4, 0);
    } else {
      // Stage 4: Ready for cinematic orbit
      this.target.set(0, 15, 0);
    }
  }

  startLoop() {
    if (this.rafId) return;

    const render = () => {
      if (!this.isVisible) return;

      const delta = this.clock.getDelta();
      const elapsed = this.clock.getElapsedTime();

      // Damped mouse interpolation (lerp factor 0.06 - zero jitter)
      this.mouseCurrent.x += (this.mouseTarget.x - this.mouseCurrent.x) * this.MOUSE_LERP;
      this.mouseCurrent.y += (this.mouseTarget.y - this.mouseCurrent.y) * this.MOUSE_LERP;

      // Stage 4: Cinematic Orbit
      if (this.isCinematicOrbit) {
        this.orbitAngle += delta * 0.35; // Brisk, cinematic orbit
        const aspect = this.width / this.height;
        const orbitRadius = aspect < 1.0 ? 35 : 46;
        const orbitY = (22 + Math.sin(this.orbitAngle * 0.5) * 4) * (aspect < 1.0 ? 0.85 : 1.0);

        this.camTargetPos.set(
          Math.sin(this.orbitAngle) * orbitRadius,
          orbitY,
          Math.cos(this.orbitAngle) * orbitRadius
        );
      }

      // Parallax mouse offset applied to camera
      const parallaxX = this.mouseCurrent.x * 5;
      const parallaxY = this.mouseCurrent.y * 3.5;

      // Fast, smooth camera position interpolation
      this.camCurrentPos.lerp(this.camTargetPos, 0.16);
      this.currentTarget.lerp(this.target, 0.16);

      this.camera.position.x = this.camCurrentPos.x + parallaxX;
      this.camera.position.y = this.camCurrentPos.y + parallaxY;
      this.camera.position.z = this.camCurrentPos.z;

      this.camera.lookAt(this.currentTarget);

      // Update building micro-animations (beacon, lights)
      this.building.update(elapsed);

      // Render Three.js frame
      this.renderer.render(this.scene, this.camera);

      this.rafId = requestAnimationFrame(render);
    };

    this.rafId = requestAnimationFrame(render);
  }

  dispose() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    if (this.building) this.building.dispose();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }
  }
}
