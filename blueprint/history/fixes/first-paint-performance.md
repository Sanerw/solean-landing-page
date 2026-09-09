# First paint: the function's region, its cold start, and the edge

**Type:** Fix
**Status:** verified

## The problem

Typing the address and pressing enter takes noticeably long before anything is
drawn. Measured against `solean-web.vercel.app` on 2026-09-09, from Europe:

| Case | TTFB |
| --- | --- |
| Warm instance, `/` | 0.48 to 0.66 s |
| First request of the session | 3.17 s |
| Eight parallel requests, seven of which had to start a new instance | 2.0 to 2.5 s each, one warm answered in 0.40 s |

So a cold start costs about two extra seconds, and at this site's traffic most
people who type the address get one. Five causes, each measured rather than
guessed.

| # | Cause | Evidence | Cost |
| --- | --- | --- | --- |
| 1 | The function runs in `iad1`, Washington | `x-vercel-id: arn1::iad1::...`: the request enters in Stockholm and the render happens in the United States | every render crosses the Atlantic, and so does every call it makes to Sanity |
| 2 | The whole Sanity Studio is in the server bundle | `hooks.server.ts` imports `@sanity/sveltekit`, whose single entry statically imports `PerspectiveProvider` (6.1 MB), `WorkspaceLoader` (704 KB), React and floating-ui. The function is 31 MB, and evaluating that one chunk takes 354 ms on an M-series laptop with a warm disk | the largest single part of the cold start |
| 3 | Sanity is read past its own CDN | `useCdn: false` in `client.server.ts`. Measured: `api.sanity.io` 65 ms against `apicdn.sanity.io` 15 ms | 50 ms per query, and the home page makes two, the treatment page three |
| 4 | Nothing is cached at the edge | `x-vercel-cache: MISS` on every request | every visitor pays a full render, and one visitor in several pays a cold start |
| 5 | The mobile hero downloads the widest candidate | `sizes` resolves to `1684px` below 1024px, so a phone picks the `2560w` file: 199 KB against 50 to 77 KB | the largest image on the page, and the LCP element |

Cause 2 also explains why this is worse than it looks: the questionnaire, the
checkout endpoint and the reminder endpoint share one catchall function with the
marketing pages, so every route pays for Studio code no visitor ever runs.

## The fix

Five changes. The first three make the render itself cheap, the fourth stops
most visitors reaching the render at all, and the fifth is the image.

**The region (1).** `regions: ['fra1']` on the adapter. A single region is
available on every plan; only multiple regions are Enterprise. Frankfurt rather
than Stockholm because the market is Germany.

**The Studio off the server's hot path (2).** `@sanity/client` becomes a direct
dependency and `client.ts` builds the client from it, so nothing on an ordinary
request reaches `@sanity/sveltekit`. In `hooks.server.ts` the two Sanity handles
are loaded behind a dynamic import taken only by a request that is actually
previewing: one carrying the `__sanity_preview` cookie, or addressed to
`/preview/enable` or `/preview/disable`. Every other request gets a small
`locals.sanity` of our own: `previewEnabled: false` and a `loadQuery` that calls
the plain client and returns `{ data }`.

**The Sanity CDN (3).** `useCdn: true` on `serverClient`. This is safe for
preview by construction, not by care: `createQueryStore`'s loader passes
`useCdn: false` explicitly on every non-published perspective, so a draft read is
still uncached. Read `node_modules/@sanity/sveltekit/dist/query/store/createQueryStore.js`
before doubting it.

**One hour at the edge (4), decided by the user on 2026-09-09.** The marketing
pages answer `public, max-age=0, s-maxage=3600, stale-while-revalidate=60` when
preview is off. This deliberately re-opens what
`blueprint/history/fixes/home-page-edge-cache.md` closed on 2026-09-02, and the
cost it recorded is accepted rather than forgotten: **a published edit can take
up to an hour to appear.** Two things make that survivable now, and neither
existed in September. A deploy keys its own cache, so a redeploy shows an edit at
once. And `stale-while-revalidate` is 60 seconds rather than a day, so the hour
is the whole wait rather than the start of one.

The cache key has to carry what the response depends on, and since the locale
work landed the bare paths depend on two request headers:

| Header | Why the response depends on it |
| --- | --- |
| `Accept-Language` | `entryRedirect` sends a visitor with no cookie to `/en` when their browser asks for it, and serves German when it does not |
| `Cookie` | Paraglide's `cookie` strategy runs first, so a remembered `en` turns `/` into a 307 and a remembered `de` turns `/en/...` into one |

So cached responses carry `Vary: Accept-Language, Cookie`. Vercel supports Vary
on every plan and makes it part of the cache key. The consequence is worth
stating plainly: a returning visitor who has answered the consent banner or
chosen a language carries a cookie, so they get a cache entry of their own and
usually a miss. **The hit belongs to the visitor with no cookie at all, which is
exactly the person who types the address and waits.** Changes 1 to 3 are what
make the miss cheap for everybody else.

**The mobile hero (5), dropped.** It was specified on the belief that the phone
downloads more than it draws. It does not: see the step below for the arithmetic.
The four changes above are the whole fix.

**Must not break:**

- preview mode, Visual Editing and the Presentation tool: the dynamic import has
  to leave `locals.sanity.previewEnabled`, `locals.sanity.loadQuery` and the
  draft perspective behaving exactly as they do now,
- `/api/checkout`, `/api/recommendation`, `/api/reminder` and every
  `/questionnaire/...` response stay uncached and unchanged. The questionnaire
  carries medical answers and may never sit in a shared cache,
- the locale behaviour table in the previous fix stays true, redirects included,
- `hreflang` alternates and the `/de/...` 308 keep working,
- no secret moves toward the client: `SANITY_API_READ_TOKEN` stays in
  `client.server.ts` and off the CDN client,
- the questionnaire keeps working with no Sanity read at all.

## Build steps

- [x] **Step 1 - the region.** `adapter({ regions: ['fra1'] })` in
      `vite.config.ts`, with a comment recording that the default is `iad1` and
      that this site's visitors and its Content Lake are both in Europe.
      **Done when:** `pnpm build` passes and the generated
      `.vercel/output/functions/**/.vc-config.json` names `fra1`.

- [x] **Step 2 - Sanity through its own CDN.** `useCdn: true` on `serverClient`,
      with the comment explaining why preview is unaffected. Add
      `src/lib/sanity/client.test.ts` asserting the config the way
      `analytics/client.test.ts` asserts its own: `useCdn` true, the token still
      read from private env, `stega` still on.
      **Done when:** `pnpm test` covers the client config and the published page
      still renders the current copy.

- [x] **Step 3 - the Studio out of the server's hot path.** Add `@sanity/client`
      as a direct dependency; `client.ts` imports `createClient` from it;
      `hooks.server.ts` keeps `@sanity/sveltekit` behind a dynamic import taken
      only by a previewing request, and serves every other request a small
      `locals.sanity` built on the plain client. `plain.ts` keeps its own three
      lines rather than taking the real `stegaClean`, which this spec offered:
      importing it would put `@sanity/client` in the browser bundle, which is the
      opposite of the point.
      **Done when:** the Studio graph no longer appears in the *static* import
      graph of the built server entry (grep it), an ordinary page still renders
      its Sanity copy, and `/preview/enable` still reaches the vendor rather than
      404ing past it.

      The function directory stays 31 MB, and the draft of this step was wrong to
      predict otherwise: the Studio code is still on disk, because a dynamic
      import needs something to load. What changes is what a cold start
      evaluates, and only the import graph shows that.

      One thing this step broke and had to fix in `vite.config.ts`: making
      `@sanity/client` a direct dependency turned it into an external bare import,
      which collapsed the tree's two versions (7.26.2 for `@sanity/sveltekit`,
      8.4.0 for the Studio) onto the root one, and the Studio then failed to load
      on a missing `isTimeoutError`, answering `/preview/enable` with a 500.
      `ssr.noExternal` restores the per-importer copies.

- [x] **Step 4 - one hour at the edge.** A small module that decides the header,
      applied from `(marketing)/+layout.server.ts` so one place owns it:
      nothing when preview is on, otherwise
      `public, max-age=0, s-maxage=3600, stale-while-revalidate=60` plus
      `Vary: Accept-Language, Cookie`. Unit test the decision, including the
      preview case.
      **Done when:** `pnpm test` covers it; a local preview build answers `/`
      with the header and `/questionnaire/...` without it; and no `+page.server.ts`
      sets `cache-control` a second time.

- [x] **Step 5 - the mobile hero. Dropped on 2026-09-09, by the user, and nothing was built.**
      Measured against the asset rather than the markup, the phone is not
      over-served, it is under-served. The photograph is 1684x934, the narrow
      frame is portrait (390x780 on a common phone), and `object-cover` scales a
      landscape source by height, so it is drawn about 1406 CSS px wide. At DPR2
      that asks for 2813px; the widest candidate is 2560px, itself already an
      upscale of a 1684px original. The 199 KB is the largest file that exists,
      not waste.

      | Viewport | Frame | Drawn | Needs at DPR2 |
      | --- | --- | --- | --- |
      | 390x844 | 390x780 | 1406x780 | 2813px |
      | 430x932 | 430x868 | 1565x868 | 3130px |
      | 768x1024 | 768x960 | 1731x960 | 3462px |

      Two things already say so in the repository, and both were written after
      this went wrong once: the comment above `heroSizes` in
      `HeroSection.svelte`, which records that a width-shaped `100vw` here made
      the narrow hero soft, and `marketing-fidelity.spec.ts:38`, which asserts
      the exact `sizes` string as a lock.

      So a smaller file means a visibly softer hero, which is a design decision
      and not a performance fix. The only way to have both is a genuinely
      portrait photograph as a second Sanity field, rendered through `<picture>`:
      a cross-repository schema change and new artwork, not this fix.

      **Outcome:** the step is not built. `HeroSection.svelte`, its `sizes` and
      its preload link are untouched, and so is the spec that locks them.

## Testing

Three of the five steps carry logic, and those are the three that get tests, per
the scope rule in `coding-standards.md`.

| Step | Test |
| --- | --- |
| 2 | the Sanity client's config, in the shape `analytics/client.test.ts` already uses |
| 3 | that the light `loadQuery` returns the same `{ data }` shape the loader's does, and which requests take the heavy path |
| 4 | the cache-header decision, and `variesBy`, which is the half of it that decides correctness rather than speed |

Step 1 is configuration and rides on the build and the numbers in Verify.

`pnpm test:browser` matters here more than usual, because steps 3 and 4 can
break routing and preview without breaking a type. Run it once at the end.

## Verify

Local:

| Item | How |
| --- | --- |
| 1 | `pnpm build`, then `grep -r fra1 .vercel/output/functions` |
| 3 | the built server chunks no longer statically import the Studio graph; `du -sh` on the function directory |
| 4 | `pnpm preview`, then `curl -D - localhost:4173/` shows the header and the `Vary`, and the same on `/questionnaire/...` shows no `cache-control`. Check the port the preview actually bound to: a stale one takes 4173 and answers with an older build |
| 5 | nothing to verify, nothing was built |

After the deploy, the same measurements that opened this spec:

| Item | Expected |
| --- | --- |
| Region | `x-vercel-id` reads `::fra1::` |
| Cold start | eight parallel requests: the tail well under the 2.0 to 2.5 s measured today |
| Edge | a second request with no cookies answers `x-vercel-cache: HIT` |
| Language | a German browser with no cookie stays on `/`, an English one is sent to `/en`, and a cookie for either wins over both. Check that a cached `/` is never served to a cookie that disagrees |
| Sanity | publish an edit, redeploy, see it at once; without a redeploy expect up to an hour |

## Result

Four of the five steps built, on 2026-09-09. The fifth was dropped by the user
after its premise failed the arithmetic recorded above.

| Change | Where |
| --- | --- |
| The function renders in Frankfurt, not Washington | `vite.config.ts` |
| Published reads go through Sanity's CDN | `client.server.ts`, with `client.server.test.ts` locking the flag |
| The Studio leaves the server's static import graph | `hooks.server.ts`, `sanity/preview-request.ts`, `sanity/query.server.ts`, `sanity/client.ts`, `app.d.ts` |
| Marketing pages cache for an hour at the edge | `http/edge-cache.ts`, `(marketing)/+layout.server.ts` |
| `Vary` names what each response was decided from | `i18n/vary.ts`, applied unconditionally in `hooks.server.ts` |

Evidence:

| Check | Result |
| --- | --- |
| `pnpm check` | 2302 files, 0 errors |
| `pnpm test` | 506 passed, 45 files, including 12 new assertions across four files |
| `pnpm test:browser` | 199 passed, 3.4 min |
| `pnpm build` | passed, `"regions": ["fra1"]` in the function config |
| Server entry, static imports | `shared-server`, `runtime`, a 4 KB Sanity client chunk, SvelteKit. The Studio only through `import()` |
| Production preview | `/`, `/en`, treatments, learn and both questionnaire locales answer 200; `/preview/enable` 401, `/preview/disable` 307 |
| Headers | `s-maxage=3600` on marketing, none on the questionnaire; `Vary: Accept-Language, Cookie` on prefix-less addresses, `Vary: Cookie` on `/en/...` |

Three things this fix learned the hard way, all recorded above in full: a stale
`vite preview` on port 4173 answered several rounds of verification with an older
build; making `@sanity/client` a direct dependency externalised it and broke the
Studio's own load until `ssr.noExternal` restored the per-importer copies; and the
mobile hero was never over-served.

Not verified here, because it needs the deploy: that `x-vercel-id` reads
`::fra1::`, that the cold-start tail falls below the 2.0 to 2.5 s measured today,
and that a second cookie-less request answers `x-vercel-cache: HIT`.
