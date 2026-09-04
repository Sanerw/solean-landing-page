# Checkout stops reading the recommendation a second time

**Type:** Fix

**Status:** verified

## The problem

Pressing the order button takes about 4.25 seconds before the browser leaves for Shopify.
Measured on 2026-09-04 against the live services, three runs each:

| Call | Time |
| --- | --- |
| RxScale, recommendation | ~4.1 s (TTFB 3.9-4.35 s) |
| Shopify Storefront | ~0.15 s |
| Our own `/api/recommendation`, end to end | 3.92-4.05 s |

The document is 1.17 MB, but that is not the cost: time to first byte is 4.35 s of a 4.46 s
total, so about 4.1 s is RxScale computing the answer before sending a byte, and roughly 0.1 s
is the transfer. Compressing or trimming the response would buy nothing.

The read happens twice per visit: once on entry to the recommendation screen, where a loading
state covers it, and again inside `allowedVariant` on the click, where nothing covers it.

## The decision this carries, recorded before it is made

The second read is deliberate and `recommendation.ts` says so: *"Read on entry […] and again on
the order, because the answer is RxScale's and can change between the two. Never cached: a
stale verdict would offer a dose a doctor has since ruled out."*

It also carries a second property, which `project-overview.md` states at lines 401-403: *"The
variant the browser names is a request, not an authorisation. `/api/checkout` reads the
recommendation again and refuses a variant that is not in it, so the endpoint cannot be used to
order arbitrary merchandise."*

Both were raised on 2026-09-04, with three options: cache the first read and keep the check,
remove the read and the check, or sign the allowed list at the first read. **The user chose the
second, knowing that `/api/checkout` is public and that after this change anyone can create a
Shopify cart for any variant in the shop against any anamnesis uid.**

What this does not change: the checkout still carries the anamnesis as the order attribute, the
cart is still created on the click alone, and RxScale still validates the submission itself. A
cart is not an order, and payment still happens in Shopify.

## The fix

- `allowedVariant` and its call to `fetchRecommendation` leave `cart.ts`. The variant the
  browser sends is used as it arrives.
- The fallback stays and keeps its meaning: when the browser names no variant,
  `SHOPIFY_VARIANT_ID` is what the cart carries. With neither, the answer is `not-configured`,
  as it is today.
- `not-recommended` becomes unreachable, so it goes: from the failure union, the status map,
  the browser's `FAILURES` list and its copy. A reason no code can return is a message no
  visitor can read.
- `fetchRecommendation` itself stays. `/api/recommendation` is its only caller now, and the
  screen still reads it on entry, so what a person is offered is still RxScale's answer.
- `project-overview.md` lines 401-403 are rewritten to say what the endpoint now does. Leaving
  the old promise would be worse than the change itself. Two more stale claims turned up while
  doing it and go with them: the same file's "the same read validates the order", and
  `recommendation.ts`'s header calling that validation one of its two reasons for being
  server-side.
- `recommendation.ts`'s own comment about being read twice is corrected for the same reason.
- **One browser test is deleted, and it is the one that proved the check.**
  `checkout-handoff.spec.ts` routed the browser's request through a variant that is in the shop
  and not in the anamnesis's recommendation, and asserted the endpoint refused it. With the
  check gone there is nothing left for it to observe. A comment stands where it was, naming it
  and saying that restoring the check means restoring the test. `UI.notRecommended` goes with
  it, as do the four message keys behind the removed copy.

## Build steps

- [x] **Step 1 - Take the recommendation off the checkout path.** Remove `allowedVariant`, use
  the requested variant or the configured fallback, retire `not-recommended` everywhere, and
  correct both records that describe the old behaviour. *Done when:* `/api/checkout` makes one
  upstream call rather than two, an order with no variant still buys the configured one, and
  no `not-recommended` remains in `src/`.

## Verify

- Run `pnpm check`, `pnpm test`, `pnpm test:browser` and `pnpm build`.
- Walk the questionnaire to the recommendation screen and time the press: the redirect should
  follow in well under a second rather than about four.
- Confirm the recommendation screen still shows RxScale's plans and prices, and that the
  no-plans path still buys the configured variant.

## Out of scope

- The ~4 s wait on entry to the recommendation screen. It is the same RxScale call and the same
  4.1 s, covered by a loading state; this fix does not touch it.
- Caching, signing, or any other way of keeping the variant check.
- The Shopify cart itself, the anamnesis attribute, and the submission.
- The recommendation screen's design and the questionnaire.
