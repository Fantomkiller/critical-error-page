# Critical Error — strona gildii

Jednostronicowa strona polskiej gildii World of Warcraft, **Critical Error** (EU Burning Legion). Statyczny projekt bez zależności: źródło publikacji znajduje się w `dist/`.

## Podgląd lokalny

```bash
python3 -m http.server 4173 --directory dist
```

Otwórz `http://localhost:4173`.

## Treść i aktualizacje

- Roster jest migawką publicznej drużyny Main z WoWAudit z 25 września 2026. Lista 39 głównych postaci jest zapisana w `dist/roster.js`; dwie postacie alt nie są wliczone.
- Progress bieżącego tieru jest pobierany na żywo z publicznego [Raider.IO API](https://raider.io/api), bez klucza, przy każdym otwarciu strony. Raider.IO przechowuje odpowiedź w cache przez kilka minut i może aktualizować dane gildii z opóźnieniem. W razie błędu karta odsyła do źródła.
- Tekst o gildii, godziny raidów oraz zaproszenie Discord pochodzą od członka gildii. Nie zamrażamy wyniku „8/9 HC” w stronie, ponieważ aktualny tier z API ma osiem bossów i wskaźnik powinien zmieniać się automatycznie.
- Formularz zgłoszeniowy WoWAudit wymaga logowania Battle.net. Link w sekcji rekrutacji prowadzi bezpośrednio do formularza drużyny Main.
- Publiczne API Raider.IO `members` obejmuje całą gildię (setki postaci), więc nie zastępuje rosteru drużyny Main. API WoWAudit wymaga tajnego klucza zespołu, który nie może trafić do statycznego frontendu ani repozytorium.
- Ilustracja w `dist/assets/hero.webp` została wygenerowana specjalnie do tej strony i nie zawiera oficjalnych materiałów Blizzard.

Aktualizując roster, zachowaj pola `name`, `className`, `role`, `realm` i `path`. Role: `tank`, `heal`, `melee`, `ranged`. Ścieżki postaci są względne wobec `https://wowaudit.com`.
