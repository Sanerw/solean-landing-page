# Karuzele rasteryzują slajdy co klatkę zamiast przesuwać warstwę

**Type:** Fix
**Status:** verified

## The problem

Karuzele gubią klatki na telefonie na produkcji. Zgłoszone jako "laguje bento
carousel", ale dotyczy wszystkich trzech, bo wszystkie idą przez ten sam prymityw.

Wcześniejszy `/debug` nie odtworzył tego lokalnie: mierzył rytm
`requestAnimationFrame`, który tyka równo nawet wtedy, gdy kompozytor nie nadąża
rysować. Przy dławieniu CPU 10x, 390x844, dpr 3, mediana klatki wyszła 16.6 ms i
zero klatek powyżej 50 ms, czyli pomiar mówił "płynnie" o czymś, co nie jest.

Właściwy pomiar to ślad rasteryzacji z CDP. Embla przepisuje `translate3d` na
`[data-embla-container]` przy każdym ruchu palca, 75 razy w jednym przeciągnięciu.
Kontener miał `will-change: auto`, więc Chrome nie trzymał go jako osobnej warstwy
i rasteryzował slajdy od nowa co klatkę:

| Karuzela | Zadania rastrowe | Czas rasteryzacji |
| --- | --- | --- |
| Opinie | 872 | 1256 ms |
| Zespół kliniczny | 912 | 443 ms |
| Bento | 294 | 216 ms |

Opinie są najgorsze, bo ich karty niosą pełnowymiarowe zdjęcie w tle pod
gradientem.

## The fix

`will-change-transform` na kontenerze Embli w `carousel-content.svelte`. Jedna
klasa, wszystkie karuzele naraz.

Trzy inne hipotezy odrzucone pomiarowo, nie z góry:

| Wariant | Zadania rastrowe (bento) |
| --- | --- |
| `contain: content` na slajdach | 297, bez zmian |
| `backface-visibility: hidden` | 889, bez zmian |
| usunięcie zaokrągleń kart | 295, bez zmian |
| **`will-change: transform`** | **11** |

Koszt wersji zawsze-włączonej sprawdzony osobno: przewijanie całej strony
rasteryzuje 97 zadań z hintem i bez, więc trwale wypromowane warstwy niczego nie
psują. Wersja włączana dopiero na `pointerdown` nie jest tego warta: promocja
warstwy sama kosztuje klatkę, a to jest klatka, w której palec już się rusza.

Czego nie wolno zepsuć:

- Prymityw jest współdzielony, więc zmiana dotyka też showcase'u
  `/dev/design-system`. To jest zamierzone.
- `will-change` tworzy kontekst układania. Przyciski Previous i Next są
  rodzeństwem kontenera, nie jego dziećmi, więc nic nie zmienia im warstwy.

## Build steps

### 1. Promocja warstwy kontenera - [x]

- `carousel-content.svelte`: `will-change-transform` na `[data-embla-container]`,
  z komentarzem niosącym zmierzone liczby, bo bez nich klasa wygląda na kult cargo.

**Done when:** ślad CDP na zbudowanej stronie pokazuje jednocyfrową liczbę zadań
rastrowych na przeciągnięcie w każdej z trzech karuzel, a wymuszenie
`will-change: auto` na tej samej stronie przywraca stare liczby.

### 2. Test geometrii przestaje ścigać się z animacją wjazdu - [x]

Pełny harness wyłapał `keeps the bento hierarchy compact and aligned`. Test mierzy
geometrię siatki, a od fixa `entrance-animations` siatka wjeżdża na scrollu, więc
karta bywa łapana w locie: brakujące 3.9 px to nieukończony `translate-y-4`.
Test był flaky od tamtego commita, a przebieg, który wtedy przeszedł, był
kwestią taktowania, nie dowodem.

Ten sam korzeń trafił też w `accessibility.spec.ts`: axe czyta element przy
`opacity: 0` jako tekst o zerowym kontraście, więc zgłaszał dziewięć naruszeń
`color-contrast` na kartach bento, których nikt jeszcze nie przewinął w kadr. To
nie jest przypadek taktowania, tylko strukturalny skutek reveala: sekcja, na którą
nikt nie spojrzał, jest przezroczysta i dla skanera nieczytelna.

- `e2e/motion.ts`: `settledInView(locator)` przewija sekcję w kadr i czeka, aż
  zniknie `data-reveal` i ustaną animacje. Przewinięcie jest częścią czekania, bo
  reveal jedzie na IntersectionObserverze i sekcja, na którą nikt nie spojrzał,
  nigdy się nie odsłoni. `settledPage(page)` robi to samo dla całej strony,
  przechodząc ją od góry do dołu tak, jak robi to czytelnik.
- `e2e/marketing-fidelity.spec.ts`: wywołanie przed odczytem geometrii.
- `e2e/accessibility.spec.ts`: wywołanie przed skanem landingu i ekranu
  rekomendacji.

**Done when:** `keeps the bento hierarchy compact and aligned` i cały
`accessibility.spec.ts` przechodzą po trzy przebiegi z rzędu, a pełny harness jest
zielony trzy razy pod rząd.

## Verify

| Co | Jak |
| --- | --- |
| Karuzele | Telefon, przeciągnąć bento, opinie i zespół kliniczny |
| Regresja | Karuzele nadal zatrzaskują się na slajdach, kropki i strzałki działają |
| Automaty | `pnpm check`, `pnpm test`, `pnpm build`, `pnpm test:browser` |
| Kontrola wsteczna | Wymusić `will-change: auto` w devtoolsach i zobaczyć powrót zacięć |

> Uwaga na osobny defekt znaleziony po drodze, nietknięty tutaj: obrazy w mobilnej
> karuzeli bento mają naturalne 132x67 px, a są rysowane w polu 132x168, więc
> `object-cover` skaluje je 2.5x w górę. To jakość, nie wydajność, i wygląda na
> przeoczony wariant `row` przy commicie `002a6a1`.
