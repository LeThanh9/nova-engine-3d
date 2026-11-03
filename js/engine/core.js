/**
 * NovaEngine - Core Engine Orchestrator
 * Coordinates Scene Graph, Game Loop, Play/Pause/Stop rollback, Physics, Audio & Rendering
 */
class NovaEngine {
  constructor() {
    this.projectName = 'Super Pixel Platformer';
    this.version = '1.0.0';

    // Subsystems
    this.sound = new SoundEngine();
    this.physics = new PhysicsEngine();
    this.particles = new ParticleSystem();
    this.scriptRuntime = new ScriptRuntime(this);
    this.exporter = new GameExporter(this);

    // Renderer & UI set later during DOM bootstrap
    this.renderer = null;
    this.pixelPainter = null;
    this.ui = null;

    // State
    this.entities = [];
    this.selectedEntity = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.playSnapshot = null; // Snapshot for Play/Stop rollback
    this.score = 0;

    // Engine loop stats
    this.fps = 60;
    this.fpsTimer = 0;
    this.framesCount = 0;
    this.lastTime = performance.now();

    // Prefab templates
    this.prefabs = new Map();
  }

  init(canvasElement, pixelCanvas, previewPixelCanvas) {
    this.renderer = new EngineRenderer(canvasElement, this);
    this.pixelPainter = new PixelPainter(pixelCanvas, previewPixelCanvas);

    // Load initial Platformer template
    this.loadTemplate('platformer');

    // Start Main Loop
    requestAnimationFrame((time) => this.loop(time));
  }

  loadTemplate(templateKey) {
    let tpl;
    if (templateKey === 'platformer') tpl = EngineTemplates.createPlatformer();
    else if (templateKey === 'shooter') tpl = EngineTemplates.createSpaceShooter();
    else if (templateKey === 'physics') tpl = EngineTemplates.createPhysicsToy();
    else tpl = EngineTemplates.createBlank();

    this.projectName = tpl.name;
    this.entities = tpl.entities.map(data => Entity.deserialize(data));
    this.selectedEntity = this.entities[0] || null;
    this.score = 0;

    if (this.ui) {
      this.ui.refreshAll();
    }
  }

  // Play Mode Controls
  play() {
    if (this.isPlaying && this.isPaused) {
      this.isPaused = false;
      this.log('▶ Tiếp tục trò chơi (Resume)', 'info');
      return;
    }

    if (this.isPlaying) return;

    // Snapshot all entities before playing so we can restore on Stop
    this.playSnapshot = this.entities.map(e => e.snapshot());
    this.isPlaying = true;
    this.isPaused = false;
    this.score = 0;

    this.sound.init();
    this.scriptRuntime.onStart(this.entities);
    this.log('▶ BẮT ĐẦU CHƠI THỬ NGHIỆM! (Play Mode Active)', 'success');

    if (this.ui) this.ui.updatePlayControls();
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPaused = !this.isPaused;
    this.log(this.isPaused ? '⏸ Tạm dừng trò chơi (Paused)' : '▶ Tiếp tục trò chơi (Resumed)', 'info');
    if (this.ui) this.ui.updatePlayControls();
  }

  step() {
    if (!this.isPlaying) {
      this.play();
      this.isPaused = true;
    }
    this.isPaused = true;
    this.updateFixed(1 / 60);
    this.log('⏭ Tiến 1 Frame (Step Debug)', 'info');
  }

  stop() {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.isPaused = false;

    // Restore exact snapshot
    if (this.playSnapshot) {
      this.entities = this.playSnapshot.map(data => Entity.deserialize(data));
      this.playSnapshot = null;
    }

    this.particles.clear();
    this.selectedEntity = this.entities[0] || null;
    this.log('⏹ Dừng chơi & Đã khôi phục trạng thái Scene ban đầu (Edit Mode Active)', 'info');

    if (this.ui) {
      this.ui.updatePlayControls();
      this.ui.refreshAll();
    }
  }

  // Engine Main Loop
  loop(time) {
    const dt = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;

    // Calculate FPS
    this.framesCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round((this.framesCount / this.fpsTimer));
      this.framesCount = 0;
      this.fpsTimer = 0;
      if (this.ui) this.ui.updateStats();
    }

    // Update simulation
    if (this.isPlaying && !this.isPaused) {
      this.updateFixed(dt);
    }

    // Update Camera
    if (this.renderer) {
      this.renderer.updateCamera(dt);
    }

    // Render Scene
    if (this.renderer) {
      this.renderer.render(this.entities, this.selectedEntity);
    }

    requestAnimationFrame((t) => this.loop(t));
  }

  updateFixed(dt) {
    // 1. Script & Behaviors Update
    this.scriptRuntime.update(this.entities, dt);

    // 2. Physics Simulation
    this.physics.update(this.entities, dt, (a, b) => {
      this.scriptRuntime.handleCollision(a, b);
    });

    // 3. Particles
    this.particles.update(dt);
  }

  // Entity Management API
  addEntity(options = {}) {
    const ent = new Entity(options);
    this.entities.push(ent);
    this.selectedEntity = ent;
    if (this.ui) this.ui.refreshAll();
    return ent;
  }

  duplicateEntity(entity) {
    if (!entity) return null;
    const cloned = entity.clone();
    this.entities.push(cloned);
    this.selectedEntity = cloned;
    if (this.ui) this.ui.refreshAll();
    return cloned;
  }

  deleteEntity(entity) {
    if (!entity) return;
    const idx = this.entities.indexOf(entity);
    if (idx !== -1) {
      this.entities.splice(idx, 1);
      this.selectedEntity = this.entities[Math.max(0, idx - 1)] || null;
      if (this.ui) this.ui.refreshAll();
    }
  }

  destroyEntity(id) {
    this.entities = this.entities.filter(e => e.id !== id);
    if (this.selectedEntity && this.selectedEntity.id === id) {
      this.selectedEntity = null;
    }
    if (this.ui && !this.isPlaying) this.ui.refreshAll();
  }

  spawnEntity(options) {
    const ent = new Entity(options);
    this.entities.push(ent);
    if (this.isPlaying) {
      this.scriptRuntime.onStart([ent]);
    }
    return ent;
  }

  findEntityByTag(tag) {
    return this.entities.find(e => e.tag === tag);
  }

  findEntitiesByTag(tag) {
    return this.entities.filter(e => e.tag === tag);
  }

  findEntityByName(name) {
    return this.entities.find(e => e.name === name);
  }

  getSpriteAsset(id) {
    return this.pixelPainter ? this.pixelPainter.spriteAssets.get(id) : null;
  }

  addScore(points) {
    this.score += points;
    if (this.ui) this.ui.updateStats();
  }

  getScore() {
    return this.score;
  }

  log(message, type = 'info') {
    if (this.ui) {
      this.ui.log(message, type);
    } else {
      console.log(`[${type}] ${message}`);
    }
  }
}

window.NovaEngine = NovaEngine;

