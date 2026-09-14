import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveBodies } from '../src/bodies.js';

const catalog = JSON.parse(readFileSync(new URL('../src/data/bodies.json', import.meta.url)));

test('shipped catalog preserves body positions and diameters', () => {
  const bodies = resolveBodies(catalog);
  assert.equal(bodies.length, 14);
  assert.deepEqual(
    catalog.map((body) => body.id),
    [
      'mercury',
      'venus',
      'earth',
      'moon',
      'mars',
      'ceres',
      'jupiter',
      'saturn',
      'uranus',
      'neptune',
      'pluto',
      'haumea',
      'makemake',
      'eris',
    ],
  );
  assert.deepEqual(bodies[0].position, [0, 0, -2600]);
  assert.equal(bodies[0].diameter, 380);
});

test('moons resolve parent offsets regardless of catalog order without mutating input', () => {
  const moon = {
    ...catalog.find((body) => body.id === 'moon'),
    parent: 'saturn',
    position: [2300, 300, 0],
  };
  const [resolved] = resolveBodies([moon, catalog.find((body) => body.id === 'saturn')]);
  assert.deepEqual(resolved.position, [-900, -150, -57500]);
  assert.deepEqual(moon.position, [2300, 300, 0]);
});

test('invalid catalogs fail with useful errors', () => {
  assert.throws(() => resolveBodies([catalog[0], catalog[0]]), /unique/);
  assert.throws(() => resolveBodies([{ ...catalog[0], diameter: -1 }]), /diameter/);
  const moon = catalog.find((body) => body.id === 'moon');
  assert.throws(() => resolveBodies([{ ...moon, parent: 'missing' }]), /unknown parent/);
  assert.throws(() => resolveBodies([{ ...moon, parent: 'moon' }]), /circular/);
  assert.throws(
    () => resolveBodies([{ ...catalog[0], features: { spot: { color: 'red' } } }]),
    /spot needs/,
  );
});

test('ordered catalog includes Mercury through the outer dwarf planets', () => {
  const bodies = resolveBodies(catalog);
  assert.deepEqual(
    bodies.map((body) => body.id),
    [
      'mercury',
      'venus',
      'earth',
      'moon',
      'mars',
      'ceres',
      'jupiter',
      'saturn',
      'uranus',
      'neptune',
      'pluto',
      'haumea',
      'makemake',
      'eris',
    ],
  );
  assert.equal(catalog.find((body) => body.id === 'moon').parent, 'earth');
  assert.deepEqual(bodies.find((body) => body.id === 'moon').position, [-850, -30, -17000]);
  assert.equal(bodies.find((body) => body.id === 'jupiter').features.spot.color, '#bd3926');
  assert.ok(
    bodies.find((body) => body.id === 'jupiter').diameter >
      bodies.find((body) => body.id === 'earth').diameter * 5,
  );
  for (const body of bodies) {
    for (const other of bodies) {
      if (body.id === other.id) continue;
      const distance = Math.hypot(
        ...body.position.map((value, axis) => value - other.position[axis]),
      );
      assert.ok(
        distance > (body.diameter + other.diameter) / 2,
        `${body.name} overlaps ${other.name}`,
      );
    }
  }
});

test('storm features and Saturn rings are configured', () => {
  const bodies = resolveBodies(catalog);
  const saturn = bodies.find((body) => body.id === 'saturn');
  const neptune = bodies.find((body) => body.id === 'neptune');
  assert.ok(saturn.features.rings.innerRadius > saturn.diameter / 2);
  assert.equal(saturn.features.spot, undefined);
  assert.equal(neptune.features.spot, undefined);
  for (const body of bodies) {
    assert.equal(body.features.spot !== undefined, body.id === 'jupiter');
  }
});
