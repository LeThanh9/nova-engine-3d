/**
 * NovaEngine - Editor UI & User Interaction Manager
 * Links all engine subsystems to the sleek Godot/Unity-style Studio interface
 */
class EditorUI {
  constructor(engine) {
    this.engine = engine;
    this.activeTab = 'scene'; // 'scene' | 'pixel' | 'audio' | 'code'
    this.activeSpriteId = 'spr_player';
    this.activeSoundId = 'snd_jump';

    this.bindDOM();
    this.bindShortcuts();
    this.bindViewportInteractions();
  }

  bindDOM() {
    // Project title
    const titleInput = document.getElementById('project-title');
    if (titleInput) {
      titleInput.value = this.engine.projectName;
      titleInput.addEventListener('change', (e) => {
        this.engine.projectName = e.target.value || 'MyGame';
      });
    }

    // Tabs switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.switchTab(tab);
      });
    });

    // Playback Controls
    document.getElementById('btn-play')?.addEventListener('click', () => this.engine.play());
    document.getElementById('btn-pause')?.addEventListener('click', () => this.engine.pause());
    document.getElementById('btn-step')?.addEventListener('click', () => this.engine.step());
    document.getElementById('btn-stop')?.addEventListener('click', () => this.engine.stop());

    // Project Actions
    document.getElementById('btn-new-project')?.addEventListener('click', () => {
      if (confirm('Tạo dự án mới? Các thay đổi chưa lưu sẽ bị mất.')) {
        this.engine.loadTemplate('blank');
      }
    });

    document.getElementById('template-select')?.addEventListener('change', (e) => {
      if (confirm(`Chuyển sang mẫu "${e.target.options[e.target.selectedIndex].text}"?`)) {
        this.engine.loadTemplate(e.target.value);
      }
    });

    document.getElementById('btn-save-json')?.addEventListener('click', () => this.engine.exporter.downloadProjectJSON());
    document.getElementById('btn-export-html')?.addEventListener('click', () => this.engine.exporter.exportStandaloneHTML());

    const fileInput = document.getElementById('file-import-json');
    document.getElementById('btn-open-json')?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          this.engine.exporter.importProjectJSON(evt.target.result);
        };
        reader.readAsText(file);
      }
    });

    // Grid & Viewport toggles
    document.getElementById('toggle-grid')?.addEventListener('click', (e) => {
      this.engine.renderer.showGrid = !this.engine.renderer.showGrid;
      e.target.classList.toggle('active', this.engine.renderer.showGrid);
    });

    document.getElementById('toggle-colliders')?.addEventListener('click', (e) => {
      this.engine.renderer.showColliders = !this.engine.renderer.showColliders;
      e.target.classList.toggle('active', this.engine.renderer.showColliders);
    });

    document.getElementById('grid-snap-select')?.addEventListener('change', (e) => {
      const val = parseInt(e.target.value);
      this.engine.renderer.gridSize = val > 0 ? val : 32;
      this.engine.renderer.snapToGrid = val > 0;
    });

    // Hierarchy Add Entity Button
    document.getElementById('btn-add-entity')?.addEventListener('click', () => {
      const menu = document.getElementById('add-entity-dropdown');
      if (menu) menu.classList.toggle('show');
    });

    document.querySelectorAll('.dropdown-add-item').forEach(item => {
      item.addEventListener('click', () => {
        const type = item.getAttribute('data-type');
        this.createPresetEntity(type);
        document.getElementById('add-entity-dropdown')?.classList.remove('show');
      });
    });

    // Console clear
    document.getElementById('btn-clear-console')?.addEventListener('click', () => {
      const logBox = document.getElementById('console-logs');
      if (logBox) logBox.innerHTML = '';
    });

    // Init Pixel Painter Studio DOM
    this.bindPixelPainterDOM();

    // Init Sound Synth Studio DOM
    this.bindSoundSynthDOM();
  }

  switchTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });
    document.querySelectorAll('.view-panel').forEach(p => {
      p.classList.toggle('active', p.getAttribute('data-tab') === tab);
    });

    if (tab === 'pixel') {
      this.engine.pixelPainter.render();
      this.refreshPixelAssetsList();
    } else if (tab === 'audio') {
      this.refreshSoundAssetsList();
    } else if (tab === 'code') {
      this.refreshCodeEditor();
    } else if (tab === 'scene') {
      this.engine.renderer.resizeCanvas();
    }
  }

  // Keyboard Shortcuts
  bindShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      // F5 = Play / Pause
      if (e.key === 'F5') {
        e.preventDefault();
        if (this.engine.isPlaying) this.engine.stop();
        else this.engine.play();
      }

      // F6 = Step frame
      if (e.key === 'F6') {
        e.preventDefault();
        this.engine.step();
      }

      // Delete = Delete Entity
      if (e.key === 'Delete' && this.engine.selectedEntity && !this.engine.isPlaying) {
        this.engine.deleteEntity(this.engine.selectedEntity);
      }

      // Ctrl + D = Duplicate Entity
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && this.engine.selectedEntity && !this.engine.isPlaying) {
        e.preventDefault();
        this.engine.duplicateEntity(this.engine.selectedEntity);
      }
    });
  }

  // Viewport interactions: selection, gizmo drag, panning, zoom
  bindViewportInteractions() {
    const canvas = this.engine.renderer.canvas;
    let isMouseDown = false;
    let isDraggingEntity = false;
    let dragOffset = { x: 0, y: 0 };

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = this.engine.renderer.screenToWorld(sx, sy);

      // Middle click or Space+click = Pan viewport
      if (e.button === 1 || e.spaceKey || this.engine.scriptRuntime.isKeyDown('Space')) {
        this.engine.renderer.isPanning = true;
        this.engine.renderer.panStartX = sx;
        this.engine.renderer.panStartY = sy;
        this.engine.renderer.camStartX = this.engine.renderer.camera.x;
        this.engine.renderer.camStartY = this.engine.renderer.camera.y;
        return;
      }

      if (this.engine.isPlaying) return;

      // Check if clicking on selected entity's gizmo handles
      if (this.engine.selectedEntity) {
        const ent = this.engine.selectedEntity;
        const halfW = (ent.width * Math.abs(ent.scaleX)) / 2;
        const halfH = (ent.height * Math.abs(ent.scaleY)) / 2;
        const rotKnobY = ent.y - halfH - 24 / this.engine.renderer.camera.zoom;

        // Check rotation handle click
        const dRot = Math.hypot(world.x - ent.x, world.y - rotKnobY);
        if (dRot < 14 / this.engine.renderer.camera.zoom) {
          this.engine.renderer.activeGizmo = 'rotate';
          this.engine.renderer.gizmoStart = {
            worldX: world.x,
            worldY: world.y,
            entRot: ent.rotation
          };
          return;
        }

        // Check corner scale handles
        const corners = [
          { name: 'nw', x: ent.x - halfW, y: ent.y - halfH },
          { name: 'ne', x: ent.x + halfW, y: ent.y - halfH },
          { name: 'se', x: ent.x + halfW, y: ent.y + halfH },
          { name: 'sw', x: ent.x - halfW, y: ent.y + halfH }
        ];

        for (const c of corners) {
          if (Math.hypot(world.x - c.x, world.y - c.y) < 12 / this.engine.renderer.camera.zoom) {
            this.engine.renderer.activeGizmo = c.name;
            this.engine.renderer.gizmoStart = {
              worldX: world.x,
              worldY: world.y,
              entW: ent.width,
              entH: ent.height
            };
            return;
          }
        }
      }

      // Check click on entities to select
      let clickedEntity = null;
      for (let i = this.engine.entities.length - 1; i >= 0; i--) {
        const ent = this.engine.entities[i];
        if (!ent.visible || ent.locked) continue;
        const b = ent.getBounds();
        if (world.x >= b.left && world.x <= b.right && world.y >= b.top && world.y <= b.bottom) {
          clickedEntity = ent;
          break;
        }
      }

      if (clickedEntity) {
        this.selectEntity(clickedEntity);
        isDraggingEntity = true;
        dragOffset.x = world.x - clickedEntity.x;
        dragOffset.y = world.y - clickedEntity.y;
      } else {
        // Clicked empty space
        this.selectEntity(null);
      }
    });

    window.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = this.engine.renderer.screenToWorld(sx, sy);

      // Handle Viewport Pan
      if (this.engine.renderer.isPanning) {
        const dx = (sx - this.engine.renderer.panStartX) / this.engine.renderer.camera.zoom;
        const dy = (sy - this.engine.renderer.panStartY) / this.engine.renderer.camera.zoom;
        this.engine.renderer.camera.x = this.engine.renderer.camStartX - dx;
        this.engine.renderer.camera.y = this.engine.renderer.camStartY - dy;
        return;
      }

      // Handle Gizmo Rotation
      if (this.engine.renderer.activeGizmo === 'rotate' && this.engine.selectedEntity) {
        const ent = this.engine.selectedEntity;
        const angleRad = Math.atan2(world.y - ent.y, world.x - ent.x);
        let deg = EngineMath.radToDeg(angleRad) + 90;
        if (deg < 0) deg += 360;
        ent.rotation = Math.round(deg);
        this.refreshInspector();
        return;
      }

      // Handle Gizmo Scale
      if (this.engine.renderer.activeGizmo && this.engine.selectedEntity) {
        const ent = this.engine.selectedEntity;
        const gz = this.engine.renderer.gizmoStart;
        const dx = (world.x - gz.worldX);
        const dy = (world.y - gz.worldY);
        let nw = gz.entW + (this.engine.renderer.activeGizmo.includes('e') ? dx * 2 : -dx * 2);
        let nh = gz.entH + (this.engine.renderer.activeGizmo.includes('s') ? dy * 2 : -dy * 2);
        ent.width = Math.max(8, Math.round(nw));
        ent.height = Math.max(8, Math.round(nh));
        this.refreshInspector();
        return;
      }

      // Handle Entity Drag
      if (isDraggingEntity && this.engine.selectedEntity && !this.engine.isPlaying) {
        let nx = world.x - dragOffset.x;
        let ny = world.y - dragOffset.y;

        // Snap to grid
        if (this.engine.renderer.snapToGrid) {
          const gs = this.engine.renderer.gridSize;
          nx = Math.round(nx / gs) * gs;
          ny = Math.round(ny / gs) * gs;
        }

        this.engine.selectedEntity.x = nx;
        this.engine.selectedEntity.y = ny;
        this.refreshInspector();
      }
    });

    window.addEventListener('mouseup', () => {
      this.engine.renderer.isPanning = false;
      this.engine.renderer.activeGizmo = null;
      isDraggingEntity = false;
    });

    // Zoom on Mouse Wheel
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      const newZoom = EngineMath.clamp(this.engine.renderer.camera.zoom * zoomFactor, 0.25, 4.0);
      this.engine.renderer.camera.zoom = newZoom;
      document.getElementById('zoom-display').innerText = `${Math.round(newZoom * 100)}%`;
    }, { passive: false });
  }

  // Entity Selection
  selectEntity(entity) {
    this.engine.selectedEntity = entity;
    this.refreshHierarchy();
    this.refreshInspector();
  }

  // Refresh All UI Panels
  refreshAll() {
    this.refreshHierarchy();
    this.refreshInspector();
    this.updateStats();
    this.updatePlayControls();
  }

  refreshHierarchy() {
    const list = document.getElementById('hierarchy-list');
    if (!list) return;

    list.innerHTML = '';
    this.engine.entities.forEach(ent => {
      const item = document.createElement('div');
      item.className = `hierarchy-item ${this.engine.selectedEntity === ent ? 'selected' : ''}`;

      let icon = '📦';
      if (ent.tag === 'player') icon = '🧙';
      else if (ent.tag === 'enemy') icon = '👾';
      else if (ent.tag === 'solid') icon = '🧱';
      else if (ent.tag === 'coin') icon = '🪙';
      else if (ent.tag === 'hazard') icon = '⚠️';
      else if (ent.shape === 'text') icon = '🔤';

      item.innerHTML = `
        <span class="ent-icon">${icon}</span>
        <span class="ent-name">${ent.name}</span>
        <div class="ent-actions">
          <button class="mini-btn ${ent.visible ? '' : 'faded'}" title="Ẩn/Hiện" data-action="toggle-vis">👁</button>
          <button class="mini-btn text-danger" title="Xóa" data-action="delete">✕</button>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        this.selectEntity(ent);
      });

      item.querySelector('[data-action="toggle-vis"]').addEventListener('click', (e) => {
        e.stopPropagation();
        ent.visible = !ent.visible;
        this.refreshHierarchy();
      });

      item.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.engine.deleteEntity(ent);
      });

      list.appendChild(item);
    });
  }

  refreshInspector() {
    const container = document.getElementById('inspector-content');
    if (!container) return;

    const ent = this.engine.selectedEntity;
    if (!ent) {
      container.innerHTML = `<div class="empty-state">Chọn một đối tượng trên Màn chơi hoặc Cây phân cấp để xem thuộc tính</div>`;
      return;
    }

    // Available sprites for dropdown
    const spriteOptions = Array.from(this.engine.pixelPainter.spriteAssets.values())
      .map(s => `<option value="${s.id}" ${ent.spriteId === s.id ? 'selected' : ''}>${s.name}</option>`)
      .join('');

    // Behaviors HTML
    const behaviorsHTML = ent.behaviors.map((b, idx) => `
      <div class="behavior-card">
        <div class="behavior-header">
          <span class="behavior-name">⚙️ ${b.type.toUpperCase()}</span>
          <button class="mini-btn text-danger" data-remove-behavior="${b.type}">✕</button>
        </div>
        ${this.renderBehaviorFields(b)}
      </div>
    `).join('');

    container.innerHTML = `
      <!-- Base Properties -->
      <div class="prop-group">
        <div class="prop-title">Thông Tin Cơ Bản</div>
        <div class="prop-row">
          <label>Tên</label>
          <input type="text" id="prop-name" value="${ent.name}">
        </div>
        <div class="prop-row">
          <label>Thẻ (Tag)</label>
          <input type="text" id="prop-tag" value="${ent.tag}">
        </div>
      </div>

      <!-- Transform -->
      <div class="prop-group">
        <div class="prop-title">Vị Trí & Biến Đổi (Transform)</div>
        <div class="prop-grid-2">
          <div class="prop-row"><label>X</label><input type="number" id="prop-x" value="${Math.round(ent.x)}"></div>
          <div class="prop-row"><label>Y</label><input type="number" id="prop-y" value="${Math.round(ent.y)}"></div>
        </div>
        <div class="prop-grid-2">
          <div class="prop-row"><label>Rộng (W)</label><input type="number" id="prop-w" value="${Math.round(ent.width)}"></div>
          <div class="prop-row"><label>Cao (H)</label><input type="number" id="prop-h" value="${Math.round(ent.height)}"></div>
        </div>
        <div class="prop-grid-2">
          <div class="prop-row"><label>Góc Quay</label><input type="number" id="prop-rot" value="${Math.round(ent.rotation)}"></div>
          <div class="prop-row"><label>Lớp (Z-Index)</label><input type="number" id="prop-z" value="${ent.zIndex}"></div>
        </div>
      </div>

      <!-- Appearance -->
      <div class="prop-group">
        <div class="prop-title">Hình Dáng & Hiển Thị</div>
        <div class="prop-row">
          <label>Kiểu Hình</label>
          <select id="prop-shape">
            <option value="sprite" ${ent.shape === 'sprite' ? 'selected' : ''}>Pixel Sprite (Hình vẽ)</option>
            <option value="rect" ${ent.shape === 'rect' ? 'selected' : ''}>Khối Vuông (Rectangle)</option>
            <option value="circle" ${ent.shape === 'circle' ? 'selected' : ''}>Hình Tròn (Circle)</option>
            <option value="text" ${ent.shape === 'text' ? 'selected' : ''}>Chữ (Text Label)</option>
          </select>
        </div>
        ${ent.shape === 'sprite' ? `
          <div class="prop-row">
            <label>Sprite</label>
            <select id="prop-sprite-id">
              <option value="">(Không dùng sprite)</option>
              ${spriteOptions}
            </select>
          </div>
        ` : ''}
        ${ent.shape === 'text' ? `
          <div class="prop-row">
            <label>Nội dung Chữ</label>
            <input type="text" id="prop-text" value="${ent.text}">
          </div>
          <div class="prop-row">
            <label>Cỡ Chữ</label>
            <input type="number" id="prop-font-size" value="${ent.fontSize}">
          </div>
        ` : ''}
        <div class="prop-row">
          <label>Màu Sắc / Tint</label>
          <input type="color" id="prop-color" value="${ent.color}">
        </div>
        <div class="prop-row">
          <label>Độ Trong Suốt</label>
          <input type="range" id="prop-opacity" min="0" max="1" step="0.05" value="${ent.opacity}">
        </div>
      </div>

      <!-- Physics -->
      <div class="prop-group">
        <div class="prop-title" style="display: flex; justify-content: space-between;">
          <span>Vật Lý 2D</span>
          <input type="checkbox" id="prop-phy-enable" ${ent.physics.enabled ? 'checked' : ''}>
        </div>
        ${ent.physics.enabled ? `
          <div class="prop-row">
            <label>Kiểu Vật Thể</label>
            <select id="prop-phy-type">
              <option value="static" ${ent.physics.type === 'static' ? 'selected' : ''}>Tĩnh (Static - Sàn, tường)</option>
              <option value="dynamic" ${ent.physics.type === 'dynamic' ? 'selected' : ''}>Động (Dynamic - Rơi, nhảy)</option>
              <option value="kinematic" ${ent.physics.type === 'kinematic' ? 'selected' : ''}>Chuyển động (Kinematic)</option>
            </select>
          </div>
          <div class="prop-grid-2">
            <div class="prop-row"><label>Ma Sát</label><input type="number" id="prop-phy-fric" step="0.1" value="${ent.physics.friction}"></div>
            <div class="prop-row"><label>Độ Nảy</label><input type="number" id="prop-phy-rest" step="0.1" value="${ent.physics.restitution}"></div>
          </div>
          <div class="prop-row">
            <label>Tỷ Lệ Trọng Lực</label>
            <input type="number" id="prop-phy-grav" step="0.1" value="${ent.physics.gravityScale}">
          </div>
          <div class="prop-row">
            <label>Là Vùng Kích Hoạt (Trigger)</label>
            <input type="checkbox" id="prop-phy-trigger" ${ent.physics.isTrigger ? 'checked' : ''}>
          </div>
        ` : ''}
      </div>

      <!-- Behaviors -->
      <div class="prop-group">
        <div class="prop-title" style="display: flex; justify-content: space-between; align-items: center;">
          <span>Hành Vi & Tính Năng</span>
          <select id="add-behavior-select" class="mini-select">
            <option value="">+ Thêm Hành Vi...</option>
            <option value="platformer">🎮 Platformer Controller</option>
            <option value="topdown">🧭 Top-Down 8 Hướng</option>
            <option value="patrol">🚶 Đi Tuần Tra (Patrol)</option>
            <option value="rotate">🔄 Xoay Liên Tục</option>
            <option value="collectible">🪙 Thu Thập / Ăn Điểm</option>
            <option value="hazard">⚠️ Gây Sát Thương (Hazard)</option>
            <option value="health">❤️ Thanh Máu (Health)</option>
            <option value="cameraFollow">🎥 Camera Theo Dõi</option>
          </select>
        </div>
        ${behaviorsHTML}
      </div>

      <!-- Custom Script -->
      <div class="prop-group">
        <div class="prop-title">Mã Lập Trình (Custom Script)</div>
        <textarea id="prop-script" class="code-textarea" rows="8" placeholder="// Viết mã Javascript logic tại đây...&#10;onUpdate(entity, dt, engine) { ... }">${ent.script || ''}</textarea>
        <button class="btn btn-sm btn-outline mt-2 w-full" id="btn-open-code-tab">💻 Mở trong Tab Lập Trình</button>
      </div>
    `;

    // Bind event listeners for inputs
    this.bindInspectorEvents(ent);
  }

  renderBehaviorFields(b) {
    if (b.type === 'platformer') {
      return `
        <div class="prop-grid-2">
          <div class="prop-row"><label>Tốc độ</label><input type="number" data-bfield="speed" value="${b.speed || 220}"></div>
          <div class="prop-row"><label>Lực nhảy</label><input type="number" data-bfield="jumpForce" value="${b.jumpForce || 420}"></div>
        </div>
        <div class="prop-row">
          <label>Nhảy đôi (Double Jump)</label>
          <input type="checkbox" data-bfield="doubleJump" ${b.doubleJump ? 'checked' : ''}>
        </div>
      `;
    }
    if (b.type === 'patrol') {
      return `
        <div class="prop-grid-2">
          <div class="prop-row"><label>Khoảng cách</label><input type="number" data-bfield="distance" value="${b.distance || 120}"></div>
          <div class="prop-row"><label>Tốc độ</label><input type="number" data-bfield="speed" value="${b.speed || 80}"></div>
        </div>
      `;
    }
    if (b.type === 'rotate') {
      return `
        <div class="prop-row"><label>Tốc độ quay (độ/s)</label><input type="number" data-bfield="speed" value="${b.speed || 90}"></div>
      `;
    }
    if (b.type === 'collectible') {
      return `
        <div class="prop-row"><label>Cộng điểm</label><input type="number" data-bfield="scoreValue" value="${b.scoreValue || 10}"></div>
      `;
    }
    if (b.type === 'health') {
      return `
        <div class="prop-row"><label>Máu tối đa</label><input type="number" data-bfield="maxHp" value="${b.maxHp || 3}"></div>
      `;
    }
    return '';
  }

  bindInspectorEvents(ent) {
    const bindVal = (id, prop, isNum = false) => {
      document.getElementById(id)?.addEventListener('input', (e) => {
        ent[prop] = isNum ? parseFloat(e.target.value) || 0 : e.target.value;
      });
    };

    bindVal('prop-name', 'name');
    bindVal('prop-tag', 'tag');
    bindVal('prop-x', 'x', true);
    bindVal('prop-y', 'y', true);
    bindVal('prop-w', 'width', true);
    bindVal('prop-h', 'height', true);
    bindVal('prop-rot', 'rotation', true);
    bindVal('prop-z', 'zIndex', true);
    bindVal('prop-color', 'color');
    bindVal('prop-opacity', 'opacity', true);
    bindVal('prop-text', 'text');
    bindVal('prop-font-size', 'fontSize', true);

    document.getElementById('prop-shape')?.addEventListener('change', (e) => {
      ent.shape = e.target.value;
      this.refreshInspector();
    });

    document.getElementById('prop-sprite-id')?.addEventListener('change', (e) => {
      ent.spriteId = e.target.value || null;
    });

    document.getElementById('prop-phy-enable')?.addEventListener('change', (e) => {
      ent.physics.enabled = e.target.checked;
      this.refreshInspector();
    });

    document.getElementById('prop-phy-type')?.addEventListener('change', (e) => {
      ent.physics.type = e.target.value;
    });

    document.getElementById('prop-phy-fric')?.addEventListener('input', (e) => {
      ent.physics.friction = parseFloat(e.target.value) || 0;
    });

    document.getElementById('prop-phy-rest')?.addEventListener('input', (e) => {
      ent.physics.restitution = parseFloat(e.target.value) || 0;
    });

    document.getElementById('prop-phy-grav')?.addEventListener('input', (e) => {
      ent.physics.gravityScale = parseFloat(e.target.value) || 0;
    });

    document.getElementById('prop-phy-trigger')?.addEventListener('change', (e) => {
      ent.physics.isTrigger = e.target.checked;
    });

    // Add behavior
    document.getElementById('add-behavior-select')?.addEventListener('change', (e) => {
      const type = e.target.value;
      if (type) {
        ent.addBehavior({ type });
        this.refreshInspector();
      }
    });

    // Remove behavior
    document.querySelectorAll('[data-remove-behavior]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-remove-behavior');
        ent.removeBehavior(type);
        this.refreshInspector();
      });
    });

    // Script save
    document.getElementById('prop-script')?.addEventListener('input', (e) => {
      ent.script = e.target.value;
    });

    document.getElementById('btn-open-code-tab')?.addEventListener('click', () => {
      this.switchTab('code');
    });
  }

  // Pixel Painter Studio DOM bindings
  bindPixelPainterDOM() {
    const pp = this.engine.pixelPainter;

    // Canvas pointer events
    const canvas = pp.canvas;
    if (canvas) {
      canvas.addEventListener('mousedown', (e) => {
        pp.handlePointerDown(e.clientX, e.clientY);
      });
      canvas.addEventListener('mousemove', (e) => {
        pp.handlePointerMove(e.clientX, e.clientY);
      });
      canvas.addEventListener('mouseup', (e) => {
        pp.handlePointerUp(e.clientX, e.clientY);
      });
    }

    // Tools
    document.querySelectorAll('.pixel-tool-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pixel-tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        pp.currentTool = btn.getAttribute('data-tool');
      });
    });

    // Color Swatches
    const swatchContainer = document.getElementById('palette-swatches');
    if (swatchContainer) {
      swatchContainer.innerHTML = '';
      pp.palette.forEach(color => {
        const sw = document.createElement('div');
        sw.className = 'color-swatch';
        sw.style.backgroundColor = color;
        sw.addEventListener('click', () => {
          pp.currentColor = color;
          this.updateColorPicker(color);
        });
        swatchContainer.appendChild(sw);
      });
    }

    // Color Picker input
    const colorInput = document.getElementById('pixel-color-picker');
    colorInput?.addEventListener('input', (e) => {
      pp.currentColor = e.target.value;
    });

    // Resolution switcher
    document.getElementById('pixel-res-select')?.addEventListener('change', (e) => {
      const res = parseInt(e.target.value) || 16;
      pp.setResolution(res, res);
    });

    // Frames
    document.getElementById('btn-add-frame')?.addEventListener('click', () => {
      pp.addFrame();
      this.refreshFramesList();
    });
    document.getElementById('btn-dup-frame')?.addEventListener('click', () => {
      pp.duplicateFrame();
      this.refreshFramesList();
    });
    document.getElementById('btn-del-frame')?.addEventListener('click', () => {
      pp.deleteFrame();
      this.refreshFramesList();
    });
    document.getElementById('btn-play-anim')?.addEventListener('click', (e) => {
      const isPlaying = pp.toggleAnimPlay();
      e.target.innerText = isPlaying ? '⏹ Dừng' : '▶ Xem Thử';
    });
    document.getElementById('anim-fps-slider')?.addEventListener('input', (e) => {
      pp.fps = parseInt(e.target.value);
      document.getElementById('anim-fps-val').innerText = `${pp.fps} FPS`;
    });
    document.getElementById('btn-clear-canvas')?.addEventListener('click', () => {
      if (confirm('Xóa sạch hình vẽ khung hiện tại?')) pp.clear();
    });

    // Save Sprite to Library
    document.getElementById('btn-save-sprite-asset')?.addEventListener('click', () => {
      const name = prompt('Đặt tên cho Sprite:', 'HeroSprite') || 'NewSprite';
      const asset = pp.exportSpriteAsset(name);
      this.refreshPixelAssetsList();
      this.engine.log(`🎨 Đã lưu Sprite "${name}" vào Thư viện Tài nguyên!`, 'success');

      // If entity is selected, ask to assign
      if (this.engine.selectedEntity) {
        this.engine.selectedEntity.spriteId = asset.id;
        this.engine.selectedEntity.shape = 'sprite';
        this.refreshInspector();
      }
    });

    // Apply to selected entity
    document.getElementById('btn-apply-to-selected')?.addEventListener('click', () => {
      if (!this.engine.selectedEntity) {
        alert('Chưa chọn đối tượng nào trên Màn chơi!');
        return;
      }
      const asset = pp.exportSpriteAsset(this.engine.selectedEntity.name + '_Sprite');
      this.engine.selectedEntity.spriteId = asset.id;
      this.engine.selectedEntity.shape = 'sprite';
      this.refreshInspector();
      this.engine.log(`✅ Đã gán Sprite cho đối tượng ${this.engine.selectedEntity.name}!`, 'success');
    });

    this.refreshFramesList();
    this.refreshPixelAssetsList();
  }

  updateColorPicker(hex) {
    const input = document.getElementById('pixel-color-picker');
    if (input) input.value = hex;
  }

  refreshFramesList() {
    const list = document.getElementById('frames-list');
    if (!list) return;
    list.innerHTML = '';
    const pp = this.engine.pixelPainter;

    pp.frames.forEach((frame, idx) => {
      const btn = document.createElement('div');
      btn.className = `frame-item ${pp.currentFrameIndex === idx ? 'active' : ''}`;
      btn.innerText = `F${idx + 1}`;
      btn.addEventListener('click', () => {
        pp.selectFrame(idx);
        this.refreshFramesList();
      });
      list.appendChild(btn);
    });
  }

  refreshPixelAssetsList() {
    const list = document.getElementById('sprite-assets-list');
    if (!list) return;
    list.innerHTML = '';

    for (const [id, asset] of this.engine.pixelPainter.spriteAssets.entries()) {
      const card = document.createElement('div');
      card.className = `asset-card ${this.activeSpriteId === id ? 'selected' : ''}`;
      card.innerHTML = `
        <img src="${asset.frames[0]}" class="asset-thumb">
        <span class="asset-title">${asset.name}</span>
      `;
      card.addEventListener('click', () => {
        this.activeSpriteId = id;
        this.engine.pixelPainter.loadSpriteAsset(asset);
        this.refreshPixelAssetsList();
      });
      list.appendChild(card);
    }
  }

  // Sound Synth Studio DOM bindings
  bindSoundSynthDOM() {
    const snd = this.engine.sound;

    // Preset generator buttons
    document.querySelectorAll('[data-sound-preset]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-sound-preset');
        snd.play(`snd_${type}`);
        this.drawWaveformPreview(type);
      });
    });

    // Play Custom Synth
    document.getElementById('btn-play-synth')?.addEventListener('click', () => {
      const cfg = this.getCustomSynthConfig();
      snd.play(cfg);
      this.drawWaveformPreview(cfg.type || cfg.wave);
    });

    // Save custom sound
    document.getElementById('btn-save-synth')?.addEventListener('click', () => {
      const name = prompt('Đặt tên cho Âm thanh:', 'SFX_Custom') || 'SFX';
      const id = EngineMath.generateId('snd');
      const cfg = { id, name, ...this.getCustomSynthConfig() };
      snd.saveSound(id, cfg);
      this.refreshSoundAssetsList();
      this.engine.log(`🔊 Đã lưu Âm thanh "${name}" vào Dự án!`, 'success');
    });

    this.refreshSoundAssetsList();
  }

  getCustomSynthConfig() {
    return {
      wave: document.getElementById('synth-wave')?.value || 'square',
      startFreq: parseFloat(document.getElementById('synth-start-freq')?.value) || 440,
      endFreq: parseFloat(document.getElementById('synth-end-freq')?.value) || 220,
      attack: parseFloat(document.getElementById('synth-attack')?.value) || 0.01,
      decay: parseFloat(document.getElementById('synth-decay')?.value) || 0.2,
      volume: parseFloat(document.getElementById('synth-volume')?.value) || 0.5
    };
  }

  drawWaveformPreview(type) {
    const canvas = document.getElementById('synth-waveform-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const t = x / w;
      let y = h / 2;
      if (type === 'jump' || type === 'laser') {
        y += Math.sin(t * 30 * (1 - t)) * 25 * (1 - t);
      } else if (type === 'noise' || type === 'explosion') {
        y += (Math.random() * 2 - 1) * 30 * (1 - t);
      } else {
        y += Math.sin(t * 20) * 20 * (1 - t);
      }
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  refreshSoundAssetsList() {
    const list = document.getElementById('sound-assets-list');
    if (!list) return;
    list.innerHTML = '';

    this.engine.sound.getAllSounds().forEach(s => {
      const item = document.createElement('div');
      item.className = 'sound-asset-item';
      item.innerHTML = `
        <span>🔊 ${s.name}</span>
        <button class="mini-btn" data-play-snd="${s.id}">▶ Thử</button>
      `;
      item.querySelector('button').addEventListener('click', () => {
        this.engine.sound.play(s.id);
        this.drawWaveformPreview(s.type || s.wave);
      });
      list.appendChild(item);
    });
  }

  // Fullscreen Code Editor
  refreshCodeEditor() {
    const textarea = document.getElementById('full-code-editor');
    const targetTitle = document.getElementById('code-editor-target-name');
    if (!textarea) return;

    if (this.engine.selectedEntity) {
      if (targetTitle) targetTitle.innerText = `Đang viết mã cho: ${this.engine.selectedEntity.name}`;
      textarea.value = this.engine.selectedEntity.script || '';
      textarea.oninput = () => {
        this.engine.selectedEntity.script = textarea.value;
      };
    } else {
      if (targetTitle) targetTitle.innerText = 'Chưa chọn đối tượng nào';
      textarea.value = '// Vui lòng chọn một đối tượng để lập trình hành vi cho nó.';
    }
  }

  // Quick Preset Entity Creator
  createPresetEntity(type) {
    const center = this.engine.renderer.camera;
    const base = {
      x: Math.round(center.x),
      y: Math.round(center.y)
    };

    switch (type) {
      case 'player':
        this.engine.addEntity({
          name: 'Player',
          tag: 'player',
          ...base,
          width: 32,
          height: 32,
          shape: 'sprite',
          spriteId: 'spr_player',
          zIndex: 10,
          physics: { enabled: true, type: 'dynamic', mass: 1 },
          behaviors: [
            { type: 'platformer', speed: 230, jumpForce: 450, doubleJump: true },
            { type: 'health', maxHp: 3 },
            { type: 'cameraFollow' }
          ]
        });
        break;

      case 'ground':
        this.engine.addEntity({
          name: 'Ground Platform',
          tag: 'solid',
          ...base,
          width: 160,
          height: 32,
          shape: 'sprite',
          spriteId: 'spr_grass_block',
          color: '#10b981',
          zIndex: 1,
          physics: { enabled: true, type: 'static', friction: 0.5 }
        });
        break;

      case 'coin':
        this.engine.addEntity({
          name: 'Coin',
          tag: 'coin',
          ...base,
          width: 20,
          height: 20,
          shape: 'sprite',
          spriteId: 'spr_coin',
          zIndex: 4,
          physics: { enabled: true, isTrigger: true },
          behaviors: [
            { type: 'collectible', scoreValue: 10, sound: 'snd_coin' },
            { type: 'rotate', speed: 120 }
          ]
        });
        break;

      case 'slime':
        this.engine.addEntity({
          name: 'Slime',
          tag: 'enemy',
          ...base,
          width: 28,
          height: 24,
          shape: 'sprite',
          spriteId: 'spr_slime',
          zIndex: 5,
          physics: { enabled: true, type: 'kinematic' },
          behaviors: [
            { type: 'patrol', distance: 60, speed: 70, axis: 'x' },
            { type: 'hazard', damage: 1, sound: 'snd_hit' }
          ]
        });
        break;

      case 'spikes':
        this.engine.addEntity({
          name: 'Spikes',
          tag: 'hazard',
          ...base,
          width: 32,
          height: 16,
          shape: 'sprite',
          spriteId: 'spr_spike',
          zIndex: 2,
          physics: { enabled: true, isTrigger: true },
          behaviors: [
            { type: 'hazard', damage: 1, sound: 'snd_hit' }
          ]
        });
        break;

      case 'text':
        this.engine.addEntity({
          name: 'Text Label',
          tag: 'ui',
          ...base,
          shape: 'text',
          text: 'Văn bản Mới',
          fontSize: 18,
          fontColor: '#ffffff',
          zIndex: 20,
          physics: { enabled: false }
        });
        break;

      default:
        this.engine.addEntity({
          name: 'New Entity',
          ...base,
          width: 32,
          height: 32,
          shape: 'rect',
          color: '#3b82f6',
          zIndex: 1
        });
        break;
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
    const entElem = document.getElementById('stat-entities');
    const scoreElem = document.getElementById('stat-score');

    if (fpsElem) fpsElem.innerText = `${this.engine.fps} FPS`;
    if (entElem) entElem.innerText = `${this.engine.entities.length} đối tượng`;
    if (scoreElem) scoreElem.innerText = `Điểm: ${this.engine.score}`;
  }

  log(msg, type = 'info') {
    const container = document.getElementById('console-logs');
    if (!container) return;

    const row = document.createElement('div');
    row.className = `log-row log-${type}`;
    const time = new Date().toLocaleTimeString();
    row.innerHTML = `<span class="log-time">[${time}]</span> <span class="log-msg">${msg}</span>`;

    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
  }
}

window.EditorUI = EditorUI;

