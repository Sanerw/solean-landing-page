# Home page edits are invisible in production

**Type:** Fix
**Status:** verified

## The problem

A Sanity edit to `homePage-de` or `homePage-en` is published, and
`solean-web.vercel.app` keeps serving the old copy for up to an hour, sometimes
longer.

The cause is one line in `src/routes/(marketing)/+page.server.ts`:

```ts
setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' });
```

It was added to keep the shop's traffic off Reviews.io, but `setHeaders` applies
to the whole page response, not to that one third-party call, so Vercel's edge
network caches the rendered home page HTML for an hour and then serves it stale
for a further day while it revalidates. Nothing invalidates that copy when an
editor publishes.

Observed live on 2026-09-02, minutes after a publish: the first request answered
`x-vercel-cache: MISS` and carried the new announcement copy, the next answered
`x-vercel-cache: HIT` with `age: 16` and the same cached bytes. So the origin
reads Sanity correctly (`serverClient` sets `useCdn: false`); the stale copy is
the CDN's. Three consequences that match the reports:

- an edit waits out the hour before it can appear at all,
- the first visitor after that hour still gets the stale copy, because
  `stale-while-revalidate` revalidates behind them,
- the caches are per region, so two people see different versions of the page.

The announcement bar is loaded in `(marketing)/+layout.server.ts` and travels in
the same response, so it is cached with the page. No other route calls
`setHeaders`, which is why the Learn article and the legal pages have always
updated at once.

## The fix

Take the page out of the edge cache and protect Reviews.io where the problem
actually is: memoize the rating server-side instead.

- Drop the `setHeaders` call, so the home page renders per request and a publish
  is visible on the next reload.
- Add a small TTL cache around `fetchRating`, held per server instance: a
  successful read is reused for an hour, a failure for a minute, and concurrent
  callers share one in-flight request. Reviews.io then sees roughly one call an
  hour per warm instance rather than one per visitor, and an outage costs one
  1.2s timeout a minute rather than one per visitor.

Must not break:

- the badge still falls back to its own figures when Reviews.io cannot be
  reached; every failure stays the same failure to the caller (null),
- `fetchRating` keeps its current signature and its existing tests,
- no change to preview mode, Visual Editing, or any other route.

## Build steps

1. **Cache the rating, uncache the page.** Add
   `src/lib/features/marketing/rating-cache.ts` with a `createRatingCache`
   factory and the module-level instance the load function uses, then remove
   `setHeaders` from `(marketing)/+page.server.ts` and read the rating through
   the cache.
   **Done when:** `pnpm test` covers reuse inside the TTL, refetch after it,
   the short failure TTL, and the shared in-flight call; `pnpm build` passes;
   and a local production preview serves the home page with no `cache-control`
   header of its own.

## Verify

- `pnpm test` green, including the new cache tests.
- `pnpm build` green.
- `pnpm preview`, then `curl -sSI http://localhost:4173/` shows no
  `cache-control: s-maxage=...` on the home page.
- After deploy: publish an edit in the Studio, reload the site, see it. Check
  with `curl -sSI https://solean-web.vercel.app/` that `x-vercel-cache` is
  `MISS` or absent rather than `HIT`.

## Result

Done in one step, 2026-09-02.

- `setHeaders` removed from `src/routes/(marketing)/+page.server.ts`, with a
  comment recording why the header must not come back.
- `src/lib/features/marketing/rating-cache.ts` added: `createRatingCache`, the
  factory, and `cachedRating`, the instance the load function uses. One hour on a
  good answer, one minute on a failure, one shared in-flight call.
- `fetchRating` untouched, signature and existing tests included.

Evidence:

| Check | Result |
| --- | --- |
| `pnpm test` | 88 passed, 12 files, including four new cache tests |
| `pnpm check` | 2198 files, 0 errors |
| `pnpm build` | passed, `adapter-vercel` |
| `pnpm preview` + `curl -sSI localhost:4173/` | no `cache-control` header on `/` at all |
| SSR payload in that preview | `rating:{score:4.86,total:104}`, so the badge still gets its figures |

Not verified here, because it needs the deploy: that
`curl -sSI https://solean-web.vercel.app/` answers without `x-vercel-cache: HIT`
and that a publish in the Studio is visible on the next reload.
