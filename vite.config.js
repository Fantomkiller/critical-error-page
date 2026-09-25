import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/critical-error-page/' : '/',
  build: { outDir: 'dist', emptyOutDir: true },
});
