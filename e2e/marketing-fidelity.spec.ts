/**
 * Visual fidelity against the artboards in `blueprint/reference/`, which are English. This
 * spec therefore walks `/en`: asserting German copy and German-length text boxes against an
 * English reference would be measuring the wrong page.
 */
import { expect, test } from '@playwright/test';
import { settledInView } from './motion';

test('the announcement and reference hero asset render without narrow-screen overflow', async ({
	page
}) => {
	await page.setViewportSize({ width: 375, height: 812 });
	await page.goto('/en');

	const announcement = page.getByRole('complementary', { name: 'Wegovy Pill offer' });
	await expect(announcement).toHaveCSS('height', '64px');
	await expect(announcement.getByText('WEGOVY PILL — NOW AVAILABLE', { exact: true })).toBeVisible();
	const detail = announcement.getByText('Order today + get a free \u20ac50 gift', { exact: true });
	await expect(detail).toBeVisible();
	// The narrow bar sets the offer as one plain line: no gold amount, no bold lead-in.
	await expect(detail).toHaveCSS('font-weight', '400');
	for (const unit of ['D', 'H', 'M']) {
		await expect(announcement.getByText(unit, { exact: true })).toBeVisible();
	}
	await expect(announcement.getByText('secs', { exact: true })).toBeHidden();
	await expect(announcement.getByText(':', { exact: true }).first()).toBeHidden();

	const heroImage = page.locator('section[aria-labelledby="hero-heading"] img').first();
	await expect(heroImage).toBeVisible();
	await expect(heroImage).toHaveAttribute('fetchpriority', 'high');
	const heroPreload = page.locator('head link[rel="preload"][as="image"]');
	await expect(heroPreload).toHaveCount(1);
	// No `type` any more: the hero is served from Sanity's CDN with `auto=format`, so the format
	// is decided by content negotiation at request time rather than chosen by the build. The
	// browser still receives AVIF where it accepts it; the page simply cannot promise which.
	await expect(heroPreload).not.toHaveAttribute('type', 'image/avif');
	// The preload is only reused, rather than doubling the download, when it resolves to the
	// same candidate the image will. Assert the two agree instead of a fixed string, so the pair
	// cannot drift apart silently. Read off the `img` rather than a `<source>`: the photograph
	// comes from Sanity's CDN now, as one element with a `w`-descriptor srcset, so there is no
	// generated `<picture>` and no per-format source to inspect.
	const heroSizes = await heroImage.getAttribute('sizes');
	expect(heroSizes).toBe('(min-width: 1024px) 100vw, 1684px');
	await expect(heroPreload).toHaveAttribute('imagesizes', heroSizes!);
	await expect(heroPreload).toHaveAttribute('imagesrcset', await heroImage.getAttribute('srcset') ?? '');
	await expect(heroImage).toHaveAttribute('width', '1684');
	await expect(heroImage).toHaveAttribute('height', '934');
	// The extension now sits before the query string, because the CDN takes its instructions
	// there and answers with whichever modern format the browser accepted.
	await expect
		.poll(() => heroImage.evaluate((image: HTMLImageElement) => image.currentSrc))
		.toMatch(/\.(?:avif|webp|jpe?g)(?:\?|$)/);
	const loadedHeroUrl = await heroImage.evaluate((image: HTMLImageElement) => image.currentSrc);
	await expect
		.poll(() =>
			page.evaluate((url) => performance.getEntriesByName(url, 'resource').length, loadedHeroUrl)
		)
		.toBe(1);

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

	const hero = page.locator('section[aria-labelledby="hero-heading"]');
	// Full bleed on the narrow frame: no card gutter, no radius, and at least a
	// full viewport tall so the fold lands below the hero rather than inside it.
	const heroBox = await hero.boundingBox();
	expect(heroBox?.x).toBe(0);
	expect(heroBox?.width).toBe(375);
	await expect(hero).toHaveCSS('border-top-left-radius', '0px');

	// The bar and the hero together fill exactly one screen: the hero takes the viewport
	// minus the offer bar, so the fold lands at the hero's edge rather than inside it.
	// Read from the page rather than repeating the literals set above.
	const viewportHeight = await page.evaluate(() => window.innerHeight);
	const barBox = await announcement.boundingBox();
	expect(Math.round(barBox!.height + heroBox!.height)).toBe(viewportHeight);

	// The narrow frame carries the headline a step up the scale from the wide one.
	await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-size', '48px');

	// One heading, and only the visible branch reaches the accessibility tree: the
	// unused copy is display:none, which removes it rather than merely hiding it.
	const heading = page.getByRole('heading', { level: 1 });
	await expect(heading).toHaveCount(1);
	await expect(heading).toHaveText('Feel healthier. Live more confidently.', {
		useInnerText: true
	});
	expect(
		await heading.evaluate(
			(h) => h.getAttribute('aria-label') ?? (h as HTMLElement).innerText.trim()
		)
	).toBe('Feel healthier. Live more confidently.');
	await expect(hero.getByText('Doctor-led weight loss', { exact: true })).toBeVisible();

	// One route into the funnel, full width, with no second CTA.
	const primary = hero.getByRole('link', { name: 'Check your eligibility' });
	await expect(primary).toBeVisible();
	await expect(primary).toHaveAttribute('href', '/en/questionnaire');
	expect((await primary.boundingBox())?.width).toBeGreaterThan(300);
	await expect(hero.getByRole('link', { name: 'Explore treatments' })).toBeHidden();

	// The rating keeps its existing destination and accessible wording, and is reachable.
	// It sits at its own width rather than stretching across the frame.
	await expect(reviewsLink).toBeVisible();
	expect((await reviewsLink.boundingBox())?.width).toBeLessThan(300);
	await reviewsLink.focus();
	await expect(reviewsLink).toBeFocused();

	// The menu opens from the overlay trigger, closes on Escape, and restores focus.
	const menuTrigger = page.getByRole('button', { name: 'Open menu' });
	await expect(menuTrigger).toBeVisible();
	await menuTrigger.click();
	await expect(page.getByRole('dialog')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toBeHidden();
	await expect(menuTrigger).toBeFocused();

	await page.setViewportSize({ width: 1440, height: 900 });
	await expect(announcement).toHaveCSS('height', '44px');

	// Desktop regression: the card frame, the struck headline, and both CTAs are intact.
	expect((await hero.boundingBox())?.x).toBe(12);
	await expect(hero).toHaveCSS('border-top-left-radius', '28px');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(
		'Your pathway to lasting perfect shape happiness.',
		{ useInnerText: true }
	);
	await expect(hero.locator('h1 s')).toHaveText('perfect shape');
	await expect(hero.getByRole('link', { name: 'Explore treatments' })).toBeVisible();
	await expect(page.getByTestId('hero-article-teaser')).toBeVisible();
	await expect(hero.locator('img').first()).toHaveCSS('object-position', '50% 50%');
	await expect(announcement.getByText('WEGOVY PILL NOW AVAILABLE', { exact: true })).toBeVisible();
	await expect(announcement.getByText('Order today and get a free €50 gift.', { exact: true })).toBeVisible();
	await expect(announcement.getByText('secs', { exact: true })).toBeVisible();
});

test('keeps the Learn teaser compact and uses the reference divider', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 768 });
	await page.goto('/en');

	const teaser = page.getByTestId('hero-article-teaser');
	await expect(teaser).toBeVisible();
	await expect(teaser.getByText('Latest from Learn')).toHaveCSS('font-size', '10px');
	await expect(teaser.getByText('Mounjaro vs Wegovy.')).toHaveCSS('font-size', '18px');

	const divider = teaser.locator('div[aria-hidden="true"]');
	await expect(divider).toHaveCSS('width', '42px');
	await expect(divider).toHaveCSS('height', '2px');

	const desktopBox = await teaser.boundingBox();
	expect(desktopBox?.width).toBeLessThanOrEqual(320);

	// The narrow reference carries no teaser: the hero ends at the rating badge.
	await page.setViewportSize({ width: 375, height: 812 });
	await expect(teaser).toBeHidden();
});

test('matches the desktop Treatments menu geometry and keyboard behaviour', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/en');

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
	await page.goto('/en');

	const section = page.getByTestId('bento-grid');
	const cards = section.locator('article');
	await expect(cards).toHaveCount(5);

	// The grid enters on scroll, and a card caught mid-entrance is still translated: the gaps
	// below are the settled layout, not the animation's.
	await settledInView(section);

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
	// The tall treatment artwork fills the remaining column instead of ending early and
	// leaving an empty block of the card ground below it.
	expect(layout[0].bottomInset).toBeCloseTo(24, 0);
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
	await page.goto('/en');

	const band = page.getByLabel('Care built in');
	const visual = band.locator('img').first();
	// The optimizer can select a smaller or larger encoded candidate for the device, but the
	// generated source asset's intrinsic ratio remains faithful to the reference geometry.
	await expect(visual).toHaveAttribute('width', '1335');
	await expect(visual).toHaveAttribute('height', '1178');
	await expect(visual).toHaveCSS('mix-blend-mode', 'multiply');

	// The colour wash plus one blend per edge, which is what makes the artwork unboxed. The
	// siblings are the image's own now: `enhanced:img` used to wrap it in a `<picture>`, so the
	// overlays sat one level above it.
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

	const stars = band.getByRole('img', { name: /^[0-5](\.[0-9])? out of 5 stars$/ });
	await expect(stars).toBeVisible();
	await expect(stars.locator('svg')).toHaveCount(5);
	await expect(stars.locator('svg').first()).toHaveCSS('fill', 'none');

	await expect(band.getByText(/^[0-9,]+ reviews on Reviews\.io$/)).toBeVisible();
	await expect(band.getByText('Verified Solean member')).toBeVisible();

	const divider = band.locator('div[aria-hidden="true"]').last();
	await expect(divider).toHaveCSS('width', '48px');
	await expect(divider).toHaveCSS('height', '2px');

	// Same destination as the hero badge, so the page never offers two review platforms.
	const review = band.getByRole('link', {
		name: 'Leave a review on Reviews.io (opens in a new tab)'
	});
	await expect(review).toHaveAttribute(
		'href',
		'https://www.reviews.io/company-reviews/store/www.solean.com'
	);
	await expect(review).toHaveAttribute('target', '_blank');
	await expect(review).toHaveAttribute('rel', /noopener/);
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

test('the mobile menu opens as the reference full-screen panel', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/en');

	const announcementBar = page.getByRole('complementary', { name: 'Wegovy Pill offer' });
	const trigger = page.getByRole('button', { name: 'Open menu' });
	const closedLogo = await page.getByLabel('Solean, home').locator('svg').first().boundingBox();
	const closedTrigger = await trigger.boundingBox();

	await trigger.click();
	const panel = page.getByRole('dialog');
	await expect(panel).toBeVisible();

	// Sits under the offer bar on the deep green ground, not over the whole viewport.
	// Polled, because the panel is still sliding in when it first becomes visible.
	const barHeight = (await announcementBar.boundingBox())!.height;
	expect(barHeight).toBe(64);
	await expect
		.poll(async () => {
			const box = await panel.boundingBox();
			return { x: box?.x, y: box?.y, width: box?.width };
		})
		.toEqual({ x: 0, y: barHeight, width: 390 });
	await expect(panel).toHaveCSS('background-color', 'rgb(23, 56, 36)');
	// The offer bar stays readable: the scrim starts at the panel, not above it.
	expect((await page.getByRole('complementary', { name: 'Wegovy Pill offer' }).boundingBox())?.y).toBe(0);

	// The logo and the button do not move when the menu opens.
	expect(await panel.getByLabel('Solean, home').locator('svg').boundingBox()).toMatchObject(closedLogo!);
	expect(await page.getByRole('button', { name: 'Close menu' }).boundingBox()).toMatchObject(closedTrigger!);

	// Every label starts on the same line, whatever the width of its number.
	const labelLefts = await panel
		.locator('nav li span.font-display')
		.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().left));
	expect(labelLefts).toHaveLength(5);
	expect(new Set(labelLefts).size).toBe(1);

	// Treatments is one destination here, not a list of its products.
	await expect(panel.getByText('Mounjaro Injection')).toHaveCount(0);

	// Numbered rows in display type, one per nav item, in order.
	await expect(panel.getByText(/^0[1-5]$/)).toHaveCount(5);
	const home = panel.getByRole('link', { name: /01\s*Home/ });
	await expect(home).toBeVisible();
	await expect(panel.getByText('Home', { exact: true })).toHaveCSS('font-size', '30px');

	// Destinations and inert state are unchanged: Treatments and About Us promise nothing.
	//
	// Every one of them is prefixed. The locale lives in the path and German owns the bare
	// one, so an unprefixed internal link does not mean "this page in the reader's language",
	// it means the German page, and following it switches the language mid-visit.
	await expect(home).toHaveAttribute('href', '/en/');
	await expect(panel.getByRole('link', { name: /Learn/ })).toHaveAttribute('href', '/en/learn');
	await expect(panel.getByRole('link', { name: /Treatments/ })).toHaveCount(0);
	await expect(panel.getByRole('link', { name: /About Us/ })).toHaveCount(0);

	// The CTA reaches the funnel and closes the panel behind it.
	const cta = panel.getByRole('link', { name: 'Check your eligibility' });
	await expect(cta).toHaveAttribute('href', '/en/questionnaire');

	// Escape and the close button both return focus to the trigger.
	await page.keyboard.press('Escape');
	await expect(panel).toBeHidden();
	await expect(trigger).toBeFocused();

	await trigger.click();
	await page.getByRole('button', { name: 'Close menu' }).click();
	await expect(panel).toBeHidden();
	await expect(trigger).toBeFocused();

	// The desktop header still uses its own navigation, not this panel.
	await page.setViewportSize({ width: 1440, height: 900 });
	await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
	await expect(page.getByRole('button', { name: 'Treatments' })).toBeVisible();
});

test('the narrow landing sections follow the artboard', async ({ page }) => {
	const visible = (els: Element[]) =>
		els.filter((e) => (e as HTMLElement).offsetParent !== null).length;

	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/en');

	// The artboard has no trust band.
	await expect(page.getByLabel('Why Solean')).toBeHidden();

	// The bento becomes a carousel with its own heading and one dot per card.
	const bento = page.getByLabel('What Solean gives you');
	await expect(bento.getByRole('heading', { level: 2 })).toHaveText(
		'Everything you need to move forward.'
	);
	// The artboard leads with one card outside the carousel, so four dots cover five cards.
	// Scoped to the narrow branch: the wide grid renders the same five cards alongside it.
	await expect(page.getByTestId('bento-carousel').locator('article')).toHaveCount(5);
	const firstCarouselCard = page.getByTestId('bento-carousel').locator('article').nth(1);
	expect((await firstCarouselCard.locator('img').boundingBox())?.width).toBe(132);
	const dots = bento.getByRole('tab');
	await expect(dots).toHaveCount(4);
	await expect(dots.first()).toHaveAttribute('aria-selected', 'true');
	// Every dot is the same size: the artboard's stretched active dot was rejected, so
	// colour alone carries the selected state.
	const dotWidths = await dots.evaluateAll((els) =>
		els.map((e) => e.getBoundingClientRect().width)
	);
	expect(new Set(dotWidths)).toEqual(new Set([6]));

	// The bands meet: no strip of page ground between them.
	const seam = await page.evaluate(() => {
		const above = document
			.querySelector('section[aria-label="What Solean gives you"]')!
			.getBoundingClientRect();
		const below = document.querySelector('section[aria-label="Care built in"]')!.getBoundingClientRect();
		return Math.round(below.top - above.bottom);
	});
	expect(seam).toBe(0);

	// The band opens on its own heading and closes that block with a full-width CTA.
	const band = page.getByLabel('Care built in');
	await expect(band.getByText('Care built in', { exact: true })).toBeVisible();
	await expect(band.locator('ul').first()).toBeHidden();
	const bandCta = band.getByRole('link', { name: /Check your eligibility/ });
	expect((await bandCta.boundingBox())?.width).toBe(358);

	// Panels meet both edges, square.
	for (const label of ['Care built in', 'How it works']) {
		const panel = page.getByLabel(label).locator('> div').first();
		const box = await panel.boundingBox();
		expect(box?.x).toBe(0);
		expect(box?.width).toBe(390);
		await expect(panel).toHaveCSS('border-top-left-radius', '0px');
	}

	// The projection drops its horizon tabs and its pair of CTAs.
	const projection = page.getByLabel(/Projected progress/i);
	expect(await projection.getByRole('link').evaluateAll(visible)).toBe(0);
	expect(await projection.getByRole('tablist').evaluateAll(visible)).toBe(0);

	// How it works offers one destination, the foot button rather than the row link.
	const howItWorks = page.getByLabel('How it works');
	const start = howItWorks.getByRole('link', { name: /Start questionnaire/ });
	expect(await start.evaluateAll(visible)).toBe(1);

	const widths = await page.evaluate(() => ({
		client: document.documentElement.clientWidth,
		scroll: document.documentElement.scrollWidth
	}));
	expect(widths.scroll).toBe(widths.client);

	// Desktop keeps the band, the bento grid, the tabs, the CTAs and the row link.
	await page.setViewportSize({ width: 1440, height: 900 });
	await expect(page.getByLabel('Why Solean')).toBeVisible();
	await expect(bento.getByRole('tab')).toBeHidden();
	await expect(page.getByTestId('bento-grid').locator('article')).toHaveCount(5);
	expect(await projection.getByRole('link').evaluateAll(visible)).toBe(2);
	expect(await projection.getByRole('tablist').evaluateAll(visible)).toBe(1);
	expect(await start.evaluateAll(visible)).toBe(1);
	const panel = page.getByLabel('Care built in').locator('> div').first();
	await expect(panel).toHaveCSS('border-top-left-radius', '28px');
});

test('the article header sits exactly where the landing header does', async ({
	page
}) => {
	const logoBox = () => page.getByLabel('Solean, home').locator('svg').first().boundingBox();
	const headerBox = () => page.locator('header').first().boundingBox();

	// The header must not move when a reader switches pages, so the article's is compared
	// against the landing page's rather than against numbers of its own.
	for (const [width, height] of [
		[390, 844],
		[1200, 800],
		[1440, 900]
	] as const) {
		await page.setViewportSize({ width, height });

		await page.goto('/en');
		const home = { header: await headerBox(), logo: await logoBox() };

		await page.goto('/en/learn/blog/mounjaro-vs-wegovy');
		expect(await headerBox()).toMatchObject(home.header!);
		expect(await logoBox()).toMatchObject(home.logo!);
	}

	// The menu trigger travels with it.
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/en/learn/blog/mounjaro-vs-wegovy');
	const articleTrigger = await page.getByRole('button', { name: 'Open menu' }).boundingBox();
	await page.goto('/en');
	expect(await page.getByRole('button', { name: 'Open menu' }).boundingBox()).toMatchObject(
		articleTrigger!
	);

	// No social control in either header: the article artboard draws one, and it was
	// rejected during review.
	await page.setViewportSize({ width: 1440, height: 900 });
	await expect(page.locator('header').first().getByRole('link', { name: /Instagram/ })).toHaveCount(
		0
	);
});

test('the article follows its artboard below the hero', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/en/learn/blog/mounjaro-vs-wegovy');

	// The last crumb is a short name, not the truncated headline.
	const crumb = page.locator('[data-slot="breadcrumb-page"]');
	await expect(crumb).toHaveText('Mounjaro vs Wegovy');

	// The comparison table opens on a blank corner: the row headers name the attributes.
	// Blank to the eye, not to a screen reader, so the check is for drawn text alone.
	const corner = page.locator('table thead th').first();
	await expect(corner.locator('span.sr-only')).toHaveText('Attribute');
	expect(
		await corner.evaluate((el) =>
			[...el.childNodes]
				.filter((n) => n.nodeType === Node.TEXT_NODE)
				.map((n) => n.textContent?.trim())
				.join('')
		)
	).toBe('');

	// Sources close the article in the main column, under the FAQ.
	const sources = page.getByRole('heading', { name: 'Sources and medical review' });
	await expect(sources).toHaveCount(1);
	const faqTop = (await page.getByRole('heading', { name: 'Frequently asked questions' }).boundingBox())!.y;
	expect((await sources.boundingBox())!.y).toBeGreaterThan(faqTop);

	// The sidebar keeps the artboard's three cards, the third naming the standard.
	const sidebar = page.getByLabel('Article summary and standards');
	await expect(sidebar.getByRole('heading', { name: 'Key takeaways' })).toBeVisible();
	await expect(sidebar.getByRole('heading', { name: 'Not sure which treatment fits?' })).toBeVisible();
	await expect(sidebar.getByRole('heading', { name: 'Our editorial standards' })).toBeVisible();
	await expect(sidebar.getByRole('heading', { name: 'Sources and medical review' })).toHaveCount(0);

	// The related-guides band was dropped during review.
	await expect(page.getByText('More expert guides')).toHaveCount(0);

	// The contents list runs in document order, so Sources follows FAQs there too.
	const tocLabels = await page
		.getByLabel('On this page')
		.getByRole('link')
		.evaluateAll((els) => els.map((e) => e.textContent?.trim()));
	expect(tocLabels.slice(-2)).toEqual(['FAQs', 'Sources']);

	// The narrow artboard squares the hero panel.
	await page.setViewportSize({ width: 390, height: 844 });
	const panel = page.locator('section[aria-labelledby="article-title"] > div').first();
	await expect(panel).toHaveCSS('border-top-left-radius', '0px');
	expect((await panel.boundingBox())?.x).toBe(0);
});

test('no marketing image is drawn larger than the pixels it carries', async ({ page }) => {
	// Two things a width-only ratio cannot see, and both hid a soft hero once. naturalWidth is
	// normalised by the candidate's density descriptor, so a stretched image still reports 1x;
	// and object-cover scales to whichever edge is short, which for a frame taller than the
	// photograph is the height. Measure the file the browser actually chose, the way the
	// compositor does.
	//
	// The decoded size is read off the URL rather than the bytes. The marketing photographs come
	// from Sanity's CDN now, which sends no `Access-Control-Allow-Origin`, so `fetch` and
	// `createImageBitmap` are refused; and `naturalWidth` cannot stand in for them, because the
	// browser normalises it by the candidate's effective density for `w` descriptors exactly as
	// it does for `x` ones. A Sanity URL states both facts outright: the asset's own dimensions
	// sit in the filename (`-1757x895.webp`) and the width served sits in `?w=`, so the decoded
	// height follows from the two. Local images keep `naturalWidth`, which is exact for them.
	const measure = async () => {
		const images = [...document.querySelectorAll('img')].filter((image) => {
			const box = image.getBoundingClientRect();
			return box.width > 0 && box.height > 0 && image.currentSrc;
		});

		const decoded = (src: string, image: HTMLImageElement) => {
			const source = src.match(/-(\d+)x(\d+)\.\w+/);
			const asked = src.match(/[?&]w=(\d+)/);
			if (!source || !asked) return { width: image.naturalWidth, height: image.naturalHeight };

			const width = Number(asked[1]);
			const cropped = src.match(/[?&]h=(\d+)/);
			return {
				width,
				height: cropped
					? Number(cropped[1])
					: Math.round(width * (Number(source[2]) / Number(source[1])))
			};
		};

		const dpr = window.devicePixelRatio;
		const measured: { src: string; density: number }[] = [];
		for (const image of images) {
			const box = image.getBoundingClientRect();
			const file = decoded(image.currentSrc, image);
			if (!file.width) continue;
			const width = box.width * dpr;
			const height = box.height * dpr;
			const scale =
				getComputedStyle(image).objectFit === 'cover'
					? Math.max(width / file.width, height / file.height)
					: width / file.width;
			measured.push({ src: image.currentSrc.split('/').pop()!, density: 1 / scale });
		}
		return measured;
	};

	const read = async (width: number, height: number) => {
		await page.setViewportSize({ width, height });
		await page.goto('/en');
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
		await page.waitForLoadState('networkidle');
		await page.evaluate(() => window.scrollTo(0, 0));
		return page.evaluate(measure);
	};

	const soften = (entries: { src: string; density: number }[], floor: number) =>
		entries
			.filter((entry) => entry.density < floor)
			.map((entry) => `${entry.src} at ${entry.density.toFixed(2)}x`);

	// The narrow frame is the one that regressed: it is taller than the photograph, so the
	// crop consumes far more width than the frame shows, and a width-shaped `sizes` bought a
	// candidate roughly a third of what was drawn.
	expect(soften(await read(390, 844), 0.95)).toEqual([]);

	// Wide, the hero alone sits below: its export is narrower than the desktop frame it has to
	// cover, so the shortfall is in the asset, not the markup. Everything else has its pixels.
	const wide = await read(1920, 1080);
	expect(soften(wide, 0.85)).toEqual([]);
	expect(soften(wide, 0.95).filter((entry) => !entry.startsWith('hero'))).toEqual([]);
});
