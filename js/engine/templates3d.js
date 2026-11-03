/**
 * NovaEngine 3D - Ready-to-Play 3D Unreal Engine 4 Style Game Templates
 */
const EngineTemplates3D = {
  // 1. Third-Person 3D Action Adventure (Unreal Engine 4 Style)
  createAdventure3D() {
    return {
      name: 'Unreal Sci-Fi Arena 3D',
      version: '2.0.0',
      actors: [
        // Ground Cyber Floor
        {
          name: 'Cyberpunk Hex Ground',
          tag: 'solid',
          shape: 'plane',
          dimensions: { width: 60, depth: 60 },
          transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: {
            color: '#111827',
            metalness: 0.85,
            roughness: 0.2,
            castShadow: false,
            receiveShadow: true
          },
          physics: { enabled: true, type: 'static', friction: 0.4 }
        },

        // Player Character 3D (Unreal Sci-Fi Robot / Hero)
        {
          name: 'Hero Robot Character',
          tag: 'player',
          shape: 'character',
          dimensions: { radius: 0.6, height: 1.8 },
          transform: { position: { x: 0, y: 1.0, z: 6 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: {
            color: '#00f0ff',
            metalness: 0.9,
            roughness: 0.15,
            emissive: '#00f0ff',
            emissiveIntensity: 1.5,
            castShadow: true
          },
          physics: {
            enabled: true,
            type: 'dynamic',
            mass: 2.0,
            friction: 0.2,
            restitution: 0.0
          },
          behaviors: [
            { type: 'characterController3D', speed: 8.5, jumpForce: 9.5 },
            { type: 'cameraFollow3D', distance: 6.5, height: 3.2, smooth: 0.1 }
          ]
        },

        // High Floating Neon Platform
        {
          name: 'Floating Neon Arena',
          tag: 'solid',
          shape: 'box',
          dimensions: { width: 14, height: 1.0, depth: 14 },
          transform: { position: { x: 0, y: 3.5, z: -8 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: {
            color: '#151e2e',
            metalness: 0.9,
            roughness: 0.3,
            emissive: '#00f0ff',
            emissiveIntensity: 0.1,
            castShadow: true,
            receiveShadow: true
          },
          physics: { enabled: true, type: 'static' }
        },

        // Steps leading to high platform
        {
          name: 'Ramp Step 1',
          tag: 'solid',
          shape: 'box',
          dimensions: { width: 5, height: 1.2, depth: 4 },
          transform: { position: { x: 0, y: 0.6, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#334155', metalness: 0.7, roughness: 0.3 },
          physics: { enabled: true, type: 'static' }
        },
        {
          name: 'Ramp Step 2',
          tag: 'solid',
          shape: 'box',
          dimensions: { width: 5, height: 2.4, depth: 4 },
          transform: { position: { x: 0, y: 1.2, z: -3.5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#334155', metalness: 0.7, roughness: 0.3 },
          physics: { enabled: true, type: 'static' }
        },

        // Dynamic Physics Crates with Hazard Textures (Push and kick them in real-time!)
        {
          name: 'Hazard Metal Crate 1',
          tag: 'crate',
          shape: 'box',
          dimensions: { width: 1.5, height: 1.5, depth: 1.5 },
          transform: { position: { x: -4, y: 1.0, z: 3 }, rotation: { x: 0, y: 15, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#eab308', metalness: 0.6, roughness: 0.4 },
          physics: { enabled: true, type: 'dynamic', mass: 1.5, restitution: 0.3 }
        },
        {
          name: 'Hazard Metal Crate 2',
          tag: 'crate',
          shape: 'box',
          dimensions: { width: 1.5, height: 1.5, depth: 1.5 },
          transform: { position: { x: -4, y: 2.6, z: 3 }, rotation: { x: 0, y: -10, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#eab308', metalness: 0.6, roughness: 0.4 },
          physics: { enabled: true, type: 'dynamic', mass: 1.5, restitution: 0.3 }
        },
        {
          name: 'Hazard Metal Crate 3',
          tag: 'crate',
          shape: 'box',
          dimensions: { width: 1.5, height: 1.5, depth: 1.5 },
          transform: { position: { x: 4, y: 1.0, z: 3 }, rotation: { x: 0, y: 25, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#eab308', metalness: 0.6, roughness: 0.4 },
          physics: { enabled: true, type: 'dynamic', mass: 1.5, restitution: 0.3 }
        },

        // High-Tech Unreal Jump Pad (Catapults player onto the high arena!)
        {
          name: 'Sci-Fi Launch Pad',
          tag: 'jumppad',
          shape: 'cylinder',
          dimensions: { radiusTop: 1.8, radiusBottom: 2.1, height: 0.35, width: 3.6 },
          transform: { position: { x: 8, y: 0.18, z: -1 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: {
            color: '#00f0ff',
            emissive: '#00f0ff',
            emissiveIntensity: 2.5
          },
          physics: { enabled: true, type: 'static', friction: 0.5 }
        },

        // Explosive Metal Hazard Barrels (Blast away with plasma cannon!)
        {
          name: 'Explosive Barrel Alpha',
          tag: 'barrel',
          shape: 'cylinder',
          dimensions: { radiusTop: 0.7, radiusBottom: 0.7, height: 1.6, radius: 0.7 },
          transform: { position: { x: -6, y: 0.8, z: -3 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#ef4444', metalness: 0.7, roughness: 0.3 },
          physics: { enabled: true, type: 'dynamic', mass: 1.2, restitution: 0.4 }
        },
        {
          name: 'Explosive Barrel Beta',
          tag: 'barrel',
          shape: 'cylinder',
          dimensions: { radiusTop: 0.7, radiusBottom: 0.7, height: 1.6, radius: 0.7 },
          transform: { position: { x: -4.8, y: 0.8, z: -4.5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#ef4444', metalness: 0.7, roughness: 0.3 },
          physics: { enabled: true, type: 'dynamic', mass: 1.2, restitution: 0.4 }
        },

        // Floating Spinning Energy Crystals with Glowing Bloom
        {
          name: 'Energy Crystal Alpha',
          tag: 'collectible',
          shape: 'torus',
          dimensions: { radius: 0.8, radiusTop: 0.25 },
          transform: { position: { x: 0, y: 5.8, z: -8 }, rotation: { x: 45, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: {
            color: '#facc15',
            metalness: 0.95,
            roughness: 0.05,
            emissive: '#f59e0b',
            emissiveIntensity: 2.8
          },
          physics: { enabled: false },
          behaviors: [
            { type: 'rotate3D', speedY: 90 },
            { type: 'collectible3D', scoreValue: 50, sound: 'snd_coin' }
          ]
        },
        {
          name: 'Energy Crystal Beta',
          tag: 'collectible',
          shape: 'torus',
          dimensions: { radius: 0.8, radiusTop: 0.25 },
          transform: { position: { x: 5, y: 2.0, z: 0 }, rotation: { x: 45, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: {
            color: '#00f0ff',
            metalness: 0.95,
            roughness: 0.05,
            emissive: '#00f0ff',
            emissiveIntensity: 2.8
          },
          physics: { enabled: false },
          behaviors: [
            { type: 'rotate3D', speedY: 90 },
            { type: 'collectible3D', scoreValue: 50, sound: 'snd_coin' }
          ]
        },

        // Glowing Blue Point Light Pillar
        {
          name: 'Cyan Light Beacon',
          tag: 'light',
          shape: 'cylinder',
          dimensions: { radiusTop: 0.35, radiusBottom: 0.35, height: 7 },
          transform: { position: { x: -6, y: 3.5, z: -8 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: {
            color: '#00f0ff',
            emissive: '#00f0ff',
            emissiveIntensity: 3.0
          },
          light: {
            type: 'point',
            color: '#00f0ff',
            intensity: 2.5,
            distance: 25
          },
          physics: { enabled: true, type: 'static' }
        },

        // Glowing Magenta Point Light Pillar
        {
          name: 'Magenta Light Beacon',
          tag: 'light',
          shape: 'cylinder',
          dimensions: { radiusTop: 0.35, radiusBottom: 0.35, height: 7 },
          transform: { position: { x: 6, y: 3.5, z: -8 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: {
            color: '#ff007f',
            emissive: '#ff007f',
            emissiveIntensity: 3.0
          },
          light: {
            type: 'point',
            color: '#ff007f',
            intensity: 2.5,
            distance: 25
          },
          physics: { enabled: true, type: 'static' }
        }
      ]
    };
  },

  // 2. Cyberpunk Neon City 3D Template
  createCyberpunk3D() {
    return {
      name: 'Cyberpunk Neon City 3D',
      version: '2.0.0',
      actors: [
        {
          name: 'Wet Asphalt Highway',
          tag: 'solid',
          shape: 'plane',
          dimensions: { width: 60, depth: 60 },
          transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#0f141e', metalness: 0.9, roughness: 0.15, receiveShadow: true },
          physics: { enabled: true, type: 'static' }
        },
        {
          name: 'Mega Tower Alpha',
          tag: 'solid',
          shape: 'box',
          dimensions: { width: 10, height: 35, depth: 10 },
          transform: { position: { x: -18, y: 17.5, z: -15 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#131b28', metalness: 0.8, roughness: 0.3, emissive: '#00f0ff', emissiveIntensity: 0.35 },
          physics: { enabled: true, type: 'static' }
        },
        {
          name: 'Mega Tower Beta',
          tag: 'solid',
          shape: 'box',
          dimensions: { width: 12, height: 42, depth: 12 },
          transform: { position: { x: 18, y: 21, z: -15 }, rotation: { x: 0, y: 15, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#131b28', metalness: 0.8, roughness: 0.3, emissive: '#ff007f', emissiveIntensity: 0.35 },
          physics: { enabled: true, type: 'static' }
        },
        {
          name: 'Hero Robot',
          tag: 'player',
          shape: 'character',
          dimensions: { radius: 0.6, height: 1.8 },
          transform: { position: { x: 0, y: 1.0, z: 5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#00f0ff', metalness: 0.9, roughness: 0.15, emissive: '#00f0ff', emissiveIntensity: 1.5 },
          physics: { enabled: true, type: 'dynamic', mass: 2.0 },
          behaviors: [
            { type: 'characterController3D', speed: 10.0, jumpForce: 10.0 },
            { type: 'cameraFollow3D', distance: 7.0, height: 3.5 }
          ]
        }
      ]
    };
  },

  // 3. 3D Physics Playground
  createPhysicsPlayground3D() {
    const actors = [
      {
        name: 'Arena Floor',
        tag: 'solid',
        shape: 'plane',
        dimensions: { width: 45, depth: 45 },
        transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        material: { color: '#1e293b', metalness: 0.4, roughness: 0.5 },
        physics: { enabled: true, type: 'static', friction: 0.5 }
      },
      {
        name: 'Trampoline Bouncer Pad',
        tag: 'solid',
        shape: 'cylinder',
        dimensions: { radiusTop: 3.5, radiusBottom: 3.5, height: 0.6 },
        transform: { position: { x: 6, y: 0.3, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        material: { color: '#ec4899', emissive: '#ec4899', emissiveIntensity: 1.2 },
        physics: { enabled: true, type: 'static', restitution: 1.35 }
      },
      {
        name: 'Hero Character',
        tag: 'player',
        shape: 'character',
        dimensions: { radius: 0.6, height: 1.8 },
        transform: { position: { x: 0, y: 1.0, z: 5 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        material: { color: '#00f0ff', metalness: 0.8, roughness: 0.2, emissive: '#00f0ff', emissiveIntensity: 1.2 },
        physics: { enabled: true, type: 'dynamic', mass: 2.0 },
        behaviors: [
          { type: 'characterController3D', speed: 8.0, jumpForce: 9.0 },
          { type: 'cameraFollow3D', distance: 6.5, height: 3.2 }
        ]
      }
    ];

    // Domino Crates
    for (let y = 0; y < 4; y++) {
      for (let x = -1; x <= 1; x++) {
        actors.push({
          name: `Domino Crate Y${y}_X${x}`,
          tag: 'crate',
          shape: 'box',
          dimensions: { width: 1.3, height: 1.3, depth: 1.3 },
          transform: {
            position: { x: -4 + x * 1.4, y: 0.65 + y * 1.35, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          },
          material: { color: '#38bdf8', metalness: 0.3, roughness: 0.5 },
          physics: { enabled: true, type: 'dynamic', mass: 1.0, restitution: 0.2 }
        });
      }
    }

    return {
      name: 'Physics Playground 3D',
      version: '2.0.0',
      actors: actors
    };
  }
};

window.EngineTemplates3D = EngineTemplates3D;
