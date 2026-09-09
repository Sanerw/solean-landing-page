# Feature: Verification and launch handoff

**From build-plan:** feature 28d
**Status:** verified

## Goal

Close feature 28 by making its guarantees repeatable and its remaining work
explicit: one sweep that holds every public page to the same rules, one `Verify`
command with matching GitHub checks, a recorded performance baseline, and the
runbook a person follows on the day the domain goes live.

This feature measures and documents. It does not tune performance and it does not
launch anything. Any fix a measurement justifies goes through `/fix` as its own
reviewed change, which is the boundary 28a's intake recorded.

## In scope

- **One sweep over every public URL**, taken from the sitemap rather than a
  hand-written list, so a page added later is covered without editing the test.
  Each URL is held to the invariants that must be true of all of them: exactly one
  non-empty `<title>`, exactly one non-empty meta description, exactly one `h1`, a
  canonical equal to the URL fetched, a parseable JSON-LD block, and no `img`
  without an `alt` attribute.
- **Titles and descriptions unique across the site.** Two pages sharing either is
  a real defect that no per-page test can see, because it is a property of the set.
- Reuse the existing harness and its two policy servers. No new runner, no new
  dependency.
- **One `Verify` command and its GitHub workflow, created by running `/ci`.** That
  skill owns Verify and CI setup; this feature invokes it and reviews what it
  produces rather than hand-writing a workflow. Verify combines only what this
  project has: typecheck, unit tests, build.
- **A recorded performance baseline**, measured with what is already installed:
  the build's own bundle report, the server-rendered HTML weight, the request
  count and transferred bytes per page, and navigation timings from the existing
  Playwright run against the production preview. Written to a reference document
  with the exact method, so a later run is comparable.
- **The launch runbook**: verifying the domain in Google Search Console and Bing
  Webmaster Tools, submitting the sitemap, the ordered switch-on across 28a's
  origin, 28a's indexing flag and 28c's IndexNow key, and what to check afterwards.

## Out of scope, and why

- **Any performance change.** The baseline exists to say what the numbers are. A
  change justified by one is a separate reviewed `/fix`, so a measurement and a
  refactor never land in the same diff where neither can be judged.
- **Lighthouse or any new measurement dependency.** A Lighthouse score against a
  localhost preview is not the deployed site's score, so the dependency would buy
  a number that cannot be acted on. The method for measuring the real deployment
  is documented instead.
- **Browser tests in `Verify` or in CI.** They need a build, a fixture server and
  a browser download, and `AGENTS.md` already records that adding that slower gate
  is a separate decision. Verify stays the fast gate. Flagged for the user rather
  than decided here.
- **Actually launching**: choosing the domain, setting any remote environment
  variable, deploying, creating the Sanity webhook, verifying a property in Search
  Console, or submitting a sitemap to anyone. All of it is documented, none of it
  is done.
- **Branch protection or required checks on GitHub.** A remote repository setting,
  and `/ci` stops before it by design.

## Build loop

Implement small steps using `workflow.stepReview: every`. Present each diff and
verification evidence before proceeding to the next reviewed step. No checkpoint
commit without approval. `/complete` owns archiving and the final commit/merge gate.

## Build steps

- [x] **Step 1 - The whole-site SEO sweep.** One spec that reads the enabled
  server's sitemap and holds every URL in it to the shared invariants, plus the
  two set-level checks. *Done when:* the sweep visits every URL the sitemap lists
  and fails if any page has zero or several `<title>` or `h1` elements, an empty
  description, a canonical that disagrees with the URL fetched, an unparseable
  JSON-LD block, or an `img` with no `alt`; two pages sharing a title or a
  description fail it; and the whole suite passes, or any real defect it finds is
  reported rather than silently accommodated.

- [x] **Step 2 - Verify and GitHub checks.** Run `/ci` and review what it writes.
  *Done when:* `AGENTS.md` documents one `Verify` command; that exact command runs
  green locally; `.github/workflows/verify.yml` runs the same command on pull
  requests and pushes to the default branch with `contents: read`; the browser
  suite is deliberately absent from both, with the reason recorded; and nothing
  was pushed or configured remotely.

- [x] **Step 3 - The performance baseline.** Measure and record, change nothing.
  *Done when:* `blueprint/reference/performance-baseline.md` records, per public
  page kind, the server-rendered HTML weight, the request count and transferred
  bytes, and the navigation timings, plus the build's bundle report; it states the
  exact commands and the machine-dependence of the numbers; it says plainly that a
  localhost measurement is not the deployed site's; and `pnpm build` and the
  suites are unchanged by it.

- [x] **Step 4 - The launch runbook.** Extend `blueprint/reference/seo-launch.md`
  into the document a person follows on launch day. *Done when:* it records the
  ordered switch-on, the Search Console and Bing verification routes and which one
  suits this deployment, sitemap submission, the post-launch checks with their
  expected answers, the known gaps carried forward, and what to do if indexing has
  to be reversed; and `pnpm check`, `pnpm test`, `pnpm build`, `Verify` and both
  browser suites pass.

## Files / areas

- `e2e/seo-sweep.spec.ts` (new), running against the enabled server so the sitemap
  it reads is populated.
- `playwright.config.ts`, if the new spec needs its own project assignment.
- `package.json`, `AGENTS.md` and `.github/workflows/verify.yml`, written by `/ci`.
- `blueprint/reference/performance-baseline.md` (new).
- `blueprint/reference/seo-launch.md`, extended.

## Data / contracts

- The sweep takes its URL list from `/sitemap.xml` at run time. That is deliberate
  coupling: the sitemap is 28a's claim about what exists, so the sweep tests the
  claim rather than a second list that could drift from it.
- No new runtime code and no new module contract. This feature adds tests,
  configuration and documentation only. Any source change beyond what `/ci` writes
  is out of scope and belongs to a `/fix`.
- The baseline document is a record, not an asserted threshold. Nothing fails a
  build for missing a number in it; turning one into a budget is a later decision.

## Testing

- `pnpm check`, `pnpm test`, `pnpm build`, then the `Verify` command once step 2
  defines it.
- `pnpm test:browser`, both projects, including the new sweep.
- **Unit tests:** none expected. This feature adds no logic where a wrong answer
  is possible. If step 1 needs a non-trivial parser to read the sitemap, that gets
  a focused unit test rather than living untested inside a spec file.
- **The sweep is a real gate, so it must be allowed to fail.** If it finds a
  missing `alt`, a duplicate description or a second `h1`, that is a defect this
  feature has surfaced. Report it and let the user decide whether to fix it here
  or record it; do not weaken the assertion to make the suite green.

## Notes for the AI

- Read current Blueprint context first. 28a, 28b and 28c are merged; their
  origin, policy, inventory, metadata and notification modules are the foundation.
- **`/ci` owns Verify and the workflow.** Invoke the skill in step 2 rather than
  writing `verify.yml` by hand, and let it detect the real commands. It combines
  only checks that exist: this project has no lint or format command, so Verify is
  typecheck, unit tests and build.
- The baseline is measured against the local production preview with the fixture
  server, so its images come from the CDN but its HTML does not cross a network.
  Say what the number is and is not; the overview already records 2.0 to 2.5
  seconds of cold start against the real deployment, which no local run reproduces.
- Do not add a dependency for measurement, and do not fold a performance fix into
  this feature however tempting the number looks.
- Do not interpret this feature as approval to deploy, enable indexing, generate a
  key, create a webhook, verify a Search Console property, submit a sitemap, push,
  merge or contact any third party.
