# Marketing page scale and rhythm

**Type:** Fix
**Status:** verified

## The problem

After the first reference-fidelity pass, the landing page still feels visually
overscaled. The hero headline dominates the frame more than it does in the PNG
and HTML references, several neighbouring sections run together without enough
separation, and some marketing calls to action use the global large button size
where the reference uses a more compact pill. The result is less balanced even
though the overall section structure is now correct.

## The fix

Tune the marketing page at its real desktop and mobile breakpoints against
`blueprint/reference/Solean landing page.png` and
`design/prio_one_landing_page_men_new.html`. Reduce only the hero typography and
marketing button call sites that are visually oversized, preserving the shared
Button API used by the questionnaire and future checkout. Restore deliberate
vertical breathing room between section groups without reintroducing the large,
uniform gaps removed by the previous fix.

## Build steps

- [x] **Step 1: Rebalance the hero.** Reduce the responsive headline scale and
  tighten its line composition while keeping the desktop hero inside the
  announcement-adjusted viewport. Done when the full hero remains visible at
  1440 x 768 and the heading no longer visually crowds the lead or CTAs.
- [x] **Step 2: Correct marketing button hierarchy.** Audit visible landing-page
  buttons and replace oversized `lg` uses with the closest stock size at the
  call site, retaining a clear primary and secondary hierarchy. Done when hero,
  header, carousel, and section CTAs match the reference proportions without
  changing questionnaire buttons.
- [x] **Step 3: Restore section rhythm.** Compare all adjacent landing-page
  sections and add targeted stock-scale spacing where two different visual
  groups currently touch or feel compressed. Done when the page has clear
  transitions between trust, bento, results, projection, testimonials,
  clinicians, process, and FAQ without a generic gap after every component.

## Verify

- Run `pnpm check`.
- Run `pnpm build`.
- Run `pnpm test:browser` for existing landing-page behavior.
- Inspect `/` at 1920 x 1080, 1440 x 768, and 375 x 812 against the supplied
  landing-page reference.
- Confirm there is no horizontal overflow and the questionnaire route retains
  its existing button sizing.

## Verification record

Measured with the browser harness at 1440 px, then checked against
`blueprint/reference/Solean landing page.png`.

- Step 2: every landing-page `size="lg"` is gone. The questionnaire Continue
  button still measures 68 px, so the shared Button API and the funnel are
  untouched. The showcase keeps its `lg` examples.
- Step 3: the three rounded panels (results, testimonials, how it works) each
  had a 0 px gap to their neighbours and now have 32 px on both sides. Bento to
  the results panel is 64 px, matching the roughly 63 px measured off the
  reference at this width.
- No horizontal overflow at 1440 or 375; at 375 the document scroll width is
  exactly 375.
- `pnpm check` 0 errors, `pnpm build` clean, `pnpm test:browser` green.

Not verified: bento card proportions and section order were inherited from the
previous fidelity fix and were not re-measured here.
