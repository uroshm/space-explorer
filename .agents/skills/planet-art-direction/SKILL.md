---
name: planet-art-direction
description: Use when designing or refining the look, color, surface texture, lighting, or procedural rendering of planets, moons, asteroids, and other celestial objects in Toma’s Space Ship.
---

# Planet Art Direction

Help Toma’s Space Ship give every world a memorable, readable visual identity while keeping its major real features recognizable.

## Workflow

1. Read relevant design notes or image references in this skill's `references/` folder.
2. Inspect the target body's entry in `src/data/bodies.json` and the procedural planet rendering in `src/world.js` before recommending implementation changes.
3. Identify a few defining visual cues for the body: palette, large-scale markings, surface type, silhouette, rings, atmosphere, or lighting.
4. Separate known astronomical features from invented game styling. When a visual fact matters and is uncertain, ask the space-knowledge skill or verify it with a reliable source.
5. Adapt the idea to the current procedural Three.js materials and geometry. Keep details visible from normal gameplay distances and consistent with the rest of the game.

## Design principles

- Give each body a distinct first-glance identity; avoid making neighboring worlds differ only by a small hue shift.
- Use broad, readable shapes before adding fine texture.
- Match visual cues to the body's type: rocky terrain, ice, clouds, gas bands, rings, or other supported features.
- Keep the style colorful, friendly, and legible for young players.
- Prefer procedural or code-native techniques already used in the project over downloaded assets.

## Adding art references

Put concise art-direction notes, palette guides, or approved reference images in `references/`. For each reference, identify the object and the visual details it is meant to inform. Respect the project's asset licensing and attribution needs.
