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
  await expect(page.locator('.controls-strip')).not.toContainText('Brake');
  expect(await page.locator('.controls-strip kbd').allTextContents()).not.toContain('SPACE');
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
  await expect(page.locator('#fuel-cell-count')).toHaveText('01');
  await expect(page.locator('#fuel-cell-pop')).toBeVisible();
  await expect(page.locator('#fuel-cell-reward')).toHaveText(/^(?:\+\d+ BOOST|BOOST FULL)$/);
  await expect
    .poll(() =>
      page
        .locator('audio[data-sound="powerup"]')
        .evaluate((audio) => audio.currentTime > 0 && audio.volume <= 0.35),
    )
    .toBe(true);
  await page.keyboard.up('Shift');
  await expect(page.locator('#mission-title')).toHaveText('Solar flyby');
  await page.keyboard.down('KeyS');
  await expect
    .poll(async () => Number((await page.locator('#thrust-value').textContent()).replace('%', '')))
    .toBe(0);
  await page.keyboard.up('KeyS');
  await page.keyboard.press('KeyC');
  await expect(page.locator('#toast')).toHaveText('Forward camera');
  await page.keyboard.press('KeyC');
  await page.screenshot({ path: 'test-results/flight-desktop.png' });
  await page.getByRole('button', { name: 'Pause game' }).click();
  await expect(page.locator('#game')).toHaveAttribute('data-state', 'paused');
  expect(
    await page.locator('audio').evaluateAll((tracks) => tracks.every((audio) => audio.paused)),
  ).toBe(true);
  await page.getByRole('button', { name: 'Start a new expedition' }).click();
  await expect(page.locator('#discovered-count')).toHaveText('00');
  await expect(page.locator('#fuel-cell-count')).toHaveText('00');
  await expect(page.locator('#mission-title')).toHaveText('The first signal');
  await page.keyboard.press('KeyT');
  await expect(page.locator('#mission-title')).toHaveText('Solar flyby');
  await expect(page.locator('#log-button')).toHaveCount(0);
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
  await expect(page.locator('.intro-note')).toHaveCount(0);
  const launchBox = await page.locator('#launch-button').boundingBox();
  const pilotBox = await page.locator('#intro-pilot-button').boundingBox();
  expect(Math.abs(launchBox.x + launchBox.width / 2 - (pilotBox.x + pilotBox.width / 2))).toBeLessThan(1);
  expect(pilotBox.width).toBeCloseTo(launchBox.width, 0);
  await page.getByRole('button', { name: 'Open flight controls' }).click();
  await expect(page.getByRole('heading', { name: 'Make yourself at home.' })).toBeVisible();
  await page.getByRole('button', { name: 'Got it' }).click();
  await expect(page.locator('#game')).toHaveAttribute('data-state', 'ready');
  await page.screenshot({ path: 'test-results/launch-mobile.png' });
  await page.getByRole('button', { name: 'Begin exploration' }).tap();
  await expect(page.locator('#touch-controls')).toBeVisible();
  const stick = page.locator('#touch-stick');
  const stickBox = await stick.boundingBox();
  const stickX = stickBox.x + stickBox.width / 2;
  const stickY = stickBox.y + stickBox.height / 2;
  await page.mouse.move(stickX, stickY);
  await page.mouse.down();
  await page.mouse.move(stickX + 28, stickY - 28, { steps: 5 });
  await expect
    .poll(() => page.locator('#touch-stick-knob').evaluate((knob) => knob.style.transform))
    .not.toBe('translate3d(0, 0, 0)');
  await page.mouse.up();
  await expect(page.locator('#touch-stick-knob')).toHaveCSS(
    'transform',
    'matrix(1, 0, 0, 1, 0, 0)',
  );
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

test('astronaut creation updates and saves the top-right pilot badge', async ({ page }) => {
  await page.addInitScript(() => {
    const key = 'space-explorer-pilot-v1';
    if (!localStorage.getItem(key)) {
      localStorage.setItem(
        key,
        JSON.stringify({
          created: false,
          name: 'Nova',
          suit: 'suit-coral',
          helmet: 'helmet-clear',
          claimedDestinations: ['first-signal'],
        }),
      );
    }
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Create an astronaut · optional' }).click();
  await expect(page.getByRole('heading', { name: 'Meet your astronaut' })).toBeVisible();
  await expect(page.locator('[data-equip="suit-mint"]')).toBeEnabled();
  await page.locator('[data-equip="suit-mint"]').click();
  await page.locator('#pilot-name').fill('Comet');
  await page.getByRole('button', { name: 'Create astronaut' }).click();
  await expect(page.getByRole('heading', { name: 'Meet Comet!' })).toBeVisible();
  await expect(page.locator('#pilot-button')).toHaveAttribute(
    'aria-label',
    "Open Comet's astronaut gear",
  );
  await expect(page.locator('#pilot-badge-name')).toHaveText('Comet');
  await expect(page.locator('#pilot-badge-avatar .pilot-helmet')).toBeVisible();
  await expect(page.locator('#pilot-badge-avatar')).toHaveCSS('--pilot-suit', '#69c9b2');

  await page.reload();
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator('#pilot-button')).toHaveAttribute(
    'aria-label',
    "Open Comet's astronaut gear",
  );
  await expect(page.locator('#pilot-badge-name')).toHaveText('Comet');
  await expect(page.locator('#pilot-badge-name')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/pilot-badge-mobile.png' });
  await page.getByRole('button', { name: /Open Comet's astronaut gear/ }).click();
  await expect(page.locator('[data-equip="suit-mint"]')).toHaveClass(/equipped/);
});
