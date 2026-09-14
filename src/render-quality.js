// The canvas can be softer on a phone while HTML controls remain full resolution.
export function createRenderQuality({ mobile = false } = {}) {
  let scale = mobile ? 0.85 : 1;
  let duration = 0;
  let samples = 0;
  let fastWindows = 0;

  return {
    pixelRatio(width, height, devicePixelRatio = 1) {
      const cap = mobile ? Math.min(1, Math.sqrt(450000 / (width * height))) : 2;
      return Math.min(devicePixelRatio, cap) * scale;
    },
    reset() {
      duration = 0;
      samples = 0;
      fastWindows = 0;
    },
    // Use real frame intervals, before the flight simulation clamps its timestep.
    // Ignore suspend/resize stalls and require sustained headroom before recovery.
    sample(frameMs) {
      if (!mobile || frameMs <= 0 || frameMs > 250) {
        this.reset();
        return false;
      }
      duration += frameMs;
      samples++;
      if (duration < 1500) return false;
      const average = duration / samples;
      duration = 0;
      samples = 0;
      const previous = scale;
      if (average > 22) {
        scale = Math.max(0.5, scale - 0.1);
        fastWindows = 0;
      } else if (average < 18) {
        if (++fastWindows >= 4) {
          scale = Math.min(0.85, scale + 0.05);
          fastWindows = 0;
        }
      } else {
        fastWindows = 0;
      }
      return scale !== previous;
    },
  };
}
