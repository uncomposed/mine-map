const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: '**/*.pw.spec.mjs',
  reporter: 'list',
  use: {
    headless: true,
  },
});
