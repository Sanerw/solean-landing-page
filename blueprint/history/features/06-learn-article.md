# Feature: Learn article

**From build-plan:** feature 6
**Status:** verified

## Goal

Deliver the reference-led, responsive Mounjaro versus Wegovy editorial page at
`/learn/blog/mounjaro-vs-wegovy`. The page gives reviewers a complete article
experience with clear medical-review context, usable in-page navigation,
comparison content, safety framing, FAQ, and related-guide previews while keeping
all content fictional and local to the prototype.

## Design reference

- [Learn article reference](../reference/Learn%20Article%20%E2%80%94%20%21learn%21blog%21mounjaro-vs-wegovy.png)
- `blueprint/reference/design-system.md` remains authoritative for tokens,
  typography, spacing, radii, and contrast corrections. The screenshot defines
  composition, not canvas dimensions or arbitrary values.
- No `prototypes/` directory exists, so there are no prototype tokens or mockups
  to port before implementation.

## In scope

- A typed `Article` fixture for the single featured slug, imported directly by
  the editorial feature with no service interface.
- A thin dynamic SvelteKit route at `/learn/blog/[slug]`, plus `/learn` and
  `/learn/blog` as working entry points that redirect to the featured article.
- A friendly route-local not-found state for empty, malformed, or unknown slugs.
- The existing solid `SiteHeader`, announcement bar, and `SiteFooter`, with the
  adapted `Breadcrumb` for the article hierarchy.
- A responsive article hero with category, title, summary, reviewer metadata,
  read time, and a local reference-derived hero image with meaningful alt text.
- A semantic table of contents with anchor links, a desktop sticky treatment,
  and a compact in-flow mobile treatment. No scripted active-section tracking.
- Quick answer, key takeaways, treatment comparison, how the treatments work,
  expected results, side effects and safety, manufacturers, sources, and medical
  review content from the typed fixture.
- The adapted `Accordion` for article-specific FAQ items.
- Related-guide preview cards that contain typed metadata but no dead links to
  articles that do not exist.
- Responsive, keyboard, focus, reduced-motion, table overflow, heading-order,
  landmark, and contrast behavior required by the project standards.
- Page title and description metadata derived from the loaded article.

## Out of scope

- A `/learn` index, category archive, search, filtering, pagination, or CMS.
- Additional article pages or working links from related-guide previews.
- External medical, publishing, analytics, or image services.
- New treatment facts, price calculations, eligibility rules, or production
  medical claims. Existing canonical treatment names and claim copy win over
  conflicting values in the screenshot.
- Active table-of-contents tracking, reading progress, sharing controls, or
  comments.
- Changes to the global marketing shell beyond the smallest content-fixture
  adjustment needed to reuse Dr. Juraj Galan without duplicating his identity.
- Dark mode, deployment adapter changes, and browser-test or unit-test setup.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff, not full files; you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at
   the end.

Never accept a step you have not read. If a diff is too big to review, the step
was too big, so split it.

## Build steps

- [x] **Step 1 - Lock the article contract and route behavior** - Add the
  feature-owned `Article` types, the featured fixture, and a lookup that returns
  `null` for unknown slugs. Reuse canonical treatment catalogue entries and
  extract Dr. Juraj Galan as one exported marketing fixture referenced by both
  marketing and learn content. Add the thin `[slug]` load function, a temporary
  semantic article heading, `/learn` and `/learn/blog` redirects, and a
  route-local not-found page. *Done when:* both entry points resolve to
  `/learn/blog/mounjaro-vs-wegovy`, the known slug renders its fixture title,
  `/learn/blog/not-a-real-article` returns a friendly 404 with a working route
  back to the featured article or home, and no clinician name, treatment name,
  or treatment claim is independently retyped in learn content.

- [x] **Step 2 - Build the article hero and page frame** - Compose the existing
  solid `SiteHeader` and adapted `Breadcrumb` with the category, responsive
  display title, summary, canonical reviewer metadata, updated date, read time,
  and local hero image. Add document title and description metadata from the
  route data. Use an optimized crop derived from the supplied reference when no
  original standalone image exists; do not ship the full-page screenshot as the
  article image. *Done when:* the known route has a complete hero matching the
  reference hierarchy at mobile and desktop widths, the image preserves its
  aspect ratio without layout shift and has useful alt text, the breadcrumb is
  exposed as navigation with the current page identified, and the browser title
  and description reflect the fixture.

- [x] **Step 3 - Add the table of contents and comparison core** - Build the
  table of contents, quick answer, and comparison table from typed fixture
  fields. Resolve comparison column labels and result claims from the canonical
  treatment catalogue. Give every table-of-contents target a stable id and
  scroll margin, keep the desktop table of contents sticky, and keep the mobile
  version in normal document flow. *Done when:* every table-of-contents link
  scrolls to its uniquely headed section, the comparison uses semantic table
  markup with a caption and row or column headers, narrow viewports can read all
  values without clipping the page, and the comparison remains understandable
  with CSS unavailable.

- [x] **Step 4 - Add the remaining article body** - Add treatment mechanism,
  expected-results, side-effects and safety, and manufacturer sections from
  plain fixture data. Keep medical language cautious and render text without
  `{@html}`. *Done when:* all body sections named in the table of contents exist
  exactly once, the safety content is a semantic list, manufacturer panels do
  not duplicate catalogue-owned treatment names, and the article remains
  understandable with images unavailable.

- [x] **Step 5 - Add takeaways and editorial trust** - Add key takeaways, the
  eligibility callout, source labels, medical-review notice, and a visible
  prototype editorial disclaimer. Until Feature 7 supplies a questionnaire
  route, present the eligibility action as disabled and explain its unavailable
  state instead of linking to a 404. *Done when:* takeaways and review metadata
  are visibly distinguishable from body copy, the unavailable CTA is not
  keyboard-focusable or clickable and is identified as unavailable, missing
  optional source URLs render as plain citations rather than broken anchors,
  and the page states that its medical copy is prototype content rather than
  approved medical advice.

- [x] **Step 6 - Complete FAQ, related guides, and responsive integration** -
  Add article-specific FAQ items using the adapted `Accordion`, then add the
  related-guide band from typed preview metadata. Finish page-level responsive
  spacing, keyboard focus, heading order, and integration with the existing
  marketing footer. *Done when:* FAQ triggers operate by keyboard with visible
  focus and correctly associated panels, related previews do not expose dead
  links, the whole page has one `h1` and a logical heading hierarchy, there is no
  horizontal page overflow at mobile, tablet, or desktop widths, and the page
  can be reviewed from header through footer without an unreachable control.

## Files / areas

- `src/lib/features/learn/types.ts` - feature-owned editorial contracts.
- `src/lib/features/learn/content.ts` - typed article, FAQ, source, and related
  preview fixtures plus slug lookup.
- `src/lib/features/learn/ArticleHero.svelte` - hero, breadcrumb, and review
  metadata composition.
- `src/lib/features/learn/ArticleToc.svelte` - accessible in-page navigation.
- `src/lib/features/learn/ArticleContent.svelte` - comparison and editorial body
  sections.
- `src/lib/features/learn/ArticleSidebar.svelte` - key takeaways, eligibility,
  editorial standards, and source/review callouts.
- `src/lib/features/learn/RelatedGuides.svelte` - non-dead related previews.
- `src/lib/assets/learn/mounjaro-vs-wegovy.jpg` - optimized local hero crop or
  equivalent local asset derived from the supplied reference.
- `src/lib/features/marketing/content.ts` - expose one canonical Dr. Juraj Galan
  fixture for reuse; preserve all existing marketing exports and behavior.
- `src/routes/(marketing)/learn/+page.ts` - redirect to the featured article.
- `src/routes/(marketing)/learn/blog/+page.ts` - redirect an omitted slug to the
  featured article instead of serving a route-level 404.
- `src/routes/(marketing)/learn/blog/[slug]/+page.ts` - fixture lookup and 404.
- `src/routes/(marketing)/learn/blog/[slug]/+page.svelte` - thin screen
  composition and document metadata.
- `src/routes/(marketing)/learn/blog/[slug]/+error.svelte` - friendly local
  not-found state with the solid marketing header.

The exact component split may be tightened during implementation if a named
component has no independent responsibility, but route files stay thin and the
six review steps stay intact.

## Data / contracts

- `Article` is the load-bearing editorial contract for this and later learn
  fixtures. It contains `slug`, `category`, `title`, `summary`, `hero`, `review`,
  `toc`, `quickAnswer`, `keyTakeaways`, `comparison`, structured body sections,
  `sideEffects`, `manufacturers`, `faqs`, `sources`, and `related`.
- `Article.review` references the canonical clinician fixture instead of storing
  a second name, role, or portrait. Dates are ISO calendar strings in data and
  formatted for display at the component boundary in UTC so a calendar date
  cannot shift across time zones. Read time is a positive integer number of
  minutes.
- Comparison columns reference canonical `Treatment.id` values. Display names
  and result claims resolve through `src/lib/domain/catalogue.ts`; the fixture
  may add article-only facts such as active ingredient and manufacturer but does
  not restate catalogue-owned fields.
- Table-of-contents ids are a closed string union shared by `toc` entries and
  section ids, so a fixture cannot point to an absent anchor without a type
  error.
- `getArticleBySlug(slug: string): Article | null` is the only route lookup. The
  route converts `null` to SvelteKit `error(404, ...)`; it never falls back to a
  different article for an unknown slug.
- FAQ answers, paragraphs, and lists are plain text data. No fixture stores HTML
  and no component uses `{@html}`.
- Related previews use optional destinations. A preview without an implemented
  destination renders as content, not as an anchor or fake button.
- Everything is static and public. No client state, persistence, service
  interface, server integration, user data, or medical data is introduced.

## Testing

- No `test` command or unit test runner is configured, so this feature must not
  install one silently. The slug lookup and fixture constraints are verified by
  strict TypeScript, targeted browser behavior, `pnpm check`, and `pnpm build`.
- No `Browser tests` command is declared, so stable route and accordion behavior
  is verified directly in the running app rather than by adding Playwright.
- After each step, run `pnpm check`. Run `pnpm build` for the completed feature.
- Browser verification covers:
  - `/learn` and `/learn/blog` redirects, known slug, and unknown-slug 404.
  - Desktop and mobile hero composition, image behavior, and metadata.
  - Every table-of-contents anchor, narrow comparison-table behavior, and no
    whole-page horizontal overflow.
  - Keyboard traversal and visible focus through header, article links, CTA,
    FAQ triggers, and footer.
  - Accordion expanded and collapsed states, heading order, landmarks, and
    readable content with images disabled.
  - Related previews contain no links to absent routes.
- Direct comparison against the stored screenshot is required at desktop and
  mobile sizes. It proves visual composition only; route errors, keyboard
  operation, and semantic markup require separate evidence.

## Notes for the AI

- Use Svelte 5 runes mode and strict TypeScript. Route files only load data and
  compose feature components; editorial rendering belongs in
  `src/lib/features/learn/`.
- Reuse `CONTAINER`, `BLEED`, `SiteHeader`, `Button`, `Breadcrumb`,
  and `Accordion`. Do not install or create a new shared primitive for this
  feature.
- Use semantic tokens and stock Tailwind scales only. No arbitrary visual
  values, absolute-positioned page layout, fixed artboard heights, raw colors,
  or canvas coordinates.
- The existing `(marketing)` layout already owns `AnnouncementBar` and
  `SiteFooter`; the article page owns the solid `SiteHeader` because the layout
  intentionally does not.
- Use semantic `article`, `nav`, `aside`, `section`, `table`, and heading markup.
  Do not communicate meaning by color alone.
- Preserve the reference's editorial hierarchy, not its inconsistent header
  navigation. The existing canonical marketing navigation remains authoritative.
- Treat all medical language as fictional prototype copy. Do not invent clinical
  precision, eligibility thresholds, guarantees, or external endorsements.
- Keep external source URLs optional and safe. Use `rel="noopener noreferrer"`
  for any link that opens a new tab, and never turn absent URLs into `href="#"`.
- Respect reduced motion; native anchor scrolling is sufficient and does not
  require scripted smooth scrolling.
