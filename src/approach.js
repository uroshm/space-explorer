export const APPROACH_ALERT_DISTANCE = 5000;
export const APPROACH_TARGET_RETENTION_DISTANCE = 5800;
export const APPROACH_AIM_DOT_THRESHOLD = 0.9659;

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
    const aimDot =
      distance === 0
        ? 0
        : (dx * cameraDirection.x + dy * cameraDirection.y + dz * cameraDirection.z) / distance;

    if (
      surfaceDistance < APPROACH_TARGET_RETENTION_DISTANCE &&
      aimDot >= APPROACH_AIM_DOT_THRESHOLD
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
