# Three corrections on the landing page, and a shorter article URL

**Type:** Fix

**Status:** verified

## The problem

Three unrelated things, reported from the running site rather than from a spec.

- **The results band drew hollow stars.** `StarRating`'s `outline` treatment sets every mark
  empty beside the score numeral, so the band read as an unfilled rating next to "4.9" while
  the hero above it drew five solid gold ones.
- **The projection section centred its column from `lg`.** The heading is set at the section
  scale in a half-width column, so between 1024px and the width the layout is drawn for, the
  centring produced a short orphaned second line hanging under a full one. Its lead also ran at
  `text-sm` where the section beside it uses `SECTION_LEAD`, and the chart legend and the
  disclaimer each followed a rule of their own, so the column never agreed with itself.
- **Articles lived at `/learn/blog/[slug]`.** The segment carried nothing: `/learn` is the
  Journal and everything under it is an article, so the path said "blog" inside a section
  already called Learn.

## The fix

- **The stars take `decorative`.** That is the prop for a rating restated beside a printed
  score, and it does two things at once: it fills the marks in `--primary`, the hero's own
  gold, and it hides them from assistive tech, which had been announcing "4.9" and then "4.9
  out of 5 stars". The gold has less contrast on the pale `--highlight` ground than the
  `--highlight-foreground` the component would otherwise pick, which is a deliberate choice:
  they duplicate a figure that is printed beside them, so they carry nothing of their own.
- **One rule for the projection column.** The heading, lead, legend and disclaimer all centre
  from `2xl` and are left-aligned below it. `2xl` is 96rem, which is `--container-site`, so the
  centring begins exactly where the layout stops growing. The legend is a flex row and ignores
  `text-align`, so it carries the breakpoint itself rather than inheriting it. The lead moves
  to `SECTION_LEAD`, the ladder the section beside it already uses.
- **`/learn/[slug]`, and `blog/` is gone.** Not a redirect: the deployment is `noindex`, the
  public domain is not chosen, and nothing outside the repository links to those paths yet, so
  the old URLs are left to 404 rather than carrying a segment forward that was asked to be
  removed. Every place that built the path moves with it, and `pathFor` remains the only place
  an article URL is spelled.

### What it must not break

- **The SEO surfaces all derive from `pathFor`**: the canonical, the hreflang alternates, the
  sitemap and IndexNow's `urlsToNotify`. They cannot drift from the route, but they are exactly
  what a wrong change here would silently corrupt, so the browser sweep over every sitemap URL
  is the check that matters.
- The `PUBLIC_PAGE_ROUTES` allowlist is keyed by route id, so a renamed route that is not
  updated there stops being indexable rather than failing loudly.

## Build steps

- [x] **Step 1 - The three corrections.** The stars, the projection column, and the route with
  every reference to it: the path builders, the indexing allowlist, the article's own
  breadcrumb, two dev surfaces, and the unit and browser tests that name the old path. The two
  browser tests that asserted the old URLs go with them. *Done when:* the band's stars match
  the hero's, the projection column is left-aligned below 1536 with its lead at the neighbouring
  size, and no file under `src/` or `e2e/` mentions `blog`.

- [x] **Step 2 - The documentation the rename makes wrong.** The route tables in
  `project-overview.md`, the page list in `project-plan.md`, and feature 6's line in the build
  plan, which keeps its history by naming the path it shipped under. *Done when:* no planning
  document describes a route that no longer exists.

## Verify

- `pnpm verify`, then `pnpm test:browser` in full. The URL change touches the canonical, the
  alternates, the sitemap and IndexNow, and `e2e/seo.spec.ts` sweeps every URL the sitemap
  lists, so that suite is the one that proves this rather than a spot check.
- Compare the band's stars against the hero's on one screen, and the projection column at
  1280 and 1536.

## What the checks actually said

- `pnpm verify`: 854 unit tests, clean typecheck, clean build.
- The route-sensitive suites are the ones that matter here, and they are green:
  `journal`, `seo` and `locale` together, 84 passed; `seo-enabled`, `accessibility` and
  `marketing-viewport`, 51 passed; `checkout-handoff`, 8 passed; `analytics`, 8 passed.
- **Four failures survive and all four are `main`'s**, each verified there by stashing this
  work: two questionnaire viewport heights, identical to the pixel (901 against 900, 1113
  against 1040), and two marketing-fidelity assertions, the results band's divider measuring
  60px where 48px is expected and the image-density array.
- `marketing-fidelity.spec.ts:331` had to change with the stars, and now stops on that same
  pre-existing divider assertion rather than on the rating. The test had pinned the old
  treatment exactly: `role="img"` with a rating name, and `fill: none`.
- **One flake seen and identified**, not repaired: `accessibility.spec.ts` reported a serious
  colour-contrast violation on the allergies screen once, then passed twice on the same code.
  It is the entrance-animation race this project has recorded before, where axe measures an
  element mid-fade. Nothing in this work touches that screen.
- Several runs timed out at 30s while the machine carried a load average above 30 from
  unrelated system processes. Every one of them passed when re-run on a quiet machine, so they
  are recorded here as noise rather than as findings.

## Out of scope

- Redirects from the old article URLs, declined above with the reason.
- `performance-baseline.md`, which records what was measured at the time under the path it was
  measured at, and the Pencil export, which is a reference artifact.
- The projection's own figures, the chart, and the horizon tabs.
