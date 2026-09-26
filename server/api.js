import { rosterSnapshot } from '../src/data/roster.js';

const hitTimes = new Map();
const ROLE_NAMES = { tank: 'Tank', heal: 'Healer', melee: 'Melee DPS', ranged: 'Ranged DPS' };
const rosterCache = {};
const mplusCache = {};
const ROSTER_TTL = 5 * 60 * 1000;
const MPLUS_TTL = 15 * 60 * 1000;

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...(origin === 'https://fantomkiller.github.io' ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}) } });
}

function clean(value, max) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, max);
}

async function loadRoster(env) {
  let players = env.ROSTER_FALLBACK || rosterSnapshot;
  if (env.WOWAUDIT_API_KEY) {
    const response = await fetch('https://api.wowaudit.com/v1/characters', {
      headers: { Authorization: `Bearer ${env.WOWAUDIT_API_KEY}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`WoWAudit HTTP ${response.status}`);
    const roster = await response.json();
    if (!Array.isArray(roster)) throw new Error('WoWAudit returned an invalid roster');
    players = roster.filter((character) => character && character.rank?.toLowerCase() === 'main' && character.status?.toLowerCase() !== 'archived')
      .map((character) => ({
        name: character.name, realm: character.realm, className: character.class,
        role: character.role?.toLowerCase(),
      })).filter((character) => typeof character.name === 'string' && typeof character.realm === 'string' && typeof character.className === 'string' && ['tank', 'heal', 'melee', 'ranged'].includes(character.role));
    if (!players.length) throw new Error('WoWAudit returned no main characters');
  }

  const enriched = new Array(players.length);
  let cursor = 0;
  async function addStats() {
    while (cursor < players.length) {
      const index = cursor++;
      const player = players[index];
      const profile = new URL('https://raider.io/api/v1/characters/profile');
      profile.search = new URLSearchParams({ region: 'eu', realm: player.realm, name: player.name, fields: 'gear,mythic_plus_scores_by_season:current' });
      let itemLevel = null;
      let score = null;
      try {
        const response = await fetch(profile, { signal: AbortSignal.timeout(6500) });
        if (!response.ok) throw new Error(`Raider.IO HTTP ${response.status}`);
        const data = await response.json();
        const gear = Number(data.gear?.item_level_equipped);
        const rating = Number(data.mythic_plus_scores_by_season?.[0]?.scores?.all);
        if (Number.isFinite(gear) && gear > 0) itemLevel = Math.round(gear);
        if (Number.isFinite(rating) && rating >= 0 && data.mythic_plus_scores_by_season?.length) score = Math.round(rating);
      } catch (error) {
        console.warn(`No current profile for ${player.name}: ${String(error)}`);
      }
      enriched[index] = { name: player.name, className: player.className, role: player.role, realm: player.realm, itemLevel, score };
    }
  }
  await Promise.all(Array.from({ length: Math.min(8, players.length) }, () => addStats()));
  return { players: enriched, updatedAt: new Date().toISOString() };
}

async function cachedApiResponse(request, cache, ttl, load, unavailable) {
  const origin = request.headers.get('Origin') || '';
  const updatedAt = Date.parse(cache.payload?.updatedAt || '');
  if (cache.payload && Date.now() - updatedAt < ttl) return json(cache.payload, 200, origin);
  if (cache.payload && cache.retryAfter > Date.now()) return json(cache.payload, 200, origin);

  if (!cache.pending) cache.pending = load().then((payload) => {
    cache.payload = payload;
    cache.retryAfter = 0;
    return payload;
  }).catch((error) => { cache.retryAfter = Date.now() + 60 * 1000; throw error; })
    .finally(() => { cache.pending = null; });

  if (cache.payload) {
    cache.pending.catch((error) => console.warn(`Background refresh failed: ${String(error)}`));
    return json(cache.payload, 200, origin);
  }
  try { return json(await cache.pending, 200, origin); }
  catch (error) {
    console.warn(`Refresh failed: ${String(error)}`);
    return cache.payload ? json(cache.payload, 200, origin) : json({ error: unavailable }, 503, origin);
  }
}

async function getRoster(request, env) {
  return cachedApiResponse(request, env.ROSTER_CACHE || rosterCache, ROSTER_TTL, () => loadRoster(env), 'Skład jest chwilowo niedostępny.');
}

async function loadMplus() {
    const guildPage = await fetch('https://raider.io/guilds/eu/burning-legion/Critical%20Error/mythic-plus-characters', { redirect: 'manual', signal: AbortSignal.timeout(10000) });
    if (!guildPage.ok && ![301, 302, 307, 308].includes(guildPage.status)) throw new Error(`Raider.IO page HTTP ${guildPage.status}`);
    const seasonUrl = new URL(guildPage.headers.get('Location') || guildPage.url, guildPage.url);
    const season = seasonUrl.pathname.match(/\/(season-[^/]+)\/?$/)?.[1];
    if (!season) throw new Error('Raider.IO did not redirect to the current season');

    const rankingUrl = new URL('https://raider.io/api/mythic-plus/rankings/characters');
    rankingUrl.search = new URLSearchParams({ region: 'eu', realm: 'burning-legion', guild: 'Critical Error', season, class: 'all', role: 'all', page: '0' });
    const rankingResponse = await fetch(rankingUrl, { signal: AbortSignal.timeout(10000) });
    if (!rankingResponse.ok) throw new Error(`Raider.IO ranking HTTP ${rankingResponse.status}`);
    const ranking = await rankingResponse.json();
    const rows = ranking.rankings?.rankedCharacters;
    if (!Array.isArray(rows)) throw new Error('Raider.IO returned an invalid ranking');
    const leaders = rows.filter((row) => row?.character?.name && row?.character?.realm?.name && row?.character?.class?.name && Number(row.score) > 0).slice(0, 10);
    if (!leaders.length) throw new Error('Raider.IO returned no ranked guild members');

    const players = leaders.map((row) => ({
      name: row.character.name, realm: row.character.realm.name,
      className: row.character.class.name, score: Math.round(Number(row.score) * 10) / 10,
    }));
    return { players, scope: 'guild', updatedAt: new Date().toISOString() };
}

async function getMplus(request, env) {
  return cachedApiResponse(request, env.MPLUS_CACHE || mplusCache, MPLUS_TTL, loadMplus, 'Ranking M+ jest chwilowo niedostępny.');
}

async function apply(request, env) {
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get('Origin');
  if (origin !== expectedOrigin && origin !== 'https://fantomkiller.github.io') return json({ error: 'Zgłoszenie musi pochodzić z formularza gildii.' }, 403);
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return json({ error: 'Nieprawidłowy format zgłoszenia.' }, 415, origin);
  if (Number(request.headers.get('Content-Length') || 0) > 8000) return json({ error: 'Zgłoszenie jest zbyt długie.' }, 413, origin);
  const raw = await request.text();
  if (raw.length > 8000) return json({ error: 'Zgłoszenie jest zbyt długie.' }, 413, origin);
  let input;
  try { input = JSON.parse(raw); } catch { return json({ error: 'Nieprawidłowe zgłoszenie.' }, 400, origin); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) return json({ error: 'Nieprawidłowe zgłoszenie.' }, 400, origin);
  if (input.website) return json({ ok: true }, 200, origin); // Hidden honeypot field.

  const data = {
    roles: Array.isArray(input.roles) ? [...new Set(input.roles)].filter((role) => typeof role === 'string' && ROLE_NAMES[role]).slice(0, 4) : [],
    className: clean(input.className, 40), specialization: clean(input.specialization, 40),
    character: clean(input.character, 32), realm: clean(input.realm, 50), discord: clean(input.discord, 100),
    expectations: clean(input.expectations, 600), availability: clean(input.availability, 500),
    contactTime: clean(input.contactTime, 120),
    logs: clean(input.logs, 300), raiderio: clean(input.raiderio, 300), experience: clean(input.experience, 80), note: clean(input.note, 1500),
    wednesday: input.wednesday === true, thursday: input.thursday === true, monday: input.monday === true,
  };
  if (!data.roles.length || !data.className || !data.specialization || !data.character || !data.realm || (!data.wednesday && !data.thursday && !data.monday)) return json({ error: 'Uzupełnij wymagane pola.' }, 400, origin);
  if (!/^[a-z0-9._]{2,32}$/.test(data.discord) || data.discord.includes('..')) return json({ error: 'Podaj pełną nazwę użytkownika Discord, na przykład gracz.123. Bez @, spacji i numeru #1234.' }, 400, origin);
  if (!data.expectations || !data.availability || !data.contactTime) return json({ error: 'Uzupełnij oczekiwania, dostępność i godziny krótkiej rozmowy.' }, 400, origin);
  if (data.logs && !/^https:\/\/(www\.)?warcraftlogs\.com\//i.test(data.logs)) return json({ error: 'Podaj poprawny link do Warcraft Logs.' }, 400, origin);
  if (data.raiderio && !/^https:\/\/(www\.)?raider\.io\//i.test(data.raiderio)) return json({ error: 'Podaj poprawny link do Raider.IO.' }, 400, origin);

  const ip = request.headers.get('X-Client-IP');
  const now = Date.now();
  if (hitTimes.size > 1000) hitTimes.clear();
  const last = ip ? hitTimes.get(ip) || 0 : 0;
  if (ip && now - last < 30000) return json({ error: 'Odczekaj chwilę przed kolejnym zgłoszeniem.' }, 429, origin);
  if (!env.DISCORD_APPLICATION_WEBHOOK) return json({ error: 'Rekrutacja jest chwilowo niedostępna. Odezwij się na Discordzie.' }, 503, origin);
  if (ip) hitTimes.set(ip, now);

  const fields = [
    ['Postać / realm', `${data.character} · ${data.realm} (EU)`],
    ['Role / główna klasa / spec', `${data.roles.map((role) => ROLE_NAMES[role]).join(', ')} · ${data.className} · ${data.specialization}`],
    ['Kontakt na Discordzie', data.discord],
    ['Kiedy się odezwać', data.contactTime || 'Nie podano'],
    ['Logi', data.logs || 'Nie podano'],
    ['Raider.IO', data.raiderio || 'Nie podano'],
    ['Doświadczenie', data.experience || 'Nie podano'],
    ['Wieczory raidowe', `Środa: ${data.wednesday ? 'tak' : 'nie'} · Czwartek: ${data.thursday ? 'tak' : 'nie'} · Dodatkowy poniedziałek: ${data.monday ? 'tak' : 'nie'}`],
    ['Dostępność i czas na grę', data.availability],
    ['Czego szuka w gildii', data.expectations],
    ['O sobie', data.note.slice(0, 900) || 'Nie podano'],
    ...(data.note.length > 900 ? [['O sobie (ciąg dalszy)', data.note.slice(900)]] : []),
  ].map(([name, value]) => ({ name, value, inline: false }));

  try {
    const response = await fetch(env.DISCORD_APPLICATION_WEBHOOK, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Critical Error · Rekrutacja', allowed_mentions: { parse: [] }, embeds: [{ title: 'Nowe zgłoszenie do gildii', color: 10038582, fields, timestamp: new Date().toISOString() }] }),
    });
    if (!response.ok) { if (ip) hitTimes.delete(ip); return json({ error: 'Nie udało się dostarczyć zgłoszenia. Spróbuj ponownie lub odezwij się na Discordzie.' }, 503, origin); }
    return json({ ok: true }, 200, origin);
  } catch (_) {
    if (ip) hitTimes.delete(ip);
    return json({ error: 'Nie udało się dostarczyć zgłoszenia. Spróbuj ponownie lub odezwij się na Discordzie.' }, 503, origin);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/roster') {
      if (request.method !== 'GET') return json({ error: 'Metoda niedozwolona.' }, 405);
      return getRoster(request, env);
    }
    if (url.pathname === '/api/mplus') {
      if (request.method !== 'GET') return json({ error: 'Metoda niedozwolona.' }, 405);
      return getMplus(request, env);
    }
    if (url.pathname === '/api/apply') {
      if (request.method === 'OPTIONS' && request.headers.get('Origin') === 'https://fantomkiller.github.io') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': 'https://fantomkiller.github.io', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } });
      if (request.method !== 'POST') return json({ error: 'Metoda niedozwolona.' }, 405);
      return apply(request, env);
    }
    return json({ error: 'Nie znaleziono.' }, 404);
  },
};
