# The recommendation screen chooses in two steps

**Type:** Fix

**Status:** verified

## The problem

The screen offers the two purchases as tabs: `Behandlung` and `Nur Rezept`, each holding its
own radio list. Switching tabs clears the selection, and a person who wants a prescription has
to find it behind a tab that names a distinction they have not been told about yet.

The reference at `/Users/work/Code/hero-export/prescription-export/solean_ecommerce-export.html`
draws it differently, in two screens:

- **First**, the treatments as a list, with `Prescription only` as a peer beneath them: its own
  card, an icon rather than a product photograph, a `NO MEDICINE` badge, and the description
  *"Clinician-issued prescription without medication"*. One row, not a list.
- **Second**, and only when that row is chosen, *"Which medication should your prescription be
  for?"* over the individual prescription listings.

Confirmed with the user on 2026-09-04: prescription-only is an option beside the full
treatments, and choosing it opens a second screen for the medication.

## What the reference is not

Its two screens are numbered `QUESTION 9 OF 10` and `PRESCRIPTION ONLY · QUESTION 10 OF 11`,
because the artboards draw this as part of the questionnaire. It is not: this screen runs after
the submission, on the recommendation RxScale returns. The counters are the recorded reference
error and are never transcribed.

The reference also names three fixed products with fixed claims and no prices. Ours come from
the recommendation, with the price on the right, which the user asked to keep. The reference is
followed for the interaction and the composition, not for the merchandise.

## The fix

- The tabs go. The first screen lists the treatments, then one `Prescription only` card
  standing for the whole prescription-only group.
- Choosing that card and confirming moves to the second screen rather than to Shopify. It lists
  the prescription options with their own prices and carries its own confirm button.
- The second screen offers a way back to the first, and returning clears nothing the first
  screen had already chosen.
- **Price on the summary card.** Every prescription listing is 49.90 today, so the card shows
  that one price. When they ever disagree, it shows the lowest prefixed by `ab` / `from`,
  because a single price would then be a claim the second screen contradicts.
- Three shapes the data can take, and each has to work:
  - **Both groups**, which is today's live answer: the full two-step flow.
  - **Treatments only**: no prescription card, one screen, one list, exactly as now.
  - **Prescriptions only**: the first screen is skipped, because a screen whose only option is
    "prescription only" asks nothing. The medication list is the screen.
- The `no plans` path and the configured fallback are untouched.
- `plan-choice.ts` gains the logic and the unit tests: which screen a state is on, what the
  summary card costs, and what the button says. Being wrong here costs money, which is why
  that module exists.
- `trackCheckoutStarted` keeps sending the mode; it is derived from the chosen variant rather
  than from a tab.
- `UI.modeTreatment` and `UI.modePrescription` in `e2e/ui-labels.ts` name tabs that will not
  exist. The browser coverage moves to the new flow. Five specs referenced them, not one:
  `checkout-handoff`, `accessibility`, `journey`, `questionnaire-submission` and `screenshots`.
  `e2e/` sits outside the generated tsconfig's `include`, so `pnpm check` never sees a missing
  label and the four beyond the obvious one only surfaced when the full browser suite ran.

## Build steps

- [x] **Step 1 - The choice logic, with tests.** Add the step model to `plan-choice.ts`: the
  two screens, the summary card's price across a group, and the mode a chosen variant implies.
  Cover the three data shapes plus a disagreeing price. Nothing user-facing changes yet.
  *Done when:* `pnpm test` covers all three shapes and the app behaves exactly as before.

- [x] **Step 2 - The two screens.** Replace the tabs with the treatment list plus the
  prescription card, add the medication screen behind it with its back path, and move the
  browser coverage onto the new flow. *Done when:* choosing the prescription card opens the
  medication screen, choosing a treatment goes straight to Shopify, a prescriptions-only
  recommendation opens on the medication list, and the back path returns without losing the
  first screen's choice.

## Verify

- Run `pnpm check`, `pnpm test`, `pnpm test:browser` and `pnpm build`.
- Walk the questionnaire to the recommendation and check all three paths: a treatment straight
  to checkout, the prescription card to the medication screen and on to checkout, and back
  from the second screen.
- Compare both screens against the reference at `390x844` and `1440x900`.

## Out of scope

- The `no plans` path, the configured fallback and the checkout call itself.
- The questionnaire's own steps, its progress counter and its chrome.
- The ~4 s wait on entry to this screen, which is RxScale's and was measured on 2026-09-04.
- Prices, product names and claims, which are the recommendation's.
