# Feature: 26c - A body an editor composes

**From build-plan:** feature 26c
**Status:** verified

## Goal

Turn the article's eight fixed section fields into one ordered `body` of blocks,
keyed by `_type` through a registry that fails visibly on a block it cannot draw.

Not every article compares two treatments, and a document that models one
article's shape as its fields cannot carry a second. Today the only way to
publish a piece without a comparison table is to leave `treatmentProfiles` empty
and hope the guard holds; the only way to add a second table is a deploy. After
this feature an editor composes: prose, callout, table, cards, checklist,
accordion and sources, in whatever order and however many times the article
needs.

**The page does not change visually. The model is the feature, and the proof is
the page looking the same after it.**

## Design reference

No new artboards. 26b built the look; this feature changes who supplies the
content behind it.

- `blueprint/reference/learn-article-desktop.png` - the article at 1920
- `blueprint/reference/learn-article-mobile.png` - the article at 390

These are the parity target, not a new target: step 6 compares before and after
captures against each other, and against these.

## In scope

- **Studio:** seven block objects and one `body` array on `article`. The old
  section fields, `related`, and the orphan data left on the documents all go in
  the cleanup step.
- **Migration:** the existing article rewritten as blocks in German and English,
  by a script in `../studio-solean/scripts/`, following `seed.ts`.
- **App:** the typed `ArticleBlock` union, the mapper from Sanity's `body[]`, the
  anchor and contents-list derivation, the `_type` registry, and `ArticleBody`
  replacing `ArticleContent`.
- **The section components stay as 26b left them**, with one exception recorded
  below (`ArticleProse` gains an optional heading).
- The twenty-three message keys that become editor copy leave both catalogues.
- The e2e fixture regenerated from the migrated dataset, and the generator
  repaired so regenerating it does not delete the legal pages.
- Both languages, the narrow frame, axe, and the visual parity check.

## Out of scope

- **Portable Text.** Prose stays an array of paragraphs, which is what the
  document holds today and what `ArticleProse` already takes. Rich inline marks
  would change the rendered typography, and this feature's acceptance rule is
  that nothing changes visually. Recorded as the first thing to revisit when an
  editor asks for a link inside a sentence.
- **A second article.** Composing one is the point; publishing one is editorial
  work, not this feature. The e2e fixture stays a library of one, so the
  neighbours band keeps riding on `neighboursOf`'s unit tests.
- **Images inside the body.** No artboard draws one, and a block nothing has
  asked for is the trap this feature exists to remove.
- **A scroll-spy on the contents list.** Deferred at 26b for the same reason and
  not reopened here.
- **The hero, the Journal, the neighbours band.** 26a and 26b own them and this
  feature does not touch them.
- **SEO overrides.** `project-overview.md` lists them among the fields leaving
  the schema. That is wrong and the build plan does not say it: `+page.svelte`
  reads `seoTitle` and `seoDescription` in `<svelte:head>`, so they are rendered
  fields and they stay. The overview line is corrected at `/complete`.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

The order is deliberate and each step leaves a working page. The schema and the
data arrive before anything reads them, the switch happens once, and the old
fields are removed only after nothing reads them. This is the 24d rule applied
to a smaller flip: the part that cannot land in halves is step 4, and it is the
only step that changes what a visitor gets.

- [x] **Step 1 - The block objects and the `body` field** - seven object types in
  `../studio-solean/schemaTypes/objects/`, plus `body` on `article` holding them.
  Additive only: every existing field stays, and the app is untouched.
  Each block carries `heading` (required except on prose) and an optional
  `shortLabel`. `articleAccordion` reuses `faqItem` and `articleSourceList`
  reuses `articleSource`.
  *Done when:* `pnpm build` in `../studio-solean` passes; the Studio opens the
  article and offers an empty **Body** array with all seven block types in its
  insert menu; each has a preview that names itself in the array; the old fields
  are all still there and still filled.

- [x] **Step 2 - The migration, and the fixture that has to follow it** -
  `../studio-solean/scripts/migrate-article-body.ts`, run the way `seed.ts` is
  run, writing `body[]` onto both language documents from their own section
  fields. It reads the section headings, the contents labels and the table's row
  labels out of `messages/de.json` and `messages/en.json`, exactly as `seed.ts`
  reads the catalogues, so the migrated copy is character for character what the
  page renders today. It unsets nothing: the old fields stay until step 5.

  **The e2e fixture is regenerated at the end of step 3, not at the end of the feature.**
  It cannot be regenerated in this step: `generate-sanity-fixture.mjs` reads the projection out
  of `articleQuery`, which does not ask for `body` until step 3. What belongs here is the
  generator repair; the run itself follows the query. Step 4 switches the
  app onto `body`, and the browser suite reads
  `e2e/fixtures/sanity-articles.json`; a fixture without `body` would render
  every spec an empty article. Regenerating is safe now and impossible later
  without this step's data. **`scripts/generate-sanity-fixture.mjs` writes no
  `legalPages` key**, so running it today silently deletes the four policy
  documents from the fixture and breaks `legal-pages.spec.ts`. Repair the
  generator before running it.
  *Done when:* `defined(body)` is true for both documents with eight blocks each,
  in the page's current order; the German and English bodies carry their own
  language's headings; re-running the script leaves both `_rev`s unchanged; the
  regenerated fixture carries `body` for both languages **and still carries
  `legalPages`**; `pnpm test:browser` is green, because nothing reads `body` yet
  and the page still renders from the old fields.

- [x] **Step 3 - The typed body, the mapper and the anchors** - `body[]` added to
  `articleQuery` and `ArticleDetail` in the shape `legalPageQuery` uses, the
  `ArticleBlock` union in `types.ts`, `blocks.ts` holding `toBlocks()`,
  `anchorFor()` and `tocFrom()`, all unit tested. Nothing renders it yet, so the
  page is unchanged.
  *Done when:* `pnpm test` covers the seven mappings, the unknown `_type`, the
  anchor derivation including a German heading with umlauts and two blocks
  sharing a heading, the `shortLabel` fallback, and a prose block with no
  heading; `pnpm check` is clean; the page still renders through
  `ArticleContent` and looks identical.

  **Capture the before here.** Full-page screenshots at 1440 and 390, German and
  English, into the scratchpad. Step 6 compares against them, and after step 4
  they cannot be taken any more.

- [x] **Step 4 - The registry and the switch** - `block-registry.ts` keyed by our
  own block kind, `ArticleBody.svelte` composing the registry over the blocks,
  `+page.svelte` rendering it, `ArticleContent.svelte` deleted, `ArticleToc` fed
  from `tocFrom` and drawing nothing when there are no entries, and the review
  note moved out of the sources section onto the page, where the document-level
  data it prints belongs. `ArticleProse` gains an optional heading.
  **This is the step that cannot land in halves.**

  **The browser suite breaks here, not at step 5**, because the anchors change
  with it: `#faqs` becomes the derived anchor, and `journal.spec.ts` and
  `marketing-fidelity.spec.ts` move onto the new ones in this diff.
  *Done when:* the article at 1440 and 390 is indistinguishable from step 3's
  captures in both languages; every contents link still resolves to a section on
  the page; the trailing contents labels are still `['FAQs', 'Sources']`; the FAQ
  still opens one question at a time; an article whose `body` is empty renders
  the hero and no contents list rather than an empty `nav`; and an unmapped
  `_type` draws a visible marker in development and preview and logs once and
  draws nothing in production, shown by feeding `ArticleBody` a fabricated block
  locally, never by writing one into the Content Lake.

- [x] **Step 5 - The old model out** - the eight section fields,
  `treatmentProfiles` and `related` out of `article.ts`, `articleQuery`,
  `ArticleDetail`, `Article`, `from-sanity.ts` and its tests;
  `treatmentProfile.ts` deleted from the Studio; a second script pass unsetting
  the retired fields on both documents, including the `keyTakeaways` and
  `shortTitle` data 26b and an earlier feature left orphaned there; the
  twenty-three message keys out of both catalogues; the fixture regenerated once
  more so it stops carrying fields the query no longer asks for.
  *Done when:* `grep` finds no `treatmentProfile`, `quickAnswer`, `howTheyWork`,
  `expectedResults`, `sideEffects`, `sourcesSummary`, `keyTakeaways` or
  `related` in `src/` or in the Studio schema; the twenty-three keys are gone
  from both catalogues and `pnpm build` reports no missing message; the Studio
  shows the article as title, tags, hero, evidence, SEO and one Body; the
  regenerated fixture still carries `legalPages`; the whole browser suite is
  green.

- [x] **Step 6 - Both languages, the frame and the gate** - the German and English
  articles compared against step 3's captures and against the artboards, the
  narrow frame, axe, and the full suite.
  *Done when:* `pnpm test`, `pnpm check`, `pnpm build` and `pnpm test:browser` are
  green; no horizontal scroll at 390 in either language; axe reports no serious
  violation on the article, including no duplicate `id`; and the before and after
  captures at 1440 and 390 in both languages are placed side by side and read as
  the same page.

## Files / areas

| File | Why |
| --- | --- |
| `../studio-solean/schemaTypes/objects/articleProse.ts` and six siblings | new: one object per block type |
| `../studio-solean/schemaTypes/documents/article.ts` | `body` in, the eight section fields and `related` out |
| `../studio-solean/schemaTypes/objects/treatmentProfile.ts` | deleted |
| `../studio-solean/schemaTypes/index.ts` | the seven registered, `treatmentProfile` removed |
| `../studio-solean/scripts/migrate-article-body.ts` | new: writes the blocks, then unsets the old fields |
| `src/lib/sanity/queries.ts` | `body[]` in, the section fields and `related` out, of both the query and `ArticleDetail` |
| `src/lib/features/learn/types.ts` | the `ArticleBlock` union in; `ArticleSectionId` and `ArticleTreatmentProfile` out |
| `src/lib/features/learn/blocks.ts` + `.test.ts` | new: `toBlocks`, `anchorFor`, `tocFrom` |
| `src/lib/features/learn/block-registry.ts` + `.test.ts` | new: `_type` to component, and the reason it cannot draw one |
| `src/lib/features/learn/ArticleBody.svelte` | new: the composer, replacing `ArticleContent.svelte` |
| `src/lib/features/learn/ArticleToc.svelte` | draws nothing when the body has no headed block |
| `src/lib/features/learn/UnsupportedBlock.svelte` | new: the visible failure |
| `src/lib/features/learn/ArticleContent.svelte` | deleted |
| `src/lib/features/learn/sections/ArticleProse.svelte` | optional heading |
| `src/lib/features/learn/ArticleSources.svelte` | keeps the summary and the list; the review note moves to the page |
| `src/lib/features/learn/from-sanity.ts` + `.test.ts` | `articleToc` and the profile mapping out, `body` in |
| `src/routes/(marketing)/learn/blog/[slug]/+page.svelte` | renders `ArticleBody` and the review note |
| `messages/de.json`, `messages/en.json` | twenty-three keys out |
| `scripts/generate-sanity-fixture.mjs` | keeps `legalPages`, and picks up `body`. Repaired at step 2 |
| `e2e/fixtures/sanity-articles.json` | regenerated at step 2, again at step 5 |
| `e2e/journal.spec.ts`, `e2e/marketing-fidelity.spec.ts` | the `#faqs` selector follows the new anchors, at step 4 |

## Data / contracts

### Sanity, `article`

**In:** `body[]`, an ordered array of the seven block objects.

**Out:** `quickAnswer`, `treatmentProfiles`, `howTheyWork`, `expectedResults`,
`sideEffects`, `faqs`, `sourcesSummary`, `sources`, `related`. The
`treatmentProfile` object type goes with them.

**Unchanged:** `language`, `title`, `slug`, `category`, `tags`, `summary`,
`hero`, `reviewer`, `reviewedAt`, `nextReviewAt`, `readTimeMinutes`, `seoTitle`,
`seoDescription`.

**Orphan data to unset in step 5:** `keyTakeaways` (26b removed the field, not the
data) and `shortTitle` (no schema field, no query, still on both documents).

### The block objects

Named `article*` to sit clear of the shared `faqItem`, and the sources block is
`articleSourceList` rather than `articleSources`, one letter from the existing
`articleSource` item type.

| `_type` | Fields | Draws |
| --- | --- | --- |
| `articleProse` | `heading?`, `shortLabel?`, `paragraphs[]` | `ArticleProse` |
| `articleCallout` | `heading`, `shortLabel?`, `paragraphs[]` | `ArticleCallout` |
| `articleTable` | `heading`, `shortLabel?`, `caption?`, `columns[]`, `rows[]{label, cells[]}` | `ComparisonTable` |
| `articleCards` | `heading`, `shortLabel?`, `cards[]{name, eyebrow, body}` | `MakerCards` |
| `articleChecklist` | `heading`, `shortLabel?`, `intro?`, `items[]` | `ArticleChecklist` |
| `articleAccordion` | `heading`, `shortLabel?`, `items[]` of `faqItem` | `ArticleFaq` |
| `articleSourceList` | `heading`, `shortLabel?`, `summary`, `sources[]` of `articleSource` | `ArticleSources` |

`heading` is required on all but `articleProse`, where an absent heading means a
paragraph that continues the section above it: no `<h2>`, no anchor, no contents
entry. That is the "blocks that carry a heading" the build plan names, and it is
why `ArticleProse` is the one 26b component this feature touches.

`rows[].cells` must be as long as `columns`. The Studio validates it; the mapper
pads rather than throwing, because a half-typed table in a draft should preview,
not 500.

### `ArticleBlock`, the app's union

```ts
interface BlockHead {
  /** The anchor, derived from the heading. Absent on a headingless prose block. */
  id?: string;
  heading?: string;
  /** What the contents list prints: `shortLabel ?? heading`. */
  label?: string;
}

type ArticleBlock =
  | ({ kind: 'prose' }     & BlockHead & { paragraphs: readonly string[] })
  | ({ kind: 'callout' }   & BlockHead & { paragraphs: readonly string[] })
  | ({ kind: 'table' }     & BlockHead & { caption: string; columns: readonly string[];
                                          rows: readonly { label: string; cells: readonly string[] }[] })
  | ({ kind: 'cards' }     & BlockHead & { cards: readonly { name: string; eyebrow: string; body: string }[] })
  | ({ kind: 'checklist' } & BlockHead & { intro?: string; items: readonly string[] })
  | ({ kind: 'accordion' } & BlockHead & { items: readonly { question: string; answer: string }[] })
  | ({ kind: 'sources' }   & BlockHead & { summary: string; sources: readonly ArticleSource[] })
  | { kind: 'unsupported'; type: string; reason: string };
```

`Article` keeps `slug`, `category`, `title`, `summary`, `tags`, `hero` and
`review`, gains `body: readonly ArticleBlock[]`, and loses `toc`, `quickAnswer`,
`comparison`, `howTheyWork`, `expectedResults`, `sideEffects`, `manufacturers`,
`faqs`, `sources` and `sourcesSummary`. `toc` becomes `tocFrom(article.body)`
rather than a stored field, which is what it already was in spirit.

### Anchors and the contents list

`anchorFor(heading)` runs `plain()` first, then lowercases, folds diacritics
through `normalize('NFKD')` and a combining-marks strip, replaces every run of
non-alphanumerics with a single hyphen, and trims. `toBlocks` dedupes with a
`-2`, `-3` suffix and falls back to `block-${_key}` when a heading slugifies to
nothing.

**The `plain()` is not decoration.** The heading is rendered as prose and used as
logic, and preview fills every string with invisible markers, so the anchor is
built from the stripped copy while the `<h2>` keeps the original and its
click-to-edit. This is the rule `tagsOf` already follows in `journal.ts`, for the
same reason.

Anchors therefore differ between the German and English documents, which is
correct: they are two documents and two sets of headings. They also change for
the existing article, `#at-a-glance` becoming `#mounjaro-vs-wegovy-at-a-glance`
and the German page getting German anchors for the first time. Nothing links to
them but the contents list on the same page, verified by grep, so no redirect is
owed.

**`shortLabel` is what keeps the contents list identical.** Today the list and
the heading are different strings for four of the eight sections, and the gap is
not accidental: "Sources" against "Sources and medical review", "FAQs" against
"Frequently asked questions", "At a glance" against "Mounjaro vs Wegovy at a
glance". A 220px column needs the short one. Deriving the label from the heading
alone would change what a reader sees, and this feature's whole claim is that
nothing does. The migration fills `shortLabel` from today's `learn_toc_*`
messages.

### The twenty-three keys that leave

Six section headings (`learn_h_quick`, `_glance`, `_how`, `_results`,
`_side_effects`, `_manufacturers`), two more that were headings by another name
(`learn_faq_heading`, `learn_sources_heading`), the eight contents labels
(`learn_toc_quick` through `learn_toc_sources`), the five table row labels
(`learn_row_*`), the table caption (`learn_table_comparison`) and the maker
eyebrow (`learn_manufacturer_label`). All of them become copy an editor types
per language, which is the feature.

**Staying, because they are chrome rather than content:** `learn_toc_heading`
("On this page"), `learn_table_attribute` (the blank corner's screen-reader
label), `learn_reviewed_title` and `learn_reviewed_body` (the review note, which
prints document data), `learn_read_time`, the four neighbour and back-link
labels, and the four `learn_error_*` keys.

### `_type` is read as logic

`plain()` before the registry lookup, per the rule in `project-overview.md`.
`@sanity/client` is understood not to encode system keys, but this codebase has
already lost a page's photographs to exactly this assumption, and the guard is
one call.

### Load-bearing for later work

The block registry and `ArticleBlock` are the contract a second article, and any
future block type, is written against. A new block is one Studio object, one
union member, one line in the registry, and one component.

## Testing

`pnpm test` is the gate and this feature is squarely in scope for it: `blocks.ts`
is a mapper with real edge cases, not a component.

**In scope, one test per case, shipped with the step that adds the logic:**

| Function | Cases |
| --- | --- |
| `toBlocks` | each of the seven `_type`s to its `kind`; an unknown `_type` to `unsupported` with a reason naming it; a `_type` carrying preview markers still resolving; an absent `body` to an empty array; a table row shorter than its columns padded, not thrown; a prose block with no heading getting no `id` and no `label` |
| `anchorFor` | a plain heading; a German heading with umlauts; punctuation and a question mark; a heading that slugifies to nothing |
| `tocFrom` | skips headingless blocks; prefers `shortLabel` over `heading`; dedupes two blocks with the same heading into distinct anchors matching their sections |
| `blockRegistry` | every `kind` resolves a component; `unsupported` resolves none and carries its reason |

`articleToc`'s four existing tests in `from-sanity.test.ts` are replaced by
`tocFrom`'s, and `toArticle`'s two profile tests go with `treatmentProfiles`.

**`pnpm test:browser` carries the behaviour**, all of it already written and
expected to keep passing with only the selectors updated:

- every contents link resolves to a section on the page (`journal.spec.ts`)
- the FAQ starts closed and opens one at a time. The `#faqs` selector becomes the
  derived anchor, so the spec scopes by the FAQ heading's section instead
- the contents list sits beside the reading column, and not at all at 390
- the sources close the article under the FAQ (`marketing-fidelity.spec.ts`)
- the comparison table's blank corner keeps its screen-reader label
- the trailing contents labels are still `['FAQs', 'Sources']`, which is the
  assertion that catches a `shortLabel` regression
- no horizontal scroll at 390 in both languages; axe clean

**Not covered by any runner, and the feature's own acceptance rule:** the page
looking the same. Capture full-page screenshots at 1440 and 390 in German and
English at the **end of step 3**, capture them again at step 6, and compare. This
is a one-shot manual comparison on purpose: a screenshot baseline regime is
infrastructure this repo does not have and this feature does not need. Taking
the before at step 3 rather than "before step 4" is not pedantry: once step 4
lands, the old rendering is gone and the comparison cannot be reconstructed.

**The fixture is stale, and step 2 is where that stops mattering.** It still
carries `keyTakeaways`, which left the query in 26b, and carries no `tags`, which
joined it in 26a. The live documents carry no `tags` either, so regenerating
changes no chip. What it will carry from step 2 is `body`, which is what step 4
needs to exist before it can switch.

## Notes for the AI

- **Two repositories.** The Studio is `../studio-solean`, standalone, with its own
  `package.json` and its own prettier settings (no semicolons, single quotes, no
  bracket spacing, 100 columns). Match the files already there.
- **The migration runs by hand**, `npx sanity exec scripts/migrate-article-body.ts
  --with-user-token` from the Studio directory, and the user runs it. Do not
  attempt to write to the Content Lake from this repository.
- **Patch the draft as well as the published document, or refuse.** Both articles
  are published and neither has a draft today, checked against the dataset while
  this spec was written. A script that patches only `_id` would leave a draft
  carrying the old shape and an editor previewing a body-less article, so it
  either patches `drafts.<id>` too when one exists or stops and says so. Silently
  doing half the job is the one outcome to avoid.
- **The visible failure needs to know where it is.** `UnsupportedBlock` draws
  itself in development and in preview, and logs once and draws nothing
  otherwise. `dev` comes from `$app/environment` and `previewEnabled` is already
  on the page's data, so the page passes it down rather than the component
  guessing. A public visitor to a marketing article is not shown a defect
  report, and this is not the questionnaire: nothing medical is at stake and a
  destructive alert would be the wrong instrument.
- **An empty `body` is a legitimate state**, not an error: a new article an
  editor has created and not yet filled. The page renders the hero, no contents
  list at all, and nothing below. `ArticleToc` currently draws its heading and
  its gold rule unconditionally, which was safe while every article had eight
  sections and is not any more.
- **Read the headings out of the catalogues, not from memory.** `seed.ts` sets the
  precedent and the reason: a heading retyped into a script is a heading that can
  disagree with the page it is meant to reproduce. It also fixes an ordering
  constraint: step 2 runs before step 5 removes those keys.
- **The migration is bootstrap, and it says so in its header**, like `seed.ts`.
  Once the message keys are gone it cannot be re-run, which is correct: it exists
  to move one article once.
- **Do not reshape the 26b components.** They take the shape they draw, which is
  what makes them block renderers already. `ArticleProse`'s optional heading is
  the single exception, and it is additive.
- **The review note is the document's, not a block's.** 26b recorded this. The
  sources block carries the prose and the citations; the reviewer's name and the
  next review date come from the page, and after this feature the note is
  rendered by the page at the foot of the reading column rather than by the
  block. For this article that is the same position, because its sources block is
  last.
- **The comparison table loses its catalogue row.** `learn_row_result_claim` reads
  `treatment.claim` from `src/lib/domain` today. From this feature every figure
  in the table is typed by an editor and nothing detects a divergence from the
  catalogue. `project-overview.md` already records that trade; the migration
  copies the current claim in as literal text.
- **Guard every block on its own content** and skip nothing silently. An empty
  block renders nothing; an unmapped block reports itself. Those are different
  failures and must stay so.
- Semantic tokens and stock Tailwind scales only. This feature adds no new
  visual decisions, so any hex or arbitrary value appearing in a diff is a
  mistake.
