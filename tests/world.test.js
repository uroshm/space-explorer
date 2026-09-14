import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import bodyCatalog from '../src/data/bodies.json' with { type: 'json' };
import { resolveBodies } from '../src/bodies.js';
import { Flight } from '../src/flight.js';
import { createWorld } from '../src/world.js';
import { COMET_LIFETIME, createCometSchedule } from '../src/world-timing.js';

test('world creates the Sun, ordered planet flybys, and a reduced asteroid field', () => {
  const scene = new THREE.Scene();
  const world = createWorld(scene);

  assert.deepEqual(
    world.planets.map((planet) => planet.id),
    [
      'sun',
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
  assert.deepEqual(
    world.destinations
      .filter(
        (destination) =>
          destination.type === 'Planetary observation' ||
          destination.type === 'Dwarf planet observation',
      )
      .map((destination) => destination.id),
    [
      'mercury',
      'venus',
      'earth',
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
  assert.ok(world.destinations.some((destination) => destination.id === 'solar-flyby'));
  assert.equal(
    scene.children.find((child) => child.isInstancedMesh)?.count,
    25,
    'asteroid count stays at one quarter of the former 100',
  );
});

test('planet, moon, and dwarf-planet destinations have no floating ring markers', () => {
  const scene = new THREE.Scene();
  const world = createWorld(scene);
  const celestialDestinations = world.destinations.filter((destination) =>
    world.planets.some((body) => body.id === destination.id && body.type !== 'star'),
  );

  assert.ok(celestialDestinations.length > 0);
  assert.ok(celestialDestinations.every((destination) => destination.mesh === null));
  assert.ok(world.destinations.find((destination) => destination.id === 'first-signal').mesh);
  assert.doesNotThrow(() => world.update(0, 0, new THREE.Vector3()));
});

test('starfield varies star sizes without changing the total star count', () => {
  const scene = new THREE.Scene();
  createWorld(scene);
  const starPoints = [];
  scene.traverse((object) => {
    if (object.isPoints && object.material.sizeAttenuation === false) starPoints.push(object);
  });

  assert.deepEqual(
    starPoints.map(({ material }) => material.size).sort((a, b) => a - b),
    [1.7, 2.2, 2.8],
  );
  assert.equal(
    starPoints.reduce((count, stars) => count + stars.geometry.attributes.position.count, 0),
    6500,
  );
});

test('distant comet appears, fades, and returns on its randomized schedule', () => {
  const scene = new THREE.Scene();
  const world = createWorld(scene);
  const comet = scene.getObjectByName('Distant comet');
  const position = new THREE.Vector3();

  assert.ok(comet);
  world.update(0, 60, position);
  assert.equal(comet.visible, true);
  world.update(0, 60 + COMET_LIFETIME / 2, position);
  assert.ok(comet.children[0].material.opacity > 0);
  world.update(0, 62, position);
  assert.equal(comet.visible, false);
  world.update(0, 123, position);
  assert.equal(comet.visible, true);
});

test('solar bodies follow a staggered outward route with the Sun behind the starting point', () => {
  const scene = new THREE.Scene();
  const world = createWorld(scene);
  const sourceBodies = resolveBodies(bodyCatalog);
  const ship = new Flight();

  const sun = world.planets.find((body) => body.id === 'sun');
  const mercury = world.planets.find((body) => body.id === 'mercury');
  assert.ok(sun.position.z > ship.position.z);
  assert.ok(mercury.position.z < ship.position.z);

  const orbitalOrder = [
    'mercury',
    'venus',
    'earth',
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
  ];
  const placedBodies = orbitalOrder.map((id) => world.planets.find((body) => body.id === id));
  for (let index = 0; index < placedBodies.length; index++) {
    const placed = placedBodies[index];
    const source = sourceBodies.find((body) => body.id === placed.id);
    assert.equal(placed.radius, source.diameter / 2);
    if (index > 0) {
      const previous = placedBodies[index - 1];
      assert.ok(
        placed.position.z < previous.position.z,
        `${placed.id} should follow ${previous.id}`,
      );
      assert.ok(
        placed.position.distanceTo(previous.position) < 13000,
        'consecutive bodies stay within reasonable travel distances',
      );
    }
  }
  assert.ok(
    placedBodies.some((body) => Math.hypot(body.position.x, body.position.y) > 3000),
    'route should not be a straight line',
  );
  assert.ok(
    placedBodies.at(-1).position.length() < 120000,
    'outer route stays short of full astronomical scale',
  );
});

test('comet intervals begin after 35–60 seconds and repeat every 30–60 seconds', () => {
  const randomValues = [0.5, 0.25];
  const schedule = createCometSchedule(() => randomValues.shift());
  assert.equal(schedule.isDue(47.49), false);
  assert.equal(schedule.isDue(47.5), true);
  schedule.reschedule(80);
  assert.equal(schedule.isDue(117.49), false);
  assert.equal(schedule.isDue(117.5), true);
});
