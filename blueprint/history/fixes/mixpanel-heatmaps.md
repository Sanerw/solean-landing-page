# Mixpanel heatmaps on every page

**Type:** Fix
**Status:** verified

## The problem

Heatmaps were asked for alongside events and session replay, and the site has
none: `src/lib/analytics/client.ts` never sets `record_heatmap_data`, so
Mixpanel has no click or scroll data to build one from.

Turning the flag on is one line, and one line is not the fix. Reading
`mixpanel-browser` 2.82.1 in `node_modules` turns up three things the
documentation does not say, and two of them are the difference between a
feature that works and one that looks enabled.

**1. Heatmap data runs through the Autocapture module, whatever `autocapture` is
set to.** `record_heatmap_data: true` registers Autocapture's click, scroll and
pageview listeners even with `autocapture: false`, and they emit `$mp_click`,
`$mp_dead_click`, `$mp_rage_click` and `$mp_web_page_view`. The events are
exempt from event billing (`$captured_for_heatmap`), but they are real events
with real properties.

**2. Those properties would carry the answers.** `$mp_click` includes
`$elements`, one entry per ancestor, and each entry carries the attributes in
the SDK's `TRACKED_ATTRS`: `aria-label`, `aria-labelledby`, `aria-describedby`,
`href`, `name`, `role`, `title`, `type`. This app puts the answer's own wording
in exactly that attribute, for screen readers:

| File | Line | What it sets |
| --- | --- | --- |
| `src/lib/features/questionnaire/fields/RadiogroupField.svelte` | 72 | `aria-label={choice.text}` |
| `src/lib/features/questionnaire/fields/CheckboxField.svelte` | 70 | `aria-label={choice.text}` |

So a click on a medical option would send `$attr-aria-label` holding the text of
the answer chosen, in clear. That breaks the rule stated at the top of
`events.ts` and in `project-overview.md`: no answer value, or anything derived
from one, may reach analytics. It is also a different thing from the session
replay decision, which rests on every label being masked and only the structure
surviving.

`getSafeText` and `$el_text` are not a worry: `capture_text_content` defaults to
`false` and is unreachable while `autocapture` is `false`, because
`Autocapture.getFullConfig()` returns `{}` for a falsy `autocapture`.

**3. The first page of a visit would have clicks and no page.**
`is_recording_heatmap_data()` is `getSessionReplayId() && record_heatmap_data`,
and `autocapture.init()` runs synchronously at the end of `mixpanel.init()`,
before the recorder bundle has loaded and assigned a `replayId`. The anchoring
`$mp_web_page_view` is therefore skipped on the entry page, while later
client-side navigations do send one, because the listener registers off the raw
config. The entry page is usually the landing page, which is the main thing a
heatmap is wanted for.

## The fix

Turn heatmap collection on for every page, the questionnaire included, matching
the session replay decision of 2026-09-03. Keep the answers out of the event
properties with the SDK's own opt-out class, and close the ordering gap so the
entry page is anchored.

Three moves:

1. `record_heatmap_data: true` in `init`, with `autocapture` staying `false`.
   Nothing else about the SDK configuration changes.
2. After `start_session_recording()` resolves, call
   `set_config({ record_heatmap_data: true })`. `MixpanelLib.set_config` re-runs
   `autocapture.init()` when that key is present, and by then a `replayId`
   exists, so the entry page gets its `$mp_web_page_view`. The `init*` helpers
   each `removeEventListener` before re-registering, so no listener is doubled.
3. Put `mp-sensitive` on the questionnaire shell's root element.
   `SENSITIVE_DATA_CLASSES` is hardcoded in the SDK rather than read from
   configuration, so it applies with `autocapture: false`. It drops every
   `$attr-*` value for the element and its whole subtree while still counting
   the click, which is what a heatmap needs.

### What this must not break

- The four events in `events.ts`, their properties, and the one-shot gate.
- `isTrackablePath`, which still governs our own `page_viewed`.
- The masks, `record_console`, `record_network`, `record_canvas`, `ip: false`,
  and the self-hosted `recorder_src` import.
- The consent gate: no heatmap click exists without a replay, and no replay
  exists without an explicit yes.
- Sampling: `record_sessions_percent` at 0 means no replay, therefore no heatmap.

### What is knowingly accepted

Mixpanel's own `$mp_web_page_view` carries the full URL, so from now on
`/questionnaire/<step>` paths reach Mixpanel through that event, and `$mp_click`
carries `$pathname`. `isTrackablePath` keeps our `page_viewed` off those paths,
but it is no longer true that no questionnaire path reaches Mixpanel, and the
code must stop implying otherwise.

This is the same trade the session replay decision already made: the branching
model is public, so the set of steps a person was shown is derived from what
they answered. It was taken deliberately by the project owner on 2026-09-03. The
masking, and now `mp-sensitive`, are what it rests on.

## Build steps

### [x] Step 1 - heatmap data on, anchored to a live replay

- Extract the `mixpanel.init` options object in `src/lib/analytics/client.ts`
  into an exported pure function taking the recorder URL, so the shape can be
  asserted without loading the SDK.
- Add `record_heatmap_data: true` to it. Leave `autocapture: false` and every
  privacy setting exactly as they are.
- Chain `set_config({ record_heatmap_data: true })` onto the resolution of
  `start_session_recording()`, with a comment saying why the second call exists.
- Add `src/lib/analytics/client.test.ts` asserting the returned options:
  `autocapture` is `false`, `record_heatmap_data` is `true`,
  `record_mask_all_text` and `record_mask_all_inputs` are `true`,
  `record_console`, `record_network`, `record_canvas` and `ip` are `false`,
  `opt_out_tracking_by_default` is `true`, `track_pageview` is `false`.

**Done when:** `pnpm test` passes, and the new test fails if
`record_heatmap_data` is removed or `autocapture` is switched on.

### [x] Step 2 - keep the answer wording out of `$mp_click`

- Add `mp-sensitive` to the root element of
  `src/lib/features/questionnaire/QuestionnaireShell.svelte`, with a comment
  naming the SDK behaviour it relies on and the two `aria-label` lines it
  protects.
- Add it again to the date picker's `Popover.Content` in
  `src/lib/components/ui/date-picker/date-picker.svelte`.
- Prove it in `e2e/analytics.spec.ts`, which already intercepts and decodes
  every Mixpanel request and is the one spec that runs with consent undecided.

**What the browser run changed about this step.** The class on the shell alone
was not enough, and only a real click found it. `bits-ui` portals the date
picker's popover to `document.body`, so the calendar sits outside the shell's
subtree, and the walk sent `$attr-aria-label: "Monday, 14 May 1990"`, the
visitor's date of birth, in clear.

Putting the class on `<body>` does not fix it either:
`shouldTrackElementDetails` walks `curEl.parentNode && !isTag(curEl, 'body')`,
so the body's own classes are never read. The ancestor has to be below the body,
which means every portalled surface carries its own copy. That is a standing
rule now, not a one-off: a dialog, sheet or select reached for by a later
question type needs the same class.

**Done when:** with consent granted, a walk through the questionnaire produces
`$mp_click` events whose `$current_url` is a questionnaire path, and not one of
them carries any `$attr-` key; the payload contains neither the diagnosis
clicked nor the year of birth entered.

### [x] Step 3 - record the decision and the traps

- Rewrite the heatmap sentence in the Analytics section of `AGENTS.md`. Today it
  forbids "a heatmap tool", which meant a second vendor such as Hotjar, and now
  reads as forbidding what we just built. Say plainly that Mixpanel's own
  heatmap is on, and that a second analytics, tag manager, recorder or heatmap
  vendor is still out.
- Document the two traps, the `mp-sensitive` rule, and the fact that
  `$mp_web_page_view` now carries questionnaire paths while `isTrackablePath`
  governs `page_viewed` only.
- Update the comment on `isTrackablePath` in `events.ts` so it states what is
  still true rather than what used to be.

**Done when:** `AGENTS.md` describes the shipped behaviour, and nothing in the
repository still says heatmaps are forbidden.

### [x] Step 4 - a re-granted consent has to reach the SDK again

Withdrawing calls `opt_out_tracking()`, which refuses every later event inside
the SDK. Nothing calls `opt_in_tracking()` on the way back, so a visitor who
declined and then agreed would have `mayTrack` say yes while the SDK silently
dropped everything, and no recording would restart either.

Unreachable today: `ConsentBanner` renders only while the decision is missing,
so there is no way to change it within one page load. It is a hole in the
consent path rather than a live bug, and it becomes live the moment a "change
your choice" link is added, which a DSGVO site plausibly wants.

- Extract the transition rule into a pure `consentTransition(previous, next)`
  returning `stop`, `resume` or `none`, and unit test it. The SDK calls stay
  untested; the rule is the part where a wrong answer is possible.
- On `resume`, opt back in and restart recording through the same sampling as a
  fresh load, so a re-granted session is not a forced recording.

**Done when:** `pnpm test` covers every transition, including the ones that must
do nothing, and `setAnalyticsConsent` acts on the rule rather than on `next`
alone.

### [x] Step 5 - record the privacy policy gap rather than close it locally

`src/lib/features/legal/content/privacy.ts` names Google Analytics, Google Ads
and Google Tag Manager, and mentions neither Mixpanel, nor session replay, nor
heatmaps. The site records sessions on a medical questionnaire and describes
that nowhere.

**Not fixed in code, and that is the decision rather than an omission.** The
file is a verbatim mirror carrying its own rule against editing: "Copied
verbatim from https://solean.com/policies/privacy-policy on 2026-09-01. Not ours
to edit." The controller is DTC Healthtech Solution Limited with heyData GmbH as
data protection officer. Amending the mirror without amending the source would
put two different privacy policies live for one controller, which is worse than
the gap it closes.

Reviewed with the user on 2026-09-03, who chose to defer. The note in `AGENTS.md`
now states the full scope of what is unnamed, why it is not fixed here, and that
it must not be closed with a local edit.

**Done when:** `AGENTS.md` names session replay and heatmaps alongside Mixpanel
in the gap it records, and `privacy.ts` is untouched.

## Verify

`pnpm dev`, accept the consent banner, then with the network tab filtered on
`api-eu.mixpanel.com`:

| Check | Expected |
| --- | --- |
| Land on `/` | a `$mp_web_page_view` is sent, so the entry page is anchored |
| Click around the landing page | `$mp_click` events with `$captured_for_heatmap: true` |
| Open a survey step, click an option | `$mp_click` sent, and its `$elements` contain no `$attr-aria-label` and no `$attr-name` |
| Decline instead of accepting | no Mixpanel request at all, and the SDK is never downloaded |
| `PUBLIC_MIXPANEL_REPLAY_PERCENT=0` | no replay and no `$mp_click` |

Then `pnpm test`, `pnpm check`, and `pnpm build`.

Browser tests run with analytics declined (`CONSENT_DENIED_STATE`), so they
prove the gate holds and not the heatmap. The heatmap itself is manual evidence
plus the unit test on the configuration shape.
