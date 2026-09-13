import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDistance } from '../src/distance.js';

test('target distances stay whole numbers without unit or scale suffixes', () => {
  assert.equal(formatDistance(999.4), '999');
  assert.equal(formatDistance(999.5), '1000');
  assert.equal(formatDistance(12_345.6), '12346');
});
