import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../server/worker.js';

const application = {
  roles: ['heal'], className: 'Paladin', specialization: 'Holy',
  character: 'Kandydat', realm: 'Burning Legion', discord: 'gracz.123',
  experience: 'Raider Mythic',
  wednesday: true, thursday: true, monday: false,
  expectations: 'Regularne raidy i spokojna komunikacja.',
  availability: 'Środa i czwartek do 23:00, około 10 godzin na grę w tygodniu.',
  contactTime: 'Po 18:00', note: 'Gram healerem od kilku dodatków.',
};
const request = (changes = {}) => new Request('https://guild.example/api/apply', {
  method: 'POST', headers: { Origin: 'https://guild.example', 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...application, ...changes }),
});

test('zgłoszenie wymaga pełnej, unikalnej nazwy użytkownika Discord', async () => {
  for (const discord of ['', '   ', 'x', 'a'.repeat(33), 'Gracz', 'gracz#1234', '@gracz.123', 'gracz..123', 'gracz 123']) {
    const result = await worker.fetch(request({ discord }), {});
    assert.equal(result.status, 400);
  }
});

test('serwer wymaga oczekiwań, dostępności i pory rozmowy', async () => {
  for (const changes of [{ expectations: '' }, { availability: ' ' }, { contactTime: '' }]) {
    assert.equal((await worker.fetch(request(changes), {})).status, 400);
  }
});

test('zgłoszenie dostarcza kontakt i odpowiedzi rekrutacyjne bez pingowania', async (t) => {
  let delivered;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://discord.example/test-webhook');
    delivered = JSON.parse(options.body);
    return new Response(null, { status: 204 });
  });
  const response = await worker.fetch(request(), { DISCORD_APPLICATION_WEBHOOK: 'https://discord.example/test-webhook' });
  assert.equal(response.status, 200);
  assert.deepEqual(delivered.allowed_mentions, { parse: [] });
  const content = delivered.embeds[0].fields.map((field) => field.value).join('\n');
  for (const value of ['gracz.123', 'Regularne raidy i spokojna komunikacja.', 'około 10 godzin na grę w tygodniu', 'Po 18:00']) assert.ok(content.includes(value), value);
});

test('błąd Discorda nie jest pokazywany jako wysłane zgłoszenie', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 500 }));
  assert.equal((await worker.fetch(request(), { DISCORD_APPLICATION_WEBHOOK: 'https://discord.example/test-webhook' })).status, 503);
});
