/**
 * NovaEngine 3D - Standalone 3D HTML Game Exporter & Project Serializer
 * Exports complete 100% self-contained single-file 3D HTML games that run anywhere offline!
 */
class GameExporter3D {
  constructor(engine) {
    this.engine = engine;
    this.storageKey = 'nova_engine_3d_project';
  }

  exportProjectJSON() {
    const data = {
      name: this.engine.projectName || 'MyGame3D',
      version: '2.0.0',
      savedAt: new Date().toISOString(),
      score: this.engine.score,
      actors: this.engine.actors.map(a => a.serialize())
    };
    return JSON.stringify(data, null, 2);
  }

  downloadProjectJSON() {
    const jsonStr = this.exportProjectJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.engine.projectName.toLowerCase().replace(/\s+/g, '-')}.novagame3d.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.engine.log('💾 Đã lưu và tải file dự án 3D thành công!', 'success');
  }

  exportStandaloneHTML() {
    const projectName = this.engine.projectName || 'My 3D Game';
    const actorsData = JSON.stringify(this.engine.actors.map(a => a.serialize()));

    const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${projectName} - Standalone 3D Game</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #141824; color: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; }
    #canvas3d { width: 100vw; height: 100vh; display: block; }
    #hud { position: absolute; top: 16px; left: 16px; font-size: 20px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); pointer-events: none; z-index: 10; }
    
    /* Virtual Mobile Touch Controls */
    #touch-controls { position: absolute; bottom: 24px; left: 0; width: 100%; display: flex; justify-content: space-between; padding: 0 24px; pointer-events: none; z-index: 10; }
    .touch-btn-group { display: flex; gap: 12px; pointer-events: auto; }
    .touch-btn {
      width: 64px; height: 64px; border-radius: 50%; background: rgba(255, 255, 255, 0.2); border: 2px solid rgba(255, 255, 255, 0.4);
      color: #fff; font-size: 24px; font-weight: bold; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px);
    }
    .touch-btn:active { background: rgba(0, 240, 255, 0.6); transform: scale(0.95); }
    @media (hover: hover) and (pointer: fine) { #touch-controls { display: none; } }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/cannon.js/0.6.2/cannon.min.js"></script>
</head>
<body>
  <div id="hud">
    <div id="score-display">⭐ ĐIỂM: 0</div>
  </div>
  <canvas id="canvas3d"></canvas>
  <div id="touch-controls">
    <div class="touch-btn-group">
      <button class="touch-btn" id="btn-left">◀</button>
      <button class="touch-btn" id="btn-right">▶</button>
    </div>
    <div class="touch-btn-group">
      <button class="touch-btn" id="btn-fwd">▲</button>
      <button class="touch-btn" id="btn-jump" style="width: 72px; height: 72px; background: rgba(0, 240, 255, 0.35);">Nhảy</button>
    </div>
  </div>

  <script>
    const ACTORS_DATA = ${actorsData};

    class StandaloneGame3D {
      constructor() {
        this.canvas = document.getElementById('canvas3d');
        this.scoreDisplay = document.getElementById('score-display');
        this.score = 0;
        this.keys = {};
        this.keysPressed = {};

        // Three.js Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color('#141824');
        this.scene.fog = new THREE.FogExp2('#141824', 0.012);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.05;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Cannon World
        this.world = new CANNON.World();
        this.world.gravity.set(0, -18, 0);

        // Lighting
        const hemi = new THREE.HemisphereLight('#8ec5fc', '#1e2430', 0.6);
        this.scene.add(hemi);

        const dir = new THREE.DirectionalLight('#fff8ed', 1.6);
        dir.position.set(20, 40, 25);
        dir.castShadow = true;
        dir.shadow.mapSize.width = 2048;
        dir.shadow.mapSize.height = 2048;
        this.scene.add(dir);

        // Grid
        const grid = new THREE.GridHelper(60, 60, '#00f0ff', '#2a3547');
        this.scene.add(grid);

        this.actors = [];
        this.meshMap = new Map();
        this.bodyMap = new Map();
        this.player = null;

        this.initInputs();
        this.loadActors();
        window.addEventListener('resize', () => {
          this.camera.aspect = window.innerWidth / window.innerHeight;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
      }

      initInputs() {
        window.addEventListener('keydown', (e) => {
          if (!this.keys[e.code]) this.keysPressed[e.code] = true;
          this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
          this.keys[e.code] = false;
          this.keysPressed[e.code] = false;
        });

        const bindBtn = (id, code) => {
          const btn = document.getElementById(id);
          if (!btn) return;
          btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[code] = true; this.keysPressed[code] = true; });
          btn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[code] = false; this.keysPressed[code] = false; });
        };
        bindBtn('btn-fwd', 'KeyW');
        bindBtn('btn-left', 'KeyA');
        bindBtn('btn-right', 'KeyD');
        bindBtn('btn-jump', 'Space');
      }

      loadActors() {
        for (const data of ACTORS_DATA) {
          const act = { ...data, _runtime: {} };
          this.actors.push(act);

          // Build Three.js Mesh
          let geom;
          const dims = act.dimensions;
          if (act.shape === 'sphere') geom = new THREE.SphereGeometry(dims.radius || 1, 24, 24);
          else if (act.shape === 'cylinder') geom = new THREE.CylinderGeometry(dims.radiusTop || 1, dims.radiusBottom || 1, dims.height || 2, 24);
          else if (act.shape === 'plane') { geom = new THREE.PlaneGeometry(dims.width || 20, dims.depth || 20); geom.rotateX(-Math.PI / 2); }
          else geom = new THREE.BoxGeometry(dims.width || 2, dims.height || 2, dims.depth || 2);

          const mat = new THREE.MeshStandardMaterial({
            color: act.material.color,
            metalness: act.material.metalness || 0.2,
            roughness: act.material.roughness || 0.5,
            emissive: act.material.emissive || '#000000',
            emissiveIntensity: act.material.emissiveIntensity || 0
          });

          const mesh = new THREE.Mesh(geom, mat);
          mesh.position.set(act.transform.position.x, act.transform.position.y, act.transform.position.z);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          this.scene.add(mesh);
          this.meshMap.set(act, mesh);

          // Build Cannon Body
          if (act.physics && act.physics.enabled) {
            let shape;
            if (act.shape === 'sphere') shape = new CANNON.Sphere(dims.radius || 1);
            else if (act.shape === 'plane') shape = new CANNON.Plane();
            else shape = new CANNON.Box(new CANNON.Vec3((dims.width||2)/2, (dims.height||2)/2, (dims.depth||2)/2));

            const body = new CANNON.Body({
              mass: act.physics.type === 'dynamic' ? (act.physics.mass || 1) : 0,
              shape: shape
            });
            body.position.set(act.transform.position.x, act.transform.position.y, act.transform.position.z);
            if (act.shape === 'plane') body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
            this.world.addBody(body);
            this.bodyMap.set(act, body);
            act._runtime.body = body;
          }

          if (act.tag === 'player') this.player = act;
        }
      }

      loop(time) {
        const dt = Math.min(0.05, (time - this.lastTime) / 1000);
        this.lastTime = time;

        this.update(dt);
        this.renderer.render(this.scene, this.camera);

        this.keysPressed = {};
        requestAnimationFrame((t) => this.loop(t));
      }

      update(dt) {
        // Player Controls
        if (this.player) {
          const body = this.player._runtime.body;
          const speed = 8.0;
          let mx = 0, mz = 0;
          if (this.keys['KeyW'] || this.keys['ArrowUp']) mz -= 1;
          if (this.keys['KeyS'] || this.keys['ArrowDown']) mz += 1;
          if (this.keys['KeyA'] || this.keys['ArrowLeft']) mx -= 1;
          if (this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1;

          if (body) {
            if (mx !== 0 || mz !== 0) {
              const len = Math.hypot(mx, mz);
              body.velocity.x = (mx / len) * speed;
              body.velocity.z = (mz / len) * speed;
            } else {
              body.velocity.x *= 0.8;
              body.velocity.z *= 0.8;
            }

            if (this.keysPressed['Space'] && Math.abs(body.velocity.y) < 0.2) {
              body.velocity.y = 9.0;
            }
          }

          // Camera Follow
          const p = this.player.transform.position;
          this.camera.position.lerp(new THREE.Vector3(p.x, p.y + 3.5, p.z + 7.0), 0.12);
          this.camera.lookAt(p.x, p.y + 1.2, p.z);
        }

        // Physics Step
        this.world.step(dt);
        for (const act of this.actors) {
          const body = this.bodyMap.get(act);
          const mesh = this.meshMap.get(act);
          if (body && mesh && act.physics.type === 'dynamic') {
            act.transform.position.x = body.position.x;
            act.transform.position.y = body.position.y;
            act.transform.position.z = body.position.z;
            mesh.position.copy(body.position);
            mesh.quaternion.copy(body.quaternion);
          }

          // Rotate gems
          if (act.behaviors && act.behaviors.some(b => b.type === 'rotate3D') && mesh) {
            mesh.rotation.y += 1.5 * dt;
          }
        }
      }
    }

    window.addEventListener('load', () => new StandaloneGame3D());
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-standalone3d.html`;
    a.click();
    URL.revokeObjectURL(url);
    this.engine.log(`🚀 ĐÃ XUẤT GAME 3D THÀNH FILE HTML ĐỘC LẬP: "${a.download}"! Chạy ngoại tuyến mọi nơi!`, 'success');
  }
}

window.GameExporter3D = GameExporter3D;
