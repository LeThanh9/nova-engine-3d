/**
 * NovaEngine - Particle System
 * Real-time particle effects: bursts, dust, sparks, fireworks, trails
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(options = {}) {
    const count = options.count || 10;
    const x = options.x || 0;
    const y = options.y || 0;
    const speed = options.speed || 150;
    const spread = options.spread !== undefined ? options.spread : Math.PI * 2;
    const angle = options.angle !== undefined ? options.angle : 0;
    const life = options.life || 0.6;
    const size = options.size || 4;
    const color = options.color || '#f59e0b';
    const endColor = options.endColor || color;
    const gravity = options.gravity !== undefined ? options.gravity : 200;

    for (let i = 0; i < count; i++) {
      const a = angle - spread / 2 + Math.random() * spread;
      const s = speed * (0.3 + Math.random() * 0.7);
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: life * (0.6 + Math.random() * 0.4),
        maxLife: life,
        size: size * (0.6 + Math.random() * 0.6),
        color: color,
        endColor: endColor,
        gravity: gravity
      });
    }
  }

  // Pre-configured burst helpers
  burst(x, y, color = '#f59e0b', count = 16) {
    this.emit({ x, y, color, count, speed: 200, life: 0.5, size: 5, spread: Math.PI * 2 });
  }

  sparkles(x, y, color = '#ffeb3b') {
    this.emit({ x, y, color, count: 8, speed: 100, life: 0.4, size: 3, gravity: -50 });
  }

  explosion(x, y) {
    this.burst(x, y, '#ef4444', 20);
    this.burst(x, y, '#f59e0b', 15);
    this.burst(x, y, '#ffffff', 8);
  }

  jumpDust(x, y) {
    this.emit({
      x, y,
      color: '#e2e8f0',
      count: 6,
      speed: 80,
      angle: -Math.PI / 2,
      spread: Math.PI * 0.8,
      life: 0.25,
      size: 4,
      gravity: 50
    });
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
    }
  }

  render(ctx) {
    if (this.particles.length === 0) return;
    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const alpha = Math.max(0, p.life / p.maxLife);
      const currentSize = p.size * alpha;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - currentSize / 2, p.y - currentSize / 2, currentSize, currentSize);
    }
    ctx.restore();
  }

  clear() {
    this.particles = [];
  }
}

window.ParticleSystem = ParticleSystem;

