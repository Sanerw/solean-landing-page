# Feature: Search and sharing metadata

**From build-plan:** feature 28b
**Status:** verified

## Goal

Give a crawler and a chat-app preview the facts already printed on each page, in
machine-readable form: Open Graph and Twitter tags so a shared link renders as a
card rather than a bare URL, and Organization, Article and BreadcrumbList JSON-LD
so a search engine can name the site, its guides and their place in the tree.

Every value comes from copy or a photograph the page already shows. Nothing is
invented, nothing is claimed that a visitor cannot see, and no visible content,
layout, styling or flow changes.

## In scope

- One shared metadata seam, extending 28a's `data.seo` rather than opening a
  second one. Same eligibility gate: a 200 HTML response on a public marketing
  route, with a configured origin. No origin means no metadata, exactly as it
  already means no canonical.
- Open Graph and Twitter tags on the eight public pages: `og:type`, `og:title`,
  `og:description`, `og:url` (the 28a canonical, absolute), `og:site_name`,
  `og:locale`, and `twitter:card`. Titles and descriptions are the ones the page
  already renders in `<title>` and `<meta name="description">`, read from one
  place so the two can never disagree.
- `og:image` from the photograph the page already displays: the home hero, the
  Journal's featured article hero, the article hero, the treatment photograph.
  Absolute, a fixed 1200x630 crop around the editor's hotspot, in a raster format
  named explicitly rather than content-negotiated, with `og:image:width`,
  `og:image:height` and `og:image:alt` from the alt text already on the page.
- A page with no photograph emits no `og:image` rather than a stand-in.
- `Organization` JSON-LD once per site, carrying only what the footer prints on
  every page: name, the canonical home URL, and the support e-mail and telephone
  number as a `contactPoint`.
- `Article` JSON-LD on an article: headline, description, the hero as `image`,
  `datePublished` and `dateModified` from the document's own dates, `inLanguage`,
  and the reviewer the page credits as `reviewedBy`.
- `BreadcrumbList` JSON-LD on the treatment page, matching the breadcrumb the page
  already draws, and on the article, matching the path a reader actually walked.
- Every emitted string cleaned of Sanity's stega markers, and every JSON-LD
  document escaped so CMS prose cannot break out of the script element.
- Unit coverage for the tag and JSON-LD builders, and browser coverage asserting
  the raw server-rendered HTML in both languages.

## Out of scope, and why

Each of these is refused for a stated reason, not deferred by oversight.

- **`aggregateRating`, anywhere.** The figure on screen is a *company* rating from
  Reviews.io (`company-reviews/store/www.solean.com`), shown beside a *product*.
  Emitting it as a treatment's rating would attribute company reviews to a
  medication. It also has a hardcoded fallback (4.9 / 104) served when Reviews.io
  is unreachable, and publishing that as structured data would state a stale
  figure as a machine-readable claim.
- **`sameAs`.** The footer's social links are placeholders, `https://instagram.com`
  and `https://facebook.com`, not Solean profiles. There is nothing truthful to
  link. Revisit when real profile URLs exist.
- **`Organization.logo` and a site-wide default `og:image`.** Both need a raster
  brand asset and none exists: the logo is an inline SVG using `currentColor`.
  Producing one is new content, which this feature does not create. The four legal
  pages therefore share a link without an image, which is the honest result.
- **`Product`, `Offer` or any price markup.** Prices on marketing pages are display
  copy; Shopify owns the amount charged and nothing detects a divergence. Machine-
  readable prices would turn a known soft spot into a published claim.
- **`MedicalWebPage`, `Drug`, `MedicalCondition` or any clinical vocabulary.** The
  marketing medical copy is unapproved mock content and the clinical judgement is
  RxScale's. Marking it up as medical fact is a claim this repository cannot make.
- **`FAQPage`.** The home page and the treatment pages carry FAQ accordions, but
  Google restricted FAQ rich results to authoritative government and health sites
  in 2023, and this is a commercial funnel. It would be markup with no effect and
  a policy question attached.
- The questionnaire, the development surfaces, analytics, consent, Customer.io,
  RxScale and checkout. Untouched.
- IndexNow (28c), CI and the performance baseline (28d), and any remote
  configuration, deployment or submission.

## Build loop

Implement small steps using `workflow.stepReview: every`. Present each diff and
verification evidence before proceeding to the next reviewed step. No checkpoint
commit without approval. `/complete` owns archiving and the final commit/merge gate.

## Build steps

- [x] **Step 1 - The metadata seam and the sharing tags.** Extend the `seo` payload
  from `PageLinks` to a page descriptor carrying title, description, type, locale
  and an optional image, built by a pure module beside the 28a helpers; render the
  Open Graph and Twitter tags from the root layout; move the eight pages' existing
  title and description reads into it so one value feeds both the visible tags and
  the shared ones. *Done when:* raw HTML for home, Journal, article, treatment and
  one legal page in both locales carries `og:title`, `og:description`, `og:url`,
  `og:site_name`, `og:locale`, `og:type` and `twitter:card`; `og:url` equals the
  canonical exactly; `<title>` and `<meta name="description">` are byte-identical
  to what shipped before this step; a page with no origin configured emits none of
  them; the questionnaire, `/dev/*` and a 404 emit none.

- [x] **Step 2 - The shared photograph.** Build the absolute 1200x630 OG image URL
  from the picture each page already shows. *Done when:* home, Journal, article and
  treatment each emit `og:image` with `og:image:width` 1200, `og:image:height` 630,
  and `og:image:alt` matching the alt text on the page; the URL is absolute, on the
  Sanity CDN, names a raster format explicitly rather than relying on content
  negotiation, and answers 200 when fetched; the four legal pages emit no
  `og:image` and no empty one; an article published without a hero emits none.

- [x] **Step 3 - Structured data.** Add the JSON-LD builders and render them.
  *Done when:* every public page carries exactly one `Organization` document whose
  every field is printed in the footer; an article carries one `Article` document
  with headline, image, both dates, `inLanguage` and `reviewedBy`; article and
  treatment pages each carry one `BreadcrumbList` whose items match the visible
  trail and resolve to 200; every document parses as JSON; a `</script>` or a `<`
  in CMS prose is escaped and cannot terminate the script element; a page with no
  origin emits no JSON-LD at all.

- [x] **Step 4 - Proof and handoff.** Browser coverage across both locales and both
  28a policy modes, plus the documented verification commands and the runbook
  update. *Done when:* `pnpm check`, `pnpm test` and `pnpm build` pass; the browser
  suite passes on 4173 and 4174; changing only `PUBLIC_SITE_URL` changes every
  absolute URL in every tag and document together; the existing marketing, journal,
  treatment, locale and accessibility specs still pass unchanged.

## Files / areas

- `src/lib/seo/metadata.ts` and `structured-data.ts` (new, pure, unit tested)
  beside the existing `origin.ts`, `indexing.ts`, `pages.ts`, `links.ts`,
  `sitemap.ts`.
- `src/lib/seo/links.ts` and `src/lib/server/seo/identity.ts`, extended from links
  to a fuller page descriptor.
- `src/app.d.ts`, where `PageData.seo` is declared.
- `src/routes/+layout.svelte`, which renders the head.
- The eight public `+page.server.ts` loads and their `+page.svelte` heads.
- `e2e/seo.spec.ts`, `e2e/seo-enabled.spec.ts`, the Sanity fixture if a projection
  grows a field, and `blueprint/reference/seo-launch.md`.

## Data / contracts

- **The page descriptor is load-bearing.** 28a shipped `PageLinks`
  (`canonical` + `alternates`); this widens it to the one shape every public page
  returns as `data.seo`. Define it once, in `src/lib/seo/`, and let the layout be
  its only consumer. 28c reads the same published inventory, not this shape.
- The image descriptor carries an absolute URL, width, height and alt. A page
  without a photograph omits the field rather than sending nulls.
- JSON-LD is emitted as one `@graph` per page rather than several script elements,
  so the documents can reference each other by `@id` and a reader counts one block.
- Sanity strings reach metadata only through `plain()`, and no metadata value is
  ever used as a lookup key.

## Testing

- `pnpm check`, `pnpm test`, `pnpm build` (no Verify command exists).
- `pnpm test:browser e2e/seo.spec.ts e2e/seo-enabled.spec.ts`, plus the existing
  marketing, journal, treatment, locale and accessibility specs, which are the
  regression net for "no visible change".
- **Unit tests, in scope:** the tag builder at every arity (image present, image
  absent, missing origin), the OG image URL builder, the JSON-LD builders for all
  three types, the JSON-LD escaping including a `</script>` payload, and the
  locale mapping. These are pure functions with real edge cases and the gate is on.
- **Browser tests, in scope:** the raw server-rendered HTML for each page kind in
  both locales, read off the response body rather than the DOM, so a crawler that
  runs no JavaScript is what is actually measured. Every JSON-LD block is parsed
  in the test rather than pattern-matched.
- **Not covered by any runner, so check by eye:** how a shared link actually renders
  in a chat client. The tags can be proven; a third party's rendering cannot.

## Notes for the AI

- Read the current Blueprint context before implementing. 28a is merged; its
  origin, policy and inventory modules are the foundation and must not be
  duplicated.
- **Stega markers.** Preview embeds invisible codepoints in every Sanity string.
  They are harmless in prose and wrong in a `<meta content>` value and fatal in
  JSON-LD. Apply `plain()` at the boundary, as the existing mappers do.
- **JSON-LD escaping is a security control, not a formatting nicety.** An editor
  who types `</script>` into a summary must not be able to close the element. Escape
  `<` as `<` and prove it with a test carrying that payload.
- **Do not use `auto('format')` for `og:image`.** Content negotiation can hand a
  social scraper AVIF or WebP; name a raster format explicitly. `croppedPicture`
  in `$lib/sanity/image.ts` is the pattern for a fixed-ratio crop around the
  hotspot, but it sets `auto('format')`, so this needs its own builder rather than
  a reuse.
- The eight public routes and the eligibility rule already exist in
  `src/lib/seo/indexing.ts`. Reuse them; do not restate the route list.
- Titles and descriptions live in Paraglide messages and in Sanity `seoTitle` /
  `seoDescription`. Moving them into the descriptor must not change a rendered
  byte: the existing browser specs assert page titles.
- No new message keys unless a page genuinely lacks a description today, and no
  new copy invented for metadata.
- Do not interpret this feature as approval to deploy, enable indexing, configure
  webhooks, submit URLs, push, merge or contact any third party.
