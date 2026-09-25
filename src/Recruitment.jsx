import React, { useState } from 'react';

const DISCORD = 'https://discord.gg/SeJ8mTBdGX';

const roles = [
  { id: 'tank', title: 'Tank', caption: 'Prowadzisz walkę i trzymasz bossa.' },
  { id: 'heal', title: 'Healer', caption: 'Utrzymujesz skład przy życiu.' },
  { id: 'melee', title: 'Melee DPS', caption: 'Grasz blisko bossa.' },
  { id: 'ranged', title: 'Ranged DPS', caption: 'Grasz na dystans.' },
];

const specs = {
  tank: { 'Death Knight': ['Blood'], 'Demon Hunter': ['Vengeance'], Druid: ['Guardian'], Monk: ['Brewmaster'], Paladin: ['Protection'], Warrior: ['Protection'] },
  heal: { Druid: ['Restoration'], Evoker: ['Preservation'], Monk: ['Mistweaver'], Paladin: ['Holy'], Priest: ['Discipline', 'Holy'], Shaman: ['Restoration'] },
  melee: { 'Death Knight': ['Frost', 'Unholy'], 'Demon Hunter': ['Havoc'], Druid: ['Feral'], Hunter: ['Survival'], Monk: ['Windwalker'], Paladin: ['Retribution'], Rogue: ['Assassination', 'Outlaw', 'Subtlety'], Shaman: ['Enhancement'], Warrior: ['Arms', 'Fury'] },
  ranged: { 'Demon Hunter': ['Devourer'], Druid: ['Balance'], Evoker: ['Augmentation', 'Devastation'], Hunter: ['Beast Mastery', 'Marksmanship'], Mage: ['Arcane', 'Fire', 'Frost'], Priest: ['Shadow'], Shaman: ['Elemental'], Warlock: ['Affliction', 'Demonology', 'Destruction'] },
};

const initial = { roles: [], className: '', specialization: '', character: '', realm: 'Burning Legion', discord: '', contactTime: '', logs: '', raiderio: '', experience: '', wednesday: false, thursday: false, monday: false, availability: '', expectations: '', note: '' };

function formatApplication(data) {
  return [
    '**Zgłoszenie do Critical Error**',
    `Postać: ${data.character} · ${data.realm} (EU)`,
    `Role: ${data.roles.map((id) => roles.find((role) => role.id === id)?.title || id).join(', ')}`,
    `Główna klasa / spec: ${data.className} / ${data.specialization}`,
    `Discord: ${data.discord}`,
    `Godziny rozmowy: ${data.contactTime || 'Do ustalenia na Discordzie'}`,
    `Logi: ${data.logs || 'Nie podano'}`,
    `Raider.IO: ${data.raiderio || 'Nie podano'}`,
    `Doświadczenie: ${data.experience || 'Nie podano'}`,
    `Raidy: środa ${data.wednesday ? 'tak' : 'nie'}, czwartek ${data.thursday ? 'tak' : 'nie'}, dodatkowy poniedziałek ${data.monday ? 'tak' : 'nie'}`,
    `Dostępność i ograniczenia: ${data.availability}`,
    `Czego szukasz w gildii: ${data.expectations}`,
    `O sobie: ${data.note || 'Nie podano'}`,
  ].join('\n');
}

export default function Recruitment({ endpoint }) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState('idle');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (name, value) => { setForm((current) => ({ ...current, [name]: value })); setStatus('idle'); };
  const selectRole = (id) => setForm((current) => {
    const selected = current.roles.includes(id) ? current.roles.filter((role) => role !== id) : [...current.roles, id];
    const classes = [...new Set(selected.flatMap((role) => Object.keys(specs[role])))];
    const className = classes.includes(current.className) ? current.className : '';
    const specializations = [...new Set(selected.flatMap((role) => specs[role][className] || []))];
    return { ...current, roles: selected, className, specialization: specializations.includes(current.specialization) ? current.specialization : '' };
  });
  const classOptions = [...new Set(form.roles.flatMap((role) => Object.keys(specs[role])))].sort();
  const specOptions = form.className ? [...new Set(form.roles.flatMap((role) => specs[role][form.className] || []))] : [];

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!form.roles.length || !form.className || !form.specialization || !classOptions.includes(form.className) || !specOptions.includes(form.specialization)) { setError('Wybierz role, główną klasę i specjalizację.'); return; }
    if (!form.wednesday && !form.thursday && !form.monday) { setError('Zaznacz przynajmniej jeden wieczór raidowy.'); return; }
    if (!/^[a-z0-9._]{2,32}$/.test(form.discord.trim()) || form.discord.trim().includes('..')) { setError('Podaj pełną nazwę użytkownika Discord, na przykład gracz.123. Bez @, spacji i numeru #1234.'); return; }
    if (!form.expectations.trim() || !form.availability.trim() || !form.contactTime.trim()) { setError('Napisz, czego szukasz w gildii, kiedy możesz grać i kiedy możemy porozmawiać.'); return; }
    if (form.logs && !/^https:\/\/(www\.)?warcraftlogs\.com\//i.test(form.logs)) { setError('Wklej pełny link do Warcraft Logs, zaczynający się od https://.'); return; }
    if (form.raiderio && !/^https:\/\/(www\.)?raider\.io\//i.test(form.raiderio)) { setError('Wklej pełny link do profilu Raider.IO, zaczynający się od https://.'); return; }
    setBusy(true);
    const message = formatApplication(form);
    if (endpoint) {
      try {
        const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || 'Nie udało się wysłać zgłoszenia.');
        setStatus('sent'); setForm(initial);
      } catch (problem) { setError(problem.message || 'Wysyłanie nie powiodło się.'); setDraft(message); setStatus('manual'); }
    } else {
      setDraft(message);
      try { await navigator.clipboard.writeText(message); setStatus('copied'); }
      catch (_) { setStatus('manual'); }
    }
    setBusy(false);
  }

  async function copyAgain() {
    try { await navigator.clipboard.writeText(draft); setStatus('copied'); }
    catch (_) { setStatus('manual'); }
  }

  return <section className="application-section section-pad" id="rekrutacja" aria-labelledby="application-title"><div className="wrap">
    <div className="section-topline"><span>03 / REKRUTACJA</span><span>GRAJMY RAZEM</span></div>
    <div className="application-intro reveal"><p className="eyebrow"><span className="eyebrow-line" /> REKRUTACJA</p><h2 id="application-title">ZAGRAJ<br /><em>Z NAMI.</em></h2><p>Szukasz stałego składu na Mythic? Napisz, czym grasz, czego oczekujesz od gildii i kiedy możesz raidować. Zostaw kontakt na Discordzie, żebyśmy mogli porozmawiać.</p></div>
    <div className="application-layout">
      <form className="application-form" onSubmit={submit}>
        <div className="form-step"><span>01</span><h3>Czym grasz?</h3></div>
        <p className="role-hint">Możesz zaznaczyć kilka ról. Podaj klasę i specjalizację swojej głównej postaci.</p>
        <div className="application-roles" role="group" aria-label="Wybierz role (możesz wybrać kilka)">{roles.map((role) => <button type="button" key={role.id} className={`role-card ${form.roles.includes(role.id) ? 'selected' : ''}`} aria-pressed={form.roles.includes(role.id)} onClick={() => selectRole(role.id)}><strong>{role.title}</strong><small>{role.caption}</small></button>)}</div>
        <div className="form-grid">
          <label>Główna klasa *<select value={form.className} disabled={!form.roles.length} onChange={(e) => setForm((current) => ({ ...current, className: e.target.value, specialization: '' }))}><option value="">{form.roles.length ? 'Wybierz klasę' : 'Najpierw wybierz role'}</option>{classOptions.map((name) => <option key={name}>{name}</option>)}</select></label>
          <label>Specjalizacja *<select value={form.specialization} disabled={!form.className} onChange={(e) => update('specialization', e.target.value)}><option value="">{form.className ? 'Wybierz specjalizację' : 'Najpierw wybierz klasę'}</option>{specOptions.map((name) => <option key={name}>{name}</option>)}</select></label>
        </div>
        <div className="form-step"><span>02</span><h3>Twoja postać</h3></div>
        <div className="form-grid">
          <label>Nick postaci *<input required maxLength={32} autoComplete="off" value={form.character} onChange={(e) => update('character', e.target.value)} placeholder="Np. Twojapostac" /></label>
          <label>Realm *<input required maxLength={50} value={form.realm} onChange={(e) => update('realm', e.target.value)} placeholder="Np. Burning Legion" /></label>
          <label>Doświadczenie<select value={form.experience} onChange={(e) => update('experience', e.target.value)}><option value="">Wybierz</option><option>Raider Heroic</option><option>Raider Mythic</option><option>Cutting Edge</option><option>Wracam po przerwie</option></select></label>
        </div>
        <div className="profile-links"><label>Warcraft Logs <span className="field-optional">opcjonalnie</span><input type="url" maxLength={300} value={form.logs} onChange={(e) => update('logs', e.target.value)} placeholder="https://www.warcraftlogs.com/character/..." /><small>Wklej profil postaci lub raport z HC/Mythic. <a href="https://www.warcraftlogs.com/" target="_blank" rel="noopener noreferrer">Otwórz Warcraft Logs ↗</a></small></label><label>Raider.IO <span className="field-optional">opcjonalnie</span><input type="url" maxLength={300} value={form.raiderio} onChange={(e) => update('raiderio', e.target.value)} placeholder="https://raider.io/characters/eu/..." /><small>Wklej profil postaci z wynikiem M+ i progresem. <a href="https://raider.io/" target="_blank" rel="noopener noreferrer">Otwórz Raider.IO ↗</a></small></label></div>
        <div className="form-step"><span>03</span><h3>Wspólne raidy</h3></div>
        <fieldset className="availability"><legend>W które wieczory możesz regularnie raidować? * <small>19:45 do 23:00</small></legend><label><input type="checkbox" checked={form.wednesday} onChange={(e) => update('wednesday', e.target.checked)} /> Środa</label><label><input type="checkbox" checked={form.thursday} onChange={(e) => update('thursday', e.target.checked)} /> Czwartek</label><label><input type="checkbox" checked={form.monday} onChange={(e) => update('monday', e.target.checked)} /> Poniedziałek <small>dodatkowy</small></label></fieldset>
        <label className="form-full">Jak wygląda Twoja dostępność? *<textarea required rows={3} maxLength={500} value={form.availability} onChange={(e) => update('availability', e.target.value)} placeholder="Ile godzin tygodniowo realnie masz na WoW? Czy możesz zostać do końca raidu? Pracujesz na zmiany albo często wyjeżdżasz?" /></label>
        <label className="form-full">Czego oczekujesz od gildii? *<textarea required rows={3} maxLength={600} value={form.expectations} onChange={(e) => update('expectations', e.target.value)} placeholder="Jaki masz cel na ten sezon? Co jest dla Ciebie ważne w składzie i dlaczego szukasz nowej gildii?" /></label>
        <div className="form-step"><span>04</span><h3>Pozostańmy w kontakcie</h3></div>
        <div className="form-grid">
          <label>Pełna nazwa użytkownika Discord *<input required minLength={2} maxLength={32} autoComplete="off" autoCapitalize="none" spellCheck={false} value={form.discord} onChange={(e) => update('discord', e.target.value)} placeholder="np. gracz.123" /><small>Przepisz nazwę użytkownika z profilu, np. gracz.123. Bez @. Nie wpisuj nazwy wyświetlanej ani nicku z serwera.</small></label>
          <label>Godziny krótkiej rozmowy *<input required maxLength={120} value={form.contactTime} onChange={(e) => update('contactTime', e.target.value)} placeholder="Np. w tygodniu po 18:00" /><small>Kiedy możemy odezwać się na Discordzie?</small></label>
        </div>
        <p className="contact-hint"><a href={DISCORD} target="_blank" rel="noopener noreferrer">Dołącz do naszego Discorda ↗</a> i pozwól członkom serwera pisać do Ciebie. Wtedy szybciej się odezwiemy.</p>
        <label className="form-full">Co jeszcze powinniśmy o Tobie wiedzieć?<textarea rows={4} maxLength={1500} value={form.note} onChange={(e) => update('note', e.target.value)} placeholder="Poprzednie gildie i progres, inne postacie, podejście do feedbacku. Jest coś, o co chcesz nas zapytać?" /><small className="counter">{form.note.length} / 1500</small></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-submit"><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Wysyłanie…' : endpoint ? 'Wyślij zgłoszenie ↗' : 'Przygotuj zgłoszenie ↗'}</button><p>{endpoint ? 'Odpowiemy na podanym Discordzie. Twoje odpowiedzi nie pojawią się na stronie.' : 'Skopiuj przygotowane zgłoszenie i przekaż je nam na Discordzie.'}</p></div>
        {status === 'sent' && <div className="form-result" role="status"><h4>Zgłoszenie wysłane</h4><p>Dołącz teraz do naszego Discorda i napisz krótkie „cześć”, żebyśmy mogli się z Tobą skontaktować. Godziny rozmowy mamy już w zgłoszeniu.</p><a className="button button-primary" href={DISCORD} target="_blank" rel="noopener noreferrer">Dołącz do Discorda ↗</a></div>}
        {(status === 'copied' || status === 'manual') && <div className="form-result" role="status"><h4>{status === 'copied' ? 'Zgłoszenie skopiowane' : 'Skopiuj swoje zgłoszenie'}</h4><p>Wklej tę wiadomość na naszym Discordzie, żebyśmy ją dostali. Samo wypełnienie formularza nie wysyła danych.</p><textarea readOnly value={draft} rows={10} aria-label="Treść zgłoszenia do skopiowania" /><div className="form-result-actions"><button type="button" className="button button-ghost" onClick={copyAgain}>Kopiuj ponownie</button><a className="button button-primary" href={DISCORD} target="_blank" rel="noopener noreferrer">Przejdź na Discord ↗</a></div></div>}
      </form>
      <aside className="application-aside"><span className="dashboard-label">RAIDUJEMY</span><strong>ŚR + CZW<br />19:45 do 23:00</strong><p>Czasem gramy też w poniedziałek w tych samych godzinach. Terminy ustalamy na Discordzie.</p><div className="aside-rule" /><h3>Czego szukamy?</h3><ul><li>Znajomości klasy i przygotowania do bossów.</li><li>Doświadczenia z HC lub Mythic.</li><li>Regularnej obecności i dobrego kontaktu.</li><li>Otwartości na feedback i walki o miejsce w składzie.</li></ul><div className="aside-rule" /><h3>Co dalej?</h3><p>Przeczytamy zgłoszenie i odezwiemy się na Discordzie. Porozmawiamy o Twoim doświadczeniu, dostępności i o tym, jak chcesz grać.</p><a className="text-link" href={DISCORD} target="_blank" rel="noopener noreferrer">Masz pytania? Napisz do nas ↗</a></aside>
    </div>
  </div></section>;
}
