/**
 * NovaEngine - Math Utilities & Vector2
 */
class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  copy(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  clone() {
    return new Vec2(this.x, this.y);
  }

  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  scale(s) {
    this.x *= s;
    this.y *= s;
    return this;
  }

  lengthSq() {
    return this.x * this.x + this.y * this.y;
  }

  length() {
    return Math.sqrt(this.lengthSq());
  }

  normalize() {
    const len = this.length();
    if (len > 0.00001) {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }

  distance(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }
}

const EngineMath = {
  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },

  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  degToRad(deg) {
    return (deg * Math.PI) / 180;
  },

  radToDeg(rad) {
    return (rad * 180) / Math.PI;
  },

  generateId(prefix = 'obj') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
  },

  // Color utilities
  hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  },

  rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  // Color palettes for Pixel Art Editor
  PALETTES: {
    pico8: [
      '#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
      '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'
    ],
    gameboy: [
      '#0f380f', '#306230', '#8bac0f', '#9bbc0f'
    ],
    cyberpunk: [
      '#0d0221', '#0f084b', '#26408b', '#a6cfd5', '#c2e7d9', '#ff007f', '#00f0ff', '#ffe600'
    ],
    fantasy: [
      '#1b1c2b', '#3b2042', '#5f2f45', '#944446', '#c46849', '#e09855', '#eec96d', '#f6f1a8',
      '#263b32', '#3e6643', '#68995a', '#9fc475', '#39477b', '#4e6fb2', '#78a7e0', '#b6d7fc'
    ]
  }
};

window.Vec2 = Vec2;
window.EngineMath = EngineMath;

