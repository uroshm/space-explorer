import test from 'node:test';
import assert from 'node:assert/strict';
import { createMobileBodyGeometry } from '../src/mobile-surface.js';
import bodies from '../src/data/bodies.json' with { type: 'json' };

test('mobile surfaces keep finite, varied colors and the catalog body radius', () => {
  for (const body of bodies) {
    const geometry = createMobileBodyGeometry(body);
    const colors = geometry.attributes.color.array;
    assert.ok(colors.every((value) => Number.isFinite(value) && value >= 0 && value <= 1));
    assert.ok(new Set(colors).size > 10);
    geometry.computeBoundingSphere();
    assert.ok(Math.abs(geometry.boundingSphere.radius - body.diameter / 2) < 0.001);
    geometry.dispose();
  }
});

test('Jupiter keeps a distinct spot in its precomputed mobile colors', () => {
  const jupiter = bodies.find((body) => body.id === 'jupiter');
  const spotted = createMobileBodyGeometry(jupiter);
  const plain = createMobileBodyGeometry({ ...jupiter, features: {} });
  const colors = spotted.attributes.color.array;
  const plainColors = plain.attributes.color.array;
  let changed = 0;
  for (let i = 0; i < colors.length; i += 3) {
    if (colors[i] !== plainColors[i]) {
      changed++;
      assert.ok(colors[i] > colors[i + 1], 'the spot remains red');
    }
  }
  assert.ok(changed > 0);
  assert.ok(changed < spotted.attributes.position.count / 10);
});
