# Fix: the treatments CTAs reach a page that exists, in the reader's language

**Type:** Fix
**Status:** verified

## The problem

Two call-to-action buttons on the landing page link to `/treatments`. There is no
such route: `src/routes/(marketing)/treatments/` holds `[slug]` and nothing else,
because the index is one of the undesigned routes in the deferred backlog. Both
buttons are therefore live links to a 404.

| File | Button |
| --- | --- |
| `HeroSection.svelte:135` | the hero's secondary CTA, drawn from `sm` up |
| `MedicalFraming.svelte:51` | the medical-framing secondary CTA |

Both are also written as a bare `href="/treatments"` rather than through
`localizeHref`. `content.ts` states the rule this breaks: German is the base
locale and owns the bare path, so an unprefixed internal link does not mean
"this page in the reader's language", it means the German page, and following it
switches an English reader's language mid-visit.

`MedicalFraming` carries the comment "Inert, matching how the hero treats the
same destination until it exists". That is not what the code does. Neither button
is inert; both render as `Button href=`, which is an anchor.

The nav parent and the footer entry point at the same destination and **are**
genuinely `inert: true`. They are correct and stay as they are.

## The fix

Send both buttons to the Wegovy Pill treatment page, through `localizeHref`.

`ROUTES` gains a `treatment(slug)` builder beside `learnArticle`, and the three
places that assemble a treatment href by hand use it. That is the smaller half of
the fix but the part worth keeping: a path spelled out at four call sites is four
places to forget the prefix, which is how this bug happened.

**What it must not break:** the nav parent and the footer entry stay inert, and
`treatments.spec.ts` asserts the parent is not a link because its index does not
exist. That assertion stays true: this fix does not add an index, it points two
buttons at a product page that already works.

## Build steps

- [x] **Step 1 - Both CTAs reach Wegovy Pill in the reader's language** -
  `ROUTES.treatment(slug)`, used by the nav children, the plan comparison and the
  two CTAs; both CTAs localised and pointed at `wegovy-pill`.
  *Done when:* at 1440 on `/en` the hero's secondary CTA and the medical-framing
  CTA both carry `href="/en/treatments/wegovy-pill"`, and on `/` both carry
  `/treatments/wegovy-pill`; following either lands on the Wegovy Pill page with
  a 200; the treatments nav parent is still not a link; `pnpm test`,
  `pnpm check`, `pnpm build` and `pnpm test:browser` pass.

## Verify

- `/en` at 1440: click the hero's second button and the one under the
  medical-framing panel. Both should open Wegovy Pill, still in English.
- `/` at 1440: the same two buttons stay on the German path.
- The Treatments item in the header is still plain text with a dropdown, not a
  link.

## Notes for the AI

- `localizeHref` at the call site, never inside `ROUTES`: the table is a module
  constant evaluated once at import, while the locale belongs to the request.
- The button labels do not change. "Explore treatments" pointing at one product
  is the user's decision, taken because the index does not exist yet.
- This is the CTA half of a larger piece of work. Moving the treatment page
  content and its prices into Sanity is a separate build-plan feature, specced
  after this lands.
