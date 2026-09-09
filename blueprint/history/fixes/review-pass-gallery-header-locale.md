# Fix: seven review items, from the gallery photograph to the language a visitor is served

**Type:** Fix
**Status:** verified

## The problem

Seven items from a design and behaviour review. Six are changes; the seventh turned
out to be a question with an answer, and no code behind it.

| # | Where | What is wrong |
| --- | --- | --- |
| 1 | `TreatmentGallery.svelte` | The photograph sits inset on the panel's own ground, so a grey frame runs around it. It should fill the tile, with only the white inset border left |
| 2 | `SiteHeader.svelte` | The `solid` variant paints `bg-card`, a white bar on the warm page ground. It should be transparent |
| 3 | `ClinicianCard.svelte` | Every team card ends in an inert "Mehr erfahren" line with an arrow. It promises a profile page that does not exist |
| 4 | `button.svelte` | The `default` size is `h-12` (48px). It should be 56px |
| 5 | `ResultsBand.svelte` | The three benefit icons are `size-5` (20px) beside a two-line block, much smaller than the reference, where the icon reads against the whole block |
| 6 | `vite.config.ts`, locale routing | With English chosen the site drops back to German on some navigations, and nothing reads the visitor's browser language |
| 7 | `/learn/blog/mounjaro-vs-wegovy` | Suspected of not reading from Sanity: the Studio shows a body of one empty table while the page renders a full article |

### Point 6, the actual cause

The strategy is `['url', 'cookie', 'baseLocale']` and the URL strategy is first.
`defaultUrlPatternExtractLocale` (`src/lib/paraglide/runtime.js`) ends in
`toLocale(pathSegments[0]) || baseLocale`, so **every** path resolves: a bare path
returns `de` rather than nothing. The URL strategy therefore always matches, and
`cookie` and `baseLocale` after it are unreachable. The remembered language has
never done anything on the server, which is why any address without an `/en`
prefix silently serves German.

A second, concrete cause turned up in the browser during step 3: the Solean mark
in `SiteHeader` and in `MobileNav` was the one internal link in the app still
written as `href={ROUTES.home}` rather than `localizeHref(ROUTES.home)`, so
clicking the logo on an English page asked for `/`. The strategy change alone
would have masked it with a 307; both are fixed, because a link that needs a
redirect to be correct is still wrong.

### Point 7, resolved without a change

The route reads Sanity, and it reads it correctly. Verified against the live
Content Lake on 2026-09-09:

| Document | Body blocks |
| --- | --- |
| `GNi82xCo1eRS3egKAh1fX9` (published, `de`) | 8 |
| `GNi82xCo1eRS3egKAh1fkc` (published, `en`) | 8 |
| `drafts.GNi82xCo1eRS3egKAh1fX9` | 1, one `articleTable` |

The Studio was showing an unpublished German draft whose body had been emptied.
The site serves published content without a preview token, which is the designed
behaviour. **Nothing to build.** One thing worth saying out loud: publishing that
draft as it stands would replace the German article with an empty table.
Discarding it in the Studio is the user's call, not a code change.

## The fix

Six changes, each self-contained. Nothing here touches the questionnaire, the
Shopify handoff, the Customer.io reminder, or analytics.

**Locale (point 6).** The strategy order alone cannot express this, which the browser suite
proved: whichever strategy leads answers every request, because
`defaultUrlPatternExtractLocale` ends in `toLocale(segment) || baseLocale` and an unprefixed
path therefore reports German rather than "no locale". Leading with `url` leaves the
remembered language unreachable, which is the bug. Leading with `cookie` or `preferredLanguage`
instead bounces every explicit `/en` address back to German, which is worse: it is every
`hreflang` alternate the site publishes, every English link anyone shares, and it broke 121
browser tests at once.

So the prefix keeps deciding for itself, and only an address without one asks the question.
`entryRedirect` in `src/lib/i18n/entry-locale.ts` answers it, called from `hooks.server.ts` for
document requests, in the visitor's own order of explicitness: the language they are already
reading, then the ones their browser asks for, then German. The Paraglide strategy stays
`['url', 'cookie', 'baseLocale']`, where `cookie` is never read and is not decoration:
`setLocale` writes it, which is how the switcher's choice survives a navigation at all.

Chosen behaviour, decided by the user:

| Visitor | Result |
| --- | --- |
| No cookie, German `Accept-Language` | `/` stays German |
| No cookie, any other language | `/` → 307 → `/en` |
| Reading English, follows a bare-path link | 307 to the `/en` address, instead of flipping to German |
| Reading German, opens a shared `/en/...` link | Stays English. The address names a language and nothing overrules that |

The last row is the one place this departs from what was agreed, and it is deliberate: the
accepted cost was written for a language somebody chose, but Paraglide's client writes that
cookie on first render too, so honouring it over the URL would have shut the English site to
every German browser rather than to the few who had switched.

**Cache:** the two responses that now depend on request headers carry
`Vary: Accept-Language, Cookie`. Both are named, because a 307 produced for a remembered
English would otherwise be replayed to a German visitor sending the same `Accept-Language`.

**Must not break:** `legacyGermanPath` still 308s `/de/...` before any of this;
`hreflang` alternates keep pointing at both languages; `reroute` keeps
de-localising on client navigation.

## Build steps

- [x] **Step 1 - the four visual changes.** Gallery photo fills the tile with the
      caption moved onto it at the foot; header `solid` variant transparent;
      "Mehr erfahren" removed from the team cards along with the now-unused
      `learnMore` prop, its GROQ projection and its type; `ResultsBand` icons
      enlarged to read against the two-line block.
      **Done when:** the treatment page shows a full-bleed photo inside the white
      border with the caption on it, the header lets the page ground through, no
      team card carries a "Mehr erfahren" line, and the three benefit icons match
      the reference's weight.
- [x] **Step 2 - the button height.** `default` size from `h-12` to `h-14`.
      This is a primitive, so every default button grows 8px: the header CTA, the
      landing CTAs, the questionnaire's Continue. That ripple is the intent.
      **Done when:** a default button measures 56px, and the header and the
      questionnaire still lay out without clipping or wrapping.
- [x] **Step 3 - the locale rule.** `entryRedirect` and its hook, the unit tests
      for the behaviour table above, and the browser proof in `e2e/locale.spec.ts`.
      The suite's Chromium is given `locale: 'de-DE'`: it is a German market and
      the site now reads the header, so a browser that says `en-US` is no longer a
      neutral one. Three specs that read the English site and then asked for a bare
      path forget the language first, through `e2e/locale.ts`, because that visitor
      is now sent back to `/en` on purpose.
      **Done when:** an English browser lands on `/en`, a German one stays on `/`,
      a visitor who picks English keeps it across navigations, and an explicit
      `/en` address is served to anybody who asks for it.

The `learnMore` field stays in the Studio schema (`../studio-solean`): a separate
repository and a separate deploy, and leaving a field nothing reads costs nothing.

## Testing

Point 6 is the only item with logic in it, so it is the only one that gets a unit
test, per the scope rule in `coding-standards.md`. The rest is visual and rides on
the browser.

The user asked for a faster loop: **no per-step check, test, or build.** All three
run once at the end of step 3, before `/complete`.

## Verify

| Item | How |
| --- | --- |
| 1 | `/treatments/mounjaro`: photo edge to edge inside the white border, caption legible on it, chips still in the corners |
| 2 | Any page: header has no white bar, the warm ground runs behind it |
| 3 | `/#experts`: three cards, no "Mehr erfahren" |
| 4 | Devtools: a default button is 56px tall |
| 5 | Landing results band: icons read against both lines |
| 6 | German browser → `/` German. English browser → `/` redirects to `/en`. Then click through header, footer and a treatment link; the language holds. Open `/en/learn` with a German browser: it stays English |
| 7 | Nothing to verify in code. In the Studio, decide what happens to the emptied German draft |

Then `pnpm check`, `pnpm test`, `pnpm build`, and `pnpm test:browser` for the
locale change, which is the one that can break a route. All four ran green:
491 unit tests, 199 browser tests, no type errors.
