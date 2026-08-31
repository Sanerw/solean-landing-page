# Checkout handoff through the Shopify cart

**Type:** Fix

**Status:** verified

## The problem

Feature 13 shipped the handoff as an RxScale treatment checkout: `POST /api/checkout` holds
the private API key, asks `POST /v2/public-api/treatments/{shop}` for a `checkout_link`, and
redirects to the URL it returns. It works against the fixture and has never worked against
the live service. The one authorised call was refused, and the reason turned out to be that
the key lacks `create_treatment_checkout`, a permission that is not selectable in the Admin
Tool.

RxScale's own recommendation, given directly on 2026-08-31, is to not use that endpoint:

> I would recommend to add the product to the cart with the anamnesis reference to get a
> more native shop experience. We fetch it then automatically from shopify.

That is how their own storefronts work, and their documentation describes it as the
supported path. This change replaces the mechanism. **Nothing about the visitor's journey
changes**: the questionnaire, the submission, the recommendation screen and the redirect all
stay. Only what happens between the click and the redirect is different.

## What the vendor and the shop dictate

Read from `guides/questionnaire-integration` and
`for-telemedicine-providers/orders-and-prescriptions`, then checked against the live shop.

| Fact | Consequence |
| --- | --- |
| RxScale imports the order from Shopify by webhook. It is never told about it by us | We create a Shopify cart, not an RxScale checkout. There is no call to RxScale in this flow at all |
| The anamnesis travels as the order attribute `_anamnesis_uid`, compared character for character and case-sensitively. A mismatch is **silently ignored** | The key is a constant, never built by concatenation, never edited |
| Resolution has a three-level fallback: the line item's own property, then the line item group for bundles, then the order-level attribute | One order-level attribute covers every line, including the components of a bundle |
| The docs recommend the order level, because it survives Shopify's reorder and duplicate | Order level only. Not the line, not both |
| `Mounjaro 5 mg Behandlung`, variant `49703544684877`, is a **bundle** | We add one line. Shopify expands it into medication, treatment fee and needles. We never build a fee line |
| RxScale validates the anamnesis on prescription items at import, which is why `_skip_validation` exists as an escape hatch | A wrong uid is caught at their end, but only after the customer has paid. Ours must be right before the redirect |
| RxScale ignores Shopify order webhooks for orders created more than 60 days earlier | Not a constraint on this flow, but it rules out replaying an old cart |
| `checkoutUrl` comes back on `solean.com`, not `myshopify.com` | Redirect to it exactly as received, as before |

Verified live on 2026-08-31 against `mygina.myshopify.com`, carts only, no orders created:

- `cartCreate` accepts `_anamnesis_uid` at both the order and the line level, and the
  underscore keys survive a read-back.
- A cart permalink carries the order attribute too, so a token-free fallback exists.
- The Storefront GraphQL endpoint answered **without an access token**. That is not
  documented behaviour and this change does not rely on it, see decision 4.
- The cart totals 399.00 EUR as one visible line, and the expansion Shopify records is
  276.83 medication plus 122.17 treatment fee plus 0.00 needles.

## Decisions this change needs

1. **Resolved: the endpoint stays, its body is replaced.** `POST /api/checkout` keeps the
   exact request and response contract it has today. `checkout-client.ts`,
   `RecommendationScreen.svelte` and the failure screens are then almost untouched, and the
   diff is confined to the server. The endpoint no longer exists to hide a secret, because
   there is no secret left. It exists so validation happens in one place and the browser
   keeps one stable contract.

2. **Resolved: the order-level attribute, alone.** The three-level fallback means the order
   attribute already covers the bundle's components. Setting the line property as well would
   have to be repeated for every component the bundle expands into, which we do not control.
   Confirmed by RxScale on 2026-08-31: "It is in the cart attributes: `_anamnesis_uid:
   <value>`". Shopify's cart attributes are the order-level attributes, and they are what
   `cartCreate`'s `input.attributes` sets.

3. **Resolved: a blank e-mail no longer blocks the order.** This retires the dead end feature
   13 was forced into. Shopify collects the address at checkout, so an order with no
   `buyerIdentity.email` is complete rather than unreachable. The e-mail is still read from
   the answers and still sent when present, as a prefill and nothing more. `missing-email` is
   removed as a failure reason. Approved 2026-08-31.

4. **The Storefront access token.** The shop answers without one today. Undocumented
   behaviour is not a foundation, so the token is read from configuration and sent when
   present, and its absence is not an error. Ask RxScale or the shop owner for a proper
   token; adopting it is then one header and no code change.

5. **Resolved by RxScale on 2026-08-31: one cart attribute covers the whole bundle.** Asked
   directly about `Mounjaro 5 mg Behandlung` and the three lines it expands into, they
   confirmed the single `_anamnesis_uid` cart attribute reaches every one of them, which is
   what the line-item-group fallback exists for. This is their word rather than an observed
   order: no paid order has been watched through to a doctor's queue, and nothing in this
   change can prove that on its own.

6. **Resolved 2026-08-31: the bundle.** `Mounjaro 5 mg Behandlung`, variant `49703544684877`,
   at 399.00. Chosen by the user over the older `Mounjaro` 5 mg KwikPen at 276.83, and
   confirmed live in step 5, where Shopify expanded it into the three lines decision 5
   depends on.

## In scope

- A Shopify Storefront cart module replacing `src/lib/server/rxscale/checkout.ts`
- A pure input builder holding the rules that make an order reviewable
- `POST /api/checkout` switched over with its contract intact, minus `missing-email`
- The no-e-mail failure screen removed, since it can no longer happen
- The three private RxScale variables retired from the checkout path
- The fixture serving Storefront GraphQL instead of the treatments endpoint
- Browser coverage carried over: the redirect, and every failure that remains

## Out of scope

- Any change to the questionnaire, the submission, or the recommendation screen's content
- Payment, order status, refunds and delivery, which are Shopify's and RxScale's after the
  redirect
- Reading the catalogue. One configured variant, no product query
- A second line, a second SKU, quantity above one, and the add-ons the bundle already carries
- Chasing `create_treatment_checkout` or the `400` on `/products`. Both are reported and
  neither blocks this path any more
- Cross-feature regression sweeps, which are feature 14

## Build loop

Build one step at a time, never the whole change at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - The cart module** - `src/lib/server/shopify/cart.ts`: the pure
  `buildCartInput({ anamnesisUid, email, variantId })` returning either the GraphQL input or
  a named refusal, and `createCart` around it, posting `cartCreate` and returning
  `checkoutUrl` untouched. The fixture gains `POST /api/:version/graphql.json` answering a
  `cartCreate` shape, keeping the page the redirect lands on. *Done when:* against
  `pnpm fixture:questionnaire`, a direct call returns a `checkoutUrl`; a blank uid returns
  `missing-anamnesis` and makes no upstream call; an unset shop domain returns
  `not-configured`; and the built input carries `_anamnesis_uid` at the order level and
  nowhere else.

- [x] **Step 2 - The endpoint switched over** - `+server.ts` calls the new module. Request
  and response shapes unchanged, `missing-email` dropped from the reason union in both the
  server and `checkout-client.ts`. `src/lib/server/rxscale/` and the three private variables
  go. *Done when:* `pnpm check` passes, the existing browser spec still proves the redirect
  and the remaining failures, and `grep -r` finds no reader of `RXSCALE_API_KEY`.

- [x] **Step 3 - The dead end removed** - `missing-email` deleted from all six call sites:
  the union and the early return in `checkout-client.ts`, the `CHECKOUT_FAILURES` entry in
  `recommendation-content.ts`, the union and the guard in the cart module, and the status map
  in `+server.ts`. `CHECKOUT_FAILURES` is typed `Record<CheckoutFailure, ...>`, so dropping
  the union member makes the compiler point at the copy that has to go rather than leaving it
  orphaned. The e-mail is sent only when the answers hold one. *Done when:* `pnpm check` is
  clean, an answer set with no e-mail reaches the checkout instead of a refusal, and no screen
  promises a way back that does not exist.

- [x] **Step 4 - The fixture and the harness caught up** - `playwright.config.ts` points the
  preview at the fixture's Storefront endpoint, the failure markers key off the buyer e-mail
  as before, and `.env.example` documents the new variables and drops the old ones. *Done
  when:* `pnpm test:browser` is green and `.env.example` describes only variables the app
  reads.

- [x] **Step 5 - One real cart** - With your go-ahead, one `cartCreate` against the live
  shop, confirming the checkout URL opens the Shopify checkout for the configured variant
  with the attribute attached. **This creates a cart, not an order, so it does not prove the
  link to RxScale**, which decision 5 records as confirmed by them rather than observed here.
  *Done when:* the cart, its URL and the attribute read back off it are recorded here, or the
  step records that you declined.

  **Run 2026-08-31 against `mygina.myshopify.com`, one cart, no order.** The payload was the
  app's own `buildCartInput` output, so what the shop saw is what the endpoint sends.

  | | |
  | --- | --- |
  | Cart | `gid://shopify/Cart/hWNGHyXfR2ZxTUmnRlisO5lj` |
  | Checkout URL | `https://solean.com/cart/c/hWNGHyXfR2ZxTUmnRlisO5lj?key=<elided>`, redirecting 302 to `/checkouts/cn/hWNGHyXfR2ZxTUmnRlisO5lj/de-de` |
  | Attribute, read back | `_anamnesis_uid` = `anam-solean-live-probe-2026-08-31`, off a separate `cart(id:)` query and again out of the checkout page's own state |
  | Line | one, quantity 1, `Mounjaro 5 mg Behandlung` |
  | Total | 399.00 EUR |
  | Token | none sent, and the shop answered anyway, which is decision 4's open point unchanged |

  The `key` is elided because it authorises access to that cart, and no reader of this file
  needs it.

  **The bundle expanded, observed rather than assumed.** Shopify's `cart_changelog` recorded
  three items against the one line we sent: `Mounjaro 5 mg KwikPen` 276.83, `Digitale
  Behandlungsgebuehr 5 mg Mounjaro` 122.17, `NovoFine Einwegnadeln` 0.00. That is the split
  this spec recorded from the shop, now seen from a cart this app created, and it is why no
  fee line is ever built here.

  **Still not proven, as decision 5 says.** One order-level attribute reaching all three
  components at RxScale's import is their word. Nothing short of a paid order tests it.

## Files / areas

| Path | Change |
| --- | --- |
| `src/lib/server/shopify/cart.ts` | new: the input builder and the `cartCreate` call |
| `src/lib/server/rxscale/checkout.ts` | deleted |
| `src/lib/config/checkout.ts` | the attribute name and the variant; country code and e-mail question name stay |
| `src/routes/api/checkout/+server.ts` | same contract, new collaborator, one fewer reason |
| `src/lib/features/questionnaire/checkout-client.ts` | `missing-email` dropped from the reason union |
| `src/lib/features/questionnaire/recommendation-content.ts` | the no-e-mail screen removed |
| `src/lib/features/questionnaire/RecommendationScreen.svelte` | no change: it renders whatever the failures record holds |
| `.env.example` | the Shopify variables in, the three RxScale ones out |
| `e2e/fixture-server.mjs` | Storefront GraphQL replaces the treatments endpoint |
| `e2e/checkout-handoff.spec.ts` | the no-e-mail case retired, the rest carried over |
| `playwright.config.ts` | the preview server's variables |

## Data / contracts

**Our endpoint. Unchanged, except that one reason is gone.**

```ts
// POST /api/checkout
interface CheckoutRequest {
	anamnesisUid: string;
	email?: string;
}

type CheckoutResponse =
	| { ok: true; checkoutUrl: string }
	| { ok: false; reason: 'missing-anamnesis' | 'not-configured' | 'refused' | 'unavailable' };
```

| Reason | Status | Means |
| --- | --- | --- |
| `missing-anamnesis` | `400` | No uid, so nothing a doctor could review. No upstream call |
| `not-configured` | `500` | This deployment has no shop domain or variant. No upstream call |
| `refused` | `422` | Shopify returned `userErrors`, or a cart with no `checkoutUrl` |
| `unavailable` | `502` | Shopify did not answer |

**The Shopify mutation.** One line, one order attribute.

```graphql
mutation {
  cartCreate(input: {
    lines: [{ merchandiseId: "gid://shopify/ProductVariant/<configured>", quantity: 1 }]
    attributes: [{ key: "_anamnesis_uid", value: "<uid>" }]
    buyerIdentity: { email: "<from the answers, when present>", countryCode: DE }
  }) {
    cart { checkoutUrl }
    userErrors { field message }
  }
}
```

**Configuration.** Read through `$env/dynamic/private`, which is where the old values lived
and what lets the harness override them. **None of these is a secret.** They stay on the
server so the variant does not ship in the client bundle and so validation has one home.

| Variable | Purpose |
| --- | --- |
| `SHOPIFY_STORE_DOMAIN` | the shop, for example `mygina.myshopify.com` |
| `SHOPIFY_VARIANT_ID` | the numeric variant the recommendation presents |
| `SHOPIFY_STOREFRONT_TOKEN` | optional today, see decision 4 |
| `SHOPIFY_STOREFRONT_API_VERSION` | optional, defaults to `2025-01` |

`PUBLIC_RXSCALE_QUESTIONNAIRE_UID` and the anamnesis base path are untouched. The
questionnaire still comes from RxScale and the submission still goes to RxScale. Only the
checkout leaves them.

## Testing

No unit runner is configured, so the browser harness and the fixture carry the evidence, and
`buildCartInput` joins the queue of pure logic that `/tests` would serve better than a walk
through a browser.

| Claim | Evidence |
| --- | --- |
| The cart is only created on click | Browser spec: no request until the button is pressed |
| The URL is used exactly as returned | Browser spec compares the landed URL with the fixture's |
| A missing uid blocks the order | Endpoint returns the reason and makes no upstream call |
| `_anamnesis_uid` is exact and order-level | Assertion on the built input, in the browser spec until a runner exists |
| A blank e-mail no longer blocks | Browser spec: the answer set with no e-mail reaches the checkout |
| Failures do not redirect | Browser spec per marker |
| The answers do not outlive the handoff | Browser spec on `sessionStorage`, carried over |
| No secret remains on this path | `grep -r` finds no reader of the three RxScale variables |
| Nothing regressed | `pnpm check`, `pnpm build`, `pnpm test:browser` |
| The real shop accepts it | Step 5, one live cart |
| The doctor actually receives the anamnesis | Confirmed by RxScale, not observed here. Only a paid order would prove it, see decision 5 |

## Notes for the AI

- **`_anamnesis_uid` is exact.** A constant, compared character for character by RxScale, and
  silently ignored when wrong. Never concatenated, never trimmed, never re-cased.
- **Order level, not line level.** Decision 2. The bundle is the reason.
- **There is no secret on this path any more.** Do not reintroduce the private-key language
  from feature 13. The endpoint's justification is validation and contract stability, and the
  code should read that way.
- **Generate on click.** Unchanged and still true: every call creates a Shopify cart.
- **The checkout URL is opaque.** No appended parameters, no trimming, no domain
  substitution, no logging.
- **The e-mail passes through, it does not land.** It is a prefill now rather than a
  requirement, and it is still kept nowhere: no log line, no store, no error body.
- **Do not call the live shop before step 5**, and note that a cart is cheap but not free: it
  shows up in the shop's analytics.
- Conventions: runes only, `$lib` imports, kebab-case modules, no `any`, semantic tokens,
  stock Tailwind scales.
