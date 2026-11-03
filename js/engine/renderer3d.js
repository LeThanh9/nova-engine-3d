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

    // 5. Procedural Textures for Materials
    this.generateProceduralTextures();

    // 6. Sky & Atmospheric Stars
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
    // 1. Sci-Fi Hexagonal Cyber Floor Texture
    const hexCanvas = document.createElement('canvas');
    hexCanvas.width = 512;
    hexCanvas.height = 512;
    const hctx = hexCanvas.getContext('2d');

    hctx.fillStyle = '#141c2c';
    hctx.fillRect(0, 0, 512, 512);

    // Draw Hex Grid
    const r = 32;
    const dx = r * 3;
    const dy = r * Math.sqrt(3);
    hctx.strokeStyle = '#1e2d4a';
    hctx.lineWidth = 2;

    for (let y = -dy; y < 512 + dy; y += dy) {
      for (let x = -dx; x < 512 + dx; x += dx) {
        this.drawHex(hctx, x, y, r);
        this.drawHex(hctx, x + 1.5 * r, y + dy / 2, r);
      }
    }

    // Glowing circuit accents
    hctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    hctx.lineWidth = 1.5;
    hctx.strokeRect(64, 64, 384, 384);

    const hexTex = new THREE.CanvasTexture(hexCanvas);
    hexTex.wrapS = THREE.RepeatWrapping;
    hexTex.wrapT = THREE.RepeatWrapping;
    hexTex.repeat.set(6, 6);
    this.textures['scifi_hex'] = hexTex;

    // 2. Metal Panel Crate Texture
    const crateCanvas = document.createElement('canvas');
    crateCanvas.width = 256;
    crateCanvas.height = 256;
    const cctx = crateCanvas.getContext('2d');
    cctx.fillStyle = '#eab308';
    cctx.fillRect(0, 0, 256, 256);
    // Dark border
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
    // Background Stars Sphere
    const starCount = 300;
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
    // 1. Stylized Sci-Fi Character Mesh (Unreal Hero Robot)
    if (actor.tag === 'player' || actor.shape === 'character') {
      return this.buildCharacterMesh(actor);
    }

    // 2. Lights
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

  // Builds a futuristic Sci-Fi Robot Model (Unreal Style Mannequin)
  buildCharacterMesh(actor) {
    const group = new THREE.Group();
    group.isCharacterGroup = true;

    // Body Material (Dark metallic titanium)
    const armorMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      metalness: 0.85,
      roughness: 0.25
    });

    // Visor / Core Neon Emissive Material (Unreal Glowing Cyan)
    const neonMat = new THREE.MeshStandardMaterial({
      color: '#00f0ff',
      emissive: '#00f0ff',
      emissiveIntensity: 2.8,
      roughness: 0.1,
      metalness: 0.5
    });

    // 1. Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.2, 0.7), armorMat);
    torso.position.y = 1.0;
    torso.castShadow = true;
    group.add(torso);

    // Glowing Chest Reactor
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15, 16), neonMat);
    core.rotateX(Math.PI / 2);
    core.position.set(0, 1.1, 0.38);
    group.add(core);

    // 2. Helmet Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.65, 0.65), armorMat);
    head.position.y = 1.95;
    head.castShadow = true;
    group.add(head);

    // Glowing Curved Visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.2, 0.1), neonMat);
    visor.position.set(0, 1.95, 0.34);
    group.add(visor);

    // 3. Shoulders & Arms
    const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), armorMat);
    shoulderL.position.set(-0.7, 1.4, 0);
    const shoulderR = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), armorMat);
    shoulderR.position.set(0.7, 1.4, 0);
    group.add(shoulderL, shoulderR);

    const armL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.8, 16), armorMat);
    armL.position.set(-0.7, 0.9, 0);
    const armR = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.8, 16), armorMat);
    armR.position.set(0.7, 0.9, 0);
    group.add(armL, armR);

    // 4. Jetpack with Thrusters
    const jetpack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.3), armorMat);
    jetpack.position.set(0, 1.1, -0.45);
    const thrusterL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.3, 16), neonMat);
    thrusterL.position.set(-0.2, 0.65, -0.45);
    const thrusterR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.3, 16), neonMat);
    thrusterR.position.set(0.2, 0.65, -0.45);
    group.add(jetpack, thrusterL, thrusterR);

    // 5. Legs
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.9, 16), armorMat);
    legL.position.set(-0.3, 0.45, 0);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.15, 0.9, 16), armorMat);
    legR.position.set(0.3, 0.45, 0);
    group.add(legL, legR);

    return group;
  }

  createPBRMaterial(actor) {
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

    // Assign procedural PBR texture if matching
    if (actor.shape === 'plane' && this.textures['scifi_hex']) {
      mat.map = this.textures['scifi_hex'];
      mat.roughnessMap = this.textures['scifi_hex'];
    } else if (actor.tag === 'crate' && this.textures['hazard_crate']) {
      mat.map = this.textures['hazard_crate'];
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
