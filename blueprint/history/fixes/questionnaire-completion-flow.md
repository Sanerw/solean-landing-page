# The end of the questionnaire, in one screen

**Type:** Fix

**Status:** verified

**Branch:** `fix/questionnaire-completion-flow`

## What this covers

Six things the user found by walking the funnel, fixed in one pass because they are all the
last stretch of the questionnaire: the date field, a choice that would not wrap, where a
reload lands, the progress bar, when the recommendation is read, and the two completion
screens becoming one.

## 1. The date of birth could not be typed

The control was a `<button>` that opened a calendar, so a visitor who wanted to type
`14/05/1990` had no field to type it into, and everything on it was German: `TT.MM.JJJJ`,
`Mo Di Mi`, `Aug`.

Now a real `<input>` with the calendar on its own icon beside it, `en-GB` throughout.
Separators are inserted as the digits arrive, and dots or hyphens are accepted, because
`14.05.1990` and `14/05/1990` mean the same date and refusing one is pedantry the visitor
pays for.

**A date that does not exist is not an answer.** `31/02/1991` is refused by `parseDate`
rather than rolled into 3 March, which would record a birth date nobody typed on a
prescription request. Seven unit tests in `date-picker.test.ts` cover the parsing.

**Letters never reach the field.** Refused at `beforeinput`, not stripped afterwards: a
letter typed into an empty field leaves the masked value unchanged, so there is nothing for
the renderer to correct and the character stays on screen. Pasting is still allowed through
and cleaned up, so `geboren 14.05.1990` off the clipboard becomes `14/05/1990`.

## 2. A long choice ran out of its card

`Gewichtsverlustoperation/Gewichtsreduktionschirurgie` is one word wider than the card
holding it, and the model writes the choices, so nothing here can shorten it.

Two causes, and the first fix alone was not enough:

1. `FieldTitle` is a flex container, which makes the choice text an anonymous flex item whose
   `min-width: auto` is the width of its longest word. `break-words` does not lower that.
   Hence `block`.
2. The grid item had the same `min-width: auto`, so the whole grid grew to 406px inside a
   390px viewport and the page scrolled sideways. Hence `min-w-0`.

The second was found by the viewport spec, not by measuring the label, which was already
correct by then. Both fields were fixed, since `RadiogroupField` has the identical structure
and simply had not met a long enough choice yet.

The real choice was added to the fixture (4 lines) and `choice-wrapping.spec.ts` measures
`scrollWidth` against `clientWidth` rather than comparing screenshots. Reverting `block`
turns it red at `scroll: 350` against `client: 276`, so it is known to bite.

## 3. A reload landed on the second question

The first question asks for an e-mail and requires nothing, so the reachable-limit rule
validated it empty and stepped past it. A fresh load arrived on the name.

`resolveStepEntry` now takes `started`, false until the visitor moves off a step themselves,
and sends a fresh load to the first step. **Keyed on having started rather than on the
answers being empty**: the first attempt used empty answers, and skipping that optional
question then bounced the visitor straight back to it, so Continue looped on the first page.
That bug reached three specs before the viewport suite caught it.

## 4. The progress bar was full one screen early

The last question filled the bar although the plan choice still followed.

`QuestionnaireProgress` grew a `percent`, whose denominator counts the choice screen, so the
last question reads 10/11 rather than 10/10. The count itself stays a count of questions,
because the `aria-label` says "Question 10 of 10" and a bumped denominator would announce a
question that does not exist.

## 5. The recommendation was read too late, and then not at all

Asked for: read the plans before showing the next screen, so nobody watches a loading line.

The first attempt awaited the read before `goto` and still did not work, non-deterministically.
The cause was one line earlier: `recordSubmission` was called first, and recording the uid
makes every step resolve forward to the completion screen, so **the route's own effect
navigated immediately** and the awaited read finished on the next screen instead.

Proven by slowing the read to two seconds: before, the choice screen appeared after 778ms
showing "Preparing your plan."; after, the press stays on the question for 2594ms and the
choice screen's first frame already has its plans. Three runs, 2588/2618/2592ms.

The uid is now recorded after the read. `preparing` also joins the guard on `send`, so a
second press cannot file a second anamnesis during the wait.

**The wait is real and needed saying.** The live recommendation takes about four seconds
(measured: 4.0, 3.7, 4.6s for 1.1MB). The button therefore says "Sending your answers" and
then "Preparing your plan", because a button that still claims to be sending while it waits
for something else reads as a page that has hung.

## 6. Two completion screens became one

The congratulations screen asked the visitor to confirm a choice they had just made. The
checkout moved onto the choice screen: pick a plan, press once, go to the shop.

Removed with it: the stored plan choice (`recommendationChoice` and its record/forget pair),
`forgetAnswers` and `answersHeld`, which existed only for the "your checkout has already been
opened" state, and the celebration copy.

Kept deliberately:

- **The clinical note.** The only line saying the choice is a preference and the doctor
  decides. The removed screen carried that in its "Sent for doctor review" badge.
- **Every checkout failure**, with "Try again". A refused cart must not end on a blank.
- **The no-plans screen**, whose button still orders the configured fallback.

The button reads "Checkout with <plan>" rather than "Continue", because it goes to payment.

## Verify

- `pnpm check` - 1201 files, 0 errors
- `pnpm test` - 27 passed (7 new for the date field's parsing, 3 for the keystroke guard)
- `pnpm test:browser` - 76 passed
- `pnpm build` - clean
- Measured rather than eyeballed: the reference card geometry, the text spill, the
  navigation ordering, and the live recommendation's own latency.

## What this leaves open

- **The progress bar can go backwards.** Answering the weight opens a conditional page, so
  the denominator rises from 15 to 16 and the fill drops from 31.3% to 29.4%. Older than this
  work and not addressed: the denominator follows the branch actually being walked.
- A compound long enough to need it breaks mid-word (`Gewichtsredukti-onschirurgie`). Correct
  hyphenation would need `hyphens: auto` and a `lang` matching the model's language, which
  the page does not carry.
