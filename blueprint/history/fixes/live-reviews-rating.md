# A live Reviews.io rating, and the platform named

**Type:** Fix
**Status:** verified

## The problem

The rating badge shows invented figures, and the user wants the platform's name
printed on it.

`content.ts:152-162` is explicit about why the name is absent today:

> Fictional prototype figures. The reference attributes these to a named
> third-party review platform; inventing numbers under a real company's name is
> not something the prototype should ship, so the badge stands on its own.

So printing "Reviews.io" beside **4.7** and **1,200+ reviews** would do exactly
what that comment refuses. The real profile answers different numbers:

| | Shown today | Reviews.io, checked 2026-09-01 |
| --- | --- | --- |
| Score | 4.7 | **4.86** (their own page rounds it to 4.9) |
| Volume | 1,200+ reviews | **104** |

The name already leaks anyway: `RATING.href` points at the real profile, the
badge's `aria-label` says "Read reviews on Reviews.io", and `RATING.reviewCount`
reads "1,200+ reviews on Reviews.io". A screen reader is told the platform's name
beside numbers that platform does not report.

## The fix

Read the figures from Reviews.io at request time, and print the name.

**The endpoint is public and needs no key**, verified twice:

```
GET https://api.reviews.io/merchant/reviews?store=www.solean.com&per_page=1
-> {"stats":{"total_reviews":104,"average_rating":"4.86"}, ...}   200, ~0.1s
```

**Read on the server, in a `+page.server.ts` load for the landing route.** The
marketing routes have no load functions today and nothing is prerendered
(`vite.config.ts` pins `adapter-vercel`, no `prerender` export anywhere), so the
page is server-rendered per request and this is a real choice, not a workaround:

- no CORS, and no third-party request on the browser's critical path
- the numbers are in the server-rendered HTML rather than appearing after paint
- `setHeaders` caches the response at the CDN, so the shop's own traffic does not
  become traffic on Reviews.io

**Three failure rules, because this is someone else's service on our homepage:**

1. A timeout on the fetch. A hanging Reviews.io must never hang the landing page.
2. Any failure, any unparseable body, falls back to figures kept in `content.ts`.
3. **The fallback figures become the real ones** (4.9 and 104). Falling back to
   invented numbers under the platform's name is the same defect this fix exists
   to remove.

Displayed as one decimal, matching how Reviews.io itself renders 4.86.

Must not break:

- The star geometry. `StarRating` fills `Math.round(rating)`, so 4.86 fills five
  stars exactly as 4.7 did.
- `HeroRatingBadge`'s dark-surface contrast, and the results band's outline stars
  on the warm ground.
- `e2e/marketing-fidelity.spec.ts`, which measures the hero badge.

## Build steps

### Step 1 - the client and its tests  - [x]

- `src/lib/features/marketing/reviews.ts`: parse a Reviews.io stats body into
  `{ score, total }` or null, and format the label.
- `reviews.test.ts` beside it. The test gate is on and this is exactly the
  in-scope kind of logic: a parser with real edge cases. Cover a good body, a
  missing `stats`, a non-numeric `average_rating`, a score outside 0 to 5, a zero
  count, and the rounding of 4.86 to one decimal.

**Done when:** `pnpm test` passes with the new cases, and no component imports it
yet.

### Step 2 - the server load  - [x]

- `src/lib/features/marketing/reviews-client.ts`: the fetch, with an abort
  timeout, returning the parsed rating or null.
- `src/routes/(marketing)/+page.server.ts`: call it, `setHeaders` a CDN cache,
  return `rating`.

**Done when:** loading `/` in the preview server-renders the live figures, and a
blocked or slow reviews.io still renders the page with the fallback within the
timeout. Both observed, not reasoned about.

### Step 3 - the badge and the band  - [x]

- Thread the rating from the page into `HeroSection` and `ResultsBand`, both of
  which import `RATING` directly today.
- Print "Reviews.io" before the stars in `HeroRatingBadge`, and keep the
  `aria-label` naming the platform once rather than twice.
- Update `RATING` in `content.ts`: real fallback figures, and the label built
  from them rather than hardcoded.

**Done when:** the hero badge reads "Reviews.io" then five stars then the live
score and count; the results band's numeral and its line agree with the badge;
and both at 390px and 1280px.

## Verify

- `pnpm test` green, including the new parser cases.
- `pnpm build` before the commit.
- `pnpm test:browser` green, especially `marketing-fidelity.spec.ts`.
- In the preview: `/` shows the live figures, and with the endpoint blocked it
  shows the fallback without stalling.
- The `aria-label` on the badge names the platform once and reads sensibly.
