# Feature: IndexNow publication notifications

**From build-plan:** feature 28c
**Status:** verified

## Goal

When an editor publishes or unpublishes a page in Sanity, tell the participating
search engines that one URL changed, instead of waiting for a crawl. A Sanity
webhook calls one authenticated endpoint here; that endpoint works out which
public URL the change affects and submits it to IndexNow.

It is off unless deliberately switched on: no key configured, indexing not
launched, or a request on the wrong origin all mean nothing is sent. Nothing a
visitor sees changes.

**Google does not participate in IndexNow** and has never adopted it. This
notifies Bing, Yandex, Seznam, Naver and Yep. Anyone expecting Google results to
appear faster will be disappointed, and that expectation should not be set. Google
discovery stays with the sitemap from 28a.

## In scope

- `INDEXNOW_KEY`, server-only. Absent means this deployment notifies nobody, which
  is an ordinary state and not an error, exactly as absent Customer.io credentials
  mean a deployment that sends no reminders.
- The key verification file, so a search engine can confirm we own the host.
  Served from the key in configuration, 404 for any other key, and it must not
  shadow `robots.txt` or `sitemap.xml`.
- One authenticated endpoint, `POST /api/indexnow`, called by a Sanity webhook.
  Authentication is Sanity's own HMAC signature over the raw body, verified with
  Web Crypto: constant-time comparison, and a timestamp freshness window so a
  captured request cannot be replayed indefinitely.
- **The payload supplies an identity, never a URL.** The endpoint derives the URL
  from document type, slug and language through the same `pathFor` and
  `localePath` helpers the canonical and the sitemap use. A hostile or
  misconfigured webhook can therefore only ever name a URL on our own origin in
  our own route shapes.
- A publish notifies the page and the index that lists it: an article notifies its
  own URL and the Journal in the same language. A document type with no public
  page of its own notifies nothing.
- A removal notifies the same URL it would have on publish. That is IndexNow's
  documented way to ask for a recrawl that will find a 404 and drop the entry, and
  it is why removal cannot be derived from the published inventory alone.
- Submission is bounded: a cap on URLs per request, a short per-instance window
  that collapses repeats of the same URL, and no retry storm on refusal.
- Every gate must hold before anything leaves: a configured key, a valid origin,
  `SEO_INDEXING_ENABLED`, a non-preview deployment, and a request that arrived on
  the configured origin. Reuses 28a's policy rather than restating it.
- Unit coverage for the URL derivation, the payload, the response reading, the
  bounds and the signature verification. Browser coverage for the endpoint's HTTP
  contract with IndexNow unconfigured.

## Out of scope, and why

- **Configuring the webhook in Sanity, generating a production key, or submitting
  any URL to a real search engine.** This feature builds the mechanism, disabled.
  Turning it on is a deliberate act after the domain launches, and it belongs to
  the 28d runbook.
- **Any retry queue, durable log or dead-letter store.** This project stores
  nothing server-side. A missed notification costs a page some hours until the
  next crawl, which is the same position the site is in today.
- **Notifying on anything but a Sanity publish.** A deploy that changes a route is
  not a content event and does not fire this.
- **Google.** It does not participate. Nothing here should pretend otherwise.
- **Submitting the whole site,** on a schedule or otherwise. The sitemap already
  advertises everything; IndexNow is for the delta.
- CI, the performance baseline and the launch runbook (28d).

## Build loop

Implement small steps using `workflow.stepReview: every`. Present each diff and
verification evidence before proceeding to the next reviewed step. No checkpoint
commit without approval. `/complete` owns archiving and the final commit/merge gate.

## Build steps

- [x] **Step 1 - Configuration, gating and key verification.** Add `INDEXNOW_KEY`
  to configuration and documentation, a `notificationsAllowed` predicate composed
  from 28a's policy, and the key file route. Nothing outbound yet. *Done when:*
  unit tests prove the predicate refuses a missing key, a missing or invalid
  origin, indexing disabled, a preview deployment and a mismatched request origin,
  and allows only the full set; against the local production build the key file
  answers 200 with exactly the configured key and nothing else, any other key
  answers 404, `/robots.txt` and `/sitemap.xml` are unchanged, and with no key
  configured the key route answers 404 everywhere.

- [x] **Step 2 - The IndexNow client and its bounds.** The payload builder, the
  submission, its response reading and its limits, in `src/lib/server/indexnow/`.
  Server-only, never called yet. *Done when:* unit tests prove an unconfigured
  deployment makes no `fetch` call at all; the payload carries host, key,
  keyLocation and the URL list in IndexNow's documented shape; a list over the cap
  is refused rather than truncated silently; 200 and 202 read as accepted while
  400, 403, 422 and 429 read as refused and are distinguishable in a log line
  carrying no URL; a network failure resolves rather than throwing; and repeats of
  one URL inside the collapse window produce a single call.

- [x] **Step 3 - The authenticated webhook.** `POST /api/indexnow`: signature
  verification, identity to URL derivation, and the call into step 2. *Done when:*
  unit tests prove a valid signature passes and a wrong secret, a tampered body, a
  missing header, a malformed header and a stale timestamp each fail; derivation
  maps article, treatment, legal page and home document to the right localised
  path, maps an article publish to its own URL plus the Journal, maps an unknown
  or non-public type to no URLs, and refuses a draft id; and against the running
  build the endpoint answers 401 unsigned, 400 on malformed input, and 204 with a
  correct signature while unconfigured, having called nothing.

- [x] **Step 4 - Proof and handoff.** Browser coverage of the endpoint and key
  route in both 28a policy modes, the documented verification commands, and the
  runbook section describing how to switch this on after launch. *Done when:*
  `pnpm check`, `pnpm test` and `pnpm build` pass; the browser suite passes on
  4173 and 4174; no run reaches `api.indexnow.org`; and the runbook records the
  key, the webhook projection, the ordering against the domain switch and the fact
  that Google is not a participant.

## Files / areas

- `src/lib/seo/indexnow.ts` (new, pure: the payload, the bounds, the response
  reading) with its unit tests.
- `src/lib/server/indexnow/` (new: configuration, the signature verification, the
  client that holds the key and calls out).
- `src/routes/api/indexnow/+server.ts` (new) and its validation module, following
  `api/reminder`.
- `src/routes/[key].txt/+server.ts` (new) for key verification.
- `src/lib/server/seo/config.ts` and `src/lib/seo/indexing.ts`, read rather than
  rewritten.
- `.env.example`, `AGENTS.md`, `blueprint/reference/seo-launch.md`, `e2e/seo.spec.ts`,
  `e2e/seo-enabled.spec.ts` and `playwright.config.ts`.

## Data / contracts

- **The webhook payload is a document identity, not a URL.** One shape:
  `_type`, `_id`, `slug`, `language`, and whether the event is a publish or a
  delete. Anything else in the body is ignored. This is the contract a person
  types into the Sanity dashboard as a GROQ projection, so it is written down in
  the runbook the way the Customer.io event names are.
- URL derivation reuses `pathFor` and `localePath` from `$lib/seo/pages` and
  `absoluteUrl` from `$lib/seo/links`. No second implementation of a public URL.
- `INDEXNOW_KEY` is server-only and is also the file name of the verification
  document, so it must be treated as a public identifier rather than a secret: it
  is discoverable by anyone who fetches the key file. `SANITY_WEBHOOK_SECRET` is
  the real secret and is never served anywhere.
- Nothing from a questionnaire, no personal data and no draft content may enter a
  payload, a URL list or a log line. Only public marketing URLs travel.

## Testing

- `pnpm check`, `pnpm test`, `pnpm build` (no Verify command exists).
- `pnpm test:browser e2e/seo.spec.ts e2e/seo-enabled.spec.ts`.
- **Unit tests, in scope:** the signature verification at every failure mode, the
  identity to URL derivation, the payload shape, the cap, the collapse window, the
  response classification, and the gating predicate. All pure or `fetch`-mocked.
- **Browser tests, in scope:** the key file route's four cases and the endpoint's
  status contract. The outbound call itself is made by the server process, so
  `page.on('request')` cannot see it and an assertion claiming "nothing reached
  IndexNow" would pass whether the guard works or not. That is the same trap
  `AGENTS.md` records for Customer.io: the guard is proven by the unit test that
  asserts an unconfigured client makes no call.
- The harness must carry a blank `INDEXNOW_KEY`, for the reason the blank
  Customer.io credentials exist: Vite still reads `.env` for anything the
  Playwright config does not override, so without it a local run with a real key
  could submit localhost URLs to a live service.

## Notes for the AI

- Read current Blueprint context first. 28a and 28b are merged; their origin,
  policy, inventory and URL helpers are the foundation and must not be duplicated.
- **Verify the signature with Web Crypto, not a new dependency and not Node
  `crypto`.** `@sanity/webhook` is not installed, and the Customer.io client
  already establishes the rule: `btoa` over `Buffer`, so nothing depends on the
  Node runtime rather than the edge one. Compare digests in constant time; a
  short-circuiting `===` on a signature is a timing oracle.
- **Read the raw body once, before parsing.** The signature covers the exact
  bytes, so `request.json()` first and re-serialising will not verify.
- The key file is not a secret and the webhook secret is not a URL. Keep the two
  apart, and never log either.
- Follow `api/reminder` for the endpoint's shape, but **not** for its status
  policy: that endpoint answers 204 to almost everything because a failed
  marketing mail may never disturb a medical questionnaire. This endpoint is
  called by a machine, so an unauthenticated call is a 401 and a malformed one a
  400, which is what makes a misconfigured webhook visible in Sanity's own
  delivery log instead of silently succeeding forever.
- A log line may name the event and the outcome. It may never carry a URL list, a
  key, a signature or a document id.
- Do not interpret this feature as approval to create the Sanity webhook, generate
  a production key, enable indexing, submit any URL, push, merge or contact any
  third party.
