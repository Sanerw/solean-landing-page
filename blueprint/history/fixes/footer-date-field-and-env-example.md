# Footer, date field and env-example corrections

**Type:** Fix
**Status:** verified

## The problem

Four small defects, none of them behavioural, found while reviewing the live page.

| # | Where | What is wrong |
| --- | --- | --- |
| 1 | `src/lib/assets/logos/dhl.png` | The file is 376x128 with the DHL lockup shrunk into the middle of a large yellow field. Rendered at `h-6 w-auto` the footer shows a yellow rectangle with unreadable red text instead of a carrier logo. |
| 2 | `src/lib/features/marketing/SiteFooter.svelte` | The language select sits in a bare `<div class="lg:col-span-2">` and its trigger is `w-fit` (`LanguageSelect.svelte`, `variant="field"`), so the control clings to the left edge of its column and leaves a gap against the container's right edge. The tagline and the social row beside it are flush right. |
| 3 | `src/lib/features/questionnaire/fields/DateField.svelte` | `class="max-w-xs"` caps the picker at 20rem at every width, so on a phone the date of birth field is visibly narrower than the Continue button under it. It is the only question field carrying a width cap. |
| 4 | `.env.example` | Lines 31 and 47 document `SHOPIFY_STORE_DOMAIN`, but `src/lib/server/shopify/cart.ts:232` reads `PUBLIC_SHOPIFY_STORE_DOMAIN`. Anyone following the example sets a variable nothing reads, and the order button then reports that the deployment cannot order. The comment above it also calls the group "Server-only", which stopped being true for this one variable when it took the `PUBLIC_` prefix. |

## The fix

1. Replace the asset with Solean's own DHL lockup, taken from the live site
   (`https://solean.com/cdn/shop/t/52/assets/dhl-logo.png`, 279x60, no padding).
   Keep the filename, so the import in `content.ts` is untouched.
2. Right-align the language select from `lg` up, where the twelve-column track
   exists. Narrower widths keep their current stacking, so nothing moves on a
   phone.
3. Make the date field full width and restore the cap from `sm` up, so the
   desktop keeps the layout it has today.
4. Correct both occurrences of the variable name and the one comment that
   describes the group's visibility.

Must not break:

- The footer's twelve-column proportions at `lg`, and its `sm:grid-cols-2`
  stacking below that.
- The date field's own behaviour: typing, the calendar, the 18-to-80 range, and
  the `YYYY-MM-DD` value it stores.
- The other four question fields, which carry no width cap and must not gain one.

## Build steps

### Step 1 - the footer  - [x]

- Replace `src/lib/assets/logos/dhl.png` with the unpadded lockup.
- Add right alignment to the language select's column wrapper from `lg` up.

**Done when:** at 1280px the DHL logo reads as the DHL lockup rather than a
yellow block, and the language select's right edge lines up with the tagline and
the social buttons above and below it. At 375px and 768px the footer is
unchanged.

### Step 2 - the date field and the env example  - [x]

- `DateField.svelte`: `w-full sm:max-w-xs` in place of `max-w-xs`.
- `.env.example`: `PUBLIC_SHOPIFY_STORE_DOMAIN` in both places, and the comment
  amended to say which of the group is public.

**Done when:** at 375px the date of birth field spans the same width as the
Continue button below it; at 1280px it keeps its current width. `.env.example`
names only variables the code actually reads.

## Verify

No logic changes here, so the test gate does not apply: this is UI and
documentation, verified in the browser and by the build, per the Testing section
of `coding-standards.md`.

- `pnpm build` passes.
- `pnpm check` passes.
- `pnpm test` stays green (unrelated, but must not regress).
- `pnpm test:browser` stays green. No spec asserts the footer logos, the language
  select, or the date field's width, so nothing here is expected to move; a
  failure would mean the change reached further than intended.
- In the browser: the landing page footer at 1280px and at 375px, and
  `/questionnaire` at the date of birth step at 375px and 1280px.
- `grep -c SHOPIFY_STORE_DOMAIN .env.example` returns nothing but the public name.
