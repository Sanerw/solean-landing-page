import { expect, test } from '@playwright/test';

/**
 * The four documents Solean publishes, reached the way a visitor reaches them. What is
 * asserted is that each route exists, carries its own document, and is linked from the
 * footer: the text itself is copied data, checked against the source when it was imported
 * rather than pinned here, where a lawful edit upstream would read as a test failure.
 */
const DOCUMENTS = [
	{ label: 'Impressum', href: '/legal-notice', heading: 'Impressum' },
	{ label: 'Datenschutz', href: '/privacy', heading: 'Datenschutzerklärung' },
	{ label: 'AGB', href: '/terms', heading: 'AGB' },
	{ label: 'Widerruf', href: '/returns', heading: 'Widerrufsrecht' }
] as const;

for (const doc of DOCUMENTS) {
	test(`${doc.href} serves ${doc.heading}`, async ({ page }) => {
		const response = await page.goto(doc.href);

		expect(response?.status()).toBe(200);
		await expect(page.getByRole('heading', { level: 1, name: doc.heading })).toBeVisible();

		// A heading with nothing under it would be a page that exists and says nothing.
		const body = page.locator('article');
		await expect(body).toHaveAttribute('lang', 'de');
		expect((await body.innerText()).length).toBeGreaterThan(500);
	});

	test(`the footer links to ${doc.heading}`, async ({ page }) => {
		await page.goto('/');

		const link = page.locator('footer').getByRole('link', { name: doc.label, exact: true });
		await expect(link).toHaveAttribute('href', doc.href);

		await link.click();
		await expect(page).toHaveURL(doc.href);
		await expect(page.getByRole('heading', { level: 1, name: doc.heading })).toBeVisible();
	});
}

test('the footer carries the real support details', async ({ page }) => {
	await page.goto('/');
	const footer = page.locator('footer');

	await expect(footer.getByRole('link', { name: /support@solean\.com/ })).toHaveAttribute(
		'href',
		'mailto:support@solean.com'
	);
	await expect(footer.getByRole('link', { name: /\+49 40 87709420/ })).toHaveAttribute(
		'href',
		'tel:+494087709420'
	);
});

// The label was there with no document behind it; removing the document's placeholder is the
// point of the change, so its absence is worth holding onto.
test('no accessibility statement is advertised, because there is none', async ({ page }) => {
	await page.goto('/');

	await expect(page.locator('footer').getByText('Accessibility')).toHaveCount(0);
	await expect(page.locator('footer').getByText('Barrierefreiheit')).toHaveCount(0);
});
