import { expect, test } from '@playwright/test';

/**
 * Locale routing, which is global: a mistake in the reroute hook breaks every navigation on
 * the site at once. What is asserted is the mechanism, not the wording, apart from one string
 * per language that proves the catalogues are actually being read.
 */

test('the bare path is German and /en is English', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('html')).toHaveAttribute('lang', 'de');

	await page.goto('/en');
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

// German lived at `/de/...` while the catalogues were filled. Both addresses still resolve
// unless the old one is redirected, which would leave the same page at two URLs.
test('the old German prefix redirects rather than duplicating the page', async ({ page }) => {
	const response = await page.goto('/de/privacy');

	expect(response?.status()).toBe(200);
	await expect(page).toHaveURL('/privacy');
	await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});

// Every route family, because the reroute hook is what makes the prefix work and it is easy
// to get right for one shape of path and wrong for another.
for (const path of ['/', '/learn/blog/mounjaro-vs-wegovy', '/privacy', '/questionnaire']) {
	test(`${path} is reachable under both locales`, async ({ page }) => {
		const german = await page.goto(path);
		expect(german?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'de');

		const english = await page.goto(`/en${path === '/' ? '' : path}`);
		expect(english?.status()).toBe(200);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	});
}

test('the default language is German end to end', async ({ page }) => {
	await page.goto('/');

	await expect(page.locator('footer').getByText('Kontaktiere unser Care-Team')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Start', exact: true }).first()).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Häufige Fragen.' })).toBeVisible();

	// The legal pages used to serve the German text under both locales, because there was only
	// one. Each now has its own document, so the bare path is the German one.
	await page.goto('/privacy');
	await expect(page.getByRole('heading', { level: 1, name: 'Datenschutzerklärung' })).toBeVisible();
});

test('English is complete under its prefix', async ({ page }) => {
	await page.goto('/en');

	await expect(page.locator('footer').getByText('Contact our care team')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Frequently asked questions.' })).toBeVisible();

	// The last German-only surface. `legal-pages.spec.ts` covers all four in both languages;
	// what this asserts is that the locale sweep no longer has an exception in it.
	await page.goto('/en/privacy');
	await expect(page.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeVisible();
});

// The control names itself in the language it is currently showing, so the second half of the
// round trip has to look for the German name. Matching both is the assertion, not a
// workaround: a switcher that stayed English on a German page would be the bug.
const LANGUAGE_CONTROL = /^(Language|Sprache)$/;

test('the switcher moves between locales without losing the page', async ({ page }) => {
	await page.goto('/learn/blog/mounjaro-vs-wegovy');

	await page.getByLabel(LANGUAGE_CONTROL).first().click();
	await page.getByRole('option', { name: 'English' }).click();
	await expect(page).toHaveURL('/en/learn/blog/mounjaro-vs-wegovy');
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await expect(page.getByLabel('Language').first()).toBeVisible();

	await page.getByLabel(LANGUAGE_CONTROL).first().click();
	await page.getByRole('option', { name: 'Deutsch' }).click();
	await expect(page).toHaveURL('/learn/blog/mounjaro-vs-wegovy');
	await expect(page.locator('html')).toHaveAttribute('lang', 'de');
	await expect(page.getByLabel('Sprache').first()).toBeVisible();
});

// The alternates moved to `seo.spec.ts` with feature 28a: they are absolute now, and built
// from the published inventory rather than guessed from the path, so what they claim is an
// SEO question rather than a routing one. The redirect-free root is asserted there too.

/**
 * The rule this fix added, in a browser rather than in a unit test: an address that names no
 * language is answered from the visitor rather than from `baseLocale` alone. The unit tests in
 * `src/lib/i18n/locale-resolution.test.ts` cover the table; these two cover the wiring, which
 * is a server hook, a 307 and a cookie the client writes.
 */
test.describe('a browser that asks for English', () => {
	test.use({ locale: 'en-GB' });

	test('is met in English at an address that names none', async ({ page }) => {
		const response = await page.goto('/');

		expect(response?.status()).toBe(200);
		await expect(page).toHaveURL('/en');
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	});

	// German is the bare path, so it is the one language a link cannot pin: the old prefix moves
	// to the unprefixed address, which is then answered from the visitor like any other. The
	// prefix that can be pinned is `/en`, and the test above proves a German browser keeps it.
	test('is carried on to English by way of the old German prefix', async ({ page }) => {
		await page.goto('/de/privacy');

		await expect(page).toHaveURL('/en/privacy');
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	});
});

// The bug this fix closes, end to end: the choice used to be written and never read, so a link
// without a prefix served German to somebody reading the site in English.
test('the chosen language outranks the browser, and follows an unprefixed link', async ({
	page
}) => {
	await page.goto('/learn/blog/mounjaro-vs-wegovy');

	await page.getByLabel(LANGUAGE_CONTROL).first().click();
	await page.getByRole('option', { name: 'English' }).click();
	await expect(page).toHaveURL('/en/learn/blog/mounjaro-vs-wegovy');

	await page.goto('/learn');
	await expect(page).toHaveURL('/en/learn');
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});
