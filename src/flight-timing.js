// Keep movement tied to elapsed time even when rendering drops below 20 fps.
// Small steps preserve collision/discovery checks; cap catch-up after long stalls.
export function advanceFlight(flight, seconds, input, afterStep = () => {}) {
  const duration = Number.isFinite(seconds) ? Math.min(Math.max(seconds, 0), 0.5) : 0;
  const steps = Math.ceil(duration * 60);
  if (!steps) return;
  const dt = duration / steps;
  for (let i = 0; i < steps; i++) {
    flight.update(dt, input);
    afterStep(dt);
  }
}
