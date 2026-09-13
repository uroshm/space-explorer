export const PLANET_FLYBY_CLEARANCE = 900;
export const BEACON_DISCOVERY_RANGE = 100;

export function getDestinationProximity(destination, planets, shipPosition) {
  const planet = planets.find(
    (candidate) => candidate.id === destination.id && candidate.type === 'planet',
  );

  if (planet) {
    return {
      distance: shipPosition.distanceTo(planet.position) - planet.radius,
      range: PLANET_FLYBY_CLEARANCE,
    };
  }

  return {
    distance: shipPosition.distanceTo(destination.position),
    range: BEACON_DISCOVERY_RANGE,
  };
}
