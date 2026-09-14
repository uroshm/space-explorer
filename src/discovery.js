export const CELESTIAL_FLYBY_CLEARANCE = 900;
export const BEACON_DISCOVERY_RANGE = 100;

export function getDestinationProximity(destination, planets, shipPosition) {
  const body = planets.find(
    (candidate) => candidate.id === destination.id && candidate.type !== 'star',
  );

  if (body) {
    return {
      distance: shipPosition.distanceTo(body.position) - body.radius,
      range: CELESTIAL_FLYBY_CLEARANCE,
    };
  }

  return {
    distance: shipPosition.distanceTo(destination.position),
    range: BEACON_DISCOVERY_RANGE,
  };
}
