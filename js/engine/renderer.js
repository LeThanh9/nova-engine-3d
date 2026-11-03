/**
 * NovaEngine - Viewport & Game Renderer
 * Handles world-to-screen transforms, camera zoom/pan, grid, gizmos, and entity rendering
 */
class EngineRenderer {
  constructor(canvasElement, engine) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.engine = engine;

    // Camera
    this.camera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      zoom: 1.0,
      shakeIntensity: 0,
      shakeDuration: 0,
      shakeTimer: 0
    };

    // Grid config
    this.showGrid = true;
    this.gridSize = 32;
    this.snapToGrid = true;
    this.showColliders = false;

    // Viewport drag/pan in edit mode
    this.isPanning = false;
    this.panStartX = 0;
    this.panStartY = 0;
    this.camStartX = 0;
    this.camStartY = 0;

    // Selection gizmo interaction
    this.activeGizmo = null; // 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'rotate'
    this.gizmoStart = { x: 0, y: 0, entX: 0, entY: 0, entW: 0, entH: 0, entRot: 0 };

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const parent = this.canvas.parentElement;
    if (parent) {
      this.canvas.width = parent.clientWidth;
      this.canvas.height = parent.clientHeight;
    }
  }

  screenToWorld(sx, sy) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const wx = (sx - cx) / this.camera.zoom + this.camera.x;
    const wy = (sy - cy) / this.camera.zoom + this.camera.y;
    return { x: wx, y: wy };
  }

  worldToScreen(wx, wy) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    const sx = (wx - this.camera.x) * this.camera.zoom + cx;
    const sy = (wy - this.camera.y) * this.camera.zoom + cy;
    return { x: sx, y: sy };
  }

  shake(intensity = 8, duration = 0.25) {
    this.camera.shakeIntensity = intensity;
    this.camera.shakeDuration = duration;
    this.camera.shakeTimer = duration;
  }

  updateCamera(dt) {
    // Screen shake update
    if (this.camera.shakeTimer > 0) {
      this.camera.shakeTimer -= dt;
      if (this.camera.shakeTimer < 0) this.camera.shakeTimer = 0;
    }

    // Camera follow in Play mode
    if (this.engine.isPlaying) {
      this.camera.x = EngineMath.lerp(this.camera.x, this.camera.targetX, 0.1);
      this.camera.y = EngineMath.lerp(this.camera.y, this.camera.targetY, 0.1);
    }
  }

  render(entities, selectedEntity) {
    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    // Camera Shake offset
    let shakeX = 0;
    let shakeY = 0;
    if (this.camera.shakeTimer > 0) {
      const progress = this.camera.shakeTimer / this.camera.shakeDuration;
      const mag = this.camera.shakeIntensity * progress;
      shakeX = (Math.random() * 2 - 1) * mag;
      shakeY = (Math.random() * 2 - 1) * mag;
    }

    ctx.save();
    // Center camera
    ctx.translate(cw / 2 + shakeX, ch / 2 + shakeY);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);

    // Disable image smoothing for sharp retro pixel art
    ctx.imageSmoothingEnabled = false;

    // 1. Draw Grid (in edit mode or if enabled)
    if (this.showGrid) {
      this.drawGrid(ctx);
    }

    // 2. Sort entities by zIndex
    const sorted = [...entities].sort((a, b) => a.zIndex - b.zIndex);

    // 3. Draw Entities
    for (let i = 0; i < sorted.length; i++) {
      const ent = sorted[i];
      if (!ent.visible) continue;
      this.renderEntity(ctx, ent);
    }

    // 4. Draw Particles
    if (this.engine.particles) {
      this.engine.particles.render(ctx);
    }

    // 5. Draw Colliders overlay if toggled
    if (this.showColliders || !this.engine.isPlaying) {
      this.drawColliders(ctx, sorted);
    }

    // 6. Draw Selection Gizmo in Edit Mode
    if (!this.engine.isPlaying && selectedEntity) {
      this.drawGizmo(ctx, selectedEntity);
    }

    ctx.restore();

    // 7. Render Screen Space HUD / Overlay
    this.renderHUD(ctx);
  }

  drawGrid(ctx) {
    const size = this.gridSize;
    const viewLeft = this.camera.x - (this.canvas.width / 2) / this.camera.zoom;
    const viewRight = this.camera.x + (this.canvas.width / 2) / this.camera.zoom;
    const viewTop = this.camera.y - (this.canvas.height / 2) / this.camera.zoom;
    const viewBottom = this.camera.y + (this.canvas.height / 2) / this.camera.zoom;

    const startX = Math.floor(viewLeft / size) * size;
    const endX = Math.ceil(viewRight / size) * size;
    const startY = Math.floor(viewTop / size) * size;
    const endY = Math.ceil(viewBottom / size) * size;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1 / this.camera.zoom;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += size) {
      ctx.moveTo(x, viewTop);
      ctx.lineTo(x, viewBottom);
    }
    for (let y = startY; y <= endY; y += size) {
      ctx.moveTo(viewLeft, y);
      ctx.lineTo(viewRight, y);
    }
    ctx.stroke();

    // Origin Axes (X: Red, Y: Green)
    ctx.lineWidth = 2 / this.camera.zoom;
    // X axis
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.beginPath();
    ctx.moveTo(viewLeft, 0);
    ctx.lineTo(viewRight, 0);
    ctx.stroke();

    // Y axis
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.beginPath();
    ctx.moveTo(0, viewTop);
    ctx.lineTo(0, viewBottom);
    ctx.stroke();
  }

  renderEntity(ctx, ent) {
    ctx.save();
    ctx.translate(ent.x, ent.y);
    ctx.rotate(EngineMath.degToRad(ent.rotation));
    ctx.scale(ent.scaleX, ent.scaleY);
    ctx.globalAlpha = ent.opacity;

    const halfW = ent.width / 2;
    const halfH = ent.height / 2;

    switch (ent.shape) {
      case 'rect':
        ctx.fillStyle = ent.color;
        ctx.fillRect(-halfW, -halfH, ent.width, ent.height);
        break;

      case 'circle':
        ctx.fillStyle = ent.color;
        ctx.beginPath();
        ctx.arc(0, 0, halfW, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'text':
        ctx.font = `bold ${ent.fontSize}px sans-serif`;
        ctx.fillStyle = ent.fontColor || '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ent.text, 0, 0);
        break;

      case 'sprite':
        if (ent.spriteId) {
          const spriteAsset = this.engine.getSpriteAsset(ent.spriteId);
          if (spriteAsset && spriteAsset.frames && spriteAsset.frames.length > 0) {
            const frameIndex = ent.anim.frame % spriteAsset.frames.length;
            const img = this.getCachedImage(spriteAsset.frames[frameIndex]);
            if (img && img.complete) {
              ctx.drawImage(img, -halfW, -halfH, ent.width, ent.height);
            } else {
              // Fallback placeholder while image loads
              ctx.fillStyle = ent.color;
              ctx.fillRect(-halfW, -halfH, ent.width, ent.height);
            }
          } else {
            ctx.fillStyle = ent.color;
            ctx.fillRect(-halfW, -halfH, ent.width, ent.height);
          }
        } else {
          ctx.fillStyle = ent.color;
          ctx.fillRect(-halfW, -halfH, ent.width, ent.height);
        }
        break;
    }

    ctx.restore();
  }

  drawColliders(ctx, entities) {
    ctx.save();
    for (let i = 0; i < entities.length; i++) {
      const ent = entities[i];
      if (!ent.physics.enabled || !ent.visible) continue;

      const bounds = ent.getColliderBounds();
      ctx.lineWidth = 1 / this.camera.zoom;
      ctx.strokeStyle = ent.physics.isTrigger ? '#f59e0b' : '#10b981';

      if (ent.physics.colliderType === 'circle') {
        ctx.beginPath();
        ctx.arc(ent.x + ent.physics.colliderOffsetX, ent.y + ent.physics.colliderOffsetY, bounds.width / 2, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
      }
    }
    ctx.restore();
  }

  drawGizmo(ctx, ent) {
    const halfW = (ent.width * Math.abs(ent.scaleX)) / 2;
    const halfH = (ent.height * Math.abs(ent.scaleY)) / 2;

    ctx.save();
    ctx.translate(ent.x, ent.y);
    ctx.rotate(EngineMath.degToRad(ent.rotation));

    // Bounding border
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2 / this.camera.zoom;
    ctx.strokeRect(-halfW, -halfH, halfW * 2, halfH * 2);

    // Center handle
    const handleSize = 8 / this.camera.zoom;
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(-handleSize / 2, -handleSize / 2, handleSize, handleSize);

    // Corner scale handles
    const corners = [
      { x: -halfW, y: -halfH },
      { x: halfW, y: -halfH },
      { x: halfW, y: halfH },
      { x: -halfW, y: halfH }
    ];

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 1.5 / this.camera.zoom;

    corners.forEach(c => {
      ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
      ctx.strokeRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
    });

    // Rotation Knob at Top
    const rotDistance = 24 / this.camera.zoom;
    ctx.beginPath();
    ctx.moveTo(0, -halfH);
    ctx.lineTo(0, -halfH - rotDistance);
    ctx.strokeStyle = '#00f0ff';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -halfH - rotDistance, handleSize / 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#00f0ff';
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  renderHUD(ctx) {
    if (this.engine.isPlaying) {
      // Score display
      ctx.save();
      ctx.font = 'bold 20px "JetBrains Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(`⭐ ĐIỂM: ${this.engine.score}`, 20, 35);

      // Player Health hearts if player entity exists
      const player = this.engine.findEntityByTag('player');
      if (player && player.hasBehavior('health')) {
        const hp = player.customData.hp !== undefined ? player.customData.hp : 3;
        let hearts = '';
        for (let i = 0; i < hp; i++) hearts += '❤️ ';
        ctx.font = '16px sans-serif';
        ctx.fillText(`MÁU: ${hearts}`, 20, 65);
      }
      ctx.restore();
    }
  }

  // Image cache helper to avoid re-instantiating Image objects every frame
  getCachedImage(dataUrl) {
    if (!this._imgCache) this._imgCache = new Map();
    let img = this._imgCache.get(dataUrl);
    if (!img) {
      img = new Image();
      img.src = dataUrl;
      this._imgCache.set(dataUrl, img);
    }
    return img;
  }
}

window.EngineRenderer = EngineRenderer;

