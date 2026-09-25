import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { rosterSnapshot } from './data/roster.js';
import Recruitment from './Recruitment.jsx';
import { MythicPlus, Contact } from './Sections.jsx';
import './style.css';

const links = {
  discord: 'https://discord.gg/SeJ8mTBdGX',
  audit: 'https://wowaudit.com/guild/eu/burning-legion/critical-error/teams/main',
  apply: 'https://wowaudit.com/guild/eu/burning-legion/critical-error/teams/main/apply',
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
  return <a className="brand" href="#top" aria-label="Critical Error — strona główna">
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
  const [source, setSource] = useState('Stan rosteru: 25.09.2026');
  useEffect(() => {
    if (!config.rosterApiUrl) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    fetch(config.rosterApiUrl, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error('Roster API unavailable'); return response.json(); })
      .then((payload) => {
        const list = Array.isArray(payload) ? payload : payload.players;
        if (!Array.isArray(list) || !list.length) throw new Error('Invalid roster');
        const valid = list.filter((p) => p && typeof p.name === 'string' && typeof p.className === 'string' && roleNames[p.role] && typeof p.realm === 'string' && typeof p.path === 'string' && p.path.startsWith('/character/'));
        if (!valid.length) throw new Error('No valid players');
        setPlayers(valid);
        setSource('Aktualny roster z WoWAudit');
      }).catch(() => setSource('Ostatni zapis rosteru: 25.09.2026 · sprawdź WoWAudit'))
      .finally(() => clearTimeout(timer));
    return () => { clearTimeout(timer); controller.abort(); };
  }, [config.rosterApiUrl]);
  return { players, source };
}

function Roster({ players, source }) {
  const [role, setRole] = useState('all');
  const [query, setQuery] = useState('');
  const counts = useMemo(() => Object.fromEntries(Object.keys(roleNames).map((key) => [key, players.filter((p) => p.role === key).length])), [players]);
  const visible = useMemo(() => players.filter((p) => (role === 'all' || p.role === role) && (!query.trim() || normalize(`${p.name} ${p.className} ${p.realm}`).includes(normalize(query.trim())))), [players, role, query]);
  const groups = rosterGroups.map(([key, label]) => ({ key, label, players: visible.filter((player) => player.role === key) })).filter((group) => group.players.length);
  return <section className="roster-section section-pad" id="roster" aria-labelledby="roster-title"><div className="wrap">
    <div className="section-topline"><span>02 / DRUŻYNA</span><span>EU · BURNING LEGION</span></div>
    <div className="roster-heading reveal"><div><p className="eyebrow"><span className="eyebrow-line" /> TEAM MAIN</p><h2 id="roster-title">NASZ <em>ROSTER.</em></h2></div><p>Główny skład z WoWAudit. Wybierz rolę albo wyszukaj gracza — karta prowadzi do jego profilu.</p></div>
    <div className="roster-toolbar"><div className="role-filters" role="group" aria-label="Filtruj według roli">
      {[['all', 'Wszyscy'], ['tank', 'Tank'], ['heal', 'Heal'], ['melee', 'Melee'], ['ranged', 'Ranged']].map(([key, title]) => <button key={key} type="button" className={`filter ${role === key ? 'active' : ''}`} aria-pressed={role === key} onClick={() => setRole(key)}>{title} <span>{key === 'all' ? players.length : counts[key]}</span></button>)}
    </div><label className="search-box"><span className="search-icon" aria-hidden="true">⌕</span><span className="sr-only">Szukaj postaci, klasy lub realmu</span><input type="search" placeholder="Szukaj postaci…" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} /></label></div>
    <div className="roster-status" aria-live="polite"><span>{visible.length} {visible.length === 1 ? 'postać' : visible.length >= 2 && visible.length <= 4 ? 'postacie' : 'postaci'}</span><span className="roster-updated">{source}</span></div>
    {groups.map((group) => <div className="roster-group" key={group.key}><div className="roster-group-heading"><h3>{group.label}</h3><span>{group.players.length} {group.players.length === 1 ? 'postać' : group.players.length >= 2 && group.players.length <= 4 ? 'postacie' : 'postaci'}</span></div><div className="roster-grid" aria-label={`${group.label} — lista postaci`}>{group.players.map((player) => <External className="player-card" href={`https://wowaudit.com${encodeURI(player.path)}`} style={{ '--class-color': classColors[player.className] || '#b89767' }} aria-label={`${player.name}, ${player.className}, ${roleNames[player.role]}, ${player.realm} — profil w WoWAudit`} key={`${player.name}-${player.realm}`}>
      <span className="player-top"><span className="player-role">{roleNames[player.role]}</span><span className="player-arrow" aria-hidden="true">↗</span></span><strong className="player-name">{player.name}</strong><span className="player-bottom"><span>{player.className}</span><span className="player-realm">{player.realm}</span></span>
    </External>)}</div></div>)}
    {visible.length === 0 && <div className="roster-empty">Nie znaleźliśmy postaci. Zmień frazę lub wybierz inną rolę.</div>}
    <div className="roster-footer"><p>Dane drużyny Main. Po zmianach w składzie sprawdź źródło.</p><External className="text-link" href={`${links.audit}/roster`}>Roster w WoWAudit <span aria-hidden="true">↗</span></External></div>
  </div></section>;
}

function Progress() {
  const [progress, setProgress] = useState(null);
  const [state, setState] = useState('Ładowanie danych…');
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const params = new URLSearchParams({ region: 'eu', realm: 'burning-legion', name: 'Critical Error', fields: 'raid_progression:current-tier' });
    fetch(`https://raider.io/api/v1/guilds/profile?${params}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error('API error'); return response.json(); })
      .then((data) => { const [slug, raid] = Object.entries(data.raid_progression || {})[0] || []; if (!raid?.total_bosses) throw new Error('No current raid'); setProgress({ slug, raid, updated: data.last_crawled_at }); setState('Dane z API'); })
      .catch(() => setState('Dane chwilowo niedostępne'))
      .finally(() => clearTimeout(timer));
    return () => { clearTimeout(timer); controller.abort(); };
  }, []);
  const raidNames = { 'the-venomous-abyss': 'The Venomous Abyss', sporefall: 'Sporefall', 'the-tidebound-grotto': 'The Tidebound Grotto' };
  const name = progress ? raidNames[progress.slug] || progress.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Aktualny raid';
  const date = progress?.updated && new Date(progress.updated);
  return <section className="progress-section section-pad" id="raid" aria-labelledby="progress-title"><div className="wrap">
    <div className="section-topline"><span>05 / ZOBACZ NAS W AKCJI</span><span>RAID · MYTHIC</span></div>
    <div className="progress-heading reveal"><div><p className="eyebrow dark-eyebrow"><span className="eyebrow-line" /> RAIDING</p><h2 id="progress-title">PROGRESS<br /><em>W PRAKTYCE.</em></h2></div><p>Raidujemy regularnie z myślą o Mythic i Cutting Edge. Postępy pobieramy z Raider.IO; szczegóły walk sprawdzisz w Warcraft Logs.</p></div>
    <div className="raid-dashboard"><div className="raid-schedule"><span className="dashboard-label">GODZINY RAIDÓW</span><h3>ŚRODA <span>&</span> CZWARTEK</h3><strong>19:45—23:00</strong><p>Dodatkowe raidy odbywają się także w poniedziałki w tych samych godzinach. Aktualne informacje i zapisy na konkretne raidy znajdziesz na naszych kanałach Discorda.</p><External className="text-link raid-discord" href={links.discord}>Zapisy na Discordzie ↗</External></div>
      <div className="live-progress" aria-live="polite"><div className="live-heading"><span className="dashboard-label">PROGRESS · RAIDER.IO API</span><span className={`live-indicator ${progress ? 'ready' : ''}`}>{state}</span></div><h3>{name}</h3><div className="progress-modes">{[['mythic', 'mythic_bosses_killed'], ['heroic', 'heroic_bosses_killed'], ['normal', 'normal_bosses_killed']].map(([difficulty, key]) => <div key={key}><strong>{progress ? `${progress.raid[key] ?? 0}/${progress.raid.total_bosses}` : '—'}</strong><span>{difficulty.toUpperCase()}</span></div>)}</div><p>{date && !Number.isNaN(date.getTime()) ? `Raider.IO: ostatni odczyt gildii ${new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Warsaw' }).format(date)}.` : 'Sprawdź aktualny progress bezpośrednio w Raider.IO.'}</p><External className="text-link" href={links.rio}>Sprawdź źródło <span aria-hidden="true">↗</span></External></div>
    </div>
    <div className="source-grid">{[
      [links.logs, '01 / COMBAT LOGS', <>WARCRAFT<br />LOGS</>, 'Analiza walk i rankingi'],
      [links.rio, '02 / PROGRESS', <>RAIDER<span className="source-dot">.</span>IO</>, 'Postępy raidowe gildii'],
      [links.audit, '03 / TEAM MAIN', <>WOW<br />AUDIT</>, 'Skład, eventy i audit'],
    ].map(([href, index, title, desc]) => <External className="source-card" href={href} key={href}><span className="source-index">{index}</span><span className="source-title">{title}</span><span className="source-bottom">{desc} <span aria-hidden="true">↗</span></span></External>)}</div>
  </div></section>;
}

function App() {
  const [config, setConfig] = useState({});
  const { players, source } = useRoster(config);
  const counts = useMemo(() => Object.fromEntries(Object.keys(roleNames).map((key) => [key, players.filter((p) => p.role === key).length])), [players]);
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}site-config.json`, { cache: 'no-store' }).then((res) => res.ok ? res.json() : {}).then(setConfig).catch(() => {});
  }, []);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
    document.documentElement.classList.add('motion-ready');
    return () => { observer.disconnect(); document.documentElement.classList.remove('motion-ready'); };
  }, []);
  const applicationEndpoint = typeof config.applicationEndpoint === 'string' && (config.applicationEndpoint.startsWith('/api/') || config.applicationEndpoint === 'https://critical-error-guild.fantom-killah.chatgpt.site/api/apply') ? config.applicationEndpoint : null;
  return <>
    <a className="skip-link" href="#main">Przejdź do treści</a><Header />
    <main id="main"><Hero />
      <section className="numbers" aria-label="Skład głównej drużyny"><div className="wrap numbers-grid"><div className="number-lead"><span className="micro-label">DRUŻYNA MAIN</span><strong>Jeden skład.<br />Wiele ról.</strong></div><div className="number"><strong>{players.length}</strong><span>postaci w rosterze</span></div><div className="number"><strong>{counts.tank}<span className="number-accent"> / </span>{counts.heal}</strong><span>tanków / healerów</span></div><div className="number"><strong>{counts.melee + counts.ranged}</strong><span>postaci DPS</span></div></div></section>
      <section className="intro section-pad" id="o-nas" aria-labelledby="about-title"><div className="wrap intro-grid reveal"><div className="section-heading"><p className="eyebrow dark-eyebrow"><span className="eyebrow-line" /> KIM JESTEŚMY</p><h2 id="about-title">NAJLEPSZE<br />PULLE ROBI SIĘ<br /><em>RAZEM.</em></h2></div><div className="intro-copy"><p className="large-copy">Critical Error to gildia semi-hardcore na EU Burning Legion. Regularnie raidujemy, wspólnie robimy klucze M+ i budujemy skład z ambicją na Cutting Edge.</p><p>Szukamy ludzi, którzy znają swoją klasę, przygotowują się do walk i potrafią skupić się na mechanikach. Liczą się solidne logi z HC lub Mythic, frekwencja oraz podejście do wspólnego progresu. W składzie Mythic miejsce wypracowuje się grą.</p><a className="text-link" href="#roster">Zobacz wszystkich graczy <span aria-hidden="true">↗</span></a></div></div></section>
      <Roster players={players} source={source} /><Recruitment endpoint={applicationEndpoint} /><MythicPlus /><Progress /><Contact />
    </main>
    <footer className="site-footer"><div className="wrap footer-top"><Brand /><p>Do zobaczenia po drugiej stronie portalu.</p></div><div className="wrap footer-bottom"><span>© {new Date().getFullYear()} CRITICAL ERROR</span><div><External href={links.discord}>Discord ↗</External><External href={links.audit}>WoWAudit ↗</External><External href={links.logs}>Warcraft Logs ↗</External><External href={links.rio}>Raider.IO ↗</External></div></div><div className="wrap legal-note">Fanowska strona gildii. World of Warcraft i związane z nim nazwy należą do Blizzard Entertainment.</div></footer>
  </>;
}

createRoot(document.getElementById('root')).render(<App />);
