# Critical Error — strona gildii

React 19 + Vite. Polska gildia WoW **Critical Error** (EU Burning Legion). Responsywny roster Main, filtry, wyszukiwarka, aktualny progress z Raider.IO, linki do Warcraft Logs i WoWAudit, rekrutacja oraz ilustracja wykonana dla gildii.

## Uruchomienie

```bash
npm ci
npm run dev
```

Build: `npm run build`. Gotowe statyczne pliki są w `dist/` i można je hostować bez procesu Node. Zależności mają przypięte wersje; `package-lock.json` należy zachować.

## Skład i progress

- Progress raidowy jest odczytywany po stronie przeglądarki z publicznego Raider.IO API dla bieżącego tieru. W razie błędu interfejs kieruje do profilu gildii.
- Skład startuje z zapisanego publicznego rosteru **WoWAudit Main** z 25.09.2026 (39 głównych postaci, bez dwóch altów) w `src/data/roster.js`. Nie jest przedstawiany jako aktualny na żywo.
- Gdy będzie dostępny bezpieczny endpoint dla wykupionego WoWAudit API, ustaw `rosterApiUrl` w `public/site-config.json`. Endpoint powinien zwracać tablicę lub `{ "players": [...] }` z polami `name`, `className`, `role` (`tank`, `heal`, `melee`, `ranged`), `realm`, `path` (`/character/...`). Musi pozwalać na CORS dla domeny strony i przechowywać klucz WoWAudit wyłącznie po stronie serwera. Przy niedostępności endpointu strona pokazuje oznaczoną datą migawkę. Docelowy format WoWAudit i sposób autoryzacji wymagają klucza lub dokumentacji z konta gildii, aby napisać właściwy adapter; sam adres endpointu w konfiguracji nie wystarcza do integracji.
- Nie wykorzystujemy Raider.IO `members` do uzupełnienia rosteru: to pełna gildia, a nie drużyna Main. Nie używamy starego wyniku 8/9 HC jako aktualnego wyniku nowego tieru.

## Rekrutacja i Discord

Działają od razu: zaproszenie `discord.gg/SeJ8mTBdGX` oraz formularz rekrutacyjny drużyny Main w WoWAudit. Aby włączyć własny formularz z automatycznym powiadomieniem na wybranym kanale Discord:

1. Utwórz webhook w ustawieniach **wybranego kanału Discord → Integracje → Webhooki**. Zachowaj adres w tajemnicy.
2. Utwórz samodzielny projekt w [Google Apps Script](https://script.google.com/) i wklej `integrations/google-forms/Code.gs`.
3. W **Project Settings → Script Properties** ustaw `DISCORD_WEBHOOK_URL` na adres webhooka. Uruchom jednorazowo `setupRecruitment`, zaakceptuj dostęp do Forms i zewnętrznych żądań HTTP. Skrypt utworzy formularz i trigger, a w logach wyświetli adres formularza. Każde wysłane zgłoszenie wyśle embed na kanał webhooka. Ponowne uruchomienie konfiguracji nie duplikuje formularza ani triggera.
4. Wstaw opublikowany adres Google Forms w `public/site-config.json` jako `googleFormUrl`, zbuduj i opublikuj stronę. Dopiero wtedy pojawi się przycisk „Formularz rekrutacyjny”. Klucza webhooka **nie** wpisuj w repozytorium ani w konfiguracji frontendu.

Google Apps Script obsługuje zapis odpowiedzi i wysłanie powiadomienia, więc strona nie potrzebuje własnego backendu do tego przepływu. Właściciel formularza może przeglądać zgłoszenia w Google Forms.

## Grafika

`public/assets/hero.webp` jest autorską ilustracją wygenerowaną dla tej strony. Strona jest projektem fanowskim i nie korzysta z oficjalnych materiałów Blizzard.
