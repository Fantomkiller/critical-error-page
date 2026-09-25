import { defineConfig } from 'vite';
import worker from './server/worker.js';
import { rosterSnapshot } from './src/data/roster.js';

const localCache = {};
const localMplusCache = {};
const localApi = {
  name: 'local-guild-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.startsWith('/api/')) return next();
      try {
        const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1:5173'}`);
        const headers = new Headers();
        for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
        const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? Buffer.concat(await Array.fromAsync(req)).toString() : undefined;
        const request = new Request(url, { method: req.method, headers, body });
        const response = await worker.fetch(request, { WOWAUDIT_API_KEY: process.env.WOWAUDIT_API_KEY, DISCORD_APPLICATION_WEBHOOK: process.env.DISCORD_APPLICATION_WEBHOOK, ROSTER_FALLBACK: rosterSnapshot, ROSTER_CACHE: localCache, MPLUS_CACHE: localMplusCache });
        res.statusCode = response.status;
        response.headers.forEach((value, key) => res.setHeader(key, value));
        res.end(Buffer.from(await response.arrayBuffer()));
      } catch (error) { next(error); }
    });
  },
};

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/critical-error-page/' : '/',
  build: { outDir: 'dist', emptyOutDir: true },
  plugins: [localApi],
});
