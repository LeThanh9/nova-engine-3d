/**
 * NovaEngine - Starter Game Templates
 * Ready-to-play full game templates with complete physics, art, sound, and level design
 */
const EngineTemplates = {
  // 1. Classic Platformer Game Template
  createPlatformer() {
    const project = {
      name: 'Super Pixel Platformer',
      version: '1.0.0',
      entities: [
        // Camera Follower Target (Player)
        {
          name: 'Hero Player',
          tag: 'player',
          x: 100,
          y: 200,
          width: 32,
          height: 32,
          shape: 'sprite',
          spriteId: 'spr_player',
          color: '#3b82f6',
          zIndex: 10,
          physics: {
            enabled: true,
            type: 'dynamic',
            mass: 1.0,
            friction: 0.25,
            restitution: 0.0,
            gravityScale: 1.0,
            isTrigger: false,
            colliderType: 'box',
            colliderWidth: 24,
            colliderHeight: 30
          },
          behaviors: [
            { type: 'platformer', speed: 230, jumpForce: 460, doubleJump: true },
            { type: 'health', maxHp: 3, currentHp: 3 },
            { type: 'cameraFollow', smooth: 0.1 }
          ]
        },

        // Ground Platform
        {
          name: 'Main Ground',
          tag: 'solid',
          x: 400,
          y: 400,
          width: 900,
          height: 48,
          shape: 'sprite',
          spriteId: 'spr_grass_block',
          color: '#10b981',
          zIndex: 1,
          physics: {
            enabled: true,
            type: 'static',
            friction: 0.5
          }
        },

        // Floating Platforms
        {
          name: 'Platform 1',
          tag: 'solid',
          x: 250,
          y: 280,
          width: 120,
          height: 24,
          shape: 'sprite',
          spriteId: 'spr_grass_block',
          color: '#10b981',
          zIndex: 1,
          physics: { enabled: true, type: 'static' }
        },
        {
          name: 'Platform 2 (High)',
          tag: 'solid',
          x: 440,
          y: 190,
          width: 140,
          height: 24,
          shape: 'sprite',
          spriteId: 'spr_grass_block',
          color: '#10b981',
          zIndex: 1,
          physics: { enabled: true, type: 'static' }
        },
        {
          name: 'Platform 3',
          tag: 'solid',
          x: 650,
          y: 270,
          width: 130,
          height: 24,
          shape: 'sprite',
          spriteId: 'spr_grass_block',
          color: '#10b981',
          zIndex: 1,
          physics: { enabled: true, type: 'static' }
        },

        // Slime Patrol Enemy
        {
          name: 'Slime Enemy',
          tag: 'enemy',
          x: 450,
          y: 155,
          width: 28,
          height: 24,
          shape: 'sprite',
          spriteId: 'spr_slime',
          color: '#00e436',
          zIndex: 5,
          physics: {
            enabled: true,
            type: 'kinematic'
          },
          behaviors: [
            { type: 'patrol', distance: 50, speed: 60, axis: 'x' },
            { type: 'hazard', damage: 1, sound: 'snd_hit' }
          ]
        },

        // Spikes on ground
        {
          name: 'Floor Spikes',
          tag: 'hazard',
          x: 350,
          y: 366,
          width: 48,
          height: 20,
          shape: 'sprite',
          spriteId: 'spr_spike',
          color: '#ef4444',
          zIndex: 2,
          physics: { enabled: true, isTrigger: true },
          behaviors: [
            { type: 'hazard', damage: 1, sound: 'snd_hit' }
          ]
        },

        // Collectible Golden Coins
        {
          name: 'Coin 1',
          tag: 'coin',
          x: 250,
          y: 230,
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
        },
        {
          name: 'Coin 2',
          tag: 'coin',
          x: 440,
          y: 140,
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
        },
        {
          name: 'Coin 3',
          tag: 'coin',
          x: 650,
          y: 220,
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
        },

        // Goal Trophy / Victory Flag
        {
          name: 'Victory Portal',
          tag: 'goal',
          x: 780,
          y: 330,
          width: 36,
          height: 50,
          shape: 'rect',
          color: '#f59e0b',
          zIndex: 3,
          physics: { enabled: true, isTrigger: true },
          script: `
            onCollision(entity, other, engine) {
              if (other.tag === 'player') {
                engine.sound.play('snd_victory');
                engine.particles.burst(entity.x, entity.y, '#f59e0b', 40);
                engine.particles.burst(entity.x, entity.y, '#00f0ff', 40);
                engine.log('🎉 XUẤT SẮC! BẠN ĐÃ VỀ ĐÍCH CHIẾN THẮNG!', 'success');
              }
            }
          `
        },

        // Level Tutorial Signs
        {
          name: 'Tutorial Sign',
          tag: 'ui',
          x: 100,
          y: 340,
          shape: 'text',
          text: 'Phím A/D: Di chuyển | Space: Nhảy đôi',
          fontSize: 14,
          fontColor: '#94a3b8',
          zIndex: 10,
          physics: { enabled: false }
        }
      ]
    };
    return project;
  },

  // 2. Space Shooter Template
  createSpaceShooter() {
    const project = {
      name: 'Galaxy Defender',
      version: '1.0.0',
      entities: [
        {
          name: 'Starship',
          tag: 'player',
          x: 400,
          y: 500,
          width: 36,
          height: 40,
          shape: 'rect',
          color: '#00f0ff',
          zIndex: 10,
          physics: { enabled: false },
          behaviors: [
            { type: 'topdown', speed: 280 }
          ],
          script: `
            onStart(entity, engine) {
              this.cooldown = 0;
            }
            onUpdate(entity, dt, engine) {
              this.cooldown -= dt;
              // Shoot with Space or Mouse Click
              if ((engine.isKeyPressed('Space') || engine.isMouseDown()) && this.cooldown <= 0) {
                this.cooldown = 0.18;
                engine.sound.play('snd_laser');
                // Spawn laser bullet
                engine.spawnEntity({
                  name: 'Laser',
                  tag: 'bullet',
                  x: entity.x,
                  y: entity.y - 20,
                  width: 6,
                  height: 16,
                  shape: 'rect',
                  color: '#ff007f',
                  zIndex: 8,
                  physics: { enabled: false },
                  behaviors: [
                    { type: 'bullet', speed: 600, dirX: 0, dirY: -1, lifetime: 2.0 }
                  ]
                });
                engine.particles.sparkles(entity.x, entity.y + 15, '#00f0ff');
              }
            }
          `
        },
        // Alien Invader 1
        {
          name: 'Alien Invader 1',
          tag: 'enemy',
          x: 300,
          y: 120,
          width: 36,
          height: 32,
          shape: 'rect',
          color: '#ef4444',
          zIndex: 5,
          physics: { enabled: false },
          behaviors: [
            { type: 'patrol', distance: 100, speed: 90, axis: 'x' }
          ],
          script: `
            onCollision(entity, other, engine) {
              if (other.tag === 'bullet') {
                engine.addScore(50);
                engine.sound.play('snd_explosion');
                engine.particles.explosion(entity.x, entity.y);
                engine.destroyEntity(other.id);
                engine.destroyEntity(entity.id);
              }
            }
          `
        },
        // Alien Invader 2
        {
          name: 'Alien Invader 2',
          tag: 'enemy',
          x: 500,
          y: 120,
          width: 36,
          height: 32,
          shape: 'rect',
          color: '#ef4444',
          zIndex: 5,
          physics: { enabled: false },
          behaviors: [
            { type: 'patrol', distance: 120, speed: 110, axis: 'x' }
          ],
          script: `
            onCollision(entity, other, engine) {
              if (other.tag === 'bullet') {
                engine.addScore(50);
                engine.sound.play('snd_explosion');
                engine.particles.explosion(entity.x, entity.y);
                engine.destroyEntity(other.id);
                engine.destroyEntity(entity.id);
              }
            }
          `
        },
        // Info text
        {
          name: 'Instructions',
          tag: 'ui',
          x: 400,
          y: 560,
          shape: 'text',
          text: 'WASD / Mũi tên để bay | Phím Space / Click để bắn Laser',
          fontSize: 14,
          fontColor: '#94a3b8',
          zIndex: 10,
          physics: { enabled: false }
        }
      ]
    };
    return project;
  },

  // 3. Physics & Bouncy Playground Template
  createPhysicsToy() {
    const project = {
      name: 'Physics Playground',
      version: '1.0.0',
      entities: [
        // Bouncy Ball
        {
          name: 'Bouncy Super Ball',
          tag: 'toy',
          x: 200,
          y: 80,
          width: 36,
          height: 36,
          shape: 'circle',
          color: '#f59e0b',
          zIndex: 5,
          physics: {
            enabled: true,
            type: 'dynamic',
            restitution: 0.85,
            friction: 0.1,
            mass: 1.0,
            gravityScale: 1.0
          }
        },
        // Heavy Metal Crate
        {
          name: 'Heavy Box',
          tag: 'toy',
          x: 320,
          y: 150,
          width: 44,
          height: 44,
          shape: 'rect',
          color: '#6366f1',
          zIndex: 5,
          physics: {
            enabled: true,
            type: 'dynamic',
            restitution: 0.2,
            friction: 0.4,
            mass: 3.0
          }
        },
        // Sloped Ramp
        {
          name: 'Funnel Left',
          tag: 'solid',
          x: 180,
          y: 280,
          width: 200,
          height: 20,
          rotation: 25,
          shape: 'rect',
          color: '#334155',
          zIndex: 2,
          physics: { enabled: true, type: 'static' }
        },
        {
          name: 'Funnel Right',
          tag: 'solid',
          x: 360,
          y: 350,
          width: 220,
          height: 20,
          rotation: -20,
          shape: 'rect',
          color: '#334155',
          zIndex: 2,
          physics: { enabled: true, type: 'static' }
        },
        // Trampoline Bouncer
        {
          name: 'Trampoline Bed',
          tag: 'solid',
          x: 260,
          y: 460,
          width: 140,
          height: 16,
          shape: 'rect',
          color: '#ec4899',
          zIndex: 2,
          physics: {
            enabled: true,
            type: 'static',
            restitution: 1.2 // super bounce!
          }
        },
        // Ground
        {
          name: 'Floor',
          tag: 'solid',
          x: 300,
          y: 520,
          width: 600,
          height: 30,
          shape: 'rect',
          color: '#1e293b',
          zIndex: 1,
          physics: { enabled: true, type: 'static' }
        }
      ]
    };
    return project;
  },

  // 4. Blank Project
  createBlank() {
    return {
      name: 'Dự Án Mới',
      version: '1.0.0',
      entities: []
    };
  }
};

window.EngineTemplates = EngineTemplates;

