export function createAudio({ mobile = false } = {}) {
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
  const found = track('found', 0.18);
  const epic = track('epic', 0.2);
  const correct = track('correct', 0.18);
  const incorrect = track('incorrect', 0.14);
  const effects = [found, epic, correct, incorrect];
  const announcementEffects = [found, epic];
  const epicCooldownMs = 10_000;
  const engineEffectMix = 0.4;
  engine.preservesPitch = false;
  const tracks = [music, engine, ...effects];
  const musicVolume = 0.3;
  const announcementMusicVolume = 0.24;
  announcementEffects.forEach((effect) => {
    effect.addEventListener('ended', () => {
      if (active && announcementEffects.every((announcement) => announcement.paused))
        music.volume = musicVolume;
    });
  });
  let active = false;
  let muted = false;
  let lastEpicAt = Number.NEGATIVE_INFINITY;
  let engineUpdateTime = 0;
  const play = (audio) => {
    audio.play().catch(() => {});
  };
  const playEffect = (audio) => {
    audio.currentTime = 0;
    play(audio);
  };

  return {
    resume() {
      active = true;
      engineUpdateTime = 0;
      play(music);
      play(engine);
      // Unlock short effects during the same user gesture on mobile browsers.
      effects.forEach((effect) => {
        effect.muted = true;
        play(effect);
        effect.pause();
        effect.currentTime = 0;
        effect.muted = muted;
      });
    },
    pause() {
      active = false;
      tracks.forEach((audio) => audio.pause());
      engine.volume = 0;
      music.volume = musicVolume;
      effects.forEach((effect) => {
        effect.currentTime = 0;
      });
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
    update(dt, flight) {
      if (!active || muted) return;
      engineUpdateTime += dt;
      if (mobile && engineUpdateTime < 0.1) return;
      const thrust = flight.boosting ? 1 : flight.throttle;
      const volume = thrust * (flight.boosting ? 0.5 : 0.3);
      const blend = 1 - Math.exp(-engineUpdateTime * 5);
      engineUpdateTime = 0;
      const engineMix = effects.some((effect) => !effect.paused) ? engineEffectMix : 1;
      const nextVolume = engine.volume + (volume * engineMix - engine.volume) * blend;
      if (Math.abs(nextVolume - engine.volume) > 0.005) engine.volume = nextVolume;
      // Changing media playback rate continuously can interrupt iOS playback.
      // Phones keep a steady engine pitch, with thrust expressed through volume.
      if (!mobile) {
        engine.playbackRate +=
          (0.8 + thrust * 0.4 + (flight.boosting ? 0.2 : 0) - engine.playbackRate) * blend;
      }
    },
    discover() {
      if (!active || muted) return;
      music.volume = announcementMusicVolume;
      playEffect(found);
    },
    approach() {
      if (!active || muted) return;
      const now = performance.now();
      if (!epic.paused || now - lastEpicAt < epicCooldownMs) return;
      lastEpicAt = now;
      music.volume = announcementMusicVolume;
      playEffect(epic);
    },
    quizAnswer(isCorrect) {
      if (!active || muted) return;
      playEffect(isCorrect ? correct : incorrect);
    },
  };
}
