/**
 * NovaEngine - Pixel Art & Sprite Painter Studio
 * Complete 100% in-engine sprite painting & animation editor
 */
class PixelPainter {
  constructor(canvasElement, previewCanvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.previewCanvas = previewCanvasElement;
    this.previewCtx = this.previewCanvas ? this.previewCanvas.getContext('2d') : null;

    this.width = 16;
    this.height = 16;
    this.currentColor = '#00f0ff';
    this.currentTool = 'pencil'; // 'pencil' | 'eraser' | 'bucket' | 'picker' | 'line' | 'rect' | 'circle'
    this.palette = EngineMath.PALETTES.pico8;

    // Multi-frame animation support
    this.frames = [];
    this.currentFrameIndex = 0;
    this.fps = 8;
    this.isPlayingAnim = false;
    this.animTimer = null;
    this.onionSkin = true;

    // Interaction state
    this.isDrawing = false;
    this.lastX = -1;
    this.lastY = -1;
    this.startX = -1;
    this.startY = -1;
    this.tempFrame = null;

    // Built-in sprite assets cache
    this.spriteAssets = new Map();

    this.initDefaultFrames();
    this.initDefaultPresets();
  }

  initDefaultFrames() {
    this.frames = [this.createBlankGrid(this.width, this.height)];
    this.currentFrameIndex = 0;
  }

  createBlankGrid(w, h) {
    const grid = [];
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        row.push(null); // null = transparent
      }
      grid.push(row);
    }
    return grid;
  }

  getCurrentFrame() {
    return this.frames[this.currentFrameIndex] || this.frames[0];
  }

  setResolution(w, h) {
    this.width = w;
    this.height = h;
    this.frames = this.frames.map(f => {
      const newGrid = this.createBlankGrid(w, h);
      for (let y = 0; y < Math.min(f.length, h); y++) {
        for (let x = 0; x < Math.min(f[0].length, w); x++) {
          newGrid[y][x] = f[y][x];
        }
      }
      return newGrid;
    });
    this.render();
  }

  // Draw current frame to editor canvas
  render() {
    if (!this.canvas || !this.ctx) return;

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const pixelSizeX = cw / this.width;
    const pixelSizeY = ch / this.height;

    this.ctx.clearRect(0, 0, cw, ch);

    // Checkerboard background for transparency
    const checkSize = 10;
    for (let y = 0; y < ch; y += checkSize) {
      for (let x = 0; x < cw; x += checkSize) {
        const isDark = ((x / checkSize) + (y / checkSize)) % 2 === 0;
        this.ctx.fillStyle = isDark ? '#1a202c' : '#242d3d';
        this.ctx.fillRect(x, y, checkSize, checkSize);
      }
    }

    // Onion Skinning (show previous frame in 30% opacity)
    if (this.onionSkin && this.frames.length > 1 && this.currentFrameIndex > 0) {
      const prevFrame = this.frames[this.currentFrameIndex - 1];
      this.ctx.save();
      this.ctx.globalAlpha = 0.3;
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          const color = prevFrame[y] ? prevFrame[y][x] : null;
          if (color) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(x * pixelSizeX, y * pixelSizeY, pixelSizeX, pixelSizeY);
          }
        }
      }
      this.ctx.restore();
    }

    // Render active frame
    const frame = this.getCurrentFrame();
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const color = frame[y] ? frame[y][x] : null;
        if (color) {
          this.ctx.fillStyle = color;
          this.ctx.fillRect(x * pixelSizeX, y * pixelSizeY, pixelSizeX, pixelSizeY);
        }
      }
    }

    // Grid lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= this.width; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * pixelSizeX, 0);
      this.ctx.lineTo(x * pixelSizeX, ch);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.height; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * pixelSizeY);
      this.ctx.lineTo(cw, y * pixelSizeY);
      this.ctx.stroke();
    }

    this.renderPreview();
  }

  renderPreview() {
    if (!this.previewCanvas || !this.previewCtx) return;
    const pw = this.previewCanvas.width;
    const ph = this.previewCanvas.height;
    this.previewCtx.clearRect(0, 0, pw, ph);

    const frame = this.getCurrentFrame();
    const pxSizeX = pw / this.width;
    const pxSizeY = ph / this.height;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const color = frame[y] ? frame[y][x] : null;
        if (color) {
          this.previewCtx.fillStyle = color;
          this.previewCtx.fillRect(x * pxSizeX, y * pxSizeY, pxSizeX, pxSizeY);
        }
      }
    }
  }

  // Pointer interactions
  handlePointerDown(canvasX, canvasY) {
    const pt = this.getGridCoords(canvasX, canvasY);
    if (!pt) return;

    this.isDrawing = true;
    this.startX = pt.x;
    this.startY = pt.y;
    this.lastX = pt.x;
    this.lastY = pt.y;

    if (this.currentTool === 'pencil') {
      this.setPixel(pt.x, pt.y, this.currentColor);
    } else if (this.currentTool === 'eraser') {
      this.setPixel(pt.x, pt.y, null);
    } else if (this.currentTool === 'bucket') {
      this.floodFill(pt.x, pt.y, this.currentColor);
    } else if (this.currentTool === 'picker') {
      const color = this.getPixel(pt.x, pt.y);
      if (color) {
        this.currentColor = color;
        if (window.editorUI) window.editorUI.updateColorPicker(color);
      }
    }
    this.render();
  }

  handlePointerMove(canvasX, canvasY) {
    if (!this.isDrawing) return;
    const pt = this.getGridCoords(canvasX, canvasY);
    if (!pt) return;

    if (pt.x === this.lastX && pt.y === this.lastY) return;

    if (this.currentTool === 'pencil') {
      this.drawLinePixels(this.lastX, this.lastY, pt.x, pt.y, this.currentColor);
      this.lastX = pt.x;
      this.lastY = pt.y;
      this.render();
    } else if (this.currentTool === 'eraser') {
      this.drawLinePixels(this.lastX, this.lastY, pt.x, pt.y, null);
      this.lastX = pt.x;
      this.lastY = pt.y;
      this.render();
    }
  }

  handlePointerUp(canvasX, canvasY) {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    const pt = this.getGridCoords(canvasX, canvasY);
    if (!pt) return;

    if (this.currentTool === 'line') {
      this.drawLinePixels(this.startX, this.startY, pt.x, pt.y, this.currentColor);
    } else if (this.currentTool === 'rect') {
      const minX = Math.min(this.startX, pt.x);
      const maxX = Math.max(this.startX, pt.x);
      const minY = Math.min(this.startY, pt.y);
      const maxY = Math.max(this.startY, pt.y);
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          this.setPixel(x, y, this.currentColor);
        }
      }
    }
    this.render();
  }

  getGridCoords(canvasX, canvasY) {
    if (!this.canvas) return null;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = Math.floor(((canvasX - rect.left) * scaleX) / (this.canvas.width / this.width));
    const y = Math.floor(((canvasY - rect.top) * scaleY) / (this.canvas.height / this.height));

    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return { x, y };
    }
    return null;
  }

  setPixel(x, y, color) {
    const frame = this.getCurrentFrame();
    if (frame && frame[y] && x >= 0 && x < this.width) {
      frame[y][x] = color;
    }
  }

  getPixel(x, y) {
    const frame = this.getCurrentFrame();
    return frame && frame[y] ? frame[y][x] : null;
  }

  // Bresenham line
  drawLinePixels(x0, y0, x1, y1, color) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let cx = x0;
    let cy = y0;
    while (true) {
      this.setPixel(cx, cy, color);
      if (cx === x1 && cy === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        cx += sx;
      }
      if (e2 < dx) {
        err += dx;
        cy += sy;
      }
    }
  }

  // Flood fill algorithm
  floodFill(startX, startY, fillColor) {
    const targetColor = this.getPixel(startX, startY);
    if (targetColor === fillColor) return;

    const queue = [[startX, startY]];
    const visited = new Set();

    while (queue.length > 0) {
      const [x, y] = queue.pop();
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      visited.add(key);

      if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;
      if (this.getPixel(x, y) !== targetColor) continue;

      this.setPixel(x, y, fillColor);

      queue.push([x + 1, y]);
      queue.push([x - 1, y]);
      queue.push([x, y + 1]);
      queue.push([x, y - 1]);
    }
  }

  clear() {
    const frame = this.getCurrentFrame();
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        frame[y][x] = null;
      }
    }
    this.render();
  }

  // Frames & Animation management
  addFrame() {
    this.frames.push(this.createBlankGrid(this.width, this.height));
    this.currentFrameIndex = this.frames.length - 1;
    this.render();
  }

  duplicateFrame() {
    const current = this.getCurrentFrame();
    const cloned = current.map(row => [...row]);
    this.frames.splice(this.currentFrameIndex + 1, 0, cloned);
    this.currentFrameIndex++;
    this.render();
  }

  deleteFrame() {
    if (this.frames.length <= 1) return;
    this.frames.splice(this.currentFrameIndex, 1);
    if (this.currentFrameIndex >= this.frames.length) {
      this.currentFrameIndex = this.frames.length - 1;
    }
    this.render();
  }

  selectFrame(index) {
    if (index >= 0 && index < this.frames.length) {
      this.currentFrameIndex = index;
      this.render();
    }
  }

  toggleAnimPlay() {
    this.isPlayingAnim = !this.isPlayingAnim;
    if (this.isPlayingAnim) {
      const interval = 1000 / this.fps;
      this.animTimer = setInterval(() => {
        this.currentFrameIndex = (this.currentFrameIndex + 1) % this.frames.length;
        this.renderPreview();
      }, interval);
    } else {
      if (this.animTimer) clearInterval(this.animTimer);
      this.animTimer = null;
    }
    return this.isPlayingAnim;
  }

  // Convert frame to Base64 PNG Data URL
  toDataURL(frameIndex = 0, scale = 4) {
    const frame = this.frames[frameIndex] || this.getCurrentFrame();
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = this.width * scale;
    tempCanvas.height = this.height * scale;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.imageSmoothingEnabled = false;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const color = frame[y] ? frame[y][x] : null;
        if (color) {
          tempCtx.fillStyle = color;
          tempCtx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
    return tempCanvas.toDataURL();
  }

  // Generate Sprite Object for Asset Library
  exportSpriteAsset(name = 'NewSprite') {
    const framesData = this.frames.map((_, idx) => this.toDataURL(idx, 2));
    const assetId = EngineMath.generateId('spr');
    const asset = {
      id: assetId,
      name: name,
      width: this.width,
      height: this.height,
      fps: this.fps,
      frames: framesData,
      rawFrames: JSON.parse(JSON.stringify(this.frames))
    };
    this.spriteAssets.set(assetId, asset);
    return asset;
  }

  loadSpriteAsset(asset) {
    this.width = asset.width || 16;
    this.height = asset.height || 16;
    this.fps = asset.fps || 8;
    if (asset.rawFrames && asset.rawFrames.length > 0) {
      this.frames = JSON.parse(JSON.stringify(asset.rawFrames));
    } else {
      this.initDefaultFrames();
    }
    this.currentFrameIndex = 0;
    this.render();
  }

  // Pre-loaded pixel art presets for quick creation
  initDefaultPresets() {
    // 1. Player Hero Idle
    const pIdle = this.createBlankGrid(16, 16);
    // Draw Cute Knight / Hero
    const skin = '#ffccaa';
    const hair = '#ab5236';
    const armor = '#29adff';
    const dark = '#1d2b53';
    const eye = '#000000';

    // Hair/Helmet
    for (let x = 5; x <= 10; x++) pIdle[3][x] = hair;
    for (let x = 4; x <= 11; x++) pIdle[4][x] = hair;
    // Face
    for (let x = 5; x <= 10; x++) pIdle[5][x] = skin;
    pIdle[5][6] = eye; pIdle[5][9] = eye;
    for (let x = 5; x <= 10; x++) pIdle[6][x] = skin;
    pIdle[6][7] = '#ff77a8'; pIdle[6][8] = '#ff77a8'; // blush
    // Body / Shirt
    for (let y = 7; y <= 11; y++) {
      for (let x = 5; x <= 10; x++) pIdle[y][x] = armor;
    }
    pIdle[8][4] = skin; pIdle[9][4] = skin; // Left hand
    pIdle[8][11] = skin; pIdle[9][11] = skin; // Right hand
    // Pants & Shoes
    for (let x = 5; x <= 7; x++) { pIdle[12][x] = dark; pIdle[13][x] = dark; }
    for (let x = 8; x <= 10; x++) { pIdle[12][x] = dark; pIdle[13][x] = dark; }

    this.registerPreset('spr_player', 'Nhân Vật (Hero)', [pIdle]);

    // 2. Golden Coin
    const c1 = this.createBlankGrid(16, 16);
    const gold = '#ffec27';
    const goldDark = '#ffa300';
    const white = '#fff1e8';
    for (let y = 4; y <= 11; y++) {
      for (let x = 4; x <= 11; x++) {
        if ((x === 4 || x === 11) && (y === 4 || y === 11)) continue;
        c1[y][x] = gold;
      }
    }
    c1[5][5] = white; c1[5][6] = white;
    for (let y = 6; y <= 9; y++) { c1[y][7] = goldDark; c1[y][8] = goldDark; }

    // Coin frame 2 (slightly thinner)
    const c2 = this.createBlankGrid(16, 16);
    for (let y = 4; y <= 11; y++) {
      for (let x = 6; x <= 9; x++) {
        c2[y][x] = gold;
      }
    }
    c2[5][7] = white;

    this.registerPreset('spr_coin', 'Đồng Xu Vàng (Coin)', [c1, c2]);

    // 3. Slime Enemy
    const s1 = this.createBlankGrid(16, 16);
    const slimeCol = '#00e436';
    const slimeDark = '#008751';
    for (let y = 7; y <= 13; y++) {
      for (let x = 3; x <= 12; x++) {
        if (y === 7 && (x < 5 || x > 10)) continue;
        s1[y][x] = slimeCol;
      }
    }
    s1[9][5] = '#000000'; s1[9][9] = '#000000'; // Eyes
    s1[8][5] = '#ffffff'; s1[8][9] = '#ffffff';
    for (let x = 4; x <= 11; x++) s1[13][x] = slimeDark;

    this.registerPreset('spr_slime', 'Quái Slime (Enemy)', [s1]);

    // 4. Grass Platform Tile
    const gTile = this.createBlankGrid(16, 16);
    const grass = '#00e436';
    const dirt = '#ab5236';
    const dirtDark = '#5f574f';
    for (let x = 0; x < 16; x++) {
      gTile[0][x] = grass;
      gTile[1][x] = grass;
      if (x % 3 === 0) gTile[2][x] = grass;
    }
    for (let y = 2; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if (!gTile[y][x]) {
          gTile[y][x] = (x + y) % 4 === 0 ? dirtDark : dirt;
        }
      }
    }
    this.registerPreset('spr_grass_block', 'Khối Đất Cỏ (Grass Block)', [gTile]);

    // 5. Spikes Hazard
    const spk = this.createBlankGrid(16, 16);
    const metal = '#c2c3c7';
    const metalDark = '#5f574f';
    const redTip = '#ff004d';
    // 3 spikes
    const tips = [2, 7, 13];
    tips.forEach(tx => {
      spk[7][tx] = redTip;
      spk[8][tx - 1] = metal; spk[8][tx] = metal; spk[8][tx + 1] = metal;
      for (let y = 9; y <= 15; y++) {
        for (let x = tx - (y - 7); x <= tx + (y - 7); x++) {
          if (x >= 0 && x < 16) spk[y][x] = metal;
        }
      }
    });
    for (let x = 0; x < 16; x++) spk[15][x] = metalDark;
    this.registerPreset('spr_spike', 'Chông Nhọn (Spikes)', [spk]);
  }

  registerPreset(id, name, frames) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 32;
    tempCanvas.height = 32;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.imageSmoothingEnabled = false;

    const framesData = frames.map(frame => {
      tempCtx.clearRect(0, 0, 32, 32);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const color = frame[y] ? frame[y][x] : null;
          if (color) {
            tempCtx.fillStyle = color;
            tempCtx.fillRect(x * 2, y * 2, 2, 2);
          }
        }
      }
      return tempCanvas.toDataURL();
    });

    this.spriteAssets.set(id, {
      id: id,
      name: name,
      width: 16,
      height: 16,
      fps: 6,
      frames: framesData,
      rawFrames: frames
    });
  }
}

window.PixelPainter = PixelPainter;

