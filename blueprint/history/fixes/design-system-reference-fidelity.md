# Design system reference fidelity

**Type:** Fix
**Status:** verified

## The problem

Five defects in the adapted primitives, found by comparing the
`/dev/design-system` showcase against
`design/prio_one_landing_page_men_new.html` and the 21 reference PNGs.

| # | Primitive | What was wrong |
| --- | --- | --- |
| 1 | `FieldLabel` | `uppercase` and `tracking-widest` sat on the whole `Label`. Both inherit, so an option card nested inside the label rendered in capitals with wide tracking. Every artboard draws those choices in sentence case. |
| 2 | `FieldLabel` | `text-xs` on `--foreground`. The export measures DM Sans 14px semibold `#405756`, tracking 1px. |
| 3 | `NavigationMenuLink` | `p-3`, a 44px box, beside a `NavigationMenuTrigger` at `h-9 px-4.5 py-2.5`, a 36px box, while the file comment claimed the two read as one visual family. The active link rendered as a taller lozenge. |
| 4 | `Badge` | `font-medium`, no tracking. Every badge label in the export is DM Sans bold at 10 to 10.5px with 0.7 to 0.8px tracking. `TreatmentOption` also passed the catalogue's lowercase `form`, where the reference chip reads INJECTION. |
| 5 | `Alert` | No `content-start`, so a taller grid sibling stretched the alert's own rows and opened a gap under the title. |

Defect 1 is the one that mattered. `SingleSelectField` and `MultiSelectField`
each carried `normal-case tracking-normal` at four call sites to undo it, so the
funnel looked right while the showcase, the thing meant to prove the design
system, showed the broken result.

## The fix

Repair each defect in the primitive, not at the call site, and delete the
workarounds the leak had forced. Keep every public API and every accessible
behavior unchanged: this is typography, box metrics and grid alignment only.

Must not break: the 56px / `rounded-md` / `--input` contract shared by Input,
Textarea and the Select trigger, the F-02 boundary correction, or the
questionnaire's existing keyboard and validation behavior.

Three neighbouring drifts were reviewed against the export and **explicitly
declined**, so a later audit should not reopen them:

- Input value type stays DM Sans regular. The export uses Inter Tight semibold
  17px, but section 2 of `design-system.md` assigns forms to DM Sans, and that
  ruling stands.
- The `accent` Badge keeps `--accent-foreground`. The export measures `#405756`;
  the documented token role wins at this size.
- `CompletionInterstitial` chips stay on `Badge variant="secondary"`. The
  export's larger Inter Tight pill is a feature-8d product component, not a
  design system primitive.

## Build steps

- [x] **Step 1: Scope the FieldLabel eyebrow and drop the workarounds.** Move
  the eyebrow typography behind `not-has-[>[data-slot=field]]:` so it reaches a
  bare label but never a nested option card, and correct it to the measured
  `text-sm` / `text-muted-foreground`. Remove `normal-case tracking-normal` from
  `SingleSelectField` and `MultiSelectField`. Done when the showcase option
  cards and the questionnaire both render sentence case with no call-site
  override left in `src/`, and a bare field label measures 14px on `#405756`.

- [x] **Step 2: Give NavigationMenuLink the trigger's box.** Replace `p-3` with
  the trigger's `h-9 px-4.5 py-2.5`, keeping `h-auto p-3` for items inside a
  dropdown panel. Done when a link and a trigger in the same row measure the
  same height and padding.

- [x] **Step 3: Correct the Badge treatment and the treatment chip.** Set
  `font-bold tracking-wider` in the primitive base, leaving case to the caller,
  and uppercase the form chip in `TreatmentOption`. Done when the chip reads
  INJECTION at bold weight with visible tracking.

- [x] **Step 4: Stop the Alert stretching its own rows.** Add `content-start` to
  the alert base. Done when the delivery banner's description sits directly under
  its title regardless of a taller neighbour.

- [x] **Step 5: Record the measured specs.** Add the two uppercase micro-types,
  field label and badge label, to `blueprint/reference/design-system.md` so the
  values are not re-derived by eye. Done when both rows carry the export
  measurement and the class string actually written.

## Verify

- `pnpm check`
- `pnpm build`
- `pnpm test:browser`
- Inspect `/dev/design-system` at 1440px: the Input and Label, Checkbox and
  RadioGroup, NavigationMenu, Alert and Card sections against the artboards.
- Inspect `/questionnaire/about-you` and `/questionnaire/treatment-preference`
  against `EN Questionnaire 1 - About You.png` and
  `EN Questionnaire 8 - Treatment Preference.png`.

## Verification record

Computed styles read from the running page with the browser harness at 1440px,
before and after, then compared with values parsed out of the export.

| Element | Before | After | Export |
| --- | --- | --- | --- |
| Bare field label | 12px, `#173824`, uppercase, 1.2px | 14px, `#405756`, uppercase, 1.4px | 14px, `#405756`, 1px |
| Option card title | uppercase, 1.2px tracking | none, normal | sentence case |
| Option card description | uppercase, 1.2px tracking | none, normal | sentence case |
| Nav link box | 44px, `12px` padding | 36px, `10px 18px` | matches trigger |
| Nav trigger box | 36px, `10px 18px` | unchanged | - |
| Badge label | weight 500, normal tracking | weight 700, 0.6px | bold, 0.7 to 0.8px |

Unchanged and re-confirmed after the edits: Input, Textarea and the Select
trigger all still measure 56px high, 16px radius, 1px `#8C8D89`, 12px/16px
padding. The export's dominant input is 58px at 16px radius, 23 of 29
occurrences, so the `h-14` snap and the F-02 boundary both stand.

- `pnpm check`: 939 files, 0 errors, 0 warnings.
- `pnpm build`: passes.
- `pnpm test:browser`: 7 passed.
- `screens/` regenerated by the screenshot spec; the treatment chips now read
  INJECTION and TABLET, and the option cards are sentence case.
