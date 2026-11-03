/**
 * NovaEngine - Standalone Game Exporter & Project Serializer
 * Exports complete 100% self-contained single-file HTML games that run anywhere offline!
 */
class GameExporter {
  constructor(engine) {
    this.engine = engine;
    this.storageKey = 'nova_engine_saved_project';
  }

  // Save current project state to JSON string
  exportProjectJSON() {
    const project = {
      name: this.engine.projectName || 'MyGame',
      version: '1.0.0',
      savedAt: new Date().toISOString(),
      score: this.engine.score,
      sprites: Array.from(this.engine.pixelPainter.spriteAssets.entries()),
      sounds: this.engine.sound.getAllSounds(),
      entities: this.engine.entities.map(e => e.serialize())
    };
    return JSON.stringify(project, null, 2);
  }

  // Download project as JSON file
  downloadProjectJSON() {
    const jsonStr = this.exportProjectJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.engine.projectName || 'MyGame'}.novagame.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.engine.log('💾 Đã lưu và tải file dự án thành công!', 'success');
  }

  // Load project from JSON object
  importProjectJSON(json) {
    try {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      this.engine.projectName = data.name || 'MyGame';

      // Load sprites
      if (Array.isArray(data.sprites)) {
        this.engine.pixelPainter.spriteAssets.clear();
        for (const [id, asset] of data.sprites) {
          this.engine.pixelPainter.spriteAssets.set(id, asset);
        }
      }

      // Load sounds
      if (Array.isArray(data.sounds)) {
        for (const snd of data.sounds) {
          this.engine.sound.saveSound(snd.id, snd);
        }
      }

      // Load entities
      this.engine.entities = [];
      if (Array.isArray(data.entities)) {
        for (const entData of data.entities) {
          this.engine.entities.push(Entity.deserialize(entData));
        }
      }

      this.engine.selectedEntity = null;
      if (this.engine.ui) {
        this.engine.ui.refreshAll();
      }
      this.engine.log(`📂 Đã nạp thành công dự án "${data.name}" (${this.engine.entities.length} đối tượng)!`, 'success');
    } catch (e) {
      this.engine.log(`❌ Lỗi khi nạp file dự án: ${e.message}`, 'error');
    }
  }

  // Save to LocalStorage
  saveToLocalStorage() {
    try {
      const jsonStr = this.exportProjectJSON();
      localStorage.setItem(this.storageKey, jsonStr);
      return true;
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
      return false;
    }
  }

  // Load from LocalStorage
  loadFromLocalStorage() {
    try {
      const jsonStr = localStorage.getItem(this.storageKey);
      if (jsonStr) {
        this.importProjectJSON(jsonStr);
        return true;
      }
    } catch (e) {
      console.warn('LocalStorage load failed:', e);
    }
    return false;
  }

  /**
   * 🌟 100% STANDALONE HTML GAME EXPORTER
   * Generates a completely self-contained, single-file HTML game that runs in any browser offline!
   */
  exportStandaloneHTML() {
    const projectName = this.engine.projectName || 'My Game';
    const entitiesData = JSON.stringify(this.engine.entities.map(e => e.serialize()));
    const spritesData = JSON.stringify(Array.from(this.engine.pixelPainter.spriteAssets.entries()));
    const soundsData = JSON.stringify(this.engine.sound.getAllSounds());

    const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${projectName} - Standalone Game</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-user-select: none; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; color: #fff; }
    #game-container { position: relative; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
    canvas { display: block; width: 100%; height: 100%; image-rendering: pixelated; image-rendering: crisp-edges; }
    
    /* In-game HUD */
    #hud { position: absolute; top: 16px; left: 16px; font-size: 20px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.8); pointer-events: none; }
    
    /* Touch Controls for Mobile */
    #touch-controls {
      position: absolute; bottom: 20px; left: 0; width: 100%; display: flex; justify-content: space-between; padding: 0 24px; pointer-events: none;
    }
    .touch-btn-group { display: flex; gap: 12px; pointer-events: auto; }
    .touch-btn {
      width: 64px; height: 64px; border-radius: 50%; background: rgba(255, 255, 255, 0.2); border: 2px solid rgba(255, 255, 255, 0.4);
      color: #fff; font-size: 24px; font-weight: bold; display: flex; align-items: center; justify-content: center;
      touch-action: manipulation; backdrop-filter: blur(4px); active: background: rgba(0, 240, 255, 0.6);
    }
    .touch-btn:active { background: rgba(0, 240, 255, 0.6); transform: scale(0.95); }
    @media (hover: hover) and (pointer: fine) {
      #touch-controls { display: none; } /* Hide on desktop with mouse */
    }
  </style>
</head>
<body>
  <div id="game-container">
    <canvas id="viewport"></canvas>
    <div id="hud">
      <div id="score-display">⭐ ĐIỂM: 0</div>
      <div id="hp-display" style="font-size: 16px; margin-top: 4px;"></div>
    </div>
    <div id="touch-controls">
      <div class="touch-btn-group">
        <button class="touch-btn" id="btn-left">◀</button>
        <button class="touch-btn" id="btn-right">▶</button>
      </div>
      <div class="touch-btn-group">
        <button class="touch-btn" id="btn-jump" style="width: 72px; height: 72px; background: rgba(0, 240, 255, 0.35);">▲</button>
      </div>
    </div>
  </div>

  <script>
    // Embedded Data
    const EMBEDDED_ENTITIES = ${entitiesData};
    const EMBEDDED_SPRITES = new Map(${spritesData});
    const EMBEDDED_SOUNDS = ${soundsData};

    // Micro Math & Vec2
    const EngineMath = {
      clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
      lerp: (a, b, t) => a + (b - a) * t,
      degToRad: (deg) => (deg * Math.PI) / 180,
      generateId: (p = 'ent') => p + '_' + Math.random().toString(36).substr(2, 6)
    };

    // Micro Audio Engine
    class SoundEngine {
      constructor() {
        this.ctx = null;
        this.sounds = new Map();
        EMBEDDED_SOUNDS.forEach(s => this.sounds.set(s.id, s));
      }
      init() {
        if (!this.ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (AC) this.ctx = new AC();
        }
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      }
      play(id) {
        this.init();
        if (!this.ctx) return;
        const cfg = this.sounds.get(id);
        if (!cfg) return;
        const now = this.ctx.currentTime;
        const vol = (cfg.volume || 0.5);

        if (cfg.wave === 'noise' || cfg.type === 'noise') {
          const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * (cfg.decay || 0.3), this.ctx.sampleRate);
          const out = buf.getChannelData(0);
          for (let i = 0; i < out.length; i++) out[i] = Math.random() * 2 - 1;
          const src = this.ctx.createBufferSource();
          src.buffer = buf;
          const flt = this.ctx.createBiquadFilter();
          flt.type = 'lowpass';
          flt.frequency.setValueAtTime(cfg.startFreq || 800, now);
          flt.frequency.exponentialRampToValueAtTime(cfg.endFreq || 50, now + (cfg.decay || 0.3));
          const gn = this.ctx.createGain();
          gn.gain.setValueAtTime(vol, now);
          gn.gain.exponentialRampToValueAtTime(0.001, now + (cfg.decay || 0.3));
          src.connect(flt); flt.connect(gn); gn.connect(this.ctx.destination);
          src.start(now);
          return;
        }

        if (cfg.type === 'coin') {
          this.tone(cfg.startFreq || 987, 'sine', now, 0.08, vol);
          this.tone(cfg.endFreq || 1318, 'sine', now + 0.07, 0.2, vol);
          return;
        }

        if (cfg.type === 'victory') {
          [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, 'sine', now + i * 0.12, 0.35, vol));
          return;
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = cfg.wave || 'square';
        osc.frequency.setValueAtTime(cfg.startFreq || 440, now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(10, cfg.endFreq || 440), now + (cfg.attack || 0.01) + (cfg.decay || 0.2));
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + (cfg.attack || 0.01));
        gain.gain.exponentialRampToValueAtTime(0.0001, now + (cfg.attack || 0.01) + (cfg.decay || 0.2));
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(now); osc.stop(now + (cfg.attack || 0.01) + (cfg.decay || 0.2) + 0.05);
      }
      tone(freq, wave, start, dur, vol) {
        const osc = this.ctx.createOscillator();
        const gn = this.ctx.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(freq, start);
        gn.gain.setValueAtTime(0, start);
        gn.gain.linearRampToValueAtTime(vol, start + 0.01);
        gn.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(gn); gn.connect(this.ctx.destination);
        osc.start(start); osc.stop(start + dur + 0.02);
      }
    }

    // Micro Entity
    class Entity {
      constructor(data) {
        Object.assign(this, data);
        this.behaviors = data.behaviors ? JSON.parse(JSON.stringify(data.behaviors)) : [];
        this.physics = Object.assign({
          enabled: false, type: 'static', mass: 1, friction: 0.2, restitution: 0, gravityScale: 1,
          isTrigger: false, vx: 0, vy: 0, grounded: false, wasGrounded: false, jumpCount: 0
        }, data.physics || {});
        this.anim = { frame: 0, timer: 0, fps: data.animFps || 8 };
        this._runtime = { initialX: this.x, initialY: this.y, patrolDir: 1, patrolStart: this.x, invulnerableTimer: 0, customInstance: null };
        this.customData = data.customData || {};
      }
      hasBehavior(t) { return this.behaviors.some(b => b.type === t); }
      getBehavior(t) { return this.behaviors.find(b => b.type === t); }
      getColliderBounds() {
        const w = (this.physics.colliderWidth || this.width) * Math.abs(this.scaleX || 1);
        const h = (this.physics.colliderHeight || this.height) * Math.abs(this.scaleY || 1);
        const cx = this.x + (this.physics.colliderOffsetX || 0);
        const cy = this.y + (this.physics.colliderOffsetY || 0);
        return { x: cx - w / 2, y: cy - h / 2, width: w, height: h, left: cx - w / 2, right: cx + w / 2, top: cy - h / 2, bottom: cy + h / 2 };
      }
    }

    // Micro Particles
    class ParticleSystem {
      constructor() { this.particles = []; }
      burst(x, y, color = '#f59e0b', count = 16) {
        for (let i = 0; i < count; i++) {
          const a = Math.random() * Math.PI * 2;
          const s = 100 + Math.random() * 120;
          this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5, maxLife: 0.5, size: 4, color, gravity: 200 });
        }
      }
      sparkles(x, y, color = '#ffeb3b') {
        for (let i = 0; i < 8; i++) {
          const a = Math.random() * Math.PI * 2;
          this.particles.push({ x, y, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, life: 0.4, maxLife: 0.4, size: 3, color, gravity: -40 });
        }
      }
      jumpDust(x, y) {
        for (let i = 0; i < 6; i++) {
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
          this.particles.push({ x, y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, life: 0.25, maxLife: 0.25, size: 4, color: '#e2e8f0', gravity: 50 });
        }
      }
      update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.life -= dt;
          if (p.life <= 0) { this.particles.splice(i, 1); continue; }
          p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.gravity * dt;
        }
      }
      render(ctx) {
        for (let i = 0; i < this.particles.length; i++) {
          const p = this.particles[i];
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          ctx.restore();
        }
      }
    }

    // Micro Standalone Game App
    class StandaloneGame {
      constructor() {
        this.canvas = document.getElementById('viewport');
        this.ctx = this.canvas.getContext('2d');
        this.scoreDisplay = document.getElementById('score-display');
        this.hpDisplay = document.getElementById('hp-display');
        
        this.score = 0;
        this.entities = EMBEDDED_ENTITIES.map(d => new Entity(d));
        this.sound = new SoundEngine();
        this.particles = new ParticleSystem();
        this.camera = { x: 0, y: 0, targetX: 0, targetY: 0, zoom: 1.0, shakeTimer: 0, shakeIntensity: 0 };
        this.keys = {};
        this.keysPressed = {};
        this.imgCache = new Map();

        this.initCanvas();
        this.initInputs();
        this.initEntities();
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
      }

      initCanvas() {
        const resize = () => {
          this.canvas.width = window.innerWidth;
          this.canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();
      }

      initInputs() {
        window.addEventListener('keydown', (e) => {
          if (!this.keys[e.code]) this.keysPressed[e.code] = true;
          this.keys[e.code] = true;
          this.sound.init();
        });
        window.addEventListener('keyup', (e) => {
          this.keys[e.code] = false;
          this.keysPressed[e.code] = false;
        });

        // Virtual Touch controls
        const bindBtn = (id, keyCode) => {
          const btn = document.getElementById(id);
          if (!btn) return;
          const down = (e) => { e.preventDefault(); this.sound.init(); this.keys[keyCode] = true; this.keysPressed[keyCode] = true; };
          const up = (e) => { e.preventDefault(); this.keys[keyCode] = false; this.keysPressed[keyCode] = false; };
          btn.addEventListener('touchstart', down);
          btn.addEventListener('touchend', up);
          btn.addEventListener('mousedown', down);
          btn.addEventListener('mouseup', up);
        };
        bindBtn('btn-left', 'ArrowLeft');
        bindBtn('btn-right', 'ArrowRight');
        bindBtn('btn-jump', 'Space');
      }

      initEntities() {
        for (const ent of this.entities) {
          const hpBeh = ent.getBehavior('health');
          if (hpBeh) {
            ent.customData.hp = hpBeh.maxHp || 3;
            ent.customData.maxHp = hpBeh.maxHp || 3;
          }
          if (ent.script) {
            try {
              ent._runtime.customInstance = (new Function('return {' + ent.script + '};'))();
              if (ent._runtime.customInstance.onStart) {
                ent._runtime.customInstance.onStart(ent, this);
              }
            } catch (e) { console.error('Script onStart error:', e); }
          }
        }
      }

      isKeyDown(c) { return !!this.keys[c]; }
      isKeyPressed(c) { return !!this.keysPressed[c]; }
      addScore(pts) { this.score += pts; this.scoreDisplay.innerText = '⭐ ĐIỂM: ' + this.score; }
      spawnEntity(data) {
        const ent = new Entity(data);
        this.entities.push(ent);
        return ent;
      }
      destroyEntity(id) {
        this.entities = this.entities.filter(e => e.id !== id);
      }
      shake(int, dur) {
        this.camera.shakeIntensity = int;
        this.camera.shakeTimer = dur;
      }
      log(msg) { console.log(msg); }

      loop(time) {
        const dt = Math.min(0.05, (time - this.lastTime) / 1000);
        this.lastTime = time;

        this.update(dt);
        this.render();

        this.keysPressed = {};
        requestAnimationFrame((t) => this.loop(t));
      }

      update(dt) {
        if (this.camera.shakeTimer > 0) this.camera.shakeTimer -= dt;

        // Camera smooth follow
        this.camera.x = EngineMath.lerp(this.camera.x, this.camera.targetX, 0.1);
        this.camera.y = EngineMath.lerp(this.camera.y, this.camera.targetY, 0.1);

        // Update entities behaviors & scripts
        for (let i = 0; i < this.entities.length; i++) {
          const ent = this.entities[i];
          if (!ent.visible) continue;

          if (ent._runtime.invulnerableTimer > 0) ent._runtime.invulnerableTimer -= dt;

          // Anim
          if (ent.shape === 'sprite' && ent.spriteId) {
            const spr = EMBEDDED_SPRITES.get(ent.spriteId);
            if (spr && spr.frames && spr.frames.length > 1) {
              ent.anim.timer += dt;
              if (ent.anim.timer >= 1 / (ent.anim.fps || 8)) {
                ent.anim.timer = 0;
                ent.anim.frame = (ent.anim.frame + 1) % spr.frames.length;
              }
            }
          }

          // Platformer
          const plat = ent.getBehavior('platformer');
          if (plat) {
            let mx = 0;
            if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) mx -= 1;
            if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) mx += 1;
            ent.physics.vx = mx * (plat.speed || 220);
            if (mx !== 0) ent.scaleX = mx > 0 ? Math.abs(ent.scaleX || 1) : -Math.abs(ent.scaleX || 1);

            const jump = this.isKeyPressed('Space') || this.isKeyPressed('KeyW') || this.isKeyPressed('ArrowUp');
            if (jump) {
              if (ent.physics.grounded) {
                ent.physics.vy = -(plat.jumpForce || 420);
                ent.physics.grounded = false;
                ent.physics.jumpCount = 1;
                this.sound.play('snd_jump');
                this.particles.jumpDust(ent.x, ent.y + ent.height / 2);
              } else if (plat.doubleJump && ent.physics.jumpCount === 1) {
                ent.physics.vy = -(plat.jumpForce || 420) * 0.9;
                ent.physics.jumpCount = 2;
                this.sound.play('snd_jump');
                this.particles.jumpDust(ent.x, ent.y + ent.height / 2);
              }
            }
          }

          // Topdown
          const td = ent.getBehavior('topdown');
          if (td) {
            let mx = 0, my = 0;
            if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) mx -= 1;
            if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) mx += 1;
            if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) my -= 1;
            if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) my += 1;
            if (ent.physics.enabled) {
              ent.physics.vx = mx * (td.speed || 200);
              ent.physics.vy = my * (td.speed || 200);
            } else {
              ent.x += mx * (td.speed || 200) * dt;
              ent.y += my * (td.speed || 200) * dt;
            }
          }

          // Patrol
          const pat = ent.getBehavior('patrol');
          if (pat) {
            ent.x += ent._runtime.patrolDir * (pat.speed || 80) * dt;
            if (Math.abs(ent.x - ent._runtime.patrolStart) >= (pat.distance || 100)) {
              ent._runtime.patrolDir *= -1;
              ent.scaleX = -ent.scaleX;
            }
          }

          // Rotate
          const rot = ent.getBehavior('rotate');
          if (rot) ent.rotation = (ent.rotation + (rot.speed || 90) * dt) % 360;

          // Camera follow
          const camF = ent.getBehavior('cameraFollow');
          if (camF) {
            this.camera.targetX = ent.x;
            this.camera.targetY = ent.y;
          }

          // Custom script onUpdate
          if (ent._runtime.customInstance && ent._runtime.customInstance.onUpdate) {
            try { ent._runtime.customInstance.onUpdate(ent, dt, this); } catch (e) { }
          }
        }

        // Physics update
        this.updatePhysics(dt);
        this.particles.update(dt);

        // Update HP UI
        const player = this.entities.find(e => e.tag === 'player');
        if (player && player.hasBehavior('health')) {
          const hp = player.customData.hp !== undefined ? player.customData.hp : 3;
          let hStr = '';
          for (let i = 0; i < hp; i++) hStr += '❤️ ';
          this.hpDisplay.innerText = 'MÁU: ' + hStr;
        }
      }

      updatePhysics(dt) {
        const dynamics = [];
        const colliders = [];
        for (const e of this.entities) {
          if (!e.visible || !e.physics.enabled) continue;
          colliders.push(e);
          if (e.physics.type === 'dynamic') {
            dynamics.push(e);
            e.physics.vy += 980 * (e.physics.gravityScale || 1) * dt;
            e.physics.vx *= Math.pow(1 - (e.physics.friction || 0.2) * 0.1, dt * 60);
            e.physics.grounded = false;
            e.x += e.physics.vx * dt;
          }
        }

        // Horizontal collisions
        for (const a of dynamics) {
          const boxA = a.getColliderBounds();
          for (const b of colliders) {
            if (a === b) continue;
            const boxB = b.getColliderBounds();
            if (this.overlap(boxA, boxB)) {
              if (a.physics.isTrigger || b.physics.isTrigger) { this.handleCollision(a, b); continue; }
              if (b.physics.type === 'static' || b.physics.type === 'kinematic') {
                const ox = (boxA.width / 2 + boxB.width / 2) - Math.abs(boxA.x + boxA.width / 2 - (boxB.x + boxB.width / 2));
                if (ox > 0) {
                  a.x += (boxA.x < boxB.x ? -ox : ox);
                  a.physics.vx = 0;
                }
              }
              this.handleCollision(a, b);
            }
          }
        }

        // Vertical movement
        for (const a of dynamics) a.y += a.physics.vy * dt;

        // Vertical collisions
        for (const a of dynamics) {
          const boxA = a.getColliderBounds();
          for (const b of colliders) {
            if (a === b) continue;
            const boxB = b.getColliderBounds();
            if (this.overlap(boxA, boxB)) {
              if (a.physics.isTrigger || b.physics.isTrigger) { this.handleCollision(a, b); continue; }
              if (b.physics.type === 'static' || b.physics.type === 'kinematic') {
                const oy = (boxA.height / 2 + boxB.height / 2) - Math.abs(boxA.y + boxA.height / 2 - (boxB.y + boxB.height / 2));
                if (oy > 0) {
                  if (boxA.y < boxB.y) {
                    a.y -= oy;
                    a.physics.vy = a.physics.restitution > 0.1 ? -a.physics.vy * a.physics.restitution : 0;
                    a.physics.grounded = true;
                    a.physics.jumpCount = 0;
                  } else {
                    a.y += oy;
                    if (a.physics.vy < 0) a.physics.vy = 0;
                  }
                }
              }
              this.handleCollision(a, b);
            }
          }
        }
      }

      overlap(r1, r2) {
        return r1.left < r2.right && r1.right > r2.left && r1.top < r2.bottom && r1.bottom > r2.top;
      }

      handleCollision(a, b) {
        // Collectibles
        if (b.hasBehavior('collectible') && a.tag === 'player') {
          const col = b.getBehavior('collectible');
          this.addScore(col.scoreValue || 10);
          this.sound.play(col.sound || 'snd_coin');
          this.particles.sparkles(b.x, b.y, '#ffec27');
          this.destroyEntity(b.id);
        }
        // Hazards
        if (b.hasBehavior('hazard') && a.tag === 'player') {
          if (a._runtime.invulnerableTimer <= 0) {
            const hpBeh = a.getBehavior('health');
            if (hpBeh) {
              a.customData.hp = (a.customData.hp || hpBeh.maxHp) - 1;
              a._runtime.invulnerableTimer = 1.0;
              this.sound.play('snd_hit');
              this.shake(12, 0.3);
              this.particles.burst(a.x, a.y, '#ef4444', 12);
              a.physics.vy = -300;
              if (a.customData.hp <= 0) {
                this.sound.play('snd_explosion');
                a.x = a._runtime.initialX; a.y = a._runtime.initialY;
                a.physics.vx = 0; a.physics.vy = 0; a.customData.hp = hpBeh.maxHp;
              }
            }
          }
        }
        // Scripts
        if (a._runtime.customInstance && a._runtime.customInstance.onCollision) a._runtime.customInstance.onCollision(a, b, this);
        if (b._runtime.customInstance && b._runtime.customInstance.onCollision) b._runtime.customInstance.onCollision(b, a, this);
      }

      render() {
        const ctx = this.ctx;
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        ctx.clearRect(0, 0, cw, ch);

        let sx = 0, sy = 0;
        if (this.camera.shakeTimer > 0) {
          sx = (Math.random() * 2 - 1) * this.camera.shakeIntensity;
          sy = (Math.random() * 2 - 1) * this.camera.shakeIntensity;
        }

        ctx.save();
        ctx.translate(cw / 2 + sx, ch / 2 + sy);
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);
        ctx.imageSmoothingEnabled = false;

        const sorted = [...this.entities].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        for (const ent of sorted) {
          if (!ent.visible) continue;
          ctx.save();
          ctx.translate(ent.x, ent.y);
          ctx.rotate(EngineMath.degToRad(ent.rotation || 0));
          ctx.scale(ent.scaleX || 1, ent.scaleY || 1);
          ctx.globalAlpha = ent.opacity !== undefined ? ent.opacity : 1.0;

          const hw = ent.width / 2;
          const hh = ent.height / 2;

          if (ent.shape === 'rect') {
            ctx.fillStyle = ent.color || '#3b82f6';
            ctx.fillRect(-hw, -hh, ent.width, ent.height);
          } else if (ent.shape === 'circle') {
            ctx.fillStyle = ent.color || '#3b82f6';
            ctx.beginPath();
            ctx.arc(0, 0, hw, 0, Math.PI * 2);
            ctx.fill();
          } else if (ent.shape === 'text') {
            ctx.font = 'bold ' + (ent.fontSize || 16) + 'px sans-serif';
            ctx.fillStyle = ent.fontColor || '#fff';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(ent.text || '', 0, 0);
          } else if (ent.shape === 'sprite' && ent.spriteId) {
            const spr = EMBEDDED_SPRITES.get(ent.spriteId);
            if (spr && spr.frames && spr.frames.length > 0) {
              const frameUrl = spr.frames[ent.anim.frame % spr.frames.length];
              let img = this.imgCache.get(frameUrl);
              if (!img) {
                img = new Image();
                img.src = frameUrl;
                this.imgCache.set(frameUrl, img);
              }
              if (img.complete) {
                ctx.drawImage(img, -hw, -hh, ent.width, ent.height);
              } else {
                ctx.fillStyle = ent.color || '#3b82f6';
                ctx.fillRect(-hw, -hh, ent.width, ent.height);
              }
            } else {
              ctx.fillStyle = ent.color || '#3b82f6';
              ctx.fillRect(-hw, -hh, ent.width, ent.height);
            }
          }
          ctx.restore();
        }

        this.particles.render(ctx);
        ctx.restore();
      }
    }

    // Launch standalone game
    window.addEventListener('load', () => {
      window.game = new StandaloneGame();
    });
  </script>
</body>
</html>`;

    // Download standalone file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/\\s+/g, '-')}-standalone.html`;
    a.click();
    URL.revokeObjectURL(url);
    this.engine.log(`🚀 ĐÃ XUẤT GAME HOÀN CHỈNH THÀNH FILE ĐỘC LẬP: "${a.download}"! Bạn có thể gửi file này cho bạn bè hoặc upload lên itch.io/web!`, 'success');
  }
}

window.GameExporter = GameExporter;

