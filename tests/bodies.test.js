import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveBodies } from '../src/bodies.js';

const catalog = JSON.parse(readFileSync(new URL('../src/data/bodies.json', import.meta.url)));

test('shipped catalog preserves body positions and diameters', () => {
  const bodies = resolveBodies(catalog);
  assert.equal(bodies.length, 12);
  assert.deepEqual(bodies[0].position, [3300, 840, -6200]);
  assert.equal(bodies[0].diameter, 2000);
});

test('moons resolve parent offsets regardless of catalog order without mutating input', () => {
  const moon = { ...catalog[2], parent: 'saturn', position: [2300, 300, 0] };
  const [resolved] = resolveBodies([moon, catalog[0]]);
  assert.deepEqual(resolved.position, [5600, 1140, -6200]);
  assert.deepEqual(moon.position, [2300, 300, 0]);
});

test('invalid catalogs fail with useful errors', () => {
  assert.throws(() => resolveBodies([catalog[0], catalog[0]]), /unique/);
  assert.throws(() => resolveBodies([{ ...catalog[0], diameter: -1 }]), /diameter/);
  assert.throws(() => resolveBodies([{ ...catalog[2], parent: 'missing' }]), /unknown parent/);
  assert.throws(() => resolveBodies([{ ...catalog[2], parent: 'moon' }]), /circular/);
  assert.throws(() => resolveBodies([{ ...catalog[0], features: { spot: { color: 'red' } } }]), /spot needs/);
});


test('requested worlds are present with Earth’s moon and Jupiter’s spot', () => {
  const bodies = resolveBodies(catalog);
  for (const id of ['earth', 'mars', 'moon', 'neptune', 'saturn', 'ceres', 'pluto', 'haumea', 'makemake', 'eris', 'jupiter', 'uranus']) {
    assert.ok(bodies.some((body) => body.id === id), `Missing ${id}`);
  }
  assert.equal(catalog.find((body) => body.id === 'moon').parent, 'earth');
  assert.deepEqual(bodies.find((body) => body.id === 'moon').position, [-4050, -1380, -6000]);
  assert.equal(bodies.find((body) => body.id === 'jupiter').features.spot.color, '#bd3926');
  for (const body of bodies) {
    for (const other of bodies) {
      if (body.id === other.id) continue;
      const distance = Math.hypot(...body.position.map((value, axis) => value - other.position[axis]));
      assert.ok(distance > (body.diameter + other.diameter) / 2, `${body.name} overlaps ${other.name}`);
    }
  }
});


test('storm features and Saturn rings are configured', () => {
  const bodies = resolveBodies(catalog);
  const saturn = bodies.find((body) => body.id === 'saturn');
  const neptune = bodies.find((body) => body.id === 'neptune');
  assert.equal(saturn.features.spot.color, '#774323');
  assert.ok(saturn.features.rings.innerRadius > saturn.diameter / 2);
  assert.equal(neptune.features.spot.color, '#092a85');
});
