# Performance baseline

Measured 2026-09-09 on the local production preview, at the end of feature 28d. This is a
record, not a budget: nothing fails a build for missing a number here, and turning one into a
threshold is a later decision.

**Feature 28d changed no code to improve these numbers.** A change justified by a measurement
goes through `/fix` as its own reviewed diff, so that a measurement and a refactor never land
together where neither can be judged.

## What was measured

| Page | Requests | HTML | JS | CSS | Fonts | Images | Total | TTFB | FCP | DOMContentLoaded |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 59 | 36.7 KB | 4.2 KB | 20.3 KB | 36.1 KB | 4.0 KB | **101 KB** | 47 ms | 192 ms | 101 ms |
| `/learn` | 49 | 17.9 KB | 7.3 KB | 20.3 KB | 36.1 KB | 21.6 KB | **103 KB** | 14 ms | 120 ms | 30 ms |
| `/learn/blog/mounjaro-vs-wegovy` | 58 | 26.4 KB | 15.6 KB | 41.9 KB | 141.8 KB | 1.5 KB | **227 KB** | 20 ms | 136 ms | 40 ms |
| `/treatments/mounjaro` | 55 | 26.4 KB | 25.9 KB | 20.3 KB | 43.8 KB | 29.8 KB | **146 KB** | 16 ms | 144 ms | 35 ms |
| `/privacy` | 38 | 50.1 KB | 34.5 KB | 20.3 KB | 36.1 KB | 0 | **141 KB** | 25 ms | 128 ms | 41 ms |
| `/questionnaire` | 59 | 4.7 KB | 341.5 KB | 20.0 KB | 36.1 KB | 0 | **402 KB** | 6 ms | 60 ms | 20 ms |

Sizes are **transferred** bytes, so compressed. The build's own report gives the uncompressed
figures, where the client output totals about 10 MB across all chunks; almost none of that is on
any one page, because the large chunks are dynamically imported.

## How to reproduce it

```
pnpm build
node e2e/fixture-server.mjs &
PUBLIC_SITE_URL=http://localhost:4198 PUBLIC_SANITY_API_HOST=http://localhost:4319 \
  pnpm preview --port 4198 --strictPort &
node scripts/measure-baseline.mjs
```

`scripts/measure-baseline.mjs` drives Chromium through Playwright, which is already installed,
and reads `request.sizes()` for each response. It is deliberately not part of `pnpm verify` or
of any browser project: it needs a server somebody started, it reaches the Sanity CDN, and its
numbers depend on the machine.

## What these numbers are not

Read this before comparing two runs, or before quoting a figure to anyone.

- **Not the deployed site's numbers.** There is no network latency here, no Vercel edge, no cold
  start. `project-overview.md` records 2.0 to 2.5 seconds of cold start measured against the
  real deployment, which no local run reproduces. TTFB of 6 to 47 ms is the loopback interface,
  not a visitor's connection.
- **Not a Lighthouse score.** No throttling, no scoring model, no field data. A Lighthouse run
  against localhost would produce a number that cannot be acted on, which is why no measurement
  dependency was added for one.
- **Image weight is understated.** Most photographs are below the fold and lazily loaded, and
  the measurement stops at `networkidle`. The home page's 4 KB of images is what loaded before
  the page went quiet, not what a reader who scrolls will fetch.
- **Run-to-run variance is real.** Font and JS figures move between runs as Chromium's
  prefetching decides differently. Treat a change under roughly 20% as noise.
- **The fixture serves the content.** Sanity's own API is not in the path, so a slow Content
  Lake response is invisible here. The photographs do come from the real CDN.

## The one number worth looking at

**`/questionnaire` transfers 341 KB of JavaScript**, four to eighty times any other page. That is
`survey-core`, which runs headless to apply RxScale's `visibleIf` and `validators` from the
committed snapshot. It is the entry to the medical funnel and the most valuable page on the
site, so it is also the page where weight costs the most.

Nothing is being claimed about whether that is too much: 341 KB compressed on a modern connection
is not obviously a problem, and the page's own FCP here was the fastest of the six. It is
recorded because it is the largest single figure in the table and because any future performance
work should start by looking at it rather than at the marketing pages.

## Measuring the real thing, after launch

The measurement that matters needs the deployed site on the real domain. When that exists:

1. Run PageSpeed Insights against the live URLs, which reports both a lab run and, once there
   is traffic, Chrome UX Report field data.
2. Watch Vercel's own analytics for cold starts, which are the number `fra1` was pinned for.
3. Re-run `scripts/measure-baseline.mjs` against the deployment rather than localhost by passing
   the origin as an argument, for a like-for-like comparison with this table.

None of that has been done. It needs a domain, and the domain is not chosen.
