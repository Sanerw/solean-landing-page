# SEO launch configuration

Features 28a, 28b and 28c: the public origin, the launch switch, canonical and language links,
the two discovery endpoints, the sharing and structured metadata built on top of them, and the
IndexNow publication notifications. CI and the performance baseline (28d) are separate.

Nothing here has been deployed, no environment variable has been set remotely, and no URL has
been submitted to any search engine.

## Current pre-launch deployment

Configure these values when deploying the reviewed change:

```dotenv
PUBLIC_SITE_URL=https://solean-web.vercel.app
SEO_INDEXING_ENABLED=false
```

This origin is independent of Shopify and RxScale. Do not change their existing identifiers when
changing the site's public domain. An absent or invalid SEO origin leaves indexing disabled, the
canonical and language links absent, and the questionnaire untouched.

What the pre-launch deployment does:

| Surface | Before launch |
| --- | --- |
| Every response | `X-Robots-Tag: noindex`, crawler-visible without JavaScript |
| `<link rel="canonical">`, `hreflang`, Open Graph, JSON-LD | Rendered, so they can be reviewed before launch |
| `/robots.txt` | Served by a route; crawling open, no sitemap advertised |
| `/sitemap.xml` | A well-formed but empty `urlset`, itself `noindex` |

The header does not authenticate visitors or prevent direct access, and removing an already
indexed URL from an index requires a recrawl of the page carrying the header.

## What decides whether a page may be indexed

Four things, all of which must hold, and none of which can be satisfied by a request:

1. `SEO_INDEXING_ENABLED` is exactly `true`.
2. `PUBLIC_SITE_URL` parses as an absolute origin with no credentials, path, query or fragment.
3. The request arrived on that exact origin. An alias does not inherit the switch.
4. The response is a 200 HTML page on one of the eight public marketing routes, with no Sanity
   draft preview active. Vercel preview and development environments never qualify.

`src/lib/seo/indexing.ts` is the single implementation; 28b and 28c consume it rather than
restating it.

## Canonical and language links

Built on the server from the published Sanity inventory, never from the request URL, so a
tracking parameter, an alias host or a locale cookie cannot change what a page claims.

- Each language canonicalises to itself: `/privacy` to `/privacy`, `/en/privacy` to `/en/privacy`.
- An alternate is emitted only for a language whose document is **published**. A German-only
  policy document offers no English alternate, and an article with no translation offers none
  either. Article equivalence comes from the Studio's `translation.metadata`, not from matching
  slugs. **This has a live consequence:** on 2026-09-09 only `mounjaro-vs-wegovy` carried that
  metadata. The other five slugs exist as ten documents, published under the same slug in both
  languages and linked by nothing, so each is served without an alternate. Linking them in the
  Studio is what gives them one; guessing it here would claim a translation nobody declared.
- A page published in one language only gets no `hreflang` set at all, because a set of one
  claims a translation exists while naming none.
- The questionnaire, the development surfaces, 404s and anything that failed emit neither.

## Sharing and structured metadata

Built from the same `data.seo` descriptor the canonical is, so `og:title` and the visible
`<title>` are one string and cannot drift. The URL-bearing half is absent without an origin;
the title and description are not, because a page must never lose its title to an SEO setting.

`og:image` is a 1200x630 crop of the photograph the page already displays, taken around the
hotspot an editor set. **It names `fm=jpg` rather than negotiating the format**, and that is
load-bearing: several source assets are WebP, and a scraper handed WebP or AVIF stores nothing,
leaving every tag correct and the card blank. A page with no photograph shares as a plain
`summary` card rather than with a stand-in.

The structured data is one `@graph` per page:

| Node | Where | Built from |
| --- | --- | --- |
| `Organization` | every public page | the name, home URL, support e-mail and telephone the footer prints |
| `Article` | an article | its headline, description, hero, `reviewedAt` as `datePublished`, `_updatedAt` as `dateModified`, and the reviewer the page credits |
| `BreadcrumbList` | article and treatment pages | the trail the page itself draws |

**A breadcrumb step the page does not link carries no `item`.** The treatment page renders
"Treatments" as text because that index is undrawn and would answer 404, so the markup may not
send a crawler where the page refuses to send a reader.

**What is deliberately not claimed**, each refused for a reason rather than forgotten:

| Not emitted | Why |
| --- | --- |
| `aggregateRating` | the visible figure is a *company* rating from Reviews.io shown beside a *product*, and it has a hardcoded fallback served when Reviews.io is down |
| `sameAs` | the footer's social links are placeholders (`https://instagram.com`), not Solean profiles |
| `Organization.logo`, a default `og:image` | both need a raster brand asset, and the logo is an inline SVG using `currentColor`. Creating one is new content |
| `Product`, `Offer`, any price | prices are display copy; Shopify owns the amount charged and nothing detects a divergence |
| `MedicalWebPage`, `Drug` | the marketing medical copy is unapproved mock content and the clinical judgement is RxScale's |
| `FAQPage` | Google restricted FAQ rich results to government and health authorities in 2023 |

Revisit `sameAs` when real profile URLs exist, and the logo and default card if a raster brand
asset is ever produced. Neither needs a code change beyond the value.

**The JSON-LD escaping is a security control.** `toJsonLd` escapes `<`, `>`, `&` and the two
Unicode line terminators, so an editor who types `</script>` into a summary cannot close the
element and have the rest of the document parsed as markup. It stays valid JSON. Proven both by
`structured-data.test.ts` and, once, by serving that exact payload from the fixture and
confirming no live element reached the document.

## Discovery endpoints

`/robots.txt` and `/sitemap.xml` are routes, replacing the deleted `static/robots.txt`. Both
read the published perspective explicitly, so a visitor holding a preview cookie cannot put
drafts into either, and both ignore the locale cookie and `Accept-Language`.

The sitemap lists every published page in both languages, each with its own `xhtml:link`
alternates, and dates each entry from the content's own modification time. A page with no
usable timestamp gets no `lastmod` rather than today's date.

**A content outage answers 503, not an empty 200.** A successful empty sitemap tells a crawler
every page has been withdrawn, which it acts on. The pre-launch empty sitemap is a different
thing: that deployment really does publish nothing, and it is `noindex` throughout.

**Crawling is never blocked, in either state.** `robots.txt` disallows only `/api/`, `/dev/` and
`/preview/`. A blanket `Disallow: /` would hide the `noindex` header it was meant to enforce and
leave an already-indexed URL with no way out of the index. Robots is not access control.

## IndexNow publication notifications

**Google does not participate in IndexNow and never has.** This reaches Bing, Yandex, Seznam,
Naver and Yep. Google discovery stays with the sitemap, so do not expect Google results to move
because this is switched on.

Two settings, and they are different kinds of thing:

| Variable | Kind | Notes |
| --- | --- | --- |
| `INDEXNOW_KEY` | a **public identifier** | Served verbatim at `/{key}.txt`, which is the entire ownership proof. Anyone who fetches that file has it. 8 to 128 characters of `A-Za-z0-9-`; anything else reads as absent, because a key IndexNow would refuse on every submission is worse than no key |
| `SANITY_WEBHOOK_SECRET` | a **real secret** | Sanity signs each webhook body with it. Never served anywhere, never logged. An absent secret refuses every call rather than letting them through |

Nothing is submitted unless **all** of these hold: a valid key, a valid `PUBLIC_SITE_URL`,
`SEO_INDEXING_ENABLED=true`, a non-preview deployment, and a webhook that arrived on the
configured origin. That last one is what stops a webhook pointed at a preview deployment
publishing on the production domain's behalf.

### The webhook, and the three strings a person types into the Sanity dashboard

The projection lives in Sanity, not here, the way the Customer.io campaign does. This repository
guarantees only that it understands one shape. Create a GROQ-powered webhook with:

| Field | Value |
| --- | --- |
| URL | `https://<the public domain>/api/indexnow` |
| Trigger | Create, Update, Delete |
| Filter | `_type in ["article", "treatment", "legalPage", "homePage"]` |
| Projection | `{_type, _id, "slug": slug.current, language}` |
| Secret | the same value as `SANITY_WEBHOOK_SECRET` |

`homePage` and `treatment` documents have no `slug` field, and that is fine: the projection
answers `null` and the derivation does not need one for those types.

**The payload supplies an identity, never a URL.** The endpoint turns type, slug and language
into a path through the same helpers the canonical and the sitemap use, so a mistyped projection
or a hostile caller can at worst name a real URL on our own origin for a page that may not
exist. A `url` or `urlList` field in the payload is ignored outright.

An article publish notifies its own URL **and** the Journal, because publishing one changes the
index that lists it. A `clinician`, a `testimonial` or an unknown type notifies nothing, which
is the common case and not an error. A draft is refused even if the dashboard filter lets one
through.

### What it does when things go wrong

| Situation | Answer |
| --- | --- |
| Unsigned, wrongly signed, tampered, or replayed after five minutes | `401` |
| Not JSON, or JSON that is not an object | `400` |
| Understood, but IndexNow refused or was unreachable | `204`, logged server-side |

The first two are `401` and `400` on purpose, so a webhook wired up wrongly shows as failing in
Sanity's own delivery log instead of reporting success forever. The third is `204` because
Sanity retries a failed delivery, and retrying against a rate-limited service makes it worse;
the sitemap advertises every page regardless.

Submissions are bounded: at most 20 URLs per call, and one URL stays quiet for five minutes
after it has been submitted, so an editor fixing a typo in three quick publishes produces one
notification rather than three.

### Switching it on, after the domain launches

In this order, and not before `SEO_INDEXING_ENABLED=true`:

1. Generate a key (any UUID with the dashes removed will do) and set `INDEXNOW_KEY`.
2. Set `SANITY_WEBHOOK_SECRET` to a fresh random value.
3. Redeploy, then confirm `https://<domain>/<key>.txt` answers 200 with exactly the key.
4. Create the webhook in Sanity with the table above, using the same secret.
5. Publish one document and check Sanity's delivery log shows `204`.

A key change means the old key file stops resolving, so change the key and redeploy together.

## Future domain

The final domain and launch date are not selected. Once chosen:

1. Set `PUBLIC_SITE_URL` to its HTTPS origin, without a path, query or fragment.
2. Redeploy and validate with indexing still disabled. Changing a Vercel environment variable
   does not update an existing deployment.
3. Only after launch approval, set `SEO_INDEXING_ENABLED=true` and redeploy.

Changing the origin changes every canonical, every alternate, every sitemap URL, every `og:url`,
every `@id` in the structured data and the sitemap line in `robots.txt` together, which
`e2e/seo-enabled.spec.ts` proves by serving the same build on a second origin. The `og:image`
URL is the one exception and stays on Sanity's CDN, because it is an asset rather than a page of
this site.

Do not disable Vercel's system environment variables: `VERCEL_ENV` is what keeps a preview
deployment from indexing and from notifying IndexNow. Keep the old domain available when a real redirect migration is
approved; do not guess mappings from solean.com or change its configuration.

## Verification

```
pnpm check
pnpm test
pnpm test:browser e2e/seo.spec.ts e2e/seo-enabled.spec.ts
```

The one claim no runner makes is how a shared link actually renders in a chat client. The tags
can be proven; a third party's rendering cannot. Check that by hand against a real deployment
once a domain is live, not against localhost, which no scraper can reach.

The browser suite serves one build behind two ports: 4173 with indexing disabled, which is the
approved deployment policy, and 4174 with it enabled, which is what launch day would look like.
Both read the local fixture server, so no run reaches Sanity, RxScale, Shopify or Customer.io.
Plain HTTP origins are accepted only for `localhost`, `127.0.0.1` and `::1`, and only off Vercel.
