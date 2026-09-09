# The announcement bar returns, as one line

**Type:** Fix

**Status:** verified

## The problem

The offer bar was commented out of the marketing layout on 2026-09-07, hidden rather than
deleted, and the hero took the height it left. It comes back now, but not as the thing that was
hidden: the September 2026 artboards redraw it.

Both exports already carry the new bar, so no new reference was needed:

| Reference | The bar it draws |
| --- | --- |
| `blueprint/reference/treatment-export.html` | 52px, `#0C2517`, centred, 13px bold, 1.1px tracking |
| `blueprint/reference/journal-export.html` | the same bar on the article, at 58px |
| both, narrow artboard | 64px, the same words, 10px bold, 0.55px tracking |

What changed is the shape, not just the visibility. The old bar was a countdown offer in six
fields: a title, an emphasised amount split into prefix, amount and suffix, and two more fields
for a separate narrow wording. The new one is **one line, the same words at every width**.

## The fix

- **Sanity holds one field.** `homePage.announcement` becomes `{ text }`, and the six offer
  fields go. `scripts/migrate-announcement.ts` in the Studio writes the new line to both
  documents and unsets the old fields, after writing them to `exports/announcement-before.json`.
  A price or a promotion is now one string an editor rewrites, which is the point.
- **The bar is one centred paragraph**, `h-16` then `sm:h-13`, on the tokens it already had.
  `uppercase` is applied in CSS, so an editor typing in sentence case still gets the artboard.
- **An empty line hides the bar**, as an absent announcement already did. The guard moves from
  the object to the string, because the object is now always there.
- **The countdown goes.** `CountdownTimer.svelte`, `countdown.ts` and nine message keys had no
  other caller, and neither did `AnnouncementContent`, a fixture type nothing has read since the
  copy moved to Sanity.
- **The hero gives the height back.** The three `--spacing-hero-*` tokens subtract the bar
  again, at its new 52px, and the desktop headline returns to `lg:text-5xl xl:text-6xl`, the
  step it was raised from when the bar was hidden.
- **The parked coverage comes back with it**, rewritten onto the new bar: the narrow and wide
  bar specs, the mobile-menu spec that measures the panel against the bar's visible height, the
  fold assertion that adds the bar to the hero, and the panel's own top offset. The copy is read
  out of the fixture through `ANNOUNCEMENT`, not retyped, so an editor's rewrite is not a red
  test.

## Known and accepted

The German line, `WEGOVY PILLE JETZT VERFÜGBAR · ÄRZTLICH BEGLEITET`, wraps to two centred
lines at 390px. The artboard sets its shorter English line at 10px, and the stock type scale
steps 12px to 14px with nothing between; an arbitrary `text-[10px]` would buy one line at the
cost of the rule this project keeps. Two centred lines inside the 64px bar is what the narrow
bar did before, and shortening the copy in the Studio is now an edit rather than a deploy.

## Verify

Run at `/complete` rather than during the work, at the user's request.

| Command | Result |
| --- | --- |
| `pnpm check` | 2291 files, 0 errors |
| `pnpm test` | 476 passed, 39 files |
| `pnpm build` | clean, `@sveltejs/adapter-vercel` |
| `pnpm test:browser` | 196 passed |

The browser suite caught the one thing the change broke that no source file mentions: the
mobile menu opens under the bar's *visible* height, so the tablet case had baked the old 44px
bar into its arithmetic. Scrolling 22px past a 52px bar leaves 30px, not 22px. The case now
scrolls 26px and expects 26px, which is the same "half the bar" shape as the phone case above
it.

Seen in a browser at 1440 and 390, on `/en` and `/treatments/wegovy-pill` in both languages:
the bar measures 52px then 64px, sits at the top of every marketing page, and the hero fills
what it leaves.

## Out of scope

- The bar's own copy beyond seeding the artboard line in both languages. It is Sanity's now.
- A second announcement, a link inside the bar, or a dismiss control. None is drawn.
- `e2e/ui-labels.ts`'s `announcementRegion`, which no spec reads but names a label that is live
  again.
