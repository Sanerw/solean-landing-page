# Fix: the medical reviewer becomes optional, and the article stops claiming a review that did not happen

**Type:** Fix
**Status:** verified

## The problem

`reviewer` and `reviewedAt` are `rule.required()` on the `article` document, so
an article cannot be published without naming a clinician who signed it off.
Five imported drafts have no reviewer, and the decision is to publish them
unreviewed rather than attribute a review nobody performed.

Relaxing the schema alone would ship a broken page, and one of the two failures
is already reachable today.

**One consumer is unguarded.** `ArticleHero` and `FeaturedArticleCard` both check
for a reviewer before drawing anything, and the hero even drops the divider
before the read time. `ArticleReviewNote` checks nothing:

- it prints `Geprüft von {reviewer}` with an empty name, so the sentence reads
  "Geprüft von . Nächste Prüfung fällig am"
- it formats the empty date, and `Intl.DateTimeFormat.format(new Date('T00:00:00Z'))`
  throws `RangeError: Invalid time value` rather than printing anything

The second one is a **500 on the article page, not a missing line**, and it does
not need this change to happen. `nextReviewAt` has never been required, so an
editor who leaves "Next review due" empty crashes the published article today.
`from-sanity.ts` turns that absence into `''` with a `?? ''`, which is what hides
it from the type system.

**And the Journal's order depends on the date.** `articlesQuery` orders by
`reviewedAt desc`, and that order decides the featured card and what the
previous and next article mean at the foot of a page. Articles without a date
sort wherever GROQ puts nulls.

## The fix

Make the absence visible to the compiler, render honestly when it is there, then
relax the schema. In that order, so the schema is never looser than the page can
survive.

- `Article['review'].nextReviewAt` becomes optional and the mapper stops
  coercing it to `''`. The empty string is the bug: it turns "no date" into
  "a date that is blank", which typechecks and then throws.
- `ArticleReviewNote` renders **nothing at all** without a reviewer, and drops
  the date clause without a `nextReviewAt`. The site claims a clinical review in
  that panel, with a shield and "Fachlich auf Richtigkeit geprüft"; an article
  nobody reviewed must not make the claim rather than make it with a blank name.
- The Journal falls back to `_createdAt` when there is no `reviewedAt`, so an
  unreviewed article still has a defined place in the order.
- Only then, `reviewer` and `reviewedAt` stop being required in the Studio.

**What it must not break:** the existing Mounjaro vs Wegovy article has both
fields, so its review note, its hero credit and its Journal card must look
exactly as they do now.

## Build steps

- [x] **Step 1 - The page renders honestly without a review** - `nextReviewAt`
  optional through the type and the mapper; `ArticleReviewNote` guarded on the
  reviewer and, separately, on the date, with a new undated message in both
  catalogues; `articlesQuery` ordered by `coalesce(reviewedAt, _createdAt)`.
  *Done when:* `pnpm test` covers the mapper leaving an absent `nextReviewAt`
  undefined rather than blank; `pnpm check` is clean; the existing article still
  draws its review note unchanged; and an article with the reviewer blanked in
  the local fixture draws no review note and no 500, checked in a browser.

- [x] **Step 2 - The Studio lets it through** - `required()` off `reviewer` and
  `reviewedAt` in `article.ts`.
  *Done when:* `npx sanity schema validate` passes; the Studio shows no
  validation error on an article with neither field; `pnpm test:browser` and
  `pnpm build` are green.

## Verify

- The published article at `/learn/blog/mounjaro-vs-wegovy` and
  `/en/learn/blog/mounjaro-vs-wegovy` is unchanged: the green review note still
  closes the reading column, naming the reviewer and the next review date.
- With the fixture's reviewer removed, the same page renders the whole article
  and simply has no review note, rather than an empty name or an error.
- The Journal at `/learn` still features the newest article.
- In the Studio, one of the five imported drafts can be published with the
  Evidence tab empty.

## Notes for the AI

- **The claim is the point.** This is a medical site; the panel says an article
  was clinically checked. Dropping the panel when nobody checked it is the fix.
  Printing "Reviewed by" with nothing after it would be worse than the crash.
- `formatArticleDate` stays strict. It is not the formatter's job to invent a
  date for a caller that has none, and the call site now cannot reach it without
  one.
- Two repositories: `article.ts` is in `../studio-solean`, with its own prettier
  settings (no semicolons, single quotes, no bracket spacing).
- Publishing the five drafts is the user's action in the Studio, not this fix's.
