import { expect, test } from '@playwright/test';

/**
 * The three treatment pages, reached the way a visitor reaches them. What is asserted is that
 * each slug exists and carries its own product: the introduction copy itself is not pinned
 * here, because it is marketing text that will be rewritten without the route changing.
 *
 * The names are the catalogue's own, composed by `treatmentDisplayName`, so a rename in
 * `src/lib/domain/catalogue.ts` fails these rather than quietly renaming the pages.
 */
const TREATMENTS = [
	{ slug: 'wegovy-pill', name: 'Wegovy Pill' },
	{ slug: 'wegovy', name: 'Wegovy Injection' },
	{ slug: 'mounjaro', name: 'Mounjaro Injection' }
] as const;

for (const treatment of TREATMENTS) {
	test(`/treatments/${treatment.slug} serves ${treatment.name}`, async ({ page }) => {
		const response = await page.goto(`/treatments/${treatment.slug}`);

		expect(response?.status()).toBe(200);
		await expect(page.getByRole('heading', { level: 1, name: treatment.name })).toBeVisible();

		// The breadcrumb's last segment names the same product as the heading. Two places on
		// one page that could disagree, and the only one a reader checks against the nav.
		await expect(page.getByRole('navigation', { name: 'breadcrumb' })).toContainText(
			treatment.name
		);
	});
}

test('an unknown treatment answers 404 with its own screen, not a blank page', async ({ page }) => {
	const response = await page.goto('/treatments/nope');

	expect(response?.status()).toBe(404);
	await expect(
		page.getByRole('heading', { level: 1, name: /could not find that treatment|nicht finden/i })
	).toBeVisible();
});

test('the English route carries English copy', async ({ page }) => {
	await page.goto('/en/treatments/wegovy-pill');

	await expect(page).toHaveTitle('Wegovy Pill | Solean');
	// The document element is what the locale actually reaches; a translated string could be
	// right while the attribute a screen reader reads is still German.
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await expect(page.getByText('verified reviews')).toBeVisible();
});

test('the German route is the bare path, and carries German copy', async ({ page }) => {
	await page.goto('/treatments/wegovy-pill');

	await expect(page.locator('html')).toHaveAttribute('lang', 'de');
	await expect(page.getByText('geprüfte Bewertungen')).toBeVisible();
});

/**
 * The gallery. Only the injections have a photograph, so this covers both halves of the guard:
 * the panel is complete without art, and it actually shows art when there is some.
 */
const GALLERY = [
	// The tablet has no photograph on purpose: the only product shot in the repository is an
	// injection pen, and a syringe under a chip reading "daily tablet" is the wrong medicine
	// rather than a missing picture.
	{ slug: 'wegovy-pill', form: 'Daily tablet', isNew: true, photos: 0 },
	{ slug: 'wegovy', form: 'Weekly injection', isNew: false, photos: 1 },
	{ slug: 'mounjaro', form: 'Weekly injection', isNew: false, photos: 1 }
] as const;

for (const treatment of GALLERY) {
	test(`the ${treatment.slug} gallery names its form and its status`, async ({ page }) => {
		await page.goto(`/en/treatments/${treatment.slug}`);

		const gallery = page.getByRole('main').locator('div.aspect-square').first();
		await expect(gallery).toBeVisible();
		await expect(gallery).toContainText(treatment.form);

		// The gold chip belongs to the one product the artboard marks as new. Asserting its
		// absence on the other two is the half that catches a chip left on every page.
		const isNew = gallery.getByText('New', { exact: true });
		await expect(isNew).toHaveCount(treatment.isNew ? 1 : 0);

		// The guard, both ways round. A page without art renders no image element at all rather
		// than a broken one, and a page with art actually renders it.
		await expect(gallery.locator('img')).toHaveCount(treatment.photos);

		if (treatment.photos > 0) {
			// A product photograph is content, so it carries a real alternative text.
			await expect(gallery.locator('img')).toHaveAccessibleName(/injection pen/i);

			// Served through `enhanced:img`, so a phone is not sent the 1.4MB original. The ladder
			// lives on the `source` elements, not on the fallback `img`, which is exactly the
			// mistake this assertion made first time round.
			const source = gallery.locator('picture source').first();
			await expect(source).toHaveAttribute('srcset', /\d+w/);
			await expect(source).toHaveAttribute('sizes', /46vw/);
		}
	});
}

test('the gallery is a square stacked, and half the row beside the details', async ({ page }) => {
	const gallery = page.getByRole('main').locator('div.aspect-square').first();

	// Stacked, it is the square the narrow artboard draws.
	await page.setViewportSize({ width: 390, height: 900 });
	await page.goto('/en/treatments/wegovy-pill');
	const stacked = await gallery.boundingBox();
	expect(Math.abs(stacked!.width - stacked!.height)).toBeLessThanOrEqual(1);

	// Side by side, it takes half the row and its height from the details column, which is what
	// the wide artboard draws at 804 by 828. Asserting the square here would pin the wrong rule:
	// a true half-width square is 630px tall and pushes the CTA under the fold.
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/en/treatments/wegovy-pill');
	const beside = await gallery.boundingBox();
	expect(beside!.width).toBeGreaterThan(1440 * 0.4);

	const details = await page.locator('section > div > div').last().boundingBox();
	expect(Math.abs(beside!.height - details!.height)).toBeLessThanOrEqual(1);
});

/**
 * The dose selector. It is a radio group rather than tabs, because it chooses a product
 * option and promises no panel, and it is a price lever rather than decoration: the offer
 * card's ongoing line has to answer to whatever is chosen.
 */
test('the dose selector is a named radio group that opens on the first dose', async ({ page }) => {
	await page.goto('/en/treatments/wegovy-pill');

	const group = page.getByRole('radiogroup', { name: 'Choose your dose' });
	await expect(group).toBeVisible();

	const doses = group.getByRole('radio');
	await expect(doses).toHaveCount(4);
	await expect(doses.first()).toBeChecked();

	// The price is half of what is being chosen between, so it has to be part of the option's
	// accessible name, not a visual aside.
	await expect(doses.first()).toHaveAccessibleName(/1\.5mg/);
	await expect(doses.first()).toHaveAccessibleName(/€124/);
});

test('choosing a dose reprices the offer, and the keyboard can do it too', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/en/treatments/wegovy-pill');

	const thereafter = page.getByText(/per month thereafter/);
	await expect(thereafter).toContainText('€124');

	await page.getByRole('radio', { name: /25mg/ }).click();
	await expect(thereafter).toContainText('€209');

	// Arrow keys are the whole reason this is a radio group and not a row of buttons.
	await page.getByRole('radio', { name: /25mg/ }).focus();
	await page.keyboard.press('ArrowLeft');
	await expect(page.getByRole('radio', { name: /9mg/ })).toBeChecked();
	await expect(thereafter).toContainText('€179');
});

/**
 * The narrow artboard has no offer card: the bar at the foot carries the same offer. Each
 * assertion has its negative half, because "the bar renders" is also true of a build where it
 * renders at every width.
 */
test('the offer is a card on a wide screen and a bar on a narrow one', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/en/treatments/wegovy-pill');

	// Scoped by element, not by text: the card and the bar carry the *identical* string, which
	// is the point of the single `firstMonth` field. A bare text locator matches both.
	const card = page.locator('p').filter({ hasText: '€69 for month 1 of your plan' });
	const bar = page.locator('div.sticky').getByRole('link');
	await expect(card).toBeVisible();
	await expect(bar).toBeHidden();

	await page.setViewportSize({ width: 390, height: 844 });
	await expect(card).toBeHidden();
	await expect(bar).toBeVisible();
	// One `firstMonth` field feeds both, which is what stops the export's 69-against-70 split
	// from being transcribed.
	await expect(bar).toContainText('€69 for month 1 of your plan');
});

test('both consultation CTAs enter the questionnaire in the reader s own language', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 900 });

	await page.goto('/treatments/wegovy-pill');
	await expect(page.getByRole('link', { name: /Beratung starten/ })).toHaveAttribute(
		'href',
		'/questionnaire'
	);

	await page.goto('/en/treatments/wegovy-pill');
	await expect(page.getByRole('link', { name: /Begin my consultation/ })).toHaveAttribute(
		'href',
		'/en/questionnaire'
	);
});

test('the sticky bar gives way to the footer rather than covering its legal links', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/en/treatments/wegovy-pill');

	const bar = page.locator('div.sticky');
	// Pinned to the foot of the viewport while the page's own content is being read.
	const pinned = await bar.boundingBox();
	expect(Math.round(pinned!.y + pinned!.height)).toBe(844);

	// At the very bottom it has scrolled away, so the footer's last row is reachable. A fixed
	// bar would still be sitting on top of Impressum and Datenschutz here.
	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
	const released = await bar.boundingBox();
	expect(released!.y + released!.height).toBeLessThan(844);
});

/**
 * The two regressions review caught by eye, pinned as geometry so a class change cannot bring
 * them back quietly.
 */
test('the dose segments are joined, with no gap showing the container through', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 800 });
	await page.goto('/en/treatments/wegovy-pill');

	const doses = page.getByRole('radiogroup', { name: 'Choose your dose' }).getByRole('radio');
	const boxes = await doses.all();
	let previous = await boxes[0].boundingBox();

	for (const segment of boxes.slice(1)) {
		const box = await segment.boundingBox();
		// Adjacent segments share an edge. The adapted Root's base `gap-3` used to push 12px of
		// the container's own ground between them.
		expect(Math.abs(box!.x - (previous!.x + previous!.width))).toBeLessThanOrEqual(1);
		previous = box;
	}
});

test('the whole product hero lands inside a 13 inch viewport', async ({ page }) => {
	// The screen this page is read on. The gallery is a square, so before it was capped it was
	// 630px tall here on its own and pushed the CTA under the fold.
	await page.setViewportSize({ width: 1440, height: 800 });
	await page.goto('/en/treatments/wegovy-pill');

	const cta = await page.getByRole('link', { name: /Begin my consultation/ }).boundingBox();
	expect(cta!.y + cta!.height).toBeLessThanOrEqual(800);
});
