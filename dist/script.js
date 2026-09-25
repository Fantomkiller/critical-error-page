(() => {
  const roster = window.CRITICAL_ERROR_ROSTER || [];
  const grid = document.getElementById('roster-grid');
  const search = document.getElementById('roster-search');
  const filters = [...document.querySelectorAll('.filter')];
  const status = document.getElementById('result-count');
  const empty = document.getElementById('roster-empty');
  const classColors = {
    'Death Knight':'#c85260','Demon Hunter':'#a66aca','Druid':'#d79954',
    'Evoker':'#53a5a0','Hunter':'#96b667','Mage':'#78b5cf',
    'Monk':'#48b59e','Paladin':'#e1a8bf','Priest':'#eee4ce',
    'Rogue':'#e6c46c','Shaman':'#6e9ad6','Warlock':'#a69be1','Warrior':'#c4a67e'
  };
  const labels = {tank:'Tank',heal:'Heal',melee:'Melee',ranged:'Ranged'};
  let role = 'all';

  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pl');
  function render() {
    const query = normalize(search.value.trim());
    const visible = roster.filter(player => (role === 'all' || player.role === role) &&
      (!query || normalize([player.name, player.className, player.realm].join(' ')).includes(query)));
    const fragment = document.createDocumentFragment();
    for (const player of visible) {
      const link = document.createElement('a');
      link.className = 'player-card';
      link.href = `https://wowaudit.com${encodeURI(player.path)}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.setProperty('--class-color',classColors[player.className] || '#b89767');
      link.setAttribute('aria-label',`${player.name}, ${player.className}, ${labels[player.role]}, ${player.realm} — profil w WoWAudit`);
      const top = document.createElement('span'); top.className='player-top';
      const roleLabel = document.createElement('span'); roleLabel.className='player-role'; roleLabel.textContent=labels[player.role];
      const arrow = document.createElement('span'); arrow.className='player-arrow'; arrow.setAttribute('aria-hidden','true'); arrow.textContent='↗';
      top.append(roleLabel,arrow);
      const name = document.createElement('strong'); name.className='player-name'; name.textContent=player.name;
      const bottom = document.createElement('span'); bottom.className='player-bottom';
      const className = document.createElement('span'); className.textContent=player.className;
      const realm = document.createElement('span'); realm.className='player-realm'; realm.textContent=player.realm;
      bottom.append(className,realm);link.append(top,name,bottom);fragment.append(link);
    }
    grid.replaceChildren(fragment);
    status.textContent = `${visible.length} ${visible.length === 1 ? 'postać' : visible.length >= 2 && visible.length <= 4 ? 'postacie' : 'postaci'}`;
    empty.hidden = visible.length !== 0;
  }

  for (const filter of filters) filter.addEventListener('click',() => {
    role = filter.dataset.role;
    for (const button of filters) {
      const selected = button === filter;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed',String(selected));
    }
    render();
  });
  search.addEventListener('input',render);
  render();

  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  menuButton.addEventListener('click',() => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded',String(open));
    menuButton.setAttribute('aria-label',open?'Zamknij menu':'Otwórz menu');
    nav.classList.toggle('open',open);
  });
  nav.addEventListener('click',event => {
    if (event.target.closest('a')) {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded','false');
      menuButton.setAttribute('aria-label','Otwórz menu');
    }
  });
  document.getElementById('year').textContent=String(new Date().getFullYear());

  // Publiczne API Raider.IO. Dane są odświeżane po wejściu na stronę;
  // upstream cache może trzymać odpowiedź przez kilka minut.
  async function loadProgress() {
    const indicator = document.getElementById('live-indicator');
    const updated = document.getElementById('progress-updated');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const params = new URLSearchParams({region:'eu',realm:'burning-legion',name:'Critical Error',fields:'raid_progression:current-tier'});
    try {
      const response = await fetch(`https://raider.io/api/v1/guilds/profile?${params}`,{signal:controller.signal});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const raids = Object.entries(data.raid_progression || {});
      if (!raids.length) throw new Error('Brak progresu w bieżącym tierze');
      const [slug,raid] = raids[0];
      if (!Number.isFinite(raid.total_bosses) || raid.total_bosses < 1) throw new Error('Niepełne dane');
      const raidNames = {'the-venomous-abyss':'The Venomous Abyss','sporefall':'Sporefall','the-tidebound-grotto':'The Tidebound Grotto'};
      document.getElementById('raid-name').textContent=raidNames[slug] || slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
      for (const [difficulty,key] of [['mythic','mythic_bosses_killed'],['heroic','heroic_bosses_killed'],['normal','normal_bosses_killed']]) {
        document.getElementById(`${difficulty}-count`).textContent=`${raid[key] ?? 0}/${raid.total_bosses}`;
      }
      indicator.textContent='Dane z API'; indicator.classList.add('ready');
      const crawled = data.last_crawled_at && new Date(data.last_crawled_at);
      updated.textContent=crawled && !Number.isNaN(crawled.getTime())
        ? `Raider.IO: ostatni odczyt gildii ${new Intl.DateTimeFormat('pl-PL',{dateStyle:'medium',timeStyle:'short',timeZone:'Europe/Warsaw'}).format(crawled)}.`
        : 'Źródło: Raider.IO. Wyniki mogą być aktualizowane z opóźnieniem.';
    } catch (_) {
      indicator.textContent='Dane chwilowo niedostępne';
      updated.textContent='Sprawdź aktualny progress bezpośrednio w Raider.IO.';
    } finally {clearTimeout(timeout)}
  }
  loadProgress();
})();
