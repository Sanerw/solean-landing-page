# Feature: Checkout handoff

**From build-plan:** feature 13
**Status:** complete - steps 1 to 4 verified, step 5 blocked and unconfirmed

## Goal

Turn the inert "Place your order" action into the handoff. One server endpoint
holds the private API key, asks RxScale for a checkout, and the browser goes
where RxScale says. Solean takes no payment, calculates no total, and never
touches the URL it is given.

This is the last step of the funnel. After it, feature 14 hardens the whole path.

## What the API dictates

Read from RxScale's documentation, and the routing checked against the live host.

| Fact | Consequence |
| --- | --- |
| `POST /v2/public-api/treatments/{shop_identifier}`, `X-API-Key`, permission `create_treatment_checkout` | Server-side only. The key never reaches a component, a load function, or the client bundle |
| `/v2/public-api/treatments/...` answers `405` to a GET on the live host; `/api/v2/public-api/...` falls through to object storage | The documented path is the real one here, unlike the anamnesis v4 prefix. No prefix guessing |
| Body: `lines: [{ sku_uid, quantity, anamnesis_id }]`, `buyerIdentity`, `checkout_type` | One line, quantity 1, and the uid on it |
| `checkout_type` defaults to `draft_order`, which **sends the customer a checkout request** instead of handing back a link to follow | The default is wrong for a redirect. This feature sends `checkout_link`, which is documented as "returns a Shopify checkout link for the customer to complete payment directly" |
| `anamnesis_id` is optional to RxScale | Mandatory to us. A Shopify order with no anamnesis gives the doctor nothing to review, so a missing uid blocks the call |
| Response: `{ "status": "success", "checkout_url": "..." }` | Redirect to it exactly as received |

## Credentials

`RXSCALE_API_KEY`, `RXSCALE_SHOP_IDENTIFIER` and `RXSCALE_SKU_UID` are being
supplied for this feature, which closes open decision 2. They are not in `.env`
yet, so the build starts against the fixture and the live confirmation is the
last step, once they are in place.

Everything before that step is proved against the fixture and **creates nothing
at RxScale or Shopify**. Step 5 asks before it makes a single real checkout, the
way feature 12 asked before its one live submission.

## Decisions this feature needs

0. **Resolved: the checkout must return a link.** `checkout_type: 'checkout_link'`,
   not the `draft_order` default that mails the customer a checkout request. The
   redirect needs a URL in hand.
1. **Resolved: a blank e-mail blocks the order.** The question is `EMail` on
   `page30` and the model does not require it, so the screen has to handle its
   absence: no address, no checkout, and a way back to the question that asks for
   it. A Shopify checkout with no contact address is an order nobody can be told
   about.

   **Reopened at step 3: the way back does not exist.** `resolveStepEntry` sends
   every step to the completion screen once the anamnesis is submitted, which
   feature 11 decided and a browser test asserts, so a link to `page30` would
   bounce straight back. Step 3 ships the honest dead end instead: the screen says
   the answers carried no address and that nothing was charged, and it offers no
   link it cannot honour. Recovery needs a decision, and there are two candidates:
   collect the e-mail on the recommendation screen itself, since it is checkout
   data rather than anamnesis data, or let the submitted session reopen that one
   step. Neither is built.
2. **Country code.** `DE` is assumed and configured, not derived (open decision 4).
3. **Resolved: no live-stock preflight.** Open decision 5 is answered: this
   feature does not call `/live-stock`. Shopify handles an out-of-stock cart its
   own way, and the order is one call rather than two.
4. **The phone.** The model collects one, but this iteration does not send it, as
   the overview states. Nothing here changes that.

## In scope

- `POST /api/checkout`, a `+server.ts` endpoint: the only place the private key
  is read, validating its input before it calls anything
- A pure payload builder with the rules that make an order reviewable
- The e-mail read from the answers by a configured question name
- The order action wired: generated on click, never on screen entry, and the
  redirect performed with the URL exactly as returned
- Honest failure on every path: no uid, no e-mail, missing configuration,
  RxScale refusing, RxScale unreachable. None of them redirect
- The answers cleared as the browser leaves for the checkout
- The fixture standing in for the treatments endpoint, and browser coverage of
  the redirect and the failures

## Out of scope

- More than one real checkout. Step 5 makes exactly one, with your go-ahead, and
  every other step targets the fixture
- Payment, order status, refunds and delivery, which belong to Shopify and
  RxScale after the redirect
- The live-stock preflight, decided against below
- The phone number, add-ons, quantity above one, and any second SKU
- Cross-feature regression sweeps, which are feature 14

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## Build steps

- [x] **Step 1 - The endpoint that holds the key** - The pure
  `buildCheckoutPayload({ anamnesisUid, email, skuUid })`, which returns either
  the body or a named refusal, and `src/routes/api/checkout/+server.ts` around
  it: private env read, posted body validated, RxScale called with `X-API-Key`,
  and the named result returned. The fixture server gains
  `POST /v2/public-api/treatments/:shop` and a page at the checkout URL it hands
  back, so a redirect has somewhere to land. `.env.example` documents the four
  variables. The builder ships with the endpoint because a payload nothing sends
  is not something this project can review. *Done when:* against
  `pnpm fixture:questionnaire`, curl to `/api/checkout` with a uid and an e-mail
  returns a `checkout_url`; without a uid it returns `400 missing-anamnesis` and
  the fixture log shows no upstream call; started with `RXSCALE_API_KEY` unset it
  returns `500 not-configured`; and `grep -r` over `.svelte-kit/output/client`
  finds no occurrence of the key.

- [x] **Step 2 - The order action** - "Place your order" enabled: on click it
  posts the uid and the e-mail read from the answers, shows a pending state, and
  navigates to the returned URL exactly as given. *Done when:* on the fixture the
  button takes the browser to the fixture's checkout page, the URL is byte-for-byte
  what the endpoint returned, and no request is made before the click.

- [x] **Step 3 - Nothing silently fails** - Each refusal gets a screen: a missing
  uid or e-mail, a missing configuration, a refusal from RxScale, and an
  unreachable RxScale. All stay on the recommendation screen with the action
  ready to try again. The fixture keys its failures off the buyer e-mail, the way
  the submission markers work, because the shop identifier is server
  configuration and a test cannot vary it. *Done when:* seeding
  `refused@example.com` and `unreachable@example.com` shows those two screens,
  an answer set with no e-mail shows the third, and none of them navigates away.

- [x] **Step 4 - Leaving takes the answers with it** - The stored answers cleared
  as the redirect is issued, the uid kept so a return is coherent, and the step
  count on the recommendation screen shown only while it is still true. *Done
  when:* after the redirect the answers key is gone from `sessionStorage`, the
  anamnesis key is not, and returning to `/questionnaire` still lands on the
  recommendation screen without the count claiming a walk that is no longer
  recorded.

- [ ] **Step 5 - One real checkout, once the keys are in** - With
  `RXSCALE_API_KEY`, `RXSCALE_SHOP_IDENTIFIER` and `RXSCALE_SKU_UID` in `.env`
  and with your go-ahead in the chat, one call against the live service using the
  anamnesis uid from a real submission, to confirm the contract the app calls.
  *Done when:* the response and its `checkout_url` shape are recorded here, the
  link is confirmed to open a Shopify checkout for the configured SKU, or the
  step records that you declined and the contract stays unconfirmed. The cart or
  draft order it creates is yours to cancel.

  **Attempted 2026-08-31, with your go-ahead. One call, and RxScale refused it.**
  `POST /api/checkout` on a local preview carrying the real `.env`, reusing
  feature 12's anamnesis `b326f1e3-70b3-414e-953e-62f149d8e104` so no second
  record was created, with `ghopewol@gmail.com` as the buyer. The endpoint
  answered `422 refused`. Nothing was created at Shopify.

  What the attempt established:

  - The private configuration reaches the server. A probe with an empty uid
    returned `400 missing-anamnesis`, a reason only reachable once the key, shop
    and SKU are all loaded, and it made no upstream call.
  - The key is valid: `GET /v2/public-api/health/` answered `200 {"status":"ok"}`.
  - The payload is the documented one. For **Create Treatment Checkout** only
    `lines`, `sku_uid` and `quantity` are required; `patient_data` belongs to the
    prescription endpoint, not this one.
  - `GET /v2/public-api/products/{shop}?market=...` answers `400 Bad request` for
    every market value tried, so the catalogue could not be read back.
  - `RXSCALE_SHOP_IDENTIFIER` is currently a twenty-character Shopify-style
    domain, not a slug. Whether RxScale's `shop_identifier` is that domain is the
    open question.

  **Diagnosed 2026-08-31, with your go-ahead, by one repeat sent directly so the
  upstream answer was visible:**

  ```
  403 {"code":"permission_denied",
       "description":"API key lacks required permission:
                      EnumAPIKeyPermission.CREATE_TREATMENT_CHECKOUT"}
  ```

  The key is valid and the request is well formed; it is not allowed to create a
  treatment checkout. The shop identifier and the SKU are not implicated: the
  request was rejected at the permission check. Nothing was created at Shopify by
  either attempt.

  **What unblocks this step:** grant `create_treatment_checkout` to the API key in
  the RxScale Admin Tool, then repeat the call. Nothing in this app changes.

  **Recorded against the contract.** `createCheckout` maps every upstream status
  below 500 onto `refused`, so a visitor sees "Your order was not accepted" when
  the truth is that this deployment is not permitted to order at all. The spec's
  own table assigns a rejected key to `refused`, so it is left as approved, but
  `401` and `403` describe a deployment that cannot order rather than an order
  that was declined, and `not-configured` is the honest reason for them. Changing
  it is a decision, not a repair.

## Files / areas

| Path | Change |
| --- | --- |
| `src/lib/server/rxscale/checkout.ts` | new: the payload builder and the RxScale call, server-only |
| `src/lib/config/checkout.ts` | new: the country code and the e-mail question name |
| `src/routes/api/checkout/+server.ts` | new: the endpoint, the only reader of the private key |
| `src/lib/features/questionnaire/answers.ts` | the e-mail read by configured name |
| `src/lib/features/questionnaire/RecommendationScreen.svelte` | the action, its pending state, its failures |
| `src/lib/features/questionnaire/answer-storage.ts` | clearing the answers at the handoff |
| `.env.example` | the three private values, documented |
| `e2e/fixture-server.mjs` | the treatments endpoint, a checkout page to land on, and the failure markers |
| `e2e/checkout-handoff.spec.ts` | new: the redirect and every refusal |
| `playwright.config.ts` | the preview server gets the private values, pointed at the fixture |

## Data / contracts

**The endpoint.** Ours, not RxScale's. Both directions are validated at the
boundary.

```ts
// POST /api/checkout
interface CheckoutRequest {
	anamnesisUid: string;
	email: string;
}

type CheckoutResponse =
	| { ok: true; checkoutUrl: string }
	| { ok: false; reason: 'missing-anamnesis' | 'missing-email' | 'not-configured' | 'refused' | 'unavailable' };
```

The reason is a name, never RxScale's message: an upstream error body can carry
account detail that does not belong in a browser. Each reason has one status, so
a proxy log tells the same story as the body.

| Reason | Status | Means |
| --- | --- | --- |
| `missing-anamnesis`, `missing-email` | `400` | The browser asked for something that cannot be ordered. No upstream call |
| `not-configured` | `500` | This deployment has no key, shop or SKU. No upstream call |
| `refused` | `422` | RxScale rejected the line, the SKU or the key |
| `unavailable` | `502` | RxScale did not answer |

**The RxScale body.** Built server-side, one line, and never assembled anywhere
a component can see it.

```json
{
  "lines": [{ "sku_uid": "<configured>", "quantity": 1, "anamnesis_id": "<uid>" }],
  "buyerIdentity": { "email": "<from the answers>", "countryCode": "DE" },
  "checkout_type": "checkout_link"
}
```

**Configuration.** Private, server-only, read through `$env/dynamic/private`.
The overview names `$env/static/private`; dynamic is what lets the app build and
run while these are still placeholders, which is the state the project is in.

| Variable | Purpose |
| --- | --- |
| `RXSCALE_API_KEY` | `X-API-Key`, permission `create_treatment_checkout` |
| `RXSCALE_SHOP_IDENTIFIER` | the shop path segment |
| `RXSCALE_SKU_UID` | the one SKU the recommendation presents |
| `RXSCALE_PUBLIC_API_BASE_URL` | optional, defaults to `https://api.rxscale.com`, and points the harness at the fixture |

**The anamnesis uid is a bare UUID**, as feature 12 confirmed live. Nothing may
require an `anam-` prefix.

## Testing

No unit runner is configured, so the browser harness and the fixture carry the
evidence, and `buildCheckoutPayload` joins the queue of pure logic that would be
better served by `/tests` than by a walk through a browser.

| Claim | Evidence |
| --- | --- |
| The order is only created on click | Browser spec: no request until the button is pressed |
| The URL is used exactly as returned | Browser spec compares the landed URL with the fixture's |
| A missing uid or e-mail blocks the order | Endpoint returns the named reason and makes no upstream call |
| The key never leaves the server | It appears in no response body and no client bundle: `grep` the build output |
| Failures do not redirect | Browser spec per marker |
| The answers do not outlive the handoff | Browser spec on `sessionStorage` after the redirect |
| The real service accepts it | Step 5: one live call once the keys are in `.env`, recorded in this file |
| Nothing regressed | `pnpm check`, `pnpm build`, `pnpm test:browser` |

## Notes for the AI

- **The key is server-only.** `$env/dynamic/private` inside `+server.ts` and
  `src/lib/server/`. Never a `PUBLIC_` name, never an import from a component,
  never in a log line or an error body.
- **The e-mail passes through, it does not land.** The browser posts it to our
  endpoint because only the browser has the answers. The server uses it for the
  one call and keeps nothing: no log line, no store, no error body.
- **The checkout URL is opaque.** No appended parameters, no trimming, no domain
  substitution, no logging.
- **`anamnesis_id` is mandatory here even though the API allows it to be absent.**
  An order without it reaches a doctor with nothing to review.
- **Generate on click.** Never on screen entry, never in a load function, never
  speculatively: each call creates a Shopify draft or cart.
- **Do not call the live service before step 5.** The fixture is the target for
  every other step, and step 5 asks first. Each real call creates a Shopify draft
  or cart that someone has to clean up.
- Conventions: runes only, `$lib` imports, kebab-case modules, no `any`, semantic
  tokens, stock Tailwind scales.
