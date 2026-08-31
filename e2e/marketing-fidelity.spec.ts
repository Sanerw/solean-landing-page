import { expect, test } from '@playwright/test';

test('the announcement and reference hero asset render without narrow-screen overflow', async ({
	page
}) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/');

	await expect(page.getByLabel('Welcome offer')).toContainText(
		'Welcome offer. Save €10 on your first online consultation'
	);

	const heroImage = page.locator('section[aria-labelledby="hero-heading"] img').first();
	await expect(heroImage).toBeVisible();
	await expect
		.poll(() => heroImage.evaluate((image: HTMLImageElement) => [image.naturalWidth, image.naturalHeight]))
		.toEqual([1376, 768]);

	const reviewsLink = page.getByRole('link', { name: /Read reviews on Reviews\.io/ });
	await expect(reviewsLink).toHaveAttribute(
		'href',
		'https://www.reviews.io/company-reviews/store/www.solean.com'
	);
	await expect(reviewsLink).toHaveAttribute('target', '_blank');

	const widths = await page.evaluate(() => ({
		client: document.documentElement.clientWidth,
		scroll: document.documentElement.scrollWidth
	}));
	expect(widths.scroll).toBe(widths.client);
});

test('keeps the Learn teaser compact and uses the reference divider', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 768 });
	await page.goto('/');

	const teaser = page.getByTestId('hero-article-teaser');
	await expect(teaser).toBeVisible();
	await expect(teaser.getByText('Latest from Learn')).toHaveCSS('font-size', '10px');
	await expect(teaser.getByText('Mounjaro vs Wegovy.')).toHaveCSS('font-size', '18px');

	const divider = teaser.locator('div[aria-hidden="true"]');
	await expect(divider).toHaveCSS('width', '42px');
	await expect(divider).toHaveCSS('height', '2px');

	const desktopBox = await teaser.boundingBox();
	expect(desktopBox?.width).toBeLessThanOrEqual(320);

	await page.setViewportSize({ width: 375, height: 812 });
	const mobileBox = await teaser.boundingBox();
	expect(mobileBox).not.toBeNull();
	expect((mobileBox?.x ?? 0) + (mobileBox?.width ?? 0)).toBeLessThanOrEqual(375);
});

test('matches the desktop Treatments menu geometry and keyboard behaviour', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');

	const logo = page.getByLabel('Solean, home').locator('svg');
	await expect(logo).toHaveCSS('height', '60px');
	await expect(logo).toHaveCSS('width', '166px');

	const trigger = page.getByRole('button', { name: 'Treatments' });
	await expect(trigger).toHaveCSS('font-size', '14px');
	await trigger.focus();
	await page.keyboard.press('Enter');

	const menu = page.locator('[data-slot="navigation-menu-content"]');
	await expect(menu).toBeVisible();
	await expect(menu).toHaveCSS('width', '314px');
	await expect(menu.getByText('Mounjaro Injection')).toBeVisible();
	await expect(menu.getByText('Wegovy Injection')).toBeVisible();
	await expect(menu.getByText('Wegovy Pill')).toBeVisible();

	const rows = menu.locator('[data-slot="navigation-menu-link"]');
	await expect(rows).toHaveCount(3);

	await page.keyboard.press('Escape');
	await expect(menu).toBeHidden();
	await expect(trigger).toBeFocused();

	await page.setViewportSize({ width: 1200, height: 800 });
	const headerLayout = await page.evaluate(() => {
		const nav = document.querySelector('[data-slot="navigation-menu"]')?.getBoundingClientRect();
		const logo = document.querySelector('a[aria-label="Solean, home"]')?.getBoundingClientRect();
		const actions = document.querySelector('header > div > div:last-child')?.getBoundingClientRect();
		return {
			logoCenter: logo ? logo.left + logo.width / 2 : null,
			navRight: nav?.right ?? null,
			logoLeft: logo?.left ?? null,
			logoRight: logo?.right ?? null,
			actionsLeft: actions?.left ?? null
		};
	});
	expect(headerLayout.logoCenter).toBeCloseTo(600, 0);
	expect(headerLayout.navRight).toBeLessThanOrEqual(headerLayout.logoLeft ?? 0);
	expect(headerLayout.logoRight).toBeLessThanOrEqual(headerLayout.actionsLeft ?? 0);

	await page.goto('/dev/design-system#navigation-menu');
	await expect(page.getByRole('heading', { name: 'NavigationMenu' })).toBeVisible();
	// Two showcase variants plus the design-system page's own solid SiteHeader.
	await expect(page.getByRole('button', { name: 'Treatments' })).toHaveCount(3);
});

test('keeps the bento hierarchy compact and aligned', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 1000 });
	await page.goto('/');

	const section = page.getByLabel('What Solean gives you');
	const cards = section.locator('article');
	await expect(cards).toHaveCount(5);

	await expect(cards.nth(0).getByRole('heading')).toHaveCSS('font-size', '30px');
	await expect(cards.nth(1).getByRole('heading')).toHaveCSS('font-size', '18px');
	await expect(cards.nth(0).locator('p').nth(1)).toHaveCSS('font-size', '14px');
	await expect(cards.nth(1).locator('p').nth(1)).toHaveCSS('font-size', '12px');

	const layout = await cards.evaluateAll((elements) => {
		const rect = (element: Element) => {
			const box = element.getBoundingClientRect();
			return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
		};

		return elements.map((card) => {
			const cardBox = rect(card);
			const bodyBox = rect(card.querySelector('p:nth-of-type(2)')!);
			const imageBox = rect(card.querySelector('img')!);
			return {
				...cardBox,
				bodyImageGap: imageBox.top - bodyBox.bottom,
				bottomInset: cardBox.bottom - imageBox.bottom
			};
		});
	});

	expect(layout[1].left - layout[0].right).toBeCloseTo(20, 0);
	expect(layout[2].left - layout[1].right).toBeCloseTo(20, 0);
	expect(layout[3].top - layout[1].bottom).toBeCloseTo(20, 0);
	expect(layout[0].bottom).toBeCloseTo(layout[3].bottom, 0);
	expect(layout[0].bottom).toBeCloseTo(layout[4].bottom, 0);
	for (const card of layout.slice(1)) {
		expect(card.bodyImageGap).toBeGreaterThanOrEqual(8);
		expect(card.bottomInset).toBeCloseTo(20, 0);
	}

	await page.setViewportSize({ width: 375, height: 812 });
	const widths = await page.evaluate(() => ({
		client: document.documentElement.clientWidth,
		scroll: document.documentElement.scrollWidth
	}));
	expect(widths.scroll).toBe(widths.client);
});

test('dissolves the care artwork into the band and restores the review column', async ({
	page
}) => {
	await page.setViewportSize({ width: 1920, height: 1000 });
	await page.goto('/');

	const band = page.getByLabel('Care built in');
	const visual = band.locator('img').first();
	await expect
		.poll(() => visual.evaluate((image: HTMLImageElement) => [image.naturalWidth, image.naturalHeight]))
		.toEqual([1320, 1164]);
	await expect(visual).toHaveCSS('mix-blend-mode', 'multiply');

	// The colour wash plus one blend per edge, which is what makes the artwork unboxed.
	const overlays = visual.locator('~ div[aria-hidden="true"]');
	await expect(overlays).toHaveCount(5);

	const columns = await band.evaluate((section) => {
		const panel = section.firstElementChild as HTMLElement;
		const row = section.querySelectorAll('.grid')[1] as HTMLElement;
		const cells = [...row.children].map((cell) => cell.getBoundingClientRect().width);
		return {
			panelHeight: panel.getBoundingClientRect().height,
			panelWidth: panel.getBoundingClientRect().width,
			cells,
			imageBottom: section.querySelector('img')!.getBoundingClientRect().bottom,
			panelBottom: panel.getBoundingClientRect().bottom
		};
	});

	// 3:4:3 is the reference's 520:660:520 allocation, and the artwork runs to the panel edge.
	expect(columns.cells[1] / columns.cells[0]).toBeCloseTo(4 / 3, 1);
	expect(columns.cells[2]).toBeCloseTo(columns.cells[0], 0);
	expect(columns.imageBottom).toBeCloseTo(columns.panelBottom, 0);
	// The reference panel is 1896 x 740 at this width.
	expect(columns.panelHeight / columns.panelWidth).toBeCloseTo(740 / 1896, 1);

	const stars = band.getByRole('img', { name: '4.7 out of 5 stars' });
	await expect(stars).toBeVisible();
	await expect(stars.locator('svg')).toHaveCount(5);
	await expect(stars.locator('svg').first()).toHaveCSS('fill', 'none');

	await expect(band.getByText('1,200+ reviews')).toBeVisible();
	await expect(band.getByText('Verified Solean member')).toBeVisible();

	const divider = band.locator('div[aria-hidden="true"]').last();
	await expect(divider).toHaveCSS('width', '48px');
	await expect(divider).toHaveCSS('height', '2px');

	// Focusable so it is discoverable, but wired to nothing until a platform exists.
	const review = band.getByRole('button', { name: 'Leave a review' });
	await expect(review).toHaveAttribute('aria-disabled', 'true');
	await band.getByRole('link', { name: 'Check your eligibility' }).focus();
	await page.keyboard.press('Tab');
	await expect(review).toBeFocused();
	expect(await review.evaluate((element) => element.matches(':focus-visible'))).toBe(true);

	await page.setViewportSize({ width: 375, height: 812 });
	const order = await band.evaluate((section) => {
		const top = (selector: string) => section.querySelector(selector)!.getBoundingClientRect().top;
		return { heading: top('h2'), image: top('img'), quote: top('blockquote') };
	});
	expect(order.heading).toBeLessThan(order.image);
	expect(order.image).toBeLessThan(order.quote);
});
