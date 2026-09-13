import test from 'node:test';
import assert from 'node:assert/strict';
import { Flight } from '../src/flight.js';

test('keyboard steering turns faster and stops turning on release', () => {
  const keyboard = new Flight();
  const mouse = new Flight();
  keyboard.update(0.05, { yaw: 1, keyboardSteering: true });
  mouse.update(0.05, { yaw: 1 });
  assert.ok(Math.abs(keyboard.quaternion.y) > Math.abs(mouse.quaternion.y));
  const facing = keyboard.quaternion.clone();
  keyboard.update(0.05, {});
  assert.ok(keyboard.quaternion.angleTo(facing) < 1e-7);
});

test('throttle reaches full power quickly and brake cuts thrust', () => {
  const flight = new Flight();
  for (let i = 0; i < 22; i++) flight.update(0.05, { thrust: 1 });
  assert.equal(flight.throttle, 1);
  for (let i = 0; i < 14; i++) flight.update(0.05, { brake: true, boost: true });
  assert.equal(flight.throttle, 0);
  assert.equal(flight.boosting, false);
});
