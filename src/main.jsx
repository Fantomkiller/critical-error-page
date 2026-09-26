import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { rosterSnapshot } from './data/roster.js';
import Recruitment from './Recruitment.jsx';
import { MythicPlus, Contact } from './Sections.jsx';
import './style.css';

const links = {
  discord: 'https://discord.gg/SeJ8mTBdGX',
  logs: 'https://www.warcraftlogs.com/guild/eu/burning-legion/critical%20error',
  rio: 'https://raider.io/guilds/eu/burning-legion/critical%20error',
};
const classColors = {
  'Death Knight': '#c85260', 'Demon Hunter': '#a66aca', Druid: '#d79954',
  Evoker: '#53a5a0', Hunter: '#96b667', Mage: '#78b5cf', Monk: '#48b59e',
  Paladin: '#e1a8bf', Priest: '#eee4ce', Rogue: '#e6c46c', Shaman: '#6e9ad6',
  Warlock: '#a69be1', Warrior: '#c4a67e',
};
const roleNames = { tank: 'Tank', heal: 'Heal', melee: 'Melee', ranged: 'Ranged' };
const rosterGroups = [['tank', 'TANKOWIE'], ['heal', 'HEALERZY'], ['melee', 'MELEE DPS'], ['ranged', 'RANGED DPS']];
const normalize = (value) => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pl');

function External({ href, children, ...props }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
}

function Brand() {
  return <a className="brand" href="#top" aria-label="Critical Error, strona główna">
    <span className="brand-mark" aria-hidden="true">CE<span className="brand-slash">/</span></span>
    <span className="brand-name">CRITICAL <span>ERROR</span><small>EU · BURNING LEGION</small></span>
  </a>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return <header className="site-header" id="top"><div className="nav-shell wrap">
    <Brand />
    <button className="menu-toggle" type="button" aria-label={open ? 'Zamknij menu' : 'Otwórz menu'} aria-controls="site-nav" aria-expanded={open} onClick={() => setOpen(!open)}><span /><span /><span /></button>
    <nav id="site-nav" className={`site-nav ${open ? 'open' : ''}`} aria-label="Nawigacja główna" onClick={close}>
      <a href="#o-nas">Gildia</a><a href="#roster">Załoga</a><a href="#rekrutacja">Rekrutacja</a><a href="#mythic">Mythic+</a><a href="#raid">Raid</a><a className="nav-join" href="#kontakt">Kontakt <span aria-hidden="true">↗</span></a>
    </nav>
  </div></header>;
}

function Hero() {
  return <section className="hero" aria-labelledby="hero-title">
    <div className="hero-art" role="img" aria-label="Mroczna cytadela pod burgundowym burzowym niebem" /><div className="hero-shade" />
    <div className="hero-content wrap">
      <p className="eyebrow"><span className="eyebrow-line" /> WORLD OF WARCRAFT <span className="eyebrow-separator">/</span> EU BURNING LEGION</p>
      <h1 id="hero-title">CRITICAL<br /><em>ERROR</em><span className="title-stop">.</span></h1>
      <p className="hero-lead">Semi-hardcore. Regularny progres. Cel: <strong>Cutting Edge.</strong> Dołącz do składu, który chce sięgać wyżej.</p>
      <div className="hero-actions"><a className="button button-primary" href="#rekrutacja">Zgłoś się do gildii <span aria-hidden="true">↗</span></a><a className="button button-ghost" href="#roster">Poznaj nasz skład <span aria-hidden="true">↗</span></a></div>
    </div>
    <div className="hero-bottom wrap" aria-hidden="true"><span>01 / CRITICAL ERROR</span><span className="hero-scroll">PRZEWIŃ, ŻEBY POZNAĆ GILDIĘ <span>↓</span></span></div>
  </section>;
}

function useRoster(config) {
  const [players, setPlayers] = useState(rosterSnapshot);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!config.ready) return;
    if (!config.rosterApiUrl) { setLoading(false); return; }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    fetch(config.rosterApiUrl, { signal: controller.signal, cache: 'no-store' })
      .then((response) => { if (!response.ok) throw new Error('Roster API unavailable'); return response.json(); })
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : payload.players;
        if (!Array.isArray(list) || !list.length) throw new Error('Invalid roster');
        const valid = list.filter((p) => p && typeof p.name === 'string' && typeof p.className === 'string' && roleNames[p.role] && typeof p.realm === 'string')
          .map((p) => ({ ...p, itemLevel: Number.isFinite(p.itemLevel) && p.itemLevel > 0 ? p.itemLevel : null, score: Number.isFinite(p.score) && p.score >= 0 ? p.score : null }));
        if (!valid.length) throw new Error('No valid players');
        setPlayers(valid);
      }).catch(() => {})
      .finally(() => { clearTimeout(timer); if (!controller.signal.aborted) setLoading(false); });
    return () => { clearTimeout(timer); controller.abort(); };
  }, [config.ready, config.rosterApiUrl]);
  return { players, loading };
}

function Roster({ players, loading }) {
  const [role, setRole] = useState('all');
  const [query, setQuery] = useState('');
  const counts = useMemo(() => Object.fromEntries(Object.keys(roleNames).map((key) => [key, players.filter((p) => p.role === key).length])), [players]);
  const visible = useMemo(() => players.filter((p) => (role === 'all' || p.role === role) && (!query.trim() || normalize(`${p.name} ${p.className} ${p.realm}`).includes(normalize(query.trim())))), [players, role, query]);
  const groups = rosterGroups.map(([key, label]) => ({ key, label, players: visible.filter((player) => player.role === key) })).filter((group) => group.players.length);
  return <section className="roster-section section-pad" id="roster" aria-labelledby="roster-title"><div className="wrap">
    <div className="section-topline"><span>02 / DRUŻYNA</span><span>EU · BURNING LEGION</span></div>
    <div className="roster-heading reveal"><div><p className="eyebrow"><span className="eyebrow-line" /> TEAM MAIN</p><h2 id="roster-title">NASZ <em>SKŁAD.</em></h2></div><p>Poznaj graczy, z którymi razem raidujemy. Różne klasy, jeden cel.</p></div>
    <div className="roster-toolbar"><div className="role-filters" role="group" aria-label="Filtruj według roli">
      {[['all', 'Wszyscy'], ['tank', 'Tank'], ['heal', 'Heal'], ['melee', 'Melee'], ['ranged', 'Ranged']].map(([key, title]) => <button key={key} type="button" className={`filter ${role === key ? 'active' : ''}`} aria-pressed={role === key} onClick={() => setRole(key)}>{title} <span>{key === 'all' ? players.length : counts[key]}</span></button>)}
    </div><label className="search-box"><span className="search-icon" aria-hidden="true">⌕</span><span className="sr-only">Szukaj postaci, klasy lub realmu</span><input type="search" placeholder="Szukaj postaci…" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
    <div className="roster-status" aria-live="polite">{visible.length} {visible.length === 1 ? 'postać' : visible.length >= 2 && visible.length <= 4 ? 'postacie' : 'postaci'}</div>
    {groups.map((group) => <div className="roster-group" key={group.key}><div className="roster-group-heading"><h3>{group.label}</h3><span>{group.players.length} {group.players.length === 1 ? 'postać' : group.players.length >= 2 && group.players.length <= 4 ? 'postacie' : 'postaci'}</span></div><div className="roster-grid" aria-label={`${group.label}, lista postaci`}>{group.players.map((player) => <div className="player-card" style={{ '--class-color': classColors[player.className] || '#b89767' }} key={`${player.name}-${player.realm}`}>
      <img className="player-class-icon" src={`${import.meta.env.BASE_URL}assets/classes/${player.className.toLowerCase().replace(/\s+/g, '-')}.jpg`} alt="" width="34" height="34" loading="lazy" />
      <span className="player-identity"><strong className="player-name">{player.name}</strong><small title={`${player.className}, ${player.realm}`}>{player.className} · {player.realm}</small></span>
      <span className="player-stat" title="Poziom przedmiotów"><strong>{player.itemLevel ?? (loading ? <><span className="stat-skeleton" aria-hidden="true" /><span className="sr-only">Ładowanie</span></> : 'brak')}</strong><small>ilvl</small></span>
      <span className="player-stat" title="Rating Mythic+"><strong>{player.score != null ? player.score.toLocaleString('pl-PL') : (loading ? <><span className="stat-skeleton stat-skeleton-wide" aria-hidden="true" /><span className="sr-only">Ładowanie</span></> : 'brak')}</strong><small>M+ rating</small></span>
    </div>)}</div></div>)}
    {visible.length === 0 && <div className="roster-empty">Nie znaleźliśmy postaci. Zmień frazę lub wybierz inną rolę.</div>}
  </div></section>;
}

function Progress() {
  const [progress, setProgress] = useState(null);
  const [state, setState] = useState('Sprawdzamy progress…');
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const params = new URLSearchParams({ region: 'eu', realm: 'burning-legion', name: 'Critical Error', fields: 'raid_progression:current-tier' });
    fetch(`https://raider.io/api/v1/guilds/profile?${params}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error('API error'); return response.json(); })
      .then((data) => { const [slug, raid] = Object.entries(data.raid_progression || {})[0] || []; if (!raid?.total_bosses) throw new Error('No current raid'); setProgress({ slug, raid }); setState(''); })
      .catch(() => setState('Nie udało się pobrać progressu'))
      .finally(() => clearTimeout(timer));
    return () => { clearTimeout(timer); controller.abort(); };
  }, []);
  const raidNames = { 'the-venomous-abyss': 'The Venomous Abyss', sporefall: 'Sporefall', 'the-tidebound-grotto': 'The Tidebound Grotto' };
  const name = progress ? raidNames[progress.slug] || progress.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Aktualny raid';
  return <section className="progress-section section-pad" id="raid" aria-labelledby="progress-title"><div className="wrap">
    <div className="section-topline"><span>05 / ZOBACZ NAS W AKCJI</span><span>RAID · MYTHIC</span></div>
    <div className="progress-heading reveal"><div><p className="eyebrow dark-eyebrow"><span className="eyebrow-line" /> RAIDING</p><h2 id="progress-title">PROGRESS<br /><em>W PRAKTYCE.</em></h2></div><p>Zobacz, jak idzie nam w bieżącym raidzie.</p></div>
    <div className="raid-dashboard"><div className="raid-schedule"><span className="dashboard-label">GODZINY RAIDÓW</span><h3>ŚRODA <span>&</span> CZWARTEK</h3><strong>19:45 - 23:00</strong><p>Czasem raidujemy też w poniedziałek. Terminy i zapisy znajdziesz na Discordzie.</p><External className="text-link raid-discord" href={links.discord}>Zapisy na Discordzie ↗</External></div>
      <div className="live-progress" aria-live="polite"><div className="live-heading"><span className="dashboard-label">AKTUALNY PROGRESS</span><span className={`live-indicator ${progress ? 'ready' : ''}`}>{state}</span></div><h3>{name}</h3><div className="progress-modes">{[['mythic', 'mythic_bosses_killed'], ['heroic', 'heroic_bosses_killed'], ['normal', 'normal_bosses_killed']].map(([difficulty, key]) => <div key={key}><strong>{progress ? `${progress.raid[key] ?? 0}/${progress.raid.total_bosses}` : '?'}</strong><span>{difficulty.toUpperCase()}</span></div>)}</div><p>Zobacz szczegóły raidów i walk naszych graczy.</p><External className="text-link" href={links.rio}>Progress w Raider.IO <span aria-hidden="true">↗</span></External></div>
    </div>
  </div></section>;
}

function App() {
  const [config, setConfig] = useState({ ready: false });
  const { players, loading: rosterLoading } = useRoster(config);
  const counts = useMemo(() => Object.fromEntries(Object.keys(roleNames).map((key) => [key, players.filter((p) => p.role === key).length])), [players]);
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}site-config.json`, { cache: 'no-store' }).then((res) => res.ok ? res.json() : {}).then((data) => setConfig({ ...data, ready: true })).catch(() => setConfig({ ready: true }));
  }, []);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
    document.documentElement.classList.add('motion-ready');
    return () => { observer.disconnect(); document.documentElement.classList.remove('motion-ready'); };
  }, []);
  const applicationEndpoint = config.applicationEndpoint === '/api/apply' || (typeof config.applicationEndpoint === 'string' && typeof config.rosterApiUrl === 'string' && (() => { try { const application = new URL(config.applicationEndpoint); const roster = new URL(config.rosterApiUrl); return application.protocol === 'https:' && application.pathname === '/api/apply' && roster.pathname === '/api/roster' && application.origin === roster.origin; } catch { return false; } })()) ? config.applicationEndpoint : null;
  return <>
    <a className="skip-link" href="#main">Przejdź do treści</a><Header />
    <main id="main"><Hero />
      <section className="numbers" aria-label="Skład głównej drużyny"><div className="wrap numbers-grid"><div className="number-lead"><span className="micro-label">DRUŻYNA MAIN</span><strong>Jeden skład.<br />Wiele ról.</strong></div><div className="number"><strong>{players.length}</strong><span>postaci w rosterze</span></div><div className="number"><strong>{counts.tank}<span className="number-accent"> / </span>{counts.heal}</strong><span>tanków / healerów</span></div><div className="number"><strong>{counts.melee + counts.ranged}</strong><span>postaci DPS</span></div></div></section>
      <section className="intro section-pad" id="o-nas" aria-labelledby="about-title"><div className="wrap intro-grid reveal"><div className="section-heading"><p className="eyebrow dark-eyebrow"><span className="eyebrow-line" /> KIM JESTEŚMY</p><h2 id="about-title">NAJLEPSZE<br />PULLE ROBI SIĘ<br /><em>RAZEM.</em></h2></div><div className="intro-copy"><p className="large-copy">Critical Error to gildia semi-hardcore na EU Burning Legion. Regularnie raidujemy, wspólnie robimy klucze M+ i budujemy skład z ambicją na Cutting Edge.</p><a className="text-link" href="#roster">Zobacz wszystkich graczy <span aria-hidden="true">↗</span></a></div></div></section>
      <Roster players={players} loading={rosterLoading} /><Recruitment endpoint={applicationEndpoint} /><MythicPlus players={players} apiUrl={config.rosterApiUrl?.replace(/\/api\/roster$/, '/api/mplus')} configReady={config.ready} assetsBase={import.meta.env.BASE_URL} /><Progress /><Contact />
    </main>
    <footer className="site-footer"><div className="wrap footer-top"><Brand /><p>Do zobaczenia po drugiej stronie portalu.</p></div><div className="wrap footer-bottom"><span>© {new Date().getFullYear()} CRITICAL ERROR</span><div><External href={links.discord}>Discord ↗</External><External href={links.logs}>Warcraft Logs ↗</External><External href={links.rio}>Raider.IO ↗</External></div></div><div className="wrap legal-note">Fanowska strona gildii. World of Warcraft i związane z nim nazwy należą do Blizzard Entertainment.</div></footer>
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
