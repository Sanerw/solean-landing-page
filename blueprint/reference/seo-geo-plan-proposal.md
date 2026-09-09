# SEO/GEO - Blueprint intake proposal

**Status:** approved by the user on 2026-09-09; incorporated into the Blueprint plans.
**Requested:** 2026-09-09.
**Current deployment:** https://solean-web.vercel.app.
**Future public domain:** not selected; never assume it is solean.com.

## User constraints

- Preserve the visible content, layout, styles, navigation, locale selection and questionnaire flow.
- Implement technical SEO/GEO through the existing Blueprint lifecycle.
- Configure the site origin independently of Shopify, RxScale, Sanity and request headers.
- No domain migration, remote configuration, deployment, search-engine submission or outreach is performed by this intake.

## Approved decision

Keep the current deployment out of search results until the user launch.
Use separate `PUBLIC_SITE_URL` and server-only `SEO_INDEXING_ENABLED` settings.
The approved initial values are `https://solean-web.vercel.app` and `false`.
An alternative is to enable indexing now on the temporary domain; this needs an explicit
choice because it changes what this rollout is intended to achieve.

## Exact proposed build-plan addition

Insert immediately after feature 27 and before `## Testing`, preserving all existing items:

```markdown
- [ ] 28. **SEO and GEO foundations without UI changes** - configurable public domain,
  controlled indexing, published-content discovery, metadata, structured data and
  repeatable verification, preserving visible content and every user flow.
  - [ ] 28a. **Domain, indexing and discovery** - configurable canonical origin and
    launch switch, absolute canonical and existing-language alternates, environment-aware
    robots rules and a sitemap generated from published Sanity content.
  - [ ] 28b. **Search and sharing metadata** - reuse the existing localized copy and
    images for Open Graph and appropriate Organization, Article and BreadcrumbList
    JSON-LD; include only facts supported by the visible pages.
  - [ ] 28c. **IndexNow publication notifications** - authenticated Sanity webhook,
    validated public URLs, key verification and bounded server-side notifications for
    published changes and removals; disabled until configured and indexing is enabled.
  - [ ] 28d. **Verification and launch handoff** - repeatable SEO checks in the existing
    test harness, one Verify command and matching GitHub checks through /ci, a measured
    performance baseline and a domain-launch/search-console runbook.
```

## Exact proposed project-plan addition

Insert in `## 8. Deployment`, immediately before its environment-variable table:

```markdown
**SEO deployment policy (feature 28).** The current deployment is
`https://solean-web.vercel.app`; the future public domain has not been selected.
`PUBLIC_SITE_URL` owns the absolute origin used by SEO metadata, the sitemap and
IndexNow. It is independent of the Shopify store domain and RxScale shop identifier.
`SEO_INDEXING_ENABLED` is an explicit server-side launch switch, disabled by default.
The proposed pre-launch deployment stays `noindex` until launch approval; enabling
indexing on the temporary domain instead requires the user's decision at intake.
Preview deployments, draft previews and internal routes remain non-indexable even
when the public deployment is enabled. Feature 28 preserves visible content and UI/UX.
```

Append these rows to that table:

```markdown
| `PUBLIC_SITE_URL` | public | absolute SEO origin; initially `https://solean-web.vercel.app`, replaced at domain launch |
| `SEO_INDEXING_ENABLED` | server only | explicit launch switch; defaults to false; does not enable preview or internal-route indexing |
```

After approval, replace the proposed-policy sentence with the user's actual decision,
apply the plan additions and regenerate the overview through `/overview` before
promoting the following draft to `blueprint/context/current-feature.md`.

## Draft initial specification

# Feature: Domain, indexing and discovery

**From build-plan:** feature 28a (proposed)
**Status:** not started

### Goal

Give crawlers consistent public URLs and discoverable published content while
keeping indexing under an explicit launch control. Changing the future domain
must require configuration rather than editing components.

### In scope

- Validate one configured absolute origin; strip its trailing slash and reject
  credentials, query strings, fragments and non-root paths. Production origins use HTTPS.
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

### Out of scope

- Visible copy, UI components, styles, new content, profiles, navigation or language redirects.
- Changes to analytics, consent, medical answers, Customer.io, RxScale or checkout.
- Structured data/Open Graph (28b), outbound IndexNow notifications (28c), CI setup (28d).
- Guessing old URL mappings, migrating solean.com, acquiring links or configuring external accounts.

### Build loop

Implement small steps using `workflow.stepReview: every`. Present each diff and
verification evidence before proceeding to the next reviewed step. No checkpoint
commit without approval. `/complete` owns archiving and the final commit/merge gate.

### Build steps

- [ ] **Step 1 - Domain and launch policy.** Add isolated config/policy helpers,
  response-level indexing protection and environment documentation. *Done when:*
  unit tests prove valid/missing/malformed origins, switch parsing, preview and
  internal-route exclusions; response checks prove noindex on the temporary deployment
  under the approved launch policy, with no visible page or flow changes.
- [ ] **Step 2 - Canonical and language links.** Build shared published-page identity
  data and connect it to the server-rendered head. *Done when:* raw HTML for home,
  article and treatment in both locales contains exactly one correct canonical,
  absolute reciprocal existing-language links and no query parameters; missing
  translations, legal-language exceptions and 404s do not emit false alternates.
- [ ] **Step 3 - Sitemap and robots.** Reuse the published-page inventory for the two
  endpoints. *Done when:* enabled mode emits valid XML containing only existing
  canonical public pages; disabled mode advertises no sitemap; drafts/private routes
  are absent; cookies and language headers cannot alter the result; an upstream
  failure is observable as a non-success response rather than an empty success.
- [ ] **Step 4 - Integrated proof and handoff.** Run focused browser/raw-response
  checks in enabled and disabled modes, plus the documented verification commands.
  *Done when:* both policies pass, changing only the origin changes every generated
  URL consistently, and the existing locale/navigation behavior remains intact.

### Files / areas

- `src/lib/seo/` (new pure URL, identity and policy helpers plus unit tests).
- `src/lib/server/seo/` (published Sanity inventory and server configuration).
- `src/hooks.server.ts`, root layout load/head, public route server loads as needed.
- `src/routes/robots.txt/+server.ts`, `src/routes/sitemap.xml/+server.ts` and the
  existing `static/robots.txt` replacement.
- Existing Sanity projections and the local fixture server for deterministic tests.
- `e2e/seo.spec.ts`, test configuration, `.env.example` and an SEO launch runbook.

### Data / contracts

- Site origin and launch policy have one implementation consumed by later 28b/28c.
- Published page identity carries its canonical path, actual content language,
  verified equivalent-language paths, eligibility and optional modification timestamp.
- Treatment URLs join published documents to existing catalogue ids, not invented CMS slugs.
- Preview/draft data never feeds public discovery, even with a preview cookie present.
- No patient data enters a sitemap, metadata, diagnostics, webhook or test fixture.

### Testing

- `pnpm check`, `pnpm test`, `pnpm build` (no Verify command exists at intake).
- `pnpm test:browser e2e/seo.spec.ts` with the existing fixture server, plus focused
  existing locale/navigation tests selected during implementation.
- Pure URL/policy/identity/XML logic gets meaningful unit tests; route integration is
  checked against raw HTTP responses and server-rendered HTML, including JavaScript off.
- Preserve the test harness's blank Customer.io credentials and fixture services.
- Test the new origin and disabled/enabled policies without search-engine submissions.

### What the critique changed

- Split metadata, outbound notifications and CI out of the first feature.
- Distinguished a production Vercel deployment from approval to index a pre-launch site.
- Added missing translations and untranslated legal content as explicit hreflang cases.
- Separated pre-launch empty sitemaps from upstream failures, and prohibited blanket
  robots blocking as a substitute for crawler-visible noindex.
- Made Shopify/RxScale identifiers independent of the eventual public domain.
- Left performance changes dependent on measurements; 28d records a baseline and
  proposes any substantial fix through the normal reviewed workflow.

### Notes for the AI

Read current Blueprint context before implementing. This is a proposal, not an
approved spec or a completed feature. No public domain has been selected. Do not
interpret approval of local implementation as approval to deploy, enable indexing,
configure Sanity webhooks, submit URLs, push, merge or send messages to third parties.
