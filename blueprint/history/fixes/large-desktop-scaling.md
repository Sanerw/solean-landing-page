# Large desktop scaling: the marketing site stops growing at 1280px

**Type:** Fix
**Status:** verified
**Branch:** `fix/large-desktop-scaling`

## The problem

Every marketing surface renders well below its own 1920px artboard on a large
desktop, and nothing responds above 1280px at all.

Measured in the running app at 1920 against the artboards in
`blueprint/reference/`:

| Surface | App H1 | Artboard | Ladder in code |
| --- | --- | --- | --- |
| Landing | 60px | ~96px | `xl:text-6xl`, doc says `xl:text-8xl` |
| Treatment | 48px | ~60px | stops at `lg:text-5xl` |
| Article | 48px | - | stops at `lg:` |

Supporting elements on `/treatments/[slug]` sit at roughly 0.6x the artboard:
the dose tile is 53px against 93px, the compare table row 62px against 110px,
the consultation button 44px against 58px.

Two causes:

1. **The ladders stop early.** A class tally over `marketing/`, `learn/`,
   `treatments/` and `(marketing)/` finds **zero** `2xl:` utilities, three
   `xl:`, and ~113 type declarations with no responsive step at all.
   `blueprint/reference/design-system.md:361` states the export is a fixed
   1920px canvas and a single class only describes the desktop end; the
   documented ladders in that table run to `xl:` and the code mostly does not.
2. **Two ladder inversions**, where desktop is deliberately *smaller* than
   mobile: `DoseSelector.svelte:39` (`py-4 ... md:py-3`) and `:49`
   (`text-sm ... md:text-xs`).

## The fix

A root font-size step, not a `2xl:` prefix on ~150 class strings. Every Tailwind
size is in `rem`, so one rule scales type, spacing, control heights and radii
together and preserves the proportions the artboards already encode.

Proven in the browser before speccing:

- **Tailwind v4 breakpoints do not move.** Media queries resolve `rem` against
  the initial 16px root, not the page's, so there is no feedback loop. A probe
  with the root at 26px left `lg:`/`xl:`/`2xl:` utilities and
  `(min-width: 96rem)` unchanged.
- **No horizontal overflow** at 1536, 1920 or 2560 at any step tested.

### The step is guarded on height, not just width

The constraint recorded at `+page.svelte:63` is vertical: the consultation CTA
has to sit above the fold. Width alone cannot honour it. Measured CTA bottom
against viewport height on `/treatments/mounjaro`:

| Viewport | today | 112.5% | 125% |
| --- | --- | --- | --- |
| 1536x864 | 754 ✓ | 868 ✗ | 959 ✗ |
| 1600x900 | 754 ✓ | 841 ✓ | 959 ✗ |
| 1792x900 | 754 ✓ | 841 ✓ | 929 ✗ |
| 1903x954 | 754 ✓ | 841 ✓ | 929 ✓ |
| 1920x1080 | 754 ✓ | 841 ✓ | 929 ✓ |
| 2560x1440 | 754 ✓ | 841 ✓ | 929 ✓ |

**1536x864 is what a 1920x1080 monitor reports at Windows 125% display
scaling**, which is common enough that losing the CTA there is not acceptable.
So two tiers, each gated on both dimensions:

```css
@media (min-width: 96rem)  and (min-height: 56rem) { html { font-size: 112.5% } }
@media (min-width: 112rem) and (min-height: 59rem) { html { font-size: 125% } }
```

Percentages rather than `px`, so a reader's own browser font-size preference
still multiplies through instead of being overridden.

### What it must not break

- **Nothing at or below 1440x900 may change.** That viewport matches neither
  query, so it keeps today's rendering exactly.
- **1536x864 keeps today's rendering too**, by the height guard.
- The CTA stays above the fold at every viewport that does receive a step.
- No horizontal overflow at any width up to 2560.
- The existing browser suite runs at Chromium's 1280x720 `Desktop Chrome`
  default, below both queries, so no current spec should change behaviour.
  Confirm rather than assume.

### Scope note

The rule is on `html`, so it reaches the questionnaire and legal pages as well
as the marketing surfaces. That is intended: type that shrinks when a visitor
crosses from the landing page into the funnel would read as a bug.

## Build steps

### Step 1 - the root font-size step

- [x] Built and verified.

Add the two guarded media queries to `src/routes/layout.css`, beside the
existing `@layer base` block, with a comment recording why the height guard
exists and that breakpoints resolve against the initial root size.

**Done when**
- At 1920x1080 the treatment H1 computes 60px and the landing H1 75px.
- At 1440x900 and at 1536x864 every measurement is identical to before.
- The treatment CTA's bottom is `<=` viewport height at 1600x900, 1903x954,
  1920x1080 and 2560x1440.
- `document.documentElement.scrollWidth === innerWidth` at 1536, 1920 and 2560.

### Step 2 - the two ladder inversions in DoseSelector

- [x] Built and verified. Only the padding needed a change; see the note below.

Stop desktop being smaller than mobile: restore the larger padding and price
size in the new tier rather than by deleting the `md:` steps outright. The
`md:text-xs` exists because `md:not-sr-only` reveals the `/ Monat` suffix and
four segments in a half-width column at `lg` cannot hold it at `text-sm`.

**Done when**
- The dose tile is taller at 1920 than at 1279, and the price line does not
  wrap at 1024, 1280, 1536, 1920 or 2560.
- No change at or below 1440x900.

**What measurement changed.** The price inversion needed no code. The root step
already lifts it above mobile: `text-xs` at the stepped root is 13.5px at 1600 and
15px at 1920, against mobile's 14px, and the artboard's own price is ~14px, so
`2xl:text-sm` would have overshot it. Only the padding stayed inverted, at 15px
against mobile's 16px.

**And the variant is not `2xl:`.** That keys on width alone, so it would also fire
at 1536x864 and break step 1's promise that the viewport keeps today's rendering.
`@custom-variant scaled` in layout.css carries the same width-and-height condition
as the first root step, so the two cannot drift.

### Step 3 - a regression guard

- [x] Built and verified against the dev server; see the note on the build below.

One focused Playwright spec asserting the contract at representative
viewports: the computed root font-size at 1440x900, 1536x864, 1600x900 and
1920x1080, and no horizontal overflow at 2560x1440.

**Done when** `pnpm test:browser` passes, including the new spec, and the spec
fails if either media query is removed.

### Step 4 - the projection section's heading

- [x] Built and verified.

Added on 2026-09-14, after review of the stepped landing page. Two notes from the
user about `projection.title`, which Sanity supplies and which renders as the
projection section's own heading.

**Centred.** The artboard centres that heading, its lead and the disclaimer over
the chart; only the disclaimer did. Measured on the landing artboard, the heading
sits at x=501 against a left column centred on x=500. Centred from `lg`, which is
where the two columns appear, so the stacked layout keeps the left alignment every
other band uses. The chart legend is a flex row and ignores `text-center`, so it
takes `lg:justify-center` in its own component; the branch it sits in is the
marketing one, because `compact` is the questionnaire's.

**Enlarged, against the reference.** The artboard draws this heading at roughly
40px beside the medical framing's 66px, and `SUB_HEADING` records that as
deliberate. The user asked for parity with the other sections anyway, because
beside its neighbour in the same row the quieter scale reads as a caption. So this
section alone moves to `SECTION_HEADING`. **A deliberate departure from the
artboard: do not restore it as a fidelity fix.** Set on the section rather than by
widening `SUB_HEADING`, which `BentoGrid` shares and which keeps the quiet scale.

**Done when**
- The heading computes 60px at 1920, matching the medical framing heading beside it.
- Heading, lead, legend and disclaimer are centred from 1024 up and left-aligned below.
- `BentoGrid` and the questionnaire interstitial are unchanged.

### Step 5 - the brand mark in page chrome

- [x] Built and verified.

The mark was right in one of three places. The artboards draw it about 150px wide
on a desktop; only `SiteHeader` had that step, through its own
`min-[1200px]:h-[51px]`. The footer and the questionnaire's nav sat at 30.6px.

Measured at 1920 before: header 141px, footer 85px, questionnaire 85px.

**The root step made it worse rather than causing it.** The sizes are in px, so the
mark is the only chrome that does not follow the step: in the questionnaire at 1920
the column, the heading and the Continue button each grew 25% and the logo did not.

One `chrome` size on the component now carries the ladder, so the three call sites
cannot drift. **Still px, deliberately**: the artboard's 150px is measured at 1920,
where the root has already stepped, so a rem value matching it there would overshoot
by a quarter again at 2560. A brand mark has an optical size, not a typographic one.

**Done when** header, footer and questionnaire nav all render 141px from 1280 up,
and nothing at or below 1199px changes.

### Step 6 - the questionnaire's column measure

- [x] Built and verified.

`max-w-2xl` is 42rem, which the root step turned into 840px where the artboard
draws 649px. A form has an optimal measure and 840px is past it. `scaled:max-w-xl`
steps it down to 36rem: 648px at the first tier, 720px at the second.

**Done when** the column is 672px at 1440, 648px at 1600 and 720px at 1920, against
the artboard's 649px.

### Step 7 - the landing hero's headline

- [x] Built and verified.

`xl:text-6xl` rendered 60px at 1920 against the artboard's 96px, because the ladder
stopped one step below what `design-system.md:369` documents.

**Not the documented `text-8xl`.** That table assumes a fixed 16px root, where 6rem
is the artboard's 96px; with the root step the same class renders 120px at 1920 and
overshoots by a quarter. `xl:text-7xl` lands on 90px there, which is the figure the
artboard draws. The class carries a comment saying so.

**Done when** the headline is 72px at 1280, 81px at 1600 and 90px at 1920, and the
struck phrase still sets on one line at every width.

### Step 8 - a cap on the content inset

- [x] Built and verified.

The artboards stop at 1920 and nothing above it was ever drawn, so `CONTAINER`
carried no `max-width` and a 2560 screen stretched every band to 2432px. Body copy
ran to about 155 characters a line against the 45 to 75 a reader wants.

`--container-site: 96rem` in the theme, applied as `max-w-site`. In rem, so it
follows the root step: 1536px before it and 1920px after, which is the canvas. It
therefore only bites above 1920 and changes nothing at or below it. The cap is on
the inset, not the panel, so a bleed panel's ground still runs to the viewport edge.

Measured at 2560: landing 155 to 112 characters, treatment 134 to 98. The Journal
and the legal pages were already at 96 and are unchanged; the article was already
at 64, because it is the one surface with a reading column of its own.

**Done when** no surface changes at or below 1920, and the two worst measures at
2560 come down.

## Testing

No unit tests. This adds no pure logic, so the `pnpm test` gate in
`coding-standards.md` does not apply; the evidence is browser measurement, which
step 3 makes repeatable.

## Verify

1. `pnpm dev`, open `/` and `/treatments/mounjaro`.
2. Compare against `blueprint/reference/treatment-page-desktop.png` and
   `blueprint/reference/Solean landing page.png` at 1920.
3. Resize down through 2560, 1920, 1600, 1536, 1440 and confirm the two steps
   land where the table says and that 1440 is untouched.
4. Walk the questionnaire once at 1920 to confirm the larger root size did not
   disturb the form controls.
5. `pnpm verify`, then `pnpm test:browser`.

## Completion note

**`pnpm verify` did not pass locally when this was completed, and that was a
recorded decision rather than an oversight.**

Typecheck and the 824 unit tests pass. The build does not, and the reason is not
this change: `fs.symlinkSync` answers `EPERM` on the machine it was completed on,
because pnpm links its store rather than copying it and `adapter-vercel`
reproduces those links when it writes the serverless bundle. Creating a symlink on
Windows needs `SeCreateSymbolicLinkPrivilege`, which Developer Mode grants and
which was off. Reproduced with a bare `fs.symlinkSync` outside the project.

The gate is deferred rather than skipped: `.github/workflows/verify.yml` runs the
same `pnpm verify` on `ubuntu-latest` for pull requests and pushes to `main`, and
installs with `--frozen-lockfile`, so the nft patch below applies there and the
build really is exercised.

## The build repair that came with this fix

`pnpm build` could not complete at all before this, for a second and unrelated
reason that was worth finding.

`@vercel/nft` was bundling **the whole C: drive** into the serverless function.
Instrumenting `emitAssetDirectory` printed the computed asset path:

    NFT-GLOB "C:\<WILDCARD>\<WILDCARD>" from .svelte-kit/output/server/chunks/dist.js

Every segment is nft's wildcard marker, so its evaluator resolved nothing at all
in a Sanity chunk. `assetDirPath` then came out as `C:`, the pattern as `/**/*`,
and the trace walked the drive: `C:\Windows\explorer.exe`, `C:\pagefile.sys` and
`C:\swapfile.sys` were all emitted as assets. `adapter-vercel` makes that
reachable deliberately, since it sets nft's `base` to the filesystem root so
tracing can follow pnpm's symlinks out of the project.

That single bug caused both symptoms seen earlier: the 4GB heap exhaustion was the
drive walk, and the `EBUSY` was it reaching a locked system file.

`patches/@vercel__nft@1.11.0.patch`, applied through `pnpm patch` and recorded in
`pnpm-workspace.yaml`, skips a glob anchored at the filesystem root. 1.11.0 is the
latest release, so there was no upstream fix to take instead.

Build time went from over seven minutes and a crash to **46 seconds**, on the
default heap.
