import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { Flight, BOOST_SPEED, CRUISE_SPEED } from '../src/flight.js';

function simulate(flight, seconds, input = {}, fps = 60) {
  for (let i = 0; i < seconds * fps; i++) flight.update(1 / fps, input);
}

test('boost consumes energy, locks when depleted, and recharges', () => {
  const flight = new Flight();
  simulate(flight, 10, { boost: true });
  assert.ok(flight.speed > CRUISE_SPEED);
  assert.ok(flight.speed <= BOOST_SPEED);
  assert.ok(Math.abs(flight.energy - 20) < 0.01);
  simulate(flight, 2.6, { boost: true });
  assert.equal(flight.boostLocked, true);
  assert.equal(flight.boosting, false);
  simulate(flight, 2);
  assert.ok(flight.energy < 30);
  simulate(flight, 0.2);
  assert.equal(flight.boostLocked, false);
  simulate(flight, 5);
  assert.equal(flight.energy, 100);
});

test('collisions place the ship outside the obstacle and cut thrust', () => {
  const flight = new Flight();
  const obstacle = { position: new Vector3(), radius: 100 };
  flight.speed = 150;
  assert.equal(flight.resolveCollisions([obstacle]), true);
  assert.equal(flight.position.length(), 105);
  assert.equal(flight.speed, 30);
  assert.equal(flight.throttle, 0);
  assert.equal(flight.resolveCollisions([obstacle]), false);
});

test('movement is consistent across frame rates and long frames are clamped', () => {
  const low = new Flight(),
    high = new Flight();
  simulate(low, 5, {}, 30);
  simulate(high, 5, {}, 120);
  assert.ok(low.position.distanceTo(high.position) < 3);
  const before = low.position.clone();
  low.update(5, { boost: true });
  assert.ok(low.position.distanceTo(before) <= BOOST_SPEED * 0.05);
});

test('reset restores a fresh expedition', () => {
  const flight = new Flight();
  simulate(flight, 2, { boost: true, yaw: 1 });
  flight.reset();
  assert.deepEqual(flight.position.toArray(), [0, 0, 0]);
  assert.equal(flight.speed, 0);
  assert.equal(flight.energy, 100);
  assert.equal(flight.distance, 0);
  assert.equal(flight.quaternion.w, 1);
});
