/**
 * NovaEngine 3D - Unreal Engine 4 Style 3D Renderer & Viewport
 * Implements ACESFilmic PBR Pipeline, Soft Cascaded Shadows, Transform Gizmos & Orbit/Freefly Camera
 */
class Renderer3D {
  constructor(canvasElement, engine) {
    this.canvas = canvasElement;
    this.engine = engine;

    // Viewport Mode
    this.viewMode = 'lit'; // 'lit', 'unlit', 'wireframe'
    this.showGrid = true;
    this.showShadows = true;

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.orbitControls = null;
    this.transformControls = null;

    // Lighting
    this.dirLight = null;
    this.hemiLight = null;

    // Grid & Helpers
    this.gridHelper = null;
    this.meshMap = new Map();

    // Freefly Camera State (like Unreal Engine 4 viewport)
    this.isFreeflying = false;
    this.cameraSpeed = 12.0; // units/sec
    this.freeflyKeys = {};

    this.initScene();
  }

  initScene() {
    // 1. Scene & Fog (UE4 atmospheric fog)
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#141824');
    this.scene.fog = new THREE.FogExp2('#141824', 0.012);

    // 2. Camera
    const aspect = this.canvas.clientWidth / this.canvas.clientHeight || 16 / 9;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    this.camera.position.set(0, 10, 20);

    // 3. High-End WebGL Renderer (Unreal Engine 4 Look)
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // UE4 Post-processing Tone Mapping & Shadow setup
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lighting Setup
    this.setupLighting();

    // 5. Grid Helper (UE4 Floor Grid)
    this.setupGrid();

    // 6. Camera Controls
    this.setupControls();

    // Handle window resize
    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    // Ambient / Hemisphere light for indirect bounce
    this.hemiLight = new THREE.HemisphereLight('#8ec5fc', '#1e2430', 0.6);
    this.scene.add(this.hemiLight);

    // Directional Sun Light (Unreal Sunlight)
    this.dirLight = new THREE.DirectionalLight('#fff8ed', 1.6);
    this.dirLight.position.set(20, 40, 25);
    this.dirLight.castShadow = true;

    // High Quality Soft Shadow Maps
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 150;
    const shadowD = 35;
    this.dirLight.shadow.camera.left = -shadowD;
    this.dirLight.shadow.camera.right = shadowD;
    this.dirLight.shadow.camera.top = shadowD;
    this.dirLight.shadow.camera.bottom = -shadowD;
    this.dirLight.shadow.bias = -0.0005;

    this.scene.add(this.dirLight);
  }

  setupGrid() {
    // Grid: 60x60 units, subdivisions
    this.gridHelper = new THREE.GridHelper(60, 60, '#00f0ff', '#2a3547');
    this.gridHelper.position.y = -0.01;
    this.scene.add(this.gridHelper);
  }

  setupControls() {
    // 1. OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.orbitControls = new THREE.OrbitControls(this.camera, this.canvas);
      this.orbitControls.enableDamping = true;
      this.orbitControls.dampingFactor = 0.08;
      this.orbitControls.target.set(0, 2, 0);
      this.orbitControls.maxPolarAngle = Math.PI / 2 + 0.05; // don't go too far under ground
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

          // Sync with physics body
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

    // Freefly Keyboard + Right Click listeners (UE4 style)
    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 2) { // Right Click
        this.isFreeflying = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this.isFreeflying = false;
      }
    });

    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      // Transform Mode hotkeys: W = Translate, E = Rotate, R = Scale
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

    // Object Selection via Raycaster in Edit Mode
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

  // Create or update Three.js Mesh for Actor3D
  syncActorMesh(actor) {
    let mesh = this.meshMap.get(actor);

    if (!mesh) {
      mesh = this.buildMeshFromActor(actor);
      this.scene.add(mesh);
      this.meshMap.set(actor, mesh);
      actor._runtime.threeMesh = mesh;
    }

    // Update Transform
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
    if (mesh.material && !actor.light) {
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

    // Attach TransformGizmo if this actor is selected
    if (this.engine.selectedActor === actor && !this.engine.isPlaying) {
      if (this.transformControls) {
        this.transformControls.attach(mesh);
      }
    }
  }

  buildMeshFromActor(actor) {
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
        // Capsule helper (cylinder with hemispheres)
        const capGroup = new THREE.Group();
        const cyl = new THREE.Mesh(
          new THREE.CylinderGeometry(dims.radius, dims.radius, dims.height, 24),
          this.createPBRMaterial(actor)
        );
        const topHemi = new THREE.Mesh(
          new THREE.SphereGeometry(dims.radius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2),
          this.createPBRMaterial(actor)
        );
        topHemi.position.y = dims.height / 2;
        const btmHemi = new THREE.Mesh(
          new THREE.SphereGeometry(dims.radius, 24, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
          this.createPBRMaterial(actor)
        );
        btmHemi.position.y = -dims.height / 2;
        capGroup.add(cyl, topHemi, btmHemi);
        return capGroup;

      case 'cone':
        geometry = new THREE.ConeGeometry(dims.radius, dims.height, 32);
        break;

      case 'torus':
        geometry = new THREE.TorusGeometry(dims.radius, dims.radiusTop || 0.4, 20, 40);
        break;

      case 'plane':
        geometry = new THREE.PlaneGeometry(dims.width, dims.depth);
        break;

      case 'light':
        return this.createLightActor(actor);

      default:
        geometry = new THREE.BoxGeometry(2, 2, 2);
        break;
    }

    if (actor.shape === 'plane') {
      geometry.rotateX(-Math.PI / 2); // Lay flat on XZ plane
    }

    const material = this.createPBRMaterial(actor);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = actor.material.castShadow;
    mesh.receiveShadow = actor.material.receiveShadow;
    return mesh;
  }

  createPBRMaterial(actor) {
    return new THREE.MeshStandardMaterial({
      color: actor.material.color,
      metalness: actor.material.metalness,
      roughness: actor.material.roughness,
      emissive: actor.material.emissive,
      emissiveIntensity: actor.material.emissiveIntensity,
      wireframe: this.viewMode === 'wireframe' || actor.material.wireframe,
      opacity: actor.material.opacity,
      transparent: actor.material.transparent || actor.material.opacity < 1.0
    });
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

    // Light bulb visualization icon in Editor
    const bulbGeom = new THREE.SphereGeometry(0.35, 16, 16);
    const bulbMat = new THREE.MeshBasicMaterial({ color: lCfg.color, wireframe: true });
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

  // Unreal Engine 4 Freefly Viewport Camera Update
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

  // Main Render Call
  render(dt) {
    if (!this.renderer || !this.scene || !this.camera) return;

    // Update freefly camera
    this.updateFreefly(dt);

    // Update OrbitControls in edit mode
    if (!this.engine.isPlaying && this.orbitControls && !this.isFreeflying) {
      this.orbitControls.update();
    }

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
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
    }
  }
}

window.Renderer3D = Renderer3D;
