# Feature: Learn article from Sanity

**From build-plan:** feature 20
**Status:** verified

## Goal

The Mounjaro vs Wegovy page reads its content from the Sanity Content Lake
instead of `src/lib/features/learn/content.ts`, in both German and English, so a
second article can be published without a deploy. The page must look exactly as
it does today: this feature changes where the words come from, not what the
reader sees.

## Design reference

None, and that is the point. This is a source swap, not a redesign, so the
reference is the current rendering of `/learn/blog/mounjaro-vs-wegovy` in both
locales. Capture a before screenshot at the start of Step 2 and compare against
it; a visible difference is a defect, not an improvement.

## In scope

- The article query, and a mapper turning the Sanity document into the `Article`
  shape the existing components already accept.
- The table of contents, derived from which sections the document actually
  fills, because the Studio has no `toc` field by design.
- `/learn/blog/[slug]` reading Sanity, in both locales, through
  `$lib/sanity/LiveQuery.svelte`.
- The reviewer portrait moving from `enhanced:img` to a Sanity CDN URL.
- Keeping the browser harness deterministic once the route calls Sanity.
- Removing the fixture module and the article's paraglide keys once nothing
  reads them.

## Out of scope

- **The marketing homepage.** It keeps its fixtures entirely and moves in a
  separate feature. `homePage-de` / `homePage-en` stay seeded but unread.
- **The related-guides block.** `RelatedGuides.svelte` is not rendered by any
  route today, and the `related` field stays unused. Decided with the user.
- **Testimonials.** Schema exists, no documents, nothing reads them.
- **TypeGen.** Query result types stay hand-written in `queries.ts`.
- **Publishing a second article.** This feature makes it possible; it does not
  do it.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - the query, the mapper and the table of contents** - extend
  `articleQuery` to every field the page renders, and add
  `src/lib/features/learn/from-sanity.ts` mapping the query result to the
  existing `Article` type, including deriving `toc` from the sections that are
  filled and building image URLs with `urlFor`. Pure module, nothing wired.
  *Done when:* `pnpm test` covers the mapper with an article missing its hero,
  missing its reviewer portrait, missing the side-effects section, and missing
  every optional section (the TOC comes back with only the sections present, in
  the page's fixed order), and asserts that each array item keeps its Sanity
  `_key`; `pnpm check` clean; the app renders unchanged.

- [x] **Step 2 - the route reads Sanity** - `+page.ts` becomes
  `+page.server.ts` using `locals.sanity.loadQuery` and `locals.locale`;
  `+page.svelte` renders through `LiveQuery`; `ArticleHero` takes the reviewer
  portrait as a URL and uses a plain `<img>` with a Sanity srcset instead of
  `enhanced:img`. The `<svelte:head>` block moves onto the loaded document and
  prefers `seoTitle` / `seoDescription` when the editor has set them, falling
  back to `title` and `summary`. *Done when:* the page renders from Sanity at
  `/learn/blog/mounjaro-vs-wegovy` and `/en/learn/blog/mounjaro-vs-wegovy`,
  matches the before screenshot in both locales, the tab title and meta
  description are unchanged with no SEO override set and follow the override
  once one is, an unknown slug still 404s, and the browser console is clean on a
  click-through from `/` as well as a direct load.

- [x] **Step 3 - keep the browser harness deterministic** - four e2e specs visit
  this route (`accessibility`, `locale`, `marketing-viewport`), so between Step 2
  and this step the browser suite calls live Sanity on every run. Do not treat a
  green run in that window as meaningful. Add an optional
  `PUBLIC_SANITY_API_HOST` read by `client.ts`, defaulting to the real host, and
  serve the article response from `e2e/fixture-server.mjs` the way the RxScale
  questionnaire is already served. *Done when:* `pnpm test:browser` passes with
  the network unavailable to `*.api.sanity.io`, and the fixture is a trimmed
  real response, not invented content.

- [x] **Step 4 - the featured article stops being a constant** -
  `FEATURED_ARTICLE_SLUG` is hardcoded and reached from four places: the `/learn`
  and `/learn/blog` redirects, the error page's CTA, and the homepage teaser. Once
  the slug lives in Sanity an editor can rename it, and all four would point at a
  404, including the "read the article" button on the 404 page itself. Resolve
  the most recently reviewed article's slug from Sanity for the two redirects and
  the error CTA. *Done when:* renaming the slug in the Studio leaves `/learn`,
  `/learn/blog` and the error page's CTA all landing on the article, and an empty
  dataset sends `/learn` somewhere sensible instead of into a redirect loop.

- [x] **Step 5 - retire the fixture** - delete `featuredArticle()`,
  `getArticleBySlug()` and the article's paraglide keys from `messages/de.json`
  and `messages/en.json`; delete the unused `RelatedGuides.svelte`,
  `RelatedArticlePreview` and the `ArticleTocItem['id']` union if the derived TOC
  replaces it. *Done when:* nothing imports the deleted module, `pnpm check`,
  `pnpm test`, `pnpm test:browser` and `pnpm build` all pass, and the rendered
  page is still identical to the before screenshot.

- [x] **Step 6 - the teaser and the overlays** - confirm the homepage teaser
  still lands on the article now its slug comes from Sanity, and that the
  Presentation tool shows click-to-edit overlays on the real route rather than
  only on `/dev/sanity`. *Done when:* clicking the teaser from `/` and from `/en`
  lands on the article in the right language, and editing the title in the Studio
  changes the previewed page without a reload.

## Files / areas

| Path | Change |
| --- | --- |
| `src/lib/sanity/queries.ts` | extend `articleQuery`; add the result type |
| `src/lib/features/learn/from-sanity.ts` | new, the mapper and TOC derivation |
| `src/lib/features/learn/from-sanity.test.ts` | new, the mapper's tests |
| `src/lib/features/learn/types.ts` | reviewer carries `portraitUrl`; TOC id union revisited |
| `src/lib/features/learn/ArticleHero.svelte` | portrait as a plain `<img>` |
| `src/routes/(marketing)/learn/blog/[slug]/+page.ts` | deleted |
| `src/routes/(marketing)/learn/blog/[slug]/+page.server.ts` | new |
| `src/routes/(marketing)/learn/blog/[slug]/+page.svelte` | renders through `LiveQuery` |
| `src/lib/sanity/client.ts` | optional `PUBLIC_SANITY_API_HOST` |
| `e2e/fixture-server.mjs`, `e2e/fixture.ts`, `playwright.config.ts` | the Sanity fixture |
| `src/lib/features/learn/content.ts`, `RelatedGuides.svelte` | deleted in Step 4 |
| `messages/de.json`, `messages/en.json` | article keys removed in Step 4 |

## Data / contracts

**Load-bearing, because the homepage migration will follow the same path.**

- The page keeps consuming the existing `Article` type. The Sanity document is
  mapped into it at the load boundary, so the six article components stay
  untouched. Later features map their own documents the same way rather than
  reshaping components around Sanity's output.
- One change to `Article`: `review.reviewer` stops being the marketing
  `Clinician` (whose `portrait` is an `enhanced:img` import object) and becomes
  `{ name, role, portraitUrl: string | null }`. The marketing `Clinician` type
  is unchanged, because the clinical-team carousel still uses `enhanced:img`.
- `toc` is derived, never stored. The Studio has no `toc` field on purpose:
  a table of contents is a view of which sections exist.
- Queries filter on `language`, taken from `locals.locale`. Never query without
  it: translations are separate documents and an unfiltered query returns the
  article once per locale.

## Testing

`pnpm test` is declared in `AGENTS.md`, so the gate is on. In-scope logic, which
must ship a test in the same diff as Step 1:

- the Sanity-to-`Article` mapper: missing hero, missing reviewer portrait,
  missing optional sections
- the TOC derivation: only filled sections appear, in the page's fixed order

Out of scope for unit tests, per `coding-standards.md`: the components and the
route itself. Those ride on the browser harness and a screenshot comparison.

`pnpm test:browser` is declared, and four existing specs already cover this
route. They must keep passing without reaching the network, which is what Step 3
is for. Do not add new browser specs that assert on article copy: the copy now
lives in Sanity and would make the suite fail on an editorial change.

## Notes for the AI

- **Server-side only for the query.** Sanity is read in `+page.server.ts` via
  `locals.sanity.loadQuery`, never in a component.
- **Never import `@sanity/sveltekit` from a page component.** Its single entry
  point carries Sanity UI's stylesheet, whose `sui` layer would outrank every
  Tailwind utility. Read data through `$lib/sanity/LiveQuery.svelte`. The
  `@layer sui, sui.global` line at the top of `layout.css` is the safety net and
  must stay above the Tailwind import.
- **Localised hrefs.** The bare path is German. Any link built in this feature
  goes through `localizeHref`, or a click-through from `/en` will load German
  content while the page around it renders English.
- **`_key` for array items** from Sanity, not the loop index, or Visual Editing
  overlays will attach to the wrong element.
- **A Sanity outage takes the page down, and that is new.** The fixture always
  rendered; a network read can fail. `loadQuery` throwing gives the reader
  SvelteKit's error page rather than an unhandled exception, which is acceptable
  for an editorial page and is why this is a note rather than a step. Do not
  paper over it with fixture fallback copy: stale content presented as current is
  worse than an honest error on a page carrying medical claims. Revisit if the
  homepage migration puts the same risk on `/`.
- Follow `blueprint/context/coding-standards.md`: tabs, Svelte 5 runes, no
  em dashes in comments or copy, comment the why and not the what.
