# Compact questionnaire desktop UI

**Type:** Fix

**Status:** verified

## The problem

The `/questionnaire` UI is visually oversized compared with the approved questionnaire
references. Headings, option rows, controls, gaps, and shell spacing consume too much
vertical space, so dense survey steps can push the primary action below the desktop
viewport and require scrolling.

The source reference is `design/prio_one_landing_page_men_new.html`, checked against the
questionnaire PNG artboards in `blueprint/reference/`. Their desktop system uses a
compact 38px/44px question heading, 18px supporting copy, 64px standard inputs and
options, tighter 10px to 18px vertical rhythms, and keeps the complete step surface
inside a 1920x1040 artboard. Dense choice screens reduce row height further rather than
enlarging the page.

## The fix

Bring the live model-driven questionnaire shell, field renderers, interludes, and
recommendation screen back to the reference's compact desktop scale. Preserve the
existing Solean fonts, semantic tokens, accessibility labels and focus behavior,
SurveyJS data and validation behavior, mobile responsiveness, and minimum usable touch
targets. Do not hardcode questionnaire content or change routing, branching, persistence,
submission, or checkout behavior.

Use only Tailwind's named typography utilities for questionnaire text, such as
`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-2xl`, and
`leading-*`. Do not introduce arbitrary font-size or line-height values such as
`text-[38px]` or custom component CSS. Build controls from the project's existing UI
primitives, adapting them through utility classes and component composition rather than
creating parallel input, choice, button, progress, alert, or field primitives.

On desktop, verify both the 1920x1040 reference viewport and a common 1440x900 viewport.
Every fixture-backed survey step, interlude, and recommendation screen must show its
primary action without vertical page scrolling at default browser zoom. Mobile may
scroll naturally.

## Design reference

- `design/prio_one_landing_page_men_new.html`
- `blueprint/reference/EN Questionnaire 1 — About You.png`
- `blueprint/reference/EN Questionnaire 2 — Your Details.png`
- `blueprint/reference/EN Questionnaire 3 — Pregnancy.png`
- `blueprint/reference/EN Questionnaire 4 — Medical Conditions.png`
- `blueprint/reference/EN Questionnaire 5 — Health History.png`
- `blueprint/reference/EN Questionnaire 6 — Eating Disorders.png`
- `blueprint/reference/EN Questionnaire 7 — Allergies & Medications.png`
- `blueprint/reference/EN Questionnaire 8 — Treatment Preference.png`
- `blueprint/reference/EN Questionnaire 9 — Complete & Order.png`
- `blueprint/reference/EN Questionnaire — Motivation Mid Step.png`
- `blueprint/reference/EN Questionnaire — Projection Mid Step.png`

## Build steps

- [x] **Compact the shared shell and survey controls** - Align desktop navigation,
  progress, content width, heading and helper type, field gaps, choice rows, text inputs,
  and the primary action with the HTML and PNG proportions while preserving accessible
  control behavior. Use named Tailwind typography classes and the existing UI primitives
  throughout. **Done when:** every fixture-backed survey step at 1440x900 and 1920x1040
  shows its full primary action with no vertical page overflow, typography and component
  density visibly match the reference scale, and no questionnaire text uses an arbitrary
  font-size utility.
- [x] **Compact the interludes and recommendation state** - Apply the same desktop type
  scale and vertical rhythm to motivation, projection, and completion/recommendation
  content without removing information or changing behavior. **Done when:** each
  non-survey questionnaire screen shows all reference-critical content and its primary
  action within both desktop viewports without vertical page overflow.
- [x] **Lock the desktop fit into browser coverage** - Add focused Playwright assertions
  that traverse the fixture flow and check the document does not exceed the viewport on
  every questionnaire step at the two approved desktop sizes. **Done when:** the focused
  questionnaire browser test passes at 1440x900 and 1920x1040, alongside the existing
  questionnaire behavior suite.
- [x] **Reduce the survey Continue button** - Use the existing Button primitive's size
  prop to bring the survey-step primary action down from its oversized large treatment.
  **Done when:** the Continue button uses the default primitive size without a custom
  height override and the focused questionnaire browser coverage remains green.

## Verify

- Run `pnpm check`.
- Run `pnpm build`.
- Run the focused Playwright questionnaire viewport coverage, then
  `pnpm test:browser`.
- Capture representative screenshots for a standard survey step, the densest choice
  step, an interlude, and the recommendation screen at 1440x900 and compare them with
  the matching HTML/PNG references.
- Confirm there is no horizontal overflow, keyboard focus remains visible, validation
  messages still appear beside their questions, and mobile layouts still scroll and
  remain usable.
- Confirm questionnaire text uses named Tailwind typography utilities only and controls
  continue to come from the project's existing UI primitives.
