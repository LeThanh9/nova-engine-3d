/**
 * NovaEngine 3D - 3D Particle Effects System
 * Generates Fire, Sparks, Portals, Explosions, and Atmospheric Dust in 3D space
 */
class ParticleSystem3D {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.maxParticles = 800;

    // Buffer geometry for rendering all particles in a single draw call!
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    // Custom circular particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.8)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    this.material = new THREE.PointsMaterial({
      size: 0.5,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
  }

  emit(options = {}) {
    const count = options.count || 10;
    const origin = options.origin || { x: 0, y: 0, z: 0 };
    const speed = options.speed || 3.0;
    const color = new THREE.Color(options.color || '#f59e0b');
    const life = options.life || 0.8;
    const gravity = options.gravity ?? 1.5;

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;

      // Random 3D spherical direction
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const s = speed * (0.3 + Math.random() * 0.7);

      this.particles.push({
        x: origin.x,
        y: origin.y,
        z: origin.z,
        vx: Math.sin(phi) * Math.cos(theta) * s,
        vy: (Math.sin(phi) * Math.sin(theta) * s) + (options.upward || 0),
        vz: Math.cos(phi) * s,
        life: life * (0.5 + Math.random() * 0.5),
        maxLife: life,
        size: options.size || 0.6,
        r: color.r,
        g: color.g,
        b: color.b,
        gravity: gravity
      });
    }
  }

  burst(x, y, z, color = '#f59e0b', count = 25) {
    this.emit({ origin: { x, y, z }, color, count, speed: 6.0, life: 0.7, gravity: 4.0 });
  }

  sparks(x, y, z, color = '#00f0ff') {
    this.emit({ origin: { x, y, z }, color, count: 12, speed: 4.0, life: 0.5, gravity: -1.0, size: 0.3 });
  }

  explosion(x, y, z) {
    this.burst(x, y, z, '#ef4444', 30);
    this.burst(x, y, z, '#f59e0b', 20);
    this.burst(x, y, z, '#ffffff', 10);
  }

  jumpDust(x, y, z) {
    this.emit({
      origin: { x, y, z },
      color: '#94a3b8',
      count: 10,
      speed: 2.0,
      upward: 1.0,
      life: 0.35,
      size: 0.4,
      gravity: 2.0
    });
  }

  update(dt) {
    const posAttr = this.geometry.attributes.position;
    const colAttr = this.geometry.attributes.color;
    const sizeAttr = this.geometry.attributes.size;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.vy -= p.gravity * dt;
    }

    // Update BufferGeometry attributes
    for (let i = 0; i < this.maxParticles; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        const alpha = Math.max(0, p.life / p.maxLife);

        this.positions[i * 3] = p.x;
        this.positions[i * 3 + 1] = p.y;
        this.positions[i * 3 + 2] = p.z;

        this.colors[i * 3] = p.r * alpha;
        this.colors[i * 3 + 1] = p.g * alpha;
        this.colors[i * 3 + 2] = p.b * alpha;

        this.sizes[i] = p.size * alpha;
      } else {
        this.positions[i * 3] = 0;
        this.positions[i * 3 + 1] = -9999; // Hide off-screen
        this.positions[i * 3 + 2] = 0;
        this.sizes[i] = 0;
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  }

  clear() {
    this.particles = [];
  }
}

window.ParticleSystem3D = ParticleSystem3D;
