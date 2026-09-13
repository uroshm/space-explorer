export function createAudio() {
  function track(name, volume, loop = false) {
    const audio = new Audio(`${import.meta.env.BASE_URL}audio/space-explorer-${name}.mp3`);
    audio.preload = 'auto';
    audio.volume = volume;
    audio.loop = loop;
    audio.hidden = true;
    audio.dataset.sound = name;
    document.body.appendChild(audio);
    return audio;
  }

  const music = track('bg-music', 0.3, true);
  const engine = track('engine', 0, true);
  const found = track('found', 0.65);
  engine.preservesPitch = false;
  const tracks = [music, engine, found];
  let active = false;
  let muted = false;
  const play = (audio) => {
    audio.play().catch(() => {});
  };

  return {
    resume() {
      active = true;
      play(music);
      play(engine);
      // Unlock the discovery clip during the same user gesture on mobile browsers.
      found.muted = true;
      play(found);
      found.pause();
      found.currentTime = 0;
      found.muted = muted;
    },
    pause() {
      active = false;
      tracks.forEach((audio) => audio.pause());
      engine.volume = 0;
      found.currentTime = 0;
    },
    toggleMute() {
      muted = !muted;
      tracks.forEach((audio) => {
        audio.muted = muted;
      });
      if (active && !muted) {
        play(music);
        play(engine);
      }
      return muted;
    },
    update(dt, flight, braking) {
      if (!active) return;
      const thrust = braking ? 0 : flight.boosting ? 1 : flight.throttle;
      const volume = thrust * (flight.boosting ? 0.5 : 0.3);
      const blend = 1 - Math.exp(-dt * 5);
      engine.volume += (volume - engine.volume) * blend;
      engine.playbackRate +=
        (0.8 + thrust * 0.4 + (flight.boosting ? 0.2 : 0) - engine.playbackRate) * blend;
    },
    discover() {
      if (!active || muted) return;
      found.currentTime = 0;
      play(found);
    },
  };
}
