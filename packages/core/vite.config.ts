import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    lib: {
      entry: { index: 'src/index.ts', three: 'src/three/index.ts' },
      formats: ['es'],
    },
    rollupOptions: {
      external: [/^three/],
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
