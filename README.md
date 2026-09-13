# Toma’s Space Ship

A playable 3D space exploration game built with **Three.js**, **Vite**, and plain JavaScript. Fly the Wanderer around an ordered, stylized Solar System, visit the Sun and planets, learn space facts, and collect nuclear fuel cells at navigation sites.

Toma’s Space Ship began as a father-son project, sparked by our son's passion for space and a shared curiosity about exploring the Solar System. The game is designed to make that curiosity playful: fly to worlds, discover short facts, answer questions, and make an astronaut your copilot.

## How the repo works

Vite serves and bundles the game as a static website. There is no application server or account system. The main pieces fit together like this:

- `src/main.js` connects the interface, player input, flight simulation, world, learning cards, and discovery rewards.
- `src/world.js` builds the Solar System scene, including procedural planet materials, stars, asteroids, and navigation sites.
- `src/data/bodies.json` describes the celestial bodies; `src/data/learning-content.json` supplies facts and quizzes that appear when players discover matching destinations.
- `src/flight.js` handles movement and collisions, while `src/pilot.js` saves the optional astronaut and unlocked gear in the browser.
- `src/style.css` styles the interface; `tests/` contains simulation and browser tests.

Most game content is editable data, and the planets and ship are generated in code. That makes it possible to add a fact or adjust a planet without downloading a model or texture. The world is deliberately stylized for gameplay rather than physically to scale.

## Run locally

Requires Node.js 22.12+ (or a newer supported LTS release) and a browser with WebGL 2.

```sh
npm install
npm run start # or: npm run dev
```

Open the local URL printed by Vite, then click **Begin exploration** or press **Enter**.

```sh
npm run clean       # Remove generated build output and Vite cache
npm run build       # Production files in dist/
npm run preview     # Serve the production build locally
npm test            # Flight simulation tests
npm run format      # Format project files with Prettier
npx playwright install chromium
npm run test:browser
```

Run `npm run format` before committing or pushing to keep code and project files consistently formatted.

## Project agents and skills

The repo includes Codex agents and skills to help us keep improving the game. Agents are focused helpers you can ask to work on a particular kind of task; skills are reusable instructions and project knowledge they consult. They do not run inside the game.

- **space-expert** (`.codex/agents/space-expert.toml`) uses the `$space-knowledge` skill to check astronomy details and shape short, age-appropriate word cards, questions, and fun facts.
- **artist** (`.codex/agents/artist.toml`) uses the `$planet-art-direction` skill to plan each planet's visual character, surface, and texture.

Ask Codex to use `space-expert` when working on learning content or `artist` when working on visuals. You can also invoke a skill directly with `$space-knowledge` or `$planet-art-direction`.

To give an agent more project knowledge, add concise source notes to the matching skill's `.agents/skills/<skill-name>/references/` folder. For example, astronomy sources go in `space-knowledge/references/`, and visual references or palette notes go in `planet-art-direction/references/`. The skill tells Codex when to read them. To add another specialty, create a new `.codex/agents/<name>.toml` definition and a matching `.agents/skills/<skill-name>/SKILL.md`; Codex discovers repository skills automatically, though a restart may be needed if a new one does not appear.

## Deploy to GitHub Pages

This game is a static site, so GitHub Pages can host it without a server. The workflow in `.github/workflows/deploy.yml` builds and publishes the game whenever a commit reaches `main`. In the repository's **Settings → Pages**, set the build and deployment source to **GitHub Actions** once. For this repository, the site will be at <https://uroshm.github.io/tomas-spaceship/> after the first successful deployment.

To publish committed changes from your local checkout, run:

```sh
./deploy.sh
```

The script checks the production build and pushes `main`; GitHub Actions then updates the live site. Commit or stash local changes first. You can also push to `main` directly to trigger a deployment.

## Flight controls

| Control        | Action                                                |
| -------------- | ----------------------------------------------------- |
| W / S          | Increase / decrease throttle                          |
| ↑ / ↓          | Pitch up / down                                       |
| A / D or ← / → | Turn left / right                                     |
| Q / E          | Roll left / right                                     |
| Shift          | Boost; consumes charge that automatically regenerates |
| T              | Select the next destination                           |
| C              | Switch between chase and forward cameras              |
| Escape         | Pause / release mouse steering                        |
| Enter          | Begin exploration / resume                            |
| Touchscreen    | Drag the left joystick; hold THRUST or BOOST to move  |
| M              | Toggle mouse steering                                 |

Mouse steering works like a virtual joystick: move away from the center to turn, then move back to fly straight. Keyboard steering is always available; steering keys clear any mouse turn. Touch devices have on-screen steering, throttle, and boost controls.

Get close to a site to discover it and collect a nuclear fuel cell. Each first visit in an expedition awards a cell that restores up to 35 boost-energy points; the HUD tracks collected cells. The next undiscovered destination is selected automatically, and you can cycle destinations with T. Colliding with a planet or asteroid pushes the ship clear and cuts thrust; steer away and press W to continue. Pause to restart the expedition. Switching away from the window pauses the game.

Creating an astronaut is optional: choose **Create an astronaut** on the start screen or open **Pilot** while playing. Fuel cells found at new destinations unlock suit colors and helmet accessories. The pilot, selected gear, and once-only cosmetic rewards save in the current browser; no account or sign-in is needed, and progress does not sync between devices.

## Project structure

- `src/main.js` — game loop, cameras, input, menus, discovery progression, HUD and radar.
- `src/pilot.js` — optional astronaut profile, browser persistence and fuel-cell gear unlocks.
- `src/flight.js` — frame-rate-aware flight simulation, boost energy and collision response.
- `src/world.js` — seeded stars and asteroids, procedural planet shaders, rings and beacons.
- `src/data/bodies.json` — editable planet and moon catalog, including sizes, colors, positions and features.
- `src/data/learning-content.json` — facts and three-choice quizzes matched to discovered destinations.
- `src/bodies.js` — catalog validation and parent-relative moon positions.
- `src/audio.js` — game sound effects.
- `src/ship.js` — spaceship geometry and engine exhaust.
- `src/style.css` — responsive game interface.
- `tests/` — simulation tests and browser checks.

Change `src/data/bodies.json` to customize planets and moons, the `destinations` list in `src/world.js` to add exploration sites, and the speed constants in `src/flight.js` to tune handling. Worlds and spaceship meshes are generated in code; no model or texture downloads are needed. Interface fonts are bundled locally.

This starter uses arcade flight and simple spherical obstacle collisions. Planetary rings are decorative. World discoveries last for the current expedition; astronaut cosmetics persist in browser storage. The forward camera is a ship-free view rather than a modeled cockpit. There is no backend, account system, cross-device sync, or multiplayer.

The body catalog follows the Solar System order: Mercury, Venus, Earth and its Moon, Mars, Ceres, Jupiter, Saturn, Uranus, Neptune, Pluto, Haumea, Makemake, and Eris. The Sun is a visible destination in the game world. Sizes, positions, and appearances are stylized for gameplay rather than an accurate Solar System simulation.

## Editing celestial bodies

Add or edit entries in `src/data/bodies.json`; save and reload the game (rebuild deployed copies). Each entry needs a unique `id`, `name`, `type` (`planet`, `moon`, or `dwarf-planet`), positive `diameter` in game units, `position` as `[x, y, z]`, and a hex `color`. Optional `secondaryColor` controls terrain or bands; `surface` is `rocky` or `gas`.

The ship starts at `[0, 0, 0]` facing negative Z. A moon’s optional `parent` names another body’s ID and makes its position relative to that body. The Moon uses `earth` as its parent. Bodies do not orbit.

Optional `features.spot` takes `color`, `latitude`, `longitude`, and `size` (horizontal/vertical angular half-widths, all in degrees). Jupiter provides an example. `features.rings` takes `innerRadius`, `outerRadius`, `color`, `outerColor`, and `rotation` (three angles in radians); see Saturn. Rings have no collisions. Navigation beacons are configured separately in `src/world.js`.
