import type { Page } from '@playwright/test';

/** Paraglide's own name, `cookieName` in `src/lib/paraglide/runtime`. */
const LOCALE_COOKIE = 'PARAGLIDE_LOCALE';

/**
 * Turns the context back into somebody who has not been served a page yet.
 *
 * The site remembers the language it last served, in the cookie `setLocale` writes, and an
 * address without a prefix is answered in that language rather than in German. So a spec that
 * reads the English site and then asks for a bare path is no longer describing a German
 * visitor: it is describing an English one following a link somebody wrote without a prefix,
 * which is sent to `/en` on purpose. Forgetting the language is how the German half of such a
 * test gets the arrival it means.
 */
export async function forgetLanguage(page: Page): Promise<void> {
	await page.context().clearCookies({ name: LOCALE_COOKIE });
}
