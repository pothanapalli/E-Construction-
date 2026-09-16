import * as THREE from 'three';

/**
 * Procedural Architectural Building Model
 * Dark warm charcoal, structural off-white steel, and terracotta architectural palette
 */
export class BuildingModel {
  constructor(scene, isMobile = false) {
    this.scene = scene;
    this.isMobile = isMobile;
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    // Sub-groups for distinct construction phases
    this.blueprintGridGroup = new THREE.Group();
    this.foundationGroup = new THREE.Group();
    this.structureGroup = new THREE.Group();
    this.facadeGroup = new THREE.Group();
    this.finishedDetailGroup = new THREE.Group();

    this.rootGroup.add(this.blueprintGridGroup);
    this.rootGroup.add(this.foundationGroup);
    this.rootGroup.add(this.structureGroup);
    this.rootGroup.add(this.facadeGroup);
    this.rootGroup.add(this.finishedDetailGroup);

    // Track animatable elements
    this.pilings = [];
    this.columns = [];
    this.slabs = [];
    this.facadePanels = [];
    this.wireframeMaterials = [];
    this.solidMaterials = [];

    // Lighting specific to the building
    this.interiorLights = [];
    this.beaconLight = null;

    this.buildBlueprintGrid();
    this.buildFoundation();
    this.buildSuperstructure();
    this.buildFacade();
    this.buildFinishedDetails();
    this.setupLighting();

    // Apply mobile visual weight scaling
    this.applyMobileWeight();

    // Initial construction state: hero wireframe view
    this.setScrubProgress(0);
  }

  setMobileMode(isMobile) {
    if (this.isMobile === isMobile) return;
    this.isMobile = isMobile;
    this.applyMobileWeight();
  }

  applyMobileWeight() {
    const colScale = this.isMobile ? 1.45 : 1.0;
    const slabHeightScale = this.isMobile ? 1.4 : 1.0;
    const pilingScale = this.isMobile ? 1.35 : 1.0;
    const coreScale = this.isMobile ? 1.3 : 1.0;

    this.columns.forEach((col) => {
      col.mesh.scale.x = colScale;
      col.mesh.scale.z = colScale;
    });

    this.slabs.forEach((slab) => {
      slab.mesh.scale.y = slabHeightScale;
    });

    this.pilings.forEach((item) => {
      item.group.scale.x = pilingScale;
      item.group.scale.z = pilingScale;
    });

    if (this.coreMesh) {
      this.coreMesh.scale.x = coreScale;
      this.coreMesh.scale.z = coreScale;
    }
  }

  /**
   * Stage 1: Architectural Drafting Grid & Geotechnical Excavation Guides
   */
  buildBlueprintGrid() {
    // Ground drafting grid: Accent #C1602E & Soft warm stone hairline #8C8478 (clearly visible on #1E1C1A)
    const gridHelper = new THREE.GridHelper(60, 30, 0xC1602E, 0x8C8478);
    gridHelper.position.y = -0.05;
    this.blueprintGridGroup.add(gridHelper);

    // Sub-grade excavation boundary box (soft warm stone wireframe #8C8478)
    const boxGeo = new THREE.BoxGeometry(28, 8, 28);
    const boxEdges = new THREE.EdgesGeometry(boxGeo);
    const boxMat = new THREE.LineBasicMaterial({
      color: 0x8C8478,
      transparent: true,
      opacity: 0.85,
    });
    const subgradeBox = new THREE.LineSegments(boxEdges, boxMat);
    subgradeBox.position.y = -4;
    this.blueprintGridGroup.add(subgradeBox);
    this.wireframeMaterials.push(boxMat);

    // Terracotta alignment axes in center (#C1602E)
    const crossGeo = new THREE.BufferGeometry();
    const crossVerts = new Float32Array([
      -18, 0, 0,  18, 0, 0,
      0, 0, -18,  0, 0, 18,
    ]);
    crossGeo.setAttribute('position', new THREE.BufferAttribute(crossVerts, 3));
    const crossMat = new THREE.LineBasicMaterial({ color: 0xC1602E, transparent: true, opacity: 0.85 });
    const crossLines = new THREE.LineSegments(crossGeo, crossMat);
    this.blueprintGridGroup.add(crossLines);
  }

  /**
   * Stage 2: Deep Foundation Pilings & Ground Beams
   */
  buildFoundation() {
    const pilingGeo = new THREE.CylinderGeometry(0.65, 0.65, 14, 8);
    const footingGeo = new THREE.BoxGeometry(2.6, 1.8, 2.6);

    // Soft warm stone solid tone (#9E9689) - lit and physical against #1E1C1A base
    const foundationMat = new THREE.MeshStandardMaterial({
      color: 0x9E9689,
      roughness: 0.65,
      metalness: 0.2,
      wireframe: false,
    });
    this.solidMaterials.push(foundationMat);

    // Soft warm stone edge wireframe (#8C8478)
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x8C8478,
      transparent: true,
      opacity: 0.85,
    });
    this.wireframeMaterials.push(wireMat);

    const footingEdges = new THREE.EdgesGeometry(footingGeo);

    // Grid coordinates of 16 foundation pilings
    const coords = [
      [-9, -9], [-3, -9], [3, -9], [9, -9],
      [-9, -3], [-3, -3], [3, -3], [9, -3],
      [-9,  3], [-3,  3], [3,  3], [9,  3],
      [-9,  9], [-3,  9], [3,  9], [9,  9],
    ];

    coords.forEach(([x, z], idx) => {
      const group = new THREE.Group();
      group.position.set(x, 0, z);

      // Piling
      const mesh = new THREE.Mesh(pilingGeo, foundationMat);
      mesh.position.y = -7;
      group.add(mesh);

      // Footing pad
      const footingMesh = new THREE.Mesh(footingGeo, foundationMat);
      footingMesh.position.y = 0.9;
      group.add(footingMesh);

      // Wireframe overlay for blueprint drafting line
      const wire = new THREE.LineSegments(footingEdges, wireMat);
      wire.position.y = 0.9;
      group.add(wire);

      this.foundationGroup.add(group);

      this.pilings.push({
        group,
        baseY: 0,
        startY: -16 - (idx % 4) * 2,
      });
    });

    // Subgrade tie beams
    const tieGeoX = new THREE.BoxGeometry(20, 0.9, 0.9);
    const tieGeoZ = new THREE.BoxGeometry(0.9, 0.9, 20);
    const tieEdgesX = new THREE.EdgesGeometry(tieGeoX);
    const tieEdgesZ = new THREE.EdgesGeometry(tieGeoZ);

    [-6, 0, 6].forEach((pos) => {
      const bx = new THREE.Mesh(tieGeoX, foundationMat);
      bx.position.set(0, 0.5, pos);
      const bxW = new THREE.LineSegments(tieEdgesX, wireMat);
      bx.add(bxW);
      this.foundationGroup.add(bx);

      const bz = new THREE.Mesh(tieGeoZ, foundationMat);
      bz.position.set(pos, 0.5, 0);
      const bzW = new THREE.LineSegments(tieEdgesZ, wireMat);
      bz.add(bzW);
      this.foundationGroup.add(bz);
    });
  }

  /**
   * Stage 3: Superstructure (Columns, Cantilevers, Floor Slabs)
   */
  buildSuperstructure() {
    // 1. Central Shear Core (Soft warm stone tone: #9E9689)
    const coreGeo = new THREE.BoxGeometry(6.5, 28, 6.5);
    const coreEdges = new THREE.EdgesGeometry(coreGeo);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x9E9689,
      roughness: 0.65,
      metalness: 0.2,
    });
    this.solidMaterials.push(coreMat);

    const wireMat = new THREE.LineBasicMaterial({
      color: 0x8C8478,
      transparent: true,
      opacity: 0.85,
    });
    this.wireframeMaterials.push(wireMat);

    this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.coreMesh.position.y = 14;
    const coreWire = new THREE.LineSegments(coreEdges, wireMat);
    this.coreMesh.add(coreWire);
    this.structureGroup.add(this.coreMesh);

    // 2. Structural Steel Columns (Warm Sandstone / Limestone tone: #B0A896 - distinct from text #EDEAE4)
    const colGeo = new THREE.BoxGeometry(0.85, 26, 0.85);
    const colEdges = new THREE.EdgesGeometry(colGeo);
    const colMat = new THREE.MeshStandardMaterial({
      color: 0xB0A896,
      metalness: 0.5,
      roughness: 0.4,
    });
    this.solidMaterials.push(colMat);

    const colPositions = [
      [-8, -8], [8, -8], [-8, 8], [8, 8],
      [0, -8], [0, 8], [-8, 0], [8, 0],
    ];

    colPositions.forEach(([x, z], i) => {
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(x, 13, z);
      const colWire = new THREE.LineSegments(colEdges, wireMat);
      col.add(colWire);
      this.structureGroup.add(col);

      this.columns.push({
        mesh: col,
        targetY: 13,
        startY: -10,
        delay: i * 0.04,
      });
    });

    // 3. Multi-Tier Floor Slabs (Soft warm stone slabs: #9E9689)
    const slabLevels = [
      { y: 2,  w: 18, d: 18, cantilever: 0 },
      { y: 6,  w: 18, d: 18, cantilever: 0 },
      { y: 10, w: 22, d: 18, cantilever: 4 }, // Cantilever projection on West
      { y: 14, w: 22, d: 18, cantilever: 4 },
      { y: 18, w: 18, d: 22, cantilever: 4 }, // Cantilever projection on North
      { y: 22, w: 18, d: 18, cantilever: 0 },
      { y: 26, w: 14, d: 14, cantilever: 0 }, // Stepped penthouse roof
    ];

    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x9E9689,
      roughness: 0.6,
      metalness: 0.25,
    });
    this.solidMaterials.push(slabMat);

    slabLevels.forEach((lvl, idx) => {
      const slabGeo = new THREE.BoxGeometry(lvl.w, 0.9, lvl.d);
      const slabEdges = new THREE.EdgesGeometry(slabGeo);

      const slabMesh = new THREE.Mesh(slabGeo, slabMat);
      slabMesh.position.set(lvl.cantilever ? lvl.cantilever / 2 : 0, lvl.y, 0);

      const slabWire = new THREE.LineSegments(slabEdges, wireMat);
      slabMesh.add(slabWire);
      this.structureGroup.add(slabMesh);

      this.slabs.push({
        mesh: slabMesh,
        targetY: lvl.y,
        startY: lvl.y + 15 + idx * 3, // Dropping from above with overshoot
        targetScale: 1,
        delay: idx * 0.08,
      });
    });

    // 4. Diagonal Structural Wind-Bracing (Burnt terracotta: #C1602E)
    const braceMat = new THREE.LineBasicMaterial({
      color: 0xC1602E,
      transparent: true,
      opacity: 0.9,
    });
    this.wireframeMaterials.push(braceMat);

    const braceGeo = new THREE.BufferGeometry();
    const braceVerts = [];
    [2, 6, 10, 14, 18, 22].forEach((y) => {
      braceVerts.push(-8, y, -8, 0, y + 4, -8);
      braceVerts.push(0, y + 4, -8, 8, y, -8);
      braceVerts.push(-8, y, 8, 0, y + 4, 8);
      braceVerts.push(0, y + 4, 8, 8, y, 8);
    });
    braceGeo.setAttribute('position', new THREE.Float32BufferAttribute(braceVerts, 3));
    this.bracingLines = new THREE.LineSegments(braceGeo, braceMat);
    this.structureGroup.add(this.bracingLines);
  }

  /**
   * Stage 3 & 4: Facade Panels (Architectural Solar Glazing)
   */
  buildFacade() {
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x9E9689, // Warm architectural stone tint
      metalness: 0.25,
      roughness: 0.2,
      transmission: 0.45,
      transparent: true,
      opacity: 0.35,
      reflectivity: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    this.glassMaterial = glassMat;
    this.solidMaterials.push(glassMat);

    const mullionMat = new THREE.MeshStandardMaterial({
      color: 0xB0A896, // Warm sandstone mullions
      metalness: 0.5,
      roughness: 0.4,
    });
    this.solidMaterials.push(mullionMat);

    // 4 curtain wall facades around the tower
    const facades = [
      { w: 17.6, h: 22, rotY: 0, pos: [0, 14, 8.8] },
      { w: 17.6, h: 22, rotY: Math.PI, pos: [0, 14, -8.8] },
      { w: 17.6, h: 22, rotY: Math.PI / 2, pos: [8.8, 14, 0] },
      { w: 17.6, h: 22, rotY: -Math.PI / 2, pos: [-8.8, 14, 0] },
    ];

    facades.forEach((f, idx) => {
      const panelGroup = new THREE.Group();
      panelGroup.position.set(f.pos[0], f.pos[1], f.pos[2]);
      panelGroup.rotation.y = f.rotY;

      // Glass Plane
      const glassGeo = new THREE.PlaneGeometry(f.w, f.h, 4, 5);
      const glassMesh = new THREE.Mesh(glassGeo, glassMat);
      panelGroup.add(glassMesh);

      // Mullion Wire Edges (Soft warm stone line: #8C8478)
      const edges = new THREE.EdgesGeometry(glassGeo);
      const edgeMat = new THREE.LineBasicMaterial({
        color: 0x8C8478,
        transparent: true,
        opacity: 0.75,
      });
      const edgeLines = new THREE.LineSegments(edges, edgeMat);
      panelGroup.add(edgeLines);
      this.wireframeMaterials.push(edgeMat);

      this.facadeGroup.add(panelGroup);

      this.facadePanels.push({
        group: panelGroup,
        targetScale: 1,
        delay: idx * 0.1,
      });
    });
  }

  /**
   * Stage 4: Finished Details (Rooftop Mast, Helipad, Terracotta Beacon)
   */
  buildFinishedDetails() {
    // Rooftop Antenna Mast (Warm sand steel: #B0A896)
    const mastGeo = new THREE.CylinderGeometry(0.15, 0.4, 9, 8);
    const mastMat = new THREE.MeshStandardMaterial({
      color: 0xB0A896,
      metalness: 0.6,
      roughness: 0.35,
    });
    this.solidMaterials.push(mastMat);

    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0, 31, 0);
    this.finishedDetailGroup.add(mast);

    // Helipad ring (Burnt terracotta: #C1602E)
    const ringGeo = new THREE.RingGeometry(3.5, 4.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xC1602E,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(0, 26.5, 0);
    this.finishedDetailGroup.add(ringMesh);

    // Aviation Warning Beacon (Burnt terracotta: #C1602E)
    const beaconGeo = new THREE.SphereGeometry(0.45, 8, 8);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xC1602E });
    this.beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    this.beaconMesh.position.set(0, 35.5, 0);
    this.finishedDetailGroup.add(this.beaconMesh);

    this.beaconLight = new THREE.PointLight(0xC1602E, 2.5, 35);
    this.beaconLight.position.set(0, 35.5, 0);
    this.finishedDetailGroup.add(this.beaconLight);

    // Finished details start hidden
    this.finishedDetailGroup.visible = false;
  }

  /**
   * Setup Scene Lighting with Warm Architectural Sunlight
   */
  setupLighting() {
    // 1. Soft warm ambient fill (#E6DFD5) - ensures unlit undersides retain warm tone
    this.ambientLight = new THREE.AmbientLight(0xE6DFD5, 1.3);
    this.scene.add(this.ambientLight);

    // 2. Main Key Light: Warm architectural sunlight (#F5EDE2)
    this.keyLight = new THREE.DirectionalLight(0xF5EDE2, 2.4);
    this.keyLight.position.set(32, 48, 28);
    this.keyLight.castShadow = true;
    this.scene.add(this.keyLight);

    // 3. Soft Rim Light: Warm amber/sand highlight (#E2D5C3) angled from the back-left
    // Catches silhouette edges of slabs, columns, and rooftop to separate from #1E1C1A background
    this.rimLight = new THREE.DirectionalLight(0xE2D5C3, 1.9);
    this.rimLight.position.set(-28, 22, -28);
    this.scene.add(this.rimLight);

    // 4. Upward Bounce Light: Warm ground fill (#C4B8A5)
    // Illuminates rising foundation pilings and subgrade tie beams
    this.bounceLight = new THREE.DirectionalLight(0xC4B8A5, 0.7);
    this.bounceLight.position.set(10, -18, 10);
    this.scene.add(this.bounceLight);

    // 5. Interior Warm Atrium Glow
    const interiorLight1 = new THREE.PointLight(0xC1602E, 0, 20);
    interiorLight1.position.set(0, 10, 0);
    this.scene.add(interiorLight1);
    this.interiorLights.push(interiorLight1);

    const interiorLight2 = new THREE.PointLight(0xD4C4B0, 0, 25);
    interiorLight2.position.set(0, 20, 0);
    this.scene.add(interiorLight2);
    this.interiorLights.push(interiorLight2);
  }

  /**
   * Update Construction Scrub Progress (0.0 to 1.0)
   */
  setScrubProgress(progress) {
    const p = Math.max(0, Math.min(1, progress));

    // -------------------------------------------------------------
    // STAGE 1 -> 2: FOUNDATION (Progress 0.00 to 0.35)
    // -------------------------------------------------------------
    const foundationP = Math.min(1, Math.max(0, p / 0.35));
    const pilingScale = this.isMobile ? 1.35 : 1.0;
    this.pilings.forEach((item, idx) => {
      const staggeredP = Math.min(1, Math.max(0, (foundationP - (idx % 4) * 0.08) / 0.7));
      const ease = 1 - Math.pow(1 - staggeredP, 3);
      item.group.position.y = item.startY + (item.baseY - item.startY) * ease;
      item.group.scale.set(pilingScale, 1.0, pilingScale);
    });

    // -------------------------------------------------------------
    // STAGE 2 -> 3: STRUCTURE & SLABS (Progress 0.25 to 0.70)
    // -------------------------------------------------------------
    const structP = Math.min(1, Math.max(0, (p - 0.22) / 0.48));

    // Core height scaling
    if (this.coreMesh) {
      const coreEase = Math.min(1, structP * 1.5);
      const coreScale = this.isMobile ? 1.3 : 1.0;
      this.coreMesh.scale.set(coreScale, Math.max(0.01, coreEase), coreScale);
      this.coreMesh.position.y = 14 * coreEase;
    }

    // Columns rising with mobile thickness reinforcement
    const colThickness = this.isMobile ? 1.45 : 1.0;
    this.columns.forEach((col) => {
      const colLocalP = Math.min(1, Math.max(0, (structP - col.delay) / (1 - col.delay)));
      const ease = 1 - Math.pow(1 - colLocalP, 3);
      col.mesh.position.y = col.startY + (col.targetY - col.startY) * ease;
      col.mesh.scale.set(colThickness, Math.max(0.01, ease), colThickness);
    });

    // Floor slabs dropping with spring-like overshoot
    const slabHeightScale = this.isMobile ? 1.4 : 1.0;
    this.slabs.forEach((slab) => {
      const slabLocalP = Math.min(1, Math.max(0, (structP - slab.delay) / (1 - slab.delay)));
      if (slabLocalP <= 0) {
        slab.mesh.scale.set(0.01, 0.01, 0.01);
        slab.mesh.position.y = slab.startY;
      } else {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        const overshootP = 1 + c3 * Math.pow(slabLocalP - 1, 3) + c1 * Math.pow(slabLocalP - 1, 2);
        
        slab.mesh.position.y = slab.startY + (slab.targetY - slab.startY) * slabLocalP;
        const s = Math.max(0.01, Math.min(1.15, overshootP));
        slab.mesh.scale.set(s, slabHeightScale, s);
      }
    });

    // Facade glass panels snapping into place
    this.facadePanels.forEach((panel) => {
      const facadeLocalP = Math.min(1, Math.max(0, (structP - 0.4 - panel.delay) / 0.5));
      const s = Math.min(1, Math.max(0.001, facadeLocalP));
      panel.group.scale.set(s, s, s);
    });

    // -------------------------------------------------------------
    // STAGE 3 -> 4: FINISHED BUILDING REVEAL (Progress 0.65 to 1.00)
    // -------------------------------------------------------------
    const revealP = Math.min(1, Math.max(0, (p - 0.65) / 0.35));

    // Crossfade wireframe lines into solid architectural surfaces
    const wireOpacity = 0.85 * (1 - revealP * 0.7);
    this.wireframeMaterials.forEach((mat) => {
      mat.opacity = wireOpacity;
    });

    // Glass transparency and reflectivity
    if (this.glassMaterial) {
      this.glassMaterial.opacity = 0.2 + revealP * 0.65;
      this.glassMaterial.roughness = 0.3 - revealP * 0.18;
    }

    // Interior atrium floor lighting
    this.interiorLights.forEach((light) => {
      light.intensity = revealP * 2.2;
    });

    // Keylight becomes brighter for final reveal
    this.keyLight.intensity = 2.0 + revealP * 1.0;

    // Show rooftop finished details
    this.finishedDetailGroup.visible = revealP > 0.4;
    this.finishedDetailGroup.position.y = (1 - revealP) * 5;
  }

  /**
   * Per-frame tick for dynamic micro-animations (aviation beacon)
   */
  update(time) {
    if (this.beaconLight && this.beaconMesh) {
      const flash = Math.sin(time * 6) > 0.3 ? 1 : 0.15;
      this.beaconLight.intensity = flash * 2.5;
      this.beaconMesh.material.color.setHex(flash > 0.5 ? 0xC1602E : 0x8C8478);
    }
  }

  /**
   * Clean disposal to prevent memory leaks
   */
  dispose() {
    this.rootGroup.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    this.scene.remove(this.rootGroup);
    if (this.ambientLight) this.scene.remove(this.ambientLight);
    if (this.keyLight) this.scene.remove(this.keyLight);
    if (this.rimLight) this.scene.remove(this.rimLight);
    if (this.bounceLight) this.scene.remove(this.bounceLight);
    this.interiorLights.forEach((l) => this.scene.remove(l));
  }
}
