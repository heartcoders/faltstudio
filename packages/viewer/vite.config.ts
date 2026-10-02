import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: '../../examples',
  server: { port: 5174, strictPort: true },
  build: {
    rollupOptions: {
      input: { main: 'index.html', embed: 'embed.html' },
    },
  },
});
