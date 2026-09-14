import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderQuality } from '../src/render-quality.js';

test('mobile bounds rendering work on high density phones and large tablets', () => {
  const mobile = createRenderQuality({ mobile: true });
  assert.equal(mobile.pixelRatio(390, 844, 3), 0.85);
  const tabletRatio = mobile.pixelRatio(1366, 1024, 2);
  assert.ok(1366 * 1024 * tabletRatio ** 2 <= 450000);
  assert.equal(createRenderQuality().pixelRatio(1440, 900, 3), 2);
});

test('sustained slow frames lower resolution, bounded fast recovery avoids oscillation', () => {
  const quality = createRenderQuality({ mobile: true });
  const ratio = () => quality.pixelRatio(390, 844, 3);
  for (let i = 0; i < 50; i++) quality.sample(30);
  assert.equal(ratio(), 0.75);
  for (let i = 0; i < 2000; i++) quality.sample(30);
  assert.equal(ratio(), 0.5);
  for (let i = 0; i < 100; i++) quality.sample(16);
  assert.equal(ratio(), 0.5, 'one good window must not increase resolution');
  for (let i = 0; i < 3000; i++) quality.sample(16);
  assert.equal(ratio(), 0.85);
});

test('suspend stalls and paused samples do not trigger quality drops', () => {
  const quality = createRenderQuality({ mobile: true });
  for (let i = 0; i < 49; i++) quality.sample(30);
  quality.sample(1000);
  assert.equal(quality.sample(30), false);
  quality.reset();
  assert.equal(quality.sample(30), false);
  assert.equal(quality.pixelRatio(390, 844, 3), 0.85);
  const desktop = createRenderQuality();
  for (let i = 0; i < 1000; i++) assert.equal(desktop.sample(30), false);
});
