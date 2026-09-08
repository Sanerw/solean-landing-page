# Fix: the Journal band and the article hero against their artboards

**Type:** Fix
**Status:** verified

## The problem

Publishing five more articles drew the "Articles & resources" band and its filter
chips for the first time. With one article `splitJournal` left `rest` empty and
the whole band was suppressed, so this code has never been looked at on screen.
Five things are off, four of them measurable against
`blueprint/reference/journal-export.html`.

| # | Where | Now | The export |
| --- | --- | --- | --- |
| 1 | Filter chips | `h-13`, `text-base`, `px-6` | `h-[52px]`, `text-[16px]`, `p-[0_22px]` |
| 2 | Card meta line | `text-xs font-semibold text-muted-foreground`, sentence case | `text-[12.5px] font-bold tracking-[0.8px] text-[#B07E12]`, uppercase |
| 3 | Card summary | unclamped, runs to three lines | two lines |
| 4 | Hero reviewer | `size-10 sm:size-11` avatar, `text-sm lg:text-base` semibold | `text-[17px]` semibold |
| 5 | Under the article | white panel, sand gutter, second white panel | one continuous white surface |

**The chips are not wrong, they are unscaled.** We match the export to the pixel.
The export is a 1920 canvas with four categories; the site runs at 1440 with six,
so a 52px chip is proportionally a quarter larger than drawn, the row wraps to
two lines, and it squeezes "Articles & resources" into a wrapped heading the
export marks `white-space:nowrap`. This is the canvas-versus-viewport trade the
build plan already rules on: stock Tailwind steps, not transcribed canvas values.

**The gold is the real miss.** The export writes the card meta as
`TREATMENTS · 8 MIN READ` in bold, tracked, uppercase gold. We render
`Format · 6 min read` in grey sentence case, which is why the band reads flat
against the artboard.

**The seam is two panels where the artboard has one.** `+page.svelte` and
`ArticleNeighbours` each wrap themselves in `BLEED` + `sm:pt-6` + `PANEL_ROUND`,
so the body panel closes, 24px of page ground shows through, and a second panel
opens. The artboard runs white from under the hero to the footer.

## The fix

Small, presentational, and measured. Nothing about data, routing or the block
model moves.

- Chips drop to a stock step that reads correctly at 1440 and still sits right at
  1920, so six of them fit on one row beside a heading that no longer wraps.
- The card meta takes the export's treatment: uppercase, bold, tracked, gold.
  **Gold means `text-highlight-foreground`, not the export's `#B07E12`.** That hex
  measures 3.45:1 on white and fails AA; the token exists at `#906100` for exactly
  this reason, recorded in `design-system.md` section 1b and finding F-03. Using
  the export's value here would reopen a closed accessibility decision.
- The summary clamps to two lines, so the "Read article" links sit on one
  baseline across the row as the artboard draws them.
- The hero's reviewer row scales down to match its own proportion in the export.
- The neighbours band joins the body panel: no gutter, no second rounded top.

**What it must not break:** the featured card keeps its gold badge, its overlay
and its arrow; the article hero keeps its badge, title and tags; and an article
with no reviewer still draws its read time alone, which 26c's guard delivers.

## Build steps

- [x] **Step 1 - The band: chips, gold meta and a two-line summary** -
  `ArticlesBand.svelte` chips down a step; `ArticleCard.svelte` meta uppercase,
  bold, tracked and on `--highlight-foreground`, summary clamped to two lines.
  *Done when:* at 1440 all six chips sit on one row beside "Articles & resources"
  on a single line; every card's meta reads `FORMAT · 6 MIN READ` in gold; every
  summary is two lines and the "Read article" links share a baseline; contrast on
  the meta is the token's 5.16:1, not the export's 3.45:1.

- [x] **Step 2 - The hero reviewer and the seam** - the reviewer avatar and label
  scaled to the export's proportion in `ArticleHero.svelte`; the neighbours band
  merged onto the body panel's surface so the two meet.
  *Done when:* the reviewer row on `/en/learn/blog/mounjaro-vs-wegovy` matches the
  artboard's weight rather than out-sizing the read time beside it; no strip of
  page background shows between the end of the article and the previous/next
  band at 1440 or 390; `pnpm test:browser`, `pnpm check` and `pnpm build` pass.

- [x] **Step 3 - German lengths, one-line titles, the pill and the mobile rule** - four
  refinements the English-only artboard could not show. The chip row wraps to a
  line of its own instead of squeezing the heading, so both languages fit; card
  titles clamp to one line from `lg`; the pill names its section; and stacked
  cards get the hairline the mobile artboard draws between them.
  *Done when:* German and English both draw their chips on a single row with the
  heading on one line; every card title is one line at 1440 and two at 390, as
  the two artboards draw them; the pill reads "Latest from Learn" and "Neu im
  Journal"; a rule separates stacked cards at 390 and no rule appears once the
  grid has columns.

## Verify

Against the running dev server, which reads the real dataset and now has six
articles:

- `/en/learn` at 1440 — chips on one row, heading on one line, three cards across
  with gold meta lines and two-line summaries.
- `/en/learn/blog/mounjaro-vs-wegovy` — the reviewer row sits quietly beside the
  read time; scrolling to the foot shows white running unbroken into the
  previous/next band.
- 390 — the chips still scroll horizontally rather than wrapping, and the seam is
  closed there too.
- Compare both against `blueprint/reference/journal-desktop.png` and
  `learn-article-desktop.png`.

## Notes for the AI

- **Stock scales only.** The export's pixel values are the target proportion, not
  values to transcribe. `h-11`, `text-sm`, `px-5` and friends, per the build
  plan's design rules.
- **The gold is a token, and the token is deliberately not the export's.** Do not
  reintroduce `#B07E12`.
- The e2e fixture serves one article, so the band never renders in the browser
  suite. Its coverage is the existing article and viewport specs; the band itself
  is checked by eye against the artboards and the dev server.
- A dev server is already running on port 5199 against the live dataset.
