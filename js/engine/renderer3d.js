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

    // GTA 6 & Dude Theft Wars Dynamic Simulation Meshes
    this.animatedOceans = [];
    this.animatedPalms = [];
    this.animatedVehicles = [];
    this.animatedDudeProps = [];

    // Freefly Camera State
    this.isFreeflying = false;
    this.cameraSpeed = 14.0;
    this.freeflyKeys = {};

    this.initScene();
  }

  initScene() {
    // 1. Scene & Unreal Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#140b20');
    this.scene.fog = new THREE.FogExp2('#140b20', 0.0035);

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
    this.renderer.toneMappingExposure = 1.0;
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
        0.72,  // strength
        0.38,  // radius
        0.82   // threshold (only bright neon & glowing cores radiate bloom, keeping asphalt dark & rich)
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
    hotelTex.wrapS = THREE.RepeatWrapping;
    hotelTex.wrapT = THREE.RepeatWrapping;
    this.textures['hotel_facade'] = hotelTex;
    this.textures['hotel_facade_normal'] = this.generateNormalMapFromCanvas(hotelCanvas, 1.6);
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
    // 1. Unreal Engine Atmospheric Sky Dome (Miami Vice Rayleigh Sunset & City Skyline)
    const skyGeom = new THREE.SphereGeometry(380, 32, 24);
    const skyCanvas = document.createElement('canvas');
    skyCanvas.width = 1024;
    skyCanvas.height = 512;
    const sctx = skyCanvas.getContext('2d');

    // Multi-stop Atmospheric Sunset Gradient (Zenith deep violet-indigo -> Horizon fiery golden amber)
    const skyGrad = sctx.createLinearGradient(0, 0, 0, 512);
    skyGrad.addColorStop(0.0, '#090414');  // Deep Midnight Zenith
    skyGrad.addColorStop(0.28, '#1e103d'); // High Altitude Violet Indigo
    skyGrad.addColorStop(0.42, '#581c87'); // Atmospheric Purple Haze
    skyGrad.addColorStop(0.50, '#9d174d'); // Sunset Crimson Magenta
    skyGrad.addColorStop(0.56, '#ea580c'); // Fiery Twilight Orange
    skyGrad.addColorStop(0.62, '#f59e0b'); // Golden Sunset Horizon
    skyGrad.addColorStop(0.70, '#1c1917'); // Dark Sea Horizon
    skyGrad.addColorStop(1.0, '#0c0a09');  // Nadir
    sctx.fillStyle = skyGrad;
    sctx.fillRect(0, 0, 1024, 512);

    // Glowing Golden Setting Sun Disc with Soft Atmospheric Corona
    const sunGrad = sctx.createRadialGradient(640, 265, 0, 640, 265, 95);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.2, '#fef08a');
    sunGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.45)');
    sunGrad.addColorStop(0.8, 'rgba(168, 85, 247, 0.2)');
    sunGrad.addColorStop(1.0, 'rgba(0,0,0,0)');
    sctx.fillStyle = sunGrad;
    sctx.beginPath();
    sctx.arc(640, 265, 95, 0, Math.PI * 2);
    sctx.fill();

    // Distant Vice City Skyscraper Skyline Silhouettes on Horizon
    sctx.fillStyle = '#0a0614';
    for (let bx = 0; bx < 1024; bx += 24) {
      const bHeight = 25 + Math.sin(bx * 0.05) * 18 + Math.cos(bx * 0.12) * 12;
      const bWidth = 16 + (bx % 3) * 6;
      sctx.fillRect(bx, 290 - bHeight, bWidth, bHeight);

      // Sparkling window grids on distant skyscrapers
      sctx.fillStyle = 'rgba(254, 240, 138, 0.65)';
      for (let wy = 290 - bHeight + 4; wy < 288; wy += 5) {
        for (let wx = bx + 3; wx < bx + bWidth - 3; wx += 4) {
          if (Math.random() > 0.4) {
            sctx.fillRect(wx, wy, 2, 2.5);
          }
        }
      }
      sctx.fillStyle = '#0a0614';
    }

    // Blinking Red Aviation Safety Beacons on Tower Spires
    sctx.fillStyle = '#ef4444';
    for (let bx = 40; bx < 1024; bx += 96) {
      sctx.fillRect(bx, 255, 3, 3);
    }

    const skyTex = new THREE.CanvasTexture(skyCanvas);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      fog: false
    });
    this.skyDome = new THREE.Mesh(skyGeom, skyMat);
    this.scene.add(this.skyDome);

    // 2. Subtle Volumetric Sun Light Shaft (Balanced Opacity, No Screen Washout)
    const shaftGeom = new THREE.ConeGeometry(24, 75, 32, 1, true);
    shaftGeom.translate(0, -37.5, 0);
    shaftGeom.rotateX(Math.PI / 2);
    const shaftMat = new THREE.MeshBasicMaterial({
      color: '#ffedd5',
      transparent: true,
      opacity: 0.025, // Soft cinematic sun beam
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.godRayCone = new THREE.Mesh(shaftGeom, shaftMat);
    this.godRayCone.position.set(28, 22, -60);
    this.godRayCone.lookAt(0, 2.0, 10);
    this.scene.add(this.godRayCone);

    // 3. Subtle Atmospheric Stars in Twilight Sky
    const starCount = 200;
    const starGeom = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 260 + Math.random() * 40;

      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.sin(phi) * Math.sin(theta)) + 40;
      starPos[i * 3 + 2] = r * Math.cos(phi);

      starColors[i * 3] = 1.0;
      starColors[i * 3 + 1] = 0.9;
      starColors[i * 3 + 2] = 1.0;
    }

    starGeom.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeom.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      fog: false
    });
    const stars = new THREE.Points(starGeom, starMat);
    this.scene.add(stars);

    // 4. Volumetric Golden Atmospheric Dust Motes
    const moteCount = 120;
    const moteGeom = new THREE.BufferGeometry();
    const motePos = new Float32Array(moteCount * 3);
    this.moteData = [];

    for (let i = 0; i < moteCount; i++) {
      const mx = (Math.random() - 0.5) * 70;
      const my = 0.5 + Math.random() * 12;
      const mz = (Math.random() - 0.5) * 80;

      motePos[i * 3] = mx;
      motePos[i * 3 + 1] = my;
      motePos[i * 3 + 2] = mz;

      this.moteData.push({
        baseY: my,
        speed: 0.4 + Math.random() * 0.8,
        offset: Math.random() * Math.PI * 2
      });
    }

    moteGeom.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
    const moteMat = new THREE.PointsMaterial({
      size: 0.35,
      color: '#facc15',
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });
    this.motePoints = new THREE.Points(moteGeom, moteMat);
    this.scene.add(this.motePoints);
  }

  setupLighting() {
    // 1. Hemisphere Light (Sky: Soft Sunset Violet, Ground: Warm Earth Amber)
    this.hemiLight = new THREE.HemisphereLight('#c084fc', '#271206', 0.55);
    this.scene.add(this.hemiLight);

    // 2. Primary Directional Sunlight (Warm Golden Dusk Sunlight with Soft Cascaded Shadows)
    this.dirLight = new THREE.DirectionalLight('#ff9f43', 1.45);
    this.dirLight.position.set(30, 35, 25);
    this.dirLight.castShadow = true;

    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 1.0;
    this.dirLight.shadow.camera.far = 180;
    const shadowD = 45;
    this.dirLight.shadow.camera.left = -shadowD;
    this.dirLight.shadow.camera.right = shadowD;
    this.dirLight.shadow.camera.top = shadowD;
    this.dirLight.shadow.camera.bottom = -shadowD;
    this.dirLight.shadow.bias = -0.0003;
    this.scene.add(this.dirLight);

    // 3. Key Rim Light (Vivid Electric Cyan Backlight from rear left)
    this.rimLight = new THREE.DirectionalLight('#00f0ff', 0.85);
    this.rimLight.position.set(-24, 20, -26);
    this.scene.add(this.rimLight);

    // 4. Secondary Fill Rim Light (Vivid Neon Magenta Backlight from rear right)
    this.rimLight2 = new THREE.DirectionalLight('#e879f9', 0.5);
    this.rimLight2.position.set(24, 16, -26);
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
    // 0. Dude Theft Wars 3D Actors
    if (actor.shape === 'dude_character') {
      return this.buildDudeCharacterMesh(actor);
    }
    if (actor.tag === 'dude_villa' || actor.shape === 'dude_villa') {
      return this.buildDudeVillaMesh(actor);
    }
    if (actor.tag === 'dude_burger' || actor.shape === 'dude_burger') {
      return this.buildDudeBurgerMesh(actor);
    }
    if (actor.tag === 'police_station' || actor.shape === 'police_station') {
      return this.buildPoliceStationMesh(actor);
    }
    if (actor.tag === 'airport_runway' || actor.shape === 'airport_runway') {
      return this.buildAirportRunwayMesh(actor);
    }
    if (actor.shape === 'stunt_plane') {
      return this.buildStuntBiplaneMesh(actor);
    }
    if (actor.tag === 'soccer_stadium' || actor.shape === 'soccer_stadium') {
      return this.buildSoccerStadiumMesh(actor);
    }
    if (actor.tag === 'soccer_ball' || actor.shape === 'soccer_ball') {
      return this.buildSoccerBallMesh(actor);
    }
    if (actor.tag === 'skate_ramp' || actor.shape === 'skate_ramp') {
      return this.buildSkateRampMesh(actor);
    }
    if (actor.tag === 'trampoline' || actor.shape === 'trampoline') {
      return this.buildTrampolineMesh(actor);
    }
    if (actor.tag === 'gas_station' || actor.shape === 'gas_station') {
      return this.buildGasStationMesh(actor);
    }
    if (actor.tag === 'gun_shop' || actor.shape === 'gun_shop') {
      return this.buildGunShopMesh(actor);
    }

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

  // =========================================================================
  // DUDE THEFT WARS 3D: ICONIC PROCEDURAL ARCHITECTURE & VEHICLES
  // =========================================================================

  // --- 1. PROTAGONIST JACK (THE DUDE HERO) ---
  buildDudeCharacterMesh(actor) {
    const group = new THREE.Group();
    group.isCharacterGroup = true;

    const shirtColor = actor.material?.color || '#f59e0b'; // Iconic yellow dude shirt
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7, metalness: 0.1 });
    const skinMat = new THREE.MeshStandardMaterial({ color: '#ffdfba', roughness: 0.6, metalness: 0.05 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: '#1e3a8a', roughness: 0.75, metalness: 0.1 });
    const capMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.6, metalness: 0.1 });
    const shadesMat = new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.1, metalness: 0.95 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.5, metalness: 0.1 });

    // Torso (Yellow T-Shirt)
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 1.05, 0);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.0, 0.52), shirtMat);
    torso.castShadow = true;
    torsoGroup.add(torso);

    // Head with Dude Cap & Cool Sunglasses
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.82, 0);

    const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.55), skinMat);
    head.castShadow = true;
    headGroup.add(head);

    // Red Snapback Cap
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.18, 0.68), capMat);
    cap.position.set(0, 0.32, 0.04);
    headGroup.add(cap);

    // Cool Black Sunglasses Slit
    const shades = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.08), shadesMat);
    shades.position.set(0, 0.06, 0.29);
    headGroup.add(shades);

    torsoGroup.add(headGroup);

    // Arms with Shoulder Pivots
    const armLGroup = new THREE.Group();
    armLGroup.position.set(-0.56, 0.32, 0);
    const armL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.85, 0.28), shirtMat);
    armL.position.y = -0.32;
    armL.castShadow = true;
    armLGroup.add(armL);
    const handL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.24), skinMat);
    handL.position.y = -0.76;
    armLGroup.add(handL);
    torsoGroup.add(armLGroup);

    const armRGroup = new THREE.Group();
    armRGroup.position.set(0.56, 0.32, 0);
    const armR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.85, 0.28), shirtMat);
    armR.position.y = -0.32;
    armR.castShadow = true;
    armRGroup.add(armR);
    const handR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.24), skinMat);
    handR.position.y = -0.76;
    armRGroup.add(handR);
    const gun = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.55), new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.3, metalness: 0.8 }));
    gun.position.set(0, -0.76, 0.28);
    armRGroup.add(gun);
    torsoGroup.add(armRGroup);

    group.add(torsoGroup);

    // Legs with Hip Pivots
    const legLGroup = new THREE.Group();
    legLGroup.position.set(-0.24, 0.65, 0);
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.9, 0.34), pantsMat);
    legL.position.y = -0.25;
    legL.castShadow = true;
    legLGroup.add(legL);
    const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.48), shoeMat);
    shoeL.position.set(0, -0.68, 0.06);
    legLGroup.add(shoeL);
    group.add(legLGroup);

    const legRGroup = new THREE.Group();
    legRGroup.position.set(0.24, 0.65, 0);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.9, 0.34), pantsMat);
    legR.position.y = -0.25;
    legR.castShadow = true;
    legRGroup.add(legR);
    const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.2, 0.48), shoeMat);
    shoeR.position.set(0, -0.68, 0.06);
    legRGroup.add(shoeR);
    group.add(legRGroup);

    actor._runtime.characterRig = {
      torso: torsoGroup,
      head: headGroup,
      armL: armLGroup,
      armR: armRGroup,
      legL: legLGroup,
      legR: legRGroup
    };

    return group;
  }

  // --- 2. JACK'S LUXURY VILLA, GARAGE & POOL COMPLEX ---
  buildDudeVillaMesh(actor) {
    const group = new THREE.Group();

    // 1. Two-Story Main Villa
    const wallMat = new THREE.MeshStandardMaterial({ color: '#fef9c3', roughness: 0.6, metalness: 0.1 });
    const roofMat = new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.5, metalness: 0.15 });
    const woodMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.7, metalness: 0.1 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.8, metalness: 0.15 });

    const houseGeom = new THREE.BoxGeometry(18, 8.5, 14);
    const house = new THREE.Mesh(houseGeom, wallMat);
    house.position.y = 4.25;
    house.castShadow = true;
    house.receiveShadow = true;
    group.add(house);

    // Windows with White Frames & Blue Tinted Glass
    const winFrameMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 });
    [[-4, 2.5, 7.05], [4, 2.5, 7.05], [-4, 6.2, 7.05], [4, 6.2, 7.05], [-7.05, 4.0, 0], [7.05, 4.0, 0]].forEach(p => {
      const isSide = Math.abs(p[0]) > 6;
      const frameGeom = isSide ? new THREE.BoxGeometry(0.15, 2.2, 2.6) : new THREE.BoxGeometry(2.6, 2.2, 0.15);
      const frame = new THREE.Mesh(frameGeom, winFrameMat);
      frame.position.set(p[0], p[1], p[2]);
      group.add(frame);
    });

    // Front Wooden Door & Porch Step
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.8, 0.2), woodMat);
    door.position.set(0, 1.9, 7.08);
    const doorknob = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.9 }));
    doorknob.position.set(0.8, 1.9, 7.22);
    const porch = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.35, 2.0), concreteMat);
    porch.position.set(0, 0.18, 7.9);
    group.add(door, doorknob, porch);

    // Terracotta 4-Sided Hip Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(13.6, 4.5, 4), roofMat);
    roof.rotation.y = Math.PI / 4;
    roof.position.set(0, 10.75, 0);
    roof.castShadow = true;
    group.add(roof);

    // Brick Chimney
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.5, 1.6), woodMat);
    chimney.position.set(5.0, 10.5, 2.0);
    group.add(chimney);

    // 2. Attached Car Garage
    const garage = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 12), new THREE.MeshStandardMaterial({ color: '#f3f4f6', roughness: 0.6 }));
    garage.position.set(-13, 3.0, 0);
    garage.castShadow = true;
    garage.receiveShadow = true;
    group.add(garage);

    const garageDoor = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 4.8), new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.4, metalness: 0.5 }));
    garageDoor.position.set(-13, 2.5, 6.06);
    group.add(garageDoor);

    // Concrete Driveway
    const driveway = new THREE.Mesh(new THREE.BoxGeometry(12, 0.15, 18), concreteMat);
    driveway.position.set(-13, 0.08, 14);
    driveway.receiveShadow = true;
    group.add(driveway);

    // 3. Basketball Hoop & Court at Front of Garage
    const bbPole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5.2, 8), new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8 }));
    bbPole.position.set(-13, 2.6, 21.5);
    const bbBoard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 0.1), winFrameMat);
    bbBoard.position.set(-13, 4.6, 21.3);
    const bbRim = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.05, 8, 16), new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.3 }));
    bbRim.rotation.x = Math.PI / 2;
    bbRim.position.set(-13, 4.0, 20.8);
    group.add(bbPole, bbBoard, bbRim);

    // 4. Backyard Swimming Pool
    const poolDeck = new THREE.Mesh(new THREE.BoxGeometry(15, 0.3, 11), new THREE.MeshStandardMaterial({ color: '#fef08a', roughness: 0.7 }));
    poolDeck.position.set(0, 0.15, -14);
    poolDeck.receiveShadow = true;
    group.add(poolDeck);

    // Turquoise Clear Wave Pool Water
    const poolWater = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 9),
      new THREE.MeshStandardMaterial({
        color: '#06b6d4',
        emissive: '#0891b2',
        emissiveIntensity: 0.2,
        roughness: 0.05,
        metalness: 0.9,
        transparent: true,
        opacity: 0.85
      })
    );
    poolWater.rotation.x = -Math.PI / 2;
    poolWater.position.set(0, 0.28, -14);
    group.add(poolWater);

    // Floating Red Donut Lifebuoy in Pool
    const lifeRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.0, 0.35, 10, 20),
      new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.2 })
    );
    lifeRing.rotation.x = Math.PI / 2;
    lifeRing.position.set(-2.5, 0.35, -14);
    group.add(lifeRing);

    // Deck Chair & Striped Sun Umbrella
    const lounger = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 2.4), winFrameMat);
    lounger.position.set(5.5, 0.25, -14);
    const umbPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), concreteMat);
    umbPole.position.set(5.5, 1.6, -11.5);
    const umbTop = new THREE.Mesh(new THREE.ConeGeometry(2.2, 0.9, 10), new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.4 }));
    umbTop.position.set(5.5, 3.1, -11.5);
    group.add(lounger, umbPole, umbTop);

    // BBQ Grill with Glowing Charcoal
    const bbqBowl = new THREE.Mesh(new THREE.SphereGeometry(0.65, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.4 }));
    bbqBowl.rotation.x = Math.PI;
    bbqBowl.position.set(-5.5, 1.1, -17.5);
    const bbqCoals = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.08, 10), new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 3.0 }));
    bbqCoals.position.set(-5.5, 1.15, -17.5);
    const bbqLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 6), new THREE.MeshStandardMaterial({ color: '#18181b' }));
    bbqLeg.position.set(-5.5, 0.55, -17.5);
    group.add(bbqBowl, bbqCoals, bbqLeg);

    return group;
  }

  // --- 3. DUDE BURGER FAST FOOD (WITH 360 ROTATING BURGER) ---
  buildDudeBurgerMesh(actor) {
    const group = new THREE.Group();

    // Fast Food Building Box
    const shopGeom = new THREE.BoxGeometry(20, 8, 16);
    const shopMat = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.5, metalness: 0.1 });
    const shop = new THREE.Mesh(shopGeom, shopMat);
    shop.position.y = 4.0;
    shop.castShadow = true;
    shop.receiveShadow = true;
    group.add(shop);

    // Drive-thru Awning with Red/White Stripes
    const awning = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.25, 3.2), new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.3 }));
    awning.position.set(-10.1, 4.8, 0);
    awning.rotation.z = 0.25;
    group.add(awning);

    // Neon Signboard ("★ DUDE BURGER ★")
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(14, 2.6, 0.6), new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.4 }));
    signBoard.position.set(0, 7.2, 8.3);
    group.add(signBoard);

    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const sctx = signCanvas.getContext('2d');
    sctx.fillStyle = '#1e1b4b';
    sctx.fillRect(0, 0, 512, 128);
    sctx.strokeStyle = '#facc15';
    sctx.lineWidth = 6;
    sctx.strokeRect(8, 8, 496, 112);
    sctx.fillStyle = '#fbbf24';
    sctx.font = 'bold 44px sans-serif';
    sctx.textAlign = 'center';
    sctx.textBaseline = 'middle';
    sctx.fillText('🍔 DUDE BURGER 🍔', 256, 64);
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signSprite = new THREE.Mesh(
      new THREE.PlaneGeometry(13.2, 2.2),
      new THREE.MeshStandardMaterial({ map: signTex, emissiveMap: signTex, emissive: '#facc15', emissiveIntensity: 1.2 })
    );
    signSprite.position.set(0, 7.2, 8.65);
    group.add(signSprite);

    // --- GIANT 3D ROTATING MASCOT HAMBURGER ON ROOF ---
    const burgerGroup = new THREE.Group();
    burgerGroup.position.set(0, 11.2, 0);

    const bunMat = new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.45, metalness: 0.1 });
    const meatMat = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.7, metalness: 0.1 });
    const cheeseMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.25, metalness: 0.2 });
    const tomatoMat = new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.3, metalness: 0.1 });
    const lettuceMat = new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.5, metalness: 0.1 });

    // Bottom Bun
    const bunBottom = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 3.8, 1.1, 18), bunMat);
    bunBottom.position.y = -0.5;
    burgerGroup.add(bunBottom);

    // Beef Patty
    const meat = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.4, 0.9, 18), meatMat);
    meat.position.y = 0.3;
    burgerGroup.add(meat);

    // Melted Cheddar Cheese
    const cheese = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.25, 7.2), cheeseMat);
    cheese.rotation.y = Math.PI / 4;
    cheese.position.y = 0.8;
    burgerGroup.add(cheese);

    // Tomato & Lettuce
    const tomato = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.3, 16), tomatoMat);
    tomato.position.y = 1.05;
    burgerGroup.add(tomato);

    const lettuce = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 0.2, 16), lettuceMat);
    lettuce.position.y = 1.25;
    burgerGroup.add(lettuce);

    // Top Bun with White Sesame Seeds
    const bunTop = new THREE.Mesh(new THREE.SphereGeometry(4.3, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), bunMat);
    bunTop.position.y = 1.35;
    burgerGroup.add(bunTop);

    const sesMat = new THREE.MeshStandardMaterial({ color: '#fef9c3', roughness: 0.3 });
    for (let s = 0; s < 18; s++) {
      const ses = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.25), sesMat);
      const theta = (s / 18) * Math.PI * 2 + Math.random() * 0.2;
      const rad = 1.5 + Math.random() * 2.2;
      ses.position.set(Math.cos(theta) * rad, 3.2 - (rad * 0.28), Math.sin(theta) * rad);
      ses.rotation.y = theta;
      burgerGroup.add(ses);
    }

    group.add(burgerGroup);
    this.animatedDudeProps.push({ type: 'burger', mesh: burgerGroup, group, actor });

    return group;
  }

  // --- 4. POLICE STATION HQ (WITH FLASHING SIRENS) ---
  buildPoliceStationMesh(actor) {
    const group = new THREE.Group();

    // Main Police HQ building
    const bldMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.4, metalness: 0.4 });
    const trimMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.3, metalness: 0.3 });
    const bld = new THREE.Mesh(new THREE.BoxGeometry(24, 12, 18), bldMat);
    bld.position.y = 6.0;
    bld.castShadow = true;
    bld.receiveShadow = true;
    group.add(bld);

    // Front Entrance Canopy & Steps
    const entrance = new THREE.Mesh(new THREE.BoxGeometry(8, 0.35, 3.5), trimMat);
    entrance.position.set(0, 4.2, 9.8);
    const step = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 2.5), new THREE.MeshStandardMaterial({ color: '#94a3b8' }));
    step.position.set(0, 0.2, 9.8);
    group.add(entrance, step);

    // Police Badge Sign
    const signMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0284c7', emissiveIntensity: 1.5 });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(10, 1.8, 0.4), signMat);
    sign.position.set(0, 8.5, 9.2);
    group.add(sign);

    // Communications Mast on Roof
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 8.0, 8), new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.8 }));
    mast.position.set(8, 16.0, -4);
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 4.0 }));
    beacon.position.set(8, 20.0, -4);
    group.add(mast, beacon);

    // Rotating Police Siren Lights (Red & Blue)
    const sirenGroup = new THREE.Group();
    sirenGroup.position.set(-6, 12.6, 0);

    const sirenRed = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.7, 12), new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 4.5 }));
    sirenRed.position.x = -1.0;
    const sirenBlue = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.7, 12), new THREE.MeshStandardMaterial({ color: '#3b82f6', emissive: '#3b82f6', emissiveIntensity: 4.5 }));
    sirenBlue.position.x = 1.0;
    sirenGroup.add(sirenRed, sirenBlue);
    group.add(sirenGroup);

    this.animatedDudeProps.push({ type: 'police_siren', mesh: sirenGroup, group, actor });

    return group;
  }

  // --- 5. AIRPORT RUNWAY & CONTROL TOWER ---
  buildAirportRunwayMesh(actor) {
    const group = new THREE.Group();

    // 220m Runway Deck
    const runwayGeom = new THREE.BoxGeometry(34, 0.25, 220);
    const runwayMat = new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.7, metalness: 0.2 });
    const runway = new THREE.Mesh(runwayGeom, runwayMat);
    runway.position.y = 0.12;
    runway.receiveShadow = true;
    group.add(runway);

    // Centerline Stripes
    const stripeMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 });
    for (let rz = -90; rz <= 90; rz += 22) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.05, 12), stripeMat);
      stripe.position.set(0, 0.26, rz);
      group.add(stripe);
    }

    // Touchdown Threshold Bars
    [-100, 100].forEach(pz => {
      for (let px = -12; px <= 12; px += 3) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 10), stripeMat);
        bar.position.set(px, 0.26, pz);
        group.add(bar);
      }
    });

    // Control Tower (Tower shaft + 360 glass cab)
    const towerShaft = new THREE.Mesh(new THREE.CylinderGeometry(4.0, 5.0, 24, 16), new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.6 }));
    towerShaft.position.set(28, 12, 0);
    towerShaft.castShadow = true;
    group.add(towerShaft);

    const cabGlass = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 5.2, 4.5, 16), new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.8 }));
    cabGlass.position.set(28, 25.5, 0);
    const cabRoof = new THREE.Mesh(new THREE.ConeGeometry(7.0, 2.5, 16), new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.4 }));
    cabRoof.position.set(28, 28.5, 0);
    group.add(cabGlass, cabRoof);

    return group;
  }

  // --- 6. STUNT BIPLANE (FLYABLE AIRPLANE) ---
  buildStuntBiplaneMesh(actor) {
    const group = new THREE.Group();
    group.isVehicleGroup = true;

    const yellowMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.35, metalness: 0.3 });
    const redMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.4, metalness: 0.2 });
    const darkMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.1, metalness: 0.9 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.1, metalness: 0.95 });

    // Aerodynamic Fuselage
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.6, 6.2), yellowMat);
    body.position.y = 1.6;
    body.castShadow = true;
    group.add(body);

    // Open Cockpit with Windscreen
    const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 1.8), darkMat);
    cockpit.position.set(0, 2.65, 0.4);
    group.add(cockpit);

    // Double Wings (Biplane Stunt Configuration)
    const wingLower = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.18, 2.0), redMat);
    wingLower.position.set(0, 1.2, 0.8);
    wingLower.castShadow = true;
    group.add(wingLower);

    const wingUpper = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.18, 2.0), redMat);
    wingUpper.position.set(0, 2.9, 0.8);
    wingUpper.castShadow = true;
    group.add(wingUpper);

    // Vertical Struts
    [-4.2, 4.2].forEach(sx => {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.7, 6), darkMat);
      strut.position.set(sx, 2.05, 0.8);
      group.add(strut);
    });

    // Vertical Tail & Horizontal Stabilizer
    const vTail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.8, 1.6), redMat);
    vTail.position.set(0, 2.45, -2.8);
    const hTail = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.15, 1.2), redMat);
    hTail.position.set(0, 1.75, -2.8);
    group.add(vTail, hTail);

    // Nose Cone Spinner & Spinning Propeller
    const propHub = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), chromeMat);
    propHub.position.set(0, 1.6, 3.2);
    group.add(propHub);

    const propMesh = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.25, 0.08), darkMat);
    propMesh.position.set(0, 1.6, 3.25);
    group.add(propMesh);

    actor._runtime.propeller = propMesh;
    this.animatedDudeProps.push({ type: 'propeller', mesh: propMesh, speed: 35.0, group, actor });

    // Landing Gear (3 Wheels)
    const tireMat = new THREE.MeshStandardMaterial({ color: '#161616', roughness: 0.8 });
    [[-1.1, 0.45, 1.2], [1.1, 0.45, 1.2], [0, 0.35, -2.4]].forEach(gp => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.28, 14), tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(gp[0], gp[1], gp[2]);
      wheel.castShadow = true;
      group.add(wheel);
    });

    return group;
  }

  // --- 7. SOCCER STADIUM & GIANT SOCCER BALL ---
  buildSoccerStadiumMesh(actor) {
    const group = new THREE.Group();

    // Turf Pitch with alternating grass stripes
    const pitch = new THREE.Mesh(
      new THREE.BoxGeometry(45, 0.2, 65),
      new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.85 })
    );
    pitch.position.y = 0.1;
    pitch.receiveShadow = true;
    group.add(pitch);

    // White Markings
    const lineMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 });
    const centerCircle = new THREE.Mesh(new THREE.RingGeometry(5.0, 5.3, 24), lineMat);
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.position.set(0, 0.22, 0);
    group.add(centerCircle);

    // Two White Goalposts
    [-30, 30].forEach(gz => {
      const goalGroup = new THREE.Group();
      goalGroup.position.set(0, 0, gz);
      const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), lineMat);
      postL.position.set(-4.0, 1.6, 0);
      const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), lineMat);
      postR.position.set(4.0, 1.6, 0);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(8.16, 0.16, 0.16), lineMat);
      bar.position.set(0, 3.2, 0);
      goalGroup.add(postL, postR, bar);
      group.add(goalGroup);
    });

    // 4 Corner Stadium Floodlight Towers
    [[-24, -34], [24, -34], [-24, 34], [24, 34]].forEach(([fx, fz]) => {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.45, 18, 8), new THREE.MeshStandardMaterial({ color: '#64748b', metalness: 0.8 }));
      mast.position.set(fx, 9, fz);
      const lampHead = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.8, 0.6), new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#fef08a', emissiveIntensity: 2.0 }));
      lampHead.position.set(fx, 18, fz);
      group.add(mast, lampHead);
    });

    return group;
  }

  buildSoccerBallMesh(actor) {
    const group = new THREE.Group();
    const radius = actor.dimensions?.radius || 1.4;

    const ballCanvas = document.createElement('canvas');
    ballCanvas.width = 256;
    ballCanvas.height = 128;
    const bctx = ballCanvas.getContext('2d');
    bctx.fillStyle = '#ffffff';
    bctx.fillRect(0, 0, 256, 128);
    bctx.fillStyle = '#18181b';
    for (let bx = 16; bx < 256; bx += 48) {
      for (let by = 16; by < 128; by += 48) {
        bctx.beginPath();
        bctx.arc(bx, by, 12, 0, Math.PI * 2);
        bctx.fill();
      }
    }
    const ballTex = new THREE.CanvasTexture(ballCanvas);

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(radius, 20, 20),
      new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.35, metalness: 0.1 })
    );
    ball.castShadow = true;
    group.add(ball);
    return group;
  }

  // --- 8. MEGA STUNT RAMP (SKATE PARK) ---
  buildSkateRampMesh(actor) {
    const group = new THREE.Group();
    const w = actor.dimensions?.width || 14;
    const h = actor.dimensions?.height || 7.5;
    const d = actor.dimensions?.depth || 22;

    const rampMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.4, metalness: 0.3 });

    // Curved Launch Profile
    const rampGeom = new THREE.BoxGeometry(w, 0.4, d);
    rampGeom.rotateX(0.32);
    const rampMesh = new THREE.Mesh(rampGeom, rampMat);
    rampMesh.position.set(0, h * 0.45, 0);
    rampMesh.castShadow = true;
    rampMesh.receiveShadow = true;
    group.add(rampMesh);

    // Guardrails
    const railMat = new THREE.MeshStandardMaterial({ color: '#facc15', metalness: 0.8 });
    [-w / 2, w / 2].forEach(rx => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, d), railMat);
      rail.position.set(rx, h * 0.45 + 0.6, 0);
      rail.rotateX(0.32);
      group.add(rail);
    });

    return group;
  }

  // --- 9. HIGH-BOUNCE TRAMPOLINE ---
  buildTrampolineMesh(actor) {
    const group = new THREE.Group();
    const rad = actor.dimensions?.radius || 2.2;

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(rad, 0.22, 10, 24),
      new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.4 })
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.8;
    group.add(rim);

    const mat = new THREE.Mesh(
      new THREE.CylinderGeometry(rad * 0.95, rad * 0.95, 0.05, 24),
      new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.85 })
    );
    mat.position.y = 0.8;
    mat.receiveShadow = true;
    group.add(mat);

    const legMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.8 });
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), legMat);
      leg.position.set(Math.cos(ang) * (rad - 0.2), 0.4, Math.sin(ang) * (rad - 0.2));
      group.add(leg);
    }

    return group;
  }

  // --- 10. OCTAN GAS STATION ---
  buildGasStationMesh(actor) {
    const group = new THREE.Group();
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(18, 0.6, 14),
      new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.3 })
    );
    canopy.position.y = 5.8;
    canopy.castShadow = true;
    group.add(canopy);

    const pMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.4 });
    [[-6, -4], [6, -4], [-6, 4], [6, 4]].forEach(([px, pz]) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5.8, 12), pMat);
      p.position.set(px, 2.9, pz);
      group.add(p);
    });

    [-3.5, 3.5].forEach(gx => {
      const pump = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.2, 0.9), new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.3 }));
      pump.position.set(gx, 1.1, 0);
      group.add(pump);
    });

    return group;
  }

  // --- 11. AMMU-NATION GUN SHOP ---
  buildGunShopMesh(actor) {
    const group = new THREE.Group();
    const shop = new THREE.Mesh(
      new THREE.BoxGeometry(16, 7, 14),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5, metalness: 0.6 })
    );
    shop.position.y = 3.5;
    shop.castShadow = true;
    group.add(shop);

    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(12, 1.8, 0.3),
      new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 2.2 })
    );
    sign.position.set(0, 5.8, 7.15);
    group.add(sign);

    return group;
  }

  // Builds an Articulated Sci-Fi Robot Mannequin (Unreal Engine 4 Hero Rig)
  buildCharacterMesh(actor) {
    const group = new THREE.Group();
    group.isCharacterGroup = true;

    // Body Armor Material (Dark Metallic Titanium with specular sheen)
    const armorMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      metalness: 0.8,
      roughness: 0.32
    });

    // Visor / Core Neon Emissive Material (Unreal Glowing Cyan)
    const neonMat = new THREE.MeshStandardMaterial({
      color: '#00f0ff',
      emissive: '#00f0ff',
      emissiveIntensity: 0.85,
      roughness: 0.12,
      metalness: 0.2
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

  // GTA 6 High-Fidelity AAA Supercar Mesh Builder (Pegassi / Grotti Supercar Rig)
  buildVehicleMesh(actor) {
    const group = new THREE.Group();
    group.isVehicleGroup = true;
    const bodyColor = actor.material?.color || '#00d2ff';
    const metalness = actor.material?.metalness ?? 0.98;
    const roughness = actor.material?.roughness ?? 0.08;

    // 1. High-Gloss Metallic Clearcoat Automotive Paint
    const paintMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      metalness: metalness,
      roughness: roughness
    });

    // Dark Carbon Fiber Aero Trim
    const carbonMat = new THREE.MeshStandardMaterial({
      color: '#0a0d14',
      metalness: 0.85,
      roughness: 0.25
    });

    // Dark Smoked Aerodynamic Glass
    const glassMat = new THREE.MeshStandardMaterial({
      color: '#080d1a',
      metalness: 0.95,
      roughness: 0.02,
      transparent: true,
      opacity: 0.65
    });

    // Chrome / Polished Aluminum
    const chromeMat = new THREE.MeshStandardMaterial({
      color: '#f1f5f9',
      metalness: 0.98,
      roughness: 0.05
    });

    // Interior Crimson Leather
    const leatherMat = new THREE.MeshStandardMaterial({
      color: '#991b1b',
      roughness: 0.55,
      metalness: 0.1
    });

    // --- A. AERODYNAMIC MAIN MONOCOQUE FUSELAGE ---
    // Lower belly chassis
    const bellyGeom = new THREE.BoxGeometry(2.1, 0.28, 4.5);
    const belly = new THREE.Mesh(bellyGeom, carbonMat);
    belly.position.y = 0.32;
    belly.castShadow = true;
    group.add(belly);

    // Front Sloped Nose Wedge
    const noseGeom = new THREE.CylinderGeometry(0.9, 1.05, 1.3, 16);
    noseGeom.rotateX(Math.PI / 2);
    const nose = new THREE.Mesh(noseGeom, paintMat);
    nose.position.set(0, 0.46, 1.6);
    nose.scale.set(1.0, 0.32, 1.0);
    nose.castShadow = true;
    group.add(nose);

    // Front Low-Slung Carbon Splitter with Endplate Winglets
    const splitterGeom = new THREE.BoxGeometry(2.2, 0.06, 0.8);
    const splitter = new THREE.Mesh(splitterGeom, carbonMat);
    splitter.position.set(0, 0.16, 2.2);
    group.add(splitter);

    const wingletL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.4), carbonMat);
    wingletL.position.set(-1.1, 0.25, 2.2);
    const wingletR = wingletL.clone();
    wingletR.position.x = 1.1;
    group.add(wingletL, wingletR);

    // Front Radiator Air Inlets (Dark Hex Grille)
    const inletMat = new THREE.MeshBasicMaterial({ color: '#000000' });
    const inletL = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.2, 0.2), inletMat);
    inletL.position.set(-0.55, 0.32, 2.15);
    const inletR = inletL.clone();
    inletR.position.x = 0.55;
    group.add(inletL, inletR);

    // Sculpted Hood Extractor Vents
    const ventL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.6), carbonMat);
    ventL.position.set(-0.4, 0.56, 1.25);
    ventL.rotation.x = -0.15;
    const ventR = ventL.clone();
    ventR.position.x = 0.4;
    group.add(ventL, ventR);

    // Front Muscular Wheel Arch Fenders
    const fenderGeom = new THREE.BoxGeometry(0.38, 0.38, 1.4);
    const fenderL = new THREE.Mesh(fenderGeom, paintMat);
    fenderL.position.set(-0.95, 0.52, 1.35);
    fenderL.castShadow = true;
    const fenderR = fenderL.clone();
    fenderR.position.x = 0.95;
    group.add(fenderL, fenderR);

    // Rear Muscular Haunches (Wide Supercar Hips)
    const haunchGeom = new THREE.BoxGeometry(0.42, 0.48, 1.6);
    const haunchL = new THREE.Mesh(haunchGeom, paintMat);
    haunchL.position.set(-0.98, 0.58, -1.35);
    haunchL.castShadow = true;
    const haunchR = haunchL.clone();
    haunchR.position.x = 0.98;
    group.add(haunchL, haunchR);

    // Sculpted Side Doors with Deep Radiator Air Intakes
    const doorMidGeom = new THREE.BoxGeometry(1.68, 0.42, 1.6);
    const doorMid = new THREE.Mesh(doorMidGeom, paintMat);
    doorMid.position.set(0, 0.48, 0.0);
    doorMid.castShadow = true;
    group.add(doorMid);

    const sideScoopL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.6), carbonMat);
    sideScoopL.position.set(-0.94, 0.48, -0.4);
    const sideScoopR = sideScoopL.clone();
    sideScoopR.position.x = 0.94;
    group.add(sideScoopL, sideScoopR);

    // Carbon Fiber Ground Effect Side Skirts
    const skirtGeom = new THREE.BoxGeometry(2.18, 0.05, 1.8);
    const skirt = new THREE.Mesh(skirtGeom, carbonMat);
    skirt.position.set(0, 0.18, 0.0);
    group.add(skirt);

    // Aerodynamic Wing Mirrors on Slender Pylons
    const mirrorGeom = new THREE.BoxGeometry(0.25, 0.12, 0.14);
    const mirrorPylonGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
    mirrorPylonGeom.rotateZ(0.4);

    const mirrorL = new THREE.Group();
    mirrorL.position.set(-0.95, 0.88, 0.6);
    mirrorL.add(new THREE.Mesh(mirrorGeom, carbonMat));
    mirrorL.add(new THREE.Mesh(mirrorPylonGeom, carbonMat));
    const mirrorR = mirrorL.clone();
    mirrorR.position.x = 0.95;
    mirrorR.rotation.y = Math.PI;
    group.add(mirrorL, mirrorR);

    // --- B. CURVED COCKPIT GREENHOUSE & 3D INTERIOR ---
    // Sloping Panoramic Glass Canopy
    const canopyGeom = new THREE.CylinderGeometry(0.68, 0.88, 1.8, 16);
    canopyGeom.rotateX(Math.PI / 2);
    const canopyMesh = new THREE.Mesh(canopyGeom, glassMat);
    canopyMesh.position.set(0, 0.88, 0.0);
    canopyMesh.scale.set(1.0, 0.48, 1.0);
    canopyMesh.castShadow = true;
    group.add(canopyMesh);

    // Slender Painted A/B/C Roof Arch
    const roofArchGeom = new THREE.BoxGeometry(1.36, 0.06, 1.2);
    const roofArch = new THREE.Mesh(roofArchGeom, paintMat);
    roofArch.position.set(0, 1.12, -0.1);
    group.add(roofArch);

    // 3D Interior: 2 Racing Bucket Seats
    const seatGeom = new THREE.BoxGeometry(0.42, 0.55, 0.45);
    const headrestGeom = new THREE.BoxGeometry(0.24, 0.22, 0.16);
    const seatL = new THREE.Group();
    seatL.position.set(-0.35, 0.6, -0.05);
    seatL.add(new THREE.Mesh(seatGeom, leatherMat));
    const headL = new THREE.Mesh(headrestGeom, leatherMat);
    headL.position.set(0, 0.38, -0.1);
    seatL.add(headL);

    const seatR = seatL.clone();
    seatR.position.x = 0.35;
    group.add(seatL, seatR);

    // 3D Interior: Sports Steering Wheel & Dashboard Dial
    const wheelTorus = new THREE.TorusGeometry(0.14, 0.024, 8, 20);
    const steerWheel = new THREE.Mesh(wheelTorus, carbonMat);
    steerWheel.position.set(-0.35, 0.82, 0.35);
    steerWheel.rotation.x = -0.35;
    group.add(steerWheel);

    const dashDial = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.04), new THREE.MeshBasicMaterial({ color: '#00f0ff' }));
    dashDial.position.set(-0.35, 0.82, 0.48);
    group.add(dashDial);

    // --- C. MID-ENGINE BAY & REAR FASCIA ---
    // Transparent Smoked Glass Engine Cover
    const engineCover = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 1.1), glassMat);
    engineCover.position.set(0, 0.86, -1.1);
    group.add(engineCover);

    // 3D V8 Twin-Turbo Engine Block visible underneath glass!
    const engineBlockGeom = new THREE.BoxGeometry(0.8, 0.32, 0.8);
    const engineBlock = new THREE.Mesh(engineBlockGeom, carbonMat);
    engineBlock.position.set(0, 0.62, -1.1);
    group.add(engineBlock);

    // Red crinkle cylinder head covers
    const headCoverGeom = new THREE.BoxGeometry(0.22, 0.12, 0.7);
    const redHeadL = new THREE.Mesh(headCoverGeom, new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.3 }));
    redHeadL.position.set(-0.24, 0.76, -1.1);
    const redHeadR = redHeadL.clone();
    redHeadR.position.x = 0.24;
    group.add(redHeadL, redHeadR);

    // Chrome Dual Intake Plenum
    const plenumGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.65, 12);
    plenumGeom.rotateZ(Math.PI / 2);
    const plenum = new THREE.Mesh(plenumGeom, chromeMat);
    plenum.position.set(0, 0.82, -1.1);
    group.add(plenum);

    // Massive Carbon Fiber Rear Diffuser with 6 Aero Fins
    const diffuserGeom = new THREE.BoxGeometry(2.0, 0.2, 0.6);
    const diffuser = new THREE.Mesh(diffuserGeom, carbonMat);
    diffuser.position.set(0, 0.24, -2.15);
    group.add(diffuser);

    for (let fin = -3; fin <= 3; fin++) {
      if (fin === 0) continue;
      const finMesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.5), carbonMat);
      finMesh.position.set(fin * 0.28, 0.22, -2.15);
      group.add(finMesh);
    }

    // Quad Stainless Steel Exhaust Pipes with Blue Heat-Treated Titanium Rims
    const exhMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', metalness: 0.95, roughness: 0.1 });
    const exhGeom = new THREE.CylinderGeometry(0.075, 0.075, 0.25, 16);
    exhGeom.rotateX(Math.PI / 2);

    const exh1 = new THREE.Mesh(exhGeom, exhMat);
    exh1.position.set(-0.25, 0.42, -2.25);
    const exh2 = new THREE.Mesh(exhGeom, exhMat);
    exh2.position.set(-0.10, 0.42, -2.25);
    const exh3 = new THREE.Mesh(exhGeom, exhMat);
    exh3.position.set(0.10, 0.42, -2.25);
    const exh4 = new THREE.Mesh(exhGeom, exhMat);
    exh4.position.set(0.25, 0.42, -2.25);
    group.add(exh1, exh2, exh3, exh4);

    // Continuous Full-Width 3D LED Taillight Blade (GTA 6 Signature Light)
    const tailMat = new THREE.MeshStandardMaterial({
      color: '#ef4444',
      emissive: '#ef4444',
      emissiveIntensity: 2.8,
      roughness: 0.1
    });
    const tailBlade = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.08, 0.06), tailMat);
    tailBlade.position.set(0, 0.68, -2.22);
    group.add(tailBlade);

    // High Downforce Swan-Neck GT Rear Wing Spoiler
    const wingGeom = new THREE.BoxGeometry(2.35, 0.06, 0.48);
    const wing = new THREE.Mesh(wingGeom, carbonMat);
    wing.position.set(0, 1.28, -2.15);
    wing.castShadow = true;
    group.add(wing);

    const wingEndL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.46), carbonMat);
    wingEndL.position.set(-1.17, 1.28, -2.15);
    const wingEndR = wingEndL.clone();
    wingEndR.position.x = 1.17;
    group.add(wingEndL, wingEndR);

    // Curved Swan-Neck Pylons
    const pylonGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.55, 8);
    pylonGeom.rotateX(0.25);
    const pylonL = new THREE.Mesh(pylonGeom, carbonMat);
    pylonL.position.set(-0.65, 1.05, -1.95);
    const pylonR = pylonL.clone();
    pylonR.position.x = 0.65;
    group.add(pylonL, pylonR);

    // --- D. QUAD LED PROJECTOR HEADLIGHTS + REAL THREE.JS SPOTLIGHTS ---
    const lensHaloMat = new THREE.MeshStandardMaterial({
      color: '#e0f2fe',
      emissive: '#00f0ff',
      emissiveIntensity: 2.2,
      roughness: 0.1
    });

    const createHeadlightUnit = (xPos) => {
      const hGroup = new THREE.Group();
      hGroup.position.set(xPos, 0.52, 2.12);
      // Housing
      hGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.15), carbonMat));
      // Dual Projector Bulbs
      const bulb1 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), lensHaloMat);
      bulb1.position.set(-0.1, 0, 0.06);
      const bulb2 = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), lensHaloMat);
      bulb2.position.set(0.1, 0, 0.06);
      hGroup.add(bulb1, bulb2);
      return hGroup;
    };

    group.add(createHeadlightUnit(-0.75));
    group.add(createHeadlightUnit(0.75));

    // Dynamic Road SpotLights (Cinematic road projection)
    const spotL = new THREE.SpotLight('#fff7ed', 0.95, 32, Math.PI / 6, 0.45);
    spotL.position.set(-0.75, 0.55, 2.2);
    spotL.target.position.set(-0.75, 0.0, 16.0);
    group.add(spotL);
    group.add(spotL.target);

    const spotR = new THREE.SpotLight('#fff7ed', 0.95, 32, Math.PI / 6, 0.45);
    spotR.position.set(0.75, 0.55, 2.2);
    spotR.target.position.set(0.75, 0.0, 16.0);
    group.add(spotR);
    group.add(spotR.target);

    // --- E. 5-SPOKE FORGED ALLOY WHEELS WITH CROSS-DRILLED BRAKES ---
    const tireMat = new THREE.MeshStandardMaterial({ color: '#161616', roughness: 0.8, metalness: 0.1 });
    const rimAlloyMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.08, metalness: 0.98 });
    const rotorMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.25, metalness: 0.92 });
    const caliperMat = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.2, metalness: 0.8 }); // Racing Yellow Brembo

    const createForgedWheel = (isFront) => {
      const wheelPivot = new THREE.Group();
      const wheelMesh = new THREE.Group();

      // Tire with outer beveled edge
      const tireGeom = new THREE.CylinderGeometry(0.44, 0.44, 0.34, 24);
      tireGeom.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeom, tireMat);
      tire.castShadow = true;
      wheelMesh.add(tire);

      // Deep Concave Rim Lip
      const lipGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.35, 20);
      lipGeom.rotateZ(Math.PI / 2);
      const lip = new THREE.Mesh(lipGeom, rimAlloyMat);
      wheelMesh.add(lip);

      // 5-Spoke Star Design
      for (let s = 0; s < 5; s++) {
        const spokeAng = (s / 5) * Math.PI * 2;
        const spokeGeom = new THREE.BoxGeometry(0.34, 0.06, 0.26);
        const spoke = new THREE.Mesh(spokeGeom, rimAlloyMat);
        spoke.position.set(0, Math.sin(spokeAng) * 0.16, Math.cos(spokeAng) * 0.16);
        spoke.rotation.x = spokeAng;
        wheelMesh.add(spoke);
      }

      // Center Wheel Nut
      const nutGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.36, 12);
      nutGeom.rotateZ(Math.PI / 2);
      wheelMesh.add(new THREE.Mesh(nutGeom, carbonMat));

      // Cross-Drilled Brake Rotor
      const rotorGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.06, 20);
      rotorGeom.rotateZ(Math.PI / 2);
      const rotor = new THREE.Mesh(rotorGeom, rotorMat);
      rotor.position.x = isFront ? 0.05 : -0.05;
      wheelMesh.add(rotor);

      // 6-Piston Brake Caliper
      const caliperGeom = new THREE.BoxGeometry(0.08, 0.2, 0.12);
      const caliper = new THREE.Mesh(caliperGeom, caliperMat);
      caliper.position.set(isFront ? 0.05 : -0.05, 0.22, 0.08);
      wheelMesh.add(caliper);

      wheelPivot.add(wheelMesh);
      return { pivot: wheelPivot, mesh: wheelMesh, isFront };
    };

    const wFL = createForgedWheel(true);
    wFL.pivot.position.set(-1.08, 0.44, 1.4);
    const wFR = createForgedWheel(true);
    wFR.pivot.position.set(1.08, 0.44, 1.4);

    const wBL = createForgedWheel(false);
    wBL.pivot.position.set(-1.08, 0.44, -1.4);
    const wBR = createForgedWheel(false);
    wBR.pivot.position.set(1.08, 0.44, -1.4);

    group.add(wFL.pivot, wFR.pivot, wBL.pivot, wBR.pivot);

    // --- F. INTERACTIVE HOVERING DRIVE ICON ---
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 128;
    badgeCanvas.height = 64;
    const bctx = badgeCanvas.getContext('2d');
    bctx.fillStyle = 'rgba(9, 13, 22, 0.9)';
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
    badgeSprite.position.set(0, 2.3, 0);
    badgeSprite.scale.set(1.6, 0.8, 1);
    group.add(badgeSprite);

    // Store runtime rig on actor
    actor._runtime.vehicleRig = {
      wFL, wFR, wBL, wBR,
      spotL, spotR,
      badgeSprite,
      tailMesh: tailBlade
    };

    this.animatedVehicles.push({ actor, group, rig: actor._runtime.vehicleRig });
    return group;
  }

  // GTA 6 Organic Curved Tropical Coconut Palm Tree
  buildPalmTreeMesh(actor) {
    const group = new THREE.Group();
    const height = actor.dimensions?.height || 7.8;

    const barkMat = new THREE.MeshStandardMaterial({
      color: '#523c2d',
      roughness: 0.85,
      metalness: 0.1
    });
    if (this.textures['palm_bark']) {
      barkMat.map = this.textures['palm_bark'];
    }

    // 8 Stacked Organically Curved Trunk Segments
    const segments = 8;
    const segHeight = height / segments;
    let currY = 0;
    let currX = 0;
    let currZ = 0;
    const curveAmount = 0.07;

    for (let i = 0; i < segments; i++) {
      const radBottom = 0.44 * (1 - (i / segments) * 0.48);
      const radTop = 0.44 * (1 - ((i + 1) / segments) * 0.48);
      const geom = new THREE.CylinderGeometry(radTop, radBottom, segHeight, 14);
      const segMesh = new THREE.Mesh(geom, barkMat);
      segMesh.position.set(currX, currY + segHeight / 2, currZ);
      segMesh.rotation.z = Math.sin(i * 0.35) * curveAmount;
      segMesh.castShadow = true;
      segMesh.receiveShadow = true;
      group.add(segMesh);

      currY += segHeight;
      currX += Math.sin(i * 0.35) * curveAmount * segHeight;
    }

    // Cluster of 5 Coconuts Nestled Under Crown
    const cocoMat = new THREE.MeshStandardMaterial({ color: '#2a170e', roughness: 0.75, metalness: 0.1 });
    for (let c = 0; c < 5; c++) {
      const cocoGeom = new THREE.SphereGeometry(0.22, 10, 10);
      const coco = new THREE.Mesh(cocoGeom, cocoMat);
      const ang = (c / 5) * Math.PI * 2;
      coco.position.set(currX + Math.cos(ang) * 0.32, currY - 0.22, currZ + Math.sin(ang) * 0.32);
      coco.castShadow = true;
      group.add(coco);
    }

    // 14 Organically Sculpted Arching Palm Fronds with Central Stems
    const frondMat = new THREE.MeshStandardMaterial({
      color: '#15803d',
      roughness: 0.45,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const stemMat = new THREE.MeshStandardMaterial({
      color: '#453225',
      roughness: 0.85,
      metalness: 0.05
    });

    const fronds = [];
    const frondCount = 14;
    for (let f = 0; f < frondCount; f++) {
      const angle = (f / frondCount) * Math.PI * 2;
      const frondGroup = new THREE.Group();
      frondGroup.position.set(currX, currY, currZ);
      frondGroup.rotation.y = angle;

      // Tiering: Upper arch up, middle arch out, lower droop down
      const tier = f % 3;
      const archAngle = tier === 0 ? -0.25 : (tier === 1 ? -0.55 : -0.85);
      const frondLen = tier === 0 ? 3.8 : (tier === 1 ? 4.5 : 4.0);
      const frondWidth = tier === 0 ? 0.75 : (tier === 1 ? 0.88 : 0.8);

      // Deform plane into tapered arching feather leaf
      const leafGeom = new THREE.PlaneGeometry(frondWidth, frondLen, 6, 14);
      const posAttr = leafGeom.attributes.position;
      for (let v = 0; v < posAttr.count; v++) {
        const vy = posAttr.getY(v) + frondLen / 2; // 0 to frondLen
        const t = Math.max(0, Math.min(1, vy / frondLen));
        // Taper: pointed tip and narrow base
        const taper = Math.sin(t * Math.PI) * (1.1 - t * 0.4);
        posAttr.setX(v, posAttr.getX(v) * taper);
        // Organic parabolic arch droop
        const droop = -Math.pow(t, 2.2) * 1.5;
        posAttr.setZ(v, posAttr.getZ(v) + droop);
        posAttr.setY(v, vy);
      }
      leafGeom.computeVertexNormals();
      leafGeom.rotateX(archAngle);

      const leaf = new THREE.Mesh(leafGeom, frondMat);
      leaf.castShadow = true;
      frondGroup.add(leaf);

      // Slender central woody spine
      const stemGeom = new THREE.CylinderGeometry(0.015, 0.035, frondLen, 4);
      stemGeom.translate(0, frondLen / 2, 0);
      stemGeom.rotateX(archAngle);
      const stem = new THREE.Mesh(stemGeom, stemMat);
      frondGroup.add(stem);

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

  // GTA 6 Dynamic Coastal Ocean with Multi-Wave Undulation & Specular Glint
  buildOceanWaterMesh(actor) {
    const width = actor.dimensions?.width || 160;
    const depth = actor.dimensions?.depth || 200;
    const geom = new THREE.PlaneGeometry(width, depth, 54, 54);
    geom.rotateX(-Math.PI / 2);

    const oceanMat = new THREE.MeshStandardMaterial({
      color: '#0284c7',
      emissive: '#0369a1',
      emissiveIntensity: 0.35,
      metalness: 0.92,
      roughness: 0.04, // High specular gloss for sun glitter path!
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geom, oceanMat);
    mesh.receiveShadow = true;
    mesh.userData.initialPositions = new Float32Array(geom.attributes.position.array);

    this.animatedOceans.push(mesh);
    return mesh;
  }

  // GTA 6 Art-Deco Miami Neon Hotel (Multi-Tiered Architectural Complex)
  buildBuildingMesh(actor) {
    const group = new THREE.Group();
    const dims = actor.dimensions || { width: 16, height: 20, depth: 12 };
    const baseColor = actor.material?.color || '#fb7185'; // Flamingo Coral Pink

    // PBR Materials
    const wallMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.55, metalness: 0.1 });
    if (this.textures['hotel_facade']) {
      wallMat.map = this.textures['hotel_facade'];
      wallMat.map.repeat.set(Math.round(dims.width / 8), Math.round(dims.height / 8));
      if (this.textures['hotel_facade_normal']) {
        wallMat.normalMap = this.textures['hotel_facade_normal'];
        wallMat.normalScale = new THREE.Vector2(1.2, 1.2);
        wallMat.normalMap.repeat.set(Math.round(dims.width / 8), Math.round(dims.height / 8));
      }
    }
    const trimMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35, metalness: 0.2 });
    const graniteMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.25, metalness: 0.75 });
    const glassLitMat = new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#fef08a', emissiveIntensity: 0.55, roughness: 0.2 });
    const glassDarkMat = new THREE.MeshStandardMaterial({ color: '#090d16', roughness: 0.05, metalness: 0.95 });
    const neonPink = new THREE.MeshStandardMaterial({ color: '#ff007f', emissive: '#ff007f', emissiveIntensity: 2.2, roughness: 0.1 });
    const neonCyan = new THREE.MeshStandardMaterial({ color: '#00f0ff', emissive: '#00f0ff', emissiveIntensity: 2.2, roughness: 0.1 });

    // --- TIER 1: GROUND LEVEL ARCADE & LOBBY ENTRANCE ---
    const groundGeom = new THREE.BoxGeometry(dims.width + 2, 4.8, dims.depth + 1.5);
    const groundMesh = new THREE.Mesh(groundGeom, graniteMat);
    groundMesh.position.y = 2.4;
    groundMesh.castShadow = true;
    groundMesh.receiveShadow = true;
    group.add(groundMesh);

    // Plate Glass Lobby Windows
    for (let w = -2; w <= 2; w++) {
      if (w === 0) continue; // Entrance door
      const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 0.15), glassLitMat);
      windowMesh.position.set(w * 3.2, 2.4, dims.depth / 2 + 0.8);
      group.add(windowMesh);
    }

    // Striped Entrance Canopy
    const canopyGeom = new THREE.BoxGeometry(5.5, 0.25, 3.8);
    const canopy = new THREE.Mesh(canopyGeom, trimMat);
    canopy.position.set(0, 3.8, dims.depth / 2 + 2.0);
    canopy.castShadow = true;
    group.add(canopy);

    // Warm Brass Sconces (Soft accent lighting)
    const sconceL = new THREE.PointLight('#fef08a', 0.45, 6);
    sconceL.position.set(-2.4, 3.2, dims.depth / 2 + 1.6);
    const sconceR = sconceL.clone();
    sconceR.position.x = 2.4;
    group.add(sconceL, sconceR);

    // --- TIER 2: MAIN GUEST TOWER WITH 3D FLUTED PILASTERS & WINDOWS ---
    const midHeight = dims.height * 0.65;
    const towerGeom = new THREE.BoxGeometry(dims.width, midHeight, dims.depth);
    const tower = new THREE.Mesh(towerGeom, wallMat);
    tower.position.y = 4.8 + midHeight / 2;
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    // 3D Fluted Vertical Pilasters separating window bays
    for (let p = -2; p <= 2; p++) {
      const pilasterGeom = new THREE.BoxGeometry(0.5, midHeight + 0.5, 0.4);
      const pilaster = new THREE.Mesh(pilasterGeom, trimMat);
      pilaster.position.set(p * 3.5, 4.8 + midHeight / 2, dims.depth / 2 + 0.15);
      pilaster.castShadow = true;
      group.add(pilaster);
    }

    // Recessed 3D Windows & Cantilevered Balconies
    const floors = 3;
    for (let f = 0; f < floors; f++) {
      const floorY = 6.2 + f * 3.8;

      // 3D Balcony Platform
      const balcGeom = new THREE.BoxGeometry(dims.width + 0.8, 0.35, 1.4);
      const balc = new THREE.Mesh(balcGeom, trimMat);
      balc.position.set(0, floorY, dims.depth / 2 + 0.65);
      balc.castShadow = true;
      group.add(balc);

      // Balcony Stainless Steel Railing
      const railGeom = new THREE.BoxGeometry(dims.width + 0.6, 0.8, 0.06);
      const rail = new THREE.Mesh(railGeom, trimMat);
      rail.position.set(0, floorY + 0.5, dims.depth / 2 + 1.3);
      group.add(rail);

      // Windows along the floor
      for (let w = -2; w <= 2; w++) {
        const isLit = (f + w) % 2 === 0;
        const winMesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.0, 0.15), isLit ? glassLitMat : glassDarkMat);
        winMesh.position.set(w * 3.5, floorY + 1.2, dims.depth / 2 + 0.05);
        group.add(winMesh);
      }
    }

    // Side Facade Windows & Horizontal Glowing Neon Ribbons (Facing down the Highway)
    [-dims.width / 2 - 0.05, dims.width / 2 + 0.05].forEach((sideX, sideIdx) => {
      for (let f = 0; f < floors; f++) {
        const floorY = 6.2 + f * 3.8;
        for (let sz = -1; sz <= 1; sz++) {
          const isLit = (f + sz + sideIdx) % 2 === 0;
          const sideWin = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 2.0, 1.8),
            isLit ? glassLitMat : glassDarkMat
          );
          sideWin.position.set(sideX, floorY + 1.2, sz * 3.2);
          group.add(sideWin);
        }

        // Horizontal Neon Trim ribbon wrapping the side
        const neonTrim = new THREE.Mesh(
          new THREE.BoxGeometry(0.2, 0.12, dims.depth + 0.2),
          f % 2 === 0 ? neonCyan : neonPink
        );
        neonTrim.position.set(sideX, floorY + 0.05, 0);
        group.add(neonTrim);
      }
    });

    // --- TIER 3: SETBACK PENTHOUSE & STEPPED SUNBURST CROWN ---
    const pentHeight = 4.5;
    const pentGeom = new THREE.BoxGeometry(dims.width * 0.75, pentHeight, dims.depth * 0.75);
    const pent = new THREE.Mesh(pentGeom, wallMat);
    pent.position.y = 4.8 + midHeight + pentHeight / 2;
    pent.castShadow = true;
    group.add(pent);

    // Decorative Art-Deco Crown Parapet
    const crownGeom = new THREE.BoxGeometry(dims.width * 0.55, 2.2, dims.depth * 0.55);
    const crown = new THREE.Mesh(crownGeom, trimMat);
    crown.position.y = 4.8 + midHeight + pentHeight + 1.1;
    group.add(crown);

    // Central Art-Deco Spire Fin
    const finGeom = new THREE.BoxGeometry(0.8, 3.8, 1.6);
    const fin = new THREE.Mesh(finGeom, trimMat);
    fin.position.y = 4.8 + midHeight + pentHeight + 3.2;
    group.add(fin);

    // --- TIER 4: 3D VIBRANT NEON SIGNAGE & ROOFTOP UTILITIES ---
    const signGroup = new THREE.Group();
    signGroup.position.set(0, 4.8 + midHeight + pentHeight + 1.6, dims.depth / 2 - 1.0);

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(9.0, 1.8, 0.4), graniteMat);
    signGroup.add(signBoard);

    const neonBarTop = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.22, 0.45), neonPink);
    neonBarTop.position.y = 0.55;
    const neonBarBot = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.22, 0.45), neonCyan);
    neonBarBot.position.y = -0.55;
    signGroup.add(neonBarTop, neonBarBot);

    // Neon Text Sprite ("★ HOTEL VICE ★")
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512;
    signCanvas.height = 128;
    const sctx = signCanvas.getContext('2d');
    sctx.fillStyle = '#0b0f19';
    sctx.fillRect(0, 0, 512, 128);
    sctx.strokeStyle = '#00f0ff';
    sctx.lineWidth = 4;
    sctx.strokeRect(8, 8, 496, 112);
    sctx.shadowColor = '#ff007f';
    sctx.shadowBlur = 16;
    sctx.fillStyle = '#ff1493';
    sctx.font = 'bold 44px sans-serif';
    sctx.textAlign = 'center';
    sctx.textBaseline = 'middle';
    sctx.fillText('★ HOTEL VICE ★', 256, 64);
    const signTex = new THREE.CanvasTexture(signCanvas);
    const signSprite = new THREE.Mesh(
      new THREE.PlaneGeometry(8.2, 1.3),
      new THREE.MeshStandardMaterial({
        map: signTex,
        emissiveMap: signTex,
        emissive: '#ff007f',
        emissiveIntensity: 1.2,
        roughness: 0.2
      })
    );
    signSprite.position.set(0, 0, 0.25);
    const signSpriteBack = signSprite.clone();
    signSpriteBack.position.set(0, 0, -0.25);
    signSpriteBack.rotation.y = Math.PI;
    signGroup.add(signSprite, signSpriteBack);

    group.add(signGroup);

    // Rooftop AC Chiller Unit & Radio Mast
    const acUnit = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.6, 2.2), new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.6 }));
    acUnit.position.set(-4.5, 4.8 + midHeight + 0.8, -2.5);
    group.add(acUnit);

    const mastGeom = new THREE.CylinderGeometry(0.04, 0.08, 6.0, 8);
    const mast = new THREE.Mesh(mastGeom, trimMat);
    mast.position.set(3.5, 4.8 + midHeight + 3.0, -2.5);
    group.add(mast);

    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 6.0 }));
    beacon.position.set(3.5, 4.8 + midHeight + 6.0, -2.5);
    group.add(beacon);

    return group;
  }

  // GTA 6 Asphalt Highway / Boulevard with Wet Specular Puddles & Curbs
  buildRoadMesh(actor) {
    const group = new THREE.Group();
    const width = actor.dimensions?.width || 16;
    const length = actor.dimensions?.depth || 180;

    // 1. Dark Asphalt Road Deck (NOT white!)
    const roadMat = new THREE.MeshStandardMaterial({
      color: '#151821', // Deep dark tarmac asphalt
      roughness: 0.65,
      metalness: 0.2
    });
    if (this.textures['asphalt_road']) {
      roadMat.map = this.textures['asphalt_road'];
      roadMat.map.repeat.set(1, Math.round(length / 14));
      if (this.textures['asphalt_road_normal']) {
        roadMat.normalMap = this.textures['asphalt_road_normal'];
        roadMat.normalScale = new THREE.Vector2(1.6, 1.6);
        roadMat.normalMap.repeat.set(1, Math.round(length / 14));
      }
    }

    const roadGeom = new THREE.BoxGeometry(width, 0.3, length);
    const roadMesh = new THREE.Mesh(roadGeom, roadMat);
    roadMesh.position.y = 0.15;
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    // 2. Next-Gen Wet Puddle Decals (High Specular Mirror Reflection)
    const puddleMat = new THREE.MeshStandardMaterial({
      color: '#070a10',
      metalness: 0.98,
      roughness: 0.02, // Mirror-like reflection!
      transparent: true,
      opacity: 0.88
    });

    const puddleConfigs = [
      { x: 3.2, z: 12, rx: 2.2, rz: 4.5 },
      { x: -3.5, z: -18, rx: 2.8, rz: 5.2 },
      { x: 1.5, z: 42, rx: 1.8, rz: 3.8 },
      { x: -2.0, z: 65, rx: 2.4, rz: 4.8 },
      { x: 3.8, z: -45, rx: 2.0, rz: 4.2 }
    ];

    for (const pc of puddleConfigs) {
      const pGeom = new THREE.CylinderGeometry(pc.rx, pc.rx, 0.02, 16);
      pGeom.scale(1.0, 1.0, pc.rz / pc.rx);
      const pMesh = new THREE.Mesh(pGeom, puddleMat);
      pMesh.position.set(pc.x, 0.31, pc.z);
      pMesh.receiveShadow = true;
      group.add(pMesh);
    }

    // 3. Concrete Raised Curbs (Left & Right)
    const curbMat = new THREE.MeshStandardMaterial({ color: '#78716c', roughness: 0.8, metalness: 0.1 });
    const curbGeom = new THREE.BoxGeometry(0.5, 0.45, length);
    const curbL = new THREE.Mesh(curbGeom, curbMat);
    curbL.position.set(-width / 2 - 0.25, 0.22, 0);
    curbL.receiveShadow = true;
    curbL.castShadow = true;

    const curbR = curbL.clone();
    curbR.position.x = width / 2 + 0.25;
    group.add(curbL, curbR);

    // 4. Pedestrian Sidewalk Promenade
    const walkMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.7, metalness: 0.15 });
    const walkGeom = new THREE.BoxGeometry(4.5, 0.4, length);
    const walkL = new THREE.Mesh(walkGeom, walkMat);
    walkL.position.set(-width / 2 - 2.5, 0.2, 0);
    walkL.receiveShadow = true;
    group.add(walkL);

    // East Promenade (Hotel side)
    const walkR = new THREE.Mesh(walkGeom, walkMat);
    walkR.position.set(width / 2 + 2.5, 0.2, 0);
    walkR.receiveShadow = true;
    group.add(walkR);

    return group;
  }

  // GTA 6 Coastal Boulevard Street Light Lamppost
  buildStreetLightMesh(actor) {
    const group = new THREE.Group();
    const height = 7.0;

    const metalMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.9, roughness: 0.2 });

    // Tapered Steel Pole
    const postGeom = new THREE.CylinderGeometry(0.14, 0.22, height, 16);
    const post = new THREE.Mesh(postGeom, metalMat);
    post.position.y = height / 2;
    post.castShadow = true;
    group.add(post);

    // Arched Overhanging Arm
    const armGeom = new THREE.BoxGeometry(2.4, 0.12, 0.12);
    const arm = new THREE.Mesh(armGeom, metalMat);
    arm.position.set(1.1, height - 0.15, 0);
    group.add(arm);

    // Cobra Head Luminaire
    const headGeom = new THREE.BoxGeometry(0.7, 0.16, 0.4);
    const head = new THREE.Mesh(headGeom, metalMat);
    head.position.set(2.1, height - 0.25, 0);
    group.add(head);

    const lensGeom = new THREE.BoxGeometry(0.6, 0.04, 0.32);
    const lensMat = new THREE.MeshStandardMaterial({
      color: '#fef08a',
      emissive: '#fef08a',
      emissiveIntensity: 4.5
    });
    const lens = new THREE.Mesh(lensGeom, lensMat);
    lens.position.set(2.1, height - 0.34, 0);
    group.add(lens);

    // Warm Golden Street Light SpotLight Casting Downward
    const streetLight = new THREE.SpotLight('#fef08a', 3.5, 24, Math.PI / 4, 0.45);
    streetLight.position.set(2.1, height - 0.36, 0);
    streetLight.target.position.set(2.1, 0, 0);
    group.add(streetLight);
    group.add(streetLight.target);

    return group;
  }

  // GTA 6 Traffic Safety Cone (Physics Prop)
  buildTrafficConeMesh(actor) {
    const group = new THREE.Group();

    // Base square with beveled lip
    const baseMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.35 });
    const baseGeom = new THREE.BoxGeometry(0.65, 0.06, 0.65);
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.position.y = 0.03;
    base.castShadow = true;
    group.add(base);

    // Orange Safety Cone
    const coneGeom = new THREE.ConeGeometry(0.24, 0.9, 18);
    const cone = new THREE.Mesh(coneGeom, baseMat);
    cone.position.y = 0.48;
    cone.castShadow = true;
    group.add(cone);

    // Reflective Micro-Prismatic White Sleeve Band
    const bandMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.15, metalness: 0.6 });
    const bandGeom = new THREE.CylinderGeometry(0.14, 0.18, 0.24, 18);
    const band = new THREE.Mesh(bandGeom, bandMat);
    band.position.y = 0.45;
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

      // Clean up GTA 6 & Dude dynamic simulation meshes
      this.animatedOceans = this.animatedOceans.filter(m => m !== mesh);
      this.animatedPalms = this.animatedPalms.filter(m => m !== mesh);
      this.animatedVehicles = this.animatedVehicles.filter(v => v.group !== mesh && v.actor !== actor);
      this.animatedDudeProps = this.animatedDudeProps.filter(p => p.group !== mesh && p.actor !== actor);
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

    // Animate Dude Theft Wars Props (Rotating Giant Burger, Airplane Propeller, Police Sirens)
    if (this.animatedDudeProps && this.animatedDudeProps.length > 0) {
      for (const prop of this.animatedDudeProps) {
        if (prop.type === 'burger' && prop.mesh) {
          prop.mesh.rotation.y += dt * 0.85;
        } else if (prop.type === 'propeller' && prop.mesh) {
          prop.mesh.rotation.z += dt * (prop.speed || 32.0);
        } else if (prop.type === 'police_siren' && prop.mesh) {
          prop.mesh.rotation.y += dt * 8.5;
        } else if (prop.type === 'water_ripple' && prop.mesh) {
          prop.mesh.rotation.z = Math.sin(performance.now() * 0.002) * 0.05;
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
