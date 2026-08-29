# Feature: Landing page social proof

**From build-plan:** feature 5
**Status:** verified

## Goal

The three sections that carry proof rather than claims: member testimonials, the
clinical team, and the FAQ. Testimonials and the team browse on the adapted
`Carousel`, the FAQ opens on the adapted `Accordion`, and all three read from
typed, deduplicated fixtures.

With these in, the landing page is content-complete: hero, trust row, bento,
results, how-it-works, projection, stories, team and FAQ, with only feature 12's
cross-feature hardening left for it.

## Design reference

- `blueprint/reference/Solean landing page.png`:
  - **Testimonials**, approximately y3830-4700: a mint band, heading and sub,
    prev/next controls top right, and three cards. Two are light text cards; the
    middle is a photograph with the same information laid over it.
  - **Clinical team**, approximately y4800-5560: heading and sub, prev/next
    controls, three cards, each a portrait above a sand panel with name, role,
    description and a "Learn more" link.
  - **FAQ**, approximately y6380-7100: heading and sub, then hairline-separated
    rows with a right-aligned chevron, the first one open.
- `blueprint/reference/design-system.md` - tokens, the section 1b contrast
  matrix, and the ruling that `carousel` is adapted when a feature proves it is
  needed. This is that feature.

The export has **no mobile artboards**. Every layout below the desktop
breakpoint is a considered responsive adaptation.

### Measured from the artboard

| Element | Reference | Token |
| --- | --- | --- |
| Testimonial band | `#E7EEE7` | `--accent` is the nearest sanctioned tone, already used for the bento's support card |
| Testimonial card | `#FBFAF7` | `--background` |
| Team card panel | `#F3ECDD` | `--surface-warm`, exact |
| FAQ ground | `#FBFAF7` | `--background` |
| Testimonial stars | `#E2B64F` | `--primary`. **Fails contrast on the light card, see below** |

### Open decision 1 - the star rating needs to be surface-aware

The reference draws testimonial stars in gold `--primary`. Those stars are the
only thing conveying the rating in a testimonial card, with no numeral beside
them, so they are a **meaningful graphic and need 3:1**. Gold measures **1.82:1**
on the light card. It cannot be used there.

No single colour solves it, because the middle card is a photograph:

| Star colour | On the light card | On the photo card |
| --- | --- | --- |
| `--primary` `#E2B64F` | **1.82 fail** | 6.78 pass |
| `--highlight-foreground` `#906100` | 5.16 pass | **2.39 fail** |

So `StarRating` gains a `surface="default" | "dark"` prop, exactly mirroring the
pattern `Button` and `NavigationMenu` already use from 3a: gold on dark grounds,
the darker gold on light ones.

This is a **change to a shared brand component**, which previous features
deliberately avoided. It is proposed here because the requirement is real, the
pattern already exists in the codebase, and the alternative is either
inaccessible stars or a second bespoke star renderer. Step 2 makes the change and
records both pairings; say so at review if you would rather it stayed at the call
site.

`StarRating` also currently renders green `--rating` squares, the trust-badge
treatment used in the hero. The testimonial stars are plain stars. The prop
therefore selects treatment as well as colour, and `design-system.md`'s line that
`--rating` is "rating and star colour only" gets corrected: `--rating` is the
**platform badge** treatment; inline star ratings use the gold family.

### Open decision 2 - the middle card has a play button

The reference's photo card carries a play control, implying a video story. There
is no video in this prototype and none is planned; the project is explicitly
mocked. A play button that does nothing is a promise the page cannot keep.

Step 4 therefore keeps the photo card as a visual variant, because the alternation
between text and photo cards is real design intent, but **omits the play
control**. Say so at review if you would rather keep it and open a "prototype
only" dialog instead.

**A second problem surfaced during step 3.** Unlike the bento images, the
artboard's testimonial photo has the card's own text and the play button
composited onto it, exactly like the hero, so it could not be lifted. The three
clinician portraits were clean and were extracted; the story card uses generated
tonal art instead, consistent with the hero's resolution.

### Reference errors to correct

`project-plan.md` section 9 already records the testimonial duplication, and the
artboard is worse than that entry suggests:

- **All three cards read "22 kg."** One shared figure across three different
  people is not credible. Each testimonial gets its own weight.
- **Amy R. and Maya R. both show "Wegovy injection."** Section 9's resolution is
  one testimonial per person; the treatments are also spread across the
  catalogue.
- Treatment chip labels come from `src/lib/domain/`, not retyped, per the
  build-plan rule that treatment names have one source of truth.

## In scope

- Typed fixtures for testimonials, clinicians and FAQ entries
- `StarRating` gains a surface-aware treatment, with both pairings recorded
- Testimonial and clinician imagery extracted from the reference artboard, the
  same technique 4a established
- `TestimonialCard` with its text and photo variants
- The testimonials carousel section
- `ClinicianCard` and the clinical team carousel section
- The FAQ section on the adapted `Accordion`
- Composition into `/` in reference order

## Out of scope

- Video playback of any kind
- Individual clinician profile pages. "Learn more" is inert, matching how nav and
  footer already treat undesigned routes
- A review submission flow. The reference's "Leave a review" link sits in the
  4a results band, not here, and is already absent
- Any new shadcn primitive beyond `Carousel` and `Accordion`, both already
  adapted in 1 and 3a
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
final sweep. Every step that renders UI is checked at narrow, tablet and desktop
widths, with keyboard operation and visible focus, before it is offered for
review.

- [x] **Step 1 - Fixtures** - Typed records for the testimonials (name, member
  label, weight lost, quote, rating, treatment id, verified flag, optional
  photo), the clinicians (name, role, description) and the FAQ entries (question,
  answer). *Done when:* the module type-checks; each testimonial has a distinct
  weight and the three treatments are spread across the catalogue rather than
  repeated; treatment labels resolve from `src/lib/domain/` rather than string
  literals; and no component holds a hardcoded testimonial, clinician or FAQ
  string.

- [x] **Step 2 - Surface-aware StarRating** - Add `surface="default" | "dark"` to
  the brand component and the plain-star treatment the testimonial cards need,
  keeping the existing badge treatment as the default so the hero is unchanged.
  Record both pairings in `design-system.md` and correct its `--rating` line.
  *Done when:* the hero trust badge renders exactly as before, verified by
  comparing it against the current page; stars on the light card measure >= 3:1
  and on the photo card >= 3:1; the accessible label still states the score; and
  `/dev/design-system` shows both treatments.

- [x] **Step 3 - Section imagery** - Extract the three clinician portraits and
  the testimonial photograph from the artboard by detecting each clean image
  rectangle, the technique 4a established, and commit them under
  `src/lib/assets/`. *Done when:* four assets exist, are imported through
  fixtures rather than hardcoded paths, and total added weight is stated in the
  review; portraits are decorative with the adjacent name carrying meaning; and
  no image is broken or missing at any width.

- [x] **Step 4 - TestimonialCard** - The card in both variants: the light text
  card, and the photo card whose text sits over the image on a scrim that
  guarantees contrast independently of the photograph, the same rule the hero
  follows. Weight, quote, name, member label, star rating, treatment chip and
  verified marker. **No play control**, per the open decision. *Done when:* both
  variants render the same information in the same order; the quote is a real
  `blockquote` with its attribution associated; every text role measures >= 4.5:1
  on its own ground, the photo variant against the scrim's worst case; and the
  treatment chip's label comes from the domain catalogue.

- [x] **Step 5 - Testimonials carousel** - The mint band, heading, sub, and the
  cards on the adapted `Carousel` with its previous and next controls styled to
  the reference. *Done when:* one card is usable at the narrowest width and three
  at desktop; the controls expose accessible names and disable at each end;
  keyboard focus is visible on them; the carousel does not trap or reorder tab
  focus; and no custom carousel state duplicates the primitive's own.

- [x] **Step 6 - Clinician team carousel** - `ClinicianCard` (portrait, name,
  role, description, inert "Learn more") and the section around it, on the same
  adapted `Carousel`. *Done when:* the cards render three-up at desktop and one
  at the narrowest width; each card's name is a real heading in document order;
  the inert "Learn more" is visibly and semantically inert rather than an
  `href="#"`; and text roles are checked against section 1b for the sand panel.

- [x] **Step 7 - FAQ** - The heading, sub and entries on the adapted `Accordion`,
  first item open to match the reference. *Done when:* each trigger is a real
  button inside a heading element; `aria-expanded` reflects state; Enter and
  Space toggle and arrow keys move between triggers per the primitive; the open
  panel is not hidden from assistive technology; and long answers wrap without
  overflow at the narrowest width.

- [x] **Step 8 - Compose into the landing page** - Place the three sections into
  `(marketing)/+page.svelte` in reference order: testimonials and team after the
  projection, FAQ last before the footer. *Done when:* `/` renders all nine
  sections in reference order with consistent spacing; every section uses the
  shared `CONTAINER` or `BLEED`; `pnpm check` and `pnpm build` pass; and the page
  reports `scrollWidth == clientWidth` at the narrowest width the tooling can
  reach.

## Files / areas

**Created**

- `src/lib/features/marketing/TestimonialCard.svelte`, `TestimonialsSection.svelte`
- `src/lib/features/marketing/ClinicianCard.svelte`, `ClinicalTeamSection.svelte`
- `src/lib/features/marketing/FaqSection.svelte`
- `src/lib/assets/people/` - three portraits extracted from the artboard, plus generated art for the story card

**Changed**

- `src/lib/features/marketing/content.ts` - the three fixture sets
- `src/lib/components/brand/StarRating.svelte` - the surface prop
- `src/routes/dev/design-system/BrandSection.svelte` - both star treatments
- `blueprint/reference/design-system.md` - star pairings and the `--rating` correction
- `src/routes/(marketing)/+page.svelte` - section composition

No changes anticipated to `src/lib/components/ui/` or `layout.css`. Every colour
this feature needs already exists. If a step appears to need one, stop and flag it.

## Data / contracts

No service interface. Static content fixtures, per the build plan.

| Contract | Shape | Consumed by |
| --- | --- | --- |
| `Testimonial` | `{ name, memberLabel, kgLost, quote, rating, treatmentId, verified, photo? }` | Feature 12's sweep; any later proof surface |
| `Clinician` | `{ name, role, description, portrait }` | Feature 6's learn article shows a medical reviewer |
| `FaqItem` | `{ question, answer }` | Feature 6 if the article reuses an FAQ block |
| `StarRating` `surface` | `'default' \| 'dark'` | Any later rating on a dark ground |

`treatmentId` is a domain id, not a label, so a catalogue rename cannot leave a
testimonial advertising a treatment that no longer exists.

## Testing

No unit test runner and no `test` command are declared in `AGENTS.md`, so **there
is no test gate on this feature** and none is claimed. Verification is browser
evidence plus `pnpm check` and `pnpm build`.

This feature is presentational throughout and introduces no logic worth a unit
test; the carousel's state belongs to the primitive. 4b's projection geometry
remains the project's best `/tests` candidate and is still uncovered.

**Browser evidence.** Headless Chrome from the CLI, as in 3b, 4a and 4b. It
clamps to a 500px minimum viewport, so the narrowest verifiable width is 500px,
not 375px, and it cannot drive keyboard or pointer interaction. **Two things in
this feature are therefore unverifiable that way**: carousel paging and accordion
toggling. Both need `/check` or a manual pass; do not claim either works from a
screenshot.

**Contrast is measured, not eyeballed.** Steps 2, 4 and 6 name the pairings: both
star treatments at >= 3:1 on their own grounds, the photo card's text against the
scrim's worst case, and the sand panel's roles against section 1b.

## Notes for the AI

- **Tokens and stock scales only.** No arbitrary visual values, no raw hex.
- **`Carousel` and `Accordion` are already adapted.** Compose them; do not
  restyle the primitives themselves. Control styling belongs at the call site.
- **Reference errors are not requirements.** The shared "22 kg", the repeated
  treatment, and the play control are all corrected or dropped here.
- **The photo card's contrast comes from its scrim, not its photograph**, exactly
  as the hero does. Do not rely on the image being dark.
- Svelte 5 runes only. The carousel owns its own state; do not mirror it.
- Reuse `CONTAINER` and `BLEED` from `container.ts`.
- Route components stay thin. No product logic in `+page.svelte`.
- No em dashes in any generated content, code comments or copy.
- Comment the *why*, not the *what*.
