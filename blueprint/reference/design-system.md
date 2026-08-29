# Solean Design System

Token mapping derived from `design/prio_one_landing_page_men_new.html` (Pencil
canvas export, 21 artboards). Counts are measured from the export.

**The export is a visual reference, not code to port.** Its absolute
positioning, fixed canvas dimensions, and arbitrary classes are not part of the
application design. This document exists so the build uses semantic tokens and
the stock Tailwind scales instead of transcribing one-off values.

Authoritative scope decisions live in `blueprint/project-plan.md`. Where the two
disagree, the project plan wins.

## 1. Color

Semantic tokens only. Never `text-[#173824]`. Names describe **role**, never
appearance.

### Base tokens

| Token | Value | Role in the design | Uses |
| --- | --- | --- | --- |
| `--background` | `#FBFAF7` | Page ground, warm off-white | 25 |
| `--foreground` | `#173824` | Nearly all text; dark surfaces | 471 |
| `--card` | `#FFFFFF` | Cards, panels, navigation | 105 |
| `--card-foreground` | `#173824` | Text on cards | - |
| `--popover` | `#FFFFFF` | Dropdown and modal surfaces | - |
| `--popover-foreground` | `#173824` | Text in popovers | - |
| `--primary` | `#E2B64F` | Every main CTA, timer, highlight | 62 |
| `--primary-foreground` | `#172019` | Label on gold buttons | 25 |
| `--primary-hover` | `#D9971C` | Hover and active on primary | 4 |
| `--secondary` | `#F7F8F5` | Back and cancel, completed steps | 57 |
| `--secondary-foreground` | `#173824` | Text on secondary | - |
| `--muted` | `#F4F3EC` | Warm inset panels | 15 |
| `--muted-foreground` | `#405756` | Body copy, descriptions | 186 |
| `--accent` | `#EEF3EC` | Green-tinted badges and banners | 26 |
| `--accent-foreground` | `#173824` | Text on accent | - |
| `--border` | `#E5E7E2` | Default 1px hairline | 117 |
| `--input` | `#E5E7E2` | Field borders | - |
| `--ring` | `#173824` | Focus ring. Deep green, not gold; see section 1a | - |
| `--destructive` | `#C34E45` | Provisional validation and destructive token; see section 1a | 0 |
| `--destructive-foreground` | `#FFFFFF` | Text on destructive fills, 4.66:1 | - |

### Semantic extensions

| Token | Value | Role | Uses |
| --- | --- | --- | --- |
| `--highlight` | `#F7EBCB` | Light emphasis surface: chips, article category | 14 |
| `--highlight-foreground` | `#B07E12` | Text on highlight; eyebrows, discount values | 21 |
| `--surface-warm` | `#F3ECDD` | Chart gridlines, article hero | 13 |
| `--surface-subtle` | `#FFFDF8` | Order summary, treatment option panels | 10 |
| `--surface-tint` | `#DDE4DD` | FAQ items, dividers, secondary card borders | 34 |
| `--text-tertiary` | `#6F7D74` | Tertiary text | 31 |
| `--text-faint` | `#9AA79E` | Disclaimers, clinical notes | 55 |
| `--rating` | `#00B67A` | Rating and star color only | 5 |

`--rating` is **not** a general success color. Do not reuse it for success
states.

Do not reintroduce appearance-based names such as `cream`, `sand`, `gold-deep`,
or `gold-subtle`. Components consume roles:

```
bg-primary          text-primary-foreground
bg-highlight        text-highlight-foreground
bg-surface-subtle   text-text-tertiary
border-border
```

### 1a. Destructive and validation, provisional

The reference contains **no destructive color**. Not one red across 21
artboards. The muted brick below is approved as a **temporary technical token
for the UI prototype**.

> **Provisional.** This colour does not come from the approved design reference.
> It exists to make validation and destructive actions accessible in the
> prototype and **requires final brand review** before any production use.

| Token | Value | oklch | Use |
| --- | --- | --- | --- |
| `--destructive` | `#C34E45` | `oklch(0.5771 0.1512 27.33)` | Fills for destructive actions |
| `--destructive-foreground` | `#FFFFFF` | `oklch(1 0 0)` | Text on those fills |
| `--destructive-hover` | `#B23F37` | `oklch(0.5271 0.1512 27.33)` | Conservative darken |
| `--destructive-active` | `#A4322C` | `oklch(0.4871 0.1512 27.33)` | Pressed |
| `--destructive-text` | `#BC483F` | `oklch(0.5571 0.1512 27.33)` | Destructive as **text** on light surfaces |

Applies to: invalid field borders, validation messages, destructive actions,
contraindication warnings, and destructive focus states where appropriate.

**Never** use the rating green `--rating` as a success, validation, or
destructive colour.

**The showcase must include invalid states. Do not omit them.**

#### Why there are two red values

Measured contrast, WCAG 2.1:

| Pairing | Ratio | Verdict |
| --- | --- | --- |
| `--destructive-foreground` white on `--destructive` | 4.66:1 | Passes AA normal text |
| White on `--destructive-hover` | 5.76:1 | Passes |
| White on `--destructive-active` | 6.85:1 | Passes |
| `--destructive` as text on `card` `#FFFFFF` | 4.66:1 | Passes AA |
| `--destructive` as text on `background` `#FBFAF7` | **4.47:1** | **Fails AA normal text** |
| `--destructive` as text on `muted` `#F4F3EC` | **4.19:1** | **Fails AA normal text** |
| `--destructive-text` on all three light surfaces | 4.56 to 5.07:1 | Passes AA everywhere |

The fill colour is safe behind white text but marginally too light to *be* text
on the warm page ground, which is exactly where validation messages sit.
`--destructive-text` is the same hue and chroma at L 0.5571, the darkest point
that clears 4.5:1 on the worst light surface. Use the fill token for fills and
borders, the text token for message copy.

**Prototype decision:** use the two-token split. `--destructive` is for fills
and borders; `--destructive-text` is for validation and destructive message
copy on light surfaces. Final production colours still require brand review.

### Focus-visible

The gold `--ring` was insufficient: too close to the gold primary button and
weak on the warm background. **`--ring` is now `#173824`, the deep green
foreground.**

Default treatment on every focusable component:

```
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
focus-visible:ring-offset-background
```

No permanent outline when focus is not keyboard-visible. The offset must create
real separation between the component and the ring.

Measured, focus indicators need 3:1:

| Ring on | Ratio | Verdict |
| --- | --- | --- |
| `background` `#FBFAF7` | 12.36:1 | Passes |
| `card` `#FFFFFF` | 12.90:1 | Passes |
| `secondary` `#F7F8F5` | 12.10:1 | Passes |
| `primary` gold `#E2B64F` | 6.78:1 | Passes |
| `foreground` `#173824` dark sections | 1.00:1 | **Fails, invisible** |

On dark surfaces use a variant-appropriate contrasting ring, gold `#E2B64F` at
6.78:1, but only where the default deep green would not be visible.

**Accessibility takes priority here** because the design reference defines no
focus states at all.

### Dark mode

Out of scope. No toggle, no dedicated build-plan feature, not treated as
approved design, not covered by QA. The technical `.dark` block shipped with
shadcn may remain untouched.

## 2. Typography

### Exactly two fonts

| Token | Font | Used for |
| --- | --- | --- |
| `--font-display` | Inter Tight Variable | Headings, product names, prices, stats, large numbers |
| `--font-sans` | DM Sans Variable | Body, navigation, buttons, forms, labels, badges, eyebrows, metadata, captions |

**Poppins and plain Inter are not used.** The 61 Poppins occurrences in the
export (buttons, navigation, chips, eyebrows) normalize to DM Sans. The 5 plain
Inter occurrences are incidental and dropped. There is no `--font-ui`.

```css
--font-sans: 'DM Sans Variable', ui-sans-serif, system-ui, sans-serif;
--font-display: 'Inter Tight Variable', ui-sans-serif, system-ui, sans-serif;
```

The stock `Inter Variable` default currently in `layout.css` is replaced.

### Size scale

No arbitrary classes: no `text-[17px]`, `text-[38px]`, `leading-[27px]`,
`tracking-[-0.5px]`. Stock Tailwind scale only, plus stock `leading-*` and
`tracking-*`.

Every arbitrary size in the export snapped to its nearest stock step. Ties
resolve toward the larger step for display text, the smaller for dense UI.

| Design px | Tailwind | Applies to | Uses |
| --- | --- | --- | --- |
| 9, 10, 11, 12 | `text-xs` | Captions, legal, timer units | 45 |
| 13, 14 | `text-sm` | The workhorse. Labels, helper text | 210 |
| 15, 16 | `text-base` | Body copy, navigation links | 197 |
| 17, 18 | `text-lg` | Button labels, lead body | 182 |
| 19, 20 | `text-xl` | Card headings | 68 |
| 21 - 26 | `text-2xl` | Panel titles, lead copy | 29 |
| 28, 29, 30 | `text-3xl` | Sub-section headings | 18 |
| 32, 34, 38, 40 | `text-4xl` | Section headings, stat numerals | 40 |
| 42, 46 | `text-5xl` | Large section headings | 2 |
| 56, 58, 64 | `text-6xl` | Feature numerals, big stats | 10 |
| 70 | `text-7xl` | Oversized display | 1 |
| 96 | `text-8xl` | Hero headline | 3 |

805 declarations total.

### Responsive ladders

The export is a fixed 1920px canvas, so a single class only describes the
desktop end. These ladders are what gets written.

| Role | Classes |
| --- | --- |
| Hero H1 | `text-4xl sm:text-5xl lg:text-7xl xl:text-8xl` |
| Section H2 | `text-3xl md:text-4xl` |
| Large stat | `text-4xl md:text-5xl lg:text-6xl` |
| Sub-heading H3 | `text-2xl md:text-3xl` |
| Card title | `text-lg md:text-xl` |
| Lead paragraph | `text-base md:text-lg lg:text-xl` |
| Body | `text-base` |
| Label, body small | `text-sm` |
| Caption, legal | `text-xs` |
| Eyebrow | `font-sans text-xs font-semibold uppercase tracking-widest` |

### Weight by role

Weight follows the element's role. Do not apply `font-semibold` to every
heading by default.

| Role | Weight |
| --- | --- |
| Hero | `font-medium` |
| Section heading | `font-medium` or `font-semibold` |
| Card heading | `font-semibold` |
| Button | `font-semibold` |
| Body | `font-normal` |

## 3. Radii

Base `--radius: 1.25rem`. With the multiplier chain already in `@theme inline`,
the stock classes reproduce the export closely.

| Design px | Class | Applies to |
| --- | --- | --- |
| 12 | `rounded-sm` | Small chips, badges |
| 16 | `rounded-md` | Inputs |
| 20, 21, 22 | `rounded-lg` | Cards, panels |
| 28, 29, 30 | `rounded-xl` | Large cards, hero image, bento |
| 32, 36 | `rounded-2xl` | Feature panels |
| 33, 34 | `rounded-full` | Pill buttons |

No `rounded-[34px]` or any other arbitrary radius.

## 4. shadcn-svelte

shadcn is a **behavior and accessibility layer, not the finished look of the
page.**

### When primitives are installed

**All currently known shared UI primitives are installed, adapted and verified
in Feature 1. Later features may add a new primitive only when an unforeseen
interaction genuinely requires it. Any newly added primitive must be adapted to
the Solean design system in the same feature.**

There is no per-feature drip of known primitives. A feature that needs `Button`
finds it already adapted.

### Shared primitive set, Feature 1

```
button  input  textarea  label  select
checkbox  radio-group  card  badge  separator
dialog  sheet  accordion
```

Thirteen primitives. This is not the whole library.

### Deferred

`carousel`, `tooltip`, `sonner`, `skeleton`, `tabs`, `chart`,
`navigation-menu`

Deferred until a feature proves it genuinely needs one. Adding it then is
allowed and carries the adaptation requirement with it.

### What adapting a primitive means

**Installing a shadcn primitive is not completion. Each primitive must be
visually adapted to the Solean design reference using semantic tokens and
standard Tailwind scales while preserving accessible behavior and a stable
public API.**

For every applicable primitive, Feature 1 defines and demonstrates:

| Aspect | Requirement |
| --- | --- |
| States | default, hover, active, focus-visible, disabled, invalid, and checked or selected where applicable |
| Variants | the supported sizes and variants, no more |
| Keyboard | documented and working keyboard behavior |
| Responsive | responsive behavior where the primitive has any |

Variants are centralized in the primitive implementation, using the existing
shadcn-svelte variant approach. **Do not create redundant wrappers such as
`SoleanButton` when the difference is only visual styling.**

### Component boundaries

| Location | Holds |
| --- | --- |
| `src/lib/components/ui/` | Adapted shadcn primitives |
| `src/lib/components/brand/` | Global brand visuals: `SoleanLogo`, `StarRating` |
| `src/lib/features/<feature>/` | Feature-specific product components |

Feature 1 builds shared primitives and global brand foundations only.
Product-specific components are built by the feature that owns their domain
semantics, and they compose the already adapted primitives:

`TreatmentOption`, `AddOnCard`, `OrderSummary`, `CheckoutStep`, `ReviewTimeline`,
questionnaire answer cards, `CountdownTimer`, `ProgressProjectionChart`,
`NumberedHowItWorks`, `BentoGrid`, `PartnerLogoStrip`

### Interaction states

**Tailwind state variants control *when* a style applies. Semantic tokens define
*what* visual value is applied.** Prefer reusing existing semantic tokens for
hover and active. Keep a dedicated state token only where the reference supplies
a deliberate brand value, as it does for `--primary-hover`.

Do not create a hover token per component.

| Variant | Default | Hover | Active |
| --- | --- | --- | --- |
| primary | `bg-primary` | `bg-primary-hover` | `bg-primary-hover` plus a subtle stock pressed treatment |
| secondary | `bg-secondary` | `bg-accent` | `bg-muted` |
| outline | `bg-transparent border-border` | `bg-accent` | `bg-muted` |
| ghost | `bg-transparent` | `bg-accent` | `bg-muted` |
| link | `text-foreground` | underline or `text-highlight-foreground` | - |
| destructive | `bg-destructive` | `bg-destructive-hover` | `bg-destructive-active` |

`--primary-hover` `#D9971C` stays. It is the one explicit interactive colour in
the reference and gives the intended darker gold. **`hover:bg-primary/90` is not
equivalent** and produces a lighter, background-dependent result.

Verified: `--primary-foreground` `#172019` reads at 8.78:1 on primary and 6.68:1
on primary-hover.

**Static Cards get no hover styling.** Only interactive or clickable Cards take
hover and focus-visible states. Accordion hover stays subtle and reuses semantic
surfaces; there is no accordion-hover token.

### Button variants and sizes

Six variants, no more: `default` (primary gold CTA), `secondary` (back and
low-emphasis), `outline` (outlined CTA from the reference), `ghost` (navigation
and low-emphasis icon actions), `link` (inline actions), `destructive` (remove
and destructive actions).

Four sizes:

| Size | Spec | For |
| --- | --- | --- |
| `sm` | `h-10 px-4 text-sm` | Compact UI action |
| `default` | `h-12 px-5` or `px-6`, `text-base` | Forms and standard application actions |
| `lg` | `h-17 px-8 text-lg rounded-full` | Marketing and primary funnel CTA |
| `icon` | `size-10` | Square icon-only control |

`h-17` is verified against this project's Tailwind v4: it compiles to
`calc(var(--spacing) * 17)` = 4.25rem = **exactly 68px**, matching the
reference's pill button. **Do not use `h-[68px]`.**

**Not every button is a pill.** The large marketing CTA uses `rounded-full`;
normal form and application buttons follow the shared radius system unless the
reference clearly requires a pill.

Every variant demonstrates default, hover, active, focus-visible and disabled.

### Textarea and Select

Neither has an independent visual reference. Both derive directly from `Input`
and reuse, without deviation:

- the same font and text sizing
- the same `--border` token and input background
- the same `rounded-md` radius
- the same focus-visible treatment
- the same invalid treatment
- the same disabled opacity and cursor behavior
- the same label, description, and error-message composition

The Select trigger aligns visually with Input. Its dropdown uses the popover
tokens and shadcn-svelte's accessible behavior.

Textarea uses Input's horizontal padding and a sensible stock Tailwind minimum
height. **No arbitrary dimensions, no separate textarea colour system.**

### Rulings

| Surface | Decision |
| --- | --- |
| Checkout steps | Bespoke sequential `CheckoutStep` component, **not** an Accordion |
| "Learn more" | A link or a dialog, **not** a tooltip |
| Projection chart | Custom responsive SVG. No chart library unless that proves insufficient |
| Visual panels | Not every panel needs to be a shadcn `Card` |
| Payment radio group | Acceptable only as mock UI |
| Mobile navigation | Uses the adapted `Sheet`, designed as a considered responsive adaptation. The export has no mobile artboards |

## 5. Layout

The export is a 41280 x 7944 px canvas of desktop artboards. Its absolute
positions and left/top values are not part of the application design.

**Use:** max-width containers, CSS Grid, Flexbox, fluid padding, responsive
breakpoints, sensible mobile layouts, order summary sticky only on wide screens.

**Never:** absolute positioning for main layout, fixed section heights that
exist only to match the canvas, widths such as `w-[1920px]`, Pencil coordinates.

## 6. Outstanding design review items

1. **Destructive colour is provisional, not brand-approved.** Approved as a
   temporary technical token for the prototype only. Requires final brand review.
2. **Rounding shifts.** 15px to 16px (197 occurrences) and 17px to 18px (182)
   are the highest-volume changes. Both make body copy and button labels
   slightly larger than the export, both improve readability, and both land on
   the stock scale. Revert only if fidelity review rejects them.
