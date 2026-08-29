# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-05 [P3] fixed - Field and option-card composition strings are copied across showcase sections

**File:** src/routes/dev/design-system/ExampleFormSection.svelte:11
**Found:** 2026-08-29 by /audit (scope: current; lens: quality)
**Why it matters:** `const FIELD_LABEL = 'text-xs font-semibold uppercase
tracking-widest'` is declared identically in `InputSection.svelte:8`,
`TextareaSelectSection.svelte:8` and `ExampleFormSection.svelte:11`. The option-card
Label class string (`flex cursor-pointer items-center gap-4 rounded-md border
border-border bg-card p-4 leading-snug has-data-checked:border-primary
has-data-checked:bg-surface-subtle`) is repeated three times in
`ChoiceControlsSection.svelte` and twice in `ExampleFormSection.svelte`. The spec
names the field composition as a load-bearing contract that features 7, 8 and 9
will copy, so the showcase currently demonstrates five hand-maintained copies of
the pattern those features are meant to follow. A change to the pattern has to be
made in five places, and a missed one silently teaches the wrong shape.
**Suggested fix:** Dev-surface only, so this does not block the feature. When
feature 7 or 8 extracts the real `TreatmentOption` product component, lift the
option-card composition with it and have the showcase consume that component
instead. `FIELD_LABEL` can move to a shared module under
`src/routes/dev/design-system/` in the meantime.
**Resolution:** Fixed in Feature 3a Step 2. The adapted `Field` primitive now
owns both patterns: `FieldLabel` carries the eyebrow typography by default, so
the five hand-maintained `FIELD_LABEL` constants are deleted; the option-card
border, background and checked-state treatment lives in `FieldLabel`'s
`has-[>[data-slot=field]]` composition instead of being restated at each of the
five call sites. `InputSection`, `TextareaSelectSection`, `ExampleFormSection`
and `ChoiceControlsSection` all compose `Field` now.

### F-06 [P2] fixed - The contrast record and the link Button have no dark-surface story

**File:** blueprint/reference/design-system.md:120
**Found:** 2026-08-29 by /audit (scope: current; lens: all)
**Why it matters:** `--foreground` `#173824` is a sanctioned surface, not only a
text colour: `design-system.md` lists it as "Nearly all text; dark surfaces", the
learn-article reference builds its one dark card on it, and the showcase already
renders two `bg-foreground` panels. The section 1b matrix added for F-04 covers
the nine light surfaces and stops there, so nothing records what is safe on the
dark one. The Button `link` variant is the concrete casualty: its resting colour
is `text-foreground`, which on `bg-foreground` measures **1.00:1** and is
literally invisible, and its hover `text-highlight-foreground` measures 2.39:1.
The F-03 repair moved that hover the wrong way, 2.52:1 to 2.39:1, because
darkening text helps on light grounds and hurts on dark ones. Not reachable
today: `variant="link"` is rendered nowhere in `src/`, and both dark panels carry
only `default` and `inverse` buttons. But `link` is part of the locked six-plus-one
Button API, the reference has a dark card, and features 5 and 6 build it.
**Suggested fix:** Extend section 1b with a dark-surface column or a short
companion table, then give `link` an on-dark treatment the same way `default` got
the gold ring override, for example `--background` (12.36:1) or `--primary`
(6.78:1) as the on-dark link colour. Decide it before feature 5 places a link on
the deep green card, not after.
**Resolution:** Fixed in Feature 3a Step 1. Button now exposes a typed
`surface="default" | "dark"` contract, all seven variants have measured
dark-surface text and focus pairings, the showcase demonstrates the matrix
without call-site class overrides, and the contrast record documents it.

### F-07 [P2] open - The adapted Tabs primitive associates no panel with its tab

**File:** src/lib/components/ui/tabs/tabs-trigger.svelte:1
**Found:** 2026-08-29 by /implement (feature 4b; recorded here rather than lost, since
the ledger is the durable record. Not an /audit verdict.)
**Why it matters:** bits-ui emits `role="tab"`, `role="tabpanel"` and `aria-selected`
correctly, but **neither `aria-controls` on the trigger nor `aria-labelledby` on the
panel**. The only link between the two is a matching `data-value`, which assistive
technology does not read. A screen reader user on a tab is therefore not told which
region it controls, and the panel it reaches has no name from its tab. Verified in the
rendered output of `/`: three tabs and three panels, every `aria-controls` absent
before the call-site repair below. This affects every future consumer, including
feature 8's questionnaire projection interstitial, which the 4b spec names as the
second caller of this chart.
**Suggested fix:** Generate a shared id in `tabs.svelte`'s context and have Trigger and
Content derive `aria-controls` and `aria-labelledby` from it plus the item value, so
every consumer gets the association without restating it. Feature 4b worked around it
at the call site by passing an explicit `id` to `Tabs.Content` and a matching
`aria-controls` to `Tabs.Trigger` through the primitive's public props; that repairs the
one usage, not the primitive.
**Resolution:**
