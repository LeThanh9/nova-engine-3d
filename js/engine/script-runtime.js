/**
 * NovaEngine - Script & Behavior Runtime Engine
 * Handles built-in behaviors (Platformer, TopDown, Patrol, Collectible, etc.)
 * and user custom JavaScript scripts with error handling and console output
 */
class ScriptRuntime {
  constructor(engine) {
    this.engine = engine;
    this.keyState = {};
    this.keyPressedState = {};
    this.mouseState = {
      x: 0,
      y: 0,
      worldX: 0,
      worldY: 0,
      isDown: false,
      wasDown: false
    };

    this.compiledScripts = new Map();
    this.initInputListeners();
  }

  initInputListeners() {
    window.addEventListener('keydown', (e) => {
      // Don't capture inputs if user is typing in code editor or text fields
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (!this.keyState[e.code]) {
        this.keyPressedState[e.code] = true;
      }
      this.keyState[e.code] = true;

      // Prevent page scrolling on Space/Arrow keys during Play mode
      if (this.engine.isPlaying && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      this.keyState[e.code] = false;
      this.keyPressedState[e.code] = false;
    });
  }

  clearFrameInputs() {
    this.keyPressedState = {};
    this.mouseState.wasDown = this.mouseState.isDown;
  }

  isKeyDown(code) {
    return !!this.keyState[code];
  }

  isKeyPressed(code) {
    return !!this.keyPressedState[code];
  }

  // Compile user custom script
  compileScript(scriptCode) {
    if (!scriptCode || !scriptCode.trim()) return null;
    try {
      // Wrap script code into an object with lifecycle hooks
      const factory = new Function(`
        return {
          ${scriptCode}
        };
      `);
      return factory();
    } catch (err) {
      if (this.engine.ui) {
        this.engine.ui.log(`[Script Error] ${err.message}`, 'error');
      }
      return null;
    }
  }

  // Initialize all entities when entering Play mode
  onStart(entities) {
    this.compiledScripts.clear();

    for (let i = 0; i < entities.length; i++) {
      const ent = entities[i];
      ent._runtime.initialX = ent.x;
      ent._runtime.initialY = ent.y;
      ent._runtime.patrolStart = ent.x;
      ent._runtime.patrolDir = 1;
      ent._runtime.invulnerableTimer = 0;
      ent._runtime.spawnerTimer = 0;

      // Reset physics
      ent.physics.vx = 0;
      ent.physics.vy = 0;
      ent.physics.grounded = false;
      ent.physics.jumpCount = 0;

      // Health behavior init
      const hpBeh = ent.getBehavior('health');
      if (hpBeh) {
        ent.customData.hp = hpBeh.maxHp || 3;
        ent.customData.maxHp = hpBeh.maxHp || 3;
      }

      // Compile custom script if any
      if (ent.script) {
        const instance = this.compileScript(ent.script);
        if (instance) {
          ent._runtime.customInstance = instance;
          if (typeof instance.onStart === 'function') {
            try {
              instance.onStart.call(instance, ent, this.engine);
            } catch (e) {
              this.engine.log(`[Script onStart error in ${ent.name}]: ${e.message}`, 'error');
            }
          }
        }
      }
    }
  }

  // Frame update
  update(entities, dt) {
    for (let i = 0; i < entities.length; i++) {
      const ent = entities[i];
      if (!ent.visible) continue;

      // Update Invulnerability
      if (ent._runtime.invulnerableTimer > 0) {
        ent._runtime.invulnerableTimer -= dt;
      }

      // Update Animation frame
      if (ent.shape === 'sprite' && ent.spriteId) {
        const spr = this.engine.getSpriteAsset(ent.spriteId);
        if (spr && spr.frames && spr.frames.length > 1) {
          ent.anim.timer += dt;
          const frameDuration = 1 / (ent.anim.fps || 8);
          if (ent.anim.timer >= frameDuration) {
            ent.anim.timer = 0;
            ent.anim.frame = (ent.anim.frame + 1) % spr.frames.length;
          }
        }
      }

      // 1. Process Built-in Behaviors
      for (let b = 0; b < ent.behaviors.length; b++) {
        const beh = ent.behaviors[b];
        this.runBehavior(ent, beh, dt);
      }

      // 2. Process Custom Script onUpdate
      if (ent._runtime.customInstance && typeof ent._runtime.customInstance.onUpdate === 'function') {
        try {
          ent._runtime.customInstance.onUpdate.call(ent._runtime.customInstance, ent, dt, this.engine);
        } catch (e) {
          this.engine.log(`[Script error in ${ent.name}]: ${e.message}`, 'error');
        }
      }
    }

    this.clearFrameInputs();
  }

  // Built-in behavior runners
  runBehavior(ent, beh, dt) {
    switch (beh.type) {
      case 'platformer': {
        const speed = beh.speed || 220;
        const jumpForce = beh.jumpForce || 420;
        let moveX = 0;

        if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) moveX -= 1;
        if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) moveX += 1;

        ent.physics.vx = moveX * speed;
        if (moveX !== 0) {
          ent.scaleX = moveX > 0 ? Math.abs(ent.scaleX) : -Math.abs(ent.scaleX);
        }

        // Jump
        const wantJump = this.isKeyPressed('Space') || this.isKeyPressed('KeyW') || this.isKeyPressed('ArrowUp');
        if (wantJump) {
          if (ent.physics.grounded) {
            ent.physics.vy = -jumpForce;
            ent.physics.grounded = false;
            ent.physics.jumpCount = 1;
            this.engine.sound.play('snd_jump');
            this.engine.particles.jumpDust(ent.x, ent.y + ent.height / 2);
          } else if (beh.doubleJump && ent.physics.jumpCount === 1) {
            ent.physics.vy = -jumpForce * 0.9;
            ent.physics.jumpCount = 2;
            this.engine.sound.play('snd_jump');
            this.engine.particles.jumpDust(ent.x, ent.y + ent.height / 2);
          }
        }
        break;
      }

      case 'topdown': {
        const speed = beh.speed || 200;
        let mx = 0;
        let my = 0;
        if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) mx -= 1;
        if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) mx += 1;
        if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) my -= 1;
        if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) my += 1;

        if (mx !== 0 && my !== 0) {
          mx *= 0.7071;
          my *= 0.7071;
        }

        if (ent.physics.enabled) {
          ent.physics.vx = mx * speed;
          ent.physics.vy = my * speed;
        } else {
          ent.x += mx * speed * dt;
          ent.y += my * speed * dt;
        }

        if (beh.rotateToMovement && (mx !== 0 || my !== 0)) {
          ent.rotation = EngineMath.radToDeg(Math.atan2(my, mx));
        }
        break;
      }

      case 'patrol': {
        const dist = beh.distance || 120;
        const speed = beh.speed || 80;
        const axis = beh.axis || 'x';

        if (axis === 'x') {
          ent.x += ent._runtime.patrolDir * speed * dt;
          if (Math.abs(ent.x - ent._runtime.patrolStart) >= dist) {
            ent._runtime.patrolDir *= -1;
            ent.scaleX = -ent.scaleX;
          }
        } else {
          ent.y += ent._runtime.patrolDir * speed * dt;
          if (Math.abs(ent.y - ent._runtime.patrolStart) >= dist) {
            ent._runtime.patrolDir *= -1;
          }
        }
        break;
      }

      case 'rotate': {
        const rotSpeed = beh.speed || 90;
        ent.rotation = (ent.rotation + rotSpeed * dt) % 360;
        break;
      }

      case 'bullet': {
        const spd = beh.speed || 400;
        const dx = beh.dirX !== undefined ? beh.dirX : 1;
        const dy = beh.dirY !== undefined ? beh.dirY : 0;
        ent.x += dx * spd * dt;
        ent.y += dy * spd * dt;

        beh._life = (beh._life || 0) + dt;
        if (beh._life >= (beh.lifetime || 3.0)) {
          this.engine.destroyEntity(ent.id);
        }
        break;
      }

      case 'cameraFollow': {
        if (this.engine.renderer) {
          const smooth = beh.smooth || 0.1;
          this.engine.renderer.camera.targetX = ent.x + (beh.offsetX || 0);
          this.engine.renderer.camera.targetY = ent.y + (beh.offsetY || 0);
        }
        break;
      }

      case 'spawner': {
        ent._runtime.spawnerTimer += dt;
        const interval = beh.interval || 2.0;
        if (ent._runtime.spawnerTimer >= interval) {
          ent._runtime.spawnerTimer = 0;
          if (beh.prefabTag) {
            this.engine.spawnFromPrefab(beh.prefabTag, ent.x, ent.y);
          }
        }
        break;
      }
    }
  }

  // Handle Collisions
  handleCollision(a, b) {
    // 1. Collectible behavior
    this.checkCollectible(a, b);
    this.checkCollectible(b, a);

    // 2. Hazard behavior
    this.checkHazard(a, b);
    this.checkHazard(b, a);

    // 3. Custom scripts onCollision
    if (a._runtime.customInstance && typeof a._runtime.customInstance.onCollision === 'function') {
      try {
        a._runtime.customInstance.onCollision.call(a._runtime.customInstance, a, b, this.engine);
      } catch (e) {
        this.engine.log(`[Collision script error in ${a.name}]: ${e.message}`, 'error');
      }
    }
    if (b._runtime.customInstance && typeof b._runtime.customInstance.onCollision === 'function') {
      try {
        b._runtime.customInstance.onCollision.call(b._runtime.customInstance, b, a, this.engine);
      } catch (e) {
        this.engine.log(`[Collision script error in ${b.name}]: ${e.message}`, 'error');
      }
    }
  }

  checkCollectible(collector, item) {
    if (item.hasBehavior('collectible') && (collector.tag === 'player' || collector.hasBehavior('platformer') || collector.hasBehavior('topdown'))) {
      const colBeh = item.getBehavior('collectible');
      this.engine.addScore(colBeh.scoreValue || 10);
      this.engine.sound.play(colBeh.sound || 'snd_coin');
      this.engine.particles.sparkles(item.x, item.y, '#ffec27');

      if (colBeh.destroyOnPickup !== false) {
        this.engine.destroyEntity(item.id);
      }
    }
  }

  checkHazard(victim, hazard) {
    if (hazard.hasBehavior('hazard') && victim.hasBehavior('platformer')) {
      if (victim._runtime.invulnerableTimer > 0) return;

      const hazBeh = hazard.getBehavior('hazard');
      const damage = hazBeh.damage || 1;

      // Take damage
      const hpBeh = victim.getBehavior('health');
      if (hpBeh) {
        victim.customData.hp = (victim.customData.hp || hpBeh.maxHp) - damage;
        victim._runtime.invulnerableTimer = 1.0; // 1s iframe

        this.engine.sound.play(hazBeh.sound || 'snd_hit');
        this.engine.renderer.shake(12, 0.3);
        this.engine.particles.burst(victim.x, victim.y, '#ef4444', 12);

        // Knockback
        victim.physics.vy = -300;
        victim.physics.vx = (victim.x < hazard.x ? -200 : 200);

        if (victim.customData.hp <= 0) {
          this.engine.log(`💀 Nhân vật ${victim.name} đã hết máu!`, 'warn');
          this.engine.sound.play('snd_explosion');
          this.engine.particles.explosion(victim.x, victim.y);
          // Respawn or reset
          victim.x = victim._runtime.initialX;
          victim.y = victim._runtime.initialY;
          victim.physics.vx = 0;
          victim.physics.vy = 0;
          victim.customData.hp = hpBeh.maxHp;
        }
      }
    }
  }
}

window.ScriptRuntime = ScriptRuntime;

