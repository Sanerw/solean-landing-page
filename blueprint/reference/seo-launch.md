# SEO launch configuration

Feature 28a: the public origin, the launch switch, canonical and language links, and the two
discovery endpoints. Metadata and Open Graph (28b), IndexNow (28c) and CI (28d) are separate.

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
| `<link rel="canonical">` and `hreflang` | Rendered, so they can be reviewed before launch |
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

Changing the origin changes every canonical, every alternate, every sitemap URL and the sitemap
line in `robots.txt` together, which `e2e/seo-enabled.spec.ts` proves by serving the same build
on a second origin.

Do not disable Vercel's system environment variables: `VERCEL_ENV` is what keeps a preview
deployment from indexing. Keep the old domain available when a real redirect migration is
approved; do not guess mappings from solean.com or change its configuration.

## Verification

```
pnpm check
pnpm test
pnpm test:browser e2e/seo.spec.ts e2e/seo-enabled.spec.ts
```

The browser suite serves one build behind two ports: 4173 with indexing disabled, which is the
approved deployment policy, and 4174 with it enabled, which is what launch day would look like.
Both read the local fixture server, so no run reaches Sanity, RxScale, Shopify or Customer.io.
Plain HTTP origins are accepted only for `localhost`, `127.0.0.1` and `::1`, and only off Vercel.
