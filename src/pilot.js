export const PILOT_STORAGE_KEY = 'space-explorer-pilot-v1';

export const PILOT_GEAR = [
  { id: 'suit-coral', slot: 'suit', name: 'Launch orange', color: '#d8784f', unlockAt: 0 },
  { id: 'suit-mint', slot: 'suit', name: 'Comet mint', color: '#69c9b2', unlockAt: 1 },
  { id: 'suit-violet', slot: 'suit', name: 'Nebula violet', color: '#9378d7', unlockAt: 3 },
  { id: 'suit-gold', slot: 'suit', name: 'Solar gold', color: '#e4b85e', unlockAt: 6 },
  { id: 'helmet-clear', slot: 'helmet', name: 'Clear visor', unlockAt: 0 },
  { id: 'helmet-antenna', slot: 'helmet', name: 'Signal antenna', unlockAt: 2 },
  { id: 'helmet-halo', slot: 'helmet', name: 'Starlight halo', unlockAt: 5 },
];

export function createPilotProfile() {
  return {
    created: false,
    name: 'Nova',
    suit: 'suit-coral',
    helmet: 'helmet-clear',
    claimedDestinations: [],
  };
}

export function loadPilotProfile(storage) {
  const fallback = createPilotProfile();
  try {
    const store = storage ?? globalThis.localStorage;
    const saved = JSON.parse(store?.getItem(PILOT_STORAGE_KEY) ?? 'null');
    if (!saved || typeof saved !== 'object') return fallback;
    const claimedDestinations = Array.isArray(saved.claimedDestinations)
      ? [...new Set(saved.claimedDestinations.filter((id) => typeof id === 'string'))]
      : [];
    const unlocked = PILOT_GEAR.filter((item) => item.unlockAt <= claimedDestinations.length);
    const suit = unlocked.some((item) => item.slot === 'suit' && item.id === saved.suit)
      ? saved.suit
      : fallback.suit;
    const helmet = unlocked.some((item) => item.slot === 'helmet' && item.id === saved.helmet)
      ? saved.helmet
      : fallback.helmet;
    return {
      ...fallback,
      created: saved.created === true,
      name:
        typeof saved.name === 'string' ? saved.name.slice(0, 18) || fallback.name : fallback.name,
      suit,
      helmet,
      claimedDestinations,
    };
  } catch {
    return fallback;
  }
}

export function savePilotProfile(profile, storage) {
  try {
    const store = storage ?? globalThis.localStorage;
    store?.setItem(PILOT_STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

export function getPilotGear(profile) {
  return PILOT_GEAR.map((item) => ({
    ...item,
    unlocked: profile.claimedDestinations.length >= item.unlockAt,
    equipped: profile[item.slot] === item.id,
  }));
}

export function getPilotAppearance(profile) {
  const suit = PILOT_GEAR.find((item) => item.id === profile.suit) ?? PILOT_GEAR[0];
  return {
    name: profile.name,
    suitColor: suit.color,
    antenna: profile.helmet === 'helmet-antenna',
    halo: profile.helmet === 'helmet-halo',
  };
}
