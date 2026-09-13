# Space Explorer

A playable 3D space exploration starter built with **Three.js**, **Vite**, and plain JavaScript. Fly the Wanderer around the Solar System, explore five navigation sites, and enjoy the view.

## Run locally

Requires Node.js 22.12+ (or a newer supported LTS release) and a browser with WebGL 2.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, then click **Begin exploration** or press **Enter**.

```sh
npm run build       # Production files in dist/
npm run preview     # Serve the production build locally
npm test            # Flight simulation tests
npm run format      # Format project files with Prettier
npx playwright install chromium
npm run test:browser
```

Run `npm run format` before committing or pushing to keep code and project files consistently formatted.

## Flight controls

| Control        | Action                                                |
| -------------- | ----------------------------------------------------- |
| W / S          | Increase / decrease throttle                          |
| ↑ / ↓          | Pitch up / down                                       |
| A / D or ← / → | Turn left / right                                     |
| Q / E          | Roll left / right                                     |
| Shift          | Boost; consumes charge that automatically regenerates |
| Space          | Brake and reduce throttle to zero                     |
| T              | Select the next destination                           |
| C              | Switch between chase and forward cameras              |
| Escape         | Pause / release mouse steering                        |
| Enter          | Begin exploration / resume                            |
| M              | Toggle mouse steering                                 |

Mouse steering works like a virtual joystick: move away from the center to turn, then move back to fly straight. Keyboard steering is always available; steering keys clear any mouse turn. Touch devices have on-screen steering, throttle, boost, and brake buttons.

Fly within 100 meters of each beacon to discover it. The next undiscovered destination is selected automatically. The flight log also lets you choose a destination. Colliding with a planet or asteroid pushes the ship clear and cuts thrust; steer away and press W to continue. Pause to restart the expedition. Switching away from the window pauses the game.

## Project structure

- `src/main.js` — game loop, cameras, input, menus, discovery progression, HUD and radar.
- `src/flight.js` — frame-rate-aware flight simulation, boost energy and collision response.
- `src/world.js` — seeded stars and asteroids, procedural planet shaders, rings and beacons.
- `src/data/bodies.json` — editable planet and moon catalog, including sizes, colors, positions and features.
- `src/bodies.js` — catalog validation and parent-relative moon positions.
- `src/ship.js` — spaceship geometry and engine exhaust.
- `src/style.css` — responsive game interface.
- `tests/` — simulation tests and browser checks.

Change `src/data/bodies.json` to customize planets and moons, the `destinations` list in `src/world.js` to add exploration sites, and the speed constants in `src/flight.js` to tune handling. Worlds and spaceship meshes are generated in code; no model or texture downloads are needed. Interface fonts are bundled locally.

This starter uses arcade flight and simple spherical obstacle collisions. Planetary rings are decorative. Discoveries last for the current session, and the forward camera is a ship-free view rather than a modeled cockpit. There is no backend or multiplayer.

The body catalog includes Earth, Mars, Earth’s Moon, Jupiter (with a large red spot), Saturn, Uranus, Neptune, Ceres, Pluto, Haumea, Makemake, and Eris. Sizes, positions, and appearances are stylized for gameplay rather than an accurate Solar System simulation.

## Editing celestial bodies

Add or edit entries in `src/data/bodies.json`; save and reload the game (rebuild deployed copies). Each entry needs a unique `id`, `name`, `type` (`planet`, `moon`, or `dwarf-planet`), positive `diameter` in game units, `position` as `[x, y, z]`, and a hex `color`. Optional `secondaryColor` controls terrain or bands; `surface` is `rocky` or `gas`.

The ship starts at `[0, 0, 0]` facing negative Z. A moon’s optional `parent` names another body’s ID and makes its position relative to that body. The Moon uses `earth` as its parent. Bodies do not orbit.

Optional `features.spot` takes `color`, `latitude`, `longitude`, and `size` (horizontal/vertical angular half-widths, all in degrees). Jupiter provides an example. `features.rings` takes `innerRadius`, `outerRadius`, `color`, `outerColor`, and `rotation` (three angles in radians); see Saturn. Rings have no collisions. Navigation beacons are configured separately in `src/world.js`.
