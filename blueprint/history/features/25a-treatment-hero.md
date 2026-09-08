# Feature: Treatment detail pages, route and product hero

**From build-plan:** feature 25a
**Status:** verified

## Goal

`/treatments/[slug]` becomes a real route for the three catalogue treatments, and
renders the product hero the treatment export draws: the gallery panel with its
badges and caption, the breadcrumb, title, rating and introduction, the dose
selector, the clinician-guidance note, the consultation offer card, and on a
narrow screen the sticky consultation bar that replaces the card.

It matters because the navigation has offered these three destinations as inert
text since feature 3b. This sub-feature builds the page; 25b builds the sections
below the fold and makes the links real.

## Design reference

| File | What it shows |
| --- | --- |
| `blueprint/reference/treatment-page-desktop.png` | The wide artboard, 1920px, whole page |
| `blueprint/reference/treatment-page-mobile.png` | The narrow artboard, 390px, whole page |
| `blueprint/reference/treatment-page-mobile-sticky.png` | The sticky consultation bar on its own |
| `blueprint/reference/treatment-export.html` | The Pencil export both images were captured from, for exact spacing and colour |

**The export is a fixed canvas and is not ported at its own size.** It is drawn
at 1920px wide, so every figure in it is the desktop end of a ladder. Snap each
one to the nearest stock Tailwind step using the tables in
`blueprint/reference/design-system.md` sections 2 and 3, exactly as features 4,
5 and 21 did. The ladders this page needs:

| Element | Export, wide / narrow | Written as |
| --- | --- | --- |
| Product title | 58 / 40 | `text-4xl md:text-5xl lg:text-6xl` |
| "Choose your dose" | 28 / 24 | `text-2xl md:text-3xl` |
| Introduction | 18 / 15 | `text-base md:text-lg` |
| Dose label | 18 / 14 | `text-sm md:text-lg` |
| Dose price | 13 / 12 | `text-xs md:text-sm` |
| Breadcrumb | 14 / 11 | `text-xs md:text-sm` |
| First-month price | 26 | `text-2xl` |
| Badge and caption labels | 14, 13, 10 | `text-xs`, per the badge row of the micro-type table |

Radii follow section 3: the gallery 34/24 is `rounded-xl sm:rounded-2xl`, the
dose selector 18/16 is `rounded-lg`, the clinician note 16/14 is `rounded-md`,
the offer card 20 is `rounded-lg`, and every pill badge is `rounded-full`.

**The whole hero has to land inside one viewport**, decided at review on
2026-09-08 against a 13 inch MacBook, which is the screen this page is read on.
That is a harder constraint than the ladders above and it overrides them where
they disagree: the export is drawn at 1920 by 4035 and its hero alone is 923px
tall, so ported at the ladder's own scale the consultation CTA sits below the
fold on the machine the reviewer is using.

Three things carry it, and 25b's sections have to keep them:

- **The gallery is a square only while it is stacked.** From `lg` it takes half
  the row and its height from the details column beside it, which is the wide
  artboard's own arrangement: 804 by 828 there is the height of the column next
  to it, not a square. A true half-width square is 630px tall and pushes the CTA
  under the fold; capping it to a smaller square instead left it floating in a
  column half again its width, which review rejected. Height from the neighbour
  is what gives both the half-page panel and the fold.
- `--spacing-treatment-gallery`, `min(28rem, 46svh)`, still caps the stacked
  case, so the square does not fill a tablet before a word of copy is reached.
- One step down the type ladder for the title, the dose heading and the
  introduction, and a tighter vertical rhythm than the rest of the site's.

`e2e/treatments.spec.ts` measures the CTA against an 800px viewport, so this
cannot regress silently.

**The rating stars take `--primary`, the reference's own `#E2B64F`.** They are
passed `decorative`, which is a mode added to `StarRating` for this: the score
and the count are printed immediately beside them, so the stars restate rather
than carry the rating. That makes them duplication rather than a meaningful
graphic, which is what the primitive's darker `--highlight-foreground` and its
3:1 floor exist for, and it is also why they are hidden from assistive tech
instead of announcing the rating a second time.

**Colour: reuse sanctioned tokens, add none.** The export introduces three
grounds this palette has no token for. Map them to the nearest sanctioned
surface rather than inventing tokens mid-feature:

| Export | Role | Reuse |
| --- | --- | --- |
| `#D3EEF9` | Gallery ground | `bg-surface-delivery` |
| `#E7F0E3` | Clinician-guidance note | `bg-accent` |
| `#F7F5EE` | Dose selector ground | `bg-muted` |
| `#B7DDBD` | Saving badge | `bg-accent` with `text-foreground` |

If fidelity review rejects the gallery ground, adding one token is a recorded
follow-up in `design-system.md` section 1b, not a decision to take inside a
build step.

## In scope

- `src/lib/features/treatments/`: the typed definition of the three treatment
  pages, in German and English, and the pure logic over it.
- The `/treatments/[slug]` route inside the `(marketing)` group, its load, its
  404 for an unknown slug, and its `<svelte:head>` with canonical and alternates.
- The product hero: gallery panel, breadcrumb, title, rating, introduction,
  dose selector, clinician-guidance note.
- The consultation offer card on a wide screen, and the sticky consultation bar
  that carries the same offer on a narrow one.
- Unit coverage of the content module's logic.
- Focused browser coverage of the route, the 404, the dose selection and the
  two widths of the offer.

## Out of scope

- **The plan comparison, how it works, and the FAQ.** They are 25b, and the page
  ends after the hero until then.
- **Making the navigation links real.** Also 25b. Until then the page is reached
  by typing the URL, which is what the browser tests do.
- **Product photography for the tablet.** The repository holds one product shot,
  an injection pen beside its box, so the two injections carry it and the tablet
  page does not. A syringe under a chip reading "daily tablet" is the wrong
  medicine rather than a missing picture, so that page keeps its ground, chips
  and caption until real tablet art exists. The slot is guarded and the guard is
  covered both ways round in the browser suite.
- **A `/treatments` index.** Still deferred; the breadcrumb's Treatments segment
  is text, not a link.
- **Any change to `SiteHeader` or `SiteFooter`.** The page renders the existing
  solid header the way the learn and legal pages do.
- **Sanity.** This page's copy is a repository fixture by decision; no schema
  work in `../studio-solean`.
- **The announcement bar the artboards draw at the top.** The marketing layout
  owns it site wide, and `fix/hide-announcement-bar` is an unmerged branch that
  hides it. This page adds none of its own either way: whichever way that fix
  lands, the bar is the layout's decision, not this page's.
- **Anything on the checkout or questionnaire path.** The CTA is a link to
  `/questionnaire`, nothing more.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - The content module** - `src/lib/features/treatments/types.ts`
  and `content.ts`: the `TreatmentPage` shape and `treatmentPages()`, a function
  (not a constant) so messages resolve against the active locale, the same rule
  every localised export in `marketing/content.ts` follows. Keyed by the domain
  catalogue id, with the display name read from `TREATMENTS` rather than
  retyped. Plus `findTreatmentPage`, `startingDose` and `standardMonthly`, and
  the German and English message keys for all three treatments.
  *Done when:* `pnpm test` is green with `content.test.ts` covering: a known
  slug returns its page; an unknown slug returns `null`; **every treatment in
  `TREATMENTS` has a page**, so a catalogue addition cannot leave a dead nav
  link; plans are ordered by ascending duration; `firstMonth` is below every
  plan's monthly price; every dose carries a price; and **neither `doses` nor
  `plans` is ever empty**, so no page can render an empty selector or, at 25b,
  an empty comparison row. Nothing renders yet.

- [x] **Step 2 - The route, the head and the page skeleton** -
  `src/routes/(marketing)/treatments/[slug]/+page.server.ts`, `+page.svelte` and
  `+error.svelte`. The load resolves the slug and calls `error(404)` when it does
  not, and reads the live rating with `cachedRating(fetch)`, the same shared
  instance the landing page uses, so the two pages can never print different
  scores and Reviews.io is not called a second time per visitor. The page renders
  the solid `SiteHeader` in the same `BLEED`/`sm:py-3` wrapper the learn page
  uses, then the breadcrumb, title, rating row and introduction on the page
  ground. The rating row is `StarRating` plus a summary line built from
  `formatScore`, falling back to `RATING.fallback` when the load returned null,
  exactly as `HeroRatingBadge` does. `<svelte:head>` carries a parameterised
  title and description; the canonical and both `hreflang` alternates are
  already emitted by the root layout through `alternatesFor(page.url.pathname)`,
  so this page adds none of its own.
  *Done when:* `/treatments/wegovy-pill`, `/treatments/wegovy` and
  `/treatments/mounjaro` each render header, breadcrumb, their own title, the
  rating row and their own introduction; the rating figures match the landing
  page's in the same session; `/treatments/nope` answers 404 through
  `+error.svelte` rather than a blank screen; `/en/treatments/wegovy-pill`
  renders the English copy and the English document title; `pnpm check` and
  `pnpm build` are clean.

- [x] **Step 3 - The gallery panel** - `TreatmentGallery.svelte`: the tinted
  rounded panel, the form badge top left with its Lucide icon, the `NEW` badge
  top right when the treatment carries it, the caption at the foot, and a photo
  slot rendered only when the page has one.
  *Done when:* all three pages show the panel at the artboard's proportions with
  the right form badge (`Pill` for the tablet, `Syringe` for the two
  injections); the `NEW` badge appears on Wegovy Pill only; no image request is
  made and no broken-image placeholder appears; the panel keeps its aspect on a
  390px viewport and on a 1920px one.

- [x] **Step 4 - The dose selector** - `DoseSelector.svelte` over the adapted
  `RadioGroup`, drawn as the artboard's joined segments: the selected segment on
  `bg-foreground` with inverted text, the rest transparent on the selector's
  ground, hairline dividers between them. Selection is client `$state` in the
  page and drives nothing outside it yet.
  *Done when:* the four doses render for each treatment with their own labels
  and prices; the first dose is selected on load; clicking or arrowing to
  another moves the selection and the styling follows; the control is one
  `radiogroup` with an accessible name, reachable by keyboard, and each option
  is announced with its dose and price; the row does not overflow at 390px.

- [x] **Step 5 - The consultation offer and the sticky bar** -
  `ConsultationOffer.svelte` and `StickyConsultationBar.svelte`. The card
  carries the saving badge, the first-month price, an ongoing line naming the
  **selected dose's** monthly price, and the `inverse` `Button` linking to the
  localised questionnaire. The narrow artboard has no card, so the card is
  `max-md:hidden` and the bar is `md:hidden`, fixed to the bottom with the
  export's blur, top hairline and rounded top corners, plus
  `pb-[env(safe-area-inset-bottom)]`. The page reserves bottom padding under the
  bar so the last section is never covered.
  *Done when:* on a wide viewport the card shows and the bar does not; on a
  390px viewport the bar shows and the card does not; changing the dose changes
  the card's ongoing price line; the bar's label and the card's first-month
  price are the same figure, read from one field; both CTAs land on
  `/questionnaire` in German and `/en/questionnaire` in English; the bar sits at
  `z-40`, under the consent banner's `z-50`, so the legal gate is never covered;
  `pnpm test:browser` is green.

## Files / areas

| Path | Why |
| --- | --- |
| `src/lib/features/treatments/types.ts` | `TreatmentPage`, `Dose`, `Plan`, `ConsultationOffer` |
| `src/lib/features/treatments/content.ts` | `treatmentPages()`, `findTreatmentPage`, `startingDose`, `standardMonthly` |
| `src/lib/features/treatments/content.test.ts` | The step 1 coverage |
| `src/lib/domain/catalogue.ts` | Gains `treatmentDisplayName`, the "Wegovy" plus "Injection" rule that `navItems()` already applies inline. Adding it here rather than copying the rule is what keeps the page and the dropdown from disagreeing; 25b makes `navItems()` adopt it, since 25b touches that file anyway |
| `src/lib/features/treatments/TreatmentGallery.svelte` | Step 3 |
| `src/lib/features/treatments/DoseSelector.svelte` | Step 4 |
| `src/lib/features/treatments/ConsultationOffer.svelte` | Step 5 |
| `src/lib/features/treatments/StickyConsultationBar.svelte` | Step 5 |
| `src/routes/(marketing)/treatments/[slug]/+page.server.ts` | Slug resolution, the 404, and the live rating |
| `src/routes/(marketing)/treatments/[slug]/+page.svelte` | Composition only, no logic |
| `src/routes/(marketing)/treatments/[slug]/+error.svelte` | The 404 screen |
| `messages/de.json`, `messages/en.json` | Every string on the page, both locales, added in the step that renders it |
| `e2e/treatments.spec.ts` | Steps 2, 4 and 5 |

Untouched on purpose: `SiteHeader.svelte`, `SiteFooter.svelte`,
`marketing/content.ts`, and everything under `src/lib/features/questionnaire/`.
`src/lib/domain/` gains one exported function and nothing else: no type changes,
no catalogue edits, no price moves into it.

## Data / contracts

`TreatmentPage` is load-bearing: 25b reads `plans` for the comparison table, and
a later `/treatments` index would read the same records. Lock it now.

```ts
interface Dose {
  /** As the label is printed, e.g. "1.5mg". Not parsed. */
  label: string;
  monthlyPrice: Money;
}

interface Plan {
  durationMonths: 3 | 6 | 9 | 12;
  monthlyPrice: Money;
  /** The artboard's "THE BEST VALUE" column. Exactly one plan carries it. */
  recommended: boolean;
}

interface TreatmentPage {
  /** The domain catalogue id, which is also the URL segment. */
  slug: string;
  /** Reference art the repository does not have yet; the gallery guards on it. */
  photo?: { src: string; alt: string };
  formLabel: string;
  isNew: boolean;
  galleryCaption: string;
  intro: string;
  doses: readonly Dose[];
  plans: readonly Plan[];
  /** The discounted first month. One figure, read by the card and the bar alike. */
  firstMonth: Money;
  clinicianNote: { title: string; body: string };
}
```

Rules the shape carries:

- **The slug is the catalogue id**, so `/treatments/${treatment.id}` in
  `marketing/content.ts` already points at the right page and a rename cannot
  orphan one. The step 1 test enforces the pairing in both directions.
- **The name is never stored here.** It is read from `TREATMENTS`, so the
  dropdown, the questionnaire and this page cannot disagree about a product name.
- **Money is `Money`**, integer minor units through `eur()`, formatted at the
  edge. No float arithmetic and no price assembled from a string.
- **One first-month figure**, read by both the card and the sticky bar, so the
  export's 69-against-70 split cannot be transcribed.
- **The saving is derived, not stored.** The export's "Save 55 EUR on your first
  month" is exactly the standard monthly price minus the first month, so
  `firstMonthSaving()` computes it. A stored label is a second figure that goes
  stale the moment a price moves.

## Testing

`pnpm test` is declared in `AGENTS.md`, so **the test gate is on** and step 1 is
the logic-bearing step that must ship its test in the same diff. `pnpm
test:browser` is declared too, so the behavioural done-whens get focused
coverage.

| Level | Covers |
| --- | --- |
| `pnpm test` | `content.test.ts`: slug resolution both ways, catalogue coverage, plan ordering, the `firstMonth` invariant, every dose priced |
| `pnpm test:browser` | `e2e/treatments.spec.ts`: the three slugs render their own title; an unknown slug 404s; dose selection changes the ongoing price line; the bar shows at 390px and the card at 1280px; the CTA href is the localised questionnaire |
| Direct browser | Visual fidelity against the two artboards, at 390px and 1920px. The harness is Chromium only and proves behaviour, never fidelity |

The browser suite runs with analytics declined through `CONSENT_DENIED_STATE`,
so the consent banner is absent and the sticky bar is visible to the spec. Do
not add an assertion about the two stacking; that ordering is proved by reading
the z-index, not by a run that never renders the banner.

## Notes for the AI

- **Client versus server.** The copy is a local fixture, but the rating is a
  third-party read that this site has always done server-side, so the load is
  `+page.server.ts` and calls the shared `cachedRating`. Do not fetch Reviews.io
  from the browser: it would add CORS, a request on the critical path, and
  figures that appear after paint. Nothing here touches `$env`, and the page
  component itself holds only the selected-dose `$state`.
- **Localisation.** German is the base locale and owns the bare path. Every
  internal link goes through `localizeHref` at the link, never in a module
  constant. Every string added in a step lands in both `messages/de.json` and
  `messages/en.json` in that same step; an English string on the German site is
  a defect, not a follow-up.
- **Product names are not translated.** `Mounjaro` is a brand and "Injection"
  stays attached to it as the German market writes it, exactly as `navItems()`
  already does it.
- **Prices are display copy.** Nothing on this page computes a total, reads the
  Shopify catalogue, or consults the recommendation. That boundary is unchanged.
- **Reach for the adapted primitives.** `RadioGroup` for the dose selector,
  `Button` for the CTAs, `Badge` for the chips, `Breadcrumb` for the trail. Do
  not hand-roll a primitive that exists, and do not edit anything under
  `src/lib/components/ui/`.
- **Stock Tailwind scales only**, per the UI/UX rules. The one recorded
  arbitrary-value exception is the form field's `ring-[3px]`, which this page
  does not use. `env(safe-area-inset-bottom)` is a browser value, not a visual
  one, and does not need the exception.
- **The document title takes the treatment name as a parameter**, one message
  key rather than three, since the name comes from the catalogue and is not
  translated. The same for the meta description.
- **No em dashes** anywhere in copy, comments or commit messages.
- **Comment the why, not the what.** This codebase's comments record decisions
  and traps. Match that density; do not narrate the markup.

### Two content questions to settle during step 1

Both are the user's to answer, and both are display copy rather than logic, so
they do not block the build:

1. **The export prices two Wegovy Pill doses identically** at 172.73 EUR while
   the card above says "From 124 EUR per month" and the comparison row starts at
   124 EUR. Proposal: the starting dose's monthly price is the same figure as
   the shortest plan's, and each higher dose costs more. Confirm the four
   figures per treatment.
2. **The export's first month reads 69 EUR on the card and 70 EUR on the bar.**
   Resolved structurally by one `firstMonth` field; confirm which figure it is.

`project-plan.md` section 9 now records both defects, so neither is transcribed
by accident later.
