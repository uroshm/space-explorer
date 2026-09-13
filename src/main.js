import * as THREE from 'three';
import { Flight, BOOST_SPEED } from './flight.js';
import { createShip } from './ship.js';
import { createWorld } from './world.js';
import { createAudio } from './audio.js';
import './style.css';

const icon = `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m16 3 11 25-11-6-11 6L16 3Z" stroke="currentColor" stroke-width="1.5"/><path d="M16 11v11" stroke="currentColor" stroke-width="1.5"/></svg>`;
document.querySelector('#app').innerHTML = `
  <main id="game" data-state="ready">
    <div id="viewport" aria-label="3D space flight view"></div>
    <div class="vignette"></div>
    <header class="topbar">
      <a class="brand" href="/" aria-label="Space Explorer home">${icon}<span>SPACE EXPLORER<small>THE ORION EXPEDITION</small></span></a>
      <div class="system-label"><span class="status-dot"></span> SOLAR SYSTEM <span class="divider">/</span> <span class="muted">FREE EXPLORATION</span></div>
      <nav aria-label="Game menu"><button id="sound-button" aria-label="Mute audio" aria-pressed="false">♪</button><button id="log-button">Flight log <span id="log-count">00</span></button><button id="help-button" aria-label="Open flight controls">?</button><button id="pause-button" aria-label="Pause game" disabled>Ⅱ</button></nav>
    </header>

    <div class="sector"><span class="eyebrow">THE ORION EXPEDITION</span><div>Uncharted space. Unlimited possibility.</div></div>
    <div class="top-coordinates"><span class="eyebrow">LOCAL COORDINATES</span><span id="coordinates">+00000 / +00000 / +00000</span></div>

    <section id="intro" class="intro">
      <div class="eyebrow"><span class="tiny-line"></span> YOUR JOURNEY STARTS HERE</div>
      <h1>There’s more<br>out here<span>.</span></h1>
      <p>Leave the familiar behind. Find your own way<br class="desktop-break"> through a quiet corner of the universe.</p>
      <button id="launch-button" class="primary">Begin exploration · Enter <span>↗</span></button>
      <div class="intro-note"><span class="status-dot"></span> ARROWS TO STEER · W / S THRUST · SHIFT BOOST</div>
    </section>

    <section id="mission" class="mission" hidden>
      <div class="eyebrow">SOMETHING TO DISCOVER</div>
      <h2 id="mission-title">The first signal</h2>
      <p id="mission-description">Follow the marker. Fly within 100 m to discover.</p>
      <button id="target-button" class="text-button">Next destination <span>→</span></button>
    </section>

    <div class="planet-caption"><span class="caption-line"></span><div><span class="eyebrow">SATURN / 02</span><span>The ringed giant</span></div></div>
    <div id="reticle" class="reticle" hidden><span></span><i></i><span></span></div>
    <div id="target-marker" class="target-marker" hidden><div class="target-diamond"></div><span id="target-label">THE FIRST SIGNAL</span><small id="target-distance">700 M</small></div>
    <div id="approach-alert" class="approach-alert" role="status" aria-live="polite" hidden>
      <span class="eyebrow"><span class="status-dot"></span> PLANETARY PROXIMITY</span>
      <strong>YOU ARE APPROACHING</strong>
      <span id="approach-planet" class="approach-planet"></span>
      <span class="approach-rule"></span>
    </div>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>

    <footer class="flight-deck">
      <section class="telemetry">
        <div class="eyebrow">VELOCITY <span id="flight-mode">STANDBY</span></div>
        <div class="speed"><span id="speed">000</span><span class="unit">m/s</span><svg viewBox="0 0 100 24" aria-hidden="true"><path d="M0 21h6V17h6v4h6V13h6v8h6V9h6v12h6V5h6v16h6V1h6v20h6V5h6v16h6V9h6v12h6V13h6v8h6" fill="none" stroke="currentColor"/></svg></div>
        <div class="meter-row"><span>THRUST</span><div class="meter"><i id="thrust-bar"></i></div><span id="thrust-value">32%</span></div>
        <div class="meter-row"><span>BOOST</span><div class="meter boost"><i id="boost-bar"></i></div><span id="boost-value">100%</span></div>
      </section>
      <div class="bottom-center"><div class="ship-name">${icon}<span>WANDERER <span class="muted">/ EXPLORER CLASS</span></span><span class="status-dot"></span></div><div class="controls-strip"><span><kbd>W</kbd><kbd>S</kbd> Thrust</span><span><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Steer</span><span><kbd>SHIFT</kbd> Boost</span><span><kbd>SPACE</kbd> Brake</span></div></div>
      <section class="navigation"><canvas id="radar" width="240" height="240" aria-label="Radar showing nearby destinations"></canvas><div><span class="eyebrow">EXPLORATION</span><strong><span id="discovered-count">00</span><span class="muted"> / 04</span></strong><small>PLACES DISCOVERED</small></div></section>
    </footer>

    <div id="touch-controls" hidden><div class="touch-steer"><button data-control="ArrowUp" aria-label="Pitch up">↑</button><button data-control="ArrowLeft" aria-label="Turn left">←</button><button data-control="ArrowDown" aria-label="Pitch down">↓</button><button data-control="ArrowRight" aria-label="Turn right">→</button></div><div class="touch-speed"><button data-control="KeyW">+</button><button data-control="KeyS">−</button><button data-control="ShiftLeft">BOOST</button><button data-control="Space">BRAKE</button></div></div>

    <dialog id="menu-dialog" aria-labelledby="dialog-title"><div class="dialog-top"><span class="eyebrow">WANDERER / FLIGHT COMPUTER</span><button id="close-dialog" aria-label="Close menu">×</button></div><div id="dialog-content"></div></dialog>
    <div id="error" hidden><h1>We couldn’t start the flight.</h1><p>This game needs a browser with WebGL 2 and graphics acceleration enabled. Try a recent Chrome, Firefox, or Safari.</p><button onclick="location.reload()">Try again</button></div>
  </main>
`;

const $ = (id) => document.getElementById(id);
const game = $('game');
const dialog = $('menu-dialog');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (error) {
  $('error').hidden = false;
  $('launch-button').disabled = true;
  console.error(error);
}
if (renderer) startGame();

function startGame() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  $('viewport').appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 100000);
  const world = createWorld(scene);
  const { ship, exhaust } = createShip();
  scene.add(ship);
  const flight = new Flight();
  const audio = createAudio();
  const keys = new Set();
  const mouse = { x: 0, y: 0 };
  let launched = false;
  let paused = true;
  let targetIndex = 0;
  let elapsed = 0;
  let previousTime = performance.now();
  let hudTimer = 0;
  let toastTimeout;
  let lastCollision = -10;
  let cockpit = false;
  let pointerLocked = false;
  let activeApproachId = null;
  const cameraPosition = new THREE.Vector3();
  const cameraLook = new THREE.Vector3();
  const cameraUp = new THREE.Vector3();
  const cameraDirection = new THREE.Vector3();
  const planetDirection = new THREE.Vector3();
  const projected = new THREE.Vector3();
  const localTarget = new THREE.Vector3();
  const inverseRotation = new THREE.Quaternion();
  const radar = $('radar').getContext('2d');

  function notify(message) {
    $('toast').textContent = message;
    $('toast').classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => $('toast').classList.remove('visible'), 4500);
  }

  function updateTarget() {
    const target = world.destinations[targetIndex];
    $('mission-title').textContent = target.name;
    $('mission-description').textContent = target.discovered ? target.info : 'Follow the marker. Fly within 100 m to discover.';
    $('target-label').textContent = target.name.toUpperCase();
  }

  function nextTarget() {
    targetIndex = (targetIndex + 1) % world.destinations.length;
    updateTarget();
  }

  function clearInput() {
    keys.clear();
    mouse.x = 0;
    mouse.y = 0;
  }

  function resume() {
    dialog.close();
    paused = false;
    audio.resume();
    game.dataset.state = 'flying';
    clearInput();
  }

  function launch() {
    launched = true;
    $('intro').hidden = true;
    $('mission').hidden = false;
    $('reticle').hidden = false;
    $('target-marker').hidden = false;
    $('touch-controls').hidden = false;
    $('pause-button').disabled = false;
    game.classList.add('launched');
    resume();
    notify('Arrow keys steer · W/S adjust thrust · Shift boosts · Space brakes.');
  }

  function openMenu(type) {
    paused = true;
    audio.pause();
    clearInput();
    if (document.pointerLockElement) document.exitPointerLock();
    game.dataset.state = launched ? 'paused' : 'ready';
    if (type === 'help') {
      $('dialog-content').innerHTML = `<h2 id="dialog-title">Make yourself at home.</h2><p>A little thrust. A gentle turn. The universe can wait.</p><div class="control-list"><div><span>Increase / decrease thrust</span><span><kbd>W</kbd> <kbd>S</kbd></span></div><div><span>Pitch up / down</span><span><kbd>↑</kbd> <kbd>↓</kbd></span></div><div><span>Turn left / right</span><span><kbd>A</kbd> <kbd>D</kbd> or <kbd>←</kbd> <kbd>→</kbd></span></div><div><span>Roll left / right</span><span><kbd>Q</kbd> <kbd>E</kbd></span></div><div><span>Boost / brake</span><span><kbd>SHIFT</kbd> / <kbd>SPACE</kbd></span></div><div><span>Next destination / camera</span><span><kbd>T</kbd> / <kbd>C</kbd></span></div><div><span>Pause / release mouse</span><span><kbd>ESC</kbd></span></div></div><p class="help-note">Keyboard steering is ready immediately. Press Enter to begin or resume. Press M to enable or disable mouse steering; move away from center to turn. Steering keys clear any mouse turn. Boost recharges when released. On touchscreens, use the on-screen flight buttons.</p><button class="primary" id="resume-button">${launched ? 'Back to the stars' : 'Got it'} <span>↗</span></button>`;
    } else if (type === 'log') {
      $('dialog-content').innerHTML = `<h2 id="dialog-title">A record of the unknown.</h2><p>Your discoveries in the Solar System.</p><div class="log-list">${world.destinations.map((d, i) => `<button class="log-entry" data-target="${i}"><span class="log-number">0${i + 1}</span><span><strong>${d.name}</strong><small>${d.discovered ? d.info : d.type + ' · Undiscovered'}</small></span><span class="log-status">${d.discovered ? '✓' : '↗'}</span></button>`).join('')}</div><p class="help-note">Select a place to set your navigation marker.</p>`;
      document.querySelectorAll('[data-target]').forEach((button) => button.addEventListener('click', () => {
        targetIndex = Number(button.dataset.target);
        updateTarget();
        closeMenu();
      }));
    } else {
      $('dialog-content').innerHTML = `<h2 id="dialog-title">A moment of quiet.</h2><p>Your journey will be here when you’re ready.</p><button class="primary" id="resume-button">Resume exploration <span>↗</span></button><button class="secondary" id="reset-button">Start a new expedition</button>`;
      $('reset-button').addEventListener('click', () => {
        flight.reset();
        world.destinations.forEach((d) => { d.discovered = false; });
        targetIndex = 0;
        cockpit = false;
        ship.visible = true;
        lastCollision = -10;
        updateTarget();
        updateCamera(1, true);
        resume();
        notify('A fresh start. The universe is yours again.');
      });
    }
    $('resume-button')?.addEventListener('click', closeMenu);
    dialog.showModal();
  }

  function closeMenu() {
    if (launched) resume();
    else dialog.close();
  }

  $('launch-button').addEventListener('click', launch);
  $('sound-button').addEventListener('click', () => {
    const muted = audio.toggleMute();
    $('sound-button').style.opacity = muted ? '0.45' : '1';
    $('sound-button').setAttribute('aria-label', muted ? 'Unmute audio' : 'Mute audio');
    $('sound-button').setAttribute('aria-pressed', String(muted));
  });
  $('help-button').addEventListener('click', () => openMenu('help'));
  $('log-button').addEventListener('click', () => openMenu('log'));
  $('pause-button').addEventListener('click', () => openMenu('pause'));
  $('close-dialog').addEventListener('click', closeMenu);
  $('target-button').addEventListener('click', nextTarget);
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeMenu(); });

  const flightKeys = new Set(['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'ShiftLeft', 'ShiftRight']);
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') {
      if (!dialog.open && launched) openMenu('pause');
      return;
    }
    if (event.code === 'Enter' && !event.repeat && (!launched || paused)) {
      // Preserve Enter activation for focused menu buttons and links.
      if (event.target.closest?.('button, a, input, textarea, select')) return;
      event.preventDefault();
      if (dialog.open) closeMenu();
      else if (!launched) launch();
      return;
    }
    if (!launched || paused) return;
    if (flightKeys.has(event.code)) {
      event.preventDefault();
      keys.add(event.code);
      if (['KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) mouse.x = mouse.y = 0;
    }
    if (event.repeat) return;
    if (event.code === 'KeyM') { event.preventDefault(); toggleMouseSteering(); }
    if (event.code === 'KeyT') nextTarget();
    if (event.code === 'KeyC') {
      cockpit = !cockpit;
      ship.visible = !cockpit;
      updateCamera(1, true);
      notify(cockpit ? 'Forward camera' : 'Chase camera');
    }
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => { if (launched && !paused) openMenu('pause'); clearInput(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && launched && !paused) openMenu('pause'); });
  let switchingToKeyboard = false;
  async function toggleMouseSteering() {
    if (!launched || paused || matchMedia('(pointer: coarse)').matches) return;
    if (pointerLocked) {
      switchingToKeyboard = true;
      document.exitPointerLock();
      notify('Keyboard steering enabled.');
      return;
    }
    try { await renderer.domElement.requestPointerLock(); notify('Mouse steering enabled. Press M for keyboard steering.'); } catch { notify('Mouse steering unavailable. Use the arrow keys to steer.'); }
  }
  document.addEventListener('pointerlockchange', () => {
    const wasLocked = pointerLocked;
    pointerLocked = document.pointerLockElement === renderer.domElement;
    mouse.x = mouse.y = 0;
    if (wasLocked && !pointerLocked && !paused && !switchingToKeyboard) openMenu('pause');
    switchingToKeyboard = false;
  });
  document.addEventListener('mousemove', (event) => {
    if (pointerLocked && !paused) {
      mouse.x = THREE.MathUtils.clamp(mouse.x + event.movementX * 0.002, -1, 1);
      mouse.y = THREE.MathUtils.clamp(mouse.y - event.movementY * 0.002, -1, 1);
    }
  });
  document.querySelectorAll('[data-control]').forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      if (paused) return;
      button.setPointerCapture(event.pointerId);
      keys.add(button.dataset.control);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, () => keys.delete(button.dataset.control));
  });

  function updateCamera(dt, snap = false) {
    cameraPosition.set(0, cockpit ? 1.3 : 6, cockpit ? -4.8 : 22).applyQuaternion(flight.quaternion).add(flight.position);
    cameraLook.set(0, cockpit ? 1.3 : 2, -80).applyQuaternion(flight.quaternion).add(flight.position);
    cameraUp.set(0, 1, 0).applyQuaternion(flight.quaternion);
    if (snap) camera.position.copy(cameraPosition);
    else camera.position.lerp(cameraPosition, 1 - Math.exp(-dt * 7));
    camera.up.copy(cameraUp);
    camera.lookAt(cameraLook);
    camera.fov = THREE.MathUtils.damp(camera.fov, flight.boosting ? 70 : 58, 3, dt);
    camera.updateProjectionMatrix();
  }

  function drawRadar() {
    if (!radar) return;
    radar.clearRect(0, 0, 240, 240);
    const center = 120;
    radar.strokeStyle = 'rgba(160, 208, 199, .17)';
    radar.lineWidth = 1;
    for (const radius of [37, 73, 108]) {
      radar.beginPath(); radar.arc(center, center, radius, 0, Math.PI * 2); radar.stroke();
    }
    radar.beginPath(); radar.moveTo(12, center); radar.lineTo(228, center); radar.moveTo(center, 12); radar.lineTo(center, 228); radar.stroke();
    radar.fillStyle = 'rgba(168, 231, 209, .045)';
    radar.beginPath(); radar.moveTo(center, center); radar.arc(center, center, 108, -Math.PI * 0.75, -Math.PI * 0.25); radar.closePath(); radar.fill();
    inverseRotation.copy(flight.quaternion).invert();
    world.destinations.forEach((destination, i) => {
      localTarget.copy(destination.position).sub(flight.position).applyQuaternion(inverseRotation);
      const x = localTarget.x / 45, y = localTarget.z / 45;
      const scale = Math.min(1, 99 / Math.max(1, Math.hypot(x, y)));
      radar.fillStyle = i === targetIndex ? '#b6f1d6' : '#65797d';
      radar.beginPath(); radar.arc(center + x * scale, center + y * scale, i === targetIndex ? 4 : 2.5, 0, Math.PI * 2); radar.fill();
    });
    radar.fillStyle = '#d9eee5';
    radar.beginPath(); radar.moveTo(120, 112); radar.lineTo(115, 125); radar.lineTo(120, 122); radar.lineTo(125, 125); radar.closePath(); radar.fill();
  }

  function updateHUD() {
    $('speed').textContent = Math.round(flight.speed).toString().padStart(3, '0');
    $('thrust-bar').style.width = `${flight.throttle * 100}%`;
    $('thrust-value').textContent = `${Math.round(flight.throttle * 100)}%`;
    $('boost-bar').style.width = `${flight.energy}%`;
    $('boost-value').textContent = `${Math.round(flight.energy)}%`;
    $('flight-mode').textContent = !launched ? 'STANDBY' : paused ? 'PAUSED' : flight.boosting ? 'BOOSTING' : flight.speed < 1 ? 'IDLE' : 'CRUISING';
    $('coordinates').textContent = flight.position.toArray().map((n) => `${n >= 0 ? '+' : '−'}${Math.abs(Math.round(n)).toString().padStart(5, '0')}`).join(' / ');
    const found = world.destinations.filter((d) => d.discovered).length.toString().padStart(2, '0');
    $('discovered-count').textContent = found;
    $('log-count').textContent = found;
    drawRadar();
  }

  function updateMarker() {
    const target = world.destinations[targetIndex];
    const distance = flight.position.distanceTo(target.position);
    $('target-distance').textContent = distance > 1000 ? `${(distance / 1000).toFixed(2)} KM` : `${Math.round(distance)} M`;
    camera.updateMatrixWorld();
    projected.copy(target.position).project(camera);
    localTarget.copy(target.position).applyMatrix4(camera.matrixWorldInverse);
    const behind = localTarget.z > 0;
    let x = projected.x, y = projected.y;
    if (behind) { x = -x; y = -y; if (Math.abs(x) < 0.01) x = 1; }
    const edge = behind || Math.abs(x) > 0.85 || Math.abs(y) > 0.68;
    if (edge) {
      const scale = Math.max(Math.abs(x) / 0.85, Math.abs(y) / 0.68, 0.01);
      x /= scale; y /= scale;
    }
    $('target-marker').style.left = `${(x * 0.5 + 0.5) * innerWidth}px`;
    $('target-marker').style.top = `${(-y * 0.5 + 0.5) * innerHeight}px`;
    $('target-marker').classList.toggle('offscreen', edge);
    $('reticle').style.transform = `translate(calc(-50% + ${mouse.x * 100}px), calc(-50% - ${mouse.y * 100}px))`;
  }

  function updateApproachAlert() {
    camera.updateMatrixWorld();
    camera.getWorldDirection(cameraDirection);
    const candidates = [];
    for (const planet of world.planets) {
      if (!['planet', 'dwarf-planet'].includes(planet.type)) continue;
      planetDirection.subVectors(planet.position, flight.position);
      const distance = planetDirection.length();
      const surfaceDistance = distance - planet.radius;
      if (surfaceDistance < 5800 && cameraDirection.dot(planetDirection.normalize()) >= 0.9659) {
        candidates.push({ planet, surfaceDistance });
      }
    }
    const alert = $('approach-alert');
    const activeCandidate = candidates.find(({ planet, surfaceDistance }) => planet.id === activeApproachId && surfaceDistance <= 5800);
    const approaching = activeCandidate ?? candidates
      .filter(({ surfaceDistance }) => surfaceDistance <= 5000)
      .sort((a, b) => a.surfaceDistance - b.surfaceDistance)[0];
    if (approaching) {
      activeApproachId = approaching.planet.id;
      $('approach-planet').textContent = approaching.planet.name.toUpperCase();
      alert.hidden = false;
    } else {
      activeApproachId = null;
      alert.hidden = true;
    }
  }

  function frame(now) {
    const dt = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;
    if (!paused) {
      elapsed += dt;
      const pressed = (...codes) => codes.some((code) => keys.has(code)) ? 1 : 0;
      flight.update(dt, {
        keyboardSteering: pressed('KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'),
        thrust: pressed('KeyW') - pressed('KeyS'),
        yaw: THREE.MathUtils.clamp(pressed('KeyD', 'ArrowRight') - pressed('KeyA', 'ArrowLeft') + mouse.x, -1, 1),
        pitch: THREE.MathUtils.clamp(pressed('ArrowUp') - pressed('ArrowDown') + mouse.y, -1, 1),
        roll: pressed('KeyE') - pressed('KeyQ'),
        boost: pressed('ShiftLeft', 'ShiftRight'), brake: pressed('Space'),
      });
      if (flight.resolveCollisions(world.colliders) && elapsed - lastCollision > 2) {
        lastCollision = elapsed;
        notify('Proximity alert. Thrust cut — steer away, then press W.');
      }
      for (const destination of world.destinations) {
        if (!destination.discovered && flight.position.distanceTo(destination.position) < 100) {
          destination.discovered = true;
          audio.discover();
          const count = world.destinations.filter((d) => d.discovered).length;
          notify(count === 4 ? 'System surveyed. All four places discovered — keep exploring.' : `Discovered: ${destination.name}. ${destination.info}`);
          if (world.destinations[targetIndex] === destination && count < 4) {
            do { targetIndex = (targetIndex + 1) % 4; } while (world.destinations[targetIndex].discovered);
          }
          updateTarget();
        }
      }
      ship.position.copy(flight.position);
      audio.update(dt, flight, pressed('Space'));
      ship.quaternion.copy(flight.quaternion);
      ship.rotateZ(flight.bank);
      world.update(dt, elapsed, flight.position);
      updateCamera(dt);
      updateApproachAlert();
    } else if (!launched) {
      elapsed += dt;
      ship.position.y = Math.sin(elapsed * 0.6) * 0.14;
      world.update(dt * 0.3, elapsed, flight.position);
    } else {
      updateApproachAlert();
    }
    for (const plume of exhaust) {
      const strength = !launched ? 0.18 : flight.speed / BOOST_SPEED;
      plume.scale.y = 0.3 + strength * 1.6 + Math.sin(elapsed * 37) * 0.035;
      plume.position.z = 3.2 + 1.8 * plume.scale.y;
      plume.material.opacity = 0.25 + strength * 0.5;
    }
    hudTimer += dt;
    if (hudTimer > 0.1) { updateHUD(); hudTimer = 0; }
    if (launched) updateMarker();
    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  });
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    paused = true;
    renderer.setAnimationLoop(null);
    audio.pause();
    $('error').hidden = false;
  });
  updateCamera(1, true);
  updateHUD();
  renderer.setAnimationLoop(frame);
}
