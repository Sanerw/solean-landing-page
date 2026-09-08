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

/**
 * The article's hero, which replaced the breadcrumb with two pills in 26a. The copy is Sanity's
 * and is not asserted here; the wiring between the Journal and the article is this repository's.
 */
test('the hero leads back to the Journal in the reader own language', async ({ page }) => {
	await page.goto('/en/learn/blog/mounjaro-vs-wegovy');

	const back = page.getByRole('link', { name: 'Back to journal' });
	await expect(back).toHaveAttribute('href', '/en/learn');

	await back.click();
	await expect(page).toHaveURL('/en/learn');

	// The bare path is German, and a localised href is what keeps a German reader out of the
	// English Journal.
	await page.goto('/learn/blog/mounjaro-vs-wegovy');
	await expect(page.getByRole('link', { name: 'Zurück zum Journal' })).toHaveAttribute(
		'href',
		'/learn'
	);
});

/**
 * One article is the state the site is in, so it is both the newest and the oldest and has no
 * neighbours at all. The pill is not drawn rather than drawn dead, the same rule the articles
 * band follows on the Journal itself.
 */
test('a library of one draws no next-article pill', async ({ page }) => {
	await page.goto('/en/learn/blog/mounjaro-vs-wegovy');

	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Next article' })).toHaveCount(0);
});

test('the article fits the narrow frame', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/en/learn/blog/mounjaro-vs-wegovy');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

	const widths = await page.evaluate(() => ({
		client: document.documentElement.clientWidth,
		scroll: document.documentElement.scrollWidth
	}));
	expect(widths.scroll).toBe(widths.client);
});

/**
 * The body, rebuilt to the September artboards in 26b. The article's copy is Sanity's and is
 * not asserted here; the layout and the behaviour are this repository's.
 */
test('the contents list sits beside the reading column, and not at all on a phone', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/en/learn/blog/mounjaro-vs-wegovy');

	const contents = page.getByRole('navigation', { name: 'On this page' });
	const heading = page.getByRole('heading', { name: 'Quick answer' });
	await expect(contents).toBeVisible();

	// Beside, not above: the artboard sets the list against the column rather than over it.
	const list = (await contents.boundingBox())!;
	const column = (await heading.boundingBox())!;
	expect(list.x + list.width).toBeLessThanOrEqual(column.x);

	// The narrow artboard has no contents list at all: eight anchors between the reader and the
	// first sentence is not a phone layout.
	await page.setViewportSize({ width: 390, height: 844 });
	await expect(contents).toBeHidden();
	await expect(heading).toBeVisible();
});

test('every contents link points at a section the page actually has', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/en/learn/blog/mounjaro-vs-wegovy');

	const hrefs = await page
		.getByRole('navigation', { name: 'On this page' })
		.getByRole('link')
		.evaluateAll((links) => links.map((link) => link.getAttribute('href')));

	expect(hrefs.length).toBeGreaterThan(0);
	for (const href of hrefs) {
		expect(href).toMatch(/^#/);
		await expect(page.locator(href!)).toHaveCount(1);
	}
});

test('the FAQ starts closed and opens one question at a time', async ({ page }) => {
	await page.goto('/en/learn/blog/mounjaro-vs-wegovy');

	// Scoped by the section rather than by `#faqs`: from feature 26c the anchor is derived from
	// the heading an editor typed, so an id spelled out here is one rename away from matching
	// nothing and passing against an empty set.
	const questions = page
		.locator('section', { has: page.getByRole('heading', { name: 'Frequently asked questions' }) })
		.locator('[data-slot="accordion-trigger"]');
	await expect(questions.first()).toHaveAttribute('aria-expanded', 'false');

	await questions.first().click();
	await expect(questions.first()).toHaveAttribute('aria-expanded', 'true');

	// One accordion, not four disclosures: opening the second closes the first.
	await questions.nth(1).click();
	await expect(questions.nth(1)).toHaveAttribute('aria-expanded', 'true');
	await expect(questions.first()).toHaveAttribute('aria-expanded', 'false');
});

/**
 * One article is both the newest and the oldest, so it has no neighbours and the band is not
 * drawn. The rendered case cannot be proven here: the fixture is generated from the real
 * dataset by `scripts/generate-sanity-fixture.mjs`, so a second article added by hand would be
 * dropped the next time it runs. `neighboursOf` carries that side in `journal.test.ts`.
 */
test('a library of one draws no neighbours band', async ({ page }) => {
	await page.goto('/en/learn/blog/mounjaro-vs-wegovy');

	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
	await expect(page.getByRole('navigation', { name: 'More from the Journal' })).toHaveCount(0);
});
