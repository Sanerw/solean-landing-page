# Feature: The distinct id on the cart (29c)

**From build-plan:** feature 29c
**Status:** verified

## Goal

Put the Mixpanel identity on every Shopify cart, so an order can later be joined
back to the person who walked the funnel. Nothing reads it yet, and that is the
point: the consumer is the deferred `orders/paid` webhook, and an order placed
before that exists carries the key anyway, so the import can reach it
retroactively. Without this, revenue history would start on the day the webhook
ships.

The funnel currently ends at `checkout_started`, the moment of the redirect.
Everything after it, whether the cart became an order and for how much, is
invisible. This feature does not close that gap; it makes closing it possible
without losing the orders in between.

## In scope

- One attribute key constant beside `ANAMNESIS_ATTRIBUTE_KEY`.
- `buildCartInput` carrying it as a second order attribute, and the unit tests
  that file has never had.
- A read seam in `client.ts` for the distinct id, behind the existing gate.
- The value travelling browser to endpoint to cart, validated at the public
  endpoint the way `/api/reminder` validates what it cannot trust.

## Out of scope

- The `orders/paid` webhook and the Mixpanel Import API. Deferred with feature 29
  on 2026-09-14 and recorded in the build plan's backlog. This feature is
  deliberately ahead of it.
- The experiments (29d).
- `_anamnesis_uid` and every rule around it. It stays exactly as it is: one
  constant, order level, compared character for character by RxScale.
- Reading the attribute back, or any admin surface. Shopify's own order view is
  where it is inspected.

## What this does and does not widen

**It sends no new kind of data to Shopify.** Since 29a the distinct id is the
visitor's e-mail address, and the checkout call already carries that address as
`buyerIdentity.email`. The attribute is the analytics identity stated explicitly
rather than a second copy of something Shopify did not have.

That is also why it is worth having rather than joining on the e-mail later: the
prefill is dropped when the shop refuses it, and the address somebody types at
Shopify's own checkout is not necessarily the one they answered the questionnaire
with. The attribute is the id Mixpanel actually keyed the session under.

**Nothing medical travels**, unchanged: no answer value, no medication, no dose.
The anamnesis uid is already there and is not touched.

**A declined visitor has no distinct id**, because the SDK was never loaded, so
the attribute is simply absent. That is the honest outcome and needs no special
case beyond omitting the attribute.

## Build steps

- [x] **Step 1 - the attribute** - add `MIXPANEL_ATTRIBUTE_KEY` to
  `src/lib/config/checkout.ts`, spelled with a leading underscore the way
  `_anamnesis_uid` is, because Shopify hides an underscore-prefixed attribute from
  the customer-facing order and this is plumbing rather than something a buyer
  should read. Extend `CartRequest` and `buildCartInput` to carry it as a second
  **order-level** attribute, omitted entirely when absent or blank. Create
  `src/lib/server/shopify/cart.test.ts`, which does not exist today although
  `project-overview.md` names this builder as in-scope coverage: the new attribute
  present, absent and blank, plus the cases the overview named and nobody wrote,
  a missing uid, an unconfigured variant, an absent e-mail, and `_anamnesis_uid`
  at the order level and never on a line. *Done when:* `pnpm test` green and
  nothing user-facing changed, because no caller passes the new field yet.

- [x] **Step 2 - reading the id** - `visitorDistinctId()` in `client.ts`,
  returning the SDK's `get_distinct_id()` or null, refusing without
  `analyticsEnabled()` and `mayTrack(consent)`, and null while the SDK has not
  finished importing. Synchronous on purpose: the checkout click is the value
  moment and may not wait on a 60 kilobyte import, and by the time somebody
  reaches the plan screen the SDK has been loaded for a dozen screens. The edge it
  gives up is a visitor who consents on the recommendation screen itself, whose
  cart then carries no id. *Done when:* the gate is unit tested (no token, no
  consent, SDK not yet loaded, loaded and consented), and `pnpm verify` green with
  no call site yet.

- [x] **Step 3 - the wiring** - read it in `requestCheckout` and send it in the
  body, the way the reminder sends its fields, one named line and never a spread.
  At `/api/checkout`, treat it as hostile input because the endpoint is public:
  trim, cap at 100 characters, drop it when empty, oversized or carrying a control
  character. **Never refuse the order over it.** A junk value costs a join key; a
  400 costs the sale, and this endpoint may not be why a checkout fails. Change
  `createCart` from four positional strings to one typed record while passing it
  through, because four same-typed positionals silently tolerate a transposition.
  *Done when:* a walk to the checkout with consent produces a cart whose order
  attributes carry both `_anamnesis_uid` and the distinct id; a declined walk
  produces a cart with the anamnesis alone; `pnpm verify` green and
  `pnpm test:browser` green for `checkout-handoff.spec.ts`, which fails if the
  extra attribute breaks cart creation at all.

- [x] **Step 4 - the documentation** - record the attribute in `AGENTS.md` beside
  the `_anamnesis_uid` rules: what it is for, that its consumer does not exist
  yet and why that is deliberate, that it is the e-mail because the distinct id is,
  and that it is dropped rather than allowed to fail an order. *Done when:*
  `AGENTS.md` describes the second attribute, and `pnpm verify` green.

## Files / areas

| Path | Why |
| --- | --- |
| `src/lib/config/checkout.ts` | the key, one constant beside the anamnesis one |
| `src/lib/server/shopify/cart.ts`, `cart.test.ts` | the builder, the record, and the tests it never had |
| `src/lib/analytics/client.ts`, `client.test.ts` | the read seam and its gate |
| `src/lib/features/questionnaire/checkout-client.ts` | one named field in the request body |
| `src/routes/api/checkout/+server.ts` | validating what a public endpoint cannot trust |
| `AGENTS.md` | the second attribute recorded |

## Data / contracts

**Load-bearing, because the deferred import will read it.** The key is one
constant, never assembled, the same rule `_anamnesis_uid` follows and for the same
reason: whatever reads it later compares it literally.

| Attribute | Value | Level |
| --- | --- | --- |
| `_anamnesis_uid` | RxScale's anamnesis uid | order, unchanged |
| the new key | the Mixpanel `distinct_id`, which is the e-mail since 29a | order |

`CartRequest` gains one optional field. Optional is the contract: an order without
the attribute is complete, not broken, and that is the shape for a declined
visitor and for a deployment with no Mixpanel token.

## Testing

`pnpm verify` is the gate. `pnpm test:browser` is run for step 3.

In-scope logic:

- `buildCartInput` with the attribute, without it, and with a blank one
- both attributes at the order level, neither on a line
- the pre-existing builder cases the overview named and that have no test
- the `visitorDistinctId` gate at each of its four states
- the endpoint's trimming, capping and dropping of a hostile value

**What no test here proves, stated rather than implied.** That the attribute
reaches a real Shopify order and is readable in their admin. The browser suite
runs against a fixture shop, which validates the cart's shape but is not Shopify.
Feature 13 proved `_anamnesis_uid` with one live cart read back through a
`cart(id:)` query; the same check is the only real proof for this one, and it is a
manual step against the live shop rather than something to automate.

## Notes for the AI

- The leading underscore is not decoration. Shopify hides underscore-prefixed
  attributes from the customer-facing order, and a visible "mixpanel" line on
  somebody's order confirmation would be a support question at best.
- Do not touch `_anamnesis_uid`, its constant, its placement or its tests. It is
  the one thing on this path RxScale reads, and it is compared literally.
- The distinct id is best effort and the order is not. Every failure mode here
  ends in an omitted attribute, never in a refused cart.
- `client.test.ts` asserts every privacy-bearing SDK flag. This feature needs
  nothing from `mixpanelInitOptions`.
- No em dashes in code, comments or documentation, per `coding-standards.md`.
