# Feature: Marketing shell and hero

**From build-plan:** feature 3b
**Status:** verified

## Goal

The first page a visitor can land on and navigate. Delivers the `(marketing)`
route group and every piece of persistent page chrome (announcement bar, header
with desktop navigation and a products dropdown, mobile navigation on the
adapted `Sheet`, compact language `Select`, footer), plus the landing page's
opening content: the hero and the trust-benefit row beneath it.

Feature 3a already built the on-dark surface contract this feature needs
(`Button` and `NavigationMenu` both expose `surface="default" | "dark"`, F-06
is closed). This is the **first page-level consumer** of that contract: the
hero puts a nav, a CTA and a text link on top of a photograph for real, not a
flat showcase panel, so the composition itself - not the token math - is the
new work here.

## Design reference

- `blueprint/reference/Solean landing page.png` - the landing artboard. Top
  ~1100px covers the announcement bar, header, hero and trust benefits; the last
  ~700px covers the footer.
- `blueprint/reference/Learn Article — !learn!blog!mounjaro-vs-wegovy.png` - top
  ~130px shows the **solid** header variant on a light page, versus the landing
  page's transparent overlay variant.
- `blueprint/reference/design-system.md` - authoritative token, type, radius and
  Button specs. Section 1c already records the Button/NavigationMenu dark-surface
  matrix this feature consumes. Section 1b's contrast matrix is the check to run
  before pairing any text role with `--surface-warm` or `--surface-tint`, both of
  which this feature introduces to `src/` for the first time.

The export has **no mobile artboards**. Every layout below the desktop
breakpoint is a considered responsive adaptation, not a transcription.

### Decisions already taken

| Question | Decision |
| --- | --- |
| Nav model (two conflicting sets in the export) | The landing set wins: Home, Treatments (dropdown), About Us, FAQ, Learn |
| Hero rating badge names Reviews.io | Drop the third-party name. Keep the badge, `StarRating` and "4.7 - 1,200+ reviews" as an explicitly mock first-party fixture |
| Hero photograph | See **Open decision** below. The chosen source turned out not to exist |

### Open decision - the hero photograph

You chose "extract from the export" when this was first specced. **That is not
achievable, and the relevant step is specced around a placeholder instead.**

`design/prio_one_landing_page_men_new.html` embeds only 15 unique images: the two
clinician headshots, three product shots (a Novo-branded pill, a Mounjaro pen, a
Wegovy pen), an injection close-up, the five payment marks, the DHL mark and the
EU pharmacy badge. It contains no `<img>` tags and no remote image URLs. Every
photograph in the PNG render - the hero café scene included - was dropped on
export. Cropping the hero out of `Solean landing page.png` does not help either:
the headline, navigation and buttons are composited on top of it.

**Resolved in step 10 with generated artwork.** Downloading was attempted and
rejected on the evidence: the only reachable free sources returned either
irrelevant subjects (landscapes, animals) or photographs of identifiable people
with unclear licensing, which is the same likeness and trademark risk that put
the export's own photography out of bounds. `src/lib/assets/hero.jpg` is instead
generated locally: a warm out-of-focus bokeh field over a deep-green base, dark
at top and bottom where text sits. It carries no likeness or licence risk, and
because its luminance is known the overlay above it can be measured rather than
guessed. Swapping in real art stays a one-line change plus a file.

The same finding applies to the footer's payment marks: they are embedded, but
they are live trademarks (Visa, Mastercard, American Express, Klarna, DHL). Step
9 renders them as typographic chips rather than committing trademarked bitmaps
into the repo. Flagging rather than deciding for you.

### Which adapted primitive each surface uses

Features 1 and 3a exist precisely so this feature composes rather than invents.
Every interactive surface below maps to an already-adapted primitive; none of
them gets hand-rolled markup:

| Surface | Primitive | Notes |
| --- | --- | --- |
| Desktop nav, **both** header variants | `NavigationMenu` | All five top-level items, not just Treatments. Hero navbar included, via `surface="dark"` |
| Treatments products dropdown | `NavigationMenu.Trigger` + `.Content` | Three entries from the domain catalogue |
| Mobile nav | `Sheet` | Same nav model, Treatments inline |
| Language control, header and footer | `Select` | Compact call-site styling, see below |
| Every CTA and the hero teaser link | `Button` | `surface="dark"` wherever it sits on the hero |
| Hero rating stars | `StarRating` (brand) | Existing accessible label |
| Logo, both variants | `SoleanLogo` (brand) | `currentColor` contract already handles both grounds |

If a surface here appears to need something outside this table, stop and flag it
rather than hand-rolling nav or menu markup.

### New load-bearing decision - the language control's scale

`Select`'s only existing treatment is Input's full box: `h-14 w-full` with a
visible border and card fill. That is correct for a form field and wrong for a
compact header or footer control - transcribed as-is it would render as a
56px-tall opaque white box wherever it sits, including directly on the hero
photo. The reference shows a plain "EN" plus a small chevron, no visible box on
either surface.

Step 4 therefore styles the language `Select.Trigger` at each call site through
its existing `class` prop (compact height, no border, no fill) rather than
changing the primitive's own default, which stays correct for real form fields
elsewhere. This is not a new primitive and not a primitive change - see the
"No new shadcn primitives" note below.

## In scope

- `(marketing)` route group, its layout, and the shared page container
- Announcement bar with the welcome-offer copy and the countdown timer
- Site header in two surface variants: transparent overlay (on the hero) and
  solid (every other marketing page)
- Desktop navigation, including the Treatments dropdown, composing the adapted
  `NavigationMenu` and its `surface` prop
- Mobile navigation on the adapted `Sheet`
- Compact language `Select`, English selected and Deutsch visible but disabled,
  styled to a minimal on-both-surfaces treatment and reused in header and footer
- Hero: eyebrow badge, struck-through headline, lead copy, dual CTA (composing
  Button's `surface="dark"`), mock rating badge, "latest from Learn" teaser card
- Trust benefits: the four-up icon row directly beneath the hero
- Site footer: brand and tagline, contact block, three link columns, payment and
  delivery block, language selector, legal bar, social links
- Typed marketing content fixtures - no service interface, per the build plan's
  rule that static marketing content consumes fixtures directly

## Out of scope

- Everything below the trust-benefit row: projection, results, bento, how it
  works (feature 4), testimonials, clinical team, FAQ content (feature 5)
- The `/learn/blog/[slug]` route itself (feature 6). The hero teaser links to it
  and 404s until then
- The `/questionnaire` route (feature 7). Both primary CTAs point at it and 404
  until then
- Any i18n, translated content or localized routing. Copy remains English; the
  disabled Deutsch option communicates prototype scope without pretending a
  second language works
- Undesigned routes linked from nav and footer (treatments index, product pages,
  about, contact, legal, clinician profiles). Links stay inert
- Any new shadcn primitive, and no change to a primitive's own default styling.
  This feature composes the already-adapted `NavigationMenu`, `Select`, `Sheet`,
  and `Button` (including their `surface` dimension) purely through call-site
  props and classes
- Dark mode

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

Accessibility and responsiveness are **done criteria on every step below**, not a
final sweep. Every step that renders UI is checked at 375px, 768px and 1440px,
with keyboard operation and visible focus, before it is offered for review.

- [x] **Step 1 - `(marketing)` route group and page container** - Create
  `src/routes/(marketing)/+layout.svelte` and move the placeholder `/` into
  `src/routes/(marketing)/+page.svelte`. Add the shared max-width container and
  fluid gutters the whole group uses. No header or footer yet, just the shell and
  the container. *Done when:* `/` still renders and `pnpm check` passes; `/dev/design-system`
  and `/dev/scenario` are visibly unaffected, confirming the group does not leak
  chrome onto the dev surfaces.

- [x] **Step 2 - Marketing content fixtures** - `src/lib/features/marketing/content.ts`:
  typed, exported fixtures for the nav model (including the three Treatments
  dropdown entries, sourced from the `src/lib/domain/` catalogue, not retyped),
  footer link columns, contact details, trust benefits, hero copy, the mock
  rating figures and the learn teaser. Plus a single `ROUTES` map holding
  `/questionnaire` and `/learn/blog/mounjaro-vs-wegovy` so features 6 and 7 wire
  up in one place. *Done when:* the module type-checks, treatment names resolve
  from the domain catalogue rather than string literals, and nothing else imports
  a hardcoded marketing string.

- [x] **Step 3 - Announcement bar and countdown timer** - Full-bleed dark bar:
  "WELCOME OFFER." / "Save EUR10 on your first online consultation", and a
  `CountdownTimer` product component showing days, hours, minutes, seconds. The
  timer picks its target on mount so SSR emits a stable initial value and
  hydration does not mismatch; the interval is cleared on destroy. Ticking digits
  are `aria-hidden` with one static visually-hidden summary beside them, so a
  screen reader is not interrupted every second. *Done when:* the bar renders
  identically on the server and after hydration with no console hydration
  warning, the timer counts down and stops cleanly on navigation, a screen reader
  announces the offer once rather than per tick, and the bar wraps rather than
  overflows at 375px.

- [x] **Step 4 - Site header, desktop, and the language control** -
  **One** `SiteHeader.svelte`, used by every marketing surface, with a `variant`
  prop: `overlay` (transparent, sits inside the hero card, passes `surface="dark"`
  to its `NavigationMenu` and `Button`) and `solid` (card ground, default
  surface, used by every other marketing page). Logo centred, nav left,
  `LanguageSelect.svelte` and CTA right.

  **The entire desktop nav is the adapted `NavigationMenu`, in both variants.**
  Every top-level item goes through it: Home, Treatments, About Us, FAQ and Learn
  are `NavigationMenu.Item` + `NavigationMenu.Link`, and Treatments additionally
  uses `NavigationMenu.Trigger` + `NavigationMenu.Content` for its three-treatment
  collection. No plain `<a>` or `<nav><ul>` nav markup, and no second nav
  implementation for the hero: the transparent hero navbar is this same component
  with `variant="overlay"`, differing only by prop. The CTA composes `Button`
  (`surface="dark"` under `overlay`). `LanguageSelect.svelte` wraps `Select` with
  the compact, borderless treatment from the **Open decision** above, itself
  surface-aware so it reads correctly in both variants. Do not use `Popover` or
  install another menu primitive.

  *Done when:* rendered markup for **both** variants carries
  `data-slot="navigation-menu"`, `data-slot="navigation-menu-item"` and
  `data-slot="navigation-menu-link"` on every top-level nav item, and the overlay
  variant's root carries `data-surface="dark"`; Treatments opens by pointer and
  keyboard, Escape closes it and restores focus, arrow-key behavior follows the
  primitive; the language control opens and exposes both options without allowing
  Deutsch to be selected; both header variants, including the language control,
  pass contrast against their own ground; the CTA reaches `/questionnaire` (404
  until feature 7).

- [x] **Step 5 - Mobile navigation** - Below the desktop breakpoint the nav
  collapses to a trigger opening the adapted `Sheet`, listing the same nav model
  with Treatments expanded inline rather than nested, plus the CTA. *Done when:*
  at 375px the sheet opens, traps focus, closes on Escape and on the close
  control returning focus to the trigger, the page behind does not scroll while
  open, and every nav destination is reachable by keyboard alone.

- [x] **Step 6 - Hero section, layout and copy** - `HeroSection.svelte`: the
  rounded full-bleed hero card, its gradient scrim, the eyebrow badge
  ("DOCTOR-LED WEIGHT LOSS FOR MEN"), the headline with "perfect shape" struck
  through in gold via stock `line-through` and `decoration-*` utilities, the lead
  paragraph, and the two CTAs on the responsive ladder from design-system.md
  (`text-4xl sm:text-5xl lg:text-7xl xl:text-8xl`). **Renders step 4's
  `SiteHeader` with `variant="overlay"` and builds no nav markup of its own** -
  the hero's navbar is the shared header component, not a hero-local copy. The
  scrim carries a defined minimum darkness so hero text
  contrast does not depend on the photograph behind it, **and the scrim tone at
  the header band specifically must read close to `--foreground`** - the
  `surface="dark"` contract's focus-ring offset is tuned for that exact ground,
  and a visibly different band color there would show as a mismatched ring
  offset, not just a contrast problem. *Done when:* headline, lead and both CTAs
  measure >= 4.5:1 against the scrim's worst case at three sampled points;
  `HeroSection.svelte` contains no `<nav>`, `NavigationMenu` or nav-link markup
  of its own, only a `SiteHeader` usage; the
  header's focus rings show no visible offset mismatch against the scrim; the
  struck-through phrase is conveyed by a real `<s>` element, not styling alone;
  the headline reflows without clipping at 375px, 768px and 1440px; no fixed hero
  height copied from the canvas.

- [x] **Step 7 - Hero image, rating badge and learn teaser** - The `heroImage`
  placeholder asset behind the fixture field described in **Open decision**
  above, plus the two overlay elements: the mock rating badge (composing the
  Feature 1 `StarRating`, no third-party platform name) and the "LATEST FROM
  LEARN" teaser card linking to `/learn/blog/mounjaro-vs-wegovy`. The teaser's
  "Read the article" link composes Button's `link` variant with `surface="dark"`.
  *Done when:* both overlays stack below the hero copy rather than overlapping it
  at 375px; the teaser link is legible and its focus ring visible on the dark
  ground; the rating badge exposes "4.7 out of 5 stars" to assistive tech through
  `StarRating`'s existing label; the image has a meaningful `alt` or is correctly
  marked decorative.

- [x] **Step 8 - Trust benefits row** - The four-up row beneath the hero:
  licensed physicians, GDPR compliant and discreet, discreet pharmacy delivery,
  100% digital and secure. Lucide icons from `@lucide/svelte`, heading plus
  description per column, from the step 2 fixture. *Done when:* four columns at
  1440px, two at 768px, one at 375px; icons are `aria-hidden` with the heading
  carrying the meaning; text roles are checked against section 1b's matrix for
  whichever ground the row sits on.

- [x] **Step 9 - Site footer** - `SiteFooter.svelte`: the rounded top card,
  logo and "Better health, built around you", the contact block with service
  hours, the Explore and Support link columns, the payment-and-delivery block
  (typographic chips per **Open decision** above), the same `LanguageSelect.svelte`
  from step 4, the legal bar and the social links. Wired into the `(marketing)`
  layout alongside the header. *Done when:* the footer renders on `/` at all
  three widths, columns stack rather than overflow at 375px, inert links are
  marked so they do not read as working destinations, social icon controls carry
  accessible names, and the ground chosen for the card is contrast-checked
  against every text role placed on it.

- [x] **Step 10 - Design fidelity pass against the reference** - Compare the built
  page to `Solean landing page.png` in a real browser at desktop and narrow widths
  and close the gaps. Covers: a visible hero photograph under a light-enough overlay
  rather than a flat panel; the hero and footer as near-full-bleed cards with their
  contents still in the shared container; the two-line headline with the struck
  phrase kept intact on one line; the two-line announcement bar. *Done when:* the
  hero artwork is visibly present behind the headline, every hero text role still
  measures >= 4.5:1 against the **rendered** composite (not a simulation), the page
  reports `scrollWidth == clientWidth` at narrow widths, and `pnpm check` plus
  `pnpm build` pass.

## Files / areas

**Created**

- `src/routes/(marketing)/+layout.svelte`, `src/routes/(marketing)/+page.svelte`
- `src/lib/features/marketing/content.ts`
- `src/lib/features/marketing/AnnouncementBar.svelte`, `CountdownTimer.svelte`
- `src/lib/features/marketing/SiteHeader.svelte`, `MobileNav.svelte`, `LanguageSelect.svelte`
- `src/lib/features/marketing/HeroSection.svelte`, `HeroRatingBadge.svelte`, `HeroArticleTeaser.svelte`
- `src/lib/features/marketing/TrustBenefits.svelte`
- `src/lib/features/marketing/SiteFooter.svelte`
- `src/lib/assets/hero.jpg` - generated hero artwork
- `src/lib/features/marketing/container.ts` - `CONTAINER` and `BLEED`

**Changed**

- `src/routes/+page.svelte` - moved into the route group, deleted from root

No changes anticipated to `src/lib/components/ui/` or `blueprint/reference/design-system.md`; this feature consumes the primitives Feature 3a already adapted rather than modifying them. If a step genuinely can't be built without a primitive change, stop and flag it rather than improvising one.

## Data / contracts

No service interface. Static marketing content, so typed fixtures are consumed
directly, per the build plan.

**Load-bearing, defined here and used by later features:**

| Contract | Shape | Consumed by |
| --- | --- | --- |
| `ROUTES` | `{ questionnaire: string; learnArticle: (slug: string) => string }` | Features 6 and 7 wire real routes by changing this map only |
| `NavItem` | `{ label: string; href: string; inert?: boolean; children?: NavItem[] }` | Features 4-6 add landing anchors and the learn destination |
| `SiteHeader` `variant` prop | `'overlay' \| 'solid'` | Feature 6's learn article renders `solid` |
| `LanguageSelect.svelte` | Reusable, surface-aware compact `Select` wrapper | Feature 6's learn header and footer reuse it directly |
| `TrustBenefit`, `FooterColumn`, `HeroContent` | typed fixture records | Feature 4 extends the landing page beneath the hero |

The Treatments dropdown reads its three entries from the `src/lib/domain/`
catalogue. Treatment names are never retyped as literals - build-plan rule, one
source of truth for the catalogue.

## Testing

No unit test runner and no `test` command are declared in `AGENTS.md`, and no
`Browser tests` command exists either, so **there is no test gate on this
feature** and none is claimed. Do not install a runner here; the build plan puts
that decision before feature 9. Verification is browser evidence plus
`pnpm check` and `pnpm build`.

This feature is also almost entirely presentational, which is exactly what
`coding-standards.md` puts out of unit-test scope. The one piece of real logic is
`CountdownTimer`'s remaining-time arithmetic. If you run `/tests` before this
feature starts, that function is the single thing worth a test and step 3 should
ship one; otherwise it rides on browser evidence.

**Per-step verification:** run `pnpm dev` and check each step's *Done when* in
the browser at 375px, 768px and 1440px, keyboard-only, before approving it.

**Contrast is measured, not eyeballed.** Steps 4, 6, 7, 8 and 9 each name a
pairing to check. Sample the rendered pixels and compare against section 1b (and
1c, for dark-surface pairings) of `design-system.md`; the hero scrim in
particular must be measured against its worst case, not against a convenient
patch of the photograph.

**Final gate:** `pnpm check` and `pnpm build` both clean, and a walkthrough of
`/` covering the dropdown, the language control, the mobile sheet, every focus
ring, and both header variants.

## Notes for the AI

- **Tokens and stock scales only.** No `text-[17px]`, no `rounded-[34px]`, no
  `w-[1920px]`, no canvas coordinates, no fixed section heights that exist only
  to reproduce an artboard. Opacity modifiers on semantic tokens
  (`text-background/80`) are fine; raw hex is not.
- **No new shadcn primitives, and no primitive edits.** `NavigationMenu`,
  `Select`, `Sheet` and `Button` (with its `surface` dimension) already exist and
  are already adapted. Compose them through props and call-site classes only.
  `LanguageSelect.svelte` is a feature component wrapping `Select`, not a change
  to `select-trigger.svelte` itself.
- **No hand-rolled nav or menu markup anywhere, hero included.** The transparent
  hero navbar is not a special case: it is `SiteHeader` with `variant="overlay"`,
  whose nav is `NavigationMenu` with `surface="dark"`. If a bare `<nav><ul><a>`
  block, a second header component, or a hero-local nav appears in a diff, the
  step is wrong. See the primitive mapping table above.
- **Reference errors are not requirements.** The two conflicting nav sets are one
  such error; the landing set is canonical. Do not transcribe the Reviews.io
  attribution.
- **Client vs server.** Everything is presentational. `CountdownTimer` is the
  only client-side-only concern; keep it SSR-safe the way
  `src/lib/journey/storage.ts` already handles `sessionStorage`, and follow that
  file's existing pattern rather than inventing a second one.
- Svelte 5 runes only. `$derived` over `$effect` for computed values; `$effect`
  in `CountdownTimer` only because an interval is genuinely external to Svelte.
- Route components stay thin. No product logic in `+page.svelte`.
- No em dashes in any generated content, code comments or copy.
- Comment the *why*, not the *what*. The existing components in
  `src/lib/components/brand/` and `src/lib/journey/` set the density to match.
- Inert links must be visibly and semantically inert, not `href="#"` that
  silently jumps to the top.
