/**
 * NovaEngine - Web Audio API Sound Synthesizer & SFX Maker
 * 100% In-Engine sound generation, zero external sound files required!
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterVolume = 0.5;
    this.muted = false;
    this.sounds = new Map();

    // Default built-in sounds
    this.registerDefaultSounds();
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  registerDefaultSounds() {
    this.sounds.set('snd_jump', {
      name: 'Nhảy (Jump)',
      type: 'jump',
      wave: 'square',
      startFreq: 160,
      endFreq: 620,
      attack: 0.01,
      decay: 0.15,
      volume: 0.4
    });

    this.sounds.set('snd_coin', {
      name: 'Ăn Xu (Coin)',
      type: 'coin',
      wave: 'sine',
      startFreq: 987,
      endFreq: 1318,
      attack: 0.01,
      decay: 0.25,
      volume: 0.5
    });

    this.sounds.set('snd_laser', {
      name: 'Bắn Laser',
      type: 'laser',
      wave: 'sawtooth',
      startFreq: 880,
      endFreq: 110,
      attack: 0.01,
      decay: 0.15,
      volume: 0.35
    });

    this.sounds.set('snd_explosion', {
      name: 'Phát Nổ (Explosion)',
      type: 'noise',
      wave: 'noise',
      startFreq: 150,
      endFreq: 40,
      attack: 0.01,
      decay: 0.35,
      volume: 0.6
    });

    this.sounds.set('snd_hit', {
      name: 'Bị Thương (Hit)',
      type: 'hit',
      wave: 'triangle',
      startFreq: 240,
      endFreq: 60,
      attack: 0.01,
      decay: 0.12,
      volume: 0.5
    });

    this.sounds.set('snd_powerup', {
      name: 'Nâng Cấp (Powerup)',
      type: 'powerup',
      wave: 'triangle',
      startFreq: 330,
      endFreq: 880,
      attack: 0.02,
      decay: 0.4,
      volume: 0.5
    });

    this.sounds.set('snd_victory', {
      name: 'Chiến Thắng (Fanfare)',
      type: 'victory',
      wave: 'sine',
      startFreq: 523,
      endFreq: 1046,
      attack: 0.05,
      decay: 0.8,
      volume: 0.6
    });

    this.sounds.set('snd_plasma', {
      name: 'Pháo Năng Lượng (Plasma Cannon)',
      type: 'laser',
      wave: 'sawtooth',
      startFreq: 1200,
      endFreq: 180,
      attack: 0.005,
      decay: 0.22,
      volume: 0.55
    });

    this.sounds.set('snd_bounce', {
      name: 'Bệ Phóng (Jump Pad)',
      type: 'jump',
      wave: 'triangle',
      startFreq: 140,
      endFreq: 850,
      attack: 0.01,
      decay: 0.28,
      volume: 0.65
    });

    this.sounds.set('snd_shockwave', {
      name: 'Sóng Xung Kích (Shockwave)',
      type: 'noise',
      wave: 'noise',
      startFreq: 80,
      endFreq: 25,
      attack: 0.01,
      decay: 0.5,
      volume: 0.75
    });

    this.sounds.set('snd_step', {
      name: 'Bước Chân Robot (Servo Step)',
      type: 'hit',
      wave: 'sine',
      startFreq: 320,
      endFreq: 90,
      attack: 0.005,
      decay: 0.06,
      volume: 0.25
    });
  }

  // Play a sound by ID or parameter config
  play(idOrConfig) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    let config = idOrConfig;
    if (typeof idOrConfig === 'string') {
      config = this.sounds.get(idOrConfig);
      if (!config) {
        console.warn(`[NovaEngine Audio] Sound not found: ${idOrConfig}`);
        return;
      }
    }

    const now = this.ctx.currentTime;
    const vol = (config.volume || 0.5) * this.masterVolume;

    // Handle noise/explosion
    if (config.wave === 'noise' || config.type === 'noise') {
      this.playNoise(config, now, vol);
      return;
    }

    // Handle multi-tone coin
    if (config.type === 'coin') {
      this.playTone(config.startFreq || 987, 'sine', now, 0.08, vol);
      this.playTone(config.endFreq || 1318, 'sine', now + 0.07, 0.2, vol);
      return;
    }

    // Handle powerup arpeggio
    if (config.type === 'powerup') {
      const notes = [330, 440, 554, 659, 880];
      notes.forEach((freq, idx) => {
        this.playTone(freq, 'triangle', now + idx * 0.06, 0.12, vol);
      });
      return;
    }

    // Handle victory fanfare
    if (config.type === 'victory') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        this.playTone(freq, 'sine', now + idx * 0.12, 0.35, vol);
      });
      return;
    }

    // Standard sweep oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = config.wave || 'square';
    const startF = config.startFreq || 440;
    const endF = config.endFreq || 440;
    const attack = config.attack || 0.01;
    const decay = config.decay || 0.2;

    osc.frequency.setValueAtTime(startF, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(10, endF), now + attack + decay);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vol, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + attack + decay + 0.05);
  }

  playTone(freq, wave, startTime, duration, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  playNoise(config, now, vol) {
    const bufferSize = this.ctx.sampleRate * (config.decay || 0.3);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    // Filter for low rumble explosion
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(config.startFreq || 800, now);
    filter.frequency.exponentialRampToValueAtTime(config.endFreq || 50, now + (config.decay || 0.3));

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (config.decay || 0.3));

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    whiteNoise.start(now);
  }

  getAllSounds() {
    const list = [];
    for (const [id, sound] of this.sounds.entries()) {
      list.push({ id, ...sound });
    }
    return list;
  }

  saveSound(id, config) {
    this.sounds.set(id, config);
  }

  deleteSound(id) {
    this.sounds.delete(id);
  }
}

window.SoundEngine = SoundEngine;

