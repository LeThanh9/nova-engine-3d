/**
 * NovaEngine 3D - Unreal Engine 4 Style Studio Interface Manager
 */
class Editor3DUI {
  constructor(engine) {
    this.engine = engine;
    this.activeBottomTab = 'log'; // 'content', 'texture', 'audio', 'code', 'log'

    this.bindDOM();
    this.bindPlaceActors();
  }

  bindDOM() {
    // Project Title
    const titleInput = document.getElementById('project-title');
    if (titleInput) {
      titleInput.value = this.engine.projectName;
      titleInput.addEventListener('change', (e) => {
        this.engine.projectName = e.target.value || 'MyGame3D';
      });
    }

    // Playback Controls
    document.getElementById('btn-play')?.addEventListener('click', () => this.engine.play());
    document.getElementById('btn-pause')?.addEventListener('click', () => this.engine.pause());
    document.getElementById('btn-step')?.addEventListener('click', () => this.engine.step());
    document.getElementById('btn-stop')?.addEventListener('click', () => this.engine.stop());

    // Template selector
    document.getElementById('template-select')?.addEventListener('change', (e) => {
      if (confirm(`Chuyển sang mẫu "${e.target.options[e.target.selectedIndex].text}"?`)) {
        this.engine.loadTemplate(e.target.value);
      }
    });

    // Viewport Mode buttons (Translate, Rotate, Scale)
    document.getElementById('tool-translate')?.addEventListener('click', () => this.engine.renderer3d.setTransformMode('translate'));
    document.getElementById('tool-rotate')?.addEventListener('click', () => this.engine.renderer3d.setTransformMode('rotate'));
    document.getElementById('tool-scale')?.addEventListener('click', () => this.engine.renderer3d.setTransformMode('scale'));

    // Viewport View Mode (Lit, Unlit, Wireframe)
    document.getElementById('view-mode-select')?.addEventListener('change', (e) => {
      this.engine.renderer3d.viewMode = e.target.value;
      for (const actor of this.engine.actors) {
        this.engine.renderer3d.syncActorMesh(actor);
      }
    });

    // Grid snap select
    document.getElementById('snap-trans-select')?.addEventListener('change', (e) => {
      const snap = parseFloat(e.target.value);
      this.engine.renderer3d.setSnap(snap > 0 ? snap : null, 15);
    });

    // Camera Speed
    document.getElementById('cam-speed-slider')?.addEventListener('input', (e) => {
      const spd = parseFloat(e.target.value);
      this.engine.renderer3d.cameraSpeed = spd * 3;
      document.getElementById('cam-speed-val').innerText = `${spd}x`;
    });

    // Toggle Grid
    document.getElementById('toggle-grid')?.addEventListener('click', (e) => {
      this.engine.renderer3d.gridHelper.visible = !this.engine.renderer3d.gridHelper.visible;
      e.target.classList.toggle('active', this.engine.renderer3d.gridHelper.visible);
    });

    // Export HTML & Save JSON
    document.getElementById('btn-export-html')?.addEventListener('click', () => {
      if (window.gameExporter3D) {
        window.gameExporter3D.exportStandaloneHTML();
      }
    });

    document.getElementById('btn-save-json')?.addEventListener('click', () => {
      if (window.gameExporter3D) {
        window.gameExporter3D.downloadProjectJSON();
      }
    });

    // Bottom Tabs switching
    document.querySelectorAll('.bottom-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchBottomTab(tab);
      });
    });

    // Clear Console
    document.getElementById('btn-clear-console')?.addEventListener('click', () => {
      const logBox = document.getElementById('console-logs');
      if (logBox) logBox.innerHTML = '';
    });
  }

  // Left Sidebar: Unreal Engine 4 Modes / Place Actors panel
  bindPlaceActors() {
    document.querySelectorAll('[data-spawn-actor]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-spawn-actor');
        this.spawnPresetActor(type);
      });
    });
  }

  spawnPresetActor(type) {
    const cam = this.engine.renderer3d.camera;
    const forward = new THREE.Vector3();
    cam.getWorldDirection(forward);
    const spawnPos = {
      x: Math.round(cam.position.x + forward.x * 8),
      y: Math.max(1, Math.round(cam.position.y + forward.y * 8)),
      z: Math.round(cam.position.z + forward.z * 8)
    };

    switch (type) {
      case 'cube':
        this.engine.addActor({
          name: 'Cube_Actor',
          shape: 'box',
          transform: { position: spawnPos },
          dimensions: { width: 2, height: 2, depth: 2 },
          material: { color: '#3b82f6', metalness: 0.2, roughness: 0.5 },
          physics: { enabled: true, type: 'dynamic', mass: 1 }
        });
        break;

      case 'sphere':
        this.engine.addActor({
          name: 'Sphere_Actor',
          shape: 'sphere',
          transform: { position: spawnPos },
          dimensions: { radius: 1.2 },
          material: { color: '#f59e0b', metalness: 0.8, roughness: 0.2 },
          physics: { enabled: true, type: 'dynamic', mass: 1, restitution: 0.7 }
        });
        break;

      case 'cylinder':
        this.engine.addActor({
          name: 'Cylinder_Actor',
          shape: 'cylinder',
          transform: { position: spawnPos },
          dimensions: { radiusTop: 1, radiusBottom: 1, height: 3 },
          material: { color: '#10b981', metalness: 0.4, roughness: 0.6 },
          physics: { enabled: true, type: 'static' }
        });
        break;

      case 'capsule':
        this.engine.addActor({
          name: 'Character_Capsule',
          shape: 'capsule',
          transform: { position: spawnPos },
          dimensions: { radius: 0.6, height: 1.4 },
          material: { color: '#00f0ff', metalness: 0.8, roughness: 0.2 },
          physics: { enabled: true, type: 'dynamic', mass: 2 }
        });
        break;

      case 'plane':
        this.engine.addActor({
          name: 'Floor_Plane',
          shape: 'plane',
          transform: { position: { x: spawnPos.x, y: 0, z: spawnPos.z } },
          dimensions: { width: 12, depth: 12 },
          material: { color: '#222d42', metalness: 0.7, roughness: 0.3 },
          physics: { enabled: true, type: 'static' }
        });
        break;

      case 'pointlight':
        this.engine.addActor({
          name: 'PointLight_Actor',
          shape: 'light',
          transform: { position: spawnPos },
          light: { type: 'point', color: '#ffea00', intensity: 2.5, distance: 15 }
        });
        break;

      case 'gem':
        this.engine.addActor({
          name: 'Energy_Gem',
          tag: 'collectible',
          shape: 'torus',
          dimensions: { radius: 0.8, radiusTop: 0.25 },
          transform: { position: spawnPos, rotation: { x: 45, y: 0, z: 0 } },
          material: { color: '#ffea00', metalness: 0.9, roughness: 0.1, emissive: '#ff9800', emissiveIntensity: 1.5 },
          physics: { enabled: false },
          behaviors: [
            { type: 'rotate3D', speedY: 90 },
            { type: 'collectible3D', scoreValue: 50 }
          ]
        });
        break;
    }
  }

  updateTransformModeUI(mode) {
    document.getElementById('tool-translate')?.classList.toggle('active', mode === 'translate');
    document.getElementById('tool-rotate')?.classList.toggle('active', mode === 'rotate');
    document.getElementById('tool-scale')?.classList.toggle('active', mode === 'scale');
  }

  switchBottomTab(tab) {
    this.activeBottomTab = tab;
    document.querySelectorAll('.bottom-tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });
    document.querySelectorAll('.bottom-tab-view').forEach(v => {
      v.classList.toggle('active', v.getAttribute('data-tab') === tab);
    });

    if (tab === 'code') {
      this.refreshCodeEditor();
    }
  }

  refreshAll() {
    this.refreshOutliner();
    this.refreshInspector();
    this.updateStats();
    this.updatePlayControls();
  }

  // World Outliner (UE4 style)
  refreshOutliner() {
    const list = document.getElementById('world-outliner-list');
    if (!list) return;

    list.innerHTML = '';
    this.engine.actors.forEach(actor => {
      const row = document.createElement('div');
      row.className = `outliner-row ${this.engine.selectedActor === actor ? 'selected' : ''}`;

      let icon = '📦';
      if (actor.tag === 'player') icon = '🧙';
      else if (actor.shape === 'light') icon = '💡';
      else if (actor.tag === 'collectible') icon = '💎';
      else if (actor.shape === 'plane') icon = '⬜';

      row.innerHTML = `
        <span class="actor-icon">${icon}</span>
        <span class="actor-name">${actor.name}</span>
        <div class="actor-actions">
          <button class="mini-btn ${actor.visible ? '' : 'faded'}" data-action="toggle-vis">👁</button>
          <button class="mini-btn text-danger" data-action="delete">✕</button>
        </div>
      `;

      row.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        this.engine.selectActor(actor);
      });

      row.querySelector('[data-action="toggle-vis"]').addEventListener('click', (e) => {
        e.stopPropagation();
        actor.visible = !actor.visible;
        this.engine.renderer3d.syncActorMesh(actor);
        this.refreshOutliner();
      });

      row.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.engine.deleteActor(actor);
      });

      list.appendChild(row);
    });
  }

  // Details Panel (UE4 style Inspector)
  refreshInspector() {
    const panel = document.getElementById('details-content');
    if (!panel) return;

    const actor = this.engine.selectedActor;
    if (!actor) {
      panel.innerHTML = `<div class="empty-state">Chọn một Actor 3D trong khung nhìn để xem Chi Tiết (Details)</div>`;
      return;
    }

    const pos = actor.transform.position;
    const rot = actor.transform.rotation;
    const scl = actor.transform.scale;
    const mat = actor.material;
    const phy = actor.physics;

    panel.innerHTML = `
      <!-- Actor Info -->
      <div class="prop-group">
        <div class="prop-title">Actor: ${actor.name}</div>
        <div class="prop-row">
          <label>Tên (Actor Label)</label>
          <input type="text" id="prop-actor-name" value="${actor.name}">
        </div>
        <div class="prop-row">
          <label>Thẻ (Tag)</label>
          <input type="text" id="prop-actor-tag" value="${actor.tag}">
        </div>
      </div>

      <!-- Transform (Location, Rotation, Scale) -->
      <div class="prop-group">
        <div class="prop-title">Vị Trí & Biến Đổi (Transform)</div>
        <div class="prop-row-triple">
          <span class="axis-label">Vị trí (X,Y,Z)</span>
          <div class="triple-inputs">
            <input type="number" id="prop-pos-x" step="0.5" value="${pos.x.toFixed(2)}">
            <input type="number" id="prop-pos-y" step="0.5" value="${pos.y.toFixed(2)}">
            <input type="number" id="prop-pos-z" step="0.5" value="${pos.z.toFixed(2)}">
          </div>
        </div>

        <div class="prop-row-triple">
          <span class="axis-label">Góc quay (độ)</span>
          <div class="triple-inputs">
            <input type="number" id="prop-rot-x" step="5" value="${rot.x.toFixed(1)}">
            <input type="number" id="prop-rot-y" step="5" value="${rot.y.toFixed(1)}">
            <input type="number" id="prop-rot-z" step="5" value="${rot.z.toFixed(1)}">
          </div>
        </div>

        <div class="prop-row-triple">
          <span class="axis-label">Tỷ lệ (Scale)</span>
          <div class="triple-inputs">
            <input type="number" id="prop-scl-x" step="0.1" value="${scl.x.toFixed(2)}">
            <input type="number" id="prop-scl-y" step="0.1" value="${scl.y.toFixed(2)}">
            <input type="number" id="prop-scl-z" step="0.1" value="${scl.z.toFixed(2)}">
          </div>
        </div>
      </div>

      <!-- Unreal Engine 4 PBR Material -->
      <div class="prop-group">
        <div class="prop-title">Chất Liệu Siêu Thực (PBR Material)</div>
        <div class="prop-row">
          <label>Màu Cơ Bản (Base Color)</label>
          <input type="color" id="prop-mat-color" value="${mat.color}">
        </div>
        <div class="prop-row">
          <label>Kim Loại (Metallic: 0-1)</label>
          <input type="range" id="prop-mat-metal" min="0" max="1" step="0.05" value="${mat.metalness}">
        </div>
        <div class="prop-row">
          <label>Độ Nhám (Roughness: 0-1)</label>
          <input type="range" id="prop-mat-rough" min="0" max="1" step="0.05" value="${mat.roughness}">
        </div>
        <div class="prop-row">
          <label>Màu Phát Sáng (Emissive Glow)</label>
          <input type="color" id="prop-mat-emissive" value="${mat.emissive}">
        </div>
        <div class="prop-row">
          <label>Cường Độ Sáng (Emissive Intensity)</label>
          <input type="number" id="prop-mat-emiss-int" min="0" max="10" step="0.2" value="${mat.emissiveIntensity}">
        </div>
        <div class="prop-row">
          <label>Khung Dây (Wireframe)</label>
          <input type="checkbox" id="prop-mat-wire" ${mat.wireframe ? 'checked' : ''}>
        </div>
      </div>

      <!-- 3D Physics -->
      <div class="prop-group">
        <div class="prop-title" style="display:flex; justify-content:space-between;">
          <span>Vật Lý 3D (Simulate Physics)</span>
          <input type="checkbox" id="prop-phy-enable" ${phy.enabled ? 'checked' : ''}>
        </div>
        ${phy.enabled ? `
          <div class="prop-row">
            <label>Kiểu Vật Thể</label>
            <select id="prop-phy-type">
              <option value="static" ${phy.type === 'static' ? 'selected' : ''}>Tĩnh (Static - Cố định)</option>
              <option value="dynamic" ${phy.type === 'dynamic' ? 'selected' : ''}>Động (Dynamic - Rơi, nảy)</option>
            </select>
          </div>
          <div class="prop-grid-2">
            <div class="prop-row"><label>Khối lượng (kg)</label><input type="number" id="prop-phy-mass" value="${phy.mass}"></div>
            <div class="prop-row"><label>Độ nảy</label><input type="number" id="prop-phy-rest" step="0.1" value="${phy.restitution}"></div>
          </div>
        ` : ''}
      </div>

      <!-- Behaviors -->
      <div class="prop-group">
        <div class="prop-title" style="display: flex; justify-content: space-between; align-items: center;">
          <span>Thành Phần & Hành Vi (Components)</span>
          <select id="add-beh-select" class="mini-select">
            <option value="">+ Thêm...</option>
            <option value="characterController3D">🧙 3D Character Controller</option>
            <option value="cameraFollow3D">🎥 3D Follow Camera</option>
            <option value="rotate3D">🔄 Tự Quay Quanh Trục</option>
            <option value="patrol3D">🚶 Đi Tuần Tra 3D</option>
            <option value="collectible3D">💎 Ngọc Ăn Điểm 3D</option>
          </select>
        </div>
        ${actor.behaviors.map(b => `
          <div class="behavior-card">
            <div class="behavior-header">
              <span>⚙️ ${b.type}</span>
              <button class="mini-btn text-danger" data-del-beh="${b.type}">✕</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.bindDetailsInputs(actor);
  }

  bindDetailsInputs(actor) {
    document.getElementById('prop-actor-name')?.addEventListener('input', (e) => {
      actor.name = e.target.value;
      this.refreshOutliner();
    });

    // Position
    const updatePos = () => {
      actor.transform.position.x = parseFloat(document.getElementById('prop-pos-x').value) || 0;
      actor.transform.position.y = parseFloat(document.getElementById('prop-pos-y').value) || 0;
      actor.transform.position.z = parseFloat(document.getElementById('prop-pos-z').value) || 0;
      this.engine.renderer3d.syncActorMesh(actor);
      this.engine.physics3d.syncActorBody(actor);
    };
    ['prop-pos-x', 'prop-pos-y', 'prop-pos-z'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', updatePos);
    });

    // Rotation
    const updateRot = () => {
      actor.transform.rotation.x = parseFloat(document.getElementById('prop-rot-x').value) || 0;
      actor.transform.rotation.y = parseFloat(document.getElementById('prop-rot-y').value) || 0;
      actor.transform.rotation.z = parseFloat(document.getElementById('prop-rot-z').value) || 0;
      this.engine.renderer3d.syncActorMesh(actor);
      this.engine.physics3d.syncActorBody(actor);
    };
    ['prop-rot-x', 'prop-rot-y', 'prop-rot-z'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', updateRot);
    });

    // Material
    document.getElementById('prop-mat-color')?.addEventListener('input', (e) => {
      actor.material.color = e.target.value;
      this.engine.renderer3d.syncActorMesh(actor);
    });

    document.getElementById('prop-mat-metal')?.addEventListener('input', (e) => {
      actor.material.metalness = parseFloat(e.target.value);
      this.engine.renderer3d.syncActorMesh(actor);
    });

    document.getElementById('prop-mat-rough')?.addEventListener('input', (e) => {
      actor.material.roughness = parseFloat(e.target.value);
      this.engine.renderer3d.syncActorMesh(actor);
    });

    document.getElementById('prop-mat-emissive')?.addEventListener('input', (e) => {
      actor.material.emissive = e.target.value;
      this.engine.renderer3d.syncActorMesh(actor);
    });

    document.getElementById('prop-mat-emiss-int')?.addEventListener('input', (e) => {
      actor.material.emissiveIntensity = parseFloat(e.target.value) || 0;
      this.engine.renderer3d.syncActorMesh(actor);
    });

    document.getElementById('prop-mat-wire')?.addEventListener('change', (e) => {
      actor.material.wireframe = e.target.checked;
      this.engine.renderer3d.syncActorMesh(actor);
    });

    // Physics
    document.getElementById('prop-phy-enable')?.addEventListener('change', (e) => {
      actor.physics.enabled = e.target.checked;
      this.engine.physics3d.syncActorBody(actor);
      this.refreshInspector();
    });

    document.getElementById('prop-phy-type')?.addEventListener('change', (e) => {
      actor.physics.type = e.target.value;
      this.engine.physics3d.syncActorBody(actor);
    });

    // Behaviors
    document.getElementById('add-beh-select')?.addEventListener('change', (e) => {
      const type = e.target.value;
      if (type) {
        actor.addBehavior({ type });
        this.refreshInspector();
      }
    });

    document.querySelectorAll('[data-del-beh]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-del-beh');
        actor.removeBehavior(type);
        this.refreshInspector();
      });
    });
  }

  refreshCodeEditor() {
    const textarea = document.getElementById('full-code-editor-3d');
    const title = document.getElementById('code-editor-target-3d');
    if (!textarea) return;

    if (this.engine.selectedActor) {
      if (title) title.innerText = `Đang viết mã cho Actor: ${this.engine.selectedActor.name}`;
      textarea.value = this.engine.selectedActor.script || '';
      textarea.oninput = () => {
        this.engine.selectedActor.script = textarea.value;
      };
    } else {
      if (title) title.innerText = 'Chưa chọn Actor nào';
      textarea.value = '// Vui lòng chọn một Actor 3D để viết mã script.';
    }
  }

  updatePlayControls() {
    const btnPlay = document.getElementById('btn-play');
    const btnPause = document.getElementById('btn-pause');
    const btnStop = document.getElementById('btn-stop');

    if (btnPlay) btnPlay.classList.toggle('active', this.engine.isPlaying && !this.engine.isPaused);
    if (btnPause) btnPause.classList.toggle('active', this.engine.isPaused);
    if (btnStop) btnStop.classList.toggle('disabled', !this.engine.isPlaying);
  }

  updateStats() {
    const fpsElem = document.getElementById('stat-fps');
    const actorElem = document.getElementById('stat-actors');
    const scoreElem = document.getElementById('stat-score');

    if (fpsElem) fpsElem.innerText = `${this.engine.fps} FPS`;
    if (actorElem) actorElem.innerText = `${this.engine.actors.length} Actors`;
    if (scoreElem) scoreElem.innerText = `Điểm: ${this.engine.score}`;
  }

  log(msg, type = 'info') {
    const box = document.getElementById('console-logs');
    if (!box) return;

    const row = document.createElement('div');
    row.className = `log-row log-${type}`;
    const time = new Date().toLocaleTimeString();
    row.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-msg">${msg}</span>`;

    box.appendChild(row);
    box.scrollTop = box.scrollHeight;
  }
}

window.Editor3DUI = Editor3DUI;

