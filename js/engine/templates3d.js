/**
 * NovaEngine 3D - Ready-to-Play 3D Unreal Engine 4 Style Game Templates
 */
const EngineTemplates3D = {
  // 0. Dude Theft Wars 3D: Ultra Detailed City Sandbox (Jack's House, Dude Burger, Airport & Stunt Biplane)
  createDudeTheftWars() {
    return {
      name: 'Dude Theft Wars 3D: Ultra Detailed City Sandbox',
      version: '3.5.0 (Dude Theft Wars Edition)',
      actors: [
        // 1. Protagonist Jack (The Dude Hero)
        {
          name: 'Jack (The Dude Hero)',
          tag: 'player',
          shape: 'dude_character',
          dimensions: { radius: 0.55, height: 1.8 },
          transform: { position: { x: 0, y: 1.0, z: -16.0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#f59e0b', metalness: 0.1, roughness: 0.8 },
          physics: { enabled: true, type: 'dynamic', mass: 2.0, friction: 0.2, restitution: 0.0 },
          behaviors: [
            { type: 'characterController3D', speed: 9.5, jumpForce: 10.5 },
            { type: 'cameraFollow3D', distance: 6.2, height: 3.0, smooth: 0.14 }
          ]
        },

        // 2. Jack's Luxury Villa, Driveway & Backyard Pool
        {
          name: "Jack's Villa & Backyard Pool",
          tag: 'dude_villa',
          shape: 'dude_villa',
          dimensions: { width: 18, height: 10, depth: 14 },
          transform: { position: { x: 0, y: 0, z: -30.0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          physics: { enabled: true, type: 'static' }
        },

        // 3. Super High-Bounce Trampoline
        {
          name: 'Mega Bouncy Trampoline',
          tag: 'trampoline',
          shape: 'trampoline',
          dimensions: { radius: 2.2, height: 0.8 },
          transform: { position: { x: 10.0, y: 0, z: -17.0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          physics: { enabled: true, type: 'static' }
        },

        // 4. Dude Burger Fast Food (Mascot 360)
        {
          name: 'Dude Burger Fast Food (Mascot 360)',
          tag: 'dude_burger',
          shape: 'dude_burger',
          dimensions: { width: 20, height: 8, depth: 16 },
          transform: { position: { x: 50, y: 0, z: 20 }, rotation: { x: 0, y: -90, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          physics: { enabled: true, type: 'static' }
        },

        // 5. Dude Police Station HQ
        {
          name: 'Dude Police Station HQ',
          tag: 'police_station',
          shape: 'police_station',
          dimensions: { width: 24, height: 12, depth: 18 },
          transform: { position: { x: -50, y: 0, z: 20 }, rotation: { x: 0, y: 90, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          physics: { enabled: true, type: 'static' }
        },

        // 6. Airport Runway & Control Tower
        {
          name: 'Dude City Airport Runway (240m)',
          tag: 'airport_runway',
          shape: 'airport_runway',
          dimensions: { width: 34, height: 0.2, depth: 220 },
          transform: { position: { x: 95, y: 0, z: -40 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          physics: { enabled: true, type: 'static' }
        },

        // 7. Stunt Biplane (Flyable Airplane)
        {
          name: 'Stunt Biplane (Flyable Flyer)',
          tag: 'vehicle',
          shape: 'stunt_plane',
          dimensions: { width: 10.5, height: 3.2, depth: 6.5 },
          transform: { position: { x: 95, y: 0.1, z: -20 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#facc15', metalness: 0.3, roughness: 0.4 },
          physics: { enabled: true, type: 'kinematic', mass: 850 }
        },

        // 8. Soccer Stadium with Giant Soccer Ball
        {
          name: 'Dude Soccer Stadium Pitch',
          tag: 'soccer_stadium',
          shape: 'soccer_stadium',
          dimensions: { width: 45, height: 1.0, depth: 65 },
          transform: { position: { x: -65, y: 0, z: -70 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          physics: { enabled: true, type: 'static' }
        },
        {
          name: 'Giant Bouncy Soccer Ball',
          tag: 'soccer_ball',
          shape: 'soccer_ball',
          dimensions: { radius: 1.4 },
          transform: { position: { x: -65, y: 1.4, z: -70 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#ffffff', roughness: 0.2, metalness: 0.1 },
          physics: { enabled: true, type: 'dynamic', mass: 6.0, restitution: 0.85, friction: 0.3 }
        },

        // 9. Skate Park Stunt Mega Ramp
        {
          name: 'Skate Park Stunt Launch Ramp',
          tag: 'skate_ramp',
          shape: 'skate_ramp',
          dimensions: { width: 14, height: 7.5, depth: 22 },
          transform: { position: { x: -80, y: 0, z: 20 }, rotation: { x: 0, y: 180, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          physics: { enabled: true, type: 'static' }
        },

        // 10. Octan Gas Station
        {
          name: 'Octan Gas Station & Pumps',
          tag: 'gas_station',
          shape: 'gas_station',
          dimensions: { width: 18, height: 6.5, depth: 16 },
          transform: { position: { x: -45, y: 0, z: 70 }, rotation: { x: 0, y: 90, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          physics: { enabled: true, type: 'static' }
        },

        // 11. Ammu-Nation Gun Store
        {
          name: 'Ammu-Nation Gun Store',
          tag: 'gun_shop',
          shape: 'gun_shop',
          dimensions: { width: 16, height: 7, depth: 14 },
          transform: { position: { x: 45, y: 0, z: 70 }, rotation: { x: 0, y: -90, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          physics: { enabled: true, type: 'static' }
        },

        // 12. Drivable Dude Ramp Buggy (parked on Jack's Driveway)
        {
          name: 'Dude Ramp Buggy (Wedge)',
          tag: 'vehicle',
          shape: 'vehicle',
          dimensions: { width: 2.3, height: 1.1, depth: 4.6 },
          transform: { position: { x: -13.0, y: 0.1, z: -15.0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#f59e0b', metalness: 0.85, roughness: 0.2 },
          physics: { enabled: true, type: 'kinematic', mass: 1200 }
        },

        // 13. Police Cruiser
        {
          name: 'Police Patrol Cruiser',
          tag: 'vehicle',
          shape: 'vehicle',
          dimensions: { width: 2.2, height: 1.25, depth: 4.8 },
          transform: { position: { x: -55.0, y: 0.1, z: 20.0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#1e293b', metalness: 0.8, roughness: 0.25 },
          physics: { enabled: true, type: 'kinematic', mass: 1500 }
        },

        // 14. Dude Formula GT Racer
        {
          name: 'Dude Formula GT Racer',
          tag: 'vehicle',
          shape: 'vehicle',
          dimensions: { width: 2.2, height: 0.9, depth: 4.6 },
          transform: { position: { x: 55.0, y: 0.1, z: 20.0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#ef4444', metalness: 0.95, roughness: 0.1 },
          physics: { enabled: true, type: 'kinematic', mass: 1100 }
        },

        // 15. Dude City Crossroad Highway
        {
          name: 'Dude Central Boulevard (N-S)',
          tag: 'road',
          shape: 'road',
          dimensions: { width: 14, height: 0.3, depth: 240 },
          transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#151821', metalness: 0.2, roughness: 0.65 },
          physics: { enabled: true, type: 'static' }
        },
        {
          name: 'Dude Avenue (E-W)',
          tag: 'road',
          shape: 'road',
          dimensions: { width: 14, height: 0.3, depth: 220 },
          transform: { position: { x: 0, y: 0.01, z: 35 }, rotation: { x: 0, y: 90, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#151821', metalness: 0.2, roughness: 0.65 },
          physics: { enabled: true, type: 'static' }
        },

        // 16. Dude City Sunny Green Plain
        {
          name: 'Dude City Sunny Grass Plain',
          tag: 'solid',
          shape: 'plane',
          dimensions: { width: 300, depth: 300 },
          transform: { position: { x: 0, y: -0.05, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#4ade80', metalness: 0.05, roughness: 0.95 },
          physics: { enabled: true, type: 'static' }
        },

        // 17. Tropical Palm Trees
        {
          name: 'Dude Palm 1',
          tag: 'palm_tree',
          shape: 'palm_tree',
          dimensions: { height: 7.5 },
          transform: { position: { x: -22, y: 0, z: 22 }, rotation: { x: 0, y: 30, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        },
        {
          name: 'Dude Palm 2',
          tag: 'palm_tree',
          shape: 'palm_tree',
          dimensions: { height: 7.2 },
          transform: { position: { x: 16, y: 0, z: 20 }, rotation: { x: 0, y: 75, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        },
        {
          name: 'Dude Palm 3',
          tag: 'palm_tree',
          shape: 'palm_tree',
          dimensions: { height: 7.8 },
          transform: { position: { x: 16, y: 0, z: -16 }, rotation: { x: 0, y: 150, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        },
        {
          name: 'Dude Palm 4',
          tag: 'palm_tree',
          shape: 'palm_tree',
          dimensions: { height: 7.0 },
          transform: { position: { x: -22, y: 0, z: -12 }, rotation: { x: 0, y: 220, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        }
      ]
    };
  },

  // 1. Grand Theft Auto VI: Vice City 2026 Open World Template (Supercars, Coastal Ocean, Palm Trees & Neon Hotels)
  createGTA6ViceCity() {
    return {
      name: 'GTA 6: Vice City Next-Gen 3D',
      version: '3.0.0 (GTA 6 Edition)',
      actors: [
        // 1. Coastal Boulevard Asphalt Highway
        {
          name: 'Ocean Drive Boulevard (Highway)',
          tag: 'road',
          shape: 'road',
          dimensions: { width: 16, height: 0.3, depth: 180 },
          transform: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#ffffff', metalness: 0.4, roughness: 0.35 },
          physics: { enabled: true, type: 'static', friction: 0.6 }
        },

        // 2. Coastal Ocean Water Plane (Dynamic Wave Motion)
        {
          name: 'Biscayne Bay Ocean Water',
          tag: 'ocean',
          shape: 'ocean_water',
          dimensions: { width: 140, height: 1.0, depth: 200 },
          transform: { position: { x: -75, y: -0.15, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: {
            color: '#0284c7',
            emissive: '#0369a1',
            emissiveIntensity: 0.25,
            metalness: 0.9,
            roughness: 0.08,
            transparent: true,
            opacity: 0.88
          },
          physics: { enabled: false }
        },

        // 3. Sandy Coastal Shoreline Promenade
        {
          name: 'Tropical Beach Sand Strip',
          tag: 'solid',
          shape: 'plane',
          dimensions: { width: 40, depth: 200 },
          transform: { position: { x: -28, y: -0.05, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#c29b68', metalness: 0.05, roughness: 0.95 },
          physics: { enabled: true, type: 'static' }
        },

        // 4. Player Hero (Can Walk, Shoot Blaster, and Press [F] to Drive Supercars)
        {
          name: 'Protagonist (Vice City Legend)',
          tag: 'player',
          shape: 'character',
          dimensions: { radius: 0.6, height: 1.8 },
          transform: { position: { x: -1.5, y: 1.0, z: 4.0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
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
            { type: 'characterController3D', speed: 9.0, jumpForce: 10.0 },
            { type: 'cameraFollow3D', distance: 6.5, height: 3.2, smooth: 0.12 }
          ]
        },

        // 5. Drivable Supercar 1: Pegassi Infernus (Electric Cyan)
        {
          name: 'Pegassi Infernus (Supercar)',
          tag: 'vehicle',
          shape: 'vehicle',
          dimensions: { width: 2.2, height: 1.2, depth: 4.6 },
          transform: { position: { x: 2.4, y: 0.1, z: 2.2 }, rotation: { x: 0, y: 12, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: {
            color: '#00d2ff',
            metalness: 0.96,
            roughness: 0.12,
            castShadow: true
          },
          physics: { enabled: true, type: 'kinematic', mass: 1400 }
        },

        // 6. Drivable Supercar 2: Grotti Turismo (Neon Crimson)
        {
          name: 'Grotti Turismo (V8 Coupe)',
          tag: 'vehicle',
          shape: 'vehicle',
          dimensions: { width: 2.2, height: 1.2, depth: 4.6 },
          transform: { position: { x: -3.5, y: 0.1, z: 32.0 }, rotation: { x: 0, y: 180, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: {
            color: '#ff1744',
            metalness: 0.96,
            roughness: 0.12,
            castShadow: true
          },
          physics: { enabled: true, type: 'kinematic', mass: 1350 }
        },

        // 7. Tropical Coconut Palm Trees (Median & Shoreline)
        {
          name: 'Coastal Palm Tree 1',
          tag: 'palm_tree',
          shape: 'palm_tree',
          dimensions: { height: 7.2 },
          transform: { position: { x: -7.5, y: 0, z: -35 }, rotation: { x: 0, y: 25, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        },
        {
          name: 'Coastal Palm Tree 2',
          tag: 'palm_tree',
          shape: 'palm_tree',
          dimensions: { height: 7.6 },
          transform: { position: { x: -7.5, y: 0, z: -10 }, rotation: { x: 0, y: 70, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        },
        {
          name: 'Coastal Palm Tree 3',
          tag: 'palm_tree',
          shape: 'palm_tree',
          dimensions: { height: 7.0 },
          transform: { position: { x: -7.5, y: 0, z: 15 }, rotation: { x: 0, y: 140, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        },
        {
          name: 'Coastal Palm Tree 4',
          tag: 'palm_tree',
          shape: 'palm_tree',
          dimensions: { height: 7.8 },
          transform: { position: { x: -7.5, y: 0, z: 40 }, rotation: { x: 0, y: 210, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        },
        {
          name: 'Coastal Palm Tree 5',
          tag: 'palm_tree',
          shape: 'palm_tree',
          dimensions: { height: 7.3 },
          transform: { position: { x: -7.5, y: 0, z: 65 }, rotation: { x: 0, y: 310, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        },
        {
          name: 'Sidewalk Palm Tree 6',
          tag: 'palm_tree',
          shape: 'palm_tree',
          dimensions: { height: 6.8 },
          transform: { position: { x: 8.5, y: 0, z: -20 }, rotation: { x: 0, y: 45, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        },
        {
          name: 'Sidewalk Palm Tree 7',
          tag: 'palm_tree',
          shape: 'palm_tree',
          dimensions: { height: 7.4 },
          transform: { position: { x: 8.5, y: 0, z: 30 }, rotation: { x: 0, y: 180, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        },

        // 8. Art-Deco Miami Neon Hotels
        {
          name: 'Hotel Vice (South Beach Art-Deco)',
          tag: 'building',
          shape: 'building',
          dimensions: { width: 14, height: 18, depth: 12 },
          transform: { position: { x: 19.0, y: 0, z: -25 }, rotation: { x: 0, y: -90, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#e11d48', metalness: 0.15, roughness: 0.6 },
          physics: { enabled: true, type: 'static' }
        },
        {
          name: 'Ocean Royale Suites (Neon Hotel)',
          tag: 'building',
          shape: 'building',
          dimensions: { width: 16, height: 22, depth: 12 },
          transform: { position: { x: 19.0, y: 0, z: 10 }, rotation: { x: 0, y: -90, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#0284c7', metalness: 0.15, roughness: 0.6 },
          physics: { enabled: true, type: 'static' }
        },
        {
          name: 'The Flamingo Palms Resort',
          tag: 'building',
          shape: 'building',
          dimensions: { width: 14, height: 16, depth: 12 },
          transform: { position: { x: 19.0, y: 0, z: 45 }, rotation: { x: 0, y: -90, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#db2777', metalness: 0.15, roughness: 0.6 },
          physics: { enabled: true, type: 'static' }
        },

        // 9. Street Light Lampposts (Illuminating the Highway)
        {
          name: 'Highway Street Light 1',
          tag: 'street_light',
          shape: 'box',
          dimensions: { width: 1, height: 6.5, depth: 1 },
          transform: { position: { x: 8.2, y: 0, z: -10 }, rotation: { x: 0, y: 180, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        },
        {
          name: 'Highway Street Light 2',
          tag: 'street_light',
          shape: 'box',
          dimensions: { width: 1, height: 6.5, depth: 1 },
          transform: { position: { x: 8.2, y: 0, z: 25 }, rotation: { x: 0, y: 180, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        },
        {
          name: 'Coastal Street Light 3',
          tag: 'street_light',
          shape: 'box',
          dimensions: { width: 1, height: 6.5, depth: 1 },
          transform: { position: { x: -8.2, y: 0, z: -25 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        },
        {
          name: 'Coastal Street Light 4',
          tag: 'street_light',
          shape: 'box',
          dimensions: { width: 1, height: 6.5, depth: 1 },
          transform: { position: { x: -8.2, y: 0, z: 15 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }
        },

        // 10. Dynamic Physics Traffic Cones (Hit them with cars!)
        {
          name: 'Traffic Safety Cone 1',
          tag: 'cone',
          shape: 'traffic_cone',
          dimensions: { width: 0.6, height: 0.85, depth: 0.6 },
          transform: { position: { x: 0.5, y: 0, z: 18 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          physics: { enabled: true, type: 'dynamic', mass: 0.3, friction: 0.4 }
        },
        {
          name: 'Traffic Safety Cone 2',
          tag: 'cone',
          shape: 'traffic_cone',
          dimensions: { width: 0.6, height: 0.85, depth: 0.6 },
          transform: { position: { x: -1.0, y: 0, z: 21 }, rotation: { x: 0, y: 15, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          physics: { enabled: true, type: 'dynamic', mass: 0.3, friction: 0.4 }
        },
        {
          name: 'Traffic Safety Cone 3',
          tag: 'cone',
          shape: 'traffic_cone',
          dimensions: { width: 0.6, height: 0.85, depth: 0.6 },
          transform: { position: { x: 1.8, y: 0, z: 24 }, rotation: { x: 0, y: -20, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          physics: { enabled: true, type: 'dynamic', mass: 0.3, friction: 0.4 }
        },

        // 11. Explosive Hazard Barrels on the roadside
        {
          name: 'Hazard Fuel Barrel 1',
          tag: 'barrel',
          shape: 'cylinder',
          dimensions: { radius: 0.7, radiusTop: 0.7, radiusBottom: 0.7, height: 1.8 },
          transform: { position: { x: 5.5, y: 0.9, z: 38 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#ef4444', metalness: 0.8, roughness: 0.3 },
          physics: { enabled: true, type: 'dynamic', mass: 1.5, restitution: 0.3 }
        },
        {
          name: 'Hazard Fuel Barrel 2',
          tag: 'barrel',
          shape: 'cylinder',
          dimensions: { radius: 0.7, radiusTop: 0.7, radiusBottom: 0.7, height: 1.8 },
          transform: { position: { x: -5.5, y: 0.9, z: -20 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: { color: '#ef4444', metalness: 0.8, roughness: 0.3 },
          physics: { enabled: true, type: 'dynamic', mass: 1.5, restitution: 0.3 }
        }
      ]
    };
  },

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

        // High Floating Neon Battle Fortress (Unreal Engine 4 Sci-Fi Architecture)
        {
          name: 'Floating Neon Arena',
          tag: 'arena',
          shape: 'box',
          dimensions: { width: 14, height: 1.0, depth: 14 },
          transform: { position: { x: 0, y: 3.5, z: -8 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } },
          material: {
            color: '#151e2e',
            metalness: 0.92,
            roughness: 0.18,
            emissive: '#00f0ff',
            emissiveIntensity: 0.2,
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
