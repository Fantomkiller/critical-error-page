import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../dist/site-config.json', import.meta.url);
const config = JSON.parse(await readFile(path, 'utf8'));
config.applicationEndpoint = 'https://critical-error-guild.fantom-killah.chatgpt.site/api/apply';
await writeFile(path, JSON.stringify(config));
