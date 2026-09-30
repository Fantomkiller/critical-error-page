# Przegląd Neutralny Flash

Zakres: ten motyw, bez zmian w logo i pozostałych paletach.

## Wnioski i zmiany

- Ciemnoczerwone etykiety na grafitowych panelach miały słaby kontrast. Nagłówki, etykiety i linki mają teraz jasną kość słoniową, opisy chłodną szarość. Czerwień jest akcentem przycisków, zaznaczeń i obramowań.
- Złoto odziedziczone ze starej palety usunięto z panelu rekrutacji, linków, numerów kroków i kart M+.
- Na czerwonych przyciskach napis pozostaje biały także przy hoverze i fokusie. Przesuwający się jasny połysk znajduje się nad tłem, nie pod nim.
- Hover nie podnosi kart ani przycisków. Linki nie zwiększają odstępów. Podstawowe przejścia mają 200 ms; pojedynczy przebieg połysku trwa 600 ms.
- Tła kart nie przełączają się między gradientem i jednolitym kolorem. Lekkie rozjaśnienie jest osobną warstwą animowaną przez opacity.
- Nicki rosteru są jasne; kolory klas pozostają w ikonach i bocznych paskach.
- Ranking M+ na telefonie pokazuje postać i rating bez przewijania w poziomie. Poprawiono też szerokość nagłówka i linków kontaktu.
- Ustawienie ograniczonego ruchu nadal wyłącza animacje i połysk.

## Kontrast wybranych par

Wartości dla kolorów tekstu i najjaśniejszych baz paneli; nie jest to deklaracja pełnego audytu dostępności.

| Element | Kontrast |
| --- | --- |
| Przydatne linki | 7,58:1 |
| Miejsce w składzie | 7,83:1 |
| Opisy panelu | 5,55:1 |
| Biały napis przycisku na najjaśniejszym kolorze hoveru | 6,86:1 |
| Czerwony tekst na jasnej sekcji | 7,23:1 |
| Nick na karcie rosteru | 9,14:1 |

Sprawdzenie: build GitHub Pages, podgląd w przeglądarce, rzeczywisty hover przycisku i wyboru roli, szerokość rankingu oraz kontaktu na telefonie. Bez testów automatycznych.
