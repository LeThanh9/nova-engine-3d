/**
 * NovaEngine - 2D Physics Engine
 * Lightweight, rock-solid AABB/Circle impulse & trigger physics
 */
class PhysicsEngine {
  constructor() {
    this.gravity = 980; // pixels / s^2 (natural arcade gravity)
    this.maxVelocity = 1500;
  }

  update(entities, dt, collisionCallback) {
    if (dt > 0.05) dt = 0.05; // clamp delta time for stability

    const dynamicEntities = [];
    const colliders = [];

    // Filter active physics entities
    for (let i = 0; i < entities.length; i++) {
      const e = entities[i];
      if (!e.visible || !e.physics.enabled) continue;

      colliders.push(e);

      if (e.physics.type === 'dynamic') {
        dynamicEntities.push(e);

        // Apply Gravity
        e.physics.vy += this.gravity * e.physics.gravityScale * dt;

        // Apply Friction / Air Resistance
        e.physics.vx *= Math.pow(1 - e.physics.friction * 0.1, dt * 60);

        // Clamp max speed
        e.physics.vx = EngineMath.clamp(e.physics.vx, -this.maxVelocity, this.maxVelocity);
        e.physics.vy = EngineMath.clamp(e.physics.vy, -this.maxVelocity, this.maxVelocity);

        // Track grounded state
        e.physics.wasGrounded = e.physics.grounded;
        e.physics.grounded = false;

        // Move horizontally
        e.x += e.physics.vx * dt;
      }
    }

    // Resolve horizontal collisions
    for (let i = 0; i < dynamicEntities.length; i++) {
      const a = dynamicEntities[i];
      const boxA = a.getColliderBounds();

      for (let j = 0; j < colliders.length; j++) {
        const b = colliders[j];
        if (a === b) continue;

        const boxB = b.getColliderBounds();
        if (this.checkOverlap(boxA, boxB)) {
          // If either is a trigger, fire event and don't resolve physically
          if (a.physics.isTrigger || b.physics.isTrigger) {
            if (collisionCallback) collisionCallback(a, b);
            continue;
          }

          if (b.physics.type === 'static' || b.physics.type === 'kinematic') {
            const overlapX = (boxA.width / 2 + boxB.width / 2) - Math.abs(boxA.x + boxA.width / 2 - (boxB.x + boxB.width / 2));
            if (overlapX > 0) {
              if (boxA.x < boxB.x) {
                a.x -= overlapX;
              } else {
                a.x += overlapX;
              }
              a.physics.vx = 0;
            }
          }
          if (collisionCallback) collisionCallback(a, b);
        }
      }
    }

    // Move vertically
    for (let i = 0; i < dynamicEntities.length; i++) {
      const a = dynamicEntities[i];
      a.y += a.physics.vy * dt;
    }

    // Resolve vertical collisions
    for (let i = 0; i < dynamicEntities.length; i++) {
      const a = dynamicEntities[i];
      const boxA = a.getColliderBounds();

      for (let j = 0; j < colliders.length; j++) {
        const b = colliders[j];
        if (a === b) continue;

        const boxB = b.getColliderBounds();
        if (this.checkOverlap(boxA, boxB)) {
          if (a.physics.isTrigger || b.physics.isTrigger) {
            if (collisionCallback) collisionCallback(a, b);
            continue;
          }

          if (b.physics.type === 'static' || b.physics.type === 'kinematic') {
            const overlapY = (boxA.height / 2 + boxB.height / 2) - Math.abs(boxA.y + boxA.height / 2 - (boxB.y + boxB.height / 2));
            if (overlapY > 0) {
              if (boxA.y < boxB.y) {
                // Landing on top of platform
                a.y -= overlapY;
                if (a.physics.vy > 0) {
                  // Bounce if restitution is present
                  if (a.physics.restitution > 0.1) {
                    a.physics.vy = -a.physics.vy * a.physics.restitution;
                  } else {
                    a.physics.vy = 0;
                  }
                  a.physics.grounded = true;
                  a.physics.jumpCount = 0;
                }
              } else {
                // Hitting head from below
                a.y += overlapY;
                if (a.physics.vy < 0) {
                  a.physics.vy = 0;
                }
              }
            }
          }
          if (collisionCallback) collisionCallback(a, b);
        }
      }
    }
  }

  checkOverlap(r1, r2) {
    return (
      r1.left < r2.right &&
      r1.right > r2.left &&
      r1.top < r2.bottom &&
      r1.bottom > r2.top
    );
  }
}

window.PhysicsEngine = PhysicsEngine;

