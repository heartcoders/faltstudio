import { defineConfig } from 'vite';

/**
 * Einbett-Build: eine feste Datei `fl-viewer.js` (ES-Modul) plus nachgeladene
 * Chunks fuer three.js. Gastseiten binden nur diese eine Datei ein.
 */
export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist/embed',
    emptyOutDir: true,
    minify: true,
    lib: { entry: 'src/embed.ts', formats: ['es'], fileName: () => 'fl-viewer.js' },
    rolldownOptions: { output: { minify: true } },
  },
});
