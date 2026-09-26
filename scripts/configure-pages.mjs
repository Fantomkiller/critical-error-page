import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../dist/site-config.json', import.meta.url);
const config = JSON.parse(await readFile(path, 'utf8'));
const address = process.env.GUILD_API_URL?.trim();
if (address) {
  const api = new URL(address);
  if (api.protocol !== 'https:' || api.username || api.password || api.search || api.hash || api.pathname !== '/') throw new Error('GUILD_API_URL must be an HTTPS origin, for example https://api.example.com/');
  config.rosterApiUrl = new URL('/api/roster', api).href;
  config.applicationEndpoint = new URL('/api/apply', api).href;
} else {
  config.rosterApiUrl = '';
  config.applicationEndpoint = '';
}
await writeFile(path, JSON.stringify(config));
