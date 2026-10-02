import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  optimizeDeps: {
    include: [
      'lit',
      'lit/decorators.js',
      'lit/directives/class-map.js',
      'lit/directives/style-map.js',
      'three',
      'three/addons/controls/OrbitControls.js',
      'axe-core',
    ],
  },
  test: {
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/internal/test-setup.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});
