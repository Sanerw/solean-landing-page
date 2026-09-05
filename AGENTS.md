# AGENTS.md

Instructions for AI coding agents working in this project. This is the cross-tool
entry point: Codex, OpenCode, Cursor, GitHub Copilot, Gemini CLI, Aider, Zed,
Windsurf, and others read `AGENTS.md`. Claude Code reads `CLAUDE.md`, which imports
this file, so there is a single source of truth.

## What this is

The landing page for Solean, built with SvelteKit (Svelte 5, runes mode),
Tailwind CSS v4, and shadcn-svelte.

> TODO: the product problem, audience, and deployment target are not defined yet.
> Fill in `blueprint/project-plan.md`, then run `/overview`.

This project is built with the **AI Blueprint**, a workflow layer, not an
app skeleton. To start a new project, scaffold the app first in an empty folder
(create-next-app, Vite, etc.), then overlay these files on top. Never run a
framework scaffolder inside a directory that already holds the blueprint files
(`AGENTS.md`, `CLAUDE.md`, `.agents/`, `.claude/`, `blueprint/`); it fails
because the directory isn't empty.

The workflow is defined by the local skills and context files below.

## Read these for full context

- `blueprint/config.json` - deterministic project workflow settings
- `blueprint/context/project-overview.md` - the project's source of truth
- `blueprint/context/coding-standards.md` - conventions to follow
- `blueprint/context/ai-interaction.md` - how to work with the user on this project
- `blueprint/context/current-feature.md` - the one feature, fix, or rollback being built right now

## Project configuration

`blueprint/config.json` is the user-owned, machine-readable workflow policy for
this project. Workflow skills read the relevant settings before acting. A
missing file means built-in defaults. An invalid file falls back to defaults for
read-only status reporting, but mutating workflow commands stop and point to
`/doctor` instead of guessing.

Configuration can make review or verification stricter and can tune local
branch names and automated-mode limits. It never grants permission to commit,
merge, push, deploy, publish, send, delete data, waive a failing check, or accept
a finding. Those approval and safety boundaries are not configurable.

`qualityGates.regular` controls automatic audit, check, and try-guide behavior
for the normal workflow and Autopilot. `qualityGates.continuous` controls the
same per-feature gates for Continuous Mode. Every gate defaults to `manual`, so
the named skill runs only when explicitly requested. The conditional modes are
`when-sensitive` for audit, `when-behavioral` for check, and `when-user-facing`
for try guides. `always` runs the gate for every work item in that workflow.

## Workflow

Build one feature, fix, or rollback at a time, behind review gates. Each step's instructions
are plain markdown skills any capable agent can read and follow. The workflow is
exposed through tool-specific adapters:

- Codex: `.agents/skills/<skill>/SKILL.md`
- Claude Code: `.claude/skills/<skill>/SKILL.md`
- GitHub Copilot: `AGENTS.md` plus `.agents/skills/<skill>/SKILL.md`
- OpenCode: `AGENTS.md` plus the compatible `.agents/skills/` or
  `.claude/skills/` tree already installed for the selected tools

Unused adapters can be removed. Codex, GitHub Copilot, and OpenCode can share
`.agents/`. OpenCode can also reuse `.claude/` when Claude Code is selected.
Codex-only, Copilot-only, or OpenCode-only projects can delete `CLAUDE.md` and
`.claude/`. Claude Code-only projects can delete `.agents/`, but should keep
`AGENTS.md` because `CLAUDE.md` imports it. Do not duplicate the same Blueprint
skills under `.opencode/skills/`; OpenCode already discovers the compatible
trees.

When changing shared workflow behavior, update the matching skill in both
adapter folders so Codex, Claude Code, GitHub Copilot, and OpenCode stay aligned.

Core skills:

- `onboard` - tune commands, standards, visibility, ignore rules, and tool adapters after overlaying the Blueprint onto a freshly scaffolded or early project
- `discovery` - optional deep, multi-turn planning conversation that drafts the two user-owned plans only after review and approval; direct plan writing remains fully supported
- `doctor` - read-only Blueprint health check for setup, adapters, plans, overview freshness, and workflow drift
- `adopt` - bootstrap the Blueprint into an existing brownfield app with shipped features
- `overview` - distill the two planning docs into `blueprint/context/project-overview.md`
- `brief` - read-only briefing on an upcoming build-plan feature (scope, dependencies, size) before you spec it
- `feature` - turn a build-plan item into a spec, or propose a reviewed plan addition for a genuinely new feature
- `debug` - reproduce and isolate a failure without editing code, then hand the evidence to `fix` or `implement`
- `fix` - document an ad-hoc bug or change into `blueprint/context/current-feature.md`
- `tests` - add or normalize unit testing and turn on the test gate
- `browser-tests` - explicitly add or normalize a repeatable browser test harness and document its command
- `ci` - explicitly set up one project-specific Verify command and matching automatic GitHub checks
- `implement` - build the current spec one small, reviewed step at a time
- `check` - prove the current spec against the running app
- `try` - read-only manual review guide: where to go, what to click, what to expect
- `audit` - branch-aware or full-project review across all concerns or a focused quality, security, performance, or tests lens; records findings with durable IDs and statuses in `blueprint/context/findings.md`, where open or fixed P0/P1 findings block `complete`
- `rollback` - plan a safe reversal of a completed feature from its archive and exact git commit, with later-dependency review before code changes
- `complete` - run the final safety pass, log features, fixes, or rollbacks under `blueprint/history/`, then merge with approval
- `release` - optional Render or Vercel deployment readiness, local config, env review, and smoke-test planning
- `prototype` - optional, pre-build static mockups to lock the look
- `status` - read-only progress summary, workflow drift warning, and suggested next action

In Codex, invoke these as skills (`$onboard`, `$discovery`, `$overview`, `$feature`,
`$implement`, and so on) or ask naturally, such as "run the overview." In Claude
Code, use the slash commands (`/onboard`, `/discovery`, `/overview`, `/feature`,
and so on). In OpenCode or other tools without a dedicated invocation syntax,
ask the agent to run the matching skill or follow its `SKILL.md` manually. The
conventions in `blueprint/context/` apply however a step is invoked. `/discovery`
is never required: users may write detailed plans directly or develop them
through any conversation before running `/overview`.

Optional explicit-only skill: `autopilot` can run one bounded spec/build pass
when directly invoked, including the configured regular quality gates. It may
create checkpoint commits on the feature or fix branch after passing steps and
repair confirmed P0/P1 findings when its audit gate runs. It stops before
`/complete`, merge, push, deploy, or destructive actions.

Optional explicit-only skill: `continuous` can resume or select the next planned
feature and repeat the complete local feature lifecycle through the configured
limit or end of the build plan. It creates one branch and one local main commit
per feature, applies the Continuous quality gates, archives and merges serially,
and stops on decisions or failed safety gates. It never pushes, deploys,
publishes, sends, or performs destructive actions.

Deployment is also explicit. `/release` can prepare local Render or Vercel config
and run readiness checks, but it must stop before deploy, remote service changes,
push, or publish unless the user gives a separate yes in the current chat.

## Dashboard activity

The dashboard can show the active or most recent substantial Blueprint command
from `blueprint/.state/run.json`. This file is generated local state, ignored by
Git, and never part of a feature commit.

Commands with meaningful progress or a durable handoff should write it when the
state directory exists: `onboard`, `adopt`, `discovery`, `overview`, `feature`,
`fix`, `rollback`, `implement`, `debug`, `check`, `audit`, `tests`,
`browser-tests`, `ci`, `prototype`, `autopilot`, `continuous`, `complete`, and
`release`. Short
read-only orientation commands such as `brief`, `try`, `status`, and `doctor`
do not need activity state.

Writing the initial activity record is the first action of a tracked command,
before project inspection, preflight, or other tool calls. This one generated
state write does not authorize product changes or bypass any safety check. Set
status to `running`, use the command name and a truthful initial summary, then
replace the record at meaningful milestones. On a preflight stop or another
blocker, set it to `blocked` with the exact recovery command. Leave the final
state in place for the next session; the next tracked command replaces it. Use
this schema:

```json
{
  "schemaVersion": 1,
  "command": "continuous",
  "status": "running",
  "summary": "Completing the remaining build plan",
  "detail": "Implementing feature 3.",
  "boundary": "local-only",
  "startedAt": "<ISO-8601 timestamp>",
  "updatedAt": "<ISO-8601 timestamp>",
  "resumeCommand": "/continuous resume",
  "progress": { "current": 2, "total": 5, "label": "features" },
  "feature": { "id": "3", "title": "Export reports" }
}
```

`status` must be `running`, `blocked`, `ready`, or `completed`. Use `ready` when
the command reached its intended review handoff, such as Autopilot waiting for
review before `/complete`. Use `blocked` with the exact recovery command when
work can resume. `boundary` must be `read-only`, `reviewed`, or `local-only`.
The progress, feature, detail, boundary, and resume fields are optional. Never
put secrets, raw logs, prompts, or user content in this file. Activity tracking
must not change a command's approval boundaries or turn a reporting failure into
a workflow failure.

## Analytics: Mixpanel

Mixpanel is the only analytics tool in this project, and it covers events, session replay and
heatmaps. Do not add a second analytics tool, a tag manager, or a separate session recorder or
heatmap vendor: each would reopen decisions this section settles. Mixpanel's own heatmap is
not a second tool and is on, under the rules below.

| Detail | Value |
| --- | --- |
| Platform | SvelteKit 2, Svelte 5 runes, browser only |
| SDK | `mixpanel-browser`, the **`mixpanel-with-async-recorder`** build, imported dynamically, never at module scope |
| Tracking method | client-side |
| CDP | none |
| Consent required | **yes**, DSGVO. Nothing is sent or recorded before an explicit accept |
| Session replay | **on, every page including the questionnaire**, share set by `PUBLIC_MIXPANEL_REPLAY_PERCENT` |
| Heatmaps | **on, every page including the questionnaire**, `record_heatmap_data`. Rides on the replay: no recording means no heatmap |
| Data residency | EU, `https://api-eu.mixpanel.com` |
| Token | `PUBLIC_MIXPANEL_TOKEN`. Absent means this deployment does not measure, which is a valid state |

Everything lives in `src/lib/analytics/`:

| File | What it owns |
| --- | --- |
| `config.ts` | the token and the ingestion host, read from `$env/dynamic/public` |
| `consent.ts` | the cookie, and `mayTrack`, the rule that only an explicit yes tracks |
| `consent.svelte.ts` | the decision as rune state, seeded from the server's read of the cookie |
| `client.ts` | the single Mixpanel instance, its config, and `track` |
| `events.ts` | **every event name and property in the app** |
| `ConsentBanner.svelte` | the banner, rendered from the root layout |

### Adding an event

Add a function to `events.ts` and call that. Never call `track` from a component, and never
build an event name from a variable: Mixpanel is case-sensitive and treats a typo as a new
event forever. Names are `snake_case`, and one name means one thing.

Current events: `page_viewed`, `questionnaire_started`, `anamnesis_submitted`,
`checkout_started` (the value moment). Super properties `platform` and `locale` are registered
at init, so no event repeats them.

### What may never be sent

This is a medical funnel, and `project-overview.md` states that the answers never reach
analytics. No event property may carry:

- an answer value, or anything derived from one
- the visitor's e-mail, name, or telephone number
- the anamnesis uid
- the medication, the dose, or the Shopify variant

Three consequences that are easy to undo by accident:

- **`autocapture` is off in `client.ts` and must stay off.** It reports the text of clicked
  elements, which on a questionnaire step is the wording of a medical question and the answer
  chosen, in clear. Heatmaps do not need it, and leaving it off is what keeps them safe:
  `capture_text_content` lives in the autocapture config, and `Autocapture.getFullConfig()`
  returns `{}` while `autocapture` is `false`, so `$el_text` is unreachable rather than merely
  defaulted off. `client.test.ts` fails if this moves.
- **Our own `page_viewed` is never sent for a `/questionnaire` path.** The model branches on
  `visibleIf`, so which steps a person sees is derived from what they answered: the path is
  the answer. `isTrackablePath` enforces this and is unit tested. It no longer means no
  questionnaire path reaches Mixpanel at all; the heatmap's `$mp_web_page_view` carries the
  full URL, which the Heatmaps section below explains and which was accepted with it.
- **Every questionnaire surface carries `mp-sensitive`.** See Heatmaps below. Without it a
  click sends the answer's own wording as an event property.

### Session replay

Recording is **on for every page, the questionnaire included**. That was decided deliberately
on 2026-09-03, against the recommendation recorded here, and the masking is what it rests on.

`record_mask_all_text` and `record_mask_all_inputs` are set to `true` explicitly rather than
left to the defaults. Do not remove them: the SDK flips `maskAll` to `false` the moment a
masking *selector* is configured without them (`getPrivacyConfig`, the migration branch), so
a later "unmask just the headings" would silently unmask the whole page. `record_console`,
`record_network` and `record_canvas` are off, and `img, video, audio` are blocked.

**What the masking does not cover.** The questionnaire model is public and identical for every
visitor, fetched by uid without authentication. A recording keeps the structure, the option
positions and the click, so those plus the model reconstruct the answers even with every label
masked. Treat funnel replays as medical records: restrict access, keep retention short, and
make sure the privacy policy says recording happens.

Three mechanics worth knowing before touching this code:

- **The build matters.** The default `mixpanel-browser` entry point cannot record: its
  `load_extra_bundle` throws "not available in this build", so recording fails to start with
  no error. Only `mixpanel-with-async-recorder` ships a loader.
- **The recorder is self-hosted, and has to be.** The SDK asks its own CDN for
  `mixpanel-recorder-BbPxtaqp.js`, and that URL is a **404 serving an HTML error page**, so
  Chrome rejects it as `ERR_BLOCKED_BY_ORB` and nothing is ever recorded. `client.ts` imports
  the copy inside the package with `?url` and passes it as `recorder_src`, which also keeps
  the feature free of any third-party script. The hash in that filename belongs to the
  installed version: a `mixpanel-browser` upgrade breaks the import at build time, and that
  is the failure worth having.
- **Recording is started by name.** The SDK's auto-start runs once inside `init`, behind its
  own opt-out check, and this client is opted out at that moment by design. Nothing re-runs it
  afterwards except `reset`, which an app without accounts never calls.
- **Sampling is ours.** `start_session_recording` forces a recording and ignores
  `record_sessions_percent`, so `shouldRecordSession` applies the share before the call. Both
  it and `clampReplayPercent` are unit tested.

Withdrawing consent calls `stop_session_recording` explicitly. `opt_out_tracking` does not
stop rrweb, so without it a session already being recorded would go on being recorded after
the person withdrew.

### Heatmaps

On for every page, the questionnaire included, decided on 2026-09-03 alongside the replay and
resting on the same reasoning. `record_heatmap_data: true` in `client.ts` is the switch, and
`autocapture` stays `false`.

Clicks are only collected while a replay is live (`is_recording_heatmap_data()` is
`getSessionReplayId() && record_heatmap_data`), so `PUBLIC_MIXPANEL_REPLAY_PERCENT` turns
heatmaps down with it and `0` turns both off. The events it adds, `$mp_click`,
`$mp_dead_click`, `$mp_rage_click` and `$mp_web_page_view`, are exempt from event billing.
They are not exempt from the rules above.

Three mechanics, each one a way to get this wrong quietly.

- **`mp-sensitive` is what makes it safe, and it does not reach portals.** A heatmap click
  reports `$elements`, one entry per ancestor, each carrying the SDK's `TRACKED_ATTRS`:
  `aria-label`, `aria-labelledby`, `aria-describedby`, `href`, `name`, `role`, `title`, `type`.
  This app puts answers in `aria-label` on purpose, so a screen reader can name a control:
  the choice fields label each option with its own text, and the calendar labels its cells with
  the date. `QuestionnaireShell` carries the class, and so does the date picker's
  `Popover.Content`, because `bits-ui` portals that to `document.body` and a browser run caught
  the date of birth leaving that way. **A class on `<body>` does not work**:
  `shouldTrackElementDetails` walks `curEl.parentNode && !isTag(curEl, 'body')` and never reads
  the body's own classes. Any new questionnaire surface that portals, a dialog, a sheet, a
  select, needs its own copy. Never `mp-no-track`: `isElementBlocked` reads that one and would
  discard the click, leaving no heatmap at all.
- **The entry page needs a second call.** `autocapture.init()` runs synchronously inside
  `mixpanel.init()`, before the recorder has loaded and assigned a replay id, so the
  `$mp_web_page_view` that anchors a heatmap to a page is skipped on the page the visitor
  arrived on. Later client-side navigations send one. `anchorHeatmapToRecording` re-applies the
  flag with `set_config` once `start_session_recording()` resolves, which re-runs
  `autocapture.init()` with a replay id in hand. Remove it and the landing page has clicks and
  no page, silently.
- **Questionnaire paths now reach Mixpanel.** `$mp_web_page_view` carries the full URL and
  `$mp_click` carries `$pathname`, so `isTrackablePath` governs `page_viewed` only. This is the
  replay trade rather than a new one: the branching model is public, so the steps a person was
  shown are derived from what they answered either way. Accepted knowingly with the replay.

### Consent

`opt_out_tracking_by_default` is on, and the SDK is behind a dynamic import, so a visitor who
declines never downloads the vendor's code at all. Consent is a first-party cookie read by
`src/routes/+layout.server.ts`, so the banner is server-rendered and never flashes at someone
who already answered.

Anything that depends on consent must also depend on the decision as a reactive dependency:
the banner is answered on the page the visitor is standing on, and an effect that only watches
the path will have already run and been dropped. `track` returns whether the event was
accepted for exactly this reason, so a one-shot event is not spent on a gate that refused it.

There is no `identify()` or `reset()` anywhere, and there should not be: this app has no
accounts, no login, and no logout. Every visitor is an anonymous `distinct_id`.

**The privacy policy does not yet say any of this, and that gap is open on purpose.**
`src/lib/features/legal/content/privacy.ts` names Google Analytics, Google Ads and Google Tag
Manager, and mentions neither Mixpanel, nor session replay, nor heatmaps. The site records
sessions on a medical questionnaire and describes that nowhere.

It is not fixed here because that file is a verbatim mirror and says so in its own header:
copied from `https://solean.com/policies/privacy-policy`, not ours to edit. The controller is
DTC Healthtech Solution Limited, with heyData GmbH as data protection officer. Amending the
mirror alone would put two different privacy policies live for one controller, which is worse
than the gap. The document is Solean's to amend at the source; re-import afterwards.

Reviewed and deliberately deferred on 2026-09-03. Do not close it with a local edit.

### Testing

`src/lib/analytics/*.test.ts` covers the consent rule, the questionnaire path rule, the
one-shot gate, the property shapes, the replay share and sampling, and the shape of the SDK
configuration itself: `client.test.ts` asserts every privacy-bearing flag, so switching
`autocapture` on or dropping a mask fails the suite instead of leaking quietly.

`e2e/analytics.spec.ts` proves the gate and the funnel in a browser with every Mixpanel request
intercepted, and asserts the recorder bundle **answers 200** rather than merely being
requested. That distinction is the bug above: a request was made, Chrome blocked the response,
and a spec counting requests passed while nothing recorded.

It also walks the questionnaire with consent granted and asserts that no `$mp_click` from a
questionnaire path carries any `$attr-` key, and that the payload contains neither the
diagnosis clicked nor the year of birth entered. **That test is the reason `mp-sensitive` sits
on the date picker as well as the shell**, and it is the guard to run before touching either.
Reading the SDK source did not find the portal; the browser run did.

The browser suite otherwise runs with analytics declined (`CONSENT_DENIED_STATE` in
`playwright.config.ts`), because the banner is fixed to the bottom of the viewport and would
sit over the Continue button the other specs press. `analytics.spec.ts` overrides that with its
own `test.use`.

## Lifecycle e-mail: Customer.io

Customer.io sends one thing: a reminder to somebody who typed their e-mail into the
questionnaire and did not submit it. It is not an analytics tool, it holds no answers, and it
has no browser presence. Do not add its JavaScript snippet, in-app messaging, or any other
third-party script: the Analytics section above rules out a second measurement tool and a tag
manager, and this integration is server-side REST or nothing.

It replaced Brevo in feature 23. The seam did not move, only the vendor behind it.

| Detail | Value |
| --- | --- |
| Endpoints | `POST https://track-eu.customer.io/api/v2/entity` and `/api/v2/batch` |
| Region | **EU**, and not interchangeable with the US host. See the region trap below |
| Auth | HTTP Basic, `CUSTOMERIO_SITE_ID` and `CUSTOMERIO_TRACK_API_KEY`, server only. Either one absent means this deployment sends no reminders |
| Key type | a **Track API key**, not an App API key. They are different credentials and only the first authenticates these endpoints |
| Our endpoint | `POST /api/reminder`, `{ stage, email, firstName, lastName, phone, language }` |
| What may travel | the contact details from `your-details` and a stage marker. Nothing else, ever |

### The three strings a person types into the Customer.io panel

The campaign lives in Customer.io, not here: how many mails, how far apart, what they say, and
the condition that stops them are all panel configuration, so they change without a deploy.
This repository guarantees only that two events arrive, named exactly:

| Role in the campaign | String |
| --- | --- |
| Entry trigger | `questionnaire_email_captured` |
| Exit condition | `anamnesis_submitted` |
| Person attribute, checked before each send | `questionnaire_completed` |

Customer.io compares these literally and a mismatch raises nothing: it silently leaves the
campaign unarmed. They are one constant each in `src/lib/server/customerio/payload.ts`, never
assembled from parts, the same rule `ANAMNESIS_ATTRIBUTE_KEY` follows.

**Both event names have already been received**, sent from a test address on 2026-09-03, so a
`Custom event` trigger in the panel will offer them. A third event name added later needs the
same treatment before it can be wired into a campaign.

### Four things proven against the live workspace on 2026-09-03

Each one changed the code. This is why feature 23 spent its first step on a live preflight
rather than on reading documentation.

- **Success is `200` with `{}`, not `204`.** Brevo answered 204, and carrying that check across
  unchanged would have reported every successful send as a failure and written a log line per
  questionnaire while the events arrived normally. `wasAccepted` keys on `response.ok`.
- **An event's `attributes` are the event's, and never reach the profile.** So the submitted
  stage cannot be one call the way Brevo's was. It is one `POST /api/v2/batch` carrying an
  `identify` that sets `questionnaire_completed`, then the event. The identify goes first, so
  the attribute is already true when the event that triggers the exit is evaluated.
- **A batch reports per-entry failures inside a `200` body.** Reading the status alone would
  accept a call whose identify or event was rejected, so `wasAccepted` reads the body too. This
  is a failure channel Brevo did not have.
- **The event alone creates the person, and a new attribute is created on write.** There is no
  `identify` on the capture path and nothing has to be pre-created in the panel. This is the one
  place Customer.io is simpler than Brevo, which silently discarded an attribute that did not
  already exist.

**The region trap.** `GET /auth` answers `200` on `track-eu.customer.io` **and** on
`track.customer.io` with the same credentials, so nothing at runtime tells you the region is
wrong. A 401 is not the signal either, because a wrong key looks identical. The EU host is used
because the workspace is an EU workspace, confirmed in the panel and nowhere else.

### What may travel, and what may never

**What may travel** is what a person types into `your-details`: the e-mail, the first name, the
last name, and the telephone number when it was given. They reach Customer.io as profile
attributes on the `identify` half of both stages, under its own conventional keys, `first_name`,
`last_name` and `phone`, because `{{customer.first_name}}` is what somebody writes into a
template in the panel.

The name and the number were forbidden here until **2026-09-05**, when the user asked for them
so a reminder can greet the person it is sent to. Nothing else about that decision moved: an
identifier still leaves an unfinished medical questionnaire before any submission, and typing
the e-mail and pressing Continue is still the whole consent step.

**What may never be sent:** no answer value, no anamnesis uid, no medication or dose.

Three mechanics hold that line, and none of them is decoration.

- **`ReminderPerson` is a closed record, not a bag.** The builder used to take two scalars for
  this reason; it now takes one typed record whose fields it reads *by name*, one line each,
  rather than spreading. A field added to the record cannot travel until somebody writes the
  line that sends it.
- **`payload.test.ts` asserts the exact key set at every depth**, not the absence of known-bad
  keys, so a field added later fails the test instead of travelling. Its key collector is
  recursive on purpose, because the submitted stage nests inside `batch[]` and a hand-written
  flattener would stop measuring exactly where the nesting begins.
- **The public endpoint drops what it cannot use rather than refusing it.** `/api/reminder` is
  public, so the name and the number are hostile input: they are trimmed, capped at 100 and 32
  characters, and dropped when empty, oversized, of the wrong type, or carrying a control
  character. Only the address is worth a 400, because it is the identifier. A rejection anywhere
  else would cost the reminder itself, and this endpoint may never be why a questionnaire fails.

An unanswered field is omitted rather than sent empty, at both ends: `JSON.stringify` drops the
`undefined` in the browser, and the builder skips a blank. An empty `first_name` renders as
"Hallo ," where an absent one lets the template fall back.

### Three guards that look optional and are not

- **Both credentials blank in `playwright.config.ts`.** Vite still reads `.env` for anything
  `webServer.env` does not override, so without those lines every browser run enrols its
  walked-through addresses as real people. Both are blanked, not one: the client reads a
  half-configured pair as unconfigured, and leaving one set would make the protection an
  accident rather than the intent.
- **The browser suite cannot prove that guard, and an assertion claiming to is worse than
  none.** The outbound call is made by the server, in the `webServer` process, so
  `page.on('request')` never sees it and a "nothing reached customer.io" assertion passes
  whether the guard works or not. One was written during feature 23 and removed for exactly this
  reason. What proves it is `client.test.ts`, which asserts that an unconfigured pair makes no
  call at all. This differs from `analytics.spec.ts`, which really can intercept Mixpanel,
  because that traffic leaves the browser.
- **`/api/reminder` answers 204 to everything except malformed input**, including unconfigured
  credentials and a Customer.io that refuses. The reminder is marketing and the questionnaire is
  medical: a failed mail may not delay a navigation, block a submission, or put an error in
  front of somebody answering questions about their health. The browser never awaits these calls
  and swallows rejections.

### Known and accepted

`/api/reminder` is public, so anyone can enrol any address, the same property every newsletter
sign-up has. A real double opt-in was weighed on 2026-09-03 and declined: it means only somebody
who clicks a confirmation mail is ever reminded, and a person who just abandoned a medical
questionnaire rarely does. The user chose reach. A script can therefore enrol third parties and
consume the workspace's sending allowance. Revisit through `/fix` if it is ever abused.

**There is no consent gate on the reminder**, deliberately, and it is unrelated to the analytics
banner. Typing the e-mail and pressing Continue is the whole consent step, decided by the user
on 2026-09-03.

**Customer.io creates the person as `Subscribed`.** Relevant to the campaign rather than to this
code, and consistent with the reach decision above.

## Automatic verification

Automatic GitHub checks are a separate explicit setup. `/onboard` and `/adopt`
only report existing checks and point to `/ci` or `$ci` when none exist. Running
`/ci` inspects the real project and defines one `Verify` command from checks that
already exist. Use this order when available: typecheck, tests, then build. Never
invent a test runner or another check just to fill the command.

For JavaScript and TypeScript projects, prefer a package script such as `verify`
and use the detected package manager. For other stacks, use the native task
runner or exact combined command. Record the exact command under Commands below.

The optional `.github/workflows/verify.yml` must run that same command for pull
requests and pushes to the default branch. Preserve existing workflows, use the
project's real runtime and install command, and grant only `contents: read` by
default. This setup does not add local git hooks, coverage, browser tests,
security scans, or version matrices. Those remain later project choices.

GitHub branch protection or a ruleset can require the check after the repository
is pushed, but that is a separate remote setting. Missing automatic GitHub
checks do not make the Blueprint unusable.

## Commands

Package manager: **pnpm**, pinned to 11.25.0 by `package.json#packageManager` so the version that
writes the lockfile is the version Vercel installs with. pnpm 11 refuses a lockfile entry published
less than a day ago, and that check runs against the committed lockfile, not just fresh resolution,
so an older pnpm resolving without the rule produces a lockfile the deploy rejects.

- Dev server: `pnpm dev` (http://localhost:5173)
- Build: `pnpm build`
- Preview production build: `pnpm preview`
- Typecheck: `pnpm check` (runs `svelte-kit sync` then `svelte-check`)
- Typecheck (watch): `pnpm check:watch`
- Unit tests: `pnpm test` (Vitest, `src/**/*.test.ts`)
- Unit tests (watch): `pnpm test:watch`
- Browser tests: `pnpm test:browser` (Playwright, Chromium)
- Questionnaire fixture API: `pnpm fixture:questionnaire` (port 4319)
- RxScale contract check: `pnpm check:model`

No lint or format command is configured. No `Verify` command and no automatic
GitHub checks exist yet.

`pnpm check:model` asks RxScale whether their questionnaire still matches
`src/lib/features/questionnaire/rxscale/model-snapshot.json`, the copy feature 24
builds against. It is **deliberately not part of `pnpm test` or any CI job**:
their availability is not this project's build status, and an outage of theirs
must not redden a build for a change that has nothing to do with them. Open
question 13 in `project-overview.md` records that the schedule for running it is
still undecided.

It compares structure only, never wording: names, types, `isRequired`,
`visibleIf`, choice values, `multipletext` items and validator expressions, plus
the document's `identifier` and `version`. A reworded question of theirs is not
drift, because the wording is Solean's from feature 24a.

Two exit codes, and the difference matters: **1 means the questionnaire moved**,
**2 means RxScale could not be reached or answered something unusable**. Sharing
one would make a network blip read as a change to the funnel. When it reports
drift, the fix is a fresh snapshot plus whatever the change implies for the
mapping and the coverage guards, and that is a deploy.

**The test gate is on.** `pnpm test` is declared above, so a step that adds
logic where a wrong answer is possible ships a passing test in the same
reviewable diff. Unit tests live beside the source they cover
(`feature.test.ts`) and Vitest collects `src/**/*.test.ts` only: `e2e/` belongs
to Playwright and is not part of this command. UI components and integration
surfaces stay out of unit tests and ride on the browser harness and the build,
per the Testing section of `blueprint/context/coding-standards.md`.

Browser tests run Playwright against the production preview build, which the
runner starts on port 4173 and stops again, so no server needs to be running
first. Specs live in `e2e/`. They are deliberately not part of any `Verify`
command or GitHub workflow; adding that slower gate is a separate decision.

`pnpm fixture:questionnaire` serves `e2e/fixtures/questionnaire-model.json` as
the RxScale anamnesis API on port 4319, under `/api/v2/anamnesis`,
`/api/v3-1/anamnesis` and the documented `/v4/anamnesis` prefix.
It exists so the questionnaire can be developed and tested without calling the
live API. The fixture is a trimmed snapshot of the real questionnaire keeping one
page of each question type.

What the harness proves is behavior: routing, hydration, client state,
validation, and navigation. It does not prove visual fidelity against the
design reference, and it runs Chromium only, so no cross-browser claim follows
from a green run. Compare screens with the artboards in `blueprint/reference/`
through `/check` or `/try` instead.
