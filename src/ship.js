import * as THREE from 'three';

function createHullGeometry() {
  const sections = [
    [-7.4, 0.04, 0.08],
    [-6.1, 0.48, 0.32],
    [-4.2, 0.92, 0.57],
    [-1.8, 1.25, 0.76],
    [0.8, 1.4, 0.82],
    [3.3, 1.22, 0.62],
    [5.1, 0.78, 0.42],
  ];
  const sides = 8;
  const positions = [];
  const indices = [];

  for (const [z, width, height] of sections) {
    for (let side = 0; side < sides; side++) {
      const angle = (side / sides) * Math.PI * 2 + Math.PI / 8;
      positions.push(Math.cos(angle) * width, Math.sin(angle) * height, z);
    }
  }

  const noseCenter = positions.length / 3;
  positions.push(0, 0, sections[0][0]);
  const tailCenter = positions.length / 3;
  positions.push(0, 0, sections.at(-1)[0]);

  for (let section = 0; section < sections.length - 1; section++) {
    for (let side = 0; side < sides; side++) {
      const a = section * sides + side;
      const b = section * sides + ((side + 1) % sides);
      const c = (section + 1) * sides + ((side + 1) % sides);
      const d = (section + 1) * sides + side;
      indices.push(a, b, d, b, c, d);
    }
  }
  const tailStart = (sections.length - 1) * sides;
  for (let side = 0; side < sides; side++) {
    const next = (side + 1) % sides;
    indices.push(noseCenter, next, side);
    indices.push(tailCenter, tailStart + side, tailStart + next);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createShip() {
  const ship = new THREE.Group();
  const hull = new THREE.MeshStandardMaterial({
    color: 0xaebfc0,
    metalness: 0.58,
    roughness: 0.32,
  });
  const underside = new THREE.MeshStandardMaterial({
    color: 0x26383f,
    metalness: 0.68,
    roughness: 0.4,
  });
  const copper = new THREE.MeshStandardMaterial({
    color: 0xc9794e,
    metalness: 0.48,
    roughness: 0.36,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x64b4ba,
    metalness: 0.3,
    roughness: 0.12,
    transmission: 0.18,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
    clearcoat: 0.9,
    clearcoatRoughness: 0.12,
  });
  const navLight = new THREE.MeshBasicMaterial({ color: 0xb2ffe8 });
  const engineGlow = new THREE.MeshBasicMaterial({ color: 0x86ffe2 });
  const idleFlameColor = new THREE.Color(0x7affdb);
  const thrustFlameColor = new THREE.Color(0xff642d);
  const boostFlameColor = new THREE.Color(0xff2c1a);
  const currentFlameColor = new THREE.Color();

  function addMesh(geometry, material, position, scale) {
    const part = new THREE.Mesh(geometry, material);
    part.position.set(...position);
    if (scale) part.scale.set(...scale);
    ship.add(part);
    return part;
  }

  // A faceted tapered hull gives the craft a clear nose-to-engine silhouette.
  const fuselage = addMesh(createHullGeometry(), hull, [0, 0, 0]);
  fuselage.name = 'Fuselage';
  addMesh(new THREE.BoxGeometry(1.18, 0.2, 7.2), underside, [0, -0.56, 0.45]);
  addMesh(new THREE.BoxGeometry(0.25, 0.1, 4.3), copper, [0, 0.78, -2.0]);

  // Swept wings and paired engine nacelles make it read as a long-range craft.
  for (const side of [-1, 1]) {
    const wingShape = new THREE.Shape();
    wingShape.moveTo(side * 0.95, -1.7);
    wingShape.lineTo(side * 4.55, 0.15);
    wingShape.lineTo(side * 5.6, 3.0);
    wingShape.lineTo(side * 5.0, 3.65);
    wingShape.lineTo(side * 2.0, 2.9);
    wingShape.lineTo(side * 1.05, 1.8);
    wingShape.closePath();
    const wing = addMesh(
      new THREE.ExtrudeGeometry(wingShape, {
        depth: 0.3,
        bevelEnabled: true,
        bevelSize: 0.12,
        bevelThickness: 0.08,
        bevelSegments: 2,
      }),
      hull,
      [0, 0.15, 0],
    );
    wing.name = side < 0 ? 'Port wing' : 'Starboard wing';
    wing.rotation.x = Math.PI / 2;

    const stripe = addMesh(new THREE.BoxGeometry(0.12, 0.055, 2.2), copper, [
      side * 3.55,
      0.2,
      2.35,
    ]);
    stripe.rotation.y = side * -0.38;
    addMesh(new THREE.SphereGeometry(0.1, 10, 8), navLight, [side * 5.0, 0.2, 2.9]);

    const nacelle = addMesh(new THREE.CylinderGeometry(0.39, 0.52, 4.4, 16), underside, [
      side * 1.55,
      -0.1,
      2.65,
    ]);
    nacelle.name = side < 0 ? 'Port engine nacelle' : 'Starboard engine nacelle';
    nacelle.rotation.x = Math.PI / 2;
    const frontCollar = addMesh(new THREE.CylinderGeometry(0.45, 0.45, 0.18, 16), copper, [
      side * 1.55,
      -0.1,
      0.5,
    ]);
    frontCollar.rotation.x = Math.PI / 2;
    const rearCollar = addMesh(new THREE.CylinderGeometry(0.46, 0.46, 0.2, 16), hull, [
      side * 1.55,
      -0.1,
      4.8,
    ]);
    rearCollar.rotation.x = Math.PI / 2;
    addMesh(new THREE.CircleGeometry(0.3, 16), engineGlow, [side * 1.55, -0.1, 4.91]);
  }

  // Keep the customizable pilot, now seated inside the cockpit.
  const astronaut = new THREE.Group();
  astronaut.name = 'Astronaut';
  const astronautSuit = new THREE.MeshStandardMaterial({
    color: 0xd8784f,
    roughness: 0.58,
    metalness: 0.08,
  });
  const astronautTrim = new THREE.MeshStandardMaterial({
    color: 0xb7ead4,
    emissive: 0x173b34,
    roughness: 0.3,
  });
  const helmetGlass = new THREE.MeshStandardMaterial({
    color: 0x8cebd8,
    emissive: 0x164957,
    emissiveIntensity: 0.5,
    metalness: 0.45,
    roughness: 0.18,
  });
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), helmetGlass);
  helmet.position.set(0, 0.74, -1.35);
  astronaut.add(helmet);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.32, 4, 8), astronautSuit);
  torso.name = 'Pilot suit';
  torso.position.set(0, 0.25, -1.08);
  torso.rotation.x = -0.18;
  astronaut.add(torso);
  const chestPanel = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.035), astronautTrim);
  chestPanel.position.set(0, 0.33, -0.82);
  astronaut.add(chestPanel);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.6, 0.24), underside);
  seat.position.set(0, 0.12, -0.92);
  astronaut.add(seat);

  const antenna = new THREE.Group();
  antenna.name = 'Pilot antenna';
  antenna.position.set(0.17, 0.98, -1.35);
  const antennaStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.025, 0.16, 6),
    astronautTrim,
  );
  antennaStem.position.y = 0.07;
  antenna.add(antennaStem);
  const antennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), navLight);
  antennaTip.position.y = 0.15;
  antenna.add(antennaTip);
  astronaut.add(antenna);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(0.35, 0.022, 6, 24),
    new THREE.MeshBasicMaterial({ color: 0xc9a7ff, transparent: true, opacity: 0.9 }),
  );
  halo.name = 'Pilot halo';
  halo.position.set(0, 0.74, -1.35);
  halo.rotation.x = Math.PI / 2.5;
  astronaut.add(halo);
  ship.add(astronaut);

  const canopy = addMesh(
    new THREE.SphereGeometry(1, 32, 24),
    glass,
    [0, 0.56, -1.25],
    [0.7, 0.5, 1.25],
  );
  canopy.name = 'Cockpit canopy';
  canopy.renderOrder = 1;
  const canopyFrame = addMesh(
    new THREE.TorusGeometry(0.67, 0.035, 8, 32),
    copper,
    [0, 0.42, -1.25],
  );
  canopyFrame.scale.set(1, 0.7, 1);

  function updateAstronaut({
    suitColor = '#d8784f',
    antenna: hasAntenna = false,
    halo: hasHalo = false,
  } = {}) {
    astronautSuit.color.set(suitColor);
    antenna.visible = hasAntenna;
    halo.visible = hasHalo;
  }

  const exhaust = [];
  for (const side of [-1, 1]) {
    const plume = addMesh(
      new THREE.ConeGeometry(0.42, 3.2, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: idleFlameColor,
        transparent: true,
        opacity: 0.48,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      [side * 1.55, -0.1, 6.35],
    );
    plume.rotation.x = Math.PI / 2;
    exhaust.push(plume);
  }

  function updateEngineFlames({ throttle = 0, boosting = false, active = false } = {}) {
    const thrustMix = active ? 0.45 + THREE.MathUtils.clamp(throttle, 0, 1) * 0.55 : 0;
    currentFlameColor.copy(idleFlameColor).lerp(thrustFlameColor, thrustMix);
    if (boosting) currentFlameColor.lerp(boostFlameColor, 0.72);
    exhaust.forEach((plume) => plume.material.color.copy(currentFlameColor));
  }

  return { ship, exhaust, updateAstronaut, updateEngineFlames };
}
