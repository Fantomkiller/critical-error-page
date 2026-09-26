import React, { useEffect, useState } from 'react';
import { fallbackMplus } from './data/liveSnapshot.js';

const discord = 'https://discord.gg/SeJ8mTBdGX';
const rio = 'https://raider.io/guilds/eu/burning-legion/critical%20error';
const rioRanking = 'https://raider.io/guilds/eu/burning-legion/Critical%20Error/mythic-plus-characters';

export function MythicPlus({ players, apiUrl, configReady, assetsBase = '/' }) {
  const [ranking, setRanking] = useState(fallbackMplus);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!configReady) return;
    if (!apiUrl) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    (async () => {
      const response = await fetch(apiUrl, { signal: controller.signal, cache: 'no-store' });
      if (!response.ok) throw new Error('Ranking M+ unavailable');
      const data = await response.json();
      if (!Array.isArray(data.players) || !data.players.length) throw new Error('Invalid M+ ranking');
      if (!controller.signal.aborted) setRanking({ players: data.players, scope: data.scope === 'guild' ? 'guild' : 'main' });
    })().catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [apiUrl, configReady]);
  const source = ranking?.players || players;
  const leaders = source.filter((player) => Number.isFinite(player.score) && player.score > 0)
    .sort((left, right) => right.score - left.score).slice(0, 10);
  const scope = ranking?.scope === 'guild' ? 'GILDIA' : 'DRUŻYNA MAIN';
  return <section className="mythic-section section-pad" id="mythic" aria-labelledby="mythic-title"><div className="wrap">
    <div className="section-topline"><span>04 / WSPÓLNA GRA</span><span>MYTHIC+</span></div>
    <div className="mythic-layout reveal"><div><p className="eyebrow"><span className="eyebrow-line" /> POZA RAIDEM</p><h2 id="mythic-title">DOBRY KLUCZ<br /><em>Z DOBRYM SKŁADEM.</em></h2></div><p>Razem robimy klucze M+. Łapiemy się na Discordzie albo w grze, gdy mamy czas i skład.</p></div>
    <div className="mplus-leaderboard reveal" aria-labelledby="mplus-leaders-title">
      <div className="mplus-leaderboard-head"><div><p className="eyebrow"><span className="eyebrow-line" /> {scope}</p><h3 id="mplus-leaders-title">TOP 10 <em>MYTHIC+.</em></h3></div><p>Najwyższe wyniki M+ wśród {scope === 'GILDIA' ? 'postaci naszej gildii' : 'postaci drużyny Main'}.</p></div>
      {loading && !leaders.length ? <div className="mplus-table-wrap" role="status" aria-label="Pobieramy ranking M+"><table className="mplus-table"><thead><tr><th scope="col">#</th><th scope="col">Postać</th><th scope="col">Rating M+</th></tr></thead><tbody aria-hidden="true">{Array.from({ length: 10 }, (_, index) => <tr className="mplus-leader" key={index}><td className="mplus-rank">{String(index + 1).padStart(2, '0')}</td><td><span className="mplus-identity"><span className="mplus-skeleton-icon stat-skeleton" /><span className="mplus-skeleton-name stat-skeleton" /></span></td><td><span className="mplus-skeleton-score stat-skeleton" /></td></tr>)}</tbody></table></div> : leaders.length ? <div className="mplus-table-wrap"><table className="mplus-table"><thead><tr><th scope="col">#</th><th scope="col">Postać</th><th scope="col">Rating M+</th></tr></thead><tbody>{leaders.map((player, index) => <tr className="mplus-leader" key={`${player.name}-${player.realm}`}><td className="mplus-rank">{String(index + 1).padStart(2, '0')}</td><td><span className="mplus-identity"><img src={`${assetsBase}assets/classes/${player.className.toLowerCase().replace(/\s+/g, '-')}.jpg`} alt="" width="34" height="34" loading="lazy" /><span><strong>{player.name}</strong><small>{player.className} · {player.realm}</small></span></span></td><td className="mplus-score"><strong>{player.score.toLocaleString('pl-PL', { maximumFractionDigits: 1 })}</strong><small>IO</small></td></tr>)}</tbody></table></div> : <p className="mplus-empty">Ranking jest chwilowo niedostępny. Zobacz pełną listę w Raider.IO.</p>}
      <p className="mplus-source">Zobacz <a href={rioRanking} target="_blank" rel="noopener noreferrer">pełny ranking M+ gildii w Raider.IO ↗</a></p>
    </div>
    <div className="mythic-cards">
      <div className="mythic-card"><span>01 / GRAMY RAZEM</span><h3>Łapiemy się na klucze</h3><p>Chcesz iść na M+? Odezwij się na Discordzie lub w grze. Nie mamy stałego grafiku kluczy.</p><a href={discord} target="_blank" rel="noopener noreferrer">Wejdź na Discord ↗</a></div>
      <div className="mythic-card"><span>02 / WYSOKIE KLUCZE</span><h3>Lubimy wyzwania</h3><p>Część z nas gra wysokie klucze także poza raidami.</p><a href={rio} target="_blank" rel="noopener noreferrer">Cała gildia w Raider.IO ↗</a></div>
      <div className="mythic-card"><span>03 / EKIPA</span><h3>Z kim gramy?</h3><p>Zobacz nasz skład, klasy i role. Może spotkamy się na kluczu.</p><a href="#roster">Poznaj naszą drużynę ↗</a></div>
    </div>
  </div></section>;
}

export function Contact() {
  return <section className="contact-section section-pad" id="kontakt" aria-labelledby="contact-title"><div className="wrap contact-grid reveal"><div><p className="eyebrow"><span className="eyebrow-line" /> KONTAKT</p><h2 id="contact-title">POROZMAWIAJMY<br /><em>NA DISCORDZIE.</em></h2><p>Masz pytanie o skład, raidy albo rekrutację? Wpadnij na serwer i porozmawiaj z nami.</p><a className="button button-primary" href={discord} target="_blank" rel="noopener noreferrer">Wejdź na Discord <span aria-hidden="true">↗</span></a></div><div className="contact-links"><span className="dashboard-label">PRZYDATNE LINKI</span><a href="https://www.warcraftlogs.com/guild/eu/burning-legion/critical%20error" target="_blank" rel="noopener noreferrer">Nasze logi z raidów <span>↗</span></a><a href={rio} target="_blank" rel="noopener noreferrer">Progress i M+ na Raider.IO <span>↗</span></a></div></div></section>;
}
