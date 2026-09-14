# Fix: Mixpanel reports where a visitor is

**Type:** Fix
**Status:** verified

## The problem

Country, region and city are empty on every profile and every event in the
Mixpanel panel, which a browser run confirmed rather than a reading of the code:
the Users view shows `undefined` in all three columns.

The cause is one flag. `mixpanelInitOptions` sets `ip: false`
(`src/lib/analytics/client.ts:135`), and the IP address is the only thing
Mixpanel resolves a location from, so there is nothing for it to derive. It is
visible in the request itself, which goes to `api-eu.mixpanel.com/engage/?verbose=1&ip=0`.

That flag was a decision rather than an oversight, and its own comment gives the
reasoning: no IP is forwarded, and the site is single-market anyway, which makes
geo resolution worth nothing. **Both halves stopped being true on 2026-09-14**,
when the user said Solean will target markets beyond Germany. Which country a
visitor converts from becomes a dimension worth comparing, not a curiosity.

## The fix

Set `ip: true`, and rewrite everything that records the old decision so the
documentation does not contradict the code.

**What it costs, recorded because it is the whole of what this trades.** The IP
address is personal data under DSGVO and from this change it reaches the
analytics provider. The legal basis does not move: nothing is sent before an
explicit yes, `opt_out_tracking_by_default` stays on, and a visitor who declines
still never loads the SDK. What grows is the gap in the privacy policy, which
describes neither Mixpanel, nor replay, nor heatmaps, and now not this either.
That file is a verbatim mirror of Solean's own document and cannot be amended
here, for the reason `AGENTS.md` gives, so the gap stays open deliberately.

An alternative was offered and declined: reading `x-vercel-ip-country` on the
server and sending the country as a property of our own, which keeps the IP away
from Mixpanel but yields the country alone, and only after a deploy. The user
chose full geolocation knowingly.

**What this must not break.** The rules about what may travel do not move: no
answer value, no anamnesis uid, no medication, no dose. `e2e/analytics.spec.ts`
intercepts every Mixpanel request and asserts exactly that, so it must stay
green without an assertion of its own being relaxed.

## Out of scope

`CHECKOUT_COUNTRY_CODE` in `src/lib/config/checkout.ts` stays `DE`, decided by
the user in the same conversation. The Shopify cart's `buyerIdentity.countryCode`
and RxScale's `country_code` keep shipping as the German market.

That is a real constraint rather than a tidy boundary: `buyerIdentity.countryCode`
decides currency and tax in Shopify, so a genuine second market needs it derived
rather than assumed. It is open question 5 in `project-overview.md` and it is now
waiting on a product decision, not on this fix.

## Build steps

- [x] **Step 1 - the flag and what records it** - set `ip: true` in
  `mixpanelInitOptions` and replace the comment above it, which argues for the
  opposite and names a single market. Turn `client.test.ts`'s `forwards no IP`
  into an assertion that the flag is on, keeping it what it is: a regression
  guard on a privacy-bearing setting, pointing the other way. Add the decision to
  the analytics section of `AGENTS.md` with its date, its reason and its cost,
  the way the replay and identity decisions are recorded there. *Done when:*
  `pnpm verify` is green, `client.test.ts` fails if the flag is flipped back, and
  no sentence in `AGENTS.md` or `client.ts` still says no IP is forwarded.

## Verify

`pnpm verify` is the gate. `e2e/analytics.spec.ts` is run as well, outside
Verify by design, because it is the one place the privacy boundary is asserted
against what actually leaves the browser.

Three observable things:

| Where | What to see |
| --- | --- |
| DevTools, after accepting the banner | the request to `api-eu.mixpanel.com` carries `ip=1`, not `ip=0` |
| Mixpanel Users, after a deploy | Country Code, Region and City stop reading `undefined` |
| `e2e/analytics.spec.ts` | still green, with no assertion about what may travel weakened |

**A local run proves less than it looks.** On `localhost` the request still leaves
your machine to Mixpanel's EU host, so the IP it resolves is your own public one:
the country will be real, the city approximate, and neither says anything about
what a visitor in another market will produce.

Note that an ad blocker or Brave Shields blocks these requests outright, which is
what made them red in DevTools earlier in this conversation. Verify in a browser
with blocking off, or nothing reaches the panel at all.

## Notes for the AI

- Do not touch anything else in `mixpanelInitOptions`. Every other flag there is
  a recorded decision and `client.test.ts` asserts each one.
- No em dashes in code, comments or documentation, per `coding-standards.md`.
