import * as THREE from 'three';

export function createShip() {
  const ship = new THREE.Group();
  const hull = new THREE.MeshStandardMaterial({ color: 0xc9d4cf, metalness: 0.65, roughness: 0.36 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x25353e, metalness: 0.7, roughness: 0.38 });
  const trim = new THREE.MeshStandardMaterial({ color: 0xda804f, metalness: 0.4, roughness: 0.4 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x16303e, metalness: 0.85, roughness: 0.14, emissive: 0x164957, emissiveIntensity: 0.4 });
  const light = new THREE.MeshBasicMaterial({ color: 0x99ffe8 });

  function mesh(geometry, material, position, scale) {
    const part = new THREE.Mesh(geometry, material);
    part.position.set(...position);
    if (scale) part.scale.set(...scale);
    ship.add(part);
    return part;
  }

  // Local -Z is the nose; the tapered hull and swept wings are procedural geometry.
  const body = mesh(new THREE.ConeGeometry(1.35, 8, 6), hull, [0, 0, -0.6], [1, 1, 0.65]);
  body.rotation.x = -Math.PI / 2;
  mesh(new THREE.SphereGeometry(1, 20, 12), glass, [0, 0.62, -1.1], [0.64, 0.44, 1.9]);
  mesh(new THREE.BoxGeometry(1.7, 0.65, 3.6), dark, [0, -0.22, 1.4]);
  for (const side of [-1, 1]) {
    const shape = new THREE.Shape();
    shape.moveTo(0.6 * side, -2.3);
    shape.lineTo(5.6 * side, 2.8);
    shape.lineTo(5.4 * side, 3.65);
    shape.lineTo(0.65 * side, 2.3);
    shape.closePath();
    const wing = mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 1 }), hull, [0, 0, 0]);
    wing.rotation.x = Math.PI / 2;
    mesh(new THREE.BoxGeometry(0.3, 0.18, 2.3), trim, [side * 3.7, 0.13, 2.05]);
    const engine = mesh(new THREE.CylinderGeometry(0.46, 0.52, 3.2, 12), dark, [side * 1.65, 0, 1.55]);
    engine.rotation.x = Math.PI / 2;
    const nozzle = mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.12, 16), light, [side * 1.65, 0, 3.2]);
    nozzle.rotation.x = Math.PI / 2;
    mesh(new THREE.BoxGeometry(0.12, 0.12, 0.65), light, [side * 5.25, 0, 3]);
    const fin = mesh(new THREE.BoxGeometry(0.13, 1.15, 1.7), dark, [side * 1.6, 0.7, 2]);
    fin.rotation.z = side * -0.25;
  }

  const exhaust = [];
  for (const side of [-1, 1]) {
    const plume = mesh(new THREE.ConeGeometry(0.32, 3.6, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0x7affdb, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), [side * 1.65, 0, 5]);
    plume.rotation.x = Math.PI / 2;
    exhaust.push(plume);
  }
  return { ship, exhaust };
}
