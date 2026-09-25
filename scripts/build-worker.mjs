import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { rosterSnapshot } from '../src/data/roster.js';

const output = join(process.cwd(), 'dist');
const files = {};

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === 'server' || entry.name === '.openai') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collect(path);
    else if (entry.isFile()) {
      const route = '/' + relative(output, path).split(sep).join('/');
      files[route] = (await readFile(path)).toString('base64');
    }
  }
}

await collect(output);
const worker = await readFile(join(process.cwd(), 'server/worker.js'), 'utf8');
await mkdir(join(output, 'server'), { recursive: true });
await writeFile(join(output, 'server/index.js'), `const BUILT_ROSTER = ${JSON.stringify(rosterSnapshot)};\nconst STATIC_ASSETS = ${JSON.stringify(files)};\n${worker}`);
console.log(`Worker ready with ${Object.keys(files).length} static assets.`);
