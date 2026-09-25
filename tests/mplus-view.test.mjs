import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build } from 'esbuild';
import { createRequire } from 'node:module';

test('sekcja M+ pokazuje Top 10 z klasą, ilvl i linkiem do profilu', async () => {
  const result = await build({ entryPoints: ['src/Sections.jsx'], bundle: true, packages: 'external', platform: 'node', format: 'cjs', write: false, logLevel: 'silent' });
  const component = { exports: {} };
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(createRequire(import.meta.url), component, component.exports);
  const { MythicPlus } = component.exports;
  const players = Array.from({ length: 11 }, (_, index) => ({
    name: `Gracz${index + 1}`, realm: 'Burning Legion', className: 'Mage', itemLevel: 310 + index,
    score: 1000 + index * 100, profileUrl: `https://raider.io/characters/eu/burning-legion/Gracz${index + 1}`,
  }));
  const html = renderToStaticMarkup(React.createElement(MythicPlus, { players, apiUrl: '' }));
  assert.equal((html.match(/class="mplus-leader"/g) || []).length, 10);
  assert.match(html, /Gracz11/);
  assert.doesNotMatch(html, /Gracz1(?:<|\s)/);
  assert.match(html, /assets\/classes\/mage\.jpg/);
  assert.match(html, /320<\/strong><small>ilvl/);
  assert.match(html, /href="https:\/\/raider\.io\/characters\/eu\/burning-legion\/Gracz11"/);
});
