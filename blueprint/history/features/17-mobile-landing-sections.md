# Feature: Mobile landing sections

**From build-plan:** feature 17
**Status:** verified

## Goal

Carry the mobile refinement down the rest of the landing page, section by
section, against the mobile artboard. Desktop composition stays as it is.

## Design reference

`design/mobile/prio_one_landing_page_men_mobile.html`. A reference, not code to
port; its own defects are not requirements.

## In scope

Per section, below `sm` only:

1. `TrustBenefits` - hidden; the artboard has no such band
2. `BentoGrid` - the artboard's `Care Features`: a visible eyebrow and title,
   then the lead card on white with its image on top, then the remaining four as
   a swipeable row of image-left cards with pagination dots
3. `ResultsBand` - the artboard's opening block down to the CTA: its own eyebrow
   above the heading and a full-width button. Everything below the button, the
   artwork and the member review, stays as built
4. `ProjectionSection` - the medical framing moves above the chart, and both the
   horizon tabs and the framing's pair of CTAs are hidden; the artboard shows
   one static chart and ends that block at the factor tags
5. `TestimonialsSection` - carousel controls centred, below the card
6. `ClinicalTeamSection` - the same control treatment
7. `HowItWorks` - `Start questionnaire` leaves the step row and becomes the
   artboard's full-width primary button at the foot of the section
8. Every bleed panel loses its side gutter, its radius and the gap between
   panels, so the bands meet each other and the viewport edge

## Out of scope

- Desktop at every breakpoint from `sm` up
- Copy, destinations, review data, and the card fixtures themselves
- Reordering or restyling anything below the results band's CTA
- The artboard's stretched active dot, rejected during review: every dot is the
  same size and the active one is distinguished by colour alone

## Build steps

- [x] **Step 1 - Full-bleed panels and the hidden trust band** - Drop the side
  gutter and radius below `sm` for every panel section, and hide
  `TrustBenefits`. *Done when:* at 390px the panels touch both edges with square
  corners, the trust band is absent from the page and from the accessibility
  tree, and at 1200px and 1440px nothing moves.

- [x] **Step 2 - The care carousel** - Give `BentoGrid` its mobile header and
  swipeable carousel with equal-size dots on the warm ground, keeping the
  desktop grid. *Done when:* at 390px one card shows at a time, the dots track
  the selected slide, controls are keyboard reachable, and the desktop grid is
  unchanged.

- [x] **Step 3 - The remaining sections** - The projection reorder and hidden
  tabs, the two carousel control treatments, and the how-it-works button.
  *Done when:* at 390px each matches the artboard's arrangement and desktop is
  unchanged.

- [x] **Step 4 - Evidence** - `pnpm check`, `pnpm test`, `pnpm test:browser`
  and `pnpm build` pass, with browser coverage for the mobile contract and
  desktop regression, and 390px screenshots compared to the artboard.

## Files / areas

- `src/lib/features/marketing/container.ts`
- `TrustBenefits`, `BentoGrid`, `ResultsBand`, `ProjectionSection`,
  `TestimonialsSection`, `ClinicalTeamSection`, `HowItWorks`
- `src/lib/features/marketing/content.ts` - the carousel section's own heading
- `e2e/marketing-fidelity.spec.ts`

## Testing

Browser coverage; no new pure logic is planned beyond the dot index, which the
carousel primitive already owns.
