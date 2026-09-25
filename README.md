# Critical Error

Strona gildii World of Warcraft Critical Error (EU Burning Legion). React 19 i Vite budują frontend, a Cloudflare Worker obsługuje skład oraz zgłoszenia rekrutacyjne.

## Lokalnie

```bash
npm ci
npm run dev
```

Vite udostępnia także lokalne `/api/roster`, `/api/mplus` i `/api/apply`. Roster Main bez klucza korzysta z zapisanej listy, a ranking M+ pobiera pełną listę członków gildii z Raider.IO. Formularz bez webhooka przygotowuje treść do ręcznego przekazania na Discordzie. Aby korzystać z API WoWAudit dla rosteru Main w lokalnym podglądzie, uruchom Vite z `WOWAUDIT_API_KEY` w środowisku. Nie zapisuj klucza w `public/` ani w repozytorium.

Sprawdzenie zmian:

```bash
npm run build
```

## Dane składu

Przy pierwszym wejściu po wygaśnięciu pięciominutowej pamięci podręcznej Worker pobiera listę Main z prywatnego API WoWAudit, a ilvl i wynik M+ każdej postaci z Raider.IO. Osobny ranking M+ bierze listę członków całej gildii z publicznego API Raider.IO, niezależnie od drużyny Main i arkusza WoWAudit. Sprawdza tylko postacie na bieżącym maksymalnym poziomie 90, następnie pobiera ich wyniki sezonu w partiach po 40, sortuje je i pokazuje Top 10 dopiero po zebraniu całej listy. Postacie bez punktów w bieżącym sezonie nie trafiają do tabeli. Lista i wyniki są trzymane w pamięci podręcznej przez 15 minut. Nie ma crona ani zapisywania wyników M+ do GitHuba. Jeśli Raider.IO nie ma wyniku danej postaci, strona pokazuje brak wartości. Progress raidowy jest pobierany bezpośrednio z Raider.IO w przeglądarce.

WoWAudit wymaga klucza API zespołu. Administrator zespołu powinien zalogować się na [WoWAudit API](https://wowaudit.com/api), wybrać właściwy zespół i skopiować klucz. Dodaj go w repozytorium GitHub jako sekret Actions o nazwie `WOWAUDIT_API_KEY`. Workflow przekaże go do Cloudflare Workera podczas wdrożenia. Bez niego Worker używa zapisanej listy Main z `src/data/roster.js`, więc zmiany członkostwa nie są automatyczne. Statystyki tych postaci nadal pobiera na żądanie. Sekret pozostaje po stronie Workera i nie trafia do publicznego JSON-a ani kodu strony. Po zmianie klucza uruchom wdrożenie Workera ponownie i poczekaj do pięciu minut na nowy odczyt.

## Rekrutacja

Formularz wymaga pełnej, unikalnej nazwy użytkownika Discord (np. `gracz.123`), godzin krótkiej rozmowy, oczekiwań wobec gildii i opisu realnej dostępności. Po udanej wysyłce strona kieruje kandydata na serwer Discord. Worker wysyła zgłoszenie na kanał przez `DISCORD_APPLICATION_WEBHOOK`. Webhook nie może wysyłać prywatnej wiadomości do kandydata; do automatycznej wiadomości potrzebny byłby bot, konto kandydata na serwerze i osobna integracja. Sama znajomość nazwy użytkownika też nie gwarantuje kontaktu, jeśli kandydat nie dołączy do serwera i ograniczył zaproszenia do znajomych. Gdy endpoint nie działa, kandydat może skopiować zgłoszenie i wkleić je na Discordzie.

## Wdrożenie

`.github/workflows/deploy.yml` buduje i publikuje Workera po pushu do `master` lub ręcznym uruchomieniu. W `Settings → Secrets and variables → Actions → Repository secrets` ustaw `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` i `WOWAUDIT_API_KEY`. Jeśli zgłoszenia mają automatycznie trafiać na kanał Discord, dodaj także `DISCORD_APPLICATION_WEBHOOK`. Bez webhooka roster działa, a formularz przygotowuje wiadomość do ręcznego przekazania. Wartości sekretów pozostają ukryte. Adres opublikowanego Workera będzie widoczny w logu wdrożenia.

`.github/workflows/pages.yml` publikuje statyczną wersję GitHub Pages. Aby korzystała z tego samego Workera, ustaw w `Settings → Secrets and variables → Actions → Variables` zmienną repozytorium `GUILD_WORKER_URL` na sam adres Workera z logu, na przykład `https://twoj-worker.workers.dev/`. Skrypt dopisuje `/api/roster` i `/api/apply` podczas budowania. Po ustawieniu zmiennej uruchom ponownie workflow **Deploy GitHub Pages**. Bez niej Pages pokazuje zapisany skład, a formularz przygotowuje wiadomość do ręcznego wysłania. Nie używa starego adresu Sites.

`public/assets/hero.webp` jest oryginalną ilustracją przygotowaną dla strony. Strona jest projektem fanowskim; World of Warcraft i związane z nim nazwy należą do Blizzard Entertainment.
