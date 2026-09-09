# Feature: Domain, indexing and discovery

**From build-plan:** feature 28a
**Status:** verified

## Goal

**Approved deployment policy:** `PUBLIC_SITE_URL=https://solean-web.vercel.app`
and `SEO_INDEXING_ENABLED=false`. Indexing remains disabled until launch approval.

Give crawlers consistent public URLs and discoverable published content while
keeping indexing under an explicit launch control. Changing the future domain
must require configuration rather than editing components.

## In scope

- Validate one configured absolute origin; strip its trailing slash and reject
  credentials, query strings, fragments and non-root paths. Production origins use HTTPS; plain HTTP loopback origins are allowed only off Vercel for local verification.
- Never derive the public SEO origin from an arbitrary Host header or a preview hostname.
- Missing or invalid origin disables discovery/indexing rather than inventing a domain
  or taking down the medical funnel. Diagnostics contain no environment values or secrets.
- Apply a restrictive `X-Robots-Tag` to pre-launch deployments, Vercel previews,
  Sanity draft previews, internal routes and error pages; preserve the questionnaire's noindex.
- Indexing requires the launch switch, a valid origin, the intended request origin,
  and an eligible published public page. Local testing explicitly controls these inputs.
- Emit one absolute self-canonical for each successful public page, excluding tracking
  parameters. DE and EN each canonicalize to themselves.
- Replace global guessed alternates with reciprocal absolute links to verified
  published translations. A missing EN article must not produce an EN alternate.
  Use existing translation relationships where available; do not guess equivalence
  from unrelated slugs. Do not label a German-only legal document as English solely
  because its navigation is localized.
- Generate an XML sitemap from published content and actual route eligibility,
  excluding drafts, previews, questionnaire, APIs, dev routes, redirects and missing pages.
- Keep sitemap and robots endpoints independent of visitor locale cookies and draft mode.
  XML escapes all emitted values. Use trustworthy content modification times, never
  the current request time; omit unavailable dates.
- Replace static robots.txt with a route that advertises the sitemap only when enabled.
  Crawlers must be able to read noindex responses: do not combine a blanket Disallow
  with the expectation that crawlers will discover noindex. Robots is not access control.
- A content-service outage must return a retriable sitemap error, not a successful
  empty sitemap. Pre-launch sitemap is explicitly empty and noindex; no IndexNow calls.
- Document local configuration and the later domain switch without activating either remotely.

## Out of scope

- Visible copy, UI components, styles, new content, profiles, navigation or language redirects.
- Changes to analytics, consent, medical answers, Customer.io, RxScale or checkout.
- Structured data/Open Graph (28b), outbound IndexNow notifications (28c), CI setup (28d).
- Guessing old URL mappings, migrating solean.com, acquiring links or configuring external accounts.

## Build loop

Implement small steps using `workflow.stepReview: every`. Present each diff and
verification evidence before proceeding to the next reviewed step. No checkpoint
commit without approval. `/complete` owns archiving and the final commit/merge gate.

## Build steps

- [x] **Step 1 - Domain and launch policy.** Add isolated config/policy helpers,
  response-level indexing protection and environment documentation. *Done when:*
  unit tests prove valid/missing/malformed origins, switch parsing, preview and
  internal-route exclusions; response checks against the local production build prove noindex
  under the approved pre-launch configuration, with no visible page or flow changes.
- [x] **Step 2 - Canonical and language links.** Build shared published-page identity
  data and connect it to the server-rendered head. *Done when:* raw HTML for home,
  article and treatment in both locales contains exactly one correct canonical,
  absolute reciprocal existing-language links and no query parameters; missing
  translations, legal-language exceptions and 404s do not emit false alternates.
- [x] **Step 3 - Sitemap and robots.** Reuse the published-page inventory for the two
  endpoints. *Done when:* enabled mode emits valid XML containing only existing
  canonical public pages; disabled mode advertises no sitemap; drafts/private routes
  are absent; cookies and language headers cannot alter the result; an upstream
  failure is observable as a non-success response rather than an empty success.
- [x] **Step 4 - Integrated proof and handoff.** Run focused browser/raw-response
  checks in enabled and disabled modes, plus the documented verification commands.
  *Done when:* both policies pass, changing only the origin changes every generated
  URL consistently, and the existing locale/navigation behavior remains intact.

## Files / areas

- `src/lib/seo/` (new pure URL, identity and policy helpers plus unit tests).
- `src/lib/server/seo/` (published Sanity inventory and server configuration).
- `src/hooks.server.ts`, root layout load/head, public route server loads as needed.
- `src/routes/robots.txt/+server.ts`, `src/routes/sitemap.xml/+server.ts` and the
  existing `static/robots.txt` replacement.
- Existing Sanity projections and the local fixture server for deterministic tests.
- `e2e/seo.spec.ts`, test configuration, `.env.example` and an SEO launch runbook.

## Data / contracts

- Site origin and launch policy have one implementation consumed by later 28b/28c.
- Published page identity carries its canonical path, actual content language,
  verified equivalent-language paths, eligibility and optional modification timestamp.
- Treatment URLs join published documents to existing catalogue ids, not invented CMS slugs.
- Preview/draft data never feeds public discovery, even with a preview cookie present.
- No patient data enters a sitemap, metadata, diagnostics, webhook or test fixture.

## Testing

- `pnpm check`, `pnpm test`, `pnpm build` (no Verify command exists at intake).
- `pnpm test:browser e2e/seo.spec.ts` with the existing fixture server, plus focused
  existing locale/navigation tests selected during implementation.
- Pure URL/policy/identity/XML logic gets meaningful unit tests; route integration is
  checked against raw HTTP responses and server-rendered HTML, including JavaScript off.
- Preserve the test harness's blank Customer.io credentials and fixture services.
- Test the new origin and disabled/enabled policies without search-engine submissions.

## What the critique changed

- Split metadata, outbound notifications and CI out of the first feature.
- Distinguished a production Vercel deployment from approval to index a pre-launch site.
- Added missing translations and untranslated legal content as explicit hreflang cases.
- Separated pre-launch empty sitemaps from upstream failures, and prohibited blanket
  robots blocking as a substitute for crawler-visible noindex.
- Made Shopify/RxScale identifiers independent of the eventual public domain.
- Left performance changes dependent on measurements; 28d records a baseline and
  proposes any substantial fix through the normal reviewed workflow.

## Notes for the AI

Read current Blueprint context before implementing. The plan and initial spec were
approved in chat on 2026-09-09. No final public domain has been selected. Do not
interpret approval of local implementation as approval to deploy, enable indexing,
configure Sanity webhooks, submit URLs, push, merge or send messages to third parties.
