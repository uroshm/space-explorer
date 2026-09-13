import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PILOT_STORAGE_KEY,
  createPilotProfile,
  getPilotAppearance,
  getPilotGear,
  loadPilotProfile,
  savePilotProfile,
} from '../src/pilot.js';

function memoryStorage(initial = null) {
  const values = new Map(initial ? [[PILOT_STORAGE_KEY, initial]] : []);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test('pilot can be skipped and profile plus gear progress persist locally', () => {
  const storage = memoryStorage();
  const profile = createPilotProfile();
  assert.equal(profile.created, false);
  profile.name = 'Nova';
  profile.created = true;
  profile.claimedDestinations.push('first-signal');
  assert.equal(savePilotProfile(profile, storage), true);

  const restored = loadPilotProfile(storage);
  assert.equal(restored.created, true);
  assert.equal(restored.name, 'Nova');
  assert.equal(getPilotGear(restored).find((item) => item.id === 'suit-mint').unlocked, true);
  assert.equal(getPilotGear(restored).find((item) => item.id === 'suit-violet').unlocked, false);
});

test('invalid saved profiles fall back to a safe starter astronaut', () => {
  const storage = memoryStorage('{bad json');
  const profile = loadPilotProfile(storage);
  assert.equal(profile.created, false);
  assert.equal(profile.name, 'Nova');
  assert.deepEqual(profile.claimedDestinations, []);
});

test('gear unlocks at the intended fuel-cell milestones', () => {
  const profile = createPilotProfile();
  const unlockedIds = () =>
    getPilotGear(profile)
      .filter((item) => item.unlocked)
      .map((item) => item.id);

  assert.deepEqual(unlockedIds(), ['suit-coral', 'helmet-clear']);
  for (let count = 1; count <= 6; count++) {
    profile.claimedDestinations.push(`site-${count}`);
    const unlocked = unlockedIds();
    if (count === 1) assert.ok(unlocked.includes('suit-mint'));
    if (count === 2) assert.ok(unlocked.includes('helmet-antenna'));
    if (count === 3) assert.ok(unlocked.includes('suit-violet'));
    if (count === 5) assert.ok(unlocked.includes('helmet-halo'));
    if (count === 6) assert.ok(unlocked.includes('suit-gold'));
  }
});

test('loaded progress is deduplicated and locked gear or long names are sanitized', () => {
  const saved = JSON.stringify({
    created: true,
    name: 'A very long astronaut name',
    suit: 'suit-violet',
    helmet: 'helmet-antenna',
    claimedDestinations: ['first-signal', 'first-signal', 7],
  });
  const profile = loadPilotProfile(memoryStorage(saved));

  assert.deepEqual(profile.claimedDestinations, ['first-signal']);
  assert.equal(profile.name.length, 18);
  assert.equal(profile.suit, 'suit-coral');
  assert.equal(profile.helmet, 'helmet-clear');
});

test('appearance reflects the selected suit and helmet accessory', () => {
  const profile = createPilotProfile();
  profile.name = 'Comet';
  profile.suit = 'suit-mint';
  profile.helmet = 'helmet-halo';

  assert.deepEqual(getPilotAppearance(profile), {
    name: 'Comet',
    suitColor: '#69c9b2',
    antenna: false,
    halo: true,
  });
});

test('storage failures do not crash pilot loading or saving', () => {
  const unavailableStorage = {
    getItem() {
      throw new Error('storage is unavailable');
    },
    setItem() {
      throw new Error('storage is unavailable');
    },
  };

  assert.equal(loadPilotProfile(unavailableStorage).created, false);
  assert.equal(savePilotProfile(createPilotProfile(), unavailableStorage), false);
});
