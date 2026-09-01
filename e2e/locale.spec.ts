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

	// German in both locales, because they are the German legal texts rather than a translation.
	await page.goto('/en/privacy');
	await expect(page.getByRole('heading', { level: 1, name: 'Datenschutzerklärung' })).toBeVisible();
});

test('English is complete under its prefix', async ({ page }) => {
	await page.goto('/en');

	await expect(page.locator('footer').getByText('Contact our care team')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Frequently asked questions.' })).toBeVisible();
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

test('every page offers both locales to a search engine, and none of the links redirect', async ({
	page
}) => {
	await page.goto('/en/privacy');

	const alternates = page.locator('link[rel="alternate"]');
	await expect(alternates).toHaveCount(3);
	await expect(page.locator('link[hreflang="de"]')).toHaveAttribute('href', '/privacy');
	await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', '/en/privacy');

	// The root is the case a trailing slash used to spoil, which answered 308.
	await page.goto('/');
	await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', '/en');
});
