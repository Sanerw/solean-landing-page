# A spinner for the questionnaire's opening screens

**Type:** Fix
**Status:** verified

## The problem

Entering the questionnaire shows a full headline and a sentence for the fraction
of a second before the browser redirects to the first question:

| Where | What it renders |
| --- | --- |
| `src/routes/(questionnaire)/questionnaire/+page.svelte:40-43` | "Opening your questionnaire" plus "Taking you to the first question." |
| `src/routes/(questionnaire)/questionnaire/[step]/+page.svelte:218-222` | the same headline plus "Taking you to where you left off." |

Both are handoff screens, not content. The entry page computes the step plan in
`onMount` and calls `goto`; the `[step]` branch does the same for a session that
already resolved forward. A display headline sized `text-4xl sm:text-5xl` reads
as a destination, and it appears and vanishes too fast to be read anyway.

## The fix

Replace the copy on both with the shadcn-svelte `spinner` primitive, adapted the
way every other primitive in this project has been.

- Add `spinner` through the CLI, which resolves to a Lucide `Loader2Icon` with
  `animate-spin`, `role="status"` and `aria-label="Loading"`. Confirmed present
  in the `luma` registry (HTTP 200), and it pulls no dependencies.
- **Add `motion-reduce:animate-none`.** Every animated primitive already in
  `src/lib/components/ui/` carries that guard: `accordion-content`,
  `dialog-content`, `dialog-overlay`, `sheet-content`, `sheet-overlay` and
  `button`. A spinner is the strongest case for it, since it never stops on its
  own.
- **Keep a real status message for assistive technology.** The visible sentence
  goes, but the screen still has to say what is happening. The spinner's own
  `aria-label` says only "Loading", which does not name what is loading, so each
  screen keeps its own line as `sr-only` text inside the live region. Removing
  the text outright would make the screen silent to a screen reader.

Must not break:

- The redirect itself. Both screens exist to hand off, and the `replaceState` on
  the entry page is what keeps Back from looping through it.
- `ProjectionInterstitial.svelte:47`, "Loading your projection.", which stays as
  it is by the user's decision.
- `RecommendationScreen.svelte:216-217`, which belongs to the separate "building
  your plan" change and is deliberately untouched here.
- The questionnaire shell's layout: the spinner sits in the same content slot the
  copy used, so nothing above or below it moves.

## Build steps

### Step 1 - add and adapt the primitive  - [x]

- `pnpm dlx shadcn-svelte@latest add spinner`, which writes
  `src/lib/components/ui/spinner/`.
- Add the `motion-reduce:animate-none` guard so it matches the six primitives
  that already have one.

**Done when:** `src/lib/components/ui/spinner/spinner.svelte` exists, imports its
icon from `@lucide/svelte`, carries the reduced-motion guard, and `pnpm check`
and `pnpm build` pass.

### Step 2 - use it on both opening screens  - [x]

Swap the headline and paragraph for the spinner plus an `sr-only` status line, in
`questionnaire/+page.svelte` and in the `redirecting` branch of
`[step]/+page.svelte`.

**Done when:** both screens render a spinning indicator and no visible headline;
a screen reader still receives "Taking you to the first question." and "Taking
you to where you left off." respectively; and entering `/questionnaire` still
lands on the first question with Back leaving the flow rather than looping.

## Verify

- `pnpm check` and `pnpm build` pass.
- `pnpm test` stays green. No logic changes, so no new unit tests: this is UI,
  verified in the browser per the Testing section of `coding-standards.md`.
- `pnpm test:browser` green. `e2e/questionnaire-flow.spec.ts` and
  `e2e/journey.spec.ts` walk through the entry, so a broken handoff shows up
  there. Check whether any spec asserts the old headline text and update it
  honestly rather than loosening the assertion.
- In the browser at 390px and 1280px: go to `/questionnaire` and confirm the
  spinner appears and the first question follows. Then load a deep link such as
  `/questionnaire/page1` after a submission to reach the `redirecting` branch.
- With reduced motion on (macOS System Settings, Accessibility, Display, Reduce
  motion), confirm the indicator does not spin and the screen still reaches the
  first question.
