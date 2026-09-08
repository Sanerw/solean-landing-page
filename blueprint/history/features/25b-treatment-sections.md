# Feature: Treatment page, the sections below the fold and the nav links

**From build-plan:** feature 25b
**Status:** verified

## Goal

The treatment page gains everything below the hero: the plan comparison across
3, 6, 9 and 12 months, the how-it-works section, and the FAQ. Then the three
treatment links in the navigation dropdown become real, so the page is reachable
by clicking rather than by typing a URL.

It matters because 25a built a page nothing links to. This is the half that makes
it a destination and gives a visitor a reason to stay on it.

## Design reference

| File | What it shows |
| --- | --- |
| `blueprint/reference/treatment-page-desktop.png` | The wide artboard, whole page |
| `blueprint/reference/treatment-page-mobile.png` | The narrow artboard, whole page |
| `blueprint/reference/treatment-export.html` | The Pencil export, for exact spacing and colour |

**The scale rules 25a established carry over unchanged**, and the archived spec at
`blueprint/history/features/25a-treatment-hero.md` records them in full. The two
that bind this feature:

- **Snap every figure to a stock Tailwind step**, per `design-system.md` sections
  2 and 3. The export is a fixed 1920px canvas, so each of its numbers is the
  desktop end of a ladder, never a literal value.
- **Reuse sanctioned tokens; add none.** The grounds this feature needs are
  already mapped: the comparison's cell grounds are `bg-card` and `bg-secondary`,
  the recommended column is `bg-accent`, and the how-it-works panel is `bg-muted`,
  which is what `HowItWorks` on the landing page already uses for the same
  section.

Ladders this feature needs:

| Element | Export, wide / narrow | Written as |
| --- | --- | --- |
| Section heading | 48, 56, 64 / 24 | `text-3xl md:text-4xl lg:text-5xl` |
| Comparison price | 30 / 18 | `text-xl md:text-3xl` |
| Column header | 17 / 10 | `text-xs md:text-sm` |
| Treatment name in a row | 22 / 19 | `text-lg md:text-xl` |
| Step title | 32 / 18 | `text-xl md:text-2xl` |
| FAQ question | 20 / 14 | `text-base md:text-lg` |

**The one-viewport rule from 25a does not apply below the fold.** It governed the
hero because the hero is what a visitor lands on. These sections are scrolled to,
so they take the site's ordinary `SECTION_Y` rhythm rather than the hero's tighter
one.

## In scope

- The plan comparison: a real `<table>` on a wide screen, stacked cards on a
  narrow one, covering all three treatments at all four durations.
- The how-it-works section: three numbered steps and the questionnaire CTA.
- The FAQ accordion.
- The three treatment links in the navigation dropdown made real, and
  `navItems()` adopting `treatmentDisplayName` from the domain.
- Copy for all of it in German and English.
- Unit coverage of the comparison logic, and browser coverage of the sections
  and the newly live links.

## Out of scope

- **A `/treatments` index.** Still undrawn. The dropdown's own parent item and
  the footer's Treatments link stay `inert`; only the three children go live.
- **The announcement bar.** The layout's decision, as in 25a.
- **Anything on the checkout or questionnaire path.** The CTAs are links.
- **Sanity.** This page's copy stays a repository fixture.
- **Reworking `HowItWorks` on the landing page.** See step 3: the treatment page
  gets its own, and the reason is a type boundary rather than taste.
- **Product photography in the comparison rows.** The export puts a thumbnail
  beside each treatment name. Only the injections have art, so rows render the
  name and format without a thumbnail until tablet art exists, which is the call
  25a already made for the gallery.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - The content for all three sections** - extend
  `src/lib/features/treatments/content.ts` with `comparisonRows(currentSlug)`,
  `howItWorksSteps()` and `treatmentFaq()`, plus their message keys in both
  locales. `comparisonRows` returns every treatment with its four plans, the
  display name from `treatmentDisplayName`, its format label, and an `isCurrent`
  flag so the page a visitor is on can be marked and not linked to itself.
  *Done when:* `pnpm test` is green with `content.test.ts` covering: every row
  carries four plans in ascending duration; exactly one row is `isCurrent` for a
  known slug and none for an unknown one; rows come cheapest first, as the
  artboard orders them, derived from the prices rather than stored; **every row offers the same
  durations**, since a table with ragged columns has nothing to render; and the
  FAQ and step lists are non-empty. Nothing renders yet.

- [x] **Step 2 - The comparison as a table** - `PlanComparison.svelte`, the wide
  layout only: a real `<table>` from `lg` up, `<th scope="col">` on the durations
  and `<th scope="row">` on the treatment, the recommended column on `bg-accent`
  with the artboard's best-value chip in its header. Every row except the current
  one links to its own page; the current one is marked with a text label, not
  styling alone. Below `lg` the section renders nothing yet, which step 3 fills.
  **`lg`, not `md`:** five columns with a 30px price in each needs about 1024px.
  At 768px the four price columns are near 150px and the figures collide, which
  is the reason the narrow artboard stops using a table at all.
  *Done when:* at 1280px a table renders with three body rows and five columns;
  its recommended column is named in its header so the mark is not colour alone;
  the current treatment carries no link to itself and says so in text; the other
  two link to their own pages; **at 768px nothing overflows the container**, the
  width this layout is most likely to break at; `pnpm test:browser` is green.

- [x] **Step 3 - The comparison as stacked cards** - the narrow layout in the
  same component: below `lg`, one card per treatment, its four durations in a
  two-by-two grid, the recommended duration marked the way the table's column is.
  Each card names its treatment in its own heading, because it is no longer a
  table and cannot borrow the header association.
  *Done when:* at 390px and at 768px no `table` element exists and three cards
  render; the same four prices per treatment appear as in the table; the current
  treatment is marked and unlinked there too; nothing overflows at 390px.

- [x] **Step 4 - How it works** - `TreatmentHowItWorks.svelte`: the panel, the
  heading and lead, three numbered steps as an `<ol>`, and the questionnaire
  button. Built local to the treatments feature rather than reusing the marketing
  `HowItWorks`, because that component's props are the Sanity picture shape while
  this section's visual is a repository asset; forcing a union onto a Sanity-bound
  component to serve two callers is the larger change. It reuses the shared
  `CONTAINER`, `BLEED`, `PANEL_*` and type constants, so the two sections stay in
  step visually without sharing a type.
  *Done when:* the section renders on all three pages with its three steps in
  order, numbered from the render index rather than from stored numerals; the CTA
  links to the localised questionnaire; the steps are an `<ol>`, so the sequence
  reaches assistive tech; its heading is an `h2`, so the page keeps one `h1` and a
  flat outline under it; nothing overflows at 390px.

- [x] **Step 5 - The FAQ** - the accordion, reusing the marketing
  `FaqSection.svelte`. Its prop type is currently `NonNullable<HomePage['faq']>`,
  a Sanity type; widen it to a local `FaqContent` interface that both the Sanity
  shape and this fixture satisfy. That is a small change and the honest one: the
  component is a thin accordion wrapper and the two shapes are already identical.
  *Done when:* seven questions render on all three treatment pages, all closed on
  load, one open at a time; the landing page's own FAQ still renders unchanged
  from Sanity; `pnpm check` is clean.

- [x] **Step 6 - The navigation links go live** - remove `inert` from the three
  treatment children in `navItems()`, and have them read `treatmentDisplayName`
  from the domain instead of rebuilding the name inline. The parent Treatments
  item stays `inert`, because its index does not exist.
  *Done when:* the desktop dropdown's three items are real links to
  `/treatments/{slug}`; the mobile menu's three are too; the parent item is still
  not a link; the links are localised, so the English menu lands on
  `/en/treatments/...`; a browser test clicks from the landing page through to a
  treatment page in both locales.

## Files / areas

| Path | Why |
| --- | --- |
| `src/lib/features/treatments/content.ts` | Step 1: the three new content functions |
| `src/lib/features/treatments/types.ts` | Step 1: `ComparisonRow`, `HowItWorksStep`, `FaqItem` |
| `src/lib/features/treatments/content.test.ts` | Step 1 coverage |
| `src/lib/features/treatments/PlanComparison.svelte` | Steps 2 and 3, the two layouts of one component |
| `src/lib/features/treatments/TreatmentHowItWorks.svelte` | Step 4 |
| `src/lib/features/marketing/FaqSection.svelte` | Step 5: the prop type widening, nothing else |
| `src/lib/features/marketing/content.ts` | Step 6: the three children go live |
| `src/routes/(marketing)/treatments/[slug]/+page.svelte` | Composition only |
| `messages/de.json`, `messages/en.json` | Every string, both locales, in the step that renders it |
| `e2e/treatments.spec.ts` | Steps 2, 3, 4 and 6 |

Untouched on purpose: `SiteHeader.svelte`, `MobileNav.svelte` and
`SiteFooter.svelte`, which already render an `inert` item correctly, so only the
data changes; `src/lib/domain/`; and everything under
`src/lib/features/questionnaire/`.

## Data / contracts

```ts
interface ComparisonRow {
  slug: string;
  /** From `treatmentDisplayName`, never retyped. */
  name: string;
  formLabel: string;
  plans: readonly Plan[];
  /** The page being viewed: marked in the table, and never linked to itself. */
  isCurrent: boolean;
}
```

`HowItWorksStep` is `{ title: string; body: string }` and `FaqItem` is
`{ question: string; answer: string }`. Neither is load-bearing past this
feature; `ComparisonRow` is, because a `/treatments` index would read the same
rows.

Rules the shape carries:

- **The durations are the columns**, so every row must offer the same four. The
  step 1 test enforces it: a ragged set has no table to render.
- **Rows come from `treatmentPages()`**, so the comparison and the dose selector
  read one price list and cannot disagree.
- **`isCurrent` is computed, not stored.** It is a property of the page being
  viewed, not of the treatment.

## Testing

`pnpm test` is declared in `AGENTS.md`, so the test gate is on: step 1 is the
logic-bearing step and ships its test in the same diff. `pnpm test:browser` is
declared, so the behavioural done-whens get focused coverage.

| Level | Covers |
| --- | --- |
| `pnpm test` | `content.test.ts`: row shape, price ordering, uniform durations, the `isCurrent` rule both ways, non-empty lists |
| `pnpm test:browser` | the table at 1280px and cards at 390px; the current row unlinked; the how-it-works CTA; the dropdown reaching the page in both locales |
| Direct browser | Visual fidelity against the two artboards. Chromium only, so no cross-browser claim follows |

The treatment page is already in `e2e/accessibility.spec.ts` from 25a. Re-run that
sweep after step 2: a table is the one genuinely new construct here, and header
association is exactly what axe checks. That sweep loads the page at the
harness's default width, so it exercises the table and not the cards; step 3's
markup is covered by its own structural assertions instead.

## Notes for the AI

- **Client versus server.** Unchanged from 25a: the copy is a local fixture and
  the load stays `+page.server.ts`, reading only the rating. Nothing here adds a
  load.
- **The comparison is a table, and has to be one.** Prices across treatments and
  durations are tabular data; a grid of divs leaves a screen reader no way to
  associate 119 with "Wegovy Pill, 6 months". The stacked narrow layout is not a
  table and must not pretend to be: each card names its treatment in its own
  heading instead.
- **Prices are display copy.** Nothing computes a total, reads the Shopify
  catalogue, or consults the recommendation.
- **Localisation.** German is the base locale and owns the bare path. Every
  internal link goes through `localizeHref` at the link. Both catalogues gain
  each string in the step that renders it.
- **Product names are not translated**, and come from `treatmentDisplayName`.
- **Reach for the adapted primitives.** `Accordion` for the FAQ, `Button` for the
  CTAs, `Badge` for the best-value chip.
- **Stock Tailwind scales only.** No arbitrary values.
- **No em dashes** in copy, comments or commit messages.
- **Comment the why, not the what.**

### Two reference defects this feature must not transcribe

Both are the same class as the ones 25a resolved, and section 9 of
`project-plan.md` already records the pattern.

1. **The wide artboard lists seven FAQ items, the narrow one six.** One list,
   from the content module, at both widths. The seventh, "Will I lose my appetite
   completely", is kept: dropping a question because one artboard ran out of room
   is a layout accident, not an editorial decision.
2. **The comparison thumbnails are `pencil:///` assets** that resolve nowhere.
   Rows render without them rather than with a broken image.

### A defect this feature exposes but does not fix

The nav's FAQ item and the footer's How it works and Our experts links point at
`/#faq`, `/#how-it-works` and `/#experts`. **None of those ids exists anywhere in
the app**, so all three already land at the top of the landing page and do
nothing. Step 6 touches the same file, which is how this surfaced.

It is left alone deliberately: adding ids to three landing-page sections is a
change to the landing page, not to the treatment page, and folding it in here
would put an unrelated diff inside this feature. Worth a `/fix` of its own.

### What review changed after the first pass

Recorded because the reasons matter more than the diffs, and 25b's own steps read
as if the first attempt was right.

- **How it works had no visual.** The wide artboard draws this section exactly as
  the landing page does, image left with a caption card over its foot and the
  numbered steps right, and `how-it-works-enhanced.webp` was already in the
  repository. The first pass built a bare list in an empty panel. It is now the
  artboard's layout, using that asset through `enhanced:img`.
- **The heading duplicated its own caption.** The narrow artboard promotes "From
  consultation to delivery, entirely online" to the heading while the wide one
  keeps "How it works." and uses the longer line on the care card. Rendering both
  put the same sentence on screen twice, so the wide artboard's split is the one
  followed.
- **Everything below the fold was set at the landing page's scale.** The artboards
  draw a section heading at 64px on the home page and 48px here, so
  `treatments/type.ts` now holds this page's own ladder, one step below, and
  `FaqSection` takes a `compact` flag rather than a class prop so a caller picks a
  scale the design system defines.
- **The comparison did not read like the reference**, in five ways, all fixed on
  a second review pass against the artboard:
  - The best-value chip **floats above the table**, straddling its top edge over
    the recommended column, as the artboard draws it. It is positioned as a
    percentage derived from the column layout rather than measured, so it stays
    centred if a duration is added or removed, and it is `aria-hidden` with the
    same words repeated `sr-only` inside the column header: a chip floating
    outside the table would otherwise be read detached from what it describes.
  - **The header row is the warm sand the artboard uses**, `bg-muted`, not the
    cooler `bg-secondary`.
  - **Each row carries its treatment's thumbnail**, the same art the gallery
    shows, so a treatment cannot show one picture in the hero and another here.
    A treatment without art keeps an empty slot rather than losing it, so the
    names stay on one vertical line down the column.
  - **"Learn more" sits beside the name**, not stacked under it.
  - **Rows are ordered cheapest first**, as the artboard orders them, derived
    from the prices rather than stored, so a price change reorders the table
    instead of leaving it stale. The name column is a third rather than a
    quarter: the reference's own fraction wraps "Wegovy Injection" onto two lines
    on a 1440 screen, because its canvas is 1920.

### Two things a third review pass caught

- **The mobile dose price wrapped onto two lines.** The narrow artboard prints
  the bare figure, and it is right to: four segments across 390px cannot hold
  "/ month" as well. The unit is `sr-only` below `md` rather than removed, so the
  option is never announced as an unqualified number, and `not-sr-only` from `md`
  restores it visually. Asserted on computed style rather than text, because
  `sr-only` clips an element instead of removing it and the words stay in
  `textContent`.
- **The consultation bar scrolled away with the content.** It was `sticky`, which
  25a chose so it would clear the footer's legal row, but that solved the
  collision by taking the button away exactly when a visitor had finished reading
  and was most likely to act. It is `fixed` now and floats at every scroll
  position. The legal row is protected by reservation instead: the bar publishes
  `--treatment-cta-height` and the marketing layout carries that as trailing
  padding, so Impressum and Datenschutz scroll clear of it. The property is
  absent on every other page, so the padding resolves to zero there.
- **The sticky consultation bar was invisible behind the consent gate.** Both are
  anchored to the bottom of the viewport, and 25a's `z-40` decision put the bar
  under the gate deliberately. In practice that reads as a missing button rather
  than a covered one. They now stack: `ConsentBanner` publishes its height as
  `--consent-gate-height` while it is on screen, and the bar offsets itself by it.
  The property is set to zero rather than merely removed when the gate is
  answered, because the element carrying its measurement lives inside the
  banner's `{#if}` while the component does not, so the last height outlived the
  banner and left the bar floating.

  This is the first cross-feature use of that property, and the contract is
  deliberately CSS rather than shared state: what a consumer needs is a length,
  and the alternative is every bottom-anchored element importing analytics state
  to position itself. `e2e/treatments.spec.ts` proves both halves in a block that
  clears the suite's declined-consent state, which is the only way the gate
  renders at all.

### A header bug this feature exposed

`NavigationMenu.Content` is absolutely positioned with no z-index of its own, and
`SiteHeader` was not positioned at all, so the open dropdown competed with page
content on DOM order alone. Every page before this one happened to win that
contest; the treatment page's gallery is `relative` and later in the document, so
it painted straight over the menu. The hover state was fine all along and simply
could not be seen through what was on top of it.

The header now carries `relative z-50`. The stacking belongs there rather than on
the panel, because it is the header that has to outrank the page, and the fix is
worth having on every page rather than only this one.

The dropdown row's own radius moved with it. The primitive rounded a row at
`rounded-2xl`, 36px, which inside a 20px panel reads as a pill floating in the
panel rather than as a row of it; it now takes `rounded-lg`, the panel's own
radius. That is an edit to a shadcn primitive rather than a call-site override,
so it applies to every dropdown in the app. The header's is the only one today.

Worth recording for the next person writing a test like this: **Playwright calls
a covered element visible.** The regression test hit-tests with
`elementFromPoint` and names whatever is on top, and it waits for the panel's
zoom and fade to finish first, because a hit test taken mid-animation reports
whatever sits under a half-transparent element. It also opens the menu by hover
rather than by click and keeps the pointer inside the panel throughout: this menu
closes when the pointer leaves it, and a test that parks the mouse elsewhere
measures a panel that has already gone.

### One question to settle during step 1

The export puts a "Learn more" link on every comparison row, including the
treatment whose page you are already reading. Proposal: the current row is marked
with a quiet "You are viewing this" label and carries no link, because a link to
the page you are on is a dead end. Say if you would rather every row link and the
current one simply reload.
