# Przegląd Neutralny Flash

Zakres: ten motyw, bez zmian w logo i pozostałych paletach.

## Wnioski i zmiany

- Ciemnoczerwone etykiety na grafitowych panelach miały słaby kontrast. Pierwsze linie nagłówków są jasne, drugie czerwone. Etykiety mają chłodny srebrny akcent, opisy szarość. Na jasnym progressie etykiety są ciemne.
- Złoto zastąpiono chłodnym srebrnym akcentem w panelu rekrutacji, etykietach i numerach kroków. Czerwony hover przycisku „Poznaj nasz skład” ma również połysk.
- Na czerwonych przyciskach napis pozostaje biały także przy hoverze i fokusie. Przesuwający się jasny połysk znajduje się nad tłem, nie pod nim.
- Hover nie podnosi kart ani przycisków. Linki nie zwiększają odstępów. Podstawowe przejścia mają 200 ms; pojedynczy przebieg połysku trwa 600 ms.
- Tła kart nie przełączają się między gradientem i jednolitym kolorem. Lekkie rozjaśnienie jest osobną warstwą animowaną przez opacity.
- Nicki, ikony i boczne paski zachowują kolory klas ze zwykłego neutralnego motywu.
- Ranking M+ na telefonie pokazuje postać i rating bez przewijania w poziomie. Poprawiono też szerokość nagłówka i linków kontaktu.
- Ustawienie ograniczonego ruchu nadal wyłącza animacje i połysk.

## Kontrast wybranych par

Wartości dla kolorów tekstu i najjaśniejszych baz paneli; nie jest to deklaracja pełnego audytu dostępności.

| Element | Kontrast |
| --- | --- |
| Przydatne linki, srebrny akcent | 4,60:1 |
| Miejsce w składzie, srebrny akcent | 4,75:1 |
| Opisy panelu | 5,55:1 |
| Biały napis przycisku na najjaśniejszym kolorze hoveru | 6,86:1 |
| Czerwony tekst na jasnej sekcji | 7,23:1 |

Sprawdzenie: build GitHub Pages, podgląd w przeglądarce, rzeczywisty hover przycisku i wyboru roli, szerokość rankingu oraz kontaktu na telefonie. Bez testów automatycznych.
