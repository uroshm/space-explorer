import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { Flight } from '../src/flight.js';
import { advanceFlight } from '../src/flight-timing.js';

function simulate(fps) {
  const flight = new Flight();
  for (let frame = 0; frame < fps * 4; frame++) {
    advanceFlight(flight, 1 / fps, { thrust: 1, boost: true });
  }
  return flight;
}

test('flight distance, throttle, and boost stay consistent at 2, 5, 10, and 60 fps', () => {
  const reference = simulate(60);
  for (const fps of [2, 5, 10]) {
    const flight = simulate(fps);
    assert.ok(flight.position.distanceTo(reference.position) < 0.01);
    assert.ok(Math.abs(flight.energy - reference.energy) < 0.001);
    assert.equal(flight.throttle, reference.throttle);
  }
});

test('slow frames still check collisions and discoveries between rendered positions', () => {
  const flight = new Flight();
  flight.speed = 1200;
  const obstacle = { position: new Vector3(0, 0, -150), radius: 40 };
  let collided = false;
  let passedBeacon = false;
  advanceFlight(flight, 0.2, { boost: true }, () => {
    if (Math.abs(flight.position.z + 60) < 15) passedBeacon = true;
    collided = flight.resolveCollisions([obstacle]) || collided;
  });
  assert.equal(passedBeacon, true);
  assert.equal(collided, true);
  assert.ok(flight.position.z > obstacle.position.z);
});

test('catch-up remains bounded after a long stall and ignores invalid intervals', () => {
  const flight = new Flight();
  let elapsed = 0;
  let steps = 0;
  advanceFlight(flight, 10, {}, (dt) => {
    elapsed += dt;
    steps++;
  });
  assert.ok(elapsed <= 0.5 + 1e-9);
  assert.ok(steps <= 30);
  const before = flight.position.clone();
  for (const interval of [NaN, Infinity, -1, 0]) advanceFlight(flight, interval, {});
  assert.deepEqual(flight.position, before);
});
