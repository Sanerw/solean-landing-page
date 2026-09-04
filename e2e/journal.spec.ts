/**
 * The Journal at `/learn`. Before this page existed both `/learn` and `/learn/blog` were
 * redirects into the newest article, so the site had no index at all and a second article had
 * nowhere to appear. These assertions are mostly about that: the page exists, it is one page in
 * both languages, and the way in is a single link to the article.
 *
 * The article's own copy comes from Sanity and is not asserted here. What is asserted is the
 * chrome the repository owns and the wiring between the two.
 */
import { expect, test } from '@playwright/test';

test('the Journal renders in both languages and opens the article', async ({ page }) => {
	await page.goto('/en/learn');

	await expect(page.getByRole('heading', { level: 1 })).toHaveText(
		'Clear guidance for a healthier you.'
	);
	await expect(page.getByText('The Solean Journal')).toBeVisible();

	// One link over the whole card, so the title, summary and arrow are one tab stop rather
	// than three to the same place. Its name has to say which article it opens.
	const featured = page.locator('section[aria-labelledby="journal-heading"] a');
	await expect(featured).toHaveCount(1);
	await expect(featured).toHaveAttribute('href', '/en/learn/blog/mounjaro-vs-wegovy');
	expect(await featured.getAttribute('aria-label')).toMatch(/^Read .+/);

	await featured.click();
	await expect(page).toHaveURL('/en/learn/blog/mounjaro-vs-wegovy');

	// The bare path is German, and the localised href is what keeps a German reader out of the
	// English article.
	await page.goto('/learn');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(
		'Klare Orientierung für ein gesünderes Leben.'
	);
	await expect(page.locator('section[aria-labelledby="journal-heading"] a')).toHaveAttribute(
		'href',
		'/learn/blog/mounjaro-vs-wegovy'
	);
});

/**
 * One article is the state the site is in, and the band below the featured card is the rest of
 * the library. With no rest, none of it may be drawn: a heading promising more, chips filtering
 * a single item, or an empty grid would each be the page lying about how much there is to read.
 * The two-article case is covered by `journal.test.ts`, which can vary the list; this fixture
 * carries one article by construction.
 */
test('one article draws no articles band', async ({ page }) => {
	await page.goto('/en/learn');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

	// Scoped to the band. A bare `getByRole('list')` would be counting the navigation and the
	// footer, which have lists of their own and always will.
	await expect(page.locator('section[aria-labelledby="journal-articles-heading"]')).toHaveCount(0);
	await expect(page.getByRole('heading', { name: 'Articles & resources' })).toHaveCount(0);
	await expect(page.getByRole('group', { name: 'Filter articles by category' })).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'All guides' })).toHaveCount(0);
});

test('/learn/blog is the Journal, not an article', async ({ page }) => {
	await page.goto('/learn/blog');
	await expect(page).toHaveURL('/learn');

	await page.goto('/en/learn/blog');
	await expect(page).toHaveURL('/en/learn');
});

test('the Journal fits the narrow frame', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/en/learn');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

	const widths = await page.evaluate(() => ({
		client: document.documentElement.clientWidth,
		scroll: document.documentElement.scrollWidth
	}));
	expect(widths.scroll).toBe(widths.client);
});
