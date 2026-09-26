import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/api.js';

const main = [{ name: 'Dkadam', className: 'Death Knight', role: 'tank', realm: 'Defias Brotherhood' }];
const url = 'https://guild.example/api/roster';

test('roster pobiera ilvl i rating na żądanie, a drugi odczyt korzysta z cache', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (address) => {
    calls.push(String(address));
    assert.match(String(address), /raider\.io\/api\/v1\/characters\/profile/);
    return Response.json({ name: 'Dkadam', gear: { item_level_equipped: 326.75 }, mythic_plus_scores_by_season: [{ season: 'season-mn-2', scores: { all: 3738.4 } }] });
  });
  const env = { ROSTER_FALLBACK: main, ROSTER_CACHE: {} };
  const first = await worker.fetch(new Request(url), env);
  assert.equal(first.status, 200);
  assert.deepEqual((await first.json()).players, [{ ...main[0], itemLevel: 327, score: 3738 }]);
  const second = await worker.fetch(new Request(url), env);
  assert.equal(second.status, 200);
  assert.equal(calls.length, 1);
});

test('klucz WoWAudit pobiera tylko główne postacie i pozostaje po stronie serwera', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (address, options) => {
    calls.push({ address: String(address), auth: options?.headers?.Authorization });
    if (String(address).includes('wowaudit.com')) return Response.json([
      { name: 'Erum', realm: 'Burning Legion', class: 'Warrior', role: 'Tank', rank: 'Main', status: 'tracking' },
      { name: 'Alt', realm: 'Burning Legion', class: 'Mage', role: 'Ranged', rank: 'Alt', status: 'tracking' },
    ]);
    return Response.json({ gear: { item_level_equipped: 330 }, mythic_plus_scores_by_season: [{ season: 'season-mn-2', scores: { all: 1200 } }] });
  });
  const response = await worker.fetch(new Request(url), { WOWAUDIT_API_KEY: 'secret-test-key', ROSTER_FALLBACK: main, ROSTER_CACHE: {} });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.deepEqual(payload.players, [{ name: 'Erum', realm: 'Burning Legion', className: 'Warrior', role: 'tank', itemLevel: 330, score: 1200 }]);
  assert.equal(calls[0].address, 'https://api.wowaudit.com/v1/characters');
  assert.equal(calls[0].auth, 'Bearer secret-test-key');
  assert.equal(calls.length, 2);
  assert.ok(!JSON.stringify(payload).includes('secret-test-key'));
});

test('brak wyniku postaci nie pokazuje zmyślonego ilvl ani ratingu', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 404 }));
  const response = await worker.fetch(new Request(url), { ROSTER_FALLBACK: main, ROSTER_CACHE: {} });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).players, [{ ...main[0], itemLevel: null, score: null }]);
});
