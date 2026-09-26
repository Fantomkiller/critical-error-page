# Critical Error

Strona gildii World of Warcraft Critical Error (EU Burning Legion). React 19 i Vite budują frontend, a własny backend Node.js obsługuje skład, ranking M+ i zgłoszenia rekrutacyjne.

## Lokalnie

```bash
npm ci
npm run dev
```

Vite udostępnia także lokalne `/api/roster`, `/api/mplus` i `/api/apply`. Roster Main bez klucza korzysta z zapisanej listy, a ranking M+ pobiera gotową topkę całej gildii z Raider.IO. Formularz bez webhooka przygotowuje treść do ręcznego przekazania na Discordzie. Aby korzystać z API WoWAudit dla rosteru Main w lokalnym podglądzie, uruchom Vite z `WOWAUDIT_API_KEY` w środowisku. Nie zapisuj klucza w `public/` ani w repozytorium.

Sam backend można uruchomić poleceniem `npm run start:api`. Domyślnie nasłuchuje na `127.0.0.1:8787`. Ustaw `PORT` i `HOST`, jeśli potrzebujesz innego adresu, a `WOWAUDIT_API_KEY` i `DISCORD_APPLICATION_WEBHOOK` przekaż jako zmienne środowiskowe procesu. `GET /health` sprawdza, czy proces działa.

Sprawdzenie zmian:

```bash
npm run build
```

## Dane składu

Backend pobiera listę Main z prywatnego API WoWAudit, a ilvl i wynik M+ każdej postaci z Raider.IO. Osobny ranking M+ pobiera gotową, posortowaną listę całej gildii z tego samego źródła danych, którego używa strona Raider.IO. Z pierwszej strony bierze Top 10: nick, klasę i rating, bez osobnych zapytań o profile postaci. Dlatego tabela Top 10 nie pokazuje ilvl. Aktualny sezon rozpoznaje po nagłówku przekierowania strony rankingu. Roster odświeża się po 5 minutach, ranking po 15 minutach. Po tym czasie backend od razu zwraca ostatni wynik z pamięci procesu i pobiera nowy w tle. Nie ma crona. Frontend zawiera zapisaną migawkę składu ze statystykami, Top 10 całej gildii i progressu raidowego w `src/data/liveSnapshot.js`. Wyświetla ją od razu, a udane pobranie zastępuje ją aktualnymi danymi. Gdy API nie odpowiada albo backend się restartuje, migawka pozostaje widoczna. Progress raidowy jest pobierany bezpośrednio z Raider.IO w przeglądarce.

WoWAudit wymaga klucza API zespołu. Administrator zespołu powinien zalogować się na [WoWAudit API](https://wowaudit.com/api), wybrać właściwy zespół i skopiować klucz. Ustaw `WOWAUDIT_API_KEY` tylko w środowisku backendu. Bez niego backend używa zapisanej listy Main z `src/data/roster.js`, więc zmiany członkostwa nie są automatyczne. Statystyki tych postaci nadal pobiera na żądanie. Klucz nie trafia do publicznego JSON-a ani kodu strony.

## Rekrutacja

Formularz wymaga pełnej, unikalnej nazwy użytkownika Discord (np. `gracz.123`), godzin krótkiej rozmowy, oczekiwań wobec gildii i opisu realnej dostępności. Po udanej wysyłce strona kieruje kandydata na serwer Discord. Backend wysyła zgłoszenie na kanał przez `DISCORD_APPLICATION_WEBHOOK`. Webhook nie może wysyłać prywatnej wiadomości do kandydata; do automatycznej wiadomości potrzebny byłby bot, konto kandydata na serwerze i osobna integracja. Sama znajomość nazwy użytkownika też nie gwarantuje kontaktu, jeśli kandydat nie dołączy do serwera i ograniczył zaproszenia do znajomych. Gdy endpoint nie działa, kandydat może skopiować zgłoszenie i wkleić je na Discordzie.

## Wdrożenie

`.github/workflows/pages.yml` publikuje statyczną wersję GitHub Pages. Backend Node.js trzeba uruchomić na własnym serwerze dostępnym pod adresem HTTPS, np. `https://api.example.com/`, z przekierowaniem do lokalnego portu procesu. GitHub Pages nie uruchamia Node.js.

Gdy backend ma publiczny adres, ustaw w `Settings → Secrets and variables → Actions → Variables` zmienną repozytorium `GUILD_API_URL` na jego bazowy adres HTTPS, bez ścieżki. Uruchom ponownie workflow **Deploy GitHub Pages**. Skrypt dopisze `/api/roster`, `/api/mplus` i `/api/apply` podczas budowania. Bez tej zmiennej Pages pokazuje zapisane dane składu, Top 10 i progressu; formularz przygotowuje wiadomość do ręcznego wysłania.

`public/assets/hero.webp` jest oryginalną ilustracją przygotowaną dla strony. Strona jest projektem fanowskim; World of Warcraft i związane z nim nazwy należą do Blizzard Entertainment.
