# Feature: Legal pages and real contact details

**From build-plan:** feature 18
**Status:** verified

## Goal

Serve the four legal documents Solean already publishes, and put the real support
address, telephone number and service hours in the footer.

Today the footer prints **Privacy**, **Terms** and **Accessibility** as plain
text with `inert: true`, no route behind any of them, and the contact block shows
`contact@solean.com` and `+49 111 111 111`, which is a placeholder. For a
German-market medical service, an Impressum and a Widerrufsbelehrung are not
polish; they are the pages a regulator and a customer both look for first.

## Design reference

None. These are prose documents, not a visual target. They take the same reading
column and type roles the Learn article already uses, so the site looks like
itself without a mockup to match.

## In scope

- The four documents, copied **verbatim** from what Solean publishes, in German.
- Four routes under `(marketing)`, on English paths.
- The footer's legal row: four real links in place of three inert labels.
- The real e-mail, telephone and service hours.

## Out of scope

- **Translating them.** The documents are German and stay German, by the user's
  decision. They name a German company, German law and German authorities, and a
  translated legal text is a different document.
- **Editing them.** No summarising, no restructuring, no "improving" the wording.
  What is copied is what Solean publishes.
- Bilingual routing. That is feature 19.
- A cookie or consent banner, and anything the privacy policy describes but the
  site does not yet do.
- The Dutch-worded pharmacy badge in the footer, noticed earlier and left alone.

## Content, and where it comes from

Fetched 2026-09-01 from `https://solean.com/policies/...`, extracted from the
`shopify-policy__body` element alone:

| Route | Document | Source slug | Text |
| --- | --- | --- | --- |
| `/legal-notice` | Impressum | `legal-notice` | 1.2k chars |
| `/privacy` | Datenschutz | `privacy-policy` | 46.6k chars |
| `/terms` | AGB | `terms-of-service` | 35.2k chars |
| `/returns` | Widerrufsbelehrung | `refund-policy` | 3.3k chars |

Two things worth knowing before building:

1. **`/returns` is named after the user's own wording**, but the document is a
   *Widerrufsbelehrung*, the statutory right of withdrawal, not a returns policy.
   `/cancellation` would describe it better. Flagged, not decided unilaterally.
2. **The Impressum gives a different address** from the contact page read
   earlier: *Lippmannstraße 8, 22769 Hamburg* in the Impressum against
   *Baumwall 5, 20459 Hamburg* on `/policies/contact-information`. Only the
   Impressum's is copied, because that is the document that carries the address
   in law. Nothing in our footer prints an address, so this changes nothing here;
   it is recorded because the discrepancy is Solean's to resolve.

The documents carry no headings at all: `h2` to `h4` appear zero times in every
one of them. Sections are marked with `strong` and, in the privacy policy, `u`.
So there is nothing to build a table of contents from, and none is faked.

## Data / contracts

Content is data, not markup, so nothing is rendered through `{@html}`:

```ts
interface LegalSpan { text: string; bold?: boolean; underline?: boolean; href?: string }
type LegalBlock =
  | { kind: 'paragraph'; spans: LegalSpan[] }
  | { kind: 'list'; items: LegalSpan[][] };

interface LegalDocument {
  title: string;          // the German document title
  updated?: string;       // "Stand 15.01.2025", where the document states one
  source: string;         // the solean.com URL it was copied from
  blocks: LegalBlock[];
}
```

**Load-bearing.** Feature 19 will need every one of these strings to have a
locale, so keeping the text in data rather than in markup is what makes that
possible without rewriting the pages.

## Build steps

- [x] **Step 1 - the model, the renderer and one document** - add the types, the
  `LegalPage` component, and the Impressum, which is the smallest of the four at
  1.2k chars and so the one whose diff can be read in full. Wire `/legal-notice`.
  *Done when:* `/legal-notice` renders the Impressum with its line breaks, its two
  links and its bold run intact, matching the source page read side by side, at
  390px and 1280px.

- [x] **Step 2 - the remaining three documents** - the privacy policy, the AGB and
  the Widerrufsbelehrung, plus their routes. The diff is bulk generated data on a
  shape approved in step 1, so review is a spot check against the source rather
  than a full read: that is stated here so nobody pretends 85k characters were
  proofread in a review gate. *Done when:* all four routes render, each document's
  first and last paragraph match the source exactly, and the paragraph count per
  document matches the source's.

- [x] **Step 3 - the footer** - four real links in place of the three inert
  labels, `Accessibility` removed, and the real `support@solean.com`,
  `+49 40 87709420` and service hours Monday to Thursday 9:00-17:00, Friday
  9:00-16:00. *Done when:* each footer link navigates to its document, the mail
  and telephone links carry the real values, and no inert legal label remains.

## Files / areas

- `src/lib/features/legal/types.ts`, `LegalPage.svelte`
- `src/lib/features/legal/content/{legal-notice,privacy,terms,returns}.ts`
- `src/routes/(marketing)/{legal-notice,privacy,terms,returns}/+page.svelte`
- `src/lib/features/marketing/content.ts` - `CONTACT`, `FOOTER_BRAND.legal`
- `src/lib/features/marketing/SiteFooter.svelte` - the legal row stops being inert

## Testing

`pnpm test` is declared, so the gate is on. **There is no in-scope logic here:**
the content is data, the renderer is a component, and the routes are static.
Nothing parses, validates or computes. Per the Testing section of
`coding-standards.md` this rides on browser evidence and the build, and no unit
test is invented to satisfy a gate that does not apply.

`pnpm test:browser` is declared, and this feature earns focused coverage, because
"the footer links reach the documents" is exactly the stable behavioural claim a
harness is for:

- each footer legal link resolves to a page whose heading is that document's title
- no legal label in the footer renders as inert text
- the four routes return 200 and render more than a heading

Verification per step is in the done-whens. The whole feature also gets a read at
390px and 1280px, because a wall of German legal prose is a real typographic
test of the reading column.

## Notes for the AI

- **Do not edit the text.** Not to fix a typo, not to modernise a phrase, not to
  shorten a sentence. It is a legal document belonging to someone else.
- The extraction must not swallow solean.com's own chrome. An earlier attempt did
  exactly that, because void elements have no end tag and the scope never closed.
  Whatever generates this content must be checked against that failure.
- Every document keeps a comment naming its source URL and the date it was
  copied, so the next person knows what to diff against.
- The pages are German while the shell around them is English. That is a known
  seam and feature 19 closes it.
