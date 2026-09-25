import { writeFile } from 'node:fs/promises';

// Refresh the full guild, including members who do not raid with Team Main.
// Run in GitHub Actions on a schedule; never make hundreds of API calls per visitor.
const origin = 'https://critical-error-guild.fantom-killah.chatgpt.site';
const guildUrl = new URL('https://raider.io/api/v1/guilds/profile');
guildUrl.search = new URLSearchParams({ region: 'eu', realm: 'burning-legion', name: 'Critical Error', fields: 'members' });
let waitUntil = 0;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    if (waitUntil > Date.now()) await sleep(waitUntil - Date.now());
    try {
      const response = await fetch(url, { headers: { Origin: origin }, signal: AbortSignal.timeout(20000) });
      if (response.ok) return response.json();
      if (response.status === 429 || response.status >= 500) {
        const delay = response.status === 429 ? Number(response.headers.get('Retry-After')) * 1000 : 3000 * (attempt + 1);
        waitUntil = Math.max(waitUntil, Date.now() + Math.min(120000, Number.isFinite(delay) && delay > 0 ? delay : 30000));
        continue;
      }
      throw new Error(`Raider.IO HTTP ${response.status}`);
    } catch (error) {
      if (attempt === 4 || !/fetch failed|TimeoutError|AbortError/i.test(String(error))) throw error;
      await sleep(1500 * (attempt + 1));
    }
  }
  throw new Error('Raider.IO rate limit persisted after retries');
}

const guild = await getJson(guildUrl);
const members = [...new Map((guild.members || [])
  .filter((item) => item.character?.name && item.character?.realm)
  .map((item) => [`${item.character.name.toLowerCase()}-${item.character.realm.toLowerCase()}`, item.character])).values()];
if (members.length < 30) throw new Error('Guild members missing; keeping previous snapshot');
const results = new Array(members.length);
let cursor = 0;
async function worker() {
  while (cursor < members.length) {
    const index = cursor++;
    const member = members[index];
    const url = new URL('https://raider.io/api/v1/characters/profile');
    url.search = new URLSearchParams({ region: 'eu', realm: member.realm, name: member.name, fields: 'mythic_plus_scores_by_season:current,mythic_plus_highest_level_runs' });
    try {
      const data = await getJson(url);
      results[index] = {
        name: member.name, realm: member.realm, className: member.class,
        url: member.profile_url, season: data.mythic_plus_scores_by_season?.[0]?.season,
        score: Number(data.mythic_plus_scores_by_season?.[0]?.scores?.all || 0),
        highestKey: Math.max(0, ...(data.mythic_plus_highest_level_runs || []).map((run) => Number(run.mythic_level) || 0)),
      };
    } catch (error) {
      console.warn(`Cannot refresh ${member.name}: ${String(error)}`);
    }
  }
}
await Promise.all(Array.from({ length: 4 }, () => worker()));
const valid = results.filter(Boolean);
if (valid.length < members.length * .9) throw new Error(`Only ${valid.length}/${members.length} profiles updated; keeping previous snapshot`);
const season = valid.find((player) => player.season)?.season || '';
if (!season) throw new Error('Current M+ season is unknown; keeping previous snapshot');
const players = valid.filter((player) => player.season === season && player.score > 0)
  .sort((a, b) => b.score - a.score).slice(0, 20);
const updatedAt = new Date().toISOString();
const updatedLabel = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Warsaw' }).format(new Date(updatedAt));
const seasonLabel = season.replace(/^season-mn-/, 'Midnight ').replace(/^season-tww-/, 'The War Within ');
const snapshot = { updatedAt, updatedLabel, season, seasonLabel, guildCount: members.length, scannedCount: valid.length, players };
await writeFile(new URL('../src/data/mplus.js', import.meta.url), `// Generated from the official Raider.IO API. Run npm run sync:rio to refresh.\nexport const mplusSnapshot = ${JSON.stringify(snapshot, null, 2)};\n`);
console.log(`Updated ${valid.length}/${members.length} characters for ${season}; top score ${players[0]?.score ?? 0}`);
