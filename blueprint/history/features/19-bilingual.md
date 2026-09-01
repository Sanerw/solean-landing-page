# Feature: 19 - German and English, in one pass

**From build-plan:** feature 19 (19a to 19e, built together)
**Status:** verified

## Goal

Make the site able to serve two languages at all, and prove it on the chrome that
appears on every page: the announcement bar, the header navigation, the footer
and the language switcher.

Nothing is bilingual today. `LANGUAGES` in `content.ts:79-84` lists German with
`available: false` and a comment calling that a scope boundary rather than a
decision, and `app.html` hardcodes `lang="en"`. This sub-feature removes both.

## The decisions this is built on

Taken with the user on 2026-09-01, and recorded because they shape everything
after:

| | |
| --- | --- |
| Languages | German and English |
| End state | German at `/`, English at `/en` |
| **This feature** | builds the whole of it, then flips at the end |
| The funnel | stays German in both languages, and **no warning screen** |

**Why the flip is last.** The end state cannot be built first. If `/` starts
serving German before every surface has German messages, the site's main address
renders a half-translated page. So German lives at `/de` while the catalogues
fill, and the flip is the final step.

**Scope changed after 19a was built.** The plan split feature 19 into five
sub-features, each with its own branch and merge. After seeing 19a land with only
the chrome translated, the user chose to finish all five on one branch and merge
once. The build steps below are the five sub-features as steps; the build plan
keeps its sub-items and `/complete` checks them off together.

## In scope

- `@inlang/paraglide-js` 2.25.0 and its Vite plugin. Peer requirements are
  Vite >= 5 and TypeScript >= 5.6; this project runs Vite 8.2.2 and TS 6.0.3.
- Locale routing through Paraglide's own server middleware and a `reroute` hook,
  **not** a `[[locale]]` route parameter. See the amendment below.
- `<html lang>` following the active locale, and `hreflang` alternates.
- `LanguageSelect` becoming a real control: it switches locale and navigates,
  instead of binding a value nothing reads.
- The chrome messages in both languages: the announcement bar, `NAV_ITEMS`, the
  footer columns, the contact block, and the footer's legal row.

## Out of scope

- Nothing that was 19b to 19e. They are steps 5 to 8 below.
- **Translating the legal documents.** They are German in both locales, because
  they *are* the German legal texts. Both locales link to the same four routes.
- The questionnaire's questions, which are RxScale's and arrive German.

## Data / contracts

**Load-bearing, because 19b to 19e all build on it.**

- Locale codes are `de` and `en`. `de` is the eventual default; until 19e the
  runtime default stays `en` so the bare path keeps serving what it serves today.
- Messages live in `messages/{de,en}.json`, keyed in `snake_case` by surface then
  meaning: `footer_contact_title`, `nav_treatments`. A key names what the string
  is for, never what it says, so a copy change is not a key change.
- **Routes do not move.** Paraglide's middleware de-localises the URL before
  SvelteKit routes it, so `/de/learn/x` and `/learn/x` both resolve to the same
  `src/routes/(marketing)/learn/...`. A missing prefix means the default locale.
- `localizeHref` and `deLocalizeHref` from the generated runtime are the only
  ways a locale-prefixed URL is built or stripped. Nothing hand-assembles
  `/de/...`, and this project writes no wrapper of its own around them.

## Build steps

- [x] **Step 1 - the runtime, with nothing using it yet** - install Paraglide,
  wire its Vite plugin, create the two catalogues with a single message, and
  confirm the generated module imports and typechecks. No routes move.
  *Done when:* `pnpm build` passes, the generated runtime resolves, and calling
  the sample message in a scratch component returns English by default and German
  under a forced locale.

- [x] **Step 2 - locale routing** - add `hooks.server.ts` running
  `paraglideMiddleware`, a universal `reroute` hook using `deLocalizeUrl` for
  client-side navigation, `<html lang>` from the resolved locale, and the
  `hreflang` alternates. No route moves and no message is translated yet, so both
  paths render the same English text.
  *Done when:* `/` and `/de` both return 200 and render the landing page, the
  `lang` attribute is `en` and `de` respectively, each page carries `hreflang`
  alternates for both, and every existing browser test still passes.

- [x] **Step 3 - the language switcher** - `LanguageSelect` switches locale and
  navigates to the same page in the other language, in the header and the footer.
  German stops being `available: false`.
  *Done when:* choosing German on `/learn/blog/mounjaro-vs-wegovy` lands on
  `/de/learn/blog/mounjaro-vs-wegovy`, and choosing English goes back, with the
  control showing the active locale in both places.

- [x] **Step 4 - the chrome messages** - extract the announcement bar, the
  navigation, the footer columns, the contact block and the legal row into the
  catalogues, and write the German.
  *Done when:* `/de` shows German chrome around English page bodies, `/` is
  unchanged from today in every respect, and the German is checked against the
  wording solean.com uses for the same items where one exists.

- [x] **Step 5 (19b) - the landing page** - every string in
  `src/lib/features/marketing/content.ts` that is not chrome: the hero, the trust
  band, the bento, the results band, the projection, the testimonials, the
  clinical team, how-it-works, the FAQ and the article teaser. Roughly 220
  messages.
  *Done when:* `/de` renders no English on the landing page apart from brand and
  product names, and `/` is unchanged.

- [x] **Step 6 (19c) - the Learn article** - `src/lib/features/learn/content.ts`,
  its table of contents, comparison table, sources and related guides.
  *Done when:* `/de/learn/blog/mounjaro-vs-wegovy` renders in German end to end,
  including the table of contents anchors, and `/learn/...` is unchanged.

- [x] **Step 7 (19d) - the questionnaire chrome** - the shell, the progress label,
  the buttons, the interludes, the building screen and the recommendation screen.
  **The questions themselves are RxScale's and are already German**, so this step
  makes the English chrome stop contradicting them.
  *Done when:* the funnel's own words are German under `/de`, the two completion
  screens included, and the browser suite still walks the flow.

- [x] **Step 8 (19e) - the flip** - `baseLocale` becomes `de`, so German is served
  at `/` and English moves to `/en`. Redirects from the interim `/de/*` to `/*`.
  *Done when:* `/` is German, `/en` is English, `/de/x` redirects to `/x`, every
  `hreflang` names the new shape, and the browser suite passes with its paths
  updated to the new default.

## Files / areas

- `vite.config.ts`, `package.json`
- `messages/de.json`, `messages/en.json`, and Paraglide's generated output
- `src/app.html`, `src/hooks.server.ts`, `src/hooks.ts`
- `src/lib/features/marketing/{content.ts,AnnouncementBar,SiteHeader,SiteFooter,LanguageSelect}.svelte`

## Testing

`pnpm test` is declared, so the gate is on. **The amendment removed this
sub-feature's only in-scope logic.** `localeHref` was going to be ours to write
and therefore ours to test; `localizeHref` is Paraglide's, already tested by
them, and wrapping it only to have something to unit-test would be inventing work
to satisfy a gate. If a later step surfaces real logic of our own, it ships a
test then.

`pnpm test:browser` is declared, and locale routing is a stable behavioural claim
worth covering:

- `/` and `/de` both render, with the right `lang` attribute
- the switcher round-trips on a deep route without losing the page
- `hreflang` alternates name both locales
- every existing spec still passes, since all their paths moved under `[[locale]]`

Translation quality is not something a test can assert. The German is checked by
eye against solean.com's own wording for the same items, and the user reads it
before 19e makes it the default.

## Notes for the AI

- The route-moving risk is gone with the amendment, but the `reroute` hook is
  global: a mistake there breaks every navigation on the site at once, so the
  browser suite is the gate that matters here.
- The four legal routes serve German in both locales. Do not create English
  stubs for documents that do not exist in English.
- `content.ts` is 610 lines and mostly not this sub-feature's business. Touch
  only the chrome exports; leave the landing page's own content alone for 19b.
- The user's medical marketing copy is mock content, and its German will be
  machine translation reviewed by nobody yet. Say so at review; do not let it
  reach the default locale before someone reads it.

## Amendment, made during step 2

The spec planned to move every route under `[[locale]]`. **That was wrong, and
building it would have been a large avoidable change.** Paraglide's
`paraglideMiddleware` calls `deLocalizeUrl` and hands the framework a request
whose URL carries no locale prefix (`src/lib/paraglide/server.js:153`), so
SvelteKit routes `/de/learn/x` to the existing `learn` route unchanged.

What this avoids: duplicating the route tree, adding a `[[locale]]` param to
every load function, and rewriting every path in `e2e/`. What it costs: the
locale is resolved in a hook rather than in the URL SvelteKit itself sees, so
anything needing the active locale reads it from the runtime rather than from
route params.
