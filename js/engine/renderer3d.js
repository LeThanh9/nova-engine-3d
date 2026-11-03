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

    // GTA 6 Dynamic Simulation Meshes
    this.animatedOceans = [];
    this.animatedPalms = [];
    this.animatedVehicles = [];

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

    // 5. GTA 6 Wet Asphalt Highway Road Texture
    const roadCanvas = document.createElement('canvas');
    roadCanvas.width = 512;
    roadCanvas.height = 512;
    const rctx = roadCanvas.getContext('2d');
    // Dark asphalt base
    rctx.fillStyle = '#1c1f26';
    rctx.fillRect(0, 0, 512, 512);

    // Fine asphalt aggregate speckles
    for (let i = 0; i < 4000; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      const gray = Math.floor(25 + Math.random() * 35);
      rctx.fillStyle = `rgb(${gray},${gray},${gray})`;
      rctx.fillRect(rx, ry, 1.5, 1.5);
    }

    // Wet puddle patches (reflective dark glossy pools)
    const puddles = [
      { x: 120, y: 160, rx: 70, ry: 40 },
      { x: 380, y: 320, rx: 85, ry: 50 },
      { x: 260, y: 440, rx: 60, ry: 35 }
    ];
    for (const p of puddles) {
      const pGrad = rctx.createRadialGradient(p.x, p.y, 5, p.x, p.y, p.rx);
      pGrad.addColorStop(0, 'rgba(10, 14, 22, 0.95)');
      pGrad.addColorStop(0.7, 'rgba(16, 22, 34, 0.6)');
      pGrad.addColorStop(1, 'rgba(28, 31, 38, 0)');
      rctx.fillStyle = pGrad;
      rctx.beginPath();
      rctx.ellipse(p.x, p.y, p.rx, p.ry, 0.2, 0, Math.PI * 2);
      rctx.fill();
    }

    // Yellow double center line
    rctx.fillStyle = '#facc15';
    rctx.fillRect(250, 0, 4, 512);
    rctx.fillRect(258, 0, 4, 512);

    // White dashed lane divider lines
    rctx.fillStyle = '#f1f5f9';
    for (let y = 0; y < 512; y += 48) {
      rctx.fillRect(124, y, 4, 28);
      rctx.fillRect(384, y, 4, 28);
    }

    // White outer road boundary lines
    rctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
    rctx.fillRect(16, 0, 6, 512);
    rctx.fillRect(490, 0, 6, 512);

    const roadTex = new THREE.CanvasTexture(roadCanvas);
    roadTex.wrapS = THREE.RepeatWrapping;
    roadTex.wrapT = THREE.RepeatWrapping;
    this.textures['asphalt_road'] = roadTex;
    this.textures['asphalt_road_normal'] = this.generateNormalMapFromCanvas(roadCanvas, 1.4);

    // 6. GTA 6 Tropical Coconut Palm Trunk Bark
    const palmCanvas = document.createElement('canvas');
    palmCanvas.width = 256;
    palmCanvas.height = 256;
    const palmCtx = palmCanvas.getContext('2d');
    palmCtx.fillStyle = '#453225';
    palmCtx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 16) {
      palmCtx.fillStyle = y % 32 === 0 ? '#322318' : '#594130';
      palmCtx.fillRect(0, y, 256, 5);
      palmCtx.fillStyle = 'rgba(0,0,0,0.2)';
      palmCtx.fillRect(0, y + 5, 256, 2);
    }
    const palmTex = new THREE.CanvasTexture(palmCanvas);
    palmTex.wrapS = THREE.RepeatWrapping;
    palmTex.wrapT = THREE.RepeatWrapping;
    this.textures['palm_bark'] = palmTex;

    // 7. GTA 6 Art-Deco Miami Neon Hotel Facade
    const hotelCanvas = document.createElement('canvas');
    hotelCanvas.width = 512;
    hotelCanvas.height = 512;
    const hotelCtx = hotelCanvas.getContext('2d');
    // Pastel flamingo pink / peach facade
    hotelCtx.fillStyle = '#fb7185';
    hotelCtx.fillRect(0, 0, 512, 512);
    // Turquoise horizontal Art-Deco moldings
    hotelCtx.fillStyle = '#06b6d4';
    hotelCtx.fillRect(0, 120, 512, 16);
    hotelCtx.fillRect(0, 240, 512, 16);
    hotelCtx.fillRect(0, 360, 512, 16);
    hotelCtx.fillRect(0, 480, 512, 32);

    // Illuminated hotel windows
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const wx = 36 + col * 76;
        const wy = 40 + row * 120;
        hotelCtx.fillStyle = (row + col) % 3 === 0 ? '#1e293b' : '#fef08a';
        hotelCtx.fillRect(wx, wy, 44, 56);
        // Window frame
        hotelCtx.strokeStyle = '#fff';
        hotelCtx.lineWidth = 3;
        hotelCtx.strokeRect(wx, wy, 44, 56);
      }
    }
    // Neon Sign banner on top
    hotelCtx.fillStyle = '#0f172a';
    hotelCtx.fillRect(80, 10, 352, 28);
    hotelCtx.fillStyle = '#00f0ff';
    hotelCtx.font = 'bold 20px sans-serif';
    hotelCtx.textAlign = 'center';
    hotelCtx.fillText('★ HOTEL VICE ★', 256, 31);

    const hotelTex = new THREE.CanvasTexture(hotelCanvas);
    this.textures['hotel_facade'] = hotelTex;
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
    // 1. Unreal Engine Atmospheric Sky Dome (Rayleigh Sunset & Cosmic Nebula)
    const skyGeom = new THREE.SphereGeometry(360, 32, 24);
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 1024;
    skyCanvas.height = 512;
    const sctx = skyCanvas.getContext('2d');

    // Multi-stop Atmospheric Rayleigh Gradient (Zenith deep space -> Twilight sunset)
    const skyGrad = sctx.createLinearGradient(0, 0, 0, 512);
    skyGrad.addColorStop(0.0, '#020409'); // Deep Space Zenith
    skyGrad.addColorStop(0.38, '#08142b'); // High Altitude Midnight Blue
    skyGrad.addColorStop(0.48, '#1e293b'); // Upper Atmospheric Haze
    skyGrad.addColorStop(0.50, '#38bdf8'); // Electric Cyan Horizon Rim
    skyGrad.addColorStop(0.52, '#f97316'); // Warm Twilight Sunset Line
    skyGrad.addColorStop(0.56, '#0f172a'); // Ground Horizon
    skyGrad.addColorStop(1.0, '#020617'); // Nadir
    sctx.fillStyle = skyGrad;
    sctx.fillRect(0, 0, 1024, 512);

    // Glowing Sun Disc with Atmospheric Corona Flare
    const sunGrad = sctx.createRadialGradient(680, 190, 0, 680, 190, 110);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.15, '#fff7ed');
    sunGrad.addColorStop(0.45, 'rgba(249, 115, 22, 0.45)');
    sunGrad.addColorStop(0.75, 'rgba(56, 189, 248, 0.2)');
    sunGrad.addColorStop(1.0, 'rgba(0,0,0,0)');
    sctx.fillStyle = sunGrad;
    sctx.beginPath();
    sctx.arc(680, 190, 110, 0, Math.PI * 2);
    sctx.fill();

    // Distant Cyber City Skyline & Mountain Silhouettes on Horizon
    sctx.fillStyle = '#060a12';
    sctx.beginPath();
    sctx.moveTo(0, 280);
    for (let x = 0; x <= 1024; x += 16) {
      const h = Math.sin(x * 0.02) * 12 + Math.sin(x * 0.05) * 8 + Math.sin(x * 0.1) * 6;
      sctx.lineTo(x, 268 - h);
    }
    sctx.lineTo(1024, 310);
    sctx.lineTo(0, 310);
    sctx.closePath();
    sctx.fill();

    // Blinking Cyber Beacons on Mountain Peaks
    sctx.fillStyle = '#ef4444';
    for (let bx = 60; bx < 1024; bx += 140) {
      sctx.beginPath();
      sctx.arc(bx, 245, 1.8, 0, Math.PI * 2);
      sctx.fill();
    }

    const skyTex = new THREE.CanvasTexture(skyCanvas);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      fog: false
    });
    this.skyDome = new THREE.Mesh(skyGeom, skyMat);
    this.scene.add(this.skyDome);

    // 2. Volumetric Sun Light Shafts (God Rays)
    const shaftGeom = new THREE.ConeGeometry(22, 70, 32, 1, true);
    shaftGeom.translate(0, -35, 0);
    shaftGeom.rotateX(Math.PI / 2);
    const shaftMat = new THREE.MeshBasicMaterial({
      color: '#fff5ea',
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.godRayCone = new THREE.Mesh(shaftGeom, shaftMat);
    this.godRayCone.position.set(25, 48, 30);
    this.godRayCone.lookAt(0, 3.5, -4);
    this.scene.add(this.godRayCone);

    // 3. Background Cosmic Stars
    const starCount = 350;
    const starGeom = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 240 + Math.random() * 50;

      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.sin(phi) * Math.sin(theta)) + 12;
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

    // 4. Unreal Engine Volumetric Dust Motes floating in the light
    const moteCount = 150;
    const moteGeom = new THREE.BufferGeometry();
    const motePos = new Float32Array(moteCount * 3);
    this.moteData = [];

    for (let i = 0; i < moteCount; i++) {
      motePos[i * 3] = (Math.random() - 0.5) * 55;
      motePos[i * 3 + 1] = Math.random() * 14 + 0.5;
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
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    this.motePoints = new THREE.Points(moteGeom, moteMat);
    this.scene.add(this.motePoints);
  }

  setupLighting() {
    // 1. Hemisphere Light (Sky: Soft Electric Cyan Blue, Ground: Charcoal Slate)
    this.hemiLight = new THREE.HemisphereLight('#60a5fa', '#090d16', 0.75);
    this.scene.add(this.hemiLight);

    // 2. Primary Directional Sunlight (Warm Amber Golden Sunlight with Soft Cascaded Shadows)
    this.dirLight = new THREE.DirectionalLight('#fff5ea', 2.2);
    this.dirLight.position.set(25, 48, 30);
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
    this.dirLight.shadow.bias = -0.0003;
    this.scene.add(this.dirLight);

    // 3. Key Rim Light (Vivid Electric Cyan Backlight from rear left)
    this.rimLight = new THREE.DirectionalLight('#00f0ff', 1.8);
    this.rimLight.position.set(-24, 22, -26);
    this.scene.add(this.rimLight);

    // 4. Secondary Fill Rim Light (Vivid Neon Magenta Backlight from rear right)
    this.rimLight2 = new THREE.DirectionalLight('#e879f9', 1.2);
    this.rimLight2.position.set(24, 18, -26);
    this.scene.add(this.rimLight2);
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

    // 1b. Unreal High-Poly Floating Fortress Arena
    if (actor.tag === 'arena' || actor.name.includes('Arena')) {
      return this.buildFloatingFortressMesh(actor);
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

    // 6. GTA 6 Drivable Supercars (Pegassi / Grotti Supercar Rig)
    if (actor.tag === 'vehicle' || actor.shape === 'vehicle' || actor.shape === 'car') {
      return this.buildVehicleMesh(actor);
    }

    // 7. GTA 6 Tropical Palm Trees
    if (actor.tag === 'palm_tree' || actor.shape === 'palm_tree') {
      return this.buildPalmTreeMesh(actor);
    }

    // 8. GTA 6 Dynamic Coastal Ocean Water Plane
    if (actor.tag === 'ocean' || actor.shape === 'ocean_water') {
      return this.buildOceanWaterMesh(actor);
    }

    // 9. GTA 6 Art-Deco Miami Neon Hotel
    if (actor.tag === 'building' || actor.shape === 'building' || actor.shape === 'hotel') {
      return this.buildBuildingMesh(actor);
    }

    // 10. GTA 6 Asphalt Highway / Boulevard Road
    if (actor.tag === 'road' || actor.shape === 'road') {
      return this.buildRoadMesh(actor);
    }

    // 11. GTA 6 Street Light Lamppost
    if (actor.tag === 'street_light') {
      return this.buildStreetLightMesh(actor);
    }

    // 12. GTA 6 Traffic Safety Cone
    if (actor.tag === 'cone' || actor.shape === 'traffic_cone') {
      return this.buildTrafficConeMesh(actor);
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

  // Builds an Epic Unreal Engine 4 Sci-Fi Floating Battle Fortress
  buildFloatingFortressMesh(actor) {
    const group = new THREE.Group();
    const dims = actor.dimensions || { width: 14, height: 1.0, depth: 14 };

    // 1. Heavy Titanium Deck
    const deckMat = new THREE.MeshStandardMaterial({
      color: '#151e2e',
      metalness: 0.92,
      roughness: 0.18
    });
    if (this.textures['scifi_hex']) {
      deckMat.map = this.textures['scifi_hex'];
      if (this.textures['scifi_hex_normal']) {
        deckMat.normalMap = this.textures['scifi_hex_normal'];
        deckMat.normalScale = new THREE.Vector2(1.5, 1.5);
      }
    }

    const deck = new THREE.Mesh(new THREE.BoxGeometry(dims.width, 0.6, dims.depth), deckMat);
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    // Glowing Neon Perimeter Inlay
    const neonTrimMat = new THREE.MeshStandardMaterial({
      color: '#00f0ff',
      emissive: '#00f0ff',
      emissiveIntensity: 2.5,
      roughness: 0.1
    });
    const trim = new THREE.Mesh(new THREE.BoxGeometry(dims.width + 0.3, 0.12, dims.depth + 0.3), neonTrimMat);
    trim.position.y = 0.25;
    group.add(trim);

    // Beveled Under-Armor Keel
    const keelMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      metalness: 0.95,
      roughness: 0.25
    });
    const keel = new THREE.Mesh(new THREE.CylinderGeometry(dims.width / 2, (dims.width / 2) - 1.8, 1.2, 4), keelMat);
    keel.rotateY(Math.PI / 4);
    keel.position.y = -0.7;
    keel.castShadow = true;
    group.add(keel);

    // 4 Heavy Anti-Gravity Repulsor Engines underneath with glowing blue plasma cones
    const engineMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      metalness: 0.95,
      roughness: 0.1
    });
    const plasmaMat = new THREE.MeshStandardMaterial({
      color: '#00f0ff',
      emissive: '#00f0ff',
      emissiveIntensity: 3.5,
      transparent: true,
      opacity: 0.85
    });

    const repOffset = dims.width * 0.35;
    const offsets = [
      [-repOffset, -repOffset],
      [repOffset, -repOffset],
      [-repOffset, repOffset],
      [repOffset, repOffset]
    ];

    offsets.forEach(([ox, oz]) => {
      const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.95, 1.2, 16), engineMat);
      thruster.position.set(ox, -1.0, oz);
      thruster.castShadow = true;
      group.add(thruster);

      const plume = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.8, 16), plasmaMat);
      plume.rotateX(Math.PI);
      plume.position.set(ox, -2.1, oz);
      group.add(plume);
    });

    // 4 Corner Cyber Monolith Energy Pillars with floating rings
    const pillarMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      metalness: 0.9,
      roughness: 0.2
    });
    const pOffset = (dims.width / 2) - 0.7;
    const pCorners = [
      [-pOffset, -pOffset],
      [pOffset, -pOffset],
      [-pOffset, pOffset],
      [pOffset, pOffset]
    ];

    pCorners.forEach(([px, pz]) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 4.2, 0.8), pillarMat);
      pillar.position.set(px, 2.1, pz);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      group.add(pillar);

      const conduit = new THREE.Mesh(new THREE.BoxGeometry(0.85, 3.8, 0.15), neonTrimMat);
      conduit.position.set(px, 2.1, pz);
      group.add(conduit);

      const summitGeom = new THREE.OctahedronGeometry(0.38, 0);
      const summit = new THREE.Mesh(summitGeom, neonTrimMat);
      summit.position.set(px, 4.6, pz);
      group.add(summit);
    });

    return group;
  }

  // Builds an Articulated Sci-Fi Robot Mannequin (Unreal Engine 4 Hero Rig)
  buildCharacterMesh(actor) {
    const group = new THREE.Group();
    group.isCharacterGroup = true;

    // Body Armor Material (Dark Metallic Titanium with specular sheen)
    const armorMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      metalness: 0.9,
      roughness: 0.18
    });

    // Visor / Core Neon Emissive Material (Unreal Glowing Cyan)
    const neonMat = new THREE.MeshStandardMaterial({
      color: '#00f0ff',
      emissive: '#00f0ff',
      emissiveIntensity: 3.2,
      roughness: 0.08,
      metalness: 0.4
    });

    // Joint Accents
    const jointMat = new THREE.MeshStandardMaterial({
      color: '#334155',
      metalness: 0.95,
      roughness: 0.12
    });

    // 1. Torso Group
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.05, 0);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.1, 0.65), armorMat);
    torso.castShadow = true;
    torsoGroup.add(torso);

    // Sculpted Chest Armor Plates
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.55, 0.12), jointMat);
    chestPlate.position.set(0, 0.18, 0.35);
    torsoGroup.add(chestPlate);

    // Glowing Chest Reactor
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 16), neonMat);
    core.rotateX(Math.PI / 2);
    core.position.set(0, 0.18, 0.4);
    torsoGroup.add(core);

    // 2. Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.9, 0);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), armorMat);
    head.castShadow = true;
    headGroup.add(head);

    // Curved Cyber Visor Slit
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.16, 0.1), neonMat);
    visor.position.set(0, 0.02, 0.32);
    headGroup.add(visor);

    // Top Crest Fin
    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.45), neonMat);
    crest.position.set(0, 0.38, -0.05);
    headGroup.add(crest);

    torsoGroup.add(headGroup);

    // 3. Shoulders & Arms (Pivot at shoulder joint for running animation)
    const armLGroup = new THREE.Group();
    armLGroup.position.set(-0.68, 0.35, 0);
    const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), jointMat);
    armLGroup.add(shoulderL);
    // Pauldron
    const pauldronL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.35), armorMat);
    pauldronL.position.set(0, 0.08, 0);
    armLGroup.add(pauldronL);
    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.75, 16), armorMat);
    armL.position.set(0, -0.4, 0);
    armL.castShadow = true;
    armLGroup.add(armL);
    // Wrist Blaster
    const blasterL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.14), neonMat);
    blasterL.position.set(0, -0.65, 0.08);
    armLGroup.add(blasterL);
    torsoGroup.add(armLGroup);

    const armRGroup = new THREE.Group();
    armRGroup.position.set(0.68, 0.35, 0);
    const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), jointMat);
    armRGroup.add(shoulderR);
    // Pauldron
    const pauldronR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.2, 0.35), armorMat);
    pauldronR.position.set(0, 0.08, 0);
    armRGroup.add(pauldronR);
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.75, 16), armorMat);
    armR.position.set(0, -0.4, 0);
    armR.castShadow = true;
    armRGroup.add(armR);
    // Wrist Blaster
    const blasterR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.14), neonMat);
    blasterR.position.set(0, -0.65, 0.08);
    armRGroup.add(blasterR);
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
    const footL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.38), armorMat);
    footL.position.set(0, -0.88, 0.08);
    footL.castShadow = true;
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
    const footR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.38), armorMat);
    footR.position.set(0, -0.88, 0.08);
    footR.castShadow = true;
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

  // GTA 6 High-Fidelity Supercar Mesh Builder (Pegassi / Grotti Supercar Rig)
  buildVehicleMesh(actor) {
    const group = new THREE.Group();
    group.isVehicleGroup = true;
    const bodyColor = actor.material?.color || '#00d2ff';
    const metalness = actor.material?.metalness ?? 0.95;
    const roughness = actor.material?.roughness ?? 0.12;

    // Body Paint Material (Metallic Clearcoat Car Paint)
    const paintMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      metalness: metalness,
      roughness: roughness
    });

    // Dark Carbon Fiber / Trim Material
    const carbonMat = new THREE.MeshStandardMaterial({
      color: '#090d14',
      metalness: 0.8,
      roughness: 0.3
    });

    // Tinted Glass Material (Cockpit & Windshield)
    const glassMat = new THREE.MeshStandardMaterial({
      color: '#111827',
      metalness: 0.9,
      roughness: 0.05,
      transparent: true,
      opacity: 0.72
    });

    // 1. Lower Aerodynamic Chassis / Floorpan
    const chassisGeom = new THREE.BoxGeometry(2.1, 0.45, 4.4);
    const chassis = new THREE.Mesh(chassisGeom, paintMat);
    chassis.position.y = 0.45;
    chassis.castShadow = true;
    chassis.receiveShadow = true;
    group.add(chassis);

    // Front Sloped Nose / Hood
    const hoodGeom = new THREE.BoxGeometry(1.95, 0.28, 1.4);
    const hood = new THREE.Mesh(hoodGeom, paintMat);
    hood.position.set(0, 0.52, 1.35);
    hood.rotation.x = -0.12;
    hood.castShadow = true;
    group.add(hood);

    // Front Carbon Splitter
    const splitterGeom = new THREE.BoxGeometry(2.15, 0.08, 0.6);
    const splitter = new THREE.Mesh(splitterGeom, carbonMat);
    splitter.position.set(0, 0.25, 2.15);
    group.add(splitter);

    // 2. Aerodynamic Cockpit Cabin & Windshield
    const cabinGeom = new THREE.BoxGeometry(1.65, 0.6, 2.1);
    const cabin = new THREE.Mesh(cabinGeom, glassMat);
    cabin.position.set(0, 0.92, -0.2);
    cabin.castShadow = true;
    group.add(cabin);

    // Roof Panel
    const roofGeom = new THREE.BoxGeometry(1.5, 0.06, 1.3);
    const roof = new THREE.Mesh(roofGeom, paintMat);
    roof.position.set(0, 1.24, -0.25);
    roof.castShadow = true;
    group.add(roof);

    // Rear Engine Cover Louvers / Fastback
    const rearDeckGeom = new THREE.BoxGeometry(1.9, 0.35, 1.2);
    const rearDeck = new THREE.Mesh(rearDeckGeom, carbonMat);
    rearDeck.position.set(0, 0.68, -1.5);
    rearDeck.castShadow = true;
    group.add(rearDeck);

    // 3. High Downforce Rear GT Wing Spoiler
    const wingGeom = new THREE.BoxGeometry(2.2, 0.06, 0.55);
    const wing = new THREE.Mesh(wingGeom, carbonMat);
    wing.position.set(0, 1.25, -2.15);
    wing.castShadow = true;
    group.add(wing);

    // Spoiler Struts (Dual Uprights)
    const strutGeom = new THREE.BoxGeometry(0.06, 0.45, 0.25);
    const strutL = new THREE.Mesh(strutGeom, carbonMat);
    strutL.position.set(-0.65, 1.02, -2.12);
    const strutR = strutL.clone();
    strutR.position.x = 0.65;
    group.add(strutL, strutR);

    // 4. Front Dual High-Intensity LED Headlights + Real Three.js Spotlights!
    const lightLensMat = new THREE.MeshStandardMaterial({
      color: '#e0f2fe',
      emissive: '#38bdf8',
      emissiveIntensity: 4.5,
      roughness: 0.1
    });
    const hLightGeom = new THREE.BoxGeometry(0.35, 0.12, 0.1);
    const hLightL = new THREE.Mesh(hLightGeom, lightLensMat);
    hLightL.position.set(-0.75, 0.52, 2.18);
    const hLightR = hLightL.clone();
    hLightR.position.x = 0.75;
    group.add(hLightL, hLightR);

    // Real dynamic SpotLight beams casting on road
    const spotL = new THREE.SpotLight('#ffffff', 3.5, 38, Math.PI / 6, 0.35);
    spotL.position.set(-0.75, 0.55, 2.2);
    spotL.target.position.set(-0.75, 0.0, 16.0);
    group.add(spotL);
    group.add(spotL.target);

    const spotR = new THREE.SpotLight('#ffffff', 3.5, 38, Math.PI / 6, 0.35);
    spotR.position.set(0.75, 0.55, 2.2);
    spotR.target.position.set(0.75, 0.0, 16.0);
    group.add(spotR);
    group.add(spotR.target);

    // 5. Rear Dual Taillight Bar (GTA 6 Style Neon Crimson)
    const tailMat = new THREE.MeshStandardMaterial({
      color: '#ef4444',
      emissive: '#ef4444',
      emissiveIntensity: 4.0,
      roughness: 0.1
    });
    const tailGeom = new THREE.BoxGeometry(1.9, 0.12, 0.08);
    const tailMesh = new THREE.Mesh(tailGeom, tailMat);
    tailMesh.position.set(0, 0.58, -2.2);
    group.add(tailMesh);

    // Dual Performance Exhaust Tips
    const exhMat = new THREE.MeshStandardMaterial({
      color: '#334155',
      metalness: 0.95,
      roughness: 0.2
    });
    const exhGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.25, 12);
    exhGeom.rotateX(Math.PI / 2);
    const exhL = new THREE.Mesh(exhGeom, exhMat);
    exhL.position.set(-0.35, 0.35, -2.22);
    const exhR = exhL.clone();
    exhR.position.x = 0.35;
    group.add(exhL, exhR);

    // 6. Alloy Wheels with Disc Brakes & Tires
    const tireMat = new THREE.MeshStandardMaterial({ color: '#171717', roughness: 0.75, metalness: 0.1 });
    const rimMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.15, metalness: 0.95 });
    const brakeMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.2, metalness: 0.8 });

    const createWheel = (isFront) => {
      const wheelPivot = new THREE.Group();
      const wheelMesh = new THREE.Group();

      // Tire
      const tireGeom = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 20);
      tireGeom.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeom, tireMat);
      tire.castShadow = true;
      wheelMesh.add(tire);

      // Alloy Rim (Spokes)
      const rimGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.33, 16);
      rimGeom.rotateZ(Math.PI / 2);
      const rim = new THREE.Mesh(rimGeom, rimMat);
      wheelMesh.add(rim);

      // Center Nut
      const nutGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.35, 8);
      nutGeom.rotateZ(Math.PI / 2);
      const nut = new THREE.Mesh(nutGeom, brakeMat);
      wheelMesh.add(nut);

      wheelPivot.add(wheelMesh);
      return { pivot: wheelPivot, mesh: wheelMesh, isFront };
    };

    const wFL = createWheel(true);
    wFL.pivot.position.set(-1.05, 0.42, 1.35);
    const wFR = createWheel(true);
    wFR.pivot.position.set(1.05, 0.42, 1.35);

    const wBL = createWheel(false);
    wBL.pivot.position.set(-1.05, 0.42, -1.35);
    const wBR = createWheel(false);
    wBR.pivot.position.set(1.05, 0.42, -1.35);

    group.add(wFL.pivot, wFR.pivot, wBL.pivot, wBR.pivot);

    // 7. Interactive Hovering Drive Icon / Hologram
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 128;
    badgeCanvas.height = 64;
    const bctx = badgeCanvas.getContext('2d');
    bctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    bctx.fillRect(4, 4, 120, 56);
    bctx.strokeStyle = '#00f0ff';
    bctx.lineWidth = 3;
    bctx.strokeRect(4, 4, 120, 56);
    bctx.fillStyle = '#00f0ff';
    bctx.font = 'bold 22px sans-serif';
    bctx.textAlign = 'center';
    bctx.fillText('[F] LÁI XE', 64, 38);

    const badgeTex = new THREE.CanvasTexture(badgeCanvas);
    const badgeMat = new THREE.SpriteMaterial({ map: badgeTex, transparent: true, opacity: 0.95 });
    const badgeSprite = new THREE.Sprite(badgeMat);
    badgeSprite.position.set(0, 2.2, 0);
    badgeSprite.scale.set(1.6, 0.8, 1);
    group.add(badgeSprite);

    // Store runtime rig on actor
    actor._runtime.vehicleRig = {
      wFL, wFR, wBL, wBR,
      spotL, spotR,
      badgeSprite,
      tailMesh
    };

    this.animatedVehicles.push({ actor, group, rig: actor._runtime.vehicleRig });
    return group;
  }

  // GTA 6 Tropical Curved Coconut Palm Tree Mesh
  buildPalmTreeMesh(actor) {
    const group = new THREE.Group();
    const height = actor.dimensions?.height || 7.0;

    // Curved Trunk using multi-segment stacked tilted cylinders
    const barkMat = new THREE.MeshStandardMaterial({
      color: '#5c4033',
      roughness: 0.85,
      metalness: 0.1
    });
    if (this.textures['palm_bark']) {
      barkMat.map = this.textures['palm_bark'];
    }

    const segments = 6;
    const segHeight = height / segments;
    let currY = 0;
    let currX = 0;
    let currZ = 0;
    const angleCurve = 0.05;

    for (let i = 0; i < segments; i++) {
      const radBottom = 0.42 * (1 - (i / segments) * 0.45);
      const radTop = 0.42 * (1 - ((i + 1) / segments) * 0.45);
      const geom = new THREE.CylinderGeometry(radTop, radBottom, segHeight, 12);
      const segMesh = new THREE.Mesh(geom, barkMat);
      segMesh.position.set(currX, currY + segHeight / 2, currZ);
      segMesh.rotation.z = Math.sin(i * 0.3) * angleCurve;
      segMesh.castShadow = true;
      segMesh.receiveShadow = true;
      group.add(segMesh);

      currY += segHeight;
      currX += Math.sin(i * 0.3) * angleCurve * segHeight;
    }

    // Coconut cluster under crown
    const cocoMat = new THREE.MeshStandardMaterial({ color: '#2d1810', roughness: 0.7 });
    for (let c = 0; c < 4; c++) {
      const cocoGeom = new THREE.SphereGeometry(0.2, 8, 8);
      const coco = new THREE.Mesh(cocoGeom, cocoMat);
      const ang = (c / 4) * Math.PI * 2;
      coco.position.set(currX + Math.cos(ang) * 0.28, currY - 0.2, currZ + Math.sin(ang) * 0.28);
      group.add(coco);
    }

    // Lush Palm Fronds radiating in crown
    const frondMat = new THREE.MeshStandardMaterial({
      color: '#15803d',
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    const fronds = [];
    const frondCount = 10;
    for (let f = 0; f < frondCount; f++) {
      const angle = (f / frondCount) * Math.PI * 2;
      const frondGroup = new THREE.Group();
      frondGroup.position.set(currX, currY, currZ);
      frondGroup.rotation.y = angle;

      // Arching leaf blade
      const leafGeom = new THREE.PlaneGeometry(0.8, 3.2, 3, 6);
      leafGeom.translate(0, 1.6, 0);
      leafGeom.rotateX(-0.5); // Arch downward
      const leaf = new THREE.Mesh(leafGeom, frondMat);
      leaf.castShadow = true;
      frondGroup.add(leaf);

      frondGroup.userData = {
        baseRotX: frondGroup.rotation.x,
        baseRotZ: frondGroup.rotation.z,
        index: f
      };
      fronds.push(frondGroup);
      group.add(frondGroup);
    }

    group.userData.fronds = fronds;
    this.animatedPalms.push(group);
    return group;
  }

  // GTA 6 Dynamic Coastal Ocean Water Plane with Wave Undulation
  buildOceanWaterMesh(actor) {
    const width = actor.dimensions?.width || 140;
    const depth = actor.dimensions?.depth || 140;
    const geom = new THREE.PlaneGeometry(width, depth, 36, 36);
    geom.rotateX(-Math.PI / 2);

    const oceanMat = new THREE.MeshStandardMaterial({
      color: '#0284c7',
      emissive: '#0369a1',
      emissiveIntensity: 0.25,
      metalness: 0.9,
      roughness: 0.08,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geom, oceanMat);
    mesh.receiveShadow = true;
    mesh.userData.initialPositions = new Float32Array(geom.attributes.position.array);

    this.animatedOceans.push(mesh);
    return mesh;
  }

  // GTA 6 Art-Deco Miami Neon Hotel Building
  buildBuildingMesh(actor) {
    const group = new THREE.Group();
    const dims = actor.dimensions || { width: 14, height: 16, depth: 10 };

    // 1. Main Pastel Hotel Tower
    const hotelMat = new THREE.MeshStandardMaterial({
      color: actor.material?.color || '#fb7185',
      roughness: 0.45,
      metalness: 0.15
    });
    if (this.textures['hotel_facade']) {
      hotelMat.map = this.textures['hotel_facade'];
    }

    const towerGeom = new THREE.BoxGeometry(dims.width, dims.height, dims.depth);
    const tower = new THREE.Mesh(towerGeom, hotelMat);
    tower.position.y = dims.height / 2;
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    // 2. White Art-Deco Balconies & Eyebrows
    const trimMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3, metalness: 0.2 });
    for (let floor = 1; floor <= 3; floor++) {
      const balcGeom = new THREE.BoxGeometry(dims.width + 0.6, 0.25, 1.2);
      const balc = new THREE.Mesh(balcGeom, trimMat);
      balc.position.set(0, floor * 3.8, dims.depth / 2 + 0.5);
      balc.castShadow = true;
      group.add(balc);
    }

    // 3. Ground Entrance Canopy
    const canopyGeom = new THREE.BoxGeometry(5.0, 0.3, 3.2);
    const canopy = new THREE.Mesh(canopyGeom, trimMat);
    canopy.position.set(0, 3.2, dims.depth / 2 + 1.6);
    canopy.castShadow = true;
    group.add(canopy);

    // Entrance Sconce Lights
    const sconceL = new THREE.PointLight('#fef08a', 2.0, 8);
    sconceL.position.set(-2.0, 2.6, dims.depth / 2 + 1.2);
    const sconceR = sconceL.clone();
    sconceR.position.x = 2.0;
    group.add(sconceL, sconceR);

    // 4. Roof Neon Billboard Sign ("HOTEL VICE")
    const signGroup = new THREE.Group();
    signGroup.position.set(0, dims.height + 1.4, 0);

    const signBoardGeom = new THREE.BoxGeometry(dims.width * 0.7, 1.8, 0.4);
    const signBoardMat = new THREE.MeshStandardMaterial({ color: '#090d16', metalness: 0.9, roughness: 0.2 });
    const signBoard = new THREE.Mesh(signBoardGeom, signBoardMat);
    signGroup.add(signBoard);

    // Glowing Neon Letters / Band
    const neonMat = new THREE.MeshStandardMaterial({
      color: '#ff2d55',
      emissive: '#ff2d55',
      emissiveIntensity: 3.8,
      roughness: 0.1
    });
    const neonBarGeom = new THREE.BoxGeometry(dims.width * 0.65, 0.3, 0.45);
    const neonBar = new THREE.Mesh(neonBarGeom, neonMat);
    neonBar.position.y = 0.55;
    signGroup.add(neonBar);

    const neonBar2 = neonBar.clone();
    neonBar2.material = new THREE.MeshStandardMaterial({
      color: '#00f0ff',
      emissive: '#00f0ff',
      emissiveIntensity: 3.8,
      roughness: 0.1
    });
    neonBar2.position.y = -0.55;
    signGroup.add(neonBar2);

    group.add(signGroup);
    return group;
  }

  // GTA 6 Asphalt Highway / Boulevard Road with Curbs & Puddles
  buildRoadMesh(actor) {
    const group = new THREE.Group();
    const width = actor.dimensions?.width || 14;
    const length = actor.dimensions?.depth || 140;

    // 1. Asphalt Deck
    const roadMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.35,
      metalness: 0.4
    });
    if (this.textures['asphalt_road']) {
      roadMat.map = this.textures['asphalt_road'];
      roadMat.map.repeat.set(1, Math.round(length / 14));
      if (this.textures['asphalt_road_normal']) {
        roadMat.normalMap = this.textures['asphalt_road_normal'];
        roadMat.normalScale = new THREE.Vector2(1.5, 1.5);
        roadMat.normalMap.repeat.set(1, Math.round(length / 14));
      }
    }

    const roadGeom = new THREE.BoxGeometry(width, 0.3, length);
    const roadMesh = new THREE.Mesh(roadGeom, roadMat);
    roadMesh.position.y = 0.15;
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    // 2. Concrete Curbs (Left & Right)
    const curbMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.7, metalness: 0.1 });
    const curbGeom = new THREE.BoxGeometry(0.5, 0.45, length);
    const curbL = new THREE.Mesh(curbGeom, curbMat);
    curbL.position.set(-width / 2 - 0.25, 0.22, 0);
    curbL.receiveShadow = true;
    curbL.castShadow = true;

    const curbR = curbL.clone();
    curbR.position.x = width / 2 + 0.25;
    group.add(curbL, curbR);

    // 3. Sidewalk Promenade (Pedestrian walkway)
    const walkMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.6, metalness: 0.1 });
    const walkGeom = new THREE.BoxGeometry(4.0, 0.4, length);
    const walkL = new THREE.Mesh(walkGeom, walkMat);
    walkL.position.set(-width / 2 - 2.5, 0.2, 0);
    walkL.receiveShadow = true;
    group.add(walkL);

    return group;
  }

  // GTA 6 Coastal Boulevard Street Light Lamppost
  buildStreetLightMesh(actor) {
    const group = new THREE.Group();
    const height = 6.5;

    const metalMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.85, roughness: 0.25 });

    // Vertical Post
    const postGeom = new THREE.CylinderGeometry(0.12, 0.18, height, 12);
    const post = new THREE.Mesh(postGeom, metalMat);
    post.position.y = height / 2;
    post.castShadow = true;
    group.add(post);

    // Overhanging Arm
    const armGeom = new THREE.BoxGeometry(2.0, 0.1, 0.1);
    const arm = new THREE.Mesh(armGeom, metalMat);
    arm.position.set(0.9, height - 0.1, 0);
    group.add(arm);

    // Luminaire Housing & Emissive Lens
    const headGeom = new THREE.BoxGeometry(0.6, 0.12, 0.35);
    const headMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.9, roughness: 0.2 });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.set(1.7, height - 0.2, 0);
    group.add(head);

    const lensGeom = new THREE.BoxGeometry(0.5, 0.04, 0.28);
    const lensMat = new THREE.MeshStandardMaterial({
      color: '#fef08a',
      emissive: '#fef08a',
      emissiveIntensity: 4.0
    });
    const lens = new THREE.Mesh(lensGeom, lensMat);
    lens.position.set(1.7, height - 0.28, 0);
    group.add(lens);

    // Warm street light casting down
    const streetLight = new THREE.SpotLight('#fef08a', 3.2, 22, Math.PI / 4, 0.4);
    streetLight.position.set(1.7, height - 0.3, 0);
    streetLight.target.position.set(1.7, 0, 0);
    group.add(streetLight);
    group.add(streetLight.target);

    return group;
  }

  // GTA 6 Traffic Safety Cone (Physics Prop)
  buildTrafficConeMesh(actor) {
    const group = new THREE.Group();

    // Base square
    const baseMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.4 });
    const baseGeom = new THREE.BoxGeometry(0.6, 0.06, 0.6);
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0.03;
    base.castShadow = true;
    group.add(base);

    // Orange Cone
    const coneGeom = new THREE.ConeGeometry(0.24, 0.85, 16);
    const cone = new THREE.Mesh(coneGeom, baseMat);
    cone.position.y = 0.45;
    cone.castShadow = true;
    group.add(cone);

    // Reflective White Band
    const bandMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.2, metalness: 0.5 });
    const bandGeom = new THREE.CylinderGeometry(0.14, 0.17, 0.2, 16);
    const band = new THREE.Mesh(bandGeom, bandMat);
    band.position.y = 0.42;
    group.add(band);

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

      // Clean up GTA 6 dynamic simulation meshes
      this.animatedOceans = this.animatedOceans.filter(m => m !== mesh);
      this.animatedPalms = this.animatedPalms.filter(m => m !== mesh);
      this.animatedVehicles = this.animatedVehicles.filter(v => v.group !== mesh && v.actor !== actor);
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

    // Animate GTA 6 Coastal Ocean Water Waves
    if (this.animatedOceans && this.animatedOceans.length > 0) {
      const time = performance.now() * 0.001;
      for (const ocean of this.animatedOceans) {
        if (!ocean.geometry?.attributes?.position) continue;
        const pos = ocean.geometry.attributes.position;
        const init = ocean.userData.initialPositions;
        if (!init) continue;

        for (let i = 0; i < pos.count; i++) {
          const ix = init[i * 3];
          const iz = init[i * 3 + 2];
          const wave = Math.sin(ix * 0.12 + time * 2.2) * 0.45 + Math.cos(iz * 0.10 + time * 1.6) * 0.35;
          pos.setY(i, wave);
        }
        pos.needsUpdate = true;
        ocean.geometry.computeVertexNormals();
      }
    }

    // Animate GTA 6 Tropical Palm Trees Frond Wind Sway
    if (this.animatedPalms && this.animatedPalms.length > 0) {
      const time = performance.now() * 0.001;
      for (const palm of this.animatedPalms) {
        if (palm.userData?.fronds) {
          for (let i = 0; i < palm.userData.fronds.length; i++) {
            const f = palm.userData.fronds[i];
            f.rotation.z = f.userData.baseRotZ + Math.sin(time * 2.4 + i * 0.8) * 0.08;
            f.rotation.x = f.userData.baseRotX + Math.cos(time * 1.8 + i * 0.8) * 0.05;
          }
        }
      }
    }

    // Update GTA 6 Vehicle Interactive Hover Badge proximity
    if (this.animatedVehicles && this.animatedVehicles.length > 0) {
      const player = this.engine.actors.find(a => a.tag === 'player');
      for (const v of this.animatedVehicles) {
        if (v.rig?.badgeSprite) {
          if (!this.engine.isPlaying || this.engine.currentVehicle === v.actor) {
            v.rig.badgeSprite.visible = false;
          } else if (player) {
            const dx = player.transform.position.x - v.actor.transform.position.x;
            const dy = player.transform.position.y - v.actor.transform.position.y;
            const dz = player.transform.position.z - v.actor.transform.position.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            v.rig.badgeSprite.visible = dist < 4.5;
          }
        }
      }
    }

    // Subtle Volumetric God Ray Shimmer
    if (this.godRayCone) {
      this.godRayCone.rotation.z += dt * 0.03;
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
