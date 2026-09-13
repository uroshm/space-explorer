export const APPROACH_ALERT_DISTANCE = 5000;
export const APPROACH_TARGET_RETENTION_DISTANCE = 5800;
export const APPROACH_AIM_DOT_THRESHOLD = 0.9659;
const MAX_SIZE_AIM_LEEWAY = (12 * Math.PI) / 180;
const SIZE_AIM_LEEWAY_SCALE = 0.5;

export function findApproachingPlanet(
  planets,
  shipPosition,
  cameraDirection,
  activePlanetId = null,
) {
  const candidates = [];

  for (const planet of planets) {
    const dx = planet.position.x - shipPosition.x;
    const dy = planet.position.y - shipPosition.y;
    const dz = planet.position.z - shipPosition.z;
    const distance = Math.hypot(dx, dy, dz);
    const surfaceDistance = distance - planet.radius;
    const apparentRadius =
      distance > 0 ? Math.asin(Math.min(planet.radius / distance, 1)) : Math.PI / 2;
    const aimLeeway = Math.min(apparentRadius * SIZE_AIM_LEEWAY_SCALE, MAX_SIZE_AIM_LEEWAY);
    const aimDotThreshold = Math.cos(Math.acos(APPROACH_AIM_DOT_THRESHOLD) + aimLeeway);
    const aimDot =
      distance === 0
        ? 0
        : (dx * cameraDirection.x + dy * cameraDirection.y + dz * cameraDirection.z) / distance;

    if (
      surfaceDistance < APPROACH_TARGET_RETENTION_DISTANCE &&
      aimDot >= aimDotThreshold
    ) {
      candidates.push({ planet, surfaceDistance });
    }
  }

  return (
    candidates.find(
      ({ planet, surfaceDistance }) =>
        planet.id === activePlanetId && surfaceDistance <= APPROACH_TARGET_RETENTION_DISTANCE,
    ) ??
    candidates
      .filter(({ surfaceDistance }) => surfaceDistance <= APPROACH_ALERT_DISTANCE)
      .sort((a, b) => a.surfaceDistance - b.surfaceDistance)[0] ??
    null
  );
}
