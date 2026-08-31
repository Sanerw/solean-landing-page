# Feature: Mobile menu panel

**From build-plan:** feature 16
**Status:** verified

## Goal

Give the opened mobile menu the reference's full-screen dark treatment:
numbered navigation rows in display type, a logo-and-close header, a gold
primary CTA, and a utilities row. Feature 15 refined only the closed trigger;
this is the panel behind it.

## Design reference

- `design/mobile/prio_one_landing_page_men_mobile.html`, artboard
  `Solean Landing Page — Mobile Menu Open`. A reference, not code to port.
- `blueprint/reference/design-system.md` - authoritative tokens and focus rules.

## In scope

- `MobileNav`'s opened `Sheet` panel: full-bleed `--foreground` surface, logo
  and circular close button, numbered rows with display type and trailing
  arrows, hairline separators, gold full-width CTA, utilities row
- Keeping the adapted `Sheet` primitive's behaviour: focus trap, Escape,
  focus restore, scroll lock

## Out of scope

- Navigation destinations and the `NAV_ITEMS` contract. The reference's own
  list (Home / Treatments / How it works / About us) is not adopted: ours
  carries the real routes and their `inert` flags
- The reference's `Get started` CTA wording; the existing `HERO.primaryCta`
  stays
- A `Help` utility, which would promise a page that does not exist
- Desktop navigation, the closed trigger, and every other surface

## Hero refinements carried on this branch

Agreed during review, so the branch also carries three narrow-frame hero
adjustments from Feature 15:

- the hero fills the viewport minus the offer bar, through the
  `--spacing-hero-bleed` and `--spacing-hero-bleed-sm` tokens rather than an
  arbitrary calc, because the bar is 64px below `sm` and 44px above it
- the mobile headline steps up to `text-5xl`; the three-line break this
  produces was chosen over the reference's two lines to stay on the stock scale
- the eyebrow tag tightens to `px-3 py-1` below `sm`

## Build steps

- [x] **Step 1 - The panel** - Recompose the sheet content into the reference's
  full-screen dark panel with the numbered rows, header, CTA and utilities row,
  reusing `SoleanLogo`, `Button`, `Sheet` and semantic tokens. *Done when:* at
  390px the panel fills the screen with the reference's hierarchy; the menu
  opens, traps focus, closes on Escape and by the close button, and restores
  focus; every destination keeps its current href and inert state; contrast is
  adequate on the dark ground; and the desktop header is unchanged.

- [x] **Step 2 - Evidence** - Extend the marketing browser coverage with the
  panel's contract. *Done when:* `pnpm check`, `pnpm test`, `pnpm test:browser`
  and `pnpm build` pass, with a 390px screenshot compared to the artboard.

## Files / areas

- `src/lib/features/marketing/MobileNav.svelte`
- `src/lib/components/ui/sheet/sheet-content.svelte` - one `overlayClass` prop,
  so a panel that does not cover the viewport can align its scrim to itself
- `src/lib/features/marketing/HeroSection.svelte` and `src/routes/layout.css` -
  the hero refinements above
- `e2e/marketing-fidelity.spec.ts`

## Testing

Browser coverage for the panel contract; no new pure logic is planned.
