/**
 * NovaEngine 3D - Core 3D Engine Orchestrator
 * Master coordinator for 3D Actors, Three.js Rendering, Cannon.js Physics & Audio
 */
class NovaEngine3D {
  constructor() {
    this.projectName = 'Unreal Sci-Fi Arena 3D';
    this.version = '2.0.0 (Unreal 3D Edition)';

    // Subsystems
    this.sound = new SoundEngine();
    this.renderer3d = null;
    this.physics3d = null;
    this.particles3d = null;
    this.ui = null;

    // 3D State
    this.actors = [];
    this.selectedActor = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.playSnapshot = null;
    this.score = 0;

    // Loop & Stats
    this.fps = 60;
    this.fpsTimer = 0;
    this.framesCount = 0;
    this.lastTime = performance.now();

    // Input state
    this.keys = {};
    this.keysPressed = {};
    this.initInputs();
  }

  init(canvasElement) {
    this.renderer3d = new Renderer3D(canvasElement, this);
    this.physics3d = new Physics3D(this);
    this.particles3d = new ParticleSystem3D(this.renderer3d.scene);

    // Load initial 3D Adventure Template
    this.loadTemplate('adventure3d');

    // Start 3D Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  initInputs() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (!this.keys[e.code]) {
        this.keysPressed[e.code] = true;
      }
      this.keys[e.code] = true;

      // F5 = Play / Stop toggle
      if (e.key === 'F5') {
        e.preventDefault();
        if (this.isPlaying) this.stop();
        else this.play();
      }

      // F6 = Step 1 frame
      if (e.key === 'F6') {
        e.preventDefault();
        this.step();
      }

      // Delete = Delete selected Actor
      if (e.key === 'Delete' && this.selectedActor && !this.isPlaying) {
        this.deleteActor(this.selectedActor);
      }

      // Ctrl + D = Duplicate Actor
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && this.selectedActor && !this.isPlaying) {
        e.preventDefault();
        this.duplicateActor(this.selectedActor);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      this.keys[e.code] = false;
      this.keysPressed[e.code] = false;
    });
  }

  isKeyDown(code) {
    return !!this.keys[code];
  }

  isKeyPressed(code) {
    return !!this.keysPressed[code];
  }

  loadTemplate(key) {
    let tpl;
    if (key === 'adventure3d') tpl = EngineTemplates3D.createAdventure3D();
    else if (key === 'cyberpunk3d') tpl = EngineTemplates3D.createCyberpunk3D();
    else if (key === 'physics3d') tpl = EngineTemplates3D.createPhysicsPlayground3D();
    else tpl = { name: 'Dự Án 3D Trống', actors: [] };

    this.projectName = tpl.name;
    this.clearScene();

    this.actors = tpl.actors.map(data => Actor3D.deserialize(data));
    for (const actor of this.actors) {
      this.renderer3d.syncActorMesh(actor);
      this.physics3d.syncActorBody(actor);
    }

    this.selectedActor = this.actors.find(a => a.tag === 'player') || this.actors[0] || null;
    this.score = 0;

    if (this.selectedActor && this.renderer3d?.transformControls && this.renderer3d.meshMap) {
      const mesh = this.renderer3d.meshMap.get(this.selectedActor);
      if (mesh) {
        this.renderer3d.transformControls.attach(mesh);
      }
    }

    if (this.ui) {
      this.ui.refreshAll();
    }
  }

  clearScene() {
    if (this.physics3d) this.physics3d.clear();
    if (this.renderer3d) {
      for (const actor of this.actors) {
        this.renderer3d.removeActorMesh(actor);
      }
    }
    this.actors = [];
    this.selectedActor = null;
  }

  // Play Mode Controls
  play() {
    if (this.isPlaying && this.isPaused) {
      this.isPaused = false;
      this.log('▶ Tiếp tục trò chơi 3D (Resume)', 'info');
      return;
    }

    if (this.isPlaying) return;

    // Deep snapshot of all 3D actors before play
    this.playSnapshot = this.actors.map(a => a.snapshot());
    this.isPlaying = true;
    this.isPaused = false;
    this.score = 0;

    // Detach Gizmo during play mode
    if (this.renderer3d.transformControls) {
      this.renderer3d.transformControls.detach();
    }

    // Init sound
    this.sound.init();

    // Start actors runtime state
    for (const actor of this.actors) {
      actor._runtime.initialPosition = { ...actor.transform.position };
      actor._runtime.initialRotation = { ...actor.transform.rotation };
      actor._runtime.patrolStart = actor.transform.position.x;
      actor._runtime.patrolDir = 1;

      // Re-sync physics body
      this.physics3d.syncActorBody(actor);

      // Compile custom script
      if (actor.script && actor.script.trim()) {
        try {
          actor._runtime.customInstance = (new Function(`return { ${actor.script} };`))();
          if (actor._runtime.customInstance.onStart) {
            actor._runtime.customInstance.onStart(actor, this);
          }
        } catch (e) {
          this.log(`[Script onStart error in ${actor.name}]: ${e.message}`, 'error');
        }
      }
    }

    this.log('▶ BẮT ĐẦU CHƠI THỬ NGHIỆM 3D! (Dùng phím W/A/S/D để chạy, Space để nhảy)', 'success');
    if (this.ui) this.ui.updatePlayControls();
  }

  pause() {
    if (!this.isPlaying) return;
    this.isPaused = !this.isPaused;
    this.log(this.isPaused ? '⏸ Tạm dừng 3D (Paused)' : '▶ Tiếp tục 3D (Resumed)', 'info');
    if (this.ui) this.ui.updatePlayControls();
  }

  step() {
    if (!this.isPlaying) {
      this.play();
      this.isPaused = true;
    }
    this.isPaused = true;
    this.updateSimulation(1 / 60);
    this.log('⏭ Tiến 1 Frame (Step Debug)', 'info');
  }

  stop() {
    if (!this.isPlaying) return;

    this.isPlaying = false;
    this.isPaused = false;

    // Restore exact snapshot
    if (this.playSnapshot) {
      this.clearScene();
      this.actors = this.playSnapshot.map(data => Actor3D.deserialize(data));
      for (const actor of this.actors) {
        this.renderer3d.syncActorMesh(actor);
        this.physics3d.syncActorBody(actor);
      }
      this.playSnapshot = null;
    }

    this.particles3d.clear();
    this.selectedActor = this.actors.find(a => a.tag === 'player') || this.actors[0] || null;
    if (this.selectedActor && this.renderer3d) {
      this.renderer3d.syncActorMesh(this.selectedActor);
    }

    this.log('⏹ Dừng chơi 3D & Đã khôi phục trạng thái Scene ban đầu (Edit Mode Active)', 'info');
    if (this.ui) {
      this.ui.updatePlayControls();
      this.ui.refreshAll();
    }
  }

  // Main 3D Engine Loop
  loop(time) {
    const dt = Math.min(0.05, (time - this.lastTime) / 1000);
    this.lastTime = time;

    // Calculate FPS
    this.framesCount++;
    this.fpsTimer += dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.framesCount / this.fpsTimer);
      this.framesCount = 0;
      this.fpsTimer = 0;
      if (this.ui) this.ui.updateStats();
    }

    // Update Simulation in Play mode
    if (this.isPlaying && !this.isPaused) {
      this.updateSimulation(dt);
    }

    // Update Particles
    if (this.particles3d) {
      this.particles3d.update(dt);
    }

    // Render 3D Scene
    if (this.renderer3d) {
      this.renderer3d.render(dt);
    }

    // Clear one-frame pressed keys
    this.keysPressed = {};

    requestAnimationFrame((t) => this.loop(t));
  }

  updateSimulation(dt) {
    // 1. Update 3D Behaviors (Character Controller, Camera Follow, Rotate, Patrol)
    this.updateBehaviors(dt);

    // 2. Update Cannon.js 3D Physics
    if (this.physics3d) {
      this.physics3d.update(dt);
    }

    // 3. Update Three.js meshes from Actor transform
    for (const actor of this.actors) {
      if (actor._runtime.threeMesh) {
        actor._runtime.threeMesh.position.set(
          actor.transform.position.x,
          actor.transform.position.y,
          actor.transform.position.z
        );
        actor._runtime.threeMesh.rotation.set(
          EngineMath.degToRad(actor.transform.rotation.x),
          EngineMath.degToRad(actor.transform.rotation.y),
          EngineMath.degToRad(actor.transform.rotation.z)
        );
      }

      // Run custom script onUpdate
      if (actor._runtime.customInstance && actor._runtime.customInstance.onUpdate) {
        try {
          actor._runtime.customInstance.onUpdate(actor, dt, this);
        } catch (e) {
          this.log(`[Script error in ${actor.name}]: ${e.message}`, 'error');
        }
      }
    }
  }

  updateBehaviors(dt) {
    const cam = this.renderer3d.camera;

    for (const actor of this.actors) {
      if (!actor.visible) continue;

      // 1. Third-Person Character Controller 3D
      const charBeh = actor.getBehavior('characterController3D');
      if (charBeh) {
        const speed = charBeh.speed || 8.0;
        const jumpForce = charBeh.jumpForce || 9.0;

        // Get camera forward & right projected onto horizontal ground XZ
        const forward = new THREE.Vector3();
        cam.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        let moveDir = new THREE.Vector3();
        if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) moveDir.add(forward);
        if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) moveDir.addScaledVector(forward, -1);
        if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) moveDir.addScaledVector(right, -1);
        if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) moveDir.add(right);

        if (moveDir.lengthSq() > 0.001) {
          moveDir.normalize();

          // Smoothly rotate character to face movement direction
          const targetAngle = Math.atan2(moveDir.x, moveDir.z);
          actor.transform.rotation.y = EngineMath.radToDeg(targetAngle);

          // Apply velocity via Cannon body
          const body = actor._runtime.cannonBody;
          if (body) {
            body.velocity.x = moveDir.x * speed;
            body.velocity.z = moveDir.z * speed;
          } else {
            actor.transform.position.x += moveDir.x * speed * dt;
            actor.transform.position.z += moveDir.z * speed * dt;
          }
        } else {
          const body = actor._runtime.cannonBody;
          if (body) {
            body.velocity.x *= 0.85;
            body.velocity.z *= 0.85;
          }
        }

        // Jump
        if (this.isKeyPressed('Space')) {
          const body = actor._runtime.cannonBody;
          if (body && (actor.physics.grounded || Math.abs(body.velocity.y) < 0.2)) {
            body.velocity.y = jumpForce;
            this.sound.play('snd_jump');
            this.particles3d.jumpDust(actor.transform.position.x, actor.transform.position.y, actor.transform.position.z);
          }
        }
      }

      // 2. Third-Person Camera Follow 3D (Spring Arm)
      const camBeh = actor.getBehavior('cameraFollow3D');
      if (camBeh) {
        const dist = camBeh.distance || 7.0;
        const height = camBeh.height || 3.5;
        const targetPos = actor.transform.position;

        // Smoothly position camera behind character
        const currentCamPos = cam.position;
        const desiredCamPos = new THREE.Vector3(
          targetPos.x,
          targetPos.y + height,
          targetPos.z + dist
        );

        cam.position.lerp(desiredCamPos, 0.12);
        cam.lookAt(targetPos.x, targetPos.y + 1.2, targetPos.z);

        if (this.renderer3d.orbitControls) {
          this.renderer3d.orbitControls.target.set(targetPos.x, targetPos.y + 1.2, targetPos.z);
        }
      }

      // 3. Continuous 3D Rotation
      const rotBeh = actor.getBehavior('rotate3D');
      if (rotBeh) {
        actor.transform.rotation.x = (actor.transform.rotation.x + (rotBeh.speedX || 0) * dt) % 360;
        actor.transform.rotation.y = (actor.transform.rotation.y + (rotBeh.speedY || 90) * dt) % 360;
        actor.transform.rotation.z = (actor.transform.rotation.z + (rotBeh.speedZ || 0) * dt) % 360;
      }

      // 4. Patrol 3D
      const patBeh = actor.getBehavior('patrol3D');
      if (patBeh) {
        const dist = patBeh.distance || 6.0;
        const spd = patBeh.speed || 3.0;
        actor.transform.position.x += actor._runtime.patrolDir * spd * dt;
        if (Math.abs(actor.transform.position.x - actor._runtime.patrolStart) >= dist) {
          actor._runtime.patrolDir *= -1;
        }
      }
    }
  }

  // Handle 3D Collisions
  handleCollision3D(actorA, actorB) {
    // Check collectible
    this.checkCollectible3D(actorA, actorB);
    this.checkCollectible3D(actorB, actorA);

    // Call custom scripts onCollision
    if (actorA._runtime.customInstance && actorA._runtime.customInstance.onCollision) {
      actorA._runtime.customInstance.onCollision(actorA, actorB, this);
    }
    if (actorB._runtime.customInstance && actorB._runtime.customInstance.onCollision) {
      actorB._runtime.customInstance.onCollision(actorB, actorA, this);
    }
  }

  checkCollectible3D(player, gem) {
    if (gem.hasBehavior('collectible3D') && player.tag === 'player') {
      const col = gem.getBehavior('collectible3D');
      this.addScore(col.scoreValue || 50);
      this.sound.play(col.sound || 'snd_coin');
      this.particles3d.sparks(gem.transform.position.x, gem.transform.position.y, gem.transform.position.z, '#ffea00');
      this.deleteActor(gem);
      this.log(`🪙 Nhặt được ${gem.name}! (+${col.scoreValue || 50} điểm)`, 'success');
    }
  }

  // Actor Management API
  addActor(options = {}) {
    const actor = new Actor3D(options);
    this.actors.push(actor);
    this.renderer3d.syncActorMesh(actor);
    this.physics3d.syncActorBody(actor);
    this.selectActor(actor);
    if (this.ui) this.ui.refreshAll();
    return actor;
  }

  duplicateActor(actor) {
    if (!actor) return null;
    const cloned = actor.clone();
    this.actors.push(cloned);
    this.renderer3d.syncActorMesh(cloned);
    this.physics3d.syncActorBody(cloned);
    this.selectActor(cloned);
    if (this.ui) this.ui.refreshAll();
    return cloned;
  }

  deleteActor(actor) {
    if (!actor) return;
    const idx = this.actors.indexOf(actor);
    if (idx !== -1) {
      this.actors.splice(idx, 1);
      this.renderer3d.removeActorMesh(actor);
      this.physics3d.removeActorBody(actor);
      this.selectedActor = this.actors[Math.max(0, idx - 1)] || null;
      if (this.ui) this.ui.refreshAll();
    }
  }

  selectActor(actor) {
    this.selectedActor = actor;
    if (this.renderer3d?.transformControls && this.renderer3d.meshMap) {
      if (actor && !this.isPlaying) {
        const mesh = this.renderer3d.meshMap.get(actor);
        if (mesh) this.renderer3d.transformControls.attach(mesh);
      } else {
        this.renderer3d.transformControls.detach();
      }
    }
    if (this.ui) {
      this.ui.refreshAll();
    }
  }

  addScore(pts) {
    this.score += pts;
    if (this.ui) this.ui.updateStats();
  }

  log(msg, type = 'info') {
    if (this.ui) this.ui.log(msg, type);
    else console.log(`[${type}] ${msg}`);
  }
}

window.NovaEngine3D = NovaEngine3D;

