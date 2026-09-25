# Critical Error — strona gildii

React 19 + Vite dla gildii World of Warcraft **Critical Error** (EU Burning Legion). Sekcje: gildia, załoga, rekrutacja, Mythic+, raid i kontakt. Formularz na stronie dostarcza zgłoszenia na wskazany kanał Discord przez niewielki Cloudflare Worker. Projekt nie wymaga utrzymywania własnego serwera ani panelu admina.

## Rozwój

```bash
npm ci
npm run dev
npm run build
```

`npm run dev` udostępnia frontend do prac wizualnych. Żeby testować endpoint `/api/apply` lokalnie, użyj zgodnego runtime Cloudflare Workers oraz lokalnego sekretu; sam Vite nie obsługuje tego endpointu. Build Vite jest pakowany przez `scripts/build-worker.mjs` do `dist/server/index.js`. Zależności są przypięte; zachowaj `package-lock.json`.

## Publikacja po zmianie w GitHubie i odświeżanie M+

Workflow `.github/workflows/deploy.yml` na gałęzi `master` obsługuje trzy tryby: po każdym pushu buduje i publikuje Workera, przycisk **Actions → Critical Error — odśwież i opublikuj → Run workflow** robi to ręcznie (opcjonalnie odświeżając M+), a codzienny harmonogram `04:17 UTC` pobiera członków całej gildii oraz bieżące wyniki M+ każdego z nich z oficjalnego Raider.IO API. Aktualizacja zapisuje `src/data/mplus.js` w GitHubie, a ta sama akcja publikuje stronę. Jeśli API nie odpowie dla przynajmniej 90% postaci, zadanie zatrzyma się i zachowa poprzednią migawkę. Rate limit 429 jest respektowany.

**Wymagane jednorazowo w Twoim prywatnym repo:** w `Settings → Secrets and variables → Actions` dodaj `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (token z prawem edycji Workers) i `DISCORD_APPLICATION_WEBHOOK`. Nigdy nie wpisuj tych danych do kodu. Jeśli harmonogram nie może zapisać pliku, sprawdź `Settings → Actions → General → Workflow permissions` i uprawnienie zapisu do zawartości repo. Następnie uruchom **Run workflow**. Docelowy Worker zostanie udostępniony pod adresem Cloudflare pokazanym w logu wdrożenia; obecny link Sites nie jest automatycznie powiązany z GitHub Actions. Bez sekretów workflow buduje projekt i informuje o brakującej konfiguracji, lecz nie publikuje Workera. Możesz też połączyć własną domenę po pierwszym wdrożeniu Cloudflare.

Istniejący workflow `.github/workflows/pages.yml` publikuje także statyczną stronę GitHub Pages po pushu. Główny workflow publikuje ją bezpośrednio po codziennym odświeżeniu oraz po ręcznym uruchomieniu, ponieważ commit wykonany przez `GITHUB_TOKEN` nie uruchamia kolejnego workflow na `push`. Buduje ją z prefiksem `/critical-error-page/`; formularz wysyła zgłoszenia do Workera obecnej publicznej strony Sites, z ograniczonym CORS dla `https://fantomkiller.github.io`. To pozwala korzystać z działającej rekrutacji na Pages jeszcze przed konfiguracją Cloudflare. GitHub Pages i Sites to dwa osobne adresy: automatyczna aktualizacja M+ z harmonogramu pojawi się na Pages, a na Sites dopiero po ręcznym wdrożeniu tej wersji lub migracji na Cloudflare.

Roster raidowy Main jest odrębny od całej gildii. Do jego automatycznego odświeżania potrzebny jest klucz API Twojego zespołu WoWAudit oraz dostosowanie adaptera do odpowiedzi `/v1/characters`; obecnie wyświetla datowaną migawkę i link do źródła. Sekret WoWAudit należy podłączyć po stronie Workera, nigdy w kodzie przeglądarki.

## Treść i dane

- Progress raidowy jest odczytywany w przeglądarce z publicznego Raider.IO API dla bieżącego tieru. Gdy API jest niedostępne, strona prowadzi do źródła.
- Skład Main startuje z migawki publicznego rosteru WoWAudit z 25.09.2026 (39 głównych postaci, bez dwóch altów) w `src/data/roster.js`. Oznaczenie daty pozostaje widoczne, dopóki nie działa automatyczne odświeżanie.
- Po uzyskaniu dostępu do wykupionego WoWAudit API można podłączyć bezpieczny adapter po stronie Workera i ustawić adres w `public/site-config.json` jako `rosterApiUrl`. Odpowiedź musi zwracać tablicę lub `{ "players": [...] }` z polami `name`, `className`, `role` (`tank`, `heal`, `melee`, `ranged`), `realm`, `path` (`/character/...`). **Nie** wpisuj klucza API do plików React, konfiguracji publicznej ani repozytorium.
- Raider.IO `members` obejmuje całą gildię, w tym osoby grające M+ poza rosterem raidowym. Liczba członków i przynależność postaci widocznych w czołówce są sprawdzane w przeglądarce przez oficjalne API Raider.IO. Wyniki w `src/data/mplus.js` są datowaną migawką pobieraną przez cron z wyników pojedynczych postaci całej gildii; na aktywnym wdrożeniu Cloudflare odświeżają się codziennie po konfiguracji trzech sekretów. Bez nich są datowaną migawką, a karty prowadzą do bieżących profili. Dawny wynik 8/9 Heroic nie jest pokazywany jako bieżący progress nowego tieru.
- Teksty o gildii i godziny raidów pochodzą od członka gildii. Grupy M+ tworzą się na czacie lub w grze, także na wysokie klucze. Informacje i zapisy na raidy są na Discordzie. Nie kopiujemy turnieju, panelu admina ani kalendarza z innej gildii.

## Zgłoszenia na Discord

Formularz pozwala wybrać kilka ról, główną klasę i specjalizację, postać, realm, Discord, doświadczenie, opcjonalne linki do Warcraft Logs i Raider.IO, dostępność w środy, czwartki i na dodatkowy poniedziałek oraz opis. Frontend wysyła dane do `/api/apply` na tej samej domenie. Worker waliduje pola, ogranicza wielkość i tempo zgłoszeń, wyłącza oznaczanie użytkowników i wysyła embed do webhooka. Sukces jest pokazywany tylko po potwierdzeniu Discorda. W razie błędu użytkownik może skopiować treść i przekazać ją ręcznie na Discordzie. WoWAudit pozostaje alternatywną drogą zgłoszenia przez Battle.net.

Webhook jest sekretem środowiskowym Sites o nazwie `DISCORD_APPLICATION_WEBHOOK`. Nie jest zapisany w kodzie ani w GitHubie. W innym hostingu ustaw tę samą nazwę jako sekret Workera. Publiczny formularz nie zapisuje danych do bazy — ich odbiornikiem jest kanał Discord wskazany przez webhook.

## Grafika

`public/assets/hero.webp` jest oryginalną ilustracją wygenerowaną dla tej strony. Strona jest projektem fanowskim i nie używa oficjalnych grafik Blizzard.
