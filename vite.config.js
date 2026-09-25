import { defineConfig } from 'vite';

export default defineConfig({
  base: '/critical-error-page/',
  build: { outDir: 'dist', emptyOutDir: true },
});
