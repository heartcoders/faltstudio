import { defineConfig } from 'vite';

/** Studio: Startseite, Editor und Ansicht unter einem Ursprung, damit alle dieselbe Bibliothek sehen. */
export default defineConfig({
  /**
   * Relative Pfade im Build: laeuft so unter einem Unterpfad wie
   * `https://<name>.github.io/<repo>/` und genauso auf einer eigenen Domain.
   */
  base: './',
  server: { port: 5173, strictPort: true },
  build: {
    rollupOptions: {
      input: { main: 'index.html', editor: 'editor.html', view: 'view.html' },
    },
  },
});
