# Journal listing at /learn

**Type:** Fix

**Status:** verified

## The problem

`/learn` is not a page. Both it and `/learn/blog` are 307 redirects to the newest article, so
the navigation's Learn link and the home page's hero teaser drop a reader straight into one
article and there is nowhere for a second one to appear.

The reference at `/Users/work/Code/hero-export/blog-export/solean_ecommerce-export (1).html`
draws that missing page as the Solean Journal: a sand hero panel with an eyebrow, heading and
lead; a large featured-article card over its own photograph with a gold badge, title, summary,
reviewer, read time and tags; then an "Articles & resources" band with category chips and a
three-card grid.

## The fix

Build the page. The article keeps living in Sanity.

Moving the article's content into the repository was considered and dropped on 2026-09-04. It
would have reversed feature 20's stated purpose, "so an editor can publish a second article
without a deploy", and this codebase makes it worse than that: an article's `reviewer` is a
reference to a `clinician` document, and clinicians have to stay in Sanity because the landing
page's clinical-team carousel renders them. A local article would hold a second copy of Dr.
Juraj Galan that drifts from the one the home page shows. The listing page never needed the
move, so the move is not made.

- `/learn` renders the Journal between the existing header and footer, reading the article list
  from Sanity through the `articlesQuery` that already exists. The announcement bar, navigation,
  mobile menu and footer are not touched, and the article page keeps its current design and its
  own Sanity read.
- **One article today, and the page says so honestly.** The newest article is the featured card.
  The three-card grid and the category chips render only when a second article exists, so a
  filter over a single item is never drawn and an empty grid never ships.
- `/learn/blog` stops redirecting into an article and redirects to `/learn`.
- The Journal's own copy (eyebrow, heading, lead, badge, labels) lives in the Paraglide
  catalogues in both languages, like the rest of the site chrome. Article copy stays Sanity's.
- Colours map to the existing semantic tokens per `blueprint/reference/design-system.md`. The
  reference's `#F7F5EE` panel and `#B07E12` eyebrow are matched to tokens, not pasted in as raw
  values.
- The export's navigation says "Juniper" and its footer "About Voy". Those are the recorded
  reference errors and are never transcribed. Neither surface is in scope anyway.

## Build steps

- [x] **Step 1 - `/learn` becomes the Journal page.** Replace the redirect with a load that
  reads the article list, and build the reference's hero panel and featured-article card,
  responsive at 390, 768 and 1440, in both languages. Point `/learn/blog` at `/learn`. Add
  browser coverage for the page and the featured card's destination. *Done when:* `/learn` and
  `/en/learn` render the Journal, the featured card opens the article, and the home page's hero
  teaser lands on the Journal rather than inside an article.

- [x] **Step 2 - The articles band, and the rule that hides it.** Add the "Articles & resources"
  header, the category chips and the card grid, all rendered only when a second article exists.
  Unit test the split between the featured article and the rest, since it is the rule that
  decides whether any of it is drawn. Assert in the browser that none of it is in the
  accessibility tree today. *Done when:* one article draws no chips and no grid, and the unit
  test proves the split for two and for none.

## Verify

- Run `pnpm check`, `pnpm test`, `pnpm test:browser` and `pnpm build`.
- Inspect `/learn` and `/en/learn` at `390x844`, `768x1024` and `1440x900` against the reference.
- Confirm the article page, the home page, the navigation and the footer are unchanged.

## Out of scope

- The announcement bar, navigation, mobile menu and footer.
- The article page's own design and its data source.
- Moving any content out of Sanity, and any Studio change.
- A second article, real category filtering, and search.
- The legal pages, checkout performance and the recommendation screen.
