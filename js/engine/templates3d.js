/**
 * NovaEngine 3D - Ready-to-Play 3D Unreal Engine 4 Style Game Templates
 */
const EngineTemplates3D = {
  // 1. Third-Person 3D Action Adventure (Unreal Engine 4 Style)
  createAdventure3D() {
    return {
      name: 'Unreal Sci-Fi Arena 3D',
      version: '1.0.0',
      actors: [
        // Ground Arena
        {
          name: 'Sci-Fi Ground Floor',
          tag: 'solid',
          shape: 'plane',
          dimensions: { width: 50, depth: 50 },
          transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: {
            color: '#1a2333',
            metalness: 0.7,
            roughness: 0.25,
            castShadow: false,
            receiveShadow: true
          },
          physics: { enabled: true, type: 'static', friction: 0.4 }
        },

        // Player Character 3D (Capsule/Robot)
        {
          name: 'Hero Character',
          tag: 'player',
          shape: 'capsule',
          dimensions: { radius: 0.6, height: 1.4 },
          transform: { position: { x: 0, y: 1.5, z: 8 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: {
            color: '#00f0ff',
            metalness: 0.8,
            roughness: 0.2,
            emissive: '#003344',
            emissiveIntensity: 0.5,
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
            { type: 'characterController3D', speed: 8.0, jumpForce: 9.0 },
            { type: 'cameraFollow3D', distance: 7.0, height: 3.5, smooth: 0.1 }
          ]
        },

        // Floating Neon Platform 1
        {
          name: 'High Neon Platform',
          tag: 'solid',
          shape: 'box',
          dimensions: { width: 8, height: 0.8, depth: 8 },
          transform: { position: { x: 0, y: 3.5, z: -8 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: {
            color: '#222d42',
            metalness: 0.85,
            roughness: 0.3,
            emissive: '#00f0ff',
            emissiveIntensity: 0.4,
            castShadow: true,
            receiveShadow: true
          },
          physics: { enabled: true, type: 'static' }
        },

        // Ramp / Step box 1
        {
          name: 'Step Box 1',
          tag: 'solid',
          shape: 'box',
          dimensions: { width: 4, height: 1.5, depth: 4 },
          transform: { position: { x: 0, y: 0.75, z: -2 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#334155', metalness: 0.5, roughness: 0.5 },
          physics: { enabled: true, type: 'static' }
        },

        // Dynamic Physics Crates (You can kick and push them in real time!)
        {
          name: 'Metal Crate 1',
          tag: 'crate',
          shape: 'box',
          dimensions: { width: 1.5, height: 1.5, depth: 1.5 },
          transform: { position: { x: -4, y: 1.0, z: 2 }, rotation: { x: 0, y: 15, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#f59e0b', metalness: 0.6, roughness: 0.4 },
          physics: { enabled: true, type: 'dynamic', mass: 1.5, restitution: 0.3 }
        },
        {
          name: 'Metal Crate 2',
          tag: 'crate',
          shape: 'box',
          dimensions: { width: 1.5, height: 1.5, depth: 1.5 },
          transform: { position: { x: -4, y: 2.6, z: 2 }, rotation: { x: 0, y: -10, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#f59e0b', metalness: 0.6, roughness: 0.4 },
          physics: { enabled: true, type: 'dynamic', mass: 1.5, restitution: 0.3 }
        },

        // Spinning Gold Collectible Crystals
        {
          name: 'Golden Energy Gem 1',
          tag: 'collectible',
          shape: 'torus',
          dimensions: { radius: 0.8, radiusTop: 0.25 },
          transform: { position: { x: 0, y: 5.5, z: -8 }, rotation: { x: 45, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: {
            color: '#ffea00',
            metalness: 0.9,
            roughness: 0.1,
            emissive: '#ff9800',
            emissiveIntensity: 1.2
          },
          physics: { enabled: false },
          behaviors: [
            { type: 'rotate3D', speedY: 90 },
            { type: 'collectible3D', scoreValue: 50, sound: 'snd_coin' }
          ]
        },
        {
          name: 'Golden Energy Gem 2',
          tag: 'collectible',
          shape: 'torus',
          dimensions: { radius: 0.8, radiusTop: 0.25 },
          transform: { position: { x: 6, y: 2.0, z: 2 }, rotation: { x: 45, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: {
            color: '#ffea00',
            metalness: 0.9,
            roughness: 0.1,
            emissive: '#ff9800',
            emissiveIntensity: 1.2
          },
          physics: { enabled: false },
          behaviors: [
            { type: 'rotate3D', speedY: 90 },
            { type: 'collectible3D', scoreValue: 50, sound: 'snd_coin' }
          ]
        },

        // Glowing Blue Point Light Pillar
        {
          name: 'Neon Blue Pillar Light',
          tag: 'light',
          shape: 'cylinder',
          dimensions: { radiusTop: 0.4, radiusBottom: 0.4, height: 6 },
          transform: { position: { x: -8, y: 3, z: -8 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: {
            color: '#00f0ff',
            emissive: '#00f0ff',
            emissiveIntensity: 2.0
          },
          light: {
            type: 'point',
            color: '#00f0ff',
            intensity: 2.0,
            distance: 20
          },
          physics: { enabled: true, type: 'static' }
        },

        // Glowing Magenta Point Light Pillar
        {
          name: 'Neon Magenta Pillar Light',
          tag: 'light',
          shape: 'cylinder',
          dimensions: { radiusTop: 0.4, radiusBottom: 0.4, height: 6 },
          transform: { position: { x: 8, y: 3, z: -8 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: {
            color: '#ff007f',
            emissive: '#ff007f',
            emissiveIntensity: 2.0
          },
          light: {
            type: 'point',
            color: '#ff007f',
            intensity: 2.0,
            distance: 20
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
      version: '1.0.0',
      actors: [
        // Wet Asphalt Street
        {
          name: 'Wet Asphalt Highway',
          tag: 'solid',
          shape: 'plane',
          dimensions: { width: 60, depth: 60 },
          transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#0f141e', metalness: 0.9, roughness: 0.15, receiveShadow: true },
          physics: { enabled: true, type: 'static' }
        },
        // Cyber Skyscraper 1
        {
          name: 'Mega Tower Alpha',
          tag: 'solid',
          shape: 'box',
          dimensions: { width: 10, height: 35, depth: 10 },
          transform: { position: { x: -18, y: 17.5, z: -15 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#131b28', metalness: 0.8, roughness: 0.3, emissive: '#00f0ff', emissiveIntensity: 0.25 },
          physics: { enabled: true, type: 'static' }
        },
        // Cyber Skyscraper 2
        {
          name: 'Mega Tower Beta',
          tag: 'solid',
          shape: 'box',
          dimensions: { width: 12, height: 42, depth: 12 },
          transform: { position: { x: 18, y: 21, z: -15 }, rotation: { x: 0, y: 15, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#131b28', metalness: 0.8, roughness: 0.3, emissive: '#ff007f', emissiveIntensity: 0.25 },
          physics: { enabled: true, type: 'static' }
        },
        // Neon Billboard Sign
        {
          name: 'Hologram Billboard',
          tag: 'deco',
          shape: 'box',
          dimensions: { width: 14, height: 5, depth: 0.4 },
          transform: { position: { x: 0, y: 16, z: -14 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#ff007f', emissive: '#ff007f', emissiveIntensity: 2.5 }
        },
        // Player Hover Drone
        {
          name: 'Cyber Hovercraft',
          tag: 'player',
          shape: 'cone',
          dimensions: { radius: 1.2, height: 2.0 },
          transform: { position: { x: 0, y: 2.0, z: 8 }, rotation: { x: 90, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#00f0ff', metalness: 0.9, roughness: 0.1, emissive: '#00e5ff', emissiveIntensity: 1.0 },
          physics: { enabled: true, type: 'dynamic', mass: 1.0 },
          behaviors: [
            { type: 'characterController3D', speed: 12.0, jumpForce: 10.0 },
            { type: 'cameraFollow3D', distance: 8.0, height: 4.0 }
          ]
        }
      ]
    };
  },

  // 3. 3D Physics Playground
  createPhysicsPlayground3D() {
    const actors = [
      // Floor
      {
        name: 'Floor',
        tag: 'solid',
        shape: 'plane',
        dimensions: { width: 40, depth: 40 },
        transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        material: { color: '#1e293b', metalness: 0.4, roughness: 0.5 },
        physics: { enabled: true, type: 'static', friction: 0.5 }
      },
      // Bouncy Trampoline
      {
        name: 'Trampoline Bouncer',
        tag: 'solid',
        shape: 'cylinder',
        dimensions: { radiusTop: 3.5, radiusBottom: 3.5, height: 0.6 },
        transform: { position: { x: 6, y: 0.3, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        material: { color: '#ec4899', emissive: '#ec4899', emissiveIntensity: 0.8 },
        physics: { enabled: true, type: 'static', restitution: 1.35 }
      },
      // Heavy Wrecking Sphere
      {
        name: 'Heavy Physics Sphere',
        tag: 'ball',
        shape: 'sphere',
        dimensions: { radius: 1.4 },
        transform: { position: { x: -4, y: 12, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
        material: { color: '#f59e0b', metalness: 0.9, roughness: 0.1 },
        physics: { enabled: true, type: 'dynamic', mass: 8.0, restitution: 0.6 }
      }
    ];

    // Stack of 12 Domino Crates
    for (let y = 0; y < 4; y++) {
      for (let x = -1; x <= 1; x++) {
        actors.push({
          name: `Domino Crate Y${y}_X${x}`,
          tag: 'crate',
          shape: 'box',
          dimensions: { width: 1.2, height: 1.2, depth: 1.2 },
          transform: {
            position: { x: -4 + x * 1.3, y: 0.6 + y * 1.25, z: 0 },
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
      version: '1.0.0',
      actors: actors
    };
  }
};

window.EngineTemplates3D = EngineTemplates3D;
