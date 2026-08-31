# An unusable e-mail prefill must not block the order

**Type:** Fix
**Status:** verified

## The problem

The checkout handoff fails with "Your order was not accepted" whenever the
questionnaire's `EMail` answer is not an address Shopify accepts. Nothing else
about the handoff is wrong: the same cart is created successfully the moment the
e-mail is left out.

The model does not validate the answer. RxScale's `EMail` question is a plain
text field with no `inputType`, no `validators` and no `isRequired`:

```json
{ "name": "EMail", "type": "text",
  "title": "Beginnen wir mit Deinen Kontaktdaten\nBitte gib Deine E-Mail ein:" }
```

So whatever the visitor types reaches `buyerIdentity.email` in `buildCartInput`
(`src/lib/server/shopify/cart.ts:80`), and Shopify refuses the whole
`cartCreate`. Confirmed against the live shop:

| `buyerIdentity.email` | `cartCreate` |
| --- | --- |
| `jonas@example.com` | `cart.checkoutUrl`, `userErrors: []` |
| *(omitted)* | `cart.checkoutUrl`, `userErrors: []` |
| `niepoprawny` | no cart, one `userErrors` entry |
| `a@b` | no cart, one `userErrors` entry |

The refusal is precisely attributed and creates no cart:

```json
{ "field": ["input", "buyerIdentity", "email"],
  "message": "Email ist ungültig", "code": "INVALID" }
```

`createCart` reads any `userErrors` as `refused`, so a typo in an optional field
ends the funnel after the anamnesis has already been filed. That contradicts the
rule the project set for this path in `project-overview.md`: the e-mail "is a
prefill, not a condition: Shopify collects the address at checkout, so an order
without one is complete rather than unreachable."

## The fix

Treat an e-mail Shopify rejects the way an absent one is already treated. When a
`cartCreate` carrying an e-mail is refused **and every `userErrors` entry names
`buyerIdentity.email`**, create the cart once more without the prefill.

Attribution is what keeps this narrow. A refusal about the merchandise line, the
attribute, or anything else stays `refused` on the first answer, so the retry
cannot mask a real problem or turn one refusal into two carts. Shopify returns no
cart with its `userErrors`, so the successful retry is still exactly one cart per
press.

Rejected alternative: guessing at Shopify's address rule with a regex in
`buildCartInput`. It cannot be exhaustive (`a@b` passes most shape checks and the
shop still refuses it), and a rule we invented would be a second source of truth
for a verdict only the shop can give.

Must not break:

- One cart per press, never on screen entry.
- `_anamnesis_uid` stays the single order-level attribute, unaltered.
- The returned `checkoutUrl` is passed on byte for byte.
- A missing anamnesis still blocks the redirect.
- The upstream message is never shown to the visitor; the screen keeps its own copy.

## Build steps

### [x] Step 1 - retry once without a prefill Shopify refused

`src/lib/server/shopify/cart.ts`: read the `userErrors` of a refused
`cartCreate` and, when they are all about `buyerIdentity.email` and an e-mail was
sent, repeat the call with the e-mail dropped. Keep `buildCartInput` pure and
unchanged in signature; the decision belongs with the call that saw the answer.

**Done when:** against the live shop, `POST /api/checkout` with
`{"anamnesisUid":"anam-probe","email":"niepoprawny"}` returns `200` with a
`checkoutUrl`, while the same request with a valid e-mail still returns its own
checkout, and a refusal that is not about the e-mail still returns `422`
`refused`.

### [x] Step 2 - hold the behavior in the browser harness

`e2e/fixture-server.mjs`: the cart stand-in currently answers every refusal with
`field: null`, so it cannot express the difference this fix turns on. Give it
Shopify's real shape, refusing an e-mail that is not a plausible address with
`field: ["input","buyerIdentity","email"]` and `code: "INVALID"`, and record
whether a cart was created with or without a prefill.

`e2e/checkout-handoff.spec.ts` plus `e2e/answers.ts`: add an answer set whose
`EMail` is not an address, and assert the press reaches the fixture checkout, that
exactly one cart was created, and that it was created without the e-mail. The
existing `refused@example.com` marker must still stop at "Your order was not
accepted" with no retry.

**Done when:** `pnpm test:browser` passes, including the new case and every
existing checkout-handoff test.

## Verify

1. `pnpm check` clean.
2. `pnpm test:browser` green.
3. Live path, dev server running:
   - `curl -X POST localhost:5173/api/checkout -H 'content-type: application/json' -d '{"anamnesisUid":"anam-probe","email":"niepoprawny"}'` returns a `checkoutUrl`.
   - The same with `"email":"jonas@example.com"` returns a `checkoutUrl`.
4. In the browser: complete the questionnaire with a malformed e-mail and press
   "Place your order". It leaves for Shopify instead of showing "Your order was
   not accepted".

> The live checks create real carts in `mygina.myshopify.com`. Carts are not
> orders and nothing is charged.
