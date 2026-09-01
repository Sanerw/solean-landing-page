# Responsive image candidates that match their slots

**Type:** Fix
**Status:** verified

## The problem

Every marketing image except the hero downloads at a resolution far larger than
the box it lands in. Measured on the production build at 390px, DPR 3:

| Image | Downloaded | Needed | Ratio | Weight |
| --- | --- | --- | --- | --- |
| `daniel-m` (the 40px avatar in the results band) | 627px | 120px | 5.2x | 56 KB |
| `clinical-care` (bento carousel row card) | 879px | 396px | 2.2x | 54 KB |
| `support` | 879px | 396px | 2.2x | 48 KB |
| `delivery` | 879px | 396px | 2.2x | 46 KB |
| `plan` | 878px | 396px | 2.2x | 33 KB |
| `how-it-works` | 1623px | 1074px | 1.5x | 246 KB |

The landing page ships **1510 KB of images to a phone**, 262 KB of it in files
more than 1.6x wider than the slot.

**The cause is one query parameter, and its consequence is not obvious.**
`@sveltejs/enhanced-img` decides the candidate set in `get_widths()`
(`node_modules/@sveltejs/enhanced-img/src/index.js:66`):

- with `imgSizes` in the import query it emits the device ladder
  (540, 768, 1080, 1366, 1536, ...) with **`w` descriptors**
- without it, it emits `[width / 2, width]` with **`x` descriptors**, computed
  from the source file's own width

`src/lib/features/marketing/content.ts` imports twelve images as
`?enhanced&quality=90`, with no `imgSizes`. The hero, at `HeroSection.svelte:2`,
is the only one that has it.

So the twelve get an `x`-descriptor srcset derived from sources that are 1254px
to 1758px wide, and **an `x`-descriptor srcset ignores `sizes` entirely**. Every
carefully written `sizes` attribute in the components is inert: `sizes="40px"` in
`ResultsBand.svelte:125` and `ArticleHero.svelte:60`, `sizes="132px"` in
`BentoCard.svelte:127`, and the breakpoint lists in `ClinicianCard`,
`TestimonialCard`, `HowItWorks` and `ResultsBand`. They describe slots the
browser is never allowed to consider.

This is a load-weight and decode-cost defect, not a proven cause of the reported
carousel lag. That symptom was not reproduced (`/debug`, this session: 17ms
median frame, zero long tasks at 6x CPU throttle) and chasing it is dropped for
now by the user's decision.

## Which import serves which slot

The fix is per import, and some imports serve more than one slot, so the
candidate set has to cover the whole range of each.

| Import | Consumer, and the `sizes` it declares | Slot range |
| --- | --- | --- |
| `danielPortrait` | `ResultsBand` avatar, `40px` | fixed, tiny |
| `jurajGalanPortrait` | `ClinicianCard` `33vw/50vw/100vw`, and `ArticleHero` reviewer avatar `40px` | tiny to full width |
| `eliasVossPortrait`, `gredelPortrait` | `ClinicianCard`, `33vw/50vw/100vw` | fluid |
| `storyPhoto` | `TestimonialCard`, `33vw/50vw/100vw` | fluid |
| `careVisual` | `ResultsBand`, `40vw/100vw` | fluid |
| `howItWorksPanel` | `HowItWorks`, `50vw/100vw` | fluid |
| five bento panels | `BentoCard` in three variants: `row` `132px`, `feature` `100vw`, `grid` `30vw/40vw/100vw` | tiny to full width |

## The fix

Give each import a candidate set its consumers can actually choose from.

- **Fluid, single-slot images** take `imgSizes` mirroring the `sizes` their
  component already declares, which switches them to `w` descriptors and makes
  that attribute live.
- **Images with a slot under about 200 CSS px** also need an explicit `w=` list
  including a small step, because the device ladder starts at 540 and a 40px
  avatar asking for 120 device pixels would still take 540. Explicit query
  params override the plugin's `defaultDirectives`, which is the mechanism step 1
  proves before the rest depends on it.

Must not break:

- **`src/enhanced-img.d.ts`.** A wildcard module declaration matches on an exact
  suffix, so every distinct query string needs its own entry. The file says so in
  its own comment. A missed entry fails `pnpm check` while the build stays green.
- Visual fidelity. Smaller candidates must not make any image visibly soft.
  Compare against the artboards in `blueprint/reference/` at 390px and 1280px.
- The hero, which already has `imgSizes=100vw&quality=75` and a correct ladder.
- `e2e/marketing-fidelity.spec.ts`, which asserts on selected candidates and
  their density descriptors. It is expected to need updating where it encodes
  today's wrong candidate; that is a real change to review, not a test to silence.

Out of scope, recorded rather than dropped:

- **`quality=90` and the source files themselves.** The sources run about 0.75
  bytes per pixel, roughly five times a normal webp at that size, so every
  candidate is generated from bloated input. Re-encoding them is a bigger, more
  visual decision and belongs in its own fix.
- The carousel lag.

## Build steps

### Step 1 - prove the mechanism on the worst offender  - [x]

`danielPortrait` only ever fills the 40px results-band avatar, so it is the
smallest safe place to establish what the query change actually produces.

- Change its import to carry an explicit small candidate set.
- Add the matching entry to `src/enhanced-img.d.ts`.

**Done when:** the built asset list for `daniel-m-enhanced` no longer carries
627px as its smallest candidate, the browser at 390px and DPR 3 picks a candidate
no wider than 2x the 120px it needs, and `pnpm check` and `pnpm build` pass.

### Step 2 - the fluid, single-slot images  - [x]

`careVisual`, `storyPhoto`, `howItWorksPanel`, `eliasVossPortrait` and
`gredelPortrait` take `imgSizes` mirroring their component's `sizes`, with the
`.d.ts` entries to match.

**Done when:** each of the five resolves to a candidate within 1.5x of its
measured need at 390px and at 1280px, and the page's total image weight at 390px
has dropped measurably from the 1510 KB baseline.

### Step 3 - the multi-slot images  - [x]

The five bento panels and `jurajGalanPortrait` each serve a tiny slot and a wide
one, so they take `imgSizes` plus an explicit `w` list carrying a small step.

**Done when:** at 390px the four bento row cards each pick a candidate no wider
than 1.5x of 396px, the learn article's reviewer avatar picks one no wider than
2x of 120px, and the clinician card at 1280px is unchanged in sharpness.

## Verify

- `pnpm check` and `pnpm build` pass after every step.
- `pnpm test` stays green. No logic here, so no new tests: this is an asset
  pipeline change verified by measurement and by the eye.
- `pnpm test:browser` green, including `marketing-fidelity.spec.ts`, whose
  candidate assertions are reviewed rather than relaxed.
- Re-run the oversizing measurement from `/debug` against `pnpm preview` at 390px
  and DPR 3, and compare the per-image ratios and the total against the 1510 KB
  and 262 KB baseline recorded above.
- Look at the landing page and the learn article at 390px and 1280px and confirm
  no image reads as soft, against `blueprint/reference/`.
