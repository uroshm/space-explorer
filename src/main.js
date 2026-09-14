import * as THREE from 'three';
import { Flight, BOOST_SPEED } from './flight.js';
import { getDestinationProximity } from './discovery.js';
import { createShip } from './ship.js';
import { createWorld } from './world.js';
import { createAudio } from './audio.js';
import { formatDistance } from './distance.js';
import {
  PILOT_GEAR,
  getPilotAppearance,
  getPilotGear,
  loadPilotProfile,
  savePilotProfile,
} from './pilot.js';
import { getLearningCardContent } from './learning.js';
import learningContent from './data/learning-content.json';
import './style.css';

const icon = `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="m16 3 11 25-11-6-11 6L16 3Z" stroke="currentColor" stroke-width="1.5"/><path d="M16 11v11" stroke="currentColor" stroke-width="1.5"/></svg>`;
document.querySelector('#app').innerHTML = `
  <main id="game" data-state="ready">
    <div id="viewport" aria-label="3D space flight view"></div>
    <div class="vignette"></div>
    <header class="topbar">
      <a class="brand" href="/" aria-label="Toma’s Space Ship home">${icon}<span>TOMA’S SPACE SHIP<small>3D SPACE ADVENTURE</small></span></a>
      <div class="system-label"><span class="status-dot"></span> SOLAR SYSTEM <span class="divider">/</span> <span class="muted">FREE EXPLORATION</span></div>
      <div id="fuel-cell-tracker" class="fuel-cell-tracker" role="progressbar" aria-label="Power cells collected" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0">
        <span class="tracker-icon" aria-hidden="true">⚡</span>
        <span class="tracker-copy"><span class="tracker-label">POWER CELLS</span>
        <span id="fuel-cell-pips" class="fuel-cell-pips" aria-hidden="true"></span>
      </div>
      <nav aria-label="Game menu"><button id="sound-button" aria-label="Mute audio" aria-pressed="false">♪</button><button id="pilot-button" aria-label="Open astronaut and gear"><span id="pilot-badge-avatar" class="pilot-badge-avatar"></span><span id="pilot-badge-name">PILOT</span></button><button id="help-button" aria-label="Open flight controls">?</button><button id="pause-button" aria-label="Pause game" disabled>Ⅱ</button></nav>
    </header>

    <div class="top-coordinates"><span class="eyebrow">LOCAL COORDINATES</span><span id="coordinates">+00000 / +00000 / +00000</span></div>

    <section id="intro" class="intro">
      <div class="eyebrow"><span class="tiny-line"></span> YOUR JOURNEY STARTS HERE</div>
      <h1>There’s more<br>out here<span>.</span></h1>
      <p>Leave the familiar behind.<br class="desktop-break"> Let’s take Toma’s spaceship for a ride and see what we discover.</p>
      <div class="intro-actions">
        <button id="launch-button" class="primary">Begin exploration · Enter <span>↗</span></button>
        <button id="intro-pilot-button" class="intro-pilot-button">Create an astronaut <span>· optional</span></button>
      </div>
    </section>

    <section id="mission" class="mission" hidden>
      <div class="eyebrow">SOMETHING TO DISCOVER</div>
      <h2 id="mission-title">The first signal</h2>
      <p id="mission-description">Follow the marker. Get close to discover.</p>
      <button id="target-button" class="text-button">Next destination <span>→</span></button>
    </section>

    <div class="planet-caption"><span class="caption-line"></span><div><span class="eyebrow">SATURN / 02</span><span>The ringed giant</span></div></div>
    <div id="reticle" class="reticle" hidden><span></span><i></i><span></span></div>
    <div id="target-marker" class="target-marker" hidden><div class="target-diamond"></div><span id="target-label">THE FIRST SIGNAL</span><small id="target-distance">700</small></div>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>
    <div id="fuel-cell-pop" class="fuel-cell-pop" role="status" aria-live="polite" hidden>
      <div class="fuel-cell-art" aria-hidden="true">
        <span class="fuel-cell-orbit"></span>
        <span class="fuel-cell-icon">☢</span>
        <i class="fuel-cell-spark spark-one"></i>
        <i class="fuel-cell-spark spark-two"></i>
        <i class="fuel-cell-spark spark-three"></i>
      </div>
      <div class="fuel-cell-copy"><strong>FUEL CELL!</strong><span id="fuel-cell-reward">+35 BOOST</span><span id="fuel-cell-progression"></span></div>
    </div>
    <aside id="learning-card" class="learning-card" aria-labelledby="learning-title" hidden>
      <div class="learning-card-top"><span class="eyebrow">OPTIONAL FIELD NOTE</span><button id="learning-close" class="learning-close" aria-label="Close field note"><span aria-hidden="true">×</span><span class="learning-close-label">CLOSE</span></button></div>
      <h2 id="learning-title"></h2>
      <p id="learning-fact" hidden></p>
      <section id="learning-quiz" hidden>
        <p id="learning-question"></p>
        <div id="learning-choices" class="learning-choices"></div>
        <p id="learning-feedback" class="learning-feedback" role="status" aria-live="polite" hidden></p>
      </section>
      <button id="learning-done" class="learning-done">Got it</button>
    </aside>

    <footer class="flight-deck">
      <section class="telemetry">
        <div class="eyebrow">VELOCITY <span id="flight-mode">STANDBY</span></div>
        <div class="speed"><span id="speed">000</span><svg viewBox="0 0 100 24" aria-hidden="true"><path d="M0 21h6V17h6v4h6V13h6v8h6V9h6v12h6V5h6v16h6V1h6v20h6V5h6v16h6V9h6v12h6V13h6v8h6" fill="none" stroke="currentColor"/></svg></div>
        <div class="meter-row"><span>THRUST</span><div class="meter"><i id="thrust-bar"></i></div><span id="thrust-value">32%</span></div>
        <div class="meter-row"><span>BOOST</span><div class="meter boost"><i id="boost-bar"></i></div><span id="boost-value">100%</span></div>
      </section>
      <div class="bottom-center"><div class="ship-name">${icon}<span>WANDERER <span class="muted">/ EXPLORER CLASS</span></span><span class="status-dot"></span></div><div class="controls-strip"><span><kbd>W</kbd><kbd>S</kbd> Thrust</span><span><kbd>↑</kbd><kbd>↓</kbd><kbd>←</kbd><kbd>→</kbd> Steer</span><span><kbd>SHIFT</kbd> Boost</span></div></div>
      <section class="navigation" aria-label="Navigation"><canvas id="radar" width="240" height="240" aria-label="Radar showing nearby destinations"></canvas></section>
    </footer>

    <div id="touch-controls" hidden>
      <div class="touch-steer"><div id="touch-stick" role="group" aria-label="Flight joystick. Drag to steer." tabindex="0"><div class="touch-stick-base"><div id="touch-stick-knob"></div></div></div></div>
      <div class="touch-speed"><button class="touch-thrust" data-control="KeyW" aria-label="Hold to increase thrust">THRUST</button><button data-control="ShiftLeft" aria-label="Hold to boost">BOOST</button></div>
    </div>

    <dialog id="menu-dialog" aria-labelledby="dialog-title"><div class="dialog-top"><span class="eyebrow">WANDERER / FLIGHT COMPUTER</span><button id="close-dialog" aria-label="Close menu">×</button></div><div id="dialog-content"></div></dialog>
    <div id="error" hidden><h1>We couldn’t start the flight.</h1><p>This game needs a browser with WebGL 2 and graphics acceleration enabled. Try a recent Chrome, Firefox, or Safari.</p><button onclick="location.reload()">Try again</button></div>
  </main>
`;

const $ = (id) => document.getElementById(id);
const game = $('game');
const dialog = $('menu-dialog');
const lowPowerDisplay = window.matchMedia('(pointer: coarse)').matches;
const maxPixelRatio = lowPowerDisplay ? 1 : 2;
let renderer;
try {
  renderer = new THREE.WebGLRenderer({
    antialias: !lowPowerDisplay,
    powerPreference: 'high-performance',
  });
} catch (error) {
  $('error').hidden = false;
  $('launch-button').disabled = true;
  console.error(error);
}
if (renderer) startGame();

function startGame() {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  $('viewport').appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 100000);
  const world = createWorld(scene, { lowQuality: lowPowerDisplay });
  const { ship, exhaust, updateAstronaut, updateEngineFlames } = createShip();
  scene.add(ship);
  const flight = new Flight();
  const audio = createAudio();
  const keys = new Set();
  const mouse = { x: 0, y: 0 };
  const touchSteer = { x: 0, y: 0 };
  let joystickPointerId = null;
  let launched = false;
  let paused = true;
  let targetIndex = 0;
  let fuelCells = 0;
  let pilotProfile = loadPilotProfile();
  let pendingPilotUnlock = '';
  let elapsed = 0;
  let previousTime = performance.now();
  let hudTimer = 0;
  let lastFlightInputAt = performance.now();
  let idleReminderShown = false;
  let toastTimeout;
  let fuelCellTimeout;
  let lastCollision = -10;
  let cockpit = false;
  let pointerLocked = false;
  $('fuel-cell-tracker').setAttribute('aria-valuemax', world.destinations.length);
  $('fuel-cell-pips').replaceChildren(
    ...world.destinations.map(() => {
      const pip = document.createElement('i');
      return pip;
    }),
  );
  const cameraPosition = new THREE.Vector3();
  const cameraLook = new THREE.Vector3();
  const cameraUp = new THREE.Vector3();
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

  function celebrateFuelCell(energyRestored, pilotCellEarned) {
    const pop = $('fuel-cell-pop');
    $('fuel-cell-reward').textContent =
      energyRestored > 0 ? `+${energyRestored} BOOST` : 'BOOST FULL';
    $('fuel-cell-progression').textContent = pilotCellEarned ? 'PILOT GEAR +1' : '';
    clearTimeout(fuelCellTimeout);
    pop.hidden = false;
    pop.classList.remove('active');
    void pop.offsetWidth;
    pop.classList.add('active');
    fuelCellTimeout = setTimeout(() => {
      pop.classList.remove('active');
      pop.hidden = true;
    }, 2600);
  }

  function dismissLearningCard() {
    const card = $('learning-card');
    if (card.contains(document.activeElement)) document.activeElement.blur();
    card.hidden = true;
    if (pendingPilotUnlock) {
      notify(pendingPilotUnlock);
      pendingPilotUnlock = '';
    }
  }

  function showLearningCard(destination) {
    const { fact, quiz } = getLearningCardContent(learningContent, destination);
    const hasFact = Boolean(fact);
    const hasQuiz = Boolean(quiz);

    if (!hasFact && !hasQuiz) {
      dismissLearningCard();
      return;
    }

    $('learning-title').textContent =
      `${destination.name.replace(/ (flyby|orbit|outpost|overlook|waypoint|approach)$/i, '')} field note`;
    $('learning-card').querySelector('.learning-card-top .eyebrow').textContent = hasQuiz
      ? 'QUICK SPACE QUIZ'
      : 'OPTIONAL FIELD NOTE';
    $('learning-fact').hidden = !hasFact;
    $('learning-fact').textContent = fact;
    $('learning-quiz').hidden = !hasQuiz;
    $('learning-choices').replaceChildren();
    $('learning-feedback').hidden = true;
    $('learning-feedback').textContent = '';

    if (hasQuiz) {
      $('learning-question').textContent = quiz.question;
      quiz.choices.forEach((choice) => {
        const button = document.createElement('button');
        button.className = 'learning-choice';
        button.type = 'button';
        button.textContent = choice;
        button.addEventListener('click', () => {
          const correct = choice === quiz.answer;
          $('learning-choices')
            .querySelectorAll('.learning-choice')
            .forEach((option) => {
              option.classList.remove('is-correct', 'is-incorrect');
            });
          button.classList.add(correct ? 'is-correct' : 'is-incorrect');
          $('learning-feedback').textContent = correct
            ? `That’s right!${quiz.explanation ? ` ${quiz.explanation}` : ''}`
            : 'Not quite. Try another answer.';
          $('learning-feedback').classList.toggle('correct', correct);
          $('learning-feedback').hidden = false;
          audio.quizAnswer(correct);
        });
        $('learning-choices').append(button);
      });
    }
    $('learning-card').hidden = false;
  }

  function updateTarget() {
    const target = world.destinations[targetIndex];
    $('mission-title').textContent = target.name;
    $('mission-description').textContent = target.discovered
      ? target.info
      : 'Follow the marker. Get close to discover.';
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
    touchSteer.x = 0;
    touchSteer.y = 0;
    joystickPointerId = null;
    $('touch-stick-knob').style.transform = 'translate3d(0, 0, 0)';
  }

  function resume() {
    dialog.close();
    paused = false;
    lastFlightInputAt = performance.now();
    audio.resume();
    game.dataset.state = 'flying';
    clearInput();
  }

  function launch() {
    launched = true;
    lastFlightInputAt = performance.now();
    idleReminderShown = false;
    $('intro').hidden = true;
    $('mission').hidden = false;
    $('reticle').hidden = false;
    $('target-marker').hidden = false;
    $('touch-controls').hidden = false;
    $('pause-button').disabled = false;
    game.classList.add('launched');
    resume();
    notify(
      window.matchMedia('(pointer: coarse)').matches
        ? 'Drag the joystick to steer · Hold THRUST to move · BOOST for speed.'
        : 'Arrow keys steer · W/S adjust thrust · Shift boosts.',
    );
  }

  function openMenu(type) {
    paused = true;
    audio.pause();
    clearInput();
    if (document.pointerLockElement) document.exitPointerLock();
    game.dataset.state = launched ? 'paused' : 'ready';
    if (type === 'help') {
      $('dialog-content').innerHTML =
        `<h2 id="dialog-title">Make yourself at home.</h2><p>A little thrust. A gentle turn. The universe can wait.</p><div class="control-list"><div><span>Increase / decrease thrust</span><span><kbd>W</kbd> <kbd>S</kbd></span></div><div><span>Pitch up / down</span><span><kbd>↑</kbd> <kbd>↓</kbd></span></div><div><span>Turn left / right</span><span><kbd>A</kbd> <kbd>D</kbd> or <kbd>←</kbd> <kbd>→</kbd></span></div><div><span>Roll left / right</span><span><kbd>Q</kbd> <kbd>E</kbd></span></div><div><span>Boost</span><span><kbd>SHIFT</kbd></span></div><div><span>Next destination / camera</span><span><kbd>T</kbd> / <kbd>C</kbd></span></div><div><span>Pause / release mouse</span><span><kbd>ESC</kbd></span></div></div><p class="help-note">Keyboard steering is ready immediately. Press Enter to begin or resume. Press M to enable or disable mouse steering; move away from center to turn. Steering keys clear any mouse turn. Boost recharges when released. On touchscreen, drag the joystick with your left thumb to steer. Hold THRUST to move and BOOST when you need more speed.</p><button class="primary" id="resume-button">${launched ? 'Back to the stars' : 'Got it'} <span>↗</span></button>`;
    } else {
      $('dialog-content').innerHTML =
        `<h2 id="dialog-title">A moment of quiet.</h2><p>Your journey will be here when you’re ready.</p><button class="primary" id="resume-button">Resume exploration <span>↗</span></button><button class="secondary" id="reset-button">Start a new expedition</button>`;
      $('reset-button').addEventListener('click', () => {
        flight.reset();
        lastFlightInputAt = performance.now();
        idleReminderShown = false;
        world.destinations.forEach((d) => {
          d.discovered = false;
          d.visitActive = false;
        });
        fuelCells = 0;
        dismissLearningCard();
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

  function escapeHTML(value) {
    return value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[character],
    );
  }

  function pilotAvatarMarkup(appearance, className = 'pilot-avatar') {
    return `<span class="${className}" aria-hidden="true"><i class="pilot-helmet"></i><i class="pilot-body"></i><i class="pilot-face"></i>${appearance.antenna ? '<i class="pilot-antenna"></i>' : ''}${appearance.halo ? '<i class="pilot-halo"></i>' : ''}</span>`;
  }

  function renderPilotMenu() {
    const gear = getPilotGear(pilotProfile);
    const progress = pilotProfile.claimedDestinations.length;
    const nextUnlock = PILOT_GEAR.filter((item) => item.unlockAt > progress)
      .map((item) => item.unlockAt)
      .sort((a, b) => a - b)[0];
    const itemsFor = (slot) =>
      gear
        .filter((item) => item.slot === slot)
        .map(
          (
            item,
          ) => `<button class="gear-option${item.equipped ? ' equipped' : ''}" data-equip="${item.id}" ${item.unlocked ? '' : 'disabled'}>
        ${item.slot === 'suit' ? `<i class="gear-swatch" style="--swatch:${item.color}"></i>` : '<i class="gear-helmet">✦</i>'}
        <span><strong>${item.name}</strong><small>${item.unlocked ? (item.equipped ? 'EQUIPPED' : 'READY TO WEAR') : `DISCOVER ${item.unlockAt} FUEL CELLS`}</small></span>
        <span class="gear-check">${item.equipped ? '✓' : item.unlocked ? '＋' : '·'}</span>
      </button>`,
        )
        .join('');
    const appearance = getPilotAppearance(pilotProfile);
    $('dialog-content').innerHTML = `<section class="pilot-editor">
      <div class="pilot-preview" style="--pilot-suit:${appearance.suitColor}"><span class="pilot-preview-stars">✦</span>${pilotAvatarMarkup(appearance)}<div><span class="eyebrow">YOUR FLIGHT PARTNER</span><strong>${escapeHTML(pilotProfile.name)}</strong></div></div>
      <h2 id="dialog-title">${pilotProfile.created ? 'Your astronaut' : 'Meet your astronaut'}</h2>
      <p>${pilotProfile.created ? 'Pick a new look any time. Your pilot gear stays saved on this device.' : 'Want a copilot? Make one now, or close this and head straight into space. You can come back whenever you like.'}</p>
      <label class="pilot-name-label" for="pilot-name">ASTRONAUT NAME</label>
      <input id="pilot-name" class="pilot-name-input" maxlength="18" value="${escapeHTML(pilotProfile.name)}" autocomplete="off">
      <div class="gear-heading"><span>SUIT COLOR</span><span>${progress} / ${world.destinations.length} PILOT CELLS</span></div>
      <div class="gear-options">${itemsFor('suit')}</div>
      <div class="gear-heading"><span>HELMET STYLE</span><span>${nextUnlock ? `NEXT GEAR AT ${nextUnlock}` : 'ALL GEAR FOUND'}</span></div>
      <div class="gear-options">${itemsFor('helmet')}</div>
      <button class="primary" id="save-pilot-button">${pilotProfile.created ? 'Save astronaut' : 'Create astronaut'} <span>↗</span></button>
      <button class="pilot-skip" id="pilot-skip-button">${pilotProfile.created ? 'Done' : 'I just want to fly'}</button>
      <div class="pilot-save-note">Progress is saved in this browser. No account needed.</div>
    </section>`;
    $('pilot-name').addEventListener('input', () => {
      pilotProfile.name = $('pilot-name').value.slice(0, 18).trimStart() || 'Nova';
      $('dialog-content').querySelector('.pilot-preview strong').textContent = pilotProfile.name;
    });
    $('dialog-content')
      .querySelectorAll('[data-equip]')
      .forEach((button) => {
        button.addEventListener('click', () => {
          const item = PILOT_GEAR.find((entry) => entry.id === button.dataset.equip);
          if (!item || pilotProfile.claimedDestinations.length < item.unlockAt) return;
          pilotProfile[item.slot] = item.id;
          savePilotProfile(pilotProfile);
          applyPilotAppearance();
          renderPilotMenu();
        });
      });
    $('save-pilot-button').addEventListener('click', () => {
      pilotProfile.name = $('pilot-name').value.trim().slice(0, 18) || 'Nova';
      pilotProfile.created = true;
      const saved = savePilotProfile(pilotProfile);
      applyPilotAppearance();
      $('dialog-content').querySelector('#dialog-title').textContent = `Meet ${pilotProfile.name}!`;
      $('dialog-content').querySelector('.pilot-editor > p').textContent =
        'Your flight partner is ready. Their portrait and name now appear in the Pilot button.';
      $('save-pilot-button').innerHTML = 'Save astronaut <span>↗</span>';
      $('pilot-skip-button').textContent = 'Done';
      if (!saved)
        notify('Astronaut ready. Browser storage is unavailable, so this look may not be saved.');
    });
    $('pilot-skip-button').addEventListener('click', closeMenu);
  }

  function applyPilotAppearance() {
    const appearance = getPilotAppearance(pilotProfile);
    updateAstronaut(appearance);
    const avatar = $('pilot-badge-avatar');
    avatar.style.setProperty('--pilot-suit', appearance.suitColor);
    avatar.innerHTML = pilotAvatarMarkup(appearance, 'pilot-avatar pilot-badge-figure');
    $('pilot-badge-name').textContent = pilotProfile.created ? pilotProfile.name : 'PILOT';
    $('pilot-button').classList.toggle('pilot-created', pilotProfile.created);
    $('pilot-button').setAttribute(
      'aria-label',
      pilotProfile.created
        ? `Open ${pilotProfile.name}'s astronaut gear`
        : 'Create an optional astronaut',
    );
  }
  applyPilotAppearance();

  function openPilotMenu() {
    paused = true;
    audio.pause();
    clearInput();
    if (document.pointerLockElement) document.exitPointerLock();
    game.dataset.state = launched ? 'paused' : 'ready';
    renderPilotMenu();
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
  $('learning-close').addEventListener('click', dismissLearningCard);
  $('learning-done').addEventListener('click', dismissLearningCard);
  $('pilot-button').addEventListener('click', openPilotMenu);
  $('intro-pilot-button').addEventListener('click', openPilotMenu);
  $('pause-button').addEventListener('click', () => openMenu('pause'));
  $('close-dialog').addEventListener('click', closeMenu);
  $('target-button').addEventListener('click', nextTarget);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeMenu();
  });

  const flightKeys = new Set([
    'KeyW',
    'KeyS',
    'KeyA',
    'KeyD',
    'KeyQ',
    'KeyE',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ShiftLeft',
    'ShiftRight',
  ]);
  window.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') {
      if (!$('learning-card').hidden) {
        event.preventDefault();
        dismissLearningCard();
        return;
      }
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
      lastFlightInputAt = performance.now();
      if (['KeyA', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code))
        mouse.x = mouse.y = 0;
    }
    if (event.repeat) return;
    if (event.code === 'KeyM') {
      event.preventDefault();
      toggleMouseSteering();
    }
    if (event.code === 'KeyT') nextTarget();
    if (event.code === 'KeyC') {
      cockpit = !cockpit;
      ship.visible = !cockpit;
      updateCamera(1, true);
      notify(cockpit ? 'Forward camera' : 'Chase camera');
    }
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));
  window.addEventListener('blur', () => {
    if (launched && !paused) openMenu('pause');
    clearInput();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && launched && !paused) openMenu('pause');
  });
  let switchingToKeyboard = false;
  async function toggleMouseSteering() {
    if (!launched || paused || matchMedia('(pointer: coarse)').matches) return;
    if (pointerLocked) {
      switchingToKeyboard = true;
      document.exitPointerLock();
      notify('Keyboard steering enabled.');
      return;
    }
    try {
      await renderer.domElement.requestPointerLock();
      notify('Mouse steering enabled. Press M for keyboard steering.');
    } catch {
      notify('Mouse steering unavailable. Use the arrow keys to steer.');
    }
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
      if (event.movementX || event.movementY) lastFlightInputAt = performance.now();
      mouse.x = THREE.MathUtils.clamp(mouse.x + event.movementX * 0.002, -1, 1);
      mouse.y = THREE.MathUtils.clamp(mouse.y - event.movementY * 0.002, -1, 1);
    }
  });
  document.querySelectorAll('[data-control]').forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      if (paused) return;
      lastFlightInputAt = performance.now();
      button.setPointerCapture(event.pointerId);
      keys.add(button.dataset.control);
    });
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
      button.addEventListener(type, () => keys.delete(button.dataset.control));
  });
  const touchStick = $('touch-stick');
  const touchStickKnob = $('touch-stick-knob');
  function updateTouchSteer(event) {
    const rect = touchStick.getBoundingClientRect();
    const baseRect = touchStick.querySelector('.touch-stick-base').getBoundingClientRect();
    const knobRect = touchStickKnob.getBoundingClientRect();
    const travel =
      (Math.min(baseRect.width, baseRect.height) - Math.min(knobRect.width, knobRect.height)) / 2;
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const distance = Math.hypot(dx, dy);
    const scale = distance > travel ? travel / distance : 1;
    const x = dx * scale;
    const y = dy * scale;
    const deadZone = 0.12;
    const normalized = (value) => {
      const amount = Math.abs(value);
      return amount <= deadZone
        ? 0
        : Math.sign(value) * Math.min((amount - deadZone) / (1 - deadZone), 1);
    };
    touchSteer.x = normalized(x / travel);
    touchSteer.y = normalized(-y / travel);
    touchStickKnob.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }
  touchStick.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    if (paused || joystickPointerId !== null) return;
    lastFlightInputAt = performance.now();
    joystickPointerId = event.pointerId;
    touchStick.setPointerCapture(event.pointerId);
    updateTouchSteer(event);
  });
  touchStick.addEventListener('pointermove', (event) => {
    if (event.pointerId === joystickPointerId && !paused) {
      lastFlightInputAt = performance.now();
      updateTouchSteer(event);
    }
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    touchStick.addEventListener(type, (event) => {
      if (event.pointerId !== joystickPointerId) return;
      joystickPointerId = null;
      touchSteer.x = 0;
      touchSteer.y = 0;
      touchStickKnob.style.transform = 'translate3d(0, 0, 0)';
    });
  }

  function updateCamera(dt, snap = false) {
    cameraPosition
      .set(0, cockpit ? 1.3 : 6, cockpit ? -4.8 : 22)
      .applyQuaternion(flight.quaternion)
      .add(flight.position);
    cameraLook
      .set(0, cockpit ? 1.3 : 2, -80)
      .applyQuaternion(flight.quaternion)
      .add(flight.position);
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
      radar.beginPath();
      radar.arc(center, center, radius, 0, Math.PI * 2);
      radar.stroke();
    }
    radar.beginPath();
    radar.moveTo(12, center);
    radar.lineTo(228, center);
    radar.moveTo(center, 12);
    radar.lineTo(center, 228);
    radar.stroke();
    radar.fillStyle = 'rgba(168, 231, 209, .045)';
    radar.beginPath();
    radar.moveTo(center, center);
    radar.arc(center, center, 108, -Math.PI * 0.75, -Math.PI * 0.25);
    radar.closePath();
    radar.fill();
    inverseRotation.copy(flight.quaternion).invert();
    world.destinations.forEach((destination, i) => {
      localTarget.copy(destination.position).sub(flight.position).applyQuaternion(inverseRotation);
      const x = localTarget.x / 45,
        y = localTarget.z / 45;
      const scale = Math.min(1, 99 / Math.max(1, Math.hypot(x, y)));
      radar.fillStyle = i === targetIndex ? '#b6f1d6' : '#65797d';
      radar.beginPath();
      radar.arc(
        center + x * scale,
        center + y * scale,
        i === targetIndex ? 4 : 2.5,
        0,
        Math.PI * 2,
      );
      radar.fill();
    });
    radar.fillStyle = '#d9eee5';
    radar.beginPath();
    radar.moveTo(120, 112);
    radar.lineTo(115, 125);
    radar.lineTo(120, 122);
    radar.lineTo(125, 125);
    radar.closePath();
    radar.fill();
  }

  function updateHUD() {
    $('speed').textContent = Math.round(flight.speed).toString().padStart(3, '0');
    $('thrust-bar').style.width = `${flight.throttle * 100}%`;
    $('thrust-value').textContent = `${Math.round(flight.throttle * 100)}%`;
    $('boost-bar').style.width = `${flight.energy}%`;
    $('boost-value').textContent = `${Math.round(flight.energy)}%`;
    $('flight-mode').textContent = !launched
      ? 'STANDBY'
      : paused
        ? 'PAUSED'
        : flight.boosting
          ? 'BOOSTING'
          : flight.speed < 1
            ? 'IDLE'
            : 'CRUISING';
    $('coordinates').textContent = flight.position
      .toArray()
      .map((n) => `${n >= 0 ? '+' : '−'}${Math.abs(Math.round(n)).toString().padStart(5, '0')}`)
      .join(' / ');
    $('fuel-cell-tracker').setAttribute('aria-valuenow', fuelCells);
    $('fuel-cell-tracker').setAttribute(
      'aria-valuetext',
      `${fuelCells} of ${world.destinations.length} power cells collected`,
    );
    [...$('fuel-cell-pips').children].forEach((pip, index) => {
      pip.classList.toggle('collected', index < fuelCells);
    });
    drawRadar();
  }

  function updateMarker() {
    const target = world.destinations[targetIndex];
    const distance = flight.position.distanceTo(target.position);
    $('target-distance').textContent = formatDistance(distance);
    camera.updateMatrixWorld();
    projected.copy(target.position).project(camera);
    localTarget.copy(target.position).applyMatrix4(camera.matrixWorldInverse);
    const behind = localTarget.z > 0;
    let x = projected.x,
      y = projected.y;
    if (behind) {
      x = -x;
      y = -y;
      if (Math.abs(x) < 0.01) x = 1;
    }
    const edge = behind || Math.abs(x) > 0.85 || Math.abs(y) > 0.68;
    if (edge) {
      const scale = Math.max(Math.abs(x) / 0.85, Math.abs(y) / 0.68, 0.01);
      x /= scale;
      y /= scale;
    }
    $('target-marker').style.left = `${(x * 0.5 + 0.5) * innerWidth}px`;
    $('target-marker').style.top = `${(-y * 0.5 + 0.5) * innerHeight}px`;
    $('target-marker').classList.toggle('offscreen', edge);
    $('reticle').style.transform =
      `translate(calc(-50% + ${mouse.x * 100}px), calc(-50% - ${mouse.y * 100}px))`;
  }

  function frame(now) {
    const dt = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;
    if (!paused) {
      elapsed += dt;
      const steeringInput = Math.abs(mouse.x) > 0.05 || Math.abs(mouse.y) > 0.05;
      const touchInput = Math.abs(touchSteer.x) > 0.05 || Math.abs(touchSteer.y) > 0.05;
      if (keys.size || steeringInput || touchInput) {
        lastFlightInputAt = performance.now();
      } else if (launched && !idleReminderShown && now - lastFlightInputAt >= 8000) {
        idleReminderShown = true;
        notify('Ready to explore? Hold W or tap THRUST to move toward the destination marker.');
      }
      const pressed = (...codes) => (codes.some((code) => keys.has(code)) ? 1 : 0);
      flight.update(dt, {
        keyboardSteering: pressed(
          'KeyA',
          'KeyD',
          'ArrowUp',
          'ArrowDown',
          'ArrowLeft',
          'ArrowRight',
        ),
        thrust: pressed('KeyW') - pressed('KeyS'),
        yaw: THREE.MathUtils.clamp(
          pressed('KeyD', 'ArrowRight') - pressed('KeyA', 'ArrowLeft') + mouse.x + touchSteer.x,
          -1,
          1,
        ),
        pitch: THREE.MathUtils.clamp(
          pressed('ArrowUp') - pressed('ArrowDown') + mouse.y + touchSteer.y,
          -1,
          1,
        ),
        roll: pressed('KeyE') - pressed('KeyQ'),
        boost: pressed('ShiftLeft', 'ShiftRight'),
      });
      if (flight.resolveCollisions(world.colliders) && elapsed - lastCollision > 2) {
        lastCollision = elapsed;
        notify('Proximity alert. Thrust cut — steer away, then press W.');
      }
      for (const destination of world.destinations) {
        const { distance, range } = getDestinationProximity(
          destination,
          world.planets,
          flight.position,
        );
        if (distance < range && !destination.visitActive) {
          destination.visitActive = true;
          const firstVisit = !destination.discovered;
          destination.discovered = true;
          const energyRestored = firstVisit
            ? Math.min(35, Math.max(0, Math.round(100 - flight.energy)))
            : 0;
          flight.energy += energyRestored;
          let pilotCellEarned = false;
          let newlyUnlocked = [];
          if (firstVisit) {
            fuelCells += 1;
            if (!pilotProfile.claimedDestinations.includes(destination.id)) {
              pilotCellEarned = true;
              pilotProfile.claimedDestinations.push(destination.id);
              newlyUnlocked = PILOT_GEAR.filter(
                (item) => item.unlockAt === pilotProfile.claimedDestinations.length,
              );
              savePilotProfile(pilotProfile);
            }
          }
          const count = world.destinations.filter((d) => d.discovered).length;
          if (firstVisit) {
            const celestialGoal = world.planets.some(
              (body) => body.id === destination.id && body.type !== 'star',
            );
            if (celestialGoal) audio.approach();
            else audio.discover();
            celebrateFuelCell(energyRestored, pilotCellEarned);
            showLearningCard(destination);
          }
          if (newlyUnlocked.length) {
            const names = newlyUnlocked.map((item) => item.name).join(' and ');
            pendingPilotUnlock = `New astronaut gear: ${names}. Open Pilot to try it on.`;
            if ($('learning-card').hidden) dismissLearningCard();
          }
          if (firstVisit) {
            if (
              world.destinations[targetIndex] === destination &&
              count < world.destinations.length
            ) {
              do {
                targetIndex = (targetIndex + 1) % world.destinations.length;
              } while (world.destinations[targetIndex].discovered);
            }
            updateTarget();
          }
        } else if (distance > range + 40) {
          destination.visitActive = false;
        }
      }
      ship.position.copy(flight.position);
      audio.update(dt, flight);
      ship.quaternion.copy(flight.quaternion);
      ship.rotateZ(flight.bank);
      world.update(dt, elapsed, flight.position, flight.quaternion);
      updateCamera(dt);
    } else if (!launched) {
      elapsed += dt;
      ship.position.y = Math.sin(elapsed * 0.6) * 0.14;
      world.update(dt * 0.3, elapsed, flight.position, flight.quaternion);
    }
    for (const plume of exhaust) {
      const strength = !launched ? 0.18 : flight.speed / BOOST_SPEED;
      const thrustAmount = launched ? flight.throttle : 0;
      const flameWidth = 1.1 + thrustAmount * 0.12;
      const flameLength =
        0.4 + strength * 1.8 + thrustAmount * 0.15 + Math.sin(elapsed * 37) * 0.035;
      plume.scale.set(flameWidth, flameLength, flameWidth);
      plume.position.z = 3.2 + 2 * plume.scale.y;
      plume.material.opacity = 0.25 + strength * 0.5;
    }
    updateEngineFlames({ throttle: flight.throttle, boosting: flight.boosting, active: launched });
    hudTimer += dt;
    if (hudTimer > 0.1) {
      updateHUD();
      hudTimer = 0;
    }
    if (launched) updateMarker();
    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, maxPixelRatio));
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
