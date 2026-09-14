import { test, expect } from '@playwright/test';

test('mobile renders fewer scene passes and keeps planet features renderable', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  // Load a blank page on the dev server so the game loop cannot affect these counts.
  await page.goto('/src/data/bodies.json');
  await page.setContent('<body style="margin:0"></body>');
  const counts = await page.evaluate(async () => {
    const THREE = await import('/node_modules/three/build/three.module.js');
    const { createWorld } = await import('/src/world.js');
    const { createShip } = await import('/src/ship.js');
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(390, 844);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    document.body.append(renderer.domElement);
    renderer.info.autoReset = false;
    const camera = new THREE.PerspectiveCamera(58, 390 / 844, 0.1, 100000);
    const counts = [];
    for (const lowQuality of [false, true]) {
      const scene = new THREE.Scene();
      const world = createWorld(scene, { lowQuality });
      const { ship } = createShip({ lowQuality });
      scene.add(ship);
      camera.position.set(0, 6, 22);
      camera.lookAt(0, 2, -80);
      renderer.info.reset();
      renderer.render(scene, camera);
      counts.push({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles });
      if (lowQuality) {
        // Compile and draw the spot and ring paths at close range, too.
        for (const id of ['earth', 'jupiter', 'saturn']) {
          const body = world.planets.find((body) => body.id === id);
          camera.position
            .copy(body.position)
            .add(new THREE.Vector3(0, body.radius, body.radius * 4));
          camera.lookAt(body.position);
          world.update(0, 0, camera.position);
          renderer.render(scene, camera);
        }
      }
      scene.traverse((object) => {
        object.geometry?.dispose();
        object.material?.dispose();
      });
    }
    return counts;
  });
  expect(counts[1].calls).toBeLessThan(counts[0].calls * 0.75);
  expect(counts[1].triangles).toBeLessThan(counts[0].triangles * 0.5);
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/mobile-saturn.png' });
  console.log('Scene render work (desktop, mobile):', counts);
});
