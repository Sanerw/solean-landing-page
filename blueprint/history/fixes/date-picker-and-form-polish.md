# A calendar for the date of birth, and the form surfaces around it

**Type:** Fix
**Status:** verified

> Recorded after the fact. The work was built directly in chat rather than from a
> spec and landed on `main` as `e7d4803`, so this archive is written from that
> commit and its evidence.

## The problem

The model's date question rendered as `<Input type="date">`, the browser's own
widget. It is not styled by anything in this project, it looks like no other
control on the screen, and its calendar is Chrome's or Safari's rather than
Solean's. Nothing bounded it either: the questionnaire would happily take a birth
date next week or in 1890 and leave the refusal to RxScale's validator, one
round trip later.

Three smaller things were wrong on the same screens:

- A question's description sat above its control, so a screen reader read the
  help text before the thing it helps with, and nothing named it: the control's
  `aria-describedby` pointed only at the error.
- A question's title was always hoisted into the page `<h1>`, even when the
  model put display-only content before it. The reading order the model
  expressed was silently rearranged.
- The hero's rating badge stated a score with no way to check it.

## The fix

`popover`, `calendar` and `date-picker` were added and adapted, and the date
question now opens the project's own calendar. Its bounds come from the rule
RxScale's validator already enforces (from the 18th birthday to the day before
the 80th), so an impossible date is not offered rather than refused later.
SurveyJS stays the authority on the submitted answer.

Descriptions moved below their control and are named by `aria-describedby`
beside the error. The title is hoisted into the `<h1>` only when the question is
first in the model's reading order; otherwise the heading renders at the
question's own position and whatever the model put above it stays above it.

Must not break:

- The stored value stays `YYYY-MM-DD`, which is what the submission sends.
- The model remains the only source of question content.
- A question with no renderer still fails visibly.

## Build steps

### [x] Step 1 - the picker and its bounds

`src/lib/components/ui/popover/`, `calendar/`, `date-picker/`: adapted
primitives. `popover` was on the deferred list until this feature needed it.

`fields/DateField.svelte`: opens the picker, bounded from `today('Europe/Berlin')`
minus 80 years plus a day to minus 18 years, opening on minus 35 years.

`src/routes/dev/design-system/DatePickerSection.svelte`: the showcase section.
`InputSection.svelte` lost its placeholder-only date field, which was a mock of
the checkout that no longer exists.

**Done when:** the date question opens the project's calendar, a date outside
the window cannot be picked, and the answer still stores as `YYYY-MM-DD`.

### [x] Step 2 - reading order and naming on the question screen

`SurveyStepScreen.svelte`: `headingIsHoisted` decides whether the title may lead
the screen; descriptions render under the control with an `id` that
`aria-describedby` names alongside the error; a meaningful second title line
becomes the control's label rather than a paragraph.

`fields/TextField.svelte`: e-mail recognised by `inputType` or by the configured
question name, with the model's placeholder or a default.
`fields/ExpressionField.svelte`: display-only content renders as a highlighted
`Alert` rather than a bare bordered box.

**Done when:** the e-mail question's control is described by the consent line,
and a page whose model puts a notice first still shows the notice first.

### [x] Step 3 - the harness follows the picker

`e2e/date-picker.ts`: one `selectDateOfBirth` helper driving the month and year
selects and the day cell, used by four specs that previously typed into a text
input. `screenshots.spec.ts` also captures the open popover.

**Done when:** `pnpm test:browser` passes.

### [x] Step 4 - the rating badge links to its source

`HeroRatingBadge.svelte` became a link to the Reviews.io profile, opening in a
new tab and named for assistive tech. `content.ts` carries the href.
`marketing-fidelity.spec.ts` asserts both.

**Done when:** the badge is a link with that href and `target="_blank"`.

## Verify

1. `pnpm check` clean: 1198 files, 0 errors, 0 warnings.
2. `pnpm test` green.
3. `pnpm build` exits 0.
4. `screens/03-date-picker-open.png` and `screens/03-date-of-birth.png` show the
   picker open and the answered field.

> The browser harness was run on the following commit rather than this one, and
> it passed there with these specs included.

## Also in this commit

Two changes that were not part of the problem above and are recorded here
because they shipped with it:

- The form primitives' focus ring changed from the documented
  `ring-2 ring-ring ring-offset-2 ring-offset-background` to
  `ring-[3px] ring-ring/20`, and bare field labels from `text-sm` to `text-xs`.
- The motivation interlude's headline dropped "Halfway done.", which was a claim
  the step plan does not support.
