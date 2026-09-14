import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config.js';

export default defineConfig({
  ...base,
  testDir: './tests/mobile',
  projects: [
    {
      name: 'iphone-webkit',
      use: { ...devices['iPhone 13'], launchOptions: {} },
    },
    {
      name: 'android-chromium',
      use: { ...devices['Pixel 7'] },
    },
  ],
});
