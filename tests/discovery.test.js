import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { getDestinationProximity } from '../src/discovery.js';

test('planet flybys count as discoveries without hitting the narrow beacon marker', () => {
  const saturn = {
    id: 'saturn',
    type: 'planet',
    radius: 1000,
    position: new Vector3(0, 0, 0),
  };
  const destination = {
    id: 'saturn',
    position: new Vector3(0, 0, -1080),
  };
  const shipPosition = new Vector3(1300, 0, 0);

  const proximity = getDestinationProximity(destination, [saturn], shipPosition);

  assert.equal(proximity.distance, 300);
  assert.equal(proximity.range, 900);
});

test('moons and dwarf planets use the same close surface pass as planets', () => {
  for (const type of ['moon', 'dwarf-planet']) {
    const body = {
      id: type,
      type,
      radius: 1000,
      position: new Vector3(0, 0, 0),
    };
    const destination = {
      id: type,
      position: new Vector3(0, 0, -1080),
    };

    const proximity = getDestinationProximity(destination, [body], new Vector3(1300, 0, 0));

    assert.equal(proximity.distance, 300);
    assert.equal(proximity.range, 900);
  }
});

test('non-planet destinations still require a close pass to their marker', () => {
  const destination = {
    id: 'first-signal',
    position: new Vector3(0, 0, -700),
  };

  const proximity = getDestinationProximity(destination, [], new Vector3(0, 0, -750));

  assert.equal(proximity.distance, 50);
  assert.equal(proximity.range, 100);
});
