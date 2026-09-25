import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../dist/site-config.json', import.meta.url);
const config = JSON.parse(await readFile(path, 'utf8'));
const address = process.env.GUILD_WORKER_URL?.trim();
if (address) {
  const worker = new URL(address);
  if (worker.protocol !== 'https:' || worker.username || worker.password || worker.search || worker.hash || worker.pathname !== '/') throw new Error('GUILD_WORKER_URL must be an HTTPS origin, for example https://example.workers.dev/');
  config.rosterApiUrl = new URL('/api/roster', worker).href;
  config.applicationEndpoint = new URL('/api/apply', worker).href;
} else {
  config.rosterApiUrl = '';
  config.applicationEndpoint = '';
}
await writeFile(path, JSON.stringify(config));
