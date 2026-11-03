/**
 * NovaEngine 3D - High-End Unreal Engine 4 Rendering Pipeline
 * Integrates UnrealBloomPass, PBR Procedural Textures, Sci-Fi Character Mesh,
 * Atmospheric Nebula Sky, Soft Cascaded Shadows & 3D Transform Gizmos
 */
class Renderer3D {
  constructor(canvasElement, engine) {
    this.canvas = canvasElement;
    this.engine = engine;

    // Viewport Modes
    this.viewMode = 'lit'; // 'lit', 'unlit', 'wireframe'
    this.showGrid = true;
    this.showShadows = true;
    this.enableBloom = true;

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.composer = null;
    this.bloomPass = null;
    this.orbitControls = null;
    this.transformControls = null;

    // Lighting & Environment
    this.dirLight = null;
    this.rimLight = null;
    this.hemiLight = null;
    this.gridHelper = null;
    this.meshMap = new Map();

    // Procedural Texture Cache
    this.textures = {};

    // Freefly Camera State
    this.isFreeflying = false;
    this.cameraSpeed = 14.0;
    this.freeflyKeys = {};

    this.initScene();
  }

  initScene() {
    // 1. Scene & Unreal Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0a0d17');
    this.scene.fog = new THREE.FogExp2('#0a0d17', 0.010);

    // 2. Camera Setup (UE4 Field of View & Cinematic Angle)
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight || 16 / 9;
    this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 1000);
    this.camera.position.set(0, 8, 16);

    // 3. WebGL Renderer with High-End UE4 Settings
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. UnrealBloomPass Post-Processing Pipeline
    this.setupPostProcessing();

    // 5. Procedural Textures & Normal Maps for Materials
    this.generateProceduralTextures();

    // 5b. High-End Image Based Lighting (IBL Environment Map)
    this.setupEnvironmentMap();

    // 6. Sky, Atmospheric Stars & Volumetric Dust Motes
    this.setupAtmosphere();

    // 7. Lighting Pipeline (Sun, Rim, Hemisphere)
    this.setupLighting();

    // 8. Unreal Floor Grid
    this.setupGrid();

    // 9. Camera Controls & 3D Gizmos
    this.setupControls();

    window.addEventListener('resize', () => this.onResize());
  }

  setupPostProcessing() {
    if (typeof THREE.EffectComposer !== 'undefined' && typeof THREE.UnrealBloomPass !== 'undefined') {
      const renderScene = new THREE.RenderPass(this.scene, this.camera);

      const width = this.canvas.clientWidth || window.innerWidth;
      const height = this.canvas.clientHeight || window.innerHeight;

      // UE4-grade bloom settings: elegant neon glow with crisp threshold
      this.bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(width, height),
        0.8,  // strength
        0.4,  // radius
        0.7   // threshold (only bright neon & glowing cores radiate bloom)
      );

      this.composer = new THREE.EffectComposer(this.renderer);
      this.composer.addPass(renderScene);
      this.composer.addPass(this.bloomPass);
    }
  }

  generateProceduralTextures() {
    // 1. Sci-Fi Hexagonal Cyber Floor Texture (Diffuse)
    const hexCanvas = document.createElement('canvas');
    hexCanvas.width = 512;
    hexCanvas.height = 512;
    const hctx = hexCanvas.getContext('2d');

    hctx.fillStyle = '#111827';
    hctx.fillRect(0, 0, 512, 512);

    // Draw Hex Grid with high-contrast bevels
    const r = 32;
    const dx = r * 3;
    const dy = r * Math.sqrt(3);
    hctx.strokeStyle = '#1e293b';
    hctx.lineWidth = 3;

    for (let y = -dy; y < 512 + dy; y += dy) {
      for (let x = -dx; x < 512 + dx; x += dx) {
        this.drawHex(hctx, x, y, r);
        this.drawHex(hctx, x + 1.5 * r, y + dy / 2, r);
      }
    }

    // Glowing circuit accents
    hctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    hctx.lineWidth = 2;
    hctx.strokeRect(64, 64, 384, 384);

    const hexTex = new THREE.CanvasTexture(hexCanvas);
    hexTex.wrapS = THREE.RepeatWrapping;
    hexTex.wrapT = THREE.RepeatWrapping;
    hexTex.repeat.set(6, 6);
    this.textures['scifi_hex'] = hexTex;

    // 1b. Procedural Normal Map for Hex Floor
    const hexNormalTex = this.generateNormalMapFromCanvas(hexCanvas, 1.8);
    hexNormalTex.wrapS = THREE.RepeatWrapping;
    hexNormalTex.wrapT = THREE.RepeatWrapping;
    hexNormalTex.repeat.set(6, 6);
    this.textures['scifi_hex_normal'] = hexNormalTex;

    // 2. Metal Panel Crate Texture (Diffuse)
    const crateCanvas = document.createElement('canvas');
    crateCanvas.width = 256;
    crateCanvas.height = 256;
    const cctx = crateCanvas.getContext('2d');
    cctx.fillStyle = '#eab308';
    cctx.fillRect(0, 0, 256, 256);
    // Dark border & inner rivets
    cctx.strokeStyle = '#854d0e';
    cctx.lineWidth = 14;
    cctx.strokeRect(7, 7, 242, 242);
    // Diagonal hazard stripes
    cctx.fillStyle = '#18181b';
    for (let i = -256; i < 512; i += 40) {
      cctx.beginPath();
      cctx.moveTo(i, 0);
      cctx.lineTo(i + 20, 0);
      cctx.lineTo(i + 20 - 256, 256);
      cctx.lineTo(i - 256, 256);
      cctx.fill();
    }
    const crateTex = new THREE.CanvasTexture(crateCanvas);
    this.textures['hazard_crate'] = crateTex;

    // 2b. Procedural Normal Map for Crate
    this.textures['hazard_crate_normal'] = this.generateNormalMapFromCanvas(crateCanvas, 2.2);

    // 3. Unreal Jump Pad Texture (Concentric Neon Chevrons)
    const padCanvas = document.createElement('canvas');
    padCanvas.width = 256;
    padCanvas.height = 256;
    const pctx = padCanvas.getContext('2d');
    pctx.fillStyle = '#0f172a';
    pctx.fillRect(0, 0, 256, 256);
    pctx.strokeStyle = '#00f0ff';
    pctx.lineWidth = 8;
    pctx.strokeRect(10, 10, 236, 236);

    // Glowing Arrow Chevrons
    pctx.fillStyle = '#00f0ff';
    for (let y = 60; y <= 180; y += 50) {
      pctx.beginPath();
      pctx.moveTo(128, y - 25);
      pctx.lineTo(190, y + 20);
      pctx.lineTo(165, y + 20);
      pctx.lineTo(128, y - 5);
      pctx.lineTo(91, y + 20);
      pctx.lineTo(66, y + 20);
      pctx.closePath();
      pctx.fill();
    }
    this.textures['jump_pad'] = new THREE.CanvasTexture(padCanvas);

    // 4. Explosive Hazard Barrel Texture (Crimson + Skull/Flame)
    const barrelCanvas = document.createElement('canvas');
    barrelCanvas.width = 256;
    barrelCanvas.height = 256;
    const bctx = barrelCanvas.getContext('2d');
    bctx.fillStyle = '#dc2626';
    bctx.fillRect(0, 0, 256, 256);
    // Dark metal rings
    bctx.fillStyle = '#1e293b';
    bctx.fillRect(0, 20, 256, 25);
    bctx.fillRect(0, 115, 256, 25);
    bctx.fillRect(0, 210, 256, 25);
    // Yellow Warning Band
    bctx.fillStyle = '#fbbf24';
    bctx.fillRect(0, 65, 256, 40);
    bctx.fillStyle = '#000';
    bctx.font = 'bold 22px sans-serif';
    bctx.textAlign = 'center';
    bctx.fillText('⚠ DANGER ⚠', 128, 93);
    this.textures['hazard_barrel'] = new THREE.CanvasTexture(barrelCanvas);
  }

  // Generates real tangent-space Normal Maps from any 2D canvas height/color map!
  generateNormalMapFromCanvas(srcCanvas, intensity = 1.5) {
    const w = srcCanvas.width;
    const h = srcCanvas.height;
    const srcCtx = srcCanvas.getContext('2d');
    const srcData = srcCtx.getImageData(0, 0, w, h).data;

    const nCanvas = document.createElement('canvas');
    nCanvas.width = w;
    nCanvas.height = h;
    const nCtx = nCanvas.getContext('2d');
    const nImgData = nCtx.createImageData(w, h);
    const nData = nImgData.data;

    const getLum = (x, y) => {
      x = (x + w) % w;
      y = (y + h) % h;
      const idx = (y * w + x) * 4;
      return (srcData[idx] * 0.299 + srcData[idx + 1] * 0.587 + srcData[idx + 2] * 0.114) / 255.0;
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const tl = getLum(x - 1, y - 1);
        const t  = getLum(x, y - 1);
        const tr = getLum(x + 1, y - 1);
        const l  = getLum(x - 1, y);
        const r  = getLum(x + 1, y);
        const bl = getLum(x - 1, y + 1);
        const b  = getLum(x, y + 1);
        const br = getLum(x + 1, y + 1);

        const dx = (tr + 2 * r + br) - (tl + 2 * l + bl);
        const dy = (bl + 2 * b + br) - (tl + 2 * t + tr);
        const dz = 1.0 / (intensity * 2.0);

        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const nx = (dx / len) * 0.5 + 0.5;
        const ny = (dy / len) * 0.5 + 0.5;
        const nz = (dz / len) * 0.5 + 0.5;

        const idx = (y * w + x) * 4;
        nData[idx] = Math.round(nx * 255);
        nData[idx + 1] = Math.round(ny * 255);
        nData[idx + 2] = Math.round(nz * 255);
        nData[idx + 3] = 255;
      }
    }

    nCtx.putImageData(nImgData, 0, 0);
    return new THREE.CanvasTexture(nCanvas);
  }

  // Unreal Engine IBL: Realistic image-based ambient reflections on metals and glass
  setupEnvironmentMap() {
    try {
      const width = 512;
      const height = 256;
      const envCanvas = document.createElement('canvas');
      envCanvas.width = width;
      envCanvas.height = height;
      const ctx = envCanvas.getContext('2d');

      // Atmospheric Sky to Horizon Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0.0, '#040714');
      grad.addColorStop(0.42, '#0f172a');
      grad.addColorStop(0.49, '#1e293b');
      grad.addColorStop(0.50, '#38bdf8'); // Cyan horizon line
      grad.addColorStop(0.53, '#0f172a');
      grad.addColorStop(1.0, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Studio Sunlight Highlight
      const sunGrad = ctx.createRadialGradient(width * 0.65, height * 0.28, 0, width * 0.65, height * 0.28, 70);
      sunGrad.addColorStop(0, '#ffffff');
      sunGrad.addColorStop(0.2, '#fff7ed');
      sunGrad.addColorStop(0.6, 'rgba(255, 200, 120, 0.35)');
      sunGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(width * 0.65, height * 0.28, 70, 0, Math.PI * 2);
      ctx.fill();

      // Cyan Studio Reflector Strip
      const rimGrad = ctx.createLinearGradient(0, height * 0.35, 0, height * 0.65);
      rimGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
      rimGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.45)');
      rimGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
      ctx.fillStyle = rimGrad;
      ctx.fillRect(width * 0.12, height * 0.35, width * 0.22, height * 0.3);

      const envTex = new THREE.CanvasTexture(envCanvas);
      if (typeof THREE.PMREMGenerator !== 'undefined') {
        const pmrem = new THREE.PMREMGenerator(this.renderer);
        pmrem.compileEquirectangularShader();
        const envRT = pmrem.fromEquirectangular(envTex);
        this.scene.environment = envRT.texture;
        pmrem.dispose();
      }
    } catch (e) {
      console.warn('[NovaEngine] IBL setup fallback:', e);
    }
  }

  drawHex(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hx = x + r * Math.cos(angle);
      const hy = y + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();
  }

  setupAtmosphere() {
    // 1. Background Cosmic Stars
    const starCount = 350;
    const starGeom = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 250 + Math.random() * 50;

      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.sin(phi) * Math.sin(theta)) + 10;
      starPos[i * 3 + 2] = r * Math.cos(phi);

      const isCyan = Math.random() > 0.6;
      starColors[i * 3] = isCyan ? 0.0 : 1.0;
      starColors[i * 3 + 1] = isCyan ? 0.9 : 0.8;
      starColors[i * 3 + 2] = 1.0;
    }

    starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeom.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });

    const stars = new THREE.Points(starGeom, starMat);
    this.scene.add(stars);

    // 2. Unreal Engine Volumetric Dust Motes floating in the light
    const moteCount = 120;
    const moteGeom = new THREE.BufferGeometry();
    const motePos = new Float32Array(moteCount * 3);
    this.moteData = [];

    for (let i = 0; i < moteCount; i++) {
      motePos[i * 3] = (Math.random() - 0.5) * 55;
      motePos[i * 3 + 1] = Math.random() * 12 + 0.5;
      motePos[i * 3 + 2] = (Math.random() - 0.5) * 55;
      this.moteData.push({
        baseY: motePos[i * 3 + 1],
        speed: 0.6 + Math.random() * 0.9,
        offset: Math.random() * Math.PI * 2
      });
    }

    moteGeom.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    const moteMat = new THREE.PointsMaterial({
      size: 0.45,
      color: '#38bdf8',
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    this.motePoints = new THREE.Points(moteGeom, moteMat);
    this.scene.add(this.motePoints);
  }

  setupLighting() {
    // 1. Hemisphere Light (Sky: Soft Electric Blue, Ground: Charcoal Navy)
    this.hemiLight = new THREE.HemisphereLight('#7dd3fc', '#111827', 0.65);
    this.scene.add(this.hemiLight);

    // 2. Primary Directional Sunlight (Warm Sunlight with Soft Cascaded Shadows)
    this.dirLight = new THREE.DirectionalLight('#fff1dc', 1.8);
    this.dirLight.position.set(25, 45, 30);
    this.dirLight.castShadow = true;

    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 1.0;
    this.dirLight.shadow.camera.far = 180;
    const shadowD = 40;
    this.dirLight.shadow.camera.left = -shadowD;
    this.dirLight.shadow.camera.right = shadowD;
    this.dirLight.shadow.camera.top = shadowD;
    this.dirLight.shadow.camera.bottom = -shadowD;
    this.dirLight.shadow.bias = -0.0004;

    this.scene.add(this.dirLight);

    // 3. Stylized Rim Light (Cyan Rim light from behind, classic UE4 studio lighting)
    this.rimLight = new THREE.DirectionalLight('#00f0ff', 0.9);
    this.rimLight.position.set(-20, 20, -25);
    this.scene.add(this.rimLight);
  }

  setupGrid() {
    this.gridHelper = new THREE.GridHelper(80, 80, '#00f0ff', '#1f293d');
    this.gridHelper.position.y = 0.005;
    this.scene.add(this.gridHelper);
  }

  setupControls() {
    // 1. OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.orbitControls = new THREE.OrbitControls(this.camera, this.canvas);
      this.orbitControls.enableDamping = true;
      this.orbitControls.dampingFactor = 0.08;
      this.orbitControls.target.set(0, 2.5, 0);
      this.orbitControls.maxPolarAngle = Math.PI / 2 + 0.05;
    }

    // 2. TransformControls (UE4 3D Gizmo)
    if (typeof THREE.TransformControls !== 'undefined') {
      this.transformControls = new THREE.TransformControls(this.camera, this.canvas);
      this.transformControls.size = 0.85;

      this.transformControls.addEventListener('dragging-changed', (e) => {
        if (this.orbitControls) {
          this.orbitControls.enabled = !e.value;
        }
      });

      this.transformControls.addEventListener('change', () => {
        if (this.engine.selectedActor && this.transformControls.object) {
          const obj = this.transformControls.object;
          const act = this.engine.selectedActor;
          act.transform.position.x = obj.position.x;
          act.transform.position.y = obj.position.y;
          act.transform.position.z = obj.position.z;

          act.transform.rotation.x = EngineMath.radToDeg(obj.rotation.x);
          act.transform.rotation.y = EngineMath.radToDeg(obj.rotation.y);
          act.transform.rotation.z = EngineMath.radToDeg(obj.rotation.z);

          act.transform.scale.x = obj.scale.x;
          act.transform.scale.y = obj.scale.y;
          act.transform.scale.z = obj.scale.z;

          if (this.engine.physics3d) {
            this.engine.physics3d.syncActorBody(act);
          }
          if (this.engine.ui) {
            this.engine.ui.refreshInspector();
          }
        }
      });

      this.scene.add(this.transformControls);
    }

    // Freefly Camera (Hold Right Click + WASD)
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) this.isFreeflying = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) this.isFreeflying = false;
    });

    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (!this.engine.isPlaying) {
        if (e.key.toLowerCase() === 'w') this.setTransformMode('translate');
        if (e.key.toLowerCase() === 'e') this.setTransformMode('rotate');
        if (e.key.toLowerCase() === 'r') this.setTransformMode('scale');
      }

      this.freeflyKeys[e.code] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.freeflyKeys[e.code] = false;
    });

    // Raycast Object Picking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    this.canvas.addEventListener('click', (e) => {
      if (this.engine.isPlaying) return;
      if (this.transformControls && this.transformControls.dragging) return;

      const rect = this.canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const meshes = Array.from(this.meshMap.values());
      const intersects = raycaster.intersectObjects(meshes, true);

      if (intersects.length > 0) {
        let hitObj = intersects[0].object;
        while (hitObj.parent && hitObj.parent !== this.scene) {
          hitObj = hitObj.parent;
        }
        for (const [actor, mesh] of this.meshMap.entries()) {
          if (mesh === hitObj) {
            this.engine.selectActor(actor);
            return;
          }
        }
      }
    });
  }

  setTransformMode(mode) {
    if (this.transformControls) {
      this.transformControls.setMode(mode);
      if (this.engine.ui) {
        this.engine.ui.updateTransformModeUI(mode);
      }
    }
  }

  setSnap(translationSnap, rotationSnap) {
    if (this.transformControls) {
      this.transformControls.setTranslationSnap(translationSnap);
      this.transformControls.setRotationSnap(rotationSnap ? EngineMath.degToRad(rotationSnap) : null);
    }
  }

  // Sync Actor3D into Three.js Mesh
  syncActorMesh(actor) {
    let mesh = this.meshMap.get(actor);

    if (!mesh) {
      mesh = this.buildMeshFromActor(actor);
      this.scene.add(mesh);
      this.meshMap.set(actor, mesh);
      actor._runtime.threeMesh = mesh;
    }

    const pos = actor.transform.position;
    const rot = actor.transform.rotation;
    const scl = actor.transform.scale;

    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.rotation.set(
      EngineMath.degToRad(rot.x),
      EngineMath.degToRad(rot.y),
      EngineMath.degToRad(rot.z)
    );
    mesh.scale.set(scl.x, scl.y, scl.z);
    mesh.visible = actor.visible;

    // Update Material if standard mesh
    if (mesh.material && !actor.light && !mesh.isCharacterGroup) {
      mesh.material.color.set(actor.material.color);
      mesh.material.metalness = actor.material.metalness;
      mesh.material.roughness = actor.material.roughness;
      mesh.material.emissive.set(actor.material.emissive);
      mesh.material.emissiveIntensity = actor.material.emissiveIntensity;
      mesh.material.wireframe = this.viewMode === 'wireframe' || actor.material.wireframe;
      mesh.material.opacity = actor.material.opacity;
      mesh.material.transparent = actor.material.transparent || actor.material.opacity < 1.0;
      mesh.castShadow = actor.material.castShadow && this.showShadows;
      mesh.receiveShadow = actor.material.receiveShadow && this.showShadows;
    }

    // Attach Transform Gizmo to selected Actor
    if (this.engine.selectedActor === actor && !this.engine.isPlaying) {
      if (this.transformControls) {
        this.transformControls.attach(mesh);
      }
    }
  }

  buildMeshFromActor(actor) {
    // 1. Stylized Sci-Fi Character Mesh (Unreal Hero Robot Mannequin)
    if (actor.tag === 'player' || actor.shape === 'character') {
      return this.buildCharacterMesh(actor);
    }

    // 2. High-Tech Jump Pad Actor
    if (actor.tag === 'jumppad') {
      return this.buildJumpPadMesh(actor);
    }

    // 3. Explosive Hazard Barrel Actor
    if (actor.tag === 'barrel') {
      return this.buildHazardBarrelMesh(actor);
    }

    // 4. Floating Energy Crystal
    if (actor.tag === 'crystal' || actor.hasBehavior?.('collectible3D')) {
      return this.buildCrystalMesh(actor);
    }

    // 5. Dynamic Lights
    if (actor.shape === 'light') {
      return this.createLightActor(actor);
    }

    let geometry;
    const dims = actor.dimensions;

    switch (actor.shape) {
      case 'box':
        geometry = new THREE.BoxGeometry(dims.width, dims.height, dims.depth);
        break;

      case 'sphere':
        geometry = new THREE.SphereGeometry(dims.radius, 32, 32);
        break;

      case 'cylinder':
        geometry = new THREE.CylinderGeometry(dims.radiusTop, dims.radiusBottom, dims.height, 32);
        break;

      case 'capsule':
        geometry = new THREE.CylinderGeometry(dims.radius, dims.radius, dims.height, 24);
        break;

      case 'cone':
        geometry = new THREE.ConeGeometry(dims.radius, dims.height, 32);
        break;

      case 'torus':
        geometry = new THREE.TorusGeometry(dims.radius, dims.radiusTop || 0.3, 24, 48);
        break;

      case 'plane':
        geometry = new THREE.PlaneGeometry(dims.width, dims.depth);
        geometry.rotateX(-Math.PI / 2);
        break;

      default:
        geometry = new THREE.BoxGeometry(2, 2, 2);
        break;
    }

    const material = this.createPBRMaterial(actor);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = actor.material.castShadow;
    mesh.receiveShadow = actor.material.receiveShadow;
    return mesh;
  }

  // Builds an Articulated Sci-Fi Robot Mannequin (Unreal Engine 4 Hero Rig)
  buildCharacterMesh(actor) {
    const group = new THREE.Group();
    group.isCharacterGroup = true;

    // Body Armor Material (Dark Metallic Titanium with specular sheen)
    const armorMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      metalness: 0.88,
      roughness: 0.22
    });

    // Visor / Core Neon Emissive Material (Unreal Glowing Cyan)
    const neonMat = new THREE.MeshStandardMaterial({
      color: '#00f0ff',
      emissive: '#00f0ff',
      emissiveIntensity: 2.8,
      roughness: 0.1,
      metalness: 0.5
    });

    // Joint Accents
    const jointMat = new THREE.MeshStandardMaterial({
      color: '#475569',
      metalness: 0.95,
      roughness: 0.15
    });

    // 1. Torso Group
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.05, 0);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.1, 0.65), armorMat);
    torso.castShadow = true;
    torsoGroup.add(torso);

    // Glowing Chest Reactor
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16), neonMat);
    core.rotateX(Math.PI / 2);
    core.position.set(0, 0.12, 0.35);
    torsoGroup.add(core);

    // 2. Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.9, 0);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), armorMat);
    head.castShadow = true;
    headGroup.add(head);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.18, 0.1), neonMat);
    visor.position.set(0, 0.02, 0.32);
    headGroup.add(visor);

    torsoGroup.add(headGroup);

    // 3. Shoulders & Arms (Pivot at shoulder joint for running animation)
    const armLGroup = new THREE.Group();
    armLGroup.position.set(-0.65, 0.35, 0);
    const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), jointMat);
    armLGroup.add(shoulderL);
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.75, 16), armorMat);
    armL.position.set(0, -0.4, 0);
    armL.castShadow = true;
    armLGroup.add(armL);
    torsoGroup.add(armLGroup);

    const armRGroup = new THREE.Group();
    armRGroup.position.set(0.65, 0.35, 0);
    const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), jointMat);
    armRGroup.add(shoulderR);
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.75, 16), armorMat);
    armR.position.set(0, -0.4, 0);
    armR.castShadow = true;
    armRGroup.add(armR);
    torsoGroup.add(armRGroup);

    // 4. Jetpack on Torso back
    const jetpack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.28), armorMat);
    jetpack.position.set(0, 0.05, -0.42);
    torsoGroup.add(jetpack);

    const thrusterL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.25, 16), neonMat);
    thrusterL.position.set(-0.18, -0.35, -0.42);
    const thrusterR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.25, 16), neonMat);
    thrusterR.position.set(0.18, -0.35, -0.42);
    torsoGroup.add(thrusterL, thrusterR);

    group.add(torsoGroup);

    // 5. Legs & Hips (Pivot at hip joint for stride animation)
    const legLGroup = new THREE.Group();
    legLGroup.position.set(-0.28, 0.9, 0);
    const hipL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), jointMat);
    legLGroup.add(hipL);
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.85, 16), armorMat);
    legL.position.set(0, -0.45, 0);
    legL.castShadow = true;
    legLGroup.add(legL);
    const footL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.35), armorMat);
    footL.position.set(0, -0.88, 0.08);
    legLGroup.add(footL);
    group.add(legLGroup);

    const legRGroup = new THREE.Group();
    legRGroup.position.set(0.28, 0.9, 0);
    const hipR = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), jointMat);
    legRGroup.add(hipR);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.85, 16), armorMat);
    legR.position.set(0, -0.45, 0);
    legR.castShadow = true;
    legRGroup.add(legR);
    const footR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.35), armorMat);
    footR.position.set(0, -0.88, 0.08);
    legRGroup.add(footR);
    group.add(legRGroup);

    // Expose rig for procedural animations in core3d.js
    group.userData.rig = {
      torsoGroup,
      headGroup,
      armL: armLGroup,
      armR: armRGroup,
      legL: legLGroup,
      legR: legRGroup,
      thrusterL,
      thrusterR,
      core,
      neonMat
    };

    return group;
  }

  // Builds a futuristic Sci-Fi Launch / Jump Pad
  buildJumpPadMesh(actor) {
    const group = new THREE.Group();
    const dims = actor.dimensions || { width: 3, height: 0.4, depth: 3 };

    // Metallic Base Platform
    const baseMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      metalness: 0.9,
      roughness: 0.2
    });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(dims.width / 2, dims.width / 2 + 0.3, dims.height, 16), baseMat);
    base.receiveShadow = true;
    group.add(base);

    // Glowing Neon Pad Center
    const neonPadMat = new THREE.MeshStandardMaterial({
      color: '#00f0ff',
      emissive: '#00f0ff',
      emissiveIntensity: 2.2,
      roughness: 0.1
    });
    if (this.textures['jump_pad']) {
      neonPadMat.map = this.textures['jump_pad'];
    }
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(dims.width / 2 - 0.25, dims.width / 2 - 0.25, dims.height + 0.05, 16), neonPadMat);
    pad.receiveShadow = true;
    group.add(pad);

    return group;
  }

  // Builds an Explosive Metal Hazard Barrel
  buildHazardBarrelMesh(actor) {
    const group = new THREE.Group();
    const dims = actor.dimensions || { radius: 0.7, height: 1.8 };

    const barrelMat = new THREE.MeshStandardMaterial({
      color: '#ef4444',
      metalness: 0.8,
      roughness: 0.3
    });
    if (this.textures['hazard_barrel']) {
      barrelMat.map = this.textures['hazard_barrel'];
    }

    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(dims.radius, dims.radius, dims.height, 24), barrelMat);
    barrel.castShadow = true;
    barrel.receiveShadow = true;
    group.add(barrel);

    return group;
  }

  // Builds a floating multi-faceted energy crystal
  buildCrystalMesh(actor) {
    const group = new THREE.Group();
    const crystalMat = new THREE.MeshStandardMaterial({
      color: actor.material?.color || '#ffea00',
      emissive: actor.material?.color || '#ffea00',
      emissiveIntensity: 2.0,
      metalness: 0.2,
      roughness: 0.1,
      transparent: true,
      opacity: 0.88
    });

    const geom = new THREE.OctahedronGeometry(actor.dimensions?.radius || 0.8, 0);
    const mesh = new THREE.Mesh(geom, crystalMat);
    mesh.castShadow = true;
    group.add(mesh);

    return group;
  }

  createPBRMaterial(actor) {
    // Unreal Engine 'Lighting Only' Viewport Mode (Neutral White Clay)
    if (this.viewMode === 'lightingOnly') {
      return new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        metalness: 0.0,
        roughness: 0.85,
        wireframe: false
      });
    }

    const mat = new THREE.MeshStandardMaterial({
      color: actor.material.color,
      metalness: actor.material.metalness,
      roughness: actor.material.roughness,
      emissive: actor.material.emissive,
      emissiveIntensity: actor.material.emissiveIntensity,
      wireframe: this.viewMode === 'wireframe' || actor.material.wireframe,
      opacity: actor.material.opacity,
      transparent: actor.material.transparent || actor.material.opacity < 1.0
    });

    // Assign procedural PBR diffuse & normal maps
    if (actor.shape === 'plane' && this.textures['scifi_hex']) {
      mat.map = this.textures['scifi_hex'];
      if (this.textures['scifi_hex_normal']) {
        mat.normalMap = this.textures['scifi_hex_normal'];
        mat.normalScale = new THREE.Vector2(1.2, 1.2);
      }
    } else if (actor.tag === 'crate' && this.textures['hazard_crate']) {
      mat.map = this.textures['hazard_crate'];
      if (this.textures['hazard_crate_normal']) {
        mat.normalMap = this.textures['hazard_crate_normal'];
        mat.normalScale = new THREE.Vector2(1.5, 1.5);
      }
    }

    return mat;
  }

  createLightActor(actor) {
    const group = new THREE.Group();
    const lCfg = actor.light || {};

    let lightSource;
    if (lCfg.type === 'point') {
      lightSource = new THREE.PointLight(lCfg.color, lCfg.intensity, lCfg.distance);
    } else if (lCfg.type === 'spot') {
      lightSource = new THREE.SpotLight(lCfg.color, lCfg.intensity, lCfg.distance, lCfg.angle, lCfg.penumbra);
    } else {
      lightSource = new THREE.DirectionalLight(lCfg.color, lCfg.intensity);
    }
    lightSource.castShadow = lCfg.castShadow;
    group.add(lightSource);

    // Glowing bulb indicator in Editor
    const bulbGeom = new THREE.SphereGeometry(0.35, 16, 16);
    const bulbMat = new THREE.MeshStandardMaterial({
      color: lCfg.color,
      emissive: lCfg.color,
      emissiveIntensity: 2.0
    });
    const bulbMesh = new THREE.Mesh(bulbGeom, bulbMat);
    group.add(bulbMesh);

    return group;
  }

  removeActorMesh(actor) {
    const mesh = this.meshMap.get(actor);
    if (mesh) {
      if (this.transformControls && this.transformControls.object === mesh) {
        this.transformControls.detach();
      }
      this.scene.remove(mesh);
      this.meshMap.delete(actor);
      actor._runtime.threeMesh = null;
    }
  }

  updateFreefly(dt) {
    if (!this.isFreeflying || this.engine.isPlaying) return;

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const right = new THREE.Vector3().crossVectors(forward, this.camera.up).normalize();

    const speed = this.cameraSpeed * dt;
    if (this.freeflyKeys['KeyW']) this.camera.position.addScaledVector(forward, speed);
    if (this.freeflyKeys['KeyS']) this.camera.position.addScaledVector(forward, -speed);
    if (this.freeflyKeys['KeyA']) this.camera.position.addScaledVector(right, -speed);
    if (this.freeflyKeys['KeyD']) this.camera.position.addScaledVector(right, speed);
    if (this.freeflyKeys['KeyE'] || this.freeflyKeys['Space']) this.camera.position.y += speed;
    if (this.freeflyKeys['KeyQ']) this.camera.position.y -= speed;

    if (this.orbitControls) {
      this.orbitControls.target.copy(this.camera.position).add(forward);
    }
  }

  render(dt) {
    if (!this.renderer || !this.scene || !this.camera) return;

    this.updateFreefly(dt);

    if (!this.engine.isPlaying && this.orbitControls && !this.isFreeflying) {
      this.orbitControls.update();
    }

    // Animate Unreal Engine Volumetric Dust Motes
    if (this.motePoints && this.moteData) {
      const time = performance.now() * 0.001;
      const pos = this.motePoints.geometry.attributes.position.array;
      for (let i = 0; i < this.moteData.length; i++) {
        const d = this.moteData[i];
        pos[i * 3 + 1] = d.baseY + Math.sin(time * d.speed + d.offset) * 0.5;
        pos[i * 3] += Math.sin(time * 0.2 + d.offset) * 0.008;
      }
      this.motePoints.geometry.attributes.position.needsUpdate = true;
    }

    // Render with UnrealBloomPass Post-Processing
    if (this.enableBloom && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }

  onResize() {
    if (!this.canvas || !this.renderer || !this.camera) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height, false);
      if (this.composer) {
        this.composer.setSize(width, height);
      }
    }
  }
}

window.Renderer3D = Renderer3D;
