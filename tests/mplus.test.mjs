import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/api.js';

const url = 'https://guild.example/api/mplus';

test('ranking M+ pobiera aktywne postacie z całego WoWAudit, także spoza Main', async (t) => {
  globalThis.STATIC_ASSETS = {};
  t.after(() => { delete globalThis.STATIC_ASSETS; });
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (address, options) => {
    calls.push(String(address));
    if (String(address).includes('wowaudit.com')) {
      assert.equal(options.headers.Authorization, 'Bearer test-key');
      return Response.json([
        { name: 'Main', realm: 'Burning Legion', class: 'Warrior', rank: 'Main', status: 'tracking' },
        { name: 'Alt', realm: 'Burning Legion', class: 'Mage', rank: 'Alt', status: 'tracking' },
        { name: 'Old', realm: 'Burning Legion', class: 'Rogue', rank: 'Alt', status: 'archived' },
        { name: 'Pending', realm: 'Burning Legion', class: 'Priest', rank: 'Alt', status: 'pending' },
      ]);
    }
    const name = new URL(String(address)).searchParams.get('name');
    return Response.json({ profile_url: `https://raider.io/characters/eu/burning-legion/${name}`, gear: { item_level_equipped: name === 'Alt' ? 331.8 : 320.2 }, mythic_plus_scores_by_season: [{ scores: { all: name === 'Alt' ? 3700.4 : 2900.2 } }] });
  });
  const env = { WOWAUDIT_API_KEY: 'test-key', ROSTER_FALLBACK: [], MPLUS_CACHE: {} };
  const first = await worker.fetch(new Request(url), env);
  assert.equal(first.status, 200);
  assert.deepEqual(await first.json(), {
    players: [
      { name: 'Main', realm: 'Burning Legion', className: 'Warrior', itemLevel: 320, score: 2900, profileUrl: 'https://raider.io/characters/eu/burning-legion/Main' },
      { name: 'Alt', realm: 'Burning Legion', className: 'Mage', itemLevel: 332, score: 3700, profileUrl: 'https://raider.io/characters/eu/burning-legion/Alt' },
    ],
    nextPage: null,
    scope: 'guild',
  });
  const second = await worker.fetch(new Request(url), env);
  assert.equal(second.status, 200);
  assert.equal(calls.length, 3);
});

test('ranking zbiera więcej niż 40 aktywnych postaci bez pomijania końca listy', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (address) => {
    calls.push(String(address));
    if (String(address).includes('wowaudit.com')) return Response.json(Array.from({ length: 41 }, (_, index) => ({ name: `Player${index + 1}`, realm: 'Burning Legion', class: 'Mage', rank: index ? 'Alt' : 'Main', status: 'tracking' })));
    const name = new URL(String(address)).searchParams.get('name');
    return Response.json({ gear: { item_level_equipped: 320 }, mythic_plus_scores_by_season: [{ scores: { all: name === 'Player41' ? 4000 : 1000 } }] });
  });
  const env = { WOWAUDIT_API_KEY: 'test-key', ROSTER_FALLBACK: [], MPLUS_CACHE: {} };
  const first = await (await worker.fetch(new Request(url), env)).json();
  assert.equal(first.players.length, 40);
  assert.equal(first.nextPage, 1);
  const last = await (await worker.fetch(new Request(`${url}?page=1`), env)).json();
  assert.equal(last.players.length, 1);
  assert.equal(last.players[0].name, 'Player41');
  assert.equal(last.players[0].score, 4000);
  assert.equal(last.nextPage, null);
  assert.equal(calls.filter((address) => address.includes('wowaudit.com')).length, 1);
  assert.equal(calls.filter((address) => address.includes('raider.io/api')).length, 41);
});

test('limit Raider.IO nie zmienia niepełnych wyników w Top 10 gildii', async (t) => {
  t.mock.method(console, 'warn', () => {});
  t.mock.method(globalThis, 'fetch', async (address) => String(address).includes('wowaudit.com')
    ? Response.json([{ name: 'Main', realm: 'Burning Legion', class: 'Mage', rank: 'Main', status: 'tracking' }])
    : new Response(null, { status: 429 }));
  const response = await worker.fetch(new Request(url), { WOWAUDIT_API_KEY: 'test-key', ROSTER_FALLBACK: [], MPLUS_CACHE: {} });
  assert.equal(response.status, 503);
});
