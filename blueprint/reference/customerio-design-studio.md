# Customer.io Design Studio: Solean values

Fill-in values for the Styles panel in Customer.io Design Studio, in the panel's
own order, so a person can work top to bottom without leaving the page.

**This document is a mirror, not a source.** `src/routes/layout.css` and
`blueprint/reference/design-system.md` are authoritative. Design Studio holds a
hand-typed copy that nothing in this repository can keep in step, so a token
change here is a change somebody has to repeat in the panel. Colours are the
likeliest to drift; check them whenever `layout.css` moves.

**Where it applies.** Design Studio styles span emails, in-app messages, SMS and
WhatsApp. Today only the abandoned-questionnaire reminder emails are built in the
panel. In-app messages and the notification inbox are not reachable on the current
plan; their sections are recorded anyway so the panel is complete when they are.

**Two constraints the medium imposes**, both different from the website:

- **Values are px, never rem.** Email clients treat `rem` inconsistently and our
  root font-size step at large viewports does not exist here. Every number below
  is px at a 16px root.
- **The ladder is capped.** An email body is 600px wide and a modal is narrower
  still, so the hero steps (72px, 96px) have no place in either. The scale below
  stops at 36px.

---

## Variables

### Colors

Name them exactly as written; the names are what appear in every component's
colour picker.

| Name in panel | Hex | Role |
| --- | --- | --- |
| Background | `#FBFAF7` | The page ground. Warm sand, never white |
| Surface | `#FFFFFF` | Cards and panels sitting on the ground |
| Surface warm | `#F3ECDD` | Secondary panel ground |
| Foreground | `#173824` | Every heading and body line. Deep green, never black |
| Primary | `#E2B64F` | Gold. CTA fill only |
| Primary hover | `#D9971C` | The darker gold. In-app only, email has no hover |
| On primary | `#172019` | Text on a gold fill |
| Muted text | `#405756` | Secondary copy, labels |
| Tertiary text | `#57655C` | Captions, legal, metadata |
| Border | `#E5E7E2` | Hairlines and dividers |
| Accent | `#EEF3EC` | Tinted green panel ground |
| Highlight | `#F7EBCB` | Tinted gold panel ground |
| Highlight text | `#906100` | Text on Highlight, and the link hover colour |
| Announcement | `#0C2517` | Dark band ground |
| On announcement | `#FFFFFF` | Text on the dark band |

Two colours that exist in the system and are **not** for general use:

- `#00B67A` is the rating green. Stars only. Never success, never validation.
- `#C34E45` is destructive and still provisional, with no brand sign-off. Do not
  put it in a marketing message.

**Dark mode.** Design Studio offers a second value per colour and the JavaScript
SDK defaults `colorScheme` to following `prefers-color-scheme`. Dark mode is out
of scope for Solean: there is no dark palette, no toggle and no QA. Set every dark
value identical to its light value, so a reader with a dark OS gets the design we
actually drew rather than one nobody reviewed.

### Fonts

Two families, and only two.

| Panel slot | Stack | Used for |
| --- | --- | --- |
| Display | `'Inter Tight', Arial, Helvetica, sans-serif` | Headings, prices, stats, large numerals |
| Body | `'DM Sans', Arial, Helvetica, sans-serif` | Everything else, buttons included |

Both are on Google Fonts, so a webfont import renders them in Apple Mail and in
any in-app message. Gmail and Outlook strip the import and fall back to Arial.
That is the intended outcome rather than a defect: the site's own `@font-face`
fallbacks are metric-matched against Arial precisely so the fallback holds its
shape. Do not substitute a different fallback.

Poppins and plain Inter are not part of this system. If a template offers them,
change it.

### Radius

Base radius is 20px on the site, with a fixed multiplier chain.

| Panel value | px | Applies to |
| --- | --- | --- |
| Small | 12 | Chips, badges |
| Medium | 16 | Inputs |
| Large | 20 | Cards, panels |
| XL | 28 | Large cards, hero imagery |
| 2XL | 36 | Feature panels |
| Full | 9999 | Every button, without exception |

Buttons are pills here. There is no square-cornered button anywhere in Solean.

### Spacing

The stock 4px scale. Use these steps and nothing between them.

| Step | px |
| --- | --- |
| 1 | 4 |
| 2 | 8 |
| 3 | 12 |
| 4 | 16 |
| 5 | 20 |
| 6 | 24 |
| 8 | 32 |
| 10 | 40 |
| 12 | 48 |
| 16 | 64 |
| 20 | 80 |
| 24 | 96 |

---

## Components

### Text styles

Colour is Foreground `#173824` unless the row says otherwise.

| Style | Font | Size | Weight | Line height | Letter spacing |
| --- | --- | --- | --- | --- | --- |
| H1 | Display | 36 | 500 | 1.1 | -0.025em |
| H2 | Display | 30 | 500 | 1.15 | -0.025em |
| H3 | Display | 24 | 600 | 1.2 | -0.02em |
| H4 / card title | Display | 20 | 600 | 1.3 | normal |
| Lead | Body | 18 | 400 | 1.55 | normal |
| Paragraph | Body | 16 | 400 | 1.5 | normal |
| Small / label | Body | 14 | 400 | 1.5 | normal, colour Muted text |
| Caption / legal | Body | 12 | 400 | 1.5 | normal, colour Tertiary text |
| Eyebrow | Body | 12 | 600 | 1.4 | 0.1em, uppercase, colour Highlight text |

Weight follows role rather than size: a hero and a section heading are 500, a card
heading is 600, body is 400. Do not set every heading semibold.

### Links

The panel ships `#0000EE` underlined, the browser default. Replace it.

| Property | Value |
| --- | --- |
| Colour | Foreground `#173824` |
| Decoration | underline |
| Underline offset | 4px |
| Hover colour | Highlight text `#906100` |
| Weight | inherit from the surrounding text |

On a dark ground (Announcement `#0C2517`) the link is `#FBFAF7` and its hover is
Primary `#E2B64F`.

Never blue, and never `--primary` as link text: gold on the warm ground measured
too low to read as body copy.

### Buttons

The site has seven variants. Three of them survive into this medium; the rest
depend on hover, focus or dark-surface compounds that an email cannot express.

Set **Primary** as the default, then add the other two as variants.

**Primary** (the gold CTA)

| Property | Value |
| --- | --- |
| Background | Primary `#E2B64F` |
| Text | On primary `#172019` |
| Border | none |
| Radius | Full |
| Font | Body, 600 |
| Hover background | Primary hover `#D9971C`, in-app only |

**Inverse** (the high-emphasis solid, for a dark or busy panel)

| Property | Value |
| --- | --- |
| Background | Foreground `#173824` |
| Text | Background `#FBFAF7` |
| Border | none |
| Radius | Full |
| Font | Body, 600 |

**Outline** (the secondary action)

| Property | Value |
| --- | --- |
| Background | transparent |
| Text | Foreground `#173824` |
| Border | 1px Border `#E5E7E2` |
| Radius | Full |
| Font | Body, 600 |

Sizes are expressed as padding here, because an email button has no height
property. The values reproduce the site's pill heights of 40, 56 and 68px.

| Size | Padding | Text size |
| --- | --- | --- |
| Small | 10px 16px | 14 |
| Default | 16px 24px | 16 |
| Large | 21px 32px | 18 |

Large is the marketing and funnel CTA, and is what a popup or a reminder's main
action should use.

### Dividers

| Property | Value |
| --- | --- |
| Colour | Border `#E5E7E2` |
| Thickness | 1px |
| Style | solid |

One hairline. There is no heavy rule and no dotted rule in this system.

### Images

| Property | Value |
| --- | --- |
| Radius, large imagery | XL, 28px |
| Radius, card imagery | Large, 20px |
| Radius, avatar or portrait | Full |

Every photograph on the site is rounded. A square-cornered image reads as foreign.

### Sections

| Property | Value |
| --- | --- |
| Page ground | Background `#FBFAF7` |
| Panel ground | Surface `#FFFFFF`, radius Large |
| Content width, email | 600px |
| Section padding, email | 32px horizontal, 40px vertical |
| Gap between blocks | 24px |

Never pure white as the page ground. The warm sand is the brand's most recognisable
surface and white next to it reads as a rendering fault.

---

## Patterns

### Inbox

Recorded for completeness. The notification inbox is not reachable today: it needs
a person identified in the browser, and Solean identifies nobody client-side. Do
not publish an inbox, because publishing is what makes the bell render.

If it is ever built, these are the values:

| Property | Value |
| --- | --- |
| Icon background | Foreground `#173824` |
| Icon colour | Background `#FBFAF7` |
| Position | bottom right |
| Panel background | Surface `#FFFFFF` |
| Panel border | Border `#E5E7E2` |
| Panel radius | Large, 20px |
| Hover row | Accent `#EEF3EC` |
| Divider | Border `#E5E7E2`, 1px |
| Unread badge background | Primary `#E2B64F` |
| Unread badge text | On primary `#172019` |

---

## What the panel cannot express

Recorded so nobody hunts for a missing setting.

- **Four of the seven button variants.** `secondary`, `ghost`, `link` and
  `destructive` all depend on hover or active states, or on the `surface: dark`
  compound, and none of them is a marketing CTA. They stay on the site.
- **The focus ring.** `--ring` is `#173824` at 2px with a 2px offset, and gold on
  dark grounds. An in-app message keeps the browser's own focus behaviour; an email
  has none.
- **Responsive ladders.** The site writes headings as `text-3xl md:text-4xl` and
  similar. The panel holds one size per style, so the table above is the single
  value, chosen for a 600px column.
- **The root font-size step.** The site scales to 112.5% and 125% on large
  viewports. Nothing here does.

## Source of each value

| Section | Source |
| --- | --- |
| Colors | `src/routes/layout.css`, the `:root` block |
| Fonts, radius, spacing | `layout.css` `@theme inline`, and `design-system.md` sections 2 and 3 |
| Text styles | `design-system.md` section 2, capped for this medium |
| Buttons | `src/lib/components/ui/button/button.svelte` |
| Dividers | `src/lib/components/ui/separator/separator.svelte` |

Button sizes come from the component rather than from `design-system.md` section
4, whose `default` row still records an earlier `h-12 px-5` before the control
settled at `h-14 px-6`. The component is what ships.
