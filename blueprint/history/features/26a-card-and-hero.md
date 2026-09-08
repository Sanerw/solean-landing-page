# Feature: 26a - The card and the hero

**From build-plan:** feature 26a
**Status:** verified

## Goal

Give the Learn article the hero the new artboards draw: one photograph under a
gradient carrying the badge, the title, the lead, the reviewer, the read time and
the article's tags, with a way back to the Journal and a way on to the next
article. Tags become a field an editor fills, the hero photograph gets a width
ladder of its own because it is now a full-bleed frame, and the Journal's
featured card is aligned to the same treatment so the two surfaces read as one
family.

The body below the hero is untouched, so the page keeps working while 26b
rebuilds it.

## Design reference

The September 2026 Pencil export, copied into the repository:

- `blueprint/reference/journal-export.html` - all four artboards, the source
- `blueprint/reference/learn-article-desktop.png` - the article at 1920
- `blueprint/reference/learn-article-mobile.png` - the article at 390
- `blueprint/reference/journal-desktop.png`, `journal-mobile.png` - the Journal

`blueprint/reference/Learn Article — !learn!blog!mounjaro-vs-wegovy.png` is the
**previous** design. Keep it: it is what the current page was built from, and
telling the two apart is the whole point of this feature.

**The export is a 1920px canvas, not code to port.** Snap its sizes to the stock
Tailwind steps and the responsive ladders in
`blueprint/reference/design-system.md` section 3. No arbitrary values.

What the hero measures in the export, for the record: the warm panel is 1896
wide inside a 12px gutter with a 30px radius, the photo card is 1752x830 inset
72px with a 28px radius, the badge is 14px bold with 1.2px tracking, the title
56/60, the lead 20/28, the metadata row 17px semibold, the tags 14px semibold in
38px pills, and the two header pills are 56px tall.

## In scope

- `tags` on the article document in Sanity, rendered in the hero and on the
  Journal card, falling back to the article's `category` when empty.
- The hero photograph served through `picture()` with the full-bleed width
  ladder the Journal card already uses, instead of one fixed 805x650 URL.
- `ArticleHero.svelte` rebuilt: photo card, scrim, badge, title, lead, reviewer,
  read time, tags, "Back to journal" and "Next article".
- The breadcrumb deleted with it, and `shortTitle` out of the query, the types,
  the mapper and the Studio, because nothing renders it any more.
- The article's neighbours, derived from the Journal's own order.
- `FeaturedArticleCard.svelte` aligned: arrow to the top-right corner, the tags
  row, the same reviewer treatment.
- Both languages, the narrow artboard, and the accessibility pass.

## Out of scope

- **The body below the hero** (26b): the contents list, the reading column, the
  restyled sections, the right-hand column's deletion and the previous/next band
  at the foot. `ArticleSidebar` and `keyTakeaways` stay standing until then.
- **The composed body** (26c): blocks, the registry, the migration, and the
  removal of `related` and the fixed section fields.
- The Journal's articles band and its category chips. One article is still the
  whole library, so the band is still not drawn.
- **The chrome the artboard redraws around the page.** The offer bar is hidden by
  a decision taken last week, and the header's navigation and its Instagram
  button were both settled during earlier reviews; `marketing-fidelity.spec.ts`
  asserts the article's header sits exactly where the landing page's does and
  carries no social control. The artboard shows all three again. None of them
  move here.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - The reference, and `tags` in the Studio** - the export and the
  four captured artboards into `blueprint/reference/` (already written to the
  working tree while this spec was drafted), and a `tags` string array on the
  article document in `../studio-solean`, with a description saying it is the
  chips a reader sees rather than the category that filters the Journal.
  *Done when:* the five reference files are in `git status`, the Studio's Article
  form shows a Tags field under Content, and `pnpm check` and `pnpm build` pass
  untouched.

- [x] **Step 2 - Tags and the hero photograph through the mapper** - `tags` added
  to `articlesQuery` and `articleQuery` and to both interfaces; `tagsOf()` in
  `journal.ts` returning the tags an article carries or `[category]` when it has
  none; `Article['hero']` becomes a `SanityPicture` built by `picture()` with
  `WIDTHS.featured`, and the Journal's own mapper reuses `tagsOf` too. Nothing
  moves on screen: the old hero reads `src` and `alt` off the new shape.
  *Done when:* `pnpm test` covers `tagsOf` (tags present, tags empty, tags absent,
  a blank string dropped), the article page still renders exactly as before, and
  the hero `img` now carries a `srcset` with five candidates.

- [x] **Step 3 - The article's neighbours** - `neighboursOf(articles, slug)` in
  `journal.ts`, and the article's `+page.server.ts` reading `articlesQuery`
  alongside the article so the two orderings cannot drift. Data only, nothing
  rendered yet.
  *Done when:* `pnpm test` covers the middle article, the first (no previous),
  the last (no next), a single-article library (neither), and an unknown slug
  (neither), and the load returns `{ previous, next }` shaped as
  `{ title, slug } | undefined`.

- [x] **Step 4 - The new hero** - `ArticleHero.svelte` rebuilt to the artboard:
  the photo card inside the warm panel, the scrim, the gold badge, the title, the
  lead, the reviewer and read time, the tags, and the two pills. The breadcrumb
  goes, and `shortTitle` leaves the query, `ArticleDetail`, `Article`, the mapper
  and the Studio schema with it. `breadcrumb_home`, `learn_breadcrumb_learn` and
  `learn_updated` go from both catalogues, because the breadcrumb and the
  "Updated <date>" line were their only callers; `learn_back_to_journal` and
  `learn_next_article` arrive in both. `marketing-fidelity.spec.ts`'s article
  assertions updated to the new hero: the breadcrumb check goes, the header
  checks stay untouched, and the narrow panel keeps its square corner at 390
  because the artboard still runs the warm panel to the viewport edge.
  *Done when:* the desktop and narrow renders match
  `learn-article-desktop.png` and `learn-article-mobile.png` above the fold in
  both languages; "Back to journal" links to the localised `/learn`; "Next
  article" is drawn only when there is a next article and links to it; and
  `pnpm test:browser` is green.

- [x] **Step 5 - The Journal's featured card** - the arrow moves to the top-right
  corner of the card, the single category chip becomes the tags row, and the
  reviewer takes the same treatment as the hero.
  *Done when:* `/learn` matches `journal-desktop.png` and `journal-mobile.png`,
  the card is still one link and one tab stop, and `journal.spec.ts` is green.

- [x] **Step 6 - The gate on the new frame** - extend
  `marketing-fidelity.spec.ts`'s density measurement to
  `/en/learn/blog/mounjaro-vs-wegovy`, so a full-bleed hero drawn above the
  pixels it carries fails the suite the way a landing-page hero already does; the
  narrow-frame check for the article page; axe still clean over white text on a
  photograph. Regenerate `e2e/fixtures/sanity-articles.json` **if** tags have been
  typed into the dataset by then; if they have not, leave it and say so, because
  the fallback is what the suite is then proving.
  *Done when:* `pnpm test`, `pnpm test:browser`, `pnpm check` and `pnpm build`
  are all green, and the density test fails when the hero's ladder is deliberately
  narrowed.

## Files / areas

| File | Why |
| --- | --- |
| `blueprint/reference/journal-export.html` + four PNGs | the visual target |
| `../studio-solean/schemaTypes/documents/article.ts` | `tags` in, `shortTitle` out |
| `src/lib/sanity/queries.ts` | `tags` into both queries, `shortTitle` out, both interfaces |
| `src/lib/features/learn/journal.ts` | `tagsOf`, `neighboursOf`, tags on `JournalArticle` |
| `src/lib/features/learn/journal.test.ts` | the two new functions |
| `src/lib/features/learn/from-sanity.ts` | hero as a picture, tags, `shortTitle` out |
| `src/lib/features/learn/from-sanity.test.ts` | the changed shape |
| `src/lib/features/learn/types.ts` | `Article.hero`, `Article.tags`, `shortTitle` out |
| `src/lib/features/learn/ArticleHero.svelte` | rebuilt |
| `src/lib/features/learn/FeaturedArticleCard.svelte` | aligned |
| `src/routes/(marketing)/learn/blog/[slug]/+page.server.ts` | the neighbours read |
| `src/routes/(marketing)/learn/blog/[slug]/+page.svelte` | passes the neighbours to the hero |
| `messages/de.json`, `messages/en.json` | two keys in, three out (see step 4) |
| `e2e/marketing-fidelity.spec.ts`, `e2e/journal.spec.ts` | the assertions the hero moves |
| `e2e/fixtures/sanity-articles.json` | regenerated with tags |

## Data / contracts

**Sanity, `article`:**

| Field | Change | Note |
| --- | --- | --- |
| `tags` | added | `array of string`, no length cap. The reader-facing chips |
| `shortTitle` | removed | its only consumer was the breadcrumb this feature deletes |
| `category` | unchanged | still the Journal's filter key and now the hero's badge |

**Frontend:**

```ts
// journal.ts
export function tagsOf(article: { tags?: string[]; category: string }): string[];
export function neighboursOf(
  articles: readonly JournalArticle[],
  slug: string
): { previous?: JournalArticle; next?: JournalArticle };
```

`Article['hero']` changes from `{ src: string | null; alt: string }` to
`SanityPicture | undefined`, the shape `picture()` returns and the Journal card
already consumes. Load-bearing: 26b and 26c both read it.

The neighbours' ordering is `articlesQuery`'s, `reviewedAt desc`, which is why
the article page reads that query rather than a slimmer one of its own. Two
queries with the same `order()` written twice is one edit away from the Journal
and the article disagreeing about what "next" means.

## Testing

`pnpm test` is the gate and this feature adds real logic to it:

| Function | Cases |
| --- | --- |
| `tagsOf` | tags present; `tags: []`; `tags` absent; a blank or whitespace tag dropped; the fallback returns exactly one chip |
| `neighboursOf` | middle; first; last; single article; unknown slug; the order matches the list, never re-sorted |

`pnpm test:browser` covers what a browser can observe:

- the hero's "Back to journal" points at the localised `/learn` in both languages
- "Next article" is absent with one article in the library
- the article page has no horizontal scroll at 390
- the density measurement now includes the article page
- axe stays clean on the hero's white-on-photograph type

**Not covered by any runner, so check it by eye against the PNGs:** the gradient
ramp, the type scale, the pill and badge geometry, and whether the photograph is
still legible under the scrim at both widths.

## Notes for the AI

- **The Studio is a separate repository.** `../studio-solean` has its own git and
  is already dirty. Its schema change is not part of this feature's commit, and
  the field only reaches the dataset once the Studio runs. Say so at review
  rather than reporting the feature as landed when half of it is next door.
- **The fixture depends on real content.** `scripts/generate-sanity-fixture.mjs`
  reads the live dataset, so tags have to be typed into the Studio before the
  regenerated fixture carries them. Until then `tagsOf`'s fallback is what keeps
  the browser suite honest, which is the reason the fallback exists rather than a
  convenience.
- **Two decisions in here deviate from the artboard.** Both are flagged for
  review rather than smuggled in:
  1. The badge carries the article's `category`, not the literal "Featured
     guide". The artboard copied the badge from the Journal card, where
     "featured" is the Journal's framing of one article among many; on the
     article itself it tells the reader nothing about what they are about to
     read.
  2. The reviewer keeps their portrait when the clinician has one, and falls
     back to the artboard's stethoscope in a circle when they do not. The
     artboard drew an icon because its mock had no photograph; we have real
     ones, from `clinician.portrait`.
- **Reuse the scrim, do not invent one.** `from-scrim/40 via-scrim/70
  to-scrim/95` is what the landing hero and the Journal card already use over a
  photograph nobody chose for its contrast.
- **Reuse the frame, do not invent one.** The Journal card's
  `min-h-96 sm:min-h-112 lg:min-h-128` ladder with an absolutely positioned
  `object-cover` image is the same frame at a different size, and it is the shape
  the density test already knows how to measure.
- **The hero image keeps a real `alt`.** The Journal card hides its photograph
  from assistive technology because the link's own name carries the meaning; the
  article's hero is the article's picture and says what it shows.
- **Guard every section**, per `project-overview.md`: an article with no tags, no
  photograph or no reviewer loses that piece of the hero and nothing else.
- **Do not transcribe the chrome.** The artboard redraws the offer bar, a
  five-item navigation and an Instagram button. All three are settled decisions
  that went the other way, and one of them has a test guarding it. Build the
  hero, leave the frame alone.
- **`plain()` the strings read as logic.** A tag will key nothing today, but a
  slug does, and preview embeds invisible markers in every string.

## What the build turned up

- **The article's photograph is too small for the frame it now fills.** The asset in the
  Content Lake is 805x650, cropped for the 805px box the hero used to be beside the text. The
  new frame is 1768 wide at 1920, so the photograph is drawn at **0.46x**: less than half the
  pixels it needs. Nothing in the code fixes this. It needs a wider upload in the Studio, and
  the artboard's own photograph is a different picture anyway.

  The step-6 measurement records it rather than hiding it: `marketing-fidelity.spec.ts` pins
  the shortfall to that one asset, so replacing the photograph turns the test red and whoever
  does it deletes the pin.

- **The density measurement was overstating every Sanity image.** It read the width from
  `?w=`, but Sanity does not upscale: `?w=1920` on an 805px asset answers with 805 pixels. The
  test now takes the smaller of the ask and the asset's own width, which is what made the
  shortfall above visible at all. Two consequences: a landing photograph turns out to sit at
  0.88x rather than passing, and the old `!entry.startsWith('hero')` exception turns out to
  have stopped matching anything the day those files moved to Sanity and took content-hashed
  names. Both are named in the test now.

- **`review.updatedAt` went with the date line.** The old hero printed "Updated <date>"; the
  artboard does not. Nothing else read it, so it left `Article` too. `reviewedAt` stays in
  Sanity: it is what orders the Journal, and now the neighbours.

- **The neighbour links are unit-covered, not browser-covered.** One article is the whole
  library, so the browser can only prove the absent case. A second fixture article would prove
  the rendered case, and would also serve 26b's previous/next band and the Journal's articles
  band, but it would contradict `journal.spec.ts`'s "one article is the state the site is in".
  That is 26b's call, not this feature's.
