# Feature: 26b - The body and the neighbours

**From build-plan:** feature 26b
**Status:** verified

## Goal

Bring everything below the hero to the September 2026 artboards: a white panel
holding the contents list beside one centred reading column, the sections
restyled, the right-hand column gone entirely, and the neighbouring articles at
the foot of the page.

Every section becomes a component that takes the shape it draws rather than the
whole article. That is not tidiness: 26c turns these same components into block
renderers, and a component reaching into `article.sideEffects` cannot be handed a
block.

## Design reference

- `blueprint/reference/learn-article-desktop.png` - the article at 1920
- `blueprint/reference/learn-article-mobile.png` - the article at 390
- `blueprint/reference/journal-export.html` - the artboards themselves

`Learn Article — !learn!blog!mounjaro-vs-wegovy.png` is the **previous** design,
the one the current body was built from. It is the before, not the target.

**The export is a 1920px canvas.** Snap to the stock Tailwind steps and the
ladders in `blueprint/reference/design-system.md` section 3, as 26a did.

What the artboard measures, for the record:

| Piece | In the export |
| --- | --- |
| Body panel | white, 30px radius, 12px gutter |
| Contents list | 220px wide, 18px gaps; heading 20px semibold; gold rule 44x3; links 15px, the current one `#173824` semibold, the rest `#6F7D74` normal |
| Reading column | 900px, 48px between sections |
| Quick answer | 3px gold left border, 24px left padding |
| Section heading | 36/40 semibold, tracking -0.7 |
| Section body | 19/32, `#405756` |
| Table | 18px radius, header `#173824` at 58px, rows striping `#F7F8F5` and white, 1px `#DDE4DD` borders, cells 24px padding, first column 14.5px semibold |
| Side effect | `circle-check` at 17px, gold, 9px gap, label 15px |
| Maker card | `#F7F8F5`, 18px radius, 18px padding; icon tile 42px `#F7EBCB` at 12px radius with `building-2`; name 21px; product eyebrow 10.5px bold `#8A6411`; body 14/21 |
| FAQ item | 64px tall, white, 1px `#DDE4DD`, 14px radius, question 15px semibold, `plus` toggle at 18px |
| Review note | `#EEF3EC`, 14px radius, 16px padding, `shield-check` at 24px, title 16px, detail 13px |
| Neighbours band | 180px tall, 48px/76px padding, label 11px bold tracking 1px `#667773`, title 20/24 semibold |

Every one of those colours already has a token: `--card`, `--secondary`
(`#F7F8F5`), `--border`, `--highlight` (`#F7EBCB`), `--highlight-foreground`
(`#906100` against the export's `#8A6411`), `--accent` (`#EEF3EC`),
`--muted-foreground` (`#405756`), `--foreground` (`#173824`), `--primary`. Use
the tokens, not the hex.

## In scope

- The body as a white bleed panel holding a centred contents list plus reading
  column, replacing the full-width three-column grid.
- The right-hand column deleted: `ArticleSidebar.svelte`, `keyTakeaways` out of
  the query, the types, the mapper and the Studio, and its seven message keys.
- Quick answer's gold rule, the reading scale, the comparison table, the
  side-effect checklist, the maker cards, the FAQ cards and the review note.
- The previous and next article at the foot, from 26a's `neighbours`.
- Each section extracted into a component taking its own shape. **Load-bearing
  for 26c.**
- Both languages, the narrow artboard, and the accessibility pass.

## Out of scope

- **The composed body** (26c): `body[]`, the block registry, the migration, and
  the removal of `related` and the fixed section fields. This feature still reads
  `article.quickAnswer`, `article.faqs` and the rest; it only changes who draws
  them and how.
- **A current-section highlight in the contents list.** The artboard draws its
  first link dark and the rest grey, which is either a scroll-spy or a designer
  showing one state. Watching scroll position is behaviour this page has never
  had, and guessing at it is how a feature grows a limb nobody asked for. Say the
  word at review and it becomes a step.
- **Dropping the source list.** The artboard's sources section is prose plus the
  review note, with no list of citations; the current page lists them. Keeping
  them is deliberate: this is a medically reviewed article and its citations are
  evidence, not decoration. Removing them is an editorial call, not a styling
  one.
- The chrome the artboard redraws around the page: the offer bar, the five-item
  navigation, the Instagram button. Settled the other way, one of them guarded by
  a test.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - The panel, the two columns, and the end of the sidebar** -
  `+page.svelte` restructured: one white bleed panel holding a centred block of
  the contents list beside a reading column capped at the artboard's measure, with
  the FAQ and the sources inside that same column instead of a second grid below
  it. `ArticleSidebar.svelte` deleted, `keyTakeaways` out of `articleQuery`,
  `ArticleDetail`, `Article`, the mapper and the Studio schema, and
  `learn_sidebar_label`, `learn_key_takeaways`, `learn_sidebar_cta`,
  `learn_sidebar_question`, `learn_sidebar_body`, `learn_standards_title` and
  `learn_standards_body` out of both catalogues. The contents list takes its gold
  rule and its scale.
  *Done when:* at 1440 the contents list sits left of one reading column, both
  centred inside a white panel, with nothing in the right margin; at 390 the
  contents list is **not drawn at all** and the reading column runs the width of
  the panel, because the narrow artboard has no contents list (checked against
  `Article Mobile Body`, which holds `Article Main Content` and nothing else);
  `marketing-fidelity.spec.ts`'s three sidebar assertions are gone and the suite
  is green.

- [x] **Step 2 - The reading rhythm and the comparison table** - the section
  heading and body scale, the spacing between sections, the quick answer's gold
  left rule, and the table on its own radius with the dark header, the striped
  rows and the cell padding the artboard uses. Two components come out of
  `ArticleContent.svelte` here: one for a heading with paragraphs, one for the
  table, each taking what it draws.
  *Done when:* the quick answer carries a 3px gold rule down its left edge; the
  table has a dark header, alternating rows and a rounded overflow-hidden frame;
  the blank corner still carries its screen-reader label and
  `marketing-fidelity.spec.ts`'s assertion on it still passes; the reading column
  matches `learn-article-desktop.png` from Quick answer through Expected results.

- [x] **Step 3 - The lists and the maker cards** - the side effects become a
  checklist with gold `circle-check` marks instead of disc bullets, and the maker
  cards get their icon tile, their order (name, then the product eyebrow, then the
  body) and their surface. The eyebrow names the treatment, as the artboard does,
  so `learn_manufacturer_label` takes a parameter. Two more components, same rule.
  *Done when:* the side-effect list draws a gold circled check per item and no
  disc; each maker card leads with a `building-2` tile on `--highlight`; both
  match the artboard at 1440 and stack at 390; German and English both fit.

- [x] **Step 4 - The FAQ and the review note** - the accordion items become
  separate bordered cards with a `plus` toggle instead of a divided list with
  chevrons, and the sources section takes the artboard's prose scale with the
  review note on `--accent`.

  **The toggle is a shared-primitive change, not a local one.**
  `accordion-trigger.svelte` hardcodes `ChevronDownIcon`, so the plus needs an
  optional icon snippet on the primitive, defaulting to the chevron so the
  landing page's FAQ and the design-system showcase are untouched. The two
  alternatives both lose: hiding the chevron in CSS and drawing a plus inside the
  label leaves a lying icon in the accessibility tree, and dropping the primitive
  for this one accordion throws away the keyboard and ARIA behaviour it exists
  for. Keep the diff to the primitive additive, and show it separately from the
  article's own restyle.
  *Done when:* every FAQ item is a bordered card, all closed on arrival, still one
  accordion where opening one closes the last; the toggle is a plus on the article
  and still a chevron on the landing page; keyboard focus is visible on each
  trigger; the review note sits on the green tint with its shield.

- [x] **Step 5 - The neighbours at the foot** - a band below the article with the
  previous article on the left behind a left chevron and the next on the right
  behind a right one, reading 26a's `neighbours` from the load. Nothing is drawn
  when there is neither, and one side alone draws one side alone.
  *Done when:* with the library of one, no band is drawn at all; both links carry
  the article's title and lead to its localised href; and the rendered case is
  either proven in the browser or recorded as uncovered, per the fixture question
  below.

- [x] **Step 6 - The narrow frame, the languages and the gate** - the mobile
  artboard end to end, both catalogues checked on screen, axe clean, and the full
  suite.
  *Done when:* `pnpm test`, `pnpm test:browser`, `pnpm check` and `pnpm build` are
  green; the article has no horizontal scroll at 390 in both languages; axe
  reports no serious violation; and the page matches `learn-article-mobile.png`
  from the quick answer down.

## Files / areas

| File | Why |
| --- | --- |
| `src/routes/(marketing)/learn/blog/[slug]/+page.svelte` | the panel and the two columns |
| `src/lib/features/learn/ArticleSidebar.svelte` | deleted |
| `src/lib/features/learn/ArticleToc.svelte` | the gold rule and the scale |
| `src/lib/features/learn/ArticleContent.svelte` | becomes the composer over the new section components |
| `src/lib/features/learn/sections/*.svelte` | new: prose, callout, comparison table, checklist, maker cards |
| `src/lib/features/learn/ArticleFaq.svelte`, `ArticleSources.svelte` | restyled, and moved to the same folder and prop shape |
| `src/lib/features/learn/ArticleNeighbours.svelte` | new: the band at the foot |
| `src/lib/components/ui/accordion/accordion-trigger.svelte` | an optional icon, defaulting to today's chevron |
| `src/lib/features/learn/from-sanity.test.ts` | its `keyTakeaways` assertion goes with the field |
| `src/lib/sanity/queries.ts`, `types.ts`, `from-sanity.ts` | `keyTakeaways` out |
| `../studio-solean/schemaTypes/documents/article.ts` | `keyTakeaways` out |
| `messages/de.json`, `messages/en.json` | seven keys out, the neighbour labels in, `learn_manufacturer_label` gains a parameter |
| `e2e/marketing-fidelity.spec.ts`, `e2e/journal.spec.ts` | the sidebar assertions go, the layout and neighbour ones arrive |

## Data / contracts

**Sanity, `article`:** `keyTakeaways` removed. Nothing else moves; the section
fields all stay until 26c.

**The section component contract, load-bearing for 26c.** Each takes the shape it
draws and nothing else:

```ts
ArticleProse     { heading: string; paragraphs: readonly string[] }
ArticleCallout   { heading: string; paragraphs: readonly string[] }
ComparisonTable  { heading: string; caption: string; columns: readonly string[];
                   rows: readonly { label: string; cells: readonly string[] }[] }
ArticleChecklist { heading: string; intro?: string; items: readonly string[] }
MakerCards       { heading: string; cards: readonly { name: string; eyebrow: string;
                   body: string }[] }
ArticleFaq       { heading: string; items: readonly { question: string; answer: string }[] }
ArticleSources   { heading: string; summary: string; sources: readonly ArticleSource[];
                   reviewer: string; nextReviewAt: string }
```

`ArticleContent.svelte` maps today's fixed fields onto them and owns the section
ids the contents list anchors to. In 26c that mapping is replaced by the block
registry and these components do not change.

One of those props is not block content and never will be: the review note's
reviewer and next review date are the document's, not a section's. `ArticleSources`
takes them from the page in both models, which is why they are props here rather
than something the component reaches for.

## Testing

`pnpm test` is the gate. This feature is mostly composition, so the honest
prediction is **little new unit-testable logic**: the section components are UI
and ride on the browser harness and the build, per the Testing section of
`coding-standards.md`.

Two exceptions to watch for while building, and each ships a test if it appears:

- the comparison rows are assembled from profiles today and from a block in 26c.
  If that assembly moves out of a component into a function, it is in scope.
- `articleToc` already derives the contents list from filled sections. If a
  section's presence rule changes shape, its existing tests change with it.

`pnpm test:browser` carries the behavioural weight:

- the FAQ opens one item at a time and starts closed
- the contents list anchors resolve to sections that exist on the page
- no horizontal scroll at 390 in both languages
- the neighbours band is absent with a library of one
- axe reports no serious violation

**The fixture question, which step 5 answers rather than skips.** The e2e fixture
serves one article, so the browser can only ever prove the empty case: a band that
renders nothing renders nothing whether the wiring is right or wrong. 26a left
this open and it lands here. Two ways, and step 5 picks one and says which:

- add a second article to `e2e/fixtures/sanity-articles.json`, which proves the
  rendered case and would serve 26c too, but contradicts `journal.spec.ts`'s "one
  article is the state the site is in" and drags the Journal's band and chips into
  this feature; or
- leave the fixture alone and record the rendered case as uncovered, resting on
  `neighboursOf`'s six unit tests plus a look in a real browser.

**Not covered by any runner, so check it by eye against the PNGs:** the reading
measure, the table's stripes and radius, the checklist marks, the card tiles, and
the vertical rhythm between sections.

## Notes for the AI

- **Shape every component for 26c.** A component that reads `article.anything` is
  a component 26c has to rewrite. Pass the shape, not the article.
- **The Studio is a separate repository** with its own git, and it is already
  dirty. The `keyTakeaways` removal is not part of this feature's commit, and it
  deletes nothing from the documents: the field simply stops being offered and
  stops being read. Say so at review.
- **Use the tokens.** Every colour in the table above already exists in
  `layout.css`. The one gap is the export's `#8A6411` against
  `--highlight-foreground` `#906100`, which is the recorded contrast decision from
  F-03; take the token.
- **The blank table corner keeps its screen-reader label.** It is asserted, and
  the reason is in the component: the row headers name the attributes, so a
  visible column head there would label the labels.
- **Guard every section**, per `project-overview.md`. An article with no side
  effects, no makers, no FAQ or no sources loses that section and nothing else,
  and the contents list already follows what is filled.
- **The reading column has a measure, not a percentage.** The artboard's 900px at
  1920 is a line length, and a line length does not scale with the viewport.
- **The article hero's photograph is still too small**, pinned in
  `marketing-fidelity.spec.ts` by 26a. Nothing here fixes it and nothing here
  should hide it.
- **Do not transcribe the chrome**, for the reasons in Out of scope.

## What the build turned up

- **A duplicate key crashed hydration, and the contents list vanished with it.** The comparison
  table keyed its cells by their own text, and "Once weekly" appears in both columns. Svelte
  refuses a duplicate key at runtime, so the client render died after the server had already
  sent the page: the article looked right on arrival and lost its contents list a moment later.
  Cells and columns are keyed by position now, which is what identifies them. The page-error
  check that caught it is worth keeping in mind for the next component with a list of strings.

- **The fixture question is answered: the fixture stays as it is.** A second article would
  prove the neighbours band renders, but `e2e/fixtures/sanity-articles.json` is generated from
  the live dataset by `scripts/generate-sanity-fixture.mjs`, so a hand-added article would be
  dropped the next time anyone runs it. The band's rendered case was proven by hand instead,
  by faking both neighbours in the load and looking at 1440 and 390, and the reasoning is
  recorded in the spec that asserts the empty case.

- **The German comparison table prints two English cells.** The result-claim row reads
  `treatment.claim` from `src/lib/domain`, which is an English-only fixture, so the German
  article says "Lose up to 23% body weight". This predates 26b: the old table read the same
  field. It is not fixed here because 26c retires that row's source entirely, and fixing it
  twice is worse than fixing it once.

- **The sources section is guarded on its sources now.** It used to render whatever the article
  had while the contents list only listed it when sources existed, so an article without them
  had a section nothing pointed at. The two follow the same rule.

- **The narrow artboard contradicted a tested decision, and the user chose the artboard.**
  Feature 17 put the contents list on a phone as two columns of links, with a reason recorded in
  `marketing-viewport.spec.ts`: the article is long enough that reaching a section by hand is
  the difference between reading it and leaving. `Article Mobile Body` holds
  `Article Main Content` and nothing else, so 26b hides it below `lg`. Raised at review rather
  than resolved by deleting the test; the assertion now states the new intent and carries both
  sides of the argument, so the next person to read it knows a decision was made rather than a
  test quietly dropped.
