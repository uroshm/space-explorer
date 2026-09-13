import { test, expect } from '@playwright/test';

test('launch, fly, discover a beacon, pause, and restart without rendering errors', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page.locator('#viewport canvas')).toBeVisible();
  await expect(page.locator('#error')).toBeHidden();
  await page.screenshot({ path: 'test-results/launch-desktop.png' });
  await page.getByRole('button', { name: 'Begin exploration' }).click();
  await expect(page.locator('#game')).toHaveAttribute('data-state', 'flying');
  await expect
    .poll(() =>
      page
        .locator('audio[data-sound="bg-music"]')
        .evaluate((audio) => !audio.paused && audio.currentTime > 0),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page
        .locator('audio[data-sound="engine"]')
        .evaluate((audio) => !audio.paused && audio.volume > 0),
    )
    .toBe(true);
  await page.getByRole('button', { name: 'Mute audio', exact: true }).click();
  expect(
    await page.locator('audio').evaluateAll((tracks) => tracks.every((audio) => audio.muted)),
  ).toBe(true);
  await page.getByRole('button', { name: 'Unmute audio', exact: true }).click();
  await page.keyboard.down('Shift');
  await expect
    .poll(async () => Number(await page.locator('#speed').textContent()))
    .toBeGreaterThan(180);
  await expect(page.locator('#discovered-count')).toHaveText('01', { timeout: 15000 });
  await expect
    .poll(() =>
      page.locator('audio[data-sound="found"]').evaluate((audio) => audio.currentTime > 0),
    )
    .toBe(true);
  await page.keyboard.up('Shift');
  await expect(page.locator('#mission-title')).toHaveText('Moon outpost');
  await page.keyboard.down('Space');
  await expect.poll(async () => Number(await page.locator('#speed').textContent())).toBeLessThan(3);
  await page.keyboard.up('Space');
  await page.keyboard.press('KeyC');
  await expect(page.locator('#toast')).toHaveText('Forward camera');
  await page.keyboard.press('KeyC');
  await page.screenshot({ path: 'test-results/flight-desktop.png' });
  await page.getByRole('button', { name: 'Pause game' }).click();
  await expect(page.locator('#game')).toHaveAttribute('data-state', 'paused');
  expect(
    await page.locator('audio').evaluateAll((tracks) => tracks.every((audio) => audio.paused)),
  ).toBe(true);
  const coordinates = await page.locator('#coordinates').textContent();
  await page.waitForTimeout(300);
  await expect(page.locator('#coordinates')).toHaveText(coordinates);
  await page.getByRole('button', { name: 'Start a new expedition' }).click();
  await expect(page.locator('#discovered-count')).toHaveText('00');
  await expect(page.locator('#mission-title')).toHaveText('The first signal');
  await page.getByRole('button', { name: /Flight log/ }).click();
  await page.getByRole('button', { name: /Saturn overlook/ }).click();
  await expect(page.locator('#mission-title')).toHaveText('Saturn overlook');
  await page.keyboard.press('KeyT');
  await expect(page.locator('#mission-title')).toHaveText('The outer reaches');
  await page.getByRole('button', { name: /Flight log/ }).click();
  await page.getByRole('button', { name: /Uranus flyby/ }).click();
  await expect(page.locator('#mission-title')).toHaveText('Uranus flyby');
  expect(errors).toEqual([]);
});

test('controls open before launch and touch controls work at a mobile viewport', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto('/');
  await page.getByRole('button', { name: 'Open flight controls' }).click();
  await expect(page.getByRole('heading', { name: 'Make yourself at home.' })).toBeVisible();
  await page.getByRole('button', { name: 'Got it' }).click();
  await expect(page.locator('#game')).toHaveAttribute('data-state', 'ready');
  await page.screenshot({ path: 'test-results/launch-mobile.png' });
  await page.getByRole('button', { name: 'Begin exploration' }).tap();
  await expect(page.locator('#touch-controls')).toBeVisible();
  const thrust = page.locator('[data-control="KeyW"]');
  const box = await thrust.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect
    .poll(async () => Number((await page.locator('#thrust-value').textContent()).replace('%', '')))
    .toBeGreaterThan(40);
  await page.mouse.up();
  await page.screenshot({ path: 'test-results/flight-mobile.png' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});
