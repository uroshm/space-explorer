import { test, expect } from '@playwright/test';

test('phone launches, flies, rotates, and resumes without browser errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page.locator('#viewport canvas')).toBeVisible();
  await expect(page.locator('#error')).toBeHidden();
  await page.locator('#launch-button').tap();
  await expect(page.locator('#game')).toHaveAttribute('data-state', 'flying');
  await expect
    .poll(async () => Number(await page.locator('#speed').textContent()))
    .toBeGreaterThan(100);
  await expect(page.locator('#touch-stick')).toBeInViewport();
  await expect(page.locator('[data-control="KeyW"]')).toBeInViewport();
  const before = await page.locator('#coordinates').textContent();
  await expect(page.locator('#coordinates')).not.toHaveText(before);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('#touch-stick')).toBeInViewport();
  await expect(page.locator('[data-control="KeyW"]')).toBeInViewport();
  await page.locator('#pause-button').tap();
  await expect(page.locator('#game')).toHaveAttribute('data-state', 'paused');
  await page.locator('#resume-button').tap();
  await expect(page.locator('#game')).toHaveAttribute('data-state', 'flying');
  const resumed = await page.locator('#coordinates').textContent();
  await expect(page.locator('#coordinates')).not.toHaveText(resumed);
  expect(errors).toEqual([]);
});

test('flight progresses in real time even when rendering falls to five frames per second', async ({
  page,
}) => {
  await page.addInitScript(() => {
    let callback;
    window.requestAnimationFrame = (next) => {
      callback = next;
      return 1;
    };
    window.cancelAnimationFrame = () => {
      callback = null;
    };
    window.advanceSlowFrames = () => {
      const start = performance.now();
      for (let i = 1; i <= 15; i++) callback?.(start + i * 200);
    };
  });
  await page.goto('/');
  await page.locator('#launch-button').tap();
  await page.evaluate(() => window.advanceSlowFrames());
  const z = Number(
    (await page.locator('#coordinates').textContent()).split(' / ')[2].replace('−', '-'),
  );
  expect(z).toBeLessThan(-380);
  await expect(page.locator('#game')).toHaveAttribute('data-state', 'flying');
});

test('phone engine does not change media playback rate every flight frame', async ({ page }) => {
  await page.goto('/');
  const changes = await page.evaluate(async () => {
    const { createAudio } = await import('/src/audio.js');
    const audio = createAudio({ mobile: true });
    const engine = [...document.querySelectorAll('audio[data-sound="engine"]')].at(-1);
    let rateChanges = 0;
    Object.defineProperty(engine, 'playbackRate', {
      get: () => 1,
      set: () => {
        rateChanges++;
      },
    });
    audio.resume();
    for (let i = 0; i < 600; i++) {
      audio.update(1 / 60, { throttle: i / 600, boosting: i > 300 });
    }
    audio.pause();
    return rateChanges;
  });
  expect(changes).toBe(0);
});
