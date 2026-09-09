# SEO launch configuration

Features 28a and 28b: the public origin, the launch switch, canonical and language links, the
two discovery endpoints, and the sharing and structured metadata built on top of them. IndexNow
(28c) and CI (28d) are separate.

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
deployment from indexing. Keep the old domain available when a real redirect migration is
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
