import test from 'node:test';
import assert from 'node:assert/strict';
import { findApproachingPlanet } from '../src/approach.js';

const ship = { x: 0, y: 0, z: 0 };
const forward = { x: 0, y: 0, z: -1 };

test('approach alert selects a close world in front of the ship', () => {
  const planet = { id: 'uranus', radius: 100, position: { x: 0, y: 0, z: -4900 } };
  const result = findApproachingPlanet([planet], ship, forward);

  assert.equal(result.planet, planet);
  assert.equal(result.surfaceDistance, 4800);
});

test('approach alert ignores distant worlds and worlds outside the aiming cone', () => {
  const distant = { id: 'mars', radius: 100, position: { x: 0, y: 0, z: -5201 } };
  const offAxis = { id: 'venus', radius: 100, position: { x: 1700, y: 0, z: -4900 } };

  assert.equal(findApproachingPlanet([distant, offAxis], ship, forward), null);
});

test('the current target stays selected briefly while another world is closer', () => {
  const current = { id: 'jupiter', radius: 100, position: { x: 0, y: 0, z: -5800 } };
  const closer = { id: 'mars', radius: 100, position: { x: 0, y: 0, z: -3000 } };
  const result = findApproachingPlanet([closer, current], ship, forward, 'jupiter');

  assert.equal(result.planet, current);
  assert.equal(result.surfaceDistance, 5700);
});
