# Ruch tam, gdzie treść dziś podmienia się w jednej klatce

**Type:** Fix
**Status:** verified

## The problem

Kod feature'owy nie ma ani jednej własnej animacji. Ruch istnieje wyłącznie
w prymitywach shadcn (accordion, sheet, tabs, spinner), zawsze z `motion-reduce:`.
Skutkiem jest sześć miejsc, w których treść pojawia się lub podmienia bez żadnego
pomostu:

| Miejsce | Co się dzieje |
| --- | --- |
| `RecommendationScreen.svelte:207` | Po kilkusekundowym oczekiwaniu ekran budowania planu znika, lista planów wskakuje w jednej klatce |
| `(questionnaire)/questionnaire/[step]/+page.svelte:216` | Treść kroku podmienia się natychmiast przy każdym Continue |
| `SurveyStepScreen.svelte:209`, `:245`, `:258` | Błąd walidacji i alert nieudanej wysyłki wskakują, przesuwając wszystko pod spodem |
| `RecommendationScreen.svelte:147` | Karta planu, duży cel dotykowy z ceną, nie reaguje na wciśnięcie |
| `BentoGrid.svelte:52` | Siatka wpada w kadr w całości naraz |
| `+layout.svelte` | Wejście z landingu do kwestionariusza to twarde cięcie ze zdjęciowej strony na biały shell |

Podstawa: pass skillem `find-animation-opportunities` z repo `emilkowalski/skills`,
przeprowadzony 2026-09-01. Hero i karuzela zostały w tym passie świadomie odrzucone
i ten fix ich nie dotyka.

## The fix

Wariant CSS-owy, nie `transition:` ze Svelte'a. Powód jest konkretny: klasa
`motion-reduce:` nie działa na transitions Svelte'a, bo te żyją w JS i nie czytają
media query. `@starting-style` przez wariant `starting:` trzyma się reguły, którą
projekt ma już w każdym animowanym prymitywie.

Zweryfikowane na `tailwindcss@4.3.3` z tego repo przed napisaniem specu:

- wariant `starting:` generuje `@starting-style`
- token `--ease-out-quint` w `@theme inline` daje utility `ease-out-quint`
- `translate-y-*` w v4 ustawia właściwość `translate`, nie `transform`, więc lista
  właściwości to `transition-[opacity,translate]`
- `motion-reduce:` generuje `@media (prefers-reduced-motion: reduce)`

Czego nie wolno zepsuć:

- **Zero animacji wyjścia.** Błąd, który znika powoli, czyta się jak nadal
  aktualny, a dwa kroki kwestionariusza obok siebie w layoucie to skok treści.
- **Treść widoczna bez JS.** Reveal na scrollu chowa cokolwiek tylko wtedy, gdy
  IntersectionObserver istnieje i `prefers-reduced-motion` jest wyłączone.
- **Hero nietknięte.** `<h1>` i zdjęcie to element LCP.
- **Karuzela nietknięta.** Laguje na mobile na produkcji, to osobna sprawa.
- Każda reguła ruchu ma swój `motion-reduce:`.
- Dodajemy jeden token easingu, nie trzy. Projekt ma zasadę "No abstraction is
  built before something calls it", a wszystkie sześć animacji to wejścia, więc
  wołają wyłącznie `ease-out-quint`.

## Build steps

### 1. Token easingu i odsłonięcie rekomendacji - [x]

- `src/routes/layout.css`: `--ease-out-quint: cubic-bezier(0.23, 1, 0.32, 1)`
  w istniejącym bloku `@theme inline`.
- `RecommendationScreen.svelte`: gałąź `{:else}` dostaje opakowanie z
  `starting:opacity-0 transition-opacity duration-300 ease-out-quint
  motion-reduce:transition-none`; każda karta planu dostaje
  `starting:opacity-0 starting:translate-y-4 transition-[opacity,translate]
  duration-300 ease-out-quint motion-reduce:transition-none` plus własny
  `transition-delay` liczony z pozycji na spłaszczonej liście, 60 ms na kartę.

**Done when:** po wysłaniu anamnezy lista planów pojawia się kaskadą zamiast
wskakiwać, a przy włączonym "redukuj ruch" pojawia się od razu i bez przesunięcia.

### 2. Wejście kroku kwestionariusza i błędów - [x]

- `[step]/+page.svelte`: zawartość bloku `{#key page.name}` dostaje
  `starting:opacity-0 starting:translate-y-2 transition-[opacity,translate]
  duration-200 ease-out-quint motion-reduce:transition-none`. Świadomie krótko:
  ten ruch zdarza się kilkadziesiąt razy w jednej sesji.
- `SurveyStepScreen.svelte`: oba `FieldError` dostają
  `starting:opacity-0 transition-opacity duration-150 ease-out-quint
  motion-reduce:transition-none`, a `Alert.Root` po nieudanej wysyłce dodatkowo
  `starting:translate-y-1` i `transition-[opacity,translate]`.

**Done when:** przejście Continue rysuje krok z lekkim podniesieniem, powrót Back
tak samo, a pierwsze wejście na krok przez pełne załadowanie strony nie animuje
niczego, bo markup przychodzi z serwera.

### 3. Press feedback na karcie planu - [x]

- `RecommendationScreen.svelte`: `FieldLabel` karty dostaje
  `active:translate-y-px motion-reduce:active:translate-y-0`, dokładnie ten sam
  idiom co `button.svelte:11`. Bez `transition`, bo przycisk też go nie ma:
  wciśnięcie jest natychmiastowe i to jest istniejący język projektu.

**Done when:** wciśnięcie karty planu przesuwa ją o piksel w dół, tak jak każdy
przycisk w projekcie.

### 4. Wejście siatki bento na scrollu - [x]

- `src/lib/actions/reveal.ts`: akcja Svelte na IntersectionObserverze plus czysta
  funkcja `shouldReveal(win)` decydująca, czy w ogóle chować treść.
- `src/lib/actions/reveal.test.ts`: testy `shouldReveal` dla braku
  IntersectionObservera, dla `prefers-reduced-motion: reduce` i dla przypadku
  pozytywnego. Bramka testowa jest włączona, a to jest logika z możliwą złą
  odpowiedzią; sam observer jedzie na buildzie i harnessie przeglądarkowym.
- `BentoGrid.svelte`: karty siatki dostają akcję, stagger 50 ms, wejście
  `opacity` plus `translate`, 400 ms, `ease-out-quint`.

**Done when:** siatka bento wjeżdża kaskadą przy pierwszym wejściu w kadr,
zostaje widoczna przy wyłączonym JS, a przy "redukuj ruch" nie chowa się wcale.
`pnpm test` zielone.

### 5. View transition przy wejściu do kwestionariusza - [x]

- `src/lib/i18n` nie jest tu potrzebne; predykat trafia do
  `src/lib/navigation/view-transition.ts` jako czysta funkcja
  `entersQuestionnaire(fromRouteId, toRouteId)`.
- `src/lib/navigation/view-transition.test.ts`: testy dla wejścia z marketingu,
  dla ruchu wewnątrz kwestionariusza (`[step]` do `[step]`, musi zwrócić false,
  inaczej dubluje się z krokiem 2), dla wyjścia z kwestionariusza i dla nawigacji
  bez `from`.
- `src/routes/+layout.svelte`: `onNavigate` uruchamia
  `document.startViewTransition` tylko dla tego jednego przejścia i tylko gdy
  API istnieje.
- `src/routes/layout.css`: crossfade 200 ms na `::view-transition-old(root)`
  i `::view-transition-new(root)`, wyłączony w `prefers-reduced-motion`.

**Done when:** klik w CTA hero przechodzi na kwestionariusz przenikaniem zamiast
cięcia, a przejście między krokami kwestionariusza nadal używa wyłącznie animacji
z kroku 2. `pnpm test` zielone.

## Verify

| Co | Jak |
| --- | --- |
| Rekomendacja | Przejść kwestionariusz do końca, obejrzeć przejście z ekranu budowania planu na listę |
| Kroki | Kilka razy Continue i Back, sprawdzić, że nic nie zostaje na ekranie po starym kroku |
| Błędy | Wysłać krok z pustym wymaganym polem, obejrzeć pojawienie się komunikatu |
| Bento | Odświeżyć landing, zjechać do siatki |
| View transition | Klik w CTA hero z landingu |
| Redukcja ruchu | Powtórzyć wszystko z systemowym "redukuj ruch", nic nie powinno się animować i nic nie powinno zniknąć |
| Automaty | `pnpm check`, `pnpm test`, `pnpm build`, `pnpm test:browser` |
