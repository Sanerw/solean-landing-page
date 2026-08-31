# Choosing the plan and ordering it are two screens

**Type:** Fix
**Status:** verified

> Recorded after the fact. The work was built directly in chat rather than from a
> spec, so this archive is written from the finished branch and its evidence, and
> the build steps below describe what was actually done.

## The problem

The completion step was one screen doing two jobs. `RecommendationScreen.svelte`
read the recommendation, offered the plans as a radio group, and placed the
order, so the first thing a person saw after filing a medical record was a
screen whose primary action was a purchase.

Work splitting the two had been started and left unfinished in the working tree:
a new `RecommendationSelectionScreen.svelte`, a third `sessionStorage` key for
the confirmed choice, and copy for both screens. None of it had a caller.
`RecommendationScreen.svelte` itself carried nine unresolved merge conflict
markers (`<<<<<<< ours` against the committed single screen, `>>>>>>> theirs`
the slimmed replacement), so the project did not build at all.

The route was the missing half:
`src/routes/(questionnaire)/questionnaire/[step]/+page.svelte` rendered the old
screen, passed no variant, and never called `recordRecommendationChoice`.

## The fix

Two screens on the one `complete` step, separated by the stored choice: the
plans are chosen first, the order is placed second. The choice lives in the
session rather than the URL, so a refresh does not send someone back to a
decision they already made, and it is swept by the same version rule as the
answers.

Rejected alternative: giving the choice its own entry in `steps[]`. That is
where position and routing belong, but it would put a second URL, a second
progress denominator, and a new `resolveStepEntry` rule in front of a screen
whose whole state is one confirmed variant.

Must not break:

- One cart per press, never on screen entry.
- The variant the browser names still reaches `/api/checkout` and is still
  checked against the recommendation there.
- `_anamnesis_uid` stays the single order-level attribute.
- The returned `checkoutUrl` is passed on byte for byte.
- A handed-off session still says so instead of offering a second order.

## Build steps

### [x] Step 1 - the two screens and the choice that separates them

`RecommendationScreen.svelte`: reduced to the order. It takes `selectedVariant`
as a prop and no longer reads the recommendation itself. The comments explaining
why the checkout is created on the press, why the redirect is a full navigation,
and why the handed-off state offers no action were kept from the version this
replaced.

`RecommendationSelectionScreen.svelte`: `prefetched` became a
`Promise<RecommendationFetch>` rather than a resolved value, so no state is
initialised from a prop it cannot track. That removed five
`state_referenced_locally` warnings and is what lets the screen consume a read
already in flight.

`+page.svelte`: renders the choice while the session holds none and the order
screen once it does, and starts `fetchRecommendation` as the submission returns
so the navigation waits for nothing.

`survey-state.svelte.ts` and `answer-storage.ts`: `forgetRecommendationChoice`
and `clearRecommendationChoice` beside the existing record and load.

A "Choose a different plan" action was added to the order screen. It is not
decoration: that screen does not name the chosen plan and its Back button leaves
the questionnaire, so without it a stored choice could not be changed for the
rest of the session.

**Done when:** `pnpm check` reports 0 errors and 0 warnings, and the completion
step shows the plans first and the order second.

### [x] Step 2 - the stored choice under test

`answer-storage.test.ts`: seven cases against the parsing and validation of the
stored choice, which reads untrusted JSON out of `sessionStorage`. The round
trip; `variantId: null` as a confirmed choice of the fallback plan; eight
malformed values that must read back as "no choice", including
`{ confirmed: false }` and a numeric variant id; clearing; and the version sweep
that drops a choice belonging to another model version while leaving unrelated
keys alone.

**Done when:** `pnpm test` passes with the new cases.

### [x] Step 3 - the browser harness follows the visitor through both screens

`e2e/recommendation.ts`: one `confirmPlan` helper, used by nine specs, since
every spec about the order now has to pass the choice.

The order button's name changed with the split (`Place your order` to
`Go to checkout`), so every spec naming it was updated. The plan-picking spec now
chooses the prescription on the first screen and asserts that variant reaches
the cart, which is what proves a choice survives the screen it was made on. The
reload in the handoff spec proves the stored choice survives a refresh. The
accessibility scan covers both screens, and the screenshot walk captures both.

**Done when:** `pnpm test:browser` passes, including every existing
checkout-handoff and recommendation-state case.

## Verify

1. `pnpm check` clean: 1200 files, 0 errors, 0 warnings.
2. `pnpm test` green: 14 tests, 7 of them new.
3. `pnpm test:browser` green: 74 tests.
4. `pnpm build` exits 0.
5. `screens/13-recommendation-choice.png` and `screens/14-recommendation.png`
   show the two screens as the harness walks them.

## What this leaves open

The order screen does not name the plan it is about to buy: the session stores
the variant id alone, so the screen has nothing to display without reading the
recommendation a second time. Storing a short summary beside the id would fix
it, and is a change to the stored shape rather than to this flow.
