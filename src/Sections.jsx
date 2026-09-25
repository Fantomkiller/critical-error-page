import React, { useEffect, useState } from 'react';
import { mplusSnapshot } from './data/mplus.js';

const discord = 'https://discord.gg/SeJ8mTBdGX';
const audit = 'https://wowaudit.com/guild/eu/burning-legion/critical-error/teams/main';
const rio = 'https://raider.io/guilds/eu/burning-legion/critical%20error';

export function MythicPlus() {
  const [guild, setGuild] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ region: 'eu', realm: 'burning-legion', name: 'Critical Error', fields: 'members' });
    fetch(`https://raider.io/api/v1/guilds/profile?${params}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error('Guild data unavailable'); return response.json(); })
      .then((data) => {
        const members = new Set((data.members || []).map((member) => `${member.character?.name?.toLowerCase()}-${member.character?.realm?.toLowerCase()}`));
        if (members.size) setGuild({ count: members.size, members, updated: data.last_crawled_at });
      }).catch(() => {});
    return () => controller.abort();
  }, []);
  const leaders = mplusSnapshot.players.filter((player) => !guild || guild.members.has(`${player.name.toLowerCase()}-${player.realm.toLowerCase()}`)).slice(0, 8);
  return <section className="mythic-section section-pad" id="mythic" aria-labelledby="mythic-title"><div className="wrap">
    <div className="section-topline"><span>04 / WSPÓLNA GRA</span><span>MYTHIC+</span></div>
    <div className="mythic-layout reveal"><div><p className="eyebrow"><span className="eyebrow-line" /> POZA RAIDEM</p><h2 id="mythic-title">DOBRY KLUCZ<br /><em>Z DOBRYM SKŁADEM.</em></h2></div><p>W gildii są ludzie, którzy regularnie robią wysokie klucze — także poza składem raidowym. Ekipa na M+ zbiera się na czacie Discorda albo bezpośrednio w grze, kiedy akurat jest ochota i skład.</p></div>
    <div className="mythic-cards">
      <div className="mythic-card"><span>01 / DRUŻYNA</span><h3>Łapiemy się na klucze</h3><p>Napisz na gildyjnym czacie Discorda albo odezwij się w grze. Nie ma stałych zapisów ani grafiku kluczy.</p><a href={discord} target="_blank" rel="noopener noreferrer">Wejdź na Discord ↗</a></div>
      <div className="mythic-card"><span>02 / WYSOKIE KLUCZE</span><h3>Gramy ambitnie</h3><p>Część gildii skupia się na M+ i wcale nie musi raidować. Niżej znajdziesz wyniki postaci należących do całej gildii.</p><a href={rio} target="_blank" rel="noopener noreferrer">Sprawdź Raider.IO ↗</a></div>
      <div className="mythic-card"><span>03 / TEAM MAIN</span><h3>Raidowy skład</h3><p>Chcesz zobaczyć konkretnie ekipę raidową? W WoWAudit znajdziesz oddzielny roster Main.</p><a href={audit} target="_blank" rel="noopener noreferrer">Otwórz WoWAudit ↗</a></div>
    </div>
    {leaders.length > 0 && <div className="mplus-leaderboard reveal" aria-labelledby="mplus-leaders-title"><div className="mplus-leaderboard-head"><div><p className="eyebrow"><span className="eyebrow-line" /> CAŁA GILDIA · RAIDER.IO</p><h3 id="mplus-leaders-title">Czołówka <em>kluczy.</em></h3></div><p>Wyniki sezonu {mplusSnapshot.seasonLabel} z {mplusSnapshot.updatedLabel}. {guild ? `Raider.IO potwierdza obecnie ${guild.count} postaci w gildii; pokazujemy tylko tych, którzy nadal do niej należą.` : 'Przynależność do gildii i nowe wyniki sprawdzisz w Raider.IO.'}</p></div><div className="mplus-leader-list">{leaders.map((player, index) => <a key={`${player.name}-${player.realm}`} href={player.url} target="_blank" rel="noopener noreferrer" className="mplus-leader"><span className="mplus-rank">{String(index + 1).padStart(2, '0')}</span><span className="mplus-identity"><strong>{player.name}</strong><small>{player.className} · {player.realm}</small></span><span className="mplus-key">{player.highestKey ? `+${player.highestKey} klucz` : '—'}</span><span className="mplus-score">{Math.round(player.score).toLocaleString('pl-PL')} <small>IO</small></span><span aria-hidden="true">↗</span></a>)}</div><p className="mplus-source">Ranking obejmuje wszystkie postacie z listy gildii w momencie pobrania, nie tylko drużynę Main. Wyniki są migawką; kliknij gracza, aby zobaczyć jego bieżący profil. <a href={rio} target="_blank" rel="noopener noreferrer">Cała gildia w Raider.IO ↗</a></p></div>}
  </div></section>;
}

export function Contact() {
  return <section className="contact-section section-pad" id="kontakt" aria-labelledby="contact-title"><div className="wrap contact-grid reveal"><div><p className="eyebrow"><span className="eyebrow-line" /> KONTAKT</p><h2 id="contact-title">POROZMAWIAJMY<br /><em>NA DISCORDZIE.</em></h2><p>Masz pytanie o skład, raidy albo rekrutację? Wpadnij na serwer i porozmawiaj z nami. Na Discordzie publikujemy informacje i zapisy na raidy; na M+ zbieramy się na czacie lub w grze.</p><a className="button button-primary" href={discord} target="_blank" rel="noopener noreferrer">Wejdź na Discord <span aria-hidden="true">↗</span></a></div><div className="contact-links"><span className="dashboard-label">PRZYDATNE LINKI</span><a href={audit} target="_blank" rel="noopener noreferrer">Drużyna Main w WoWAudit <span>↗</span></a><a href="https://www.warcraftlogs.com/guild/eu/burning-legion/critical%20error" target="_blank" rel="noopener noreferrer">Nasze logi z raidów <span>↗</span></a><a href={rio} target="_blank" rel="noopener noreferrer">Progress i M+ na Raider.IO <span>↗</span></a></div></div></section>;
}
