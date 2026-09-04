# Legal pages from Sanity, in German and English

**Type:** Fix

**Status:** verified

## The problem

The four documents in the footer are hard-coded TypeScript in
`src/lib/features/legal/content/`: 545 lines of verbatim copy from solean.com, German only.
Two consequences:

- **There is no English version.** `/en/privacy` serves the German text with `lang="de"` on the
  article, which feature 19 left as a deliberate seam rather than an oversight.
- **Every correction is a deploy.** When Solean amends a document at the source, someone has to
  re-import it by hand and ship a release.

## The decision this carries, recorded before it is made

The repository says twice, in two places, that this text is not ours to rewrite. Every content
file opens with *"Not ours to edit: no rewording, no reformatting, no corrections"*, and
`project-overview.md` states *"legal text is not ours to paraphrase"*.

An English translation is a paraphrase, and two of these four documents are operative:
`/returns` is a Widerrufsbelehrung, where German law supplies a model wording whose verbatim use
is a safe harbour and whose loss can extend the withdrawal period from 14 days to twelve months
and fourteen days under section 356(3) BGB; `/legal-notice` carries the statutory Impressum
content.

This was raised on 2026-09-04 with three options: an informational English version carrying a
notice that the German is authoritative, infrastructure only, or English as a full operative
document. **The user chose the third, knowing the above.** The translation is therefore produced
here and published without a precedence notice.

What does not follow from that choice: nothing in this repository claims the English text has
had legal review, because it has not. That record lives here, in the archive this fix leaves
behind. Replacing the translation with a lawyer-approved one is an edit in the Studio rather
than a deploy, which is the point of the move.

## The fix

Four documents, two languages, on the routes that already exist.

- A `legalPage` document type in `../studio-solean` mirroring the existing `LegalDocument` shape
  block for block. **Not Portable Text**: `types.ts` records that an address block separates its
  lines with `br` inside one paragraph on purpose, and that flattening those into paragraphs
  would space an Impressum apart like prose. Mirroring the shape keeps `LegalPage.svelte`
  untouched, which also keeps the four pages looking exactly as they do now.
- Eight documents, `legalPage-<slug>-<language>`: the four German ones seeded verbatim from the
  current TypeScript, then the four English translations.
- The four routes read their document by slug and locale. `lang` on the article becomes the
  document's own language instead of the hard-coded `de`, which is the seam feature 19 left.
- Sanity becomes a hard dependency of these pages, as it already is of the home page and the
  Learn article: an unreachable Content Lake 500s them rather than serving a stale copy. That is
  the architecture this project already has, and inventing a fallback layer for four pages that
  no other page has would be the larger change.
- Navigation, footer, links, routes, page design and `LegalPage.svelte` are untouched.

**Seeding writes to the production dataset.** The app's own token is read-only, so the import
runs through the Studio's authenticated CLI. That is an outward-facing change to shared content
and needs a separate yes in the chat before it runs, per step.

## Build steps

- [x] **Step 1 - The `legalPage` type in the Studio.** Add the document type and its structure
  entry in `../studio-solean`, mirroring `LegalDocument` including the span marks and the
  line-within-paragraph shape. Nothing in the app changes.
  *Done when:* the Studio builds and offers Legal pages beside Home page, Clinicians and
  Testimonials.

- [x] **Step 2 - Seed the four German documents.** Generate the documents from the existing
  TypeScript and import them, then read them back and assert they round-trip to the same blocks.
  *Done when:* the four German documents are in the dataset and a comparison against the local
  modules reports no difference.

- [x] **Step 3 - The four English translations.** Translate each document and seed it as its
  `-en` counterpart. *Done when:* the four English documents
  exist and each has the same block count and structure as its German counterpart.

- [x] **Step 4 - The routes read Sanity.** Point the four pages at the query, take `lang` from
  the document, teach the fixture server the legal query, and extend `legal-pages.spec.ts`
  across both languages. *Done when:* each route serves its German document at the bare path and
  its English one under `/en`, with the article's `lang` matching, and the pages look unchanged.

- [x] **Step 5 - Retire the local content modules.** Delete
  `src/lib/features/legal/content/*.ts` once nothing reads them. *Done when:* no route imports
  them and the four pages still serve.

## Verify

- Run `pnpm check`, `pnpm test`, `pnpm test:browser` and `pnpm build`.
- Build the Studio in `../studio-solean`.
- Open all eight pages: `/privacy`, `/terms`, `/returns`, `/legal-notice` and each under `/en`.
- Confirm the footer links, the page design and the header are unchanged.

## Out of scope

- Rewording the German text. It stays verbatim, including the recorded gap where the privacy
  policy does not yet mention Mixpanel, session replay or heatmaps: `AGENTS.md` says that gap is
  Solean's to close at the source, and moving the document into a CMS does not change that.
- Any fallback layer for an unreachable Content Lake.
- The navigation, footer, links, routes and page design.
- Checkout performance and the recommendation screen.
