/**
 * NovaEngine - Entity & Component System
 */
class Entity {
  constructor(options = {}) {
    this.id = options.id || EngineMath.generateId('ent');
    this.name = options.name || 'Entity';
    this.tag = options.tag || 'untagged';
    this.visible = options.visible !== undefined ? options.visible : true;
    this.locked = options.locked || false;

    // Transform
    this.x = options.x !== undefined ? options.x : 0;
    this.y = options.y !== undefined ? options.y : 0;
    this.width = options.width !== undefined ? options.width : 32;
    this.height = options.height !== undefined ? options.height : 32;
    this.rotation = options.rotation || 0; // degrees
    this.scaleX = options.scaleX !== undefined ? options.scaleX : 1;
    this.scaleY = options.scaleY !== undefined ? options.scaleY : 1;
    this.zIndex = options.zIndex !== undefined ? options.zIndex : 0;

    // Visual
    this.shape = options.shape || 'rect'; // 'rect' | 'circle' | 'sprite' | 'text'
    this.color = options.color || '#3b82f6';
    this.spriteId = options.spriteId || null;
    this.opacity = options.opacity !== undefined ? options.opacity : 1.0;
    this.text = options.text || 'Text Label';
    this.fontSize = options.fontSize || 16;
    this.fontColor = options.fontColor || '#ffffff';

    // Animation state
    this.anim = {
      currentClip: options.animClip || 'default',
      frame: 0,
      timer: 0,
      fps: options.animFps || 8,
      isPlaying: true
    };

    // Physics
    const p = options.physics || {};
    this.physics = {
      enabled: p.enabled !== undefined ? p.enabled : false,
      type: p.type || 'static', // 'static' | 'dynamic' | 'kinematic'
      mass: p.mass !== undefined ? p.mass : 1.0,
      friction: p.friction !== undefined ? p.friction : 0.2,
      restitution: p.restitution !== undefined ? p.restitution : 0.0,
      gravityScale: p.gravityScale !== undefined ? p.gravityScale : 1.0,
      isTrigger: p.isTrigger || false,
      colliderType: p.colliderType || 'box', // 'box' | 'circle'
      colliderWidth: p.colliderWidth || null, // null defaults to entity.width
      colliderHeight: p.colliderHeight || null, // null defaults to entity.height
      colliderOffsetX: p.colliderOffsetX || 0,
      colliderOffsetY: p.colliderOffsetY || 0,
      // Runtime physics state
      vx: 0,
      vy: 0,
      grounded: false,
      wasGrounded: false,
      jumpCount: 0
    };

    // Behaviors (built-in component behaviors)
    this.behaviors = Array.isArray(options.behaviors) 
      ? JSON.parse(JSON.stringify(options.behaviors)) 
      : [];

    // Custom script code
    this.script = options.script || '';

    // Custom variables
    this.customData = options.customData ? JSON.parse(JSON.stringify(options.customData)) : {};

    // Runtime state (not serialized into project permanently)
    this._runtime = {
      invulnerableTimer: 0,
      initialX: this.x,
      initialY: this.y,
      patrolDir: 1,
      patrolStart: this.x,
      spawnerTimer: 0,
      customInstance: null
    };
  }

  // Bounding box for selection & collisions
  getBounds() {
    const w = this.width * Math.abs(this.scaleX);
    const h = this.height * Math.abs(this.scaleY);
    return {
      x: this.x - w / 2,
      y: this.y - h / 2,
      width: w,
      height: h,
      left: this.x - w / 2,
      right: this.x + w / 2,
      top: this.y - h / 2,
      bottom: this.y + h / 2
    };
  }

  // Collider bounding box
  getColliderBounds() {
    const w = (this.physics.colliderWidth || this.width) * Math.abs(this.scaleX);
    const h = (this.physics.colliderHeight || this.height) * Math.abs(this.scaleY);
    const cx = this.x + this.physics.colliderOffsetX;
    const cy = this.y + this.physics.colliderOffsetY;
    return {
      x: cx - w / 2,
      y: cy - h / 2,
      width: w,
      height: h,
      left: cx - w / 2,
      right: cx + w / 2,
      top: cy - h / 2,
      bottom: cy + h / 2
    };
  }

  // Behavior helpers
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

  // Clone entity
  clone() {
    const data = this.serialize();
    data.id = EngineMath.generateId('ent');
    data.name = `${this.name}_Copy`;
    data.x += 20;
    data.y += 20;
    return Entity.deserialize(data);
  }

  // Deep snapshot (exact copy without changing id or position, used for Play/Stop rollback)
  snapshot() {
    return JSON.parse(JSON.stringify(this.serialize()));
  }

  // Serialization to plain JS Object
  serialize() {
    return {
      id: this.id,
      name: this.name,
      tag: this.tag,
      visible: this.visible,
      locked: this.locked,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      rotation: this.rotation,
      scaleX: this.scaleX,
      scaleY: this.scaleY,
      zIndex: this.zIndex,
      shape: this.shape,
      color: this.color,
      spriteId: this.spriteId,
      opacity: this.opacity,
      text: this.text,
      fontSize: this.fontSize,
      fontColor: this.fontColor,
      animFps: this.anim.fps,
      physics: {
        enabled: this.physics.enabled,
        type: this.physics.type,
        mass: this.physics.mass,
        friction: this.physics.friction,
        restitution: this.physics.restitution,
        gravityScale: this.physics.gravityScale,
        isTrigger: this.physics.isTrigger,
        colliderType: this.physics.colliderType,
        colliderWidth: this.physics.colliderWidth,
        colliderHeight: this.physics.colliderHeight,
        colliderOffsetX: this.physics.colliderOffsetX,
        colliderOffsetY: this.physics.colliderOffsetY
      },
      behaviors: JSON.parse(JSON.stringify(this.behaviors)),
      script: this.script,
      customData: JSON.parse(JSON.stringify(this.customData))
    };
  }

  static deserialize(data) {
    return new Entity(data);
  }
}

window.Entity = Entity;

