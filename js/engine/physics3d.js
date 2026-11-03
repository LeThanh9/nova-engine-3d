/**
 * NovaEngine 3D - 3D Physics Engine (Cannon.js integration)
 * Handles 3D rigid bodies, gravity, restitution, friction, triggers & collision detection
 */
class Physics3D {
  constructor(engine) {
    this.engine = engine;
    this.world = null;
    this.actorBodyMap = new Map();
    this.bodyActorMap = new Map();
    this.initWorld();
  }

  initWorld() {
    if (typeof CANNON === 'undefined') {
      console.warn('CANNON.js is not loaded yet');
      return;
    }

    this.world = new CANNON.World();
    this.world.gravity.set(0, -18, 0); // Natural game gravity
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.solver.iterations = 10;
    this.world.defaultContactMaterial.contactEquationStiffness = 1e7;
    this.world.defaultContactMaterial.contactEquationRelaxation = 3;

    // Listen to collision events
    this.world.addEventListener('postStep', () => {
      // Process custom collisions if needed
    });
  }

  // Create or update Cannon.js Body for an Actor3D
  syncActorBody(actor) {
    if (!this.world || !actor.physics.enabled) {
      this.removeActorBody(actor);
      return;
    }

    let body = this.actorBodyMap.get(actor);
    const pos = actor.transform.position;
    const rot = actor.transform.rotation;
    const scale = actor.transform.scale;

    if (!body) {
      let shape;
      const dims = actor.dimensions;

      switch (actor.shape) {
        case 'box':
          shape = new CANNON.Box(new CANNON.Vec3(
            (dims.width * Math.abs(scale.x)) / 2,
            (dims.height * Math.abs(scale.y)) / 2,
            (dims.depth * Math.abs(scale.z)) / 2
          ));
          break;

        case 'sphere':
          shape = new CANNON.Sphere((dims.radius || 1) * Math.abs(scale.x));
          break;

        case 'cylinder':
          shape = new CANNON.Cylinder(
            dims.radiusTop * Math.abs(scale.x),
            dims.radiusBottom * Math.abs(scale.x),
            dims.height * Math.abs(scale.y),
            16
          );
          break;

        case 'character':
          shape = new CANNON.Cylinder(0.5 * Math.abs(scale.x), 0.5 * Math.abs(scale.x), 1.8 * Math.abs(scale.y), 12);
          break;

        case 'capsule':
          // Approximate capsule with sphere or box
          shape = new CANNON.Sphere(dims.radius * Math.abs(scale.x));
          break;

        case 'plane':
          shape = new CANNON.Plane();
          break;

        default:
          shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
          break;
      }

      const mass = actor.physics.type === 'dynamic' ? (actor.physics.mass || 1.0) : 0;
      body = new CANNON.Body({
        mass: mass,
        shape: shape,
        linearDamping: actor.physics.linearDamping || 0.05,
        angularDamping: actor.physics.angularDamping || 0.05
      });

      // Prevent player character from tumbling over
      if (actor.shape === 'character') {
        body.fixedRotation = true;
        body.updateMassProperties();
      }

      // Material bounciness
      body.material = new CANNON.Material({
        friction: actor.physics.friction ?? 0.3,
        restitution: actor.physics.restitution ?? 0.2
      });

      if (actor.shape === 'plane') {
        // Cannon Plane faces +Z, rotate -90 deg on X to face +Y up
        body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
      }

      // Collide listener
      body.addEventListener('collide', (e) => {
        const otherActor = this.bodyActorMap.get(e.body);
        if (otherActor && this.engine) {
          this.engine.handleCollision3D(actor, otherActor);
        }
      });

      this.world.addBody(body);
      this.actorBodyMap.set(actor, body);
      this.bodyActorMap.set(body, actor);
      actor._runtime.cannonBody = body;
    }

    // Update body state
    body.position.set(pos.x, pos.y, pos.z);
    if (actor.shape !== 'plane') {
      const q = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          EngineMath.degToRad(rot.x),
          EngineMath.degToRad(rot.y),
          EngineMath.degToRad(rot.z)
        )
      );
      body.quaternion.set(q.x, q.y, q.z, q.w);
    }

    body.mass = actor.physics.type === 'dynamic' ? (actor.physics.mass || 1.0) : 0;
    body.type = actor.physics.type === 'dynamic' ? CANNON.Body.DYNAMIC : CANNON.Body.STATIC;
    body.updateMassProperties();
  }

  removeActorBody(actor) {
    const body = this.actorBodyMap.get(actor);
    if (body) {
      this.world.removeBody(body);
      this.actorBodyMap.delete(actor);
      this.bodyActorMap.delete(body);
      actor._runtime.cannonBody = null;
    }
  }

  update(dt) {
    if (!this.world) return;
    if (dt > 0.05) dt = 0.05;

    // Step physics
    this.world.step(dt);

    // Sync Cannon bodies back to Actor3D and Three.js
    for (const [actor, body] of this.actorBodyMap.entries()) {
      if (actor.physics.type === 'dynamic' && actor.visible) {
        actor.transform.position.x = body.position.x;
        actor.transform.position.y = body.position.y;
        actor.transform.position.z = body.position.z;

        if (actor.shape !== 'plane') {
          const euler = new THREE.Euler().setFromQuaternion(
            new THREE.Quaternion(body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w)
          );
          actor.transform.rotation.x = EngineMath.radToDeg(euler.x);
          actor.transform.rotation.y = EngineMath.radToDeg(euler.y);
          actor.transform.rotation.z = EngineMath.radToDeg(euler.z);
        }

        // Ground check: if vy is close to 0 and y position is supported
        actor.physics.grounded = Math.abs(body.velocity.y) < 0.15;
      }
    }
  }

  clear() {
    if (!this.world) return;
    for (const body of this.actorBodyMap.values()) {
      this.world.removeBody(body);
    }
    this.actorBodyMap.clear();
    this.bodyActorMap.clear();
  }
}

window.Physics3D = Physics3D;

