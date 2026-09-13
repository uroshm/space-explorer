import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createShip } from '../src/ship.js';

test('ship includes a cockpit, shaped fuselage, swept wings, and paired engines', () => {
  const { ship, exhaust } = createShip();

  assert.ok(ship.getObjectByName('Fuselage').geometry instanceof THREE.BufferGeometry);
  assert.ok(ship.getObjectByName('Cockpit canopy').material instanceof THREE.MeshPhysicalMaterial);
  assert.ok(ship.getObjectByName('Port wing'));
  assert.ok(ship.getObjectByName('Starboard wing'));
  assert.ok(ship.getObjectByName('Port engine nacelle'));
  assert.ok(ship.getObjectByName('Starboard engine nacelle'));
  assert.equal(exhaust.length, 2);
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
