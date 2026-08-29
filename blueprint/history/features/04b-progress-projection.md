# Feature: Progress projection

**From build-plan:** feature 4b
**Status:** verified

## Goal

The projection section: a custom responsive SVG chart showing modelled weight
change over three horizons, driven by the adapted `Tabs`, beside the panel that
reframes weight loss as medical rather than motivational. This closes out
feature 4 and is the last section of the landing page before the social proof
that feature 5 adds.

It is also the first genuinely interactive, logic-bearing thing in the marketing
feature. Everything built so far has been static content; this has state, derived
geometry, and a non-visual alternative to get right.

## Design reference

- `blueprint/reference/Solean landing page.png`, approximately y2950-3700:
  - **Left column**: heading and sub, a two-item legend, the plot, x-axis labels,
    the three-horizon `Tabs`, and a disclaimer line.
  - **Right column**: the "Weight loss isn't a motivational issue" heading, body
    copy, three factor chips (Stress, Hormones, Genetics) and two CTAs.
- `blueprint/reference/design-system.md` - section 5 explicitly exempts SVG
  geometry, `viewBox`, path data and data-driven positions from the
  arbitrary-value ban. That exemption is what makes this chart buildable without
  violating the token rules; it does **not** extend to the chart's colours,
  typography or spacing, which stay on tokens and stock scales.

### What the chart actually does

The reference draws the 6-month state. Reading it against the three tabs, the
horizon drives four things at once:

| Element | Behaviour |
| --- | --- |
| Solid line | Runs from Now to the selected horizon |
| Dotted line | Continues from the horizon to the end of the modelled range |
| Area fill | Fills under the solid segment only, stopping at the horizon |
| Emphasised value | The horizon's own pill inverts to the dark ground; the others stay light |

The comparison "Lifestyle alone" line is drawn across the full range regardless
of horizon.

### Measured from the artboard

| Element | Reference value | Token |
| --- | --- | --- |
| Solid line | `#173824` | `--foreground`, exact |
| Light value pill | `#F3ECDD` | `--surface-warm`, exact |
| Emphasised value pill | `#173824` | `--foreground`, exact, with the 3a on-dark text contract |
| Area fill | `#F8F1E1` | `--highlight` at roughly half opacity |
| Comparison line | `#9AA79E` | **Do not use, see below** |

### The comparison line fails contrast

`#9AA79E` measures **2.40:1** against the page ground. A line that carries data
meaning is a meaningful graphical object and needs **3:1**, so the reference
value is not usable. This is the same value and the same mistake as finding F-01,
where `--text-faint` was corrected from `#9AA79E` to `#647168`; the artboard
simply kept the uncorrected tone here.

Use `--text-faint` `#647168`, which measures **4.90:1**. Reference errors are not
requirements, and this one is already documented.

### Reference error: a competitor's name

The body copy reads "Juniper evens the playing field." `project-plan.md` section
9 rules that competitor names become Solean. The line becomes "Solean evens the
playing field."

## In scope

- Typed projection fixtures: the modelled series, the comparison series, the
  three horizons, and the copy for the right-hand panel
- A pure geometry module turning data plus a horizon into SVG coordinates
- The responsive SVG chart: gridlines, area fill, solid and dotted segments,
  comparison line, markers
- Value pills and axis labels, positioned from the same derived geometry
- The three-horizon switcher on the adapted `Tabs` from 3a
- A non-visual alternative to the chart for assistive technology
- The disclaimer line beneath the chart
- The medical-framing panel: heading, corrected body copy, three factor chips,
  and the two CTAs
- Composition into `/` beneath the how-it-works section

## Out of scope

- The questionnaire's own projection interstitial (feature 8). It shows a similar
  chart with a highlighted "At 6 months" callout; that callout is on the
  questionnaire artboard, not this one, and is not built here
- Testimonials, the clinician team and the FAQ, which are feature 5 and sit
  between how-it-works and this section in the finished page
- Any charting library. The design-system ruling is a custom responsive SVG
  unless that proves insufficient; if it does, stop and flag rather than
  installing one
- Any new shadcn primitive, and no change to an existing primitive's styling
- Animating the line on scroll or on horizon change
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

- [x] **Step 1 - Projection fixtures** - Add the modelled series (96, 88, 82, 78
  kg at Now, 3, 6 and 12 months), the comparison series, the three horizons, the
  chart heading, sub, legend labels, axis labels and disclaimer, plus the
  right-hand panel's heading, body, three factors and CTA labels. *Done when:*
  the module type-checks; every value the chart draws comes from this fixture and
  not from a component; the body copy reads "Solean evens the playing field", not
  the competitor name; and the horizon list and the series share one definition
  so a horizon cannot reference a month with no data point.

- [x] **Step 2 - Chart geometry, pure functions** - A module that turns the
  series plus a selected horizon into everything the SVG needs: point coordinates
  in the viewBox, the solid path, the dotted path, the area path, the comparison
  path, and which point is emphasised. No Svelte, no DOM, no rendering. *Done
  when:* the functions are pure and total; a horizon of the first or last point
  produces a valid path rather than an empty or malformed one; the split between
  solid and dotted always meets exactly at the horizon point with no gap or
  overlap; and coordinates are derived from the data range rather than hardcoded.

- [x] **Step 3 - The SVG plot** - Render gridlines, area fill, comparison line,
  solid line and dotted continuation from step 2's output, in a `viewBox` with
  `preserveAspectRatio` so the plot scales with its container. Line colours,
  widths and the fill use tokens; only the geometry is numeric. *Done when:* the
  plot scales cleanly between narrow and desktop with no clipped stroke or
  distorted aspect; the comparison line uses `--text-faint` and measures >= 3:1
  against the page ground; the solid and dotted segments are visually continuous;
  and the SVG itself is hidden from assistive technology, since step 6 supplies
  the real alternative.

- [x] **Step 4 - Markers, value pills and axis labels** - The four point markers,
  the value pills (light by default, the emphasised one on the dark ground with
  the 3a on-dark treatment), and the four x-axis labels. Pills are positioned
  from step 2's coordinates as percentages, which section 5 sanctions as
  data-driven rather than transcribed. *Done when:* every pill sits on its marker
  at all three widths without overlapping a neighbour or leaving the plot;
  emphasised and default pills each measure >= 4.5:1 for their text; and the
  labels stay legible at the narrowest width rather than colliding.

- [x] **Step 5 - Horizon switcher** - Wire the three horizons to the adapted
  `Tabs`, with 6 months selected initially to match the reference. Changing the
  horizon re-derives the chart through step 2 alone; no chart state is duplicated
  outside the selected horizon. *Done when:* all three horizons render a correct
  chart; the solid segment, dotted segment, area and emphasised pill all move
  together; Left and Right Arrow move between tabs with visible focus; and the
  selected tab and its panel are semantically associated by the primitive.

- [x] **Step 6 - Non-visual alternative** - A visually hidden `table` giving the
  modelled and comparison weights at each month, updating with the horizon so it
  never contradicts the picture, plus an accessible name and short description
  for the chart region. *Done when:* the chart's data is fully available to a
  screen reader without sight of the SVG; the table is a real `table` with header
  cells, not a list of sentences; it reflects the selected horizon; and the
  decorative SVG is not announced separately.

- [x] **Step 7 - Medical-framing panel** - The right column: heading, corrected
  body copy, the three factor chips with Lucide icons, and the two CTAs
  (`ROUTES.questionnaire` and the inert treatments link, matching how the hero
  treats them). *Done when:* the panel renders beside the chart at desktop and
  below it at narrow widths; the factor chips' icons are decorative with the
  label carrying meaning; both CTAs are keyboard reachable with visible focus;
  and no competitor name appears anywhere in the rendered output.

- [x] **Step 8 - Compose into the landing page** - Place the section into
  `(marketing)/+page.svelte` beneath how-it-works, inside the existing page
  rhythm. *Done when:* `/` renders hero, trust row, bento, results band,
  how-it-works and projection in order with consistent spacing; the section uses
  the shared `CONTAINER` or `BLEED`; `pnpm check` and `pnpm build` pass; and the
  page reports `scrollWidth == clientWidth` at the narrowest width the tooling
  can reach.

## Files / areas

**Created**

- `src/lib/features/marketing/projection.ts` - geometry, pure functions
- `src/lib/features/marketing/ProjectionChart.svelte`
- `src/lib/features/marketing/ProjectionSection.svelte`
- `src/lib/features/marketing/MedicalFraming.svelte`

**Changed**

- `src/lib/features/marketing/content.ts` - projection and panel fixtures
- `src/routes/(marketing)/+page.svelte` - section composition

No changes anticipated to `src/lib/components/ui/`, `layout.css` or
`design-system.md`. Every colour this section needs already exists. If a step
appears to need a primitive or token change, stop and flag it.

## Data / contracts

**Load-bearing.** Feature 8 builds the questionnaire's projection interstitial,
which draws the same kind of chart from the patient's own answers. The types and
the geometry module are designed for that second caller even though only
marketing calls them now:

| Contract | Shape | Consumed by |
| --- | --- | --- |
| `ProjectionPoint` | `{ month: number; kg: number }` | Feature 8's interstitial |
| `ProjectionHorizon` | `{ months: number; label: string }` | Feature 8 |
| Geometry module | `(series, comparison, horizon) => paths + points` | Feature 8 |

`ProjectionChart` stays free of marketing-specific copy and layout so feature 8
can lift it into a shared location without a rewrite. **Do not pre-emptively move
it there now**: one caller exists, and the build plan forbids building an
abstraction before something calls it. The move is feature 8's job.

## Testing

No unit test runner and no `test` command are declared in `AGENTS.md`, so **there
is no test gate on this feature** and none is claimed. Verification is browser
evidence plus `pnpm check` and `pnpm build`.

**This is the strongest candidate for `/tests` the project has had so far.**
Step 2's geometry module is exactly what `coding-standards.md` puts *in* scope:
pure functions, assertable inputs and outputs, real edge cases (a horizon at the
first or last point, a single-point series, a horizon with no matching data
point). Everything else in this feature is presentational and stays out of scope.

The build plan puts the testing decision before feature 9, so this is a
legitimate place to make it early. If you run `/tests` before this feature
starts, step 2 ships with focused tests in the same diff. Otherwise the geometry
is verified by browser evidence across all three horizons, which is weaker: it
proves the three cases we look at, not the edges. Say which you want at review.

**Browser evidence.** Headless Chrome from the CLI, as in 3b and 4a. It clamps to
a 500px minimum viewport, so the narrowest verifiable width is 500px, not 375px,
and it cannot drive keyboard interaction. Tab switching therefore needs either a
manual pass or `/check`.

**Contrast is measured, not eyeballed.** Steps 3 and 4 name the pairings: the
comparison line at >= 3:1 as a graphical object, and both pill treatments at
>= 4.5:1 for text.

**Measured result.** Comparison line 4.90, solid line 12.36, emphasised pill
12.36, default pill 10.97, axis labels 7.41, disclaimer 5.88, all passing. The
gold point marker reads 1.82 against the page, under the 3:1 floor; it is
decorative rather than meaningful (every value is stated by its own pill and
again in the table, and the marker sits on a 12.36:1 line where gold measures
6.78), and the reasoning is recorded at the call site rather than left implicit.

## Notes for the AI

- **The SVG exemption is narrow.** `viewBox`, path data, point coordinates and
  percentage positions derived from data are exempt. Colours, stroke tokens, type
  sizes, radii and spacing are not: those stay on semantic tokens and stock
  Tailwind scales exactly as everywhere else.
- **No charting library.** The ruling is a custom responsive SVG. If it genuinely
  proves insufficient, stop and flag rather than installing one.
- **Reference errors are not requirements.** The comparison line's `#9AA79E` and
  the competitor name in the body copy are both documented errors. Neither is
  transcribed.
- **Keep the geometry pure.** Step 2 has no Svelte imports. That is what makes it
  testable later and reusable by feature 8.
- Svelte 5 runes only. The selected horizon is the single piece of state; derive
  everything else with `$derived` rather than mirroring it into more `$state`.
- Reuse `CONTAINER` and `BLEED` from `container.ts`; do not invent a third gutter.
- Route components stay thin. No product logic in `+page.svelte`.
- No em dashes in any generated content, code comments or copy.
- Comment the *why*, not the *what*, matching the density already set by
  `src/lib/features/marketing/`.
