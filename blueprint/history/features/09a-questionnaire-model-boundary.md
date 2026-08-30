# Feature: Questionnaire model boundary

**From build-plan:** feature 9a
**Status:** verified

## Goal

Put the real RxScale questionnaire in the app's hands. Fetch the SurveyJS model
from the Anamnesis API once per entry to the flow, hold it as a headless
`survey-core` instance, and prove in a browser what the model actually contains:
identifier, version, pages, and every question with its type and required flag.

This is the foundation 9b renders and 12 submits against. It changes nothing
about how questions look yet, so the questionnaire keeps working on its local
schema throughout.

## In scope

- Public config for the questionnaire uid and the API base URL
- A typed anamnesis client for `GET /v4/anamnesis/questionnaires/{uid}`
- The fetch wired into the `(questionnaire)` group, once per flow entry
- Honest not-configured and unavailable states with a retry, and no local
  fallback questionnaire
- `survey-core` as a dependency, instantiated headlessly with
  `showNavigationButtons` off
- A read-only inventory of the model (pages, question names, types, required
  flags) and the dev surface that displays it
- A fixture model and a local fixture server so the flow is developable and
  testable before the real uid arrives

## Out of scope

- `steps[]`, routing driven by the model, and the question type registry (9b)
- Rendering any question from the model, or removing `schema.ts` and
  `MockQuestionnaireService` (9b)
- Deleting the checkout and order-status mocks and reducing journey stages (9c)
- Submission, the anamnesis uid, and everything after it (12, 13)
- Interlude placement and progress rules (11)
- The `RXSCALE_API_KEY` and the checkout endpoint (13). Nothing in this feature
  is server-only or secret.

## Build loop

Build one step at a time, never the whole feature at once.

1. Plan mode lays out the step before any code.
2. The AI implements just that step.
3. It shows the diff (not full files); you read it and understand it.
4. You approve, then choose whether to commit a checkpoint or roll straight on.
   Checkpoints are optional; `/complete` makes the real feature-level commit at the end.

Never accept a step you haven't read. If a diff is too big to review, the step was too big, so split it.

## What the real model turned out to be

Fetched on 2026-08-30 with the supplied uid `4c06f07e-3319-4afd-9c78-ab0a2722db06`.
These are facts about the live questionnaire, not assumptions.

| Fact | Value |
| --- | --- |
| Identifier | `LIVE: MedQ NEW RECOMMENDER (01/26)`, `type: PRODUCT_RECOMMENDER`, `version: "1"` (a string, though the v4 docs say integer) |
| Size | 26 pages, 35 elements, mostly one question per page |
| Types | `radiogroup` 15, `checkbox` 6, `text` 5, `multipletext` 3, `expression` 3, `comment` 2, `os-date-picker` 1 |
| E-mail question | `EMail` on the first page |
| Height and weight | `WeightSize`, a `multipletext` with items `size` and `weight` |
| Branching | Page and element level `visibleIf`, including `{Gender} = 'female'`, `{Diseases} allof [...]`, and a chain off `WeightlossMedication` |
| Copy | German (`Weiter`, `Zurück`, `Abschließen`, German `completedHtml`) |

**The documented `/v4/anamnesis` path is not reachable, and production uses
another one.** `GET https://api.rxscale.com/v4/anamnesis/questionnaires/{uid}`
returns a Google Cloud Storage `NoSuchBucket` error, so the prefix is not routed
to the API on that host, while `/v2/public-api/health` answers normally.
Solean's own storefront page `https://solean.com/pages/medq_guenstiger_starten`
loads `snippets.rxscale.com/v1.0/index.js`, which calls the base
`https://api.rxscale.com/api/v2/anamnesis` for both the questionnaire and the
submission, against this same uid. `/api/v2/anamnesis` and `/api/v3-1/anamnesis`
return byte-identical documents; `/v4/anamnesis` returns nothing.

The base URL and the anamnesis path are therefore configuration, defaulting to
`/api/v2/anamnesis` because it is the only prefix with evidence of production
use. Switching to `/v4` once RxScale confirms it is routed is an env change, not
a code change.

The live error codes also differ from the documented ones: an unknown uid returns
`400 {"code":400,"message":"Error loading questionnaires"}`, not the documented
404. The client treats both as `not-found`, since the uid is the only input the
request carries.

An identical GET does not prove an identical POST. The `{ "data": ... }` body and
the 400 and 502 semantics are documented for v4, while feature 12 will post to
v2. Verify the submission contract against whichever base is configured before
relying on those error paths.

Three findings that belong to later features but must not be lost:

- `expression` elements (`InfoEMail`, `question3`, `InfoSaxendaPen`) are computed
  display text, not inputs. 9b's registry must not treat them as questions.
- `os-date-picker` is an RxScale widget type, not stock SurveyJS. `survey-core`
  will not know it, so 9b decides what renders it.
- The model asks some things twice and marks both required: `Name`
  (a `multipletext` of Name and Surname) alongside separate `FirstName` and
  `Surname` text questions, and `dob` (`os-date-picker`) alongside `dob2`
  (a `multipletext` of Day, Month, Year). Hiding either breaks submission
  validation, so this is a question for RxScale's Admin Tool, not for our code.

## Prerequisite

**Unit tests are skipped by decision.** The build plan's `/tests` step is
deliberately not run for this feature, so there is no `test` command and no test
gate. Verification rides on the dev inspection surface, the browser harness, and
the build. The client's result mapping and the inventory are exactly the logic a
runner would have covered, so the risk is real and stated rather than hidden.
Revisit before feature 13's checkout payload builder.

## Build steps

- [x] **Step 1 - The fixture model and its server** - A trimmed snapshot of the
  real document at `e2e/fixtures/questionnaire-model.json`, keeping one page of
  each type found in the live model including `expression`, `multipletext` and
  `os-date-picker`, and `e2e/fixture-server.mjs` answering the questionnaire GET
  with it and 404 for any other uid. Everything after this is developable and
  reviewable without touching the live API. *Done when:* the server starts from a
  documented command, returns the document for the fixture uid, and 404s another.

- [x] **Step 2 - Config module and the anamnesis client** - `src/lib/config/rxscale.ts`
  exposing the API base URL, the anamnesis base path, and the questionnaire uid
  from `$env/dynamic/public`, and
  `src/lib/features/questionnaire/anamnesis-client.ts` with
  `fetchQuestionnaire(fetch, uid)` returning the typed result union below. No
  module-level cache, `cache: 'no-store'`, the `fetch` from `load`, and `version`
  accepted as string or number. *Done when:* `pnpm check` and `pnpm build` pass,
  and the module is exercised by step 3's screens rather than by a test runner
  this project does not have.

- [x] **Step 3 - The fetch in the questionnaire group** - `src/routes/(questionnaire)/+layout.ts`
  fetching the document once per entry to the flow and registering a dependency
  for retry, and `src/routes/(questionnaire)/+layout.svelte` rendering either the
  flow or the failure state inside `QuestionnaireShell`, with a retry that
  invalidates and re-fetches. The load returns the result rather than throwing,
  because a layout that throws cannot render its own error boundary. No fallback
  to the local schema: if the model cannot be loaded, the questionnaire does not
  open. *Done when:* with no uid set, `/questionnaire/about-you` shows the
  not-configured state and no question; pointed at a dead port it shows the
  unavailable state and the retry re-attempts without a full page reload; against
  the fixture server and against the live uid every feature 7 and 8 screen behaves
  exactly as it does today; and moving between two steps issues no second model
  request.

- [x] **Step 4 - The headless survey engine** - `src/lib/features/questionnaire/survey-model.ts`
  creating the `survey-core` `Model` with `showNavigationButtons = false`, plus
  the read-only inventory (pages in order, and per question its page, name, type,
  title, required flag and whether it carries a `visibleIf`) that step 5 displays.
  Nothing else: the step-driving API arrives in 9b with its caller. *Done when:*
  `pnpm build` passes, a questionnaire route renders server-side without throwing
  (or the model is constructed browser-only and that is stated), and step 5's
  surface reports the live model's 26 pages and its seven question types.

- [x] **Step 5 - The dev inspection surface** - `/dev/questionnaire` showing
  identifier, version, type, page count and question count, then a table of every
  question with its page, name, type, required flag and `visibleIf`. Marked
  `noindex`, consistent with the other dev surfaces. *Done when:* against the live
  uid the page lists 26 pages and 35 elements with the type counts recorded above,
  against the fixture server it lists the fixture's, and with no configuration it
  shows the same not-configured state as the questionnaire.

- [x] **Step 6 - Browser coverage** - The fixture server wired as a second
  `webServer` in `playwright.config.ts`, with the preview build pointed at it, and
  specs for the inventory and the failure state. The harness never calls the live
  API. *Done when:* `pnpm test:browser` is green, including a spec that loads
  `/dev/questionnaire` and asserts the fixture's questions and types, and a spec
  asserting the unavailable state when the model cannot be fetched.

## Files / areas

| Path | Change |
| --- | --- |
| `src/lib/config/rxscale.ts` | new: API base URL, questionnaire uid, and the error when it is unset |
| `src/lib/features/questionnaire/anamnesis-client.ts` | new: typed fetch and result mapping |
| `src/lib/features/questionnaire/survey-model.ts` | new: headless model factory and inventory |
| `src/routes/(questionnaire)/+layout.ts` | new: one fetch per flow entry, returns the result, registers the retry dependency |
| `src/routes/(questionnaire)/+layout.svelte` | new: the flow, or the not-configured and unavailable states with retry |
| `src/routes/dev/questionnaire/+page.ts`, `+page.svelte` | new: the inspection surface |
| `e2e/fixtures/questionnaire-model.json`, `e2e/fixture-server.mjs` | new: local model for development and tests |
| `e2e/questionnaire-model.spec.ts` | new: browser coverage of the inventory and the failure state |
| `playwright.config.ts` | the fixture server as a second `webServer`, and the env the preview build reads |
| `package.json` | `survey-core` dependency |
| `.env.example` | the public env vars, with the real uid documented as an example |
| `.env` | local values, git-ignored |
| `AGENTS.md` | the fixture server command and the env the app needs |

Untouched: every existing questionnaire component, `schema.ts`,
`questionnaire-service.ts`, the journey, and every marketing surface.

## Data / contracts

Both shapes are load-bearing. 9b builds `steps[]` on the model, 11 keys session
persistence on `identifier` and `version`, and 12 posts to the same questionnaire
uid.

```ts
export interface QuestionnaireDocument {
	model: unknown;      // SurveyJS model JSON, handed to survey-core unmodified
	theme: unknown;      // fetched and kept, deliberately unused: we do not use SurveyJS theming
	type: string;
	identifier: string;
	version: number;
}

export type QuestionnaireFetchResult =
	| { ok: true; document: QuestionnaireDocument }
	| { ok: false; reason: 'not-configured' | 'not-found' | 'unavailable' };
```

`not-found` is a 404 from the API and means the configured uid is wrong.
`unavailable` covers 5xx, a network failure, a body that is not a questionnaire
document, and a model with no pages, which is not a questionnaire anyone can
answer. Both render the same user-facing screen; they are
separate because only one of them is worth telling a developer to check the
config for.

Inventory, for the dev surface only:

```ts
export interface ModelQuestion {
	pageName: string;
	name: string;
	type: string;       // the model's own type string, not a Solean union
	title: string;
	isRequired: boolean;
}
```

The type stays the model's raw string. Mapping it onto our own union is 9b's
registry, and inventing that union here would fix a contract before its caller
exists.

## Testing

**No unit test runner is configured and none is added here.** By the same
decision, no step ships a unit test.

What proves each step instead:

| Claim | Evidence |
| --- | --- |
| The client maps responses correctly | The three states rendered in the browser: a real document, a dead endpoint, and an unset uid |
| The model is fetched once per flow entry | The network panel across a step navigation |
| The inventory reads the model correctly | `/dev/questionnaire` against the live uid, checked against the type counts recorded above |
| Nothing regressed in features 7 and 8 | `pnpm test:browser`, which already covers the questionnaire walkthrough |
| It builds and typechecks | `pnpm check` and `pnpm build` |

Browser coverage (step 6) runs against the fixture server, never the live API, so
the harness stays deterministic and creates no traffic against RxScale.

## Notes for the AI

- **`$env/dynamic/public`, not `$env/static/public`.** A static import of an
  unset variable fails the build, and the uid does not exist yet. Dynamic also
  lets one build point at another questionnaire.
- **No fallback questionnaire, ever.** If the model cannot be loaded the flow
  stops. A local model rendered in its place would ship a questionnaire RxScale
  will reject at submission, and a medical questionnaire that is not the approved
  one is worse than no questionnaire.
- **The model is fetched, never cached past the visit.** No module-level memo, no
  `localStorage`, `cache: 'no-store'`.
- **Use the `fetch` provided by `load`**, so SSR and hydration share one request.
- **A failing layout load cannot render a `+error.svelte` beside it.** The
  boundary for a layout load error is the one above it, which here is the root.
  That is why the failure states are a returned result rendered by
  `+layout.svelte`, not a thrown `error()`.
- **survey-core may not be SSR-safe.** Verify in step 3. If it touches `document`,
  keep the JSON on the server and construct the `Model` in the browser only;
  do not silently disable SSR for the whole group without saying so.
- **The live API is read-only here and rate-worthy.** Fetch it while developing,
  but the browser harness points at the fixture server.
- **Do not build 9b's API here.** No `steps[]`, no type union, no component
  registry. The inventory exists because the dev surface calls it.
- **Nothing about answers is logged.** The dev surface shows the model, never
  `survey.data`.
- Conventions: runes only, `$lib` imports, kebab-case module names, no `any`,
  strict types, semantic tokens and stock Tailwind scales on the dev surface.
- Follow-up to raise in 9b or 12, not here: `QuestionnaireShell`'s "Prototype
  only, do not enter real health information" notice is still true while the local
  schema renders, and stops being true the moment real answers reach RxScale.
