/**
 * NovaEngine 3D - Actor 3D & Component Architecture
 * Unreal Engine 4-inspired Actor model with PBR Materials, Physics & 3D Shapes
 */
class Actor3D {
  constructor(options = {}) {
    this.id = options.id || EngineMath.generateId('actor');
    this.name = options.name || 'StaticMeshActor';
    this.tag = options.tag || 'untagged';
    this.visible = options.visible !== undefined ? options.visible : true;
    this.locked = options.locked || false;

    // 3D Transform (supports both flat { x, y, z } and nested { transform: { position: { x, y, z } } })
    const trans = options.transform || {};
    const pos = trans.position || options.position || {};
    const rot = trans.rotation || options.rotation || {};
    const scl = trans.scale || options.scale || {};

    this.transform = {
      position: {
        x: pos.x ?? options.x ?? 0,
        y: pos.y ?? options.y ?? 0,
        z: pos.z ?? options.z ?? 0
      },
      rotation: {
        x: rot.x ?? 0,
        y: rot.y ?? 0,
        z: rot.z ?? 0
      }, // Degrees
      scale: {
        x: scl.x ?? 1,
        y: scl.y ?? 1,
        z: scl.z ?? 1
      }
    };

    // 3D Geometry Dimensions
    this.shape = options.shape || 'box'; // 'box', 'sphere', 'cylinder', 'capsule', 'cone', 'torus', 'plane', 'light', 'particle', 'character'
    const dims = options.dimensions || {};
    this.dimensions = {
      width: dims.width ?? options.width ?? 2,
      height: dims.height ?? options.height ?? 2,
      depth: dims.depth ?? options.depth ?? 2,
      radius: dims.radius ?? options.radius ?? 1,
      radiusTop: dims.radiusTop ?? options.radiusTop ?? 1,
      radiusBottom: dims.radiusBottom ?? options.radiusBottom ?? 1,
      radialSegments: dims.radialSegments ?? 32
    };

    // Unreal Engine 4 PBR Material Properties
    const mat = options.material || {};
    this.material = {
      color: mat.color || options.color || '#3b82f6',
      metalness: mat.metalness ?? options.metalness ?? 0.2,
      roughness: mat.roughness ?? options.roughness ?? 0.5,
      emissive: mat.emissive || options.emissive || '#000000',
      emissiveIntensity: mat.emissiveIntensity ?? options.emissiveIntensity ?? 0.0,
      wireframe: mat.wireframe ?? options.wireframe ?? false,
      opacity: mat.opacity ?? options.opacity ?? 1.0,
      transparent: mat.transparent ?? options.transparent ?? false,
      castShadow: mat.castShadow ?? true,
      receiveShadow: mat.receiveShadow ?? true,
      textureType: mat.textureType || null // 'scifi_hex', 'metal_plate', 'grid_circuit'
    };

    // 3D Physics (Cannon.js integration)
    const p = options.physics || {};
    this.physics = {
      enabled: p.enabled ?? false,
      type: p.type || 'static', // 'static', 'dynamic', 'kinematic'
      mass: p.mass ?? 1.0,
      friction: p.friction ?? 0.3,
      restitution: p.restitution ?? 0.2, // bounciness
      isTrigger: p.isTrigger ?? false,
      linearDamping: p.linearDamping ?? 0.05,
      angularDamping: p.angularDamping ?? 0.05,
      // Runtime physics state
      vx: 0, vy: 0, vz: 0,
      grounded: false
    };

    // Light component (if Actor is a light)
    if (this.shape === 'light' || options.light) {
      const l = options.light || {};
      this.light = {
        type: l.type || 'point', // 'directional', 'point', 'spot'
        color: l.color || '#ffffff',
        intensity: l.intensity ?? 1.5,
        distance: l.distance ?? 25,
        angle: l.angle ?? Math.PI / 4,
        penumbra: l.penumbra ?? 0.2,
        castShadow: l.castShadow ?? true
      };
    } else {
      this.light = null;
    }

    // Particle 3D component (if Actor is particle emitter)
    if (this.shape === 'particle' || options.particle) {
      const part = options.particle || {};
      this.particle = {
        type: part.type || 'fire', // 'fire', 'sparks', 'portal', 'smoke'
        rate: part.rate ?? 30,
        speed: part.speed ?? 4,
        color: part.color || '#f59e0b',
        endColor: part.endColor || '#ef4444',
        lifetime: part.lifetime ?? 1.2,
        size: part.size ?? 0.2
      };
    } else {
      this.particle = null;
    }

    // Behaviors 3D
    this.behaviors = Array.isArray(options.behaviors)
      ? JSON.parse(JSON.stringify(options.behaviors))
      : [];

    // Custom script code
    this.script = options.script || '';

    // Custom key/value data
    this.customData = options.customData ? JSON.parse(JSON.stringify(options.customData)) : {};

    // Runtime state (Three.js mesh & Cannon body references)
    this._runtime = {
      threeMesh: null,
      cannonBody: null,
      initialPosition: { ...this.transform.position },
      initialRotation: { ...this.transform.rotation },
      customInstance: null,
      patrolDir: 1,
      patrolStart: this.transform.position.x
    };
  }

  hasBehavior(type) {
    return this.behaviors.some(b => b.type === type);
  }

  getBehavior(type) {
    return this.behaviors.find(b => b.type === type);
  }

  addBehavior(behaviorObj) {
    if (!this.hasBehavior(behaviorObj.type)) {
      this.behaviors.push(behaviorObj);
    }
  }

  removeBehavior(type) {
    this.behaviors = this.behaviors.filter(b => b.type !== type);
  }

  clone() {
    const data = this.serialize();
    data.id = EngineMath.generateId('actor');
    data.name = `${this.name}_Copy`;
    data.transform.position.x += 2;
    data.transform.position.z += 2;
    return Actor3D.deserialize(data);
  }

  snapshot() {
    return JSON.parse(JSON.stringify(this.serialize()));
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      tag: this.tag,
      visible: this.visible,
      locked: this.locked,
      shape: this.shape,
      transform: JSON.parse(JSON.stringify(this.transform)),
      dimensions: JSON.parse(JSON.stringify(this.dimensions)),
      material: JSON.parse(JSON.stringify(this.material)),
      physics: JSON.parse(JSON.stringify(this.physics)),
      light: this.light ? JSON.parse(JSON.stringify(this.light)) : null,
      particle: this.particle ? JSON.parse(JSON.stringify(this.particle)) : null,
      behaviors: JSON.parse(JSON.stringify(this.behaviors)),
      script: this.script,
      customData: JSON.parse(JSON.stringify(this.customData))
    };
  }

  static deserialize(data) {
    return new Actor3D(data);
  }
}

window.Actor3D = Actor3D;
