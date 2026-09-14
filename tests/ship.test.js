import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createShip } from '../src/ship.js';

test('mobile glass keeps the pilot visible without a scene transmission pass', () => {
  const { ship } = createShip({ lowQuality: true });
  const glass = ship.getObjectByName('Cockpit canopy').material;
  assert.equal(glass.transmission, 0);
  assert.equal(glass.transparent, true);
  assert.ok(glass.opacity < 1);
  assert.ok(ship.getObjectByName('Pilot suit'));
});

test('ship includes a cockpit, shaped fuselage, swept wings, and paired engines', () => {
  const { ship, exhaust } = createShip();

  assert.ok(ship.getObjectByName('Fuselage').geometry instanceof THREE.BufferGeometry);
  assert.ok(ship.getObjectByName('Cockpit canopy').material instanceof THREE.MeshPhysicalMaterial);
  assert.ok(ship.getObjectByName('Port wing'));
  assert.ok(ship.getObjectByName('Starboard wing'));
  assert.ok(ship.getObjectByName('Port engine nacelle'));
  assert.ok(ship.getObjectByName('Starboard engine nacelle'));
  assert.equal(exhaust.length, 2);
  assert.ok(exhaust.every((plume) => plume.rotation.x > 0));
});

test('engine flames turn warm under thrust and red-orange while boosting', () => {
  const { exhaust, updateEngineFlames } = createShip();

  updateEngineFlames({ active: false });
  assert.equal(exhaust[0].material.color.getHex(), 0x7affdb);
  updateEngineFlames({ active: true, throttle: 0 });
  assert.equal(exhaust[0].material.color.getHex(), 0x7affdb);

  updateEngineFlames({ active: true, throttle: 0.32 });
  const thrustColor = exhaust[0].material.color.clone();
  assert.equal(thrustColor.getHex(), 0xff642d);
  assert.equal(exhaust[0].material.toneMapped, false);
  assert.equal(exhaust[0].material.color.getHex(), exhaust[1].material.color.getHex());

  updateEngineFlames({ active: true, throttle: 1, boosting: true });
  const boostColor = exhaust[0].material.color.clone();
  assert.ok(boostColor.r > boostColor.g && boostColor.g > boostColor.b);
  assert.ok(boostColor.g < thrustColor.g);
});

test('pilot customization updates the cockpit astronaut and optional gear', () => {
  const { ship, updateAstronaut } = createShip();
  const suit = ship.getObjectByName('Pilot suit');
  const antenna = ship.getObjectByName('Pilot antenna');
  const halo = ship.getObjectByName('Pilot halo');

  updateAstronaut();
  assert.equal(antenna.visible, false);
  assert.equal(halo.visible, false);
  updateAstronaut({ suitColor: '#45aabb', antenna: true, halo: true });
  assert.equal(suit.material.color.getHexString(), '45aabb');
  assert.equal(antenna.visible, true);
  assert.equal(halo.visible, true);
});
