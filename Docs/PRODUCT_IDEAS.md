# Toma’s Space Ship: Product Ideas

This is a working roadmap of ideas to explore over time. Each item can be designed and built independently; none of them needs to block the others.

## Current foundation

The game already has free-flight exploration, destination discoveries with short facts and quizzes, fuel-cell rewards, an optional astronaut with unlockable suit colors and helmet accessories, and touch controls. These ideas build on those systems rather than replacing them.

## 1. Mission trail and persistent space logbook

Give each flight a clear, child-sized goal, such as visiting a moon, finding a signal, or collecting a fuel cell. Add a logbook that remembers discovered worlds and earned badges between expeditions, so progress feels lasting and children have a reason to return.

**A small first step:** Save the list of discovered destinations and show it in a simple logbook with each world's name and one fact. Keep the current free-exploration mode available.

**Questions to answer:** Should missions be a suggested route or a separate mode? What progress should persist on the device? How can a child tell what to try next without needing to read much?

## 2. Easier-to-learn flying

Help new players understand the controls and reach their first destination without taking away the freedom to explore. A short optional tutorial and an assisted-flight setting could make the first minutes less frustrating. Keep collisions gentle, and make pausing and restarting straightforward.

**A small first step:** Add a skippable tutorial that teaches steering and thrust, then points toward the first beacon. Test it with keyboard and touch controls.

**Questions to answer:** Which control causes the most confusion? Should assistance point toward a target, automatically steer, or both? Can children still take over at any time?

## 3. Support for early readers

Offer spoken instructions and fact cards with captions, alongside large, simple controls. Narration can help children who are not yet comfortable reading, while captions keep the information available without sound. A gamepad option could make the game easier to play on a TV or from the couch.

**A small first step:** Add optional prerecorded narration for the launch instructions and discovery cards, with captions and a clear sound toggle. Avoid microphone or voice-recording features.

**Questions to answer:** Which text is most important to hear aloud? Is the narration pace clear? Do players need a gamepad before or after the tutorial improvements?

## 4. Memorable presentation

Focus polish on moments children will notice: a distinctive ship silhouette, lively planet flybys, satisfying discovery animations, and warm sound effects. A few strong moments can make exploration feel special without adding lots of menus or systems.

**A small first step:** Choose one discovery moment and improve it end to end—for example, approaching a world, triggering a celebratory animation and sound, and opening its learning card. Then refine the ship model as a separate visual task.

**Questions to answer:** Which visual or sound moment gets the strongest reaction? Does it remain clear on small screens? Can the animation be skipped or reduced?

### Ship customization estimate

Ship customization is a good fit if it stays cosmetic and reuses the existing astronaut gear and fuel-cell progression. The ship is assembled in `src/ship.js` from procedural Three.js meshes and shared materials. The pilot profile and gear menu already save locally and unlock cosmetics as destinations are found.

**Small first version — about 1–2 focused development days:** Add a few named paint schemes, accent colors, and engine-glow colors. Add a `SHIP PAINT` section to the existing Pilot menu, preview changes immediately on the ship, and save the selection in the existing local profile. Unlock one or two extra schemes through destination discoveries. No new model files or server are needed.

This touches `src/ship.js` to expose an appearance updater, `src/pilot.js` for the saved selection and unlock validation, `src/main.js` for the menu and live preview, and existing ship/pilot tests. Check that colors read well in both chase and forward views and on small screens.

**Next step — roughly 2–4 additional days:** Add a small number of distinct, swappable visual parts such as wing tips, engine rings, or antenna shapes. Keep each part as a clear preset rather than a freeform editor, and confirm that new geometry does not obscure the pilot, exhaust, or flight silhouette.

**Full ship builder — likely overkill for now:** Freeform part placement, arbitrary color picking, or custom uploaded designs would need a much larger editor, extra persistence and validation, and significant testing across screen sizes. Defer this until family playtests show that preset cosmetics are a major source of replay value.

**Recommendation:** Start with paint and glow presets. Ship customization complements the existing astronaut looks and can make fuel-cell rewards more personal, while a full builder would add complexity before there is evidence it is needed.

## Possible commercial direction

If the game is developed for sale, test a free, short demo with a one-time, parent-facing purchase for the full game or a substantial mission pack. An ad-free experience with no random paid rewards keeps the child's play focused and gives parents a clear choice. Treat this as a hypothesis to validate with families, not a guarantee of sales.

Before building a large feature, observe a few children playing with a parent nearby. Check whether they can start flying, understand the goal, and want to try another mission. Ask parents separately what they value and whether they would pay for a polished version. Use those reactions to choose the next increment.

## Suggested order

1. Observe a few families using the current game and note where they get stuck or lose interest.
2. Improve the first-flight tutorial and beacon guidance.
3. Add a small persistent logbook, then test whether it encourages another visit.
4. Add narration and captions to the most useful learning moments.
5. Add a small set of ship paint and engine-glow presets, then see whether children enjoy earning and choosing them.
6. Polish the discovery sequence and ship presentation based on playtest reactions.
