export const COMET_LIFETIME = 1.8;

export function createCometSchedule(random) {
  let nextCometAt = 35 + random() * 25;
  return {
    isDue(time) {
      return time >= nextCometAt;
    },
    reschedule(time) {
      nextCometAt = time + 30 + random() * 30;
    },
  };
}
