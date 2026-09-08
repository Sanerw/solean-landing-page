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

	// Scoped to the hero, not `.last()` on every section: once the comparison, how-it-works
	// and FAQ sections existed below the fold, a page-wide locator started measuring one of
	// those instead of the column beside the gallery.
	const hero = page.locator('section', { has: page.getByRole('heading', { level: 1 }) });
	const details = await hero.locator('> div > div').last().boundingBox();
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
	const bar = page.locator('div.fixed').filter({ hasText: 'for month 1' }).getByRole('link');
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

test('the consultation bar floats at every scroll position', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/en/treatments/wegovy-pill');

	const bar = page.locator('div.fixed').filter({ hasText: 'for month 1 of your plan' });

	// The offer is in reach whether the visitor has just arrived or read to the end. An earlier
	// pass let it scroll away with the content, which took the button away exactly when someone
	// had finished reading.
	for (const y of [0, 1500, 999999]) {
		await page.evaluate((v) => window.scrollTo(0, v), y);
		const box = await bar.boundingBox();
		expect(Math.round(box!.y + box!.height), `at scroll ${y}`).toBe(844);
	}
});

test('the floating bar never covers the footer legal row', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	// The German page, because these are the German legal documents and the footer names them
	// as such. The English route labels the same links "Legal notice" and "Privacy".
	await page.goto('/treatments/wegovy-pill');
	await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

	const bar = await page
		.locator('div.fixed')
		.filter({ hasText: 'für Monat 1' })
		.boundingBox();

	// The page reserves the bar's own height, so Impressum and Datenschutz can be scrolled
	// clear of it rather than sitting underneath it forever.
	for (const name of [/Impressum/, /Datenschutz/]) {
		const link = await page.getByRole('link', { name }).first().boundingBox();
		expect(link!.y + link!.height, String(name)).toBeLessThanOrEqual(bar!.y);
	}
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

/**
 * The plan comparison. It is one component with two layouts, and the pair of assertions that
 * matters is that exactly one of them is present at each width: a table that survives to 390px
 * would wrap into nonsense, and cards at 1280px would throw away the header association.
 */
test('the comparison is a table on a wide screen', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/en/treatments/wegovy-pill');

	const table = page.getByRole('table');
	await expect(table).toBeVisible();

	// Three treatments, and five columns: the name plus four durations.
	await expect(table.locator('tbody tr')).toHaveCount(3);
	await expect(table.locator('thead th')).toHaveCount(5);

	// The best-value column is named, not just tinted. A column marked by colour alone is not
	// marked at all for most of the people reading it.
	await expect(table.locator('thead')).toContainText('Best value');
	await expect(table.locator('thead')).toContainText('6 months');
});

test('the comparison is stacked cards on a narrow screen', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/en/treatments/wegovy-pill');

	// Not merely hidden: `lg:block` means the table is in the DOM but not rendered, so the
	// assertion is on visibility rather than on count.
	await expect(page.getByRole('table')).toBeHidden();

	// Scoped to the comparison: €149 is both Wegovy Injection's three-month plan and the pill's
	// own 4mg dose, so a page-wide text locator matches two different things.
	const comparison = page.locator('section', {
		has: page.getByRole('heading', { name: 'Compare treatment plans.' })
	});
	await expect(
		comparison.getByRole('heading', { name: 'Wegovy Injection', exact: true })
	).toBeVisible();
	await expect(comparison.getByText('€149 / month')).toBeVisible();

	// The narrow artboard's cards are a price at a glance: no per-row link and no current-page
	// label, both of which crowded a wrapping product name. The dropdown is how a phone moves
	// between treatments.
	//
	// Scoped to the card layout, because the table is hidden by CSS rather than removed: its
	// markup, links and all, is still in the section at this width.
	const cards = comparison.locator('div.lg\\:hidden');
	await expect(cards.getByRole('link')).toHaveCount(0);
	await expect(cards).not.toContainText('You are viewing this');
});

test('the comparison never links the treatment you are already reading', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/en/treatments/wegovy-pill');

	const table = page.getByRole('table');

	// The row you are on says so, and offers no link back to itself.
	await expect(table).toContainText('You are viewing this');
	await expect(table.getByRole('link', { name: /Learn more about Wegovy Pill/ })).toHaveCount(0);

	// The other two do link, and to their own pages.
	await expect(
		table.getByRole('link', { name: /Learn more about Mounjaro Injection/ })
	).toHaveAttribute('href', '/en/treatments/mounjaro');
	await expect(
		table.getByRole('link', { name: /Learn more about Wegovy Injection/ })
	).toHaveAttribute('href', '/en/treatments/wegovy');
});

test('the same prices appear in both comparison layouts', async ({ page }) => {
	await page.goto('/en/treatments/wegovy-pill');

	await page.setViewportSize({ width: 1280, height: 900 });
	const table = page.getByRole('table');
	await expect(table).toContainText('€124');
	await expect(table).toContainText('€109');

	await page.setViewportSize({ width: 390, height: 844 });
	const comparison = page.locator('section', {
		has: page.getByRole('heading', { name: 'Compare treatment plans.' })
	});
	await expect(comparison.getByText('€124 / month')).toBeVisible();
	await expect(comparison.getByText('€109 / month')).toBeVisible();
});

test('how it works lists three steps, with its visual, and opens the questionnaire', async ({
	page
}) => {
	await page.goto('/en/treatments/mounjaro');

	const steps = page.getByRole('list').filter({ hasText: 'Answer quick questions.' });
	await expect(steps.getByRole('listitem')).toHaveCount(3);

	// The section carries the same visual the landing page's does, served through
	// `enhanced:img`. Without it this section is a column of text in an empty panel, which is
	// what it was before review.
	const section = page.locator('section').filter({ hasText: 'How it works.' });
	await expect(section.locator('picture source').first()).toHaveAttribute('srcset', /\d+w/);
	await expect(section).toContainText('Doctor-led care');

	// The card's line and the heading say different things. They said the same thing once,
	// which read as a stutter with both on screen.
	await expect(section.getByRole('heading', { level: 2 })).toHaveText('How it works.');

	await expect(page.getByRole('link', { name: /Start questionnaire/ })).toHaveAttribute(
		'href',
		'/en/questionnaire'
	);
});

/**
 * The sections below the fold are set one step below the landing page's scale, because the
 * artboards draw them that way: 48px against 64px for a section heading. Pinned as computed
 * pixels rather than class names, so the check survives a refactor of how the class is built.
 */
test('the sections below the fold use the treatment scale, not the landing page scale', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/en/treatments/wegovy-pill');

	const compare = page.getByRole('heading', { name: 'Compare treatment plans.' });
	const size = await compare.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
	// text-4xl is 36px. The landing page's ladder reaches text-5xl, 48px, at this width.
	expect(size).toBeLessThanOrEqual(36);

	// The price is the other figure review called oversized.
	const price = page.getByRole('table').locator('td span').first();
	const priceSize = await price.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
	expect(priceSize).toBeLessThanOrEqual(24);
});

test('the comparison marks its best-value column in the header, not by colour alone', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/en/treatments/wegovy-pill');

	// The chip lives inside the column header, so a screen reader reads it with the column
	// rather than as a stray line above the table.
	const best = page.getByRole('columnheader', { name: /6 months/i });
	await expect(best).toContainText('Best value');
});

test('the page keeps one h1, with the sections under it', async ({ page }) => {
	await page.goto('/en/treatments/wegovy-pill');

	// Three sections were added below the fold; each brings a heading, and none of them may be
	// a second h1 or the page outline stops making sense.
	await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
	await expect(page.getByRole('heading', { level: 2, name: /Compare treatment plans/ })).toBeVisible();
	await expect(page.getByRole('heading', { level: 2, name: /Frequently asked questions/ })).toBeVisible();
});

test('the FAQ offers seven questions, all closed on arrival', async ({ page }) => {
	await page.goto('/en/treatments/wegovy-pill');

	// Scoped to the FAQ: the header's own navigation triggers report `aria-expanded` too, so a
	// page-wide count is the questions plus whatever chrome happens to be collapsible.
	const faq = page.locator('section', {
		has: page.getByRole('heading', { name: 'Frequently asked questions.' })
	});

	// Seven, not the narrow artboard's six: dropping a question for room is a layout accident.
	const questions = faq.getByRole('button', { expanded: false });
	await expect(questions).toHaveCount(7);

	await questions.first().click();
	await expect(faq.getByRole('button', { expanded: true })).toHaveCount(1);
});

/**
 * The whole point of 25b's last step: before it, the page existed and nothing reached it.
 */
test('the navigation dropdown reaches a treatment page in both locales', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });

	await page.goto('/en');
	await page.getByRole('button', { name: 'Treatments' }).first().click();
	await page.getByRole('link', { name: /Wegovy Pill/ }).first().click();
	await expect(page).toHaveURL(/\/en\/treatments\/wegovy-pill$/);

	await page.goto('/');
	await page.getByRole('button', { name: 'Behandlungen' }).first().click();
	await page.getByRole('link', { name: /Wegovy Pill/ }).first().click();
	await expect(page).toHaveURL(/\/treatments\/wegovy-pill$/);
});

test('the treatments parent is still not a link, because its index does not exist', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/en');

	// A trigger, not an anchor. Making the parent a link would point at a 404.
	await expect(page.getByRole('button', { name: 'Treatments' }).first()).toBeVisible();
	await expect(page.getByRole('link', { name: 'Treatments', exact: true })).toHaveCount(0);
});

test('the dose selector prints a bare price on a narrow screen', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/en/treatments/wegovy-pill');

	const first = page.getByRole('radiogroup', { name: 'Choose your dose' }).getByRole('radio').first();

	// The artboard prints the figure alone here: four segments across 390px cannot hold
	// "/ month" without wrapping every price onto a second line.
	//
	// Asserted on the computed style rather than the text, because `sr-only` clips an element
	// rather than removing it: the unit is still in `textContent`, which is the whole point.
	const unit = first.locator('span.sr-only');
	await expect(unit).toHaveCount(1);
	expect(await unit.evaluate((el) => getComputedStyle(el).position)).toBe('absolute');

	// It is still announced, so the option is never read as an unqualified number.
	await expect(first).toHaveAccessibleName(/€124\s*\/ month/);
});

test('the dose selector keeps the unit visible on a wide screen', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/en/treatments/wegovy-pill');

	const first = page.getByRole('radiogroup', { name: 'Choose your dose' }).getByRole('radio').first();

	// `not-sr-only` from `md`, so the unit is laid out normally rather than clipped.
	const unit = first.locator('span').last();
	expect(await unit.evaluate((el) => getComputedStyle(el).position)).toBe('static');
	await expect(first).toContainText('/ month');
});

/**
 * The rest of this file runs with analytics already declined, so the consent gate never
 * renders and cannot be asserted against. This block clears that state on purpose: the bar and
 * the gate are the only two elements anchored to the bottom of the viewport, and until review
 * caught it the bar was rendering behind the gate, which reads as a missing button rather than
 * a covered one.
 */
test.describe('with the consent gate still on screen', () => {
	test.use({ storageState: { cookies: [], origins: [] } });

	test('the sticky bar sits above the gate rather than behind it', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/en/treatments/wegovy-pill');

		const gate = page.getByRole('dialog');
		await expect(gate).toBeVisible();

		const bar = page.locator('div.fixed').filter({ hasText: 'for month 1 of your plan' });
		await expect(bar).toBeVisible();

		const barBox = await bar.boundingBox();
		const gateBox = await gate.boundingBox();

		// Stacked, not overlapping: the bar's foot is at or above the gate's head.
		expect(Math.round(barBox!.y + barBox!.height)).toBeLessThanOrEqual(Math.round(gateBox!.y) + 1);

		// And the offer is legible rather than hidden under the gate.
		await expect(bar).toContainText('€69 for month 1 of your plan');
	});

	test('the bar returns to the foot of the viewport once the gate is answered', async ({
		page
	}) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/en/treatments/wegovy-pill');

		await page.getByRole('button', { name: 'Decline' }).click();
		await expect(page.getByRole('dialog')).toHaveCount(0);

		// The offset is published by the gate, so it goes when the gate does.
		const barBox = await page
			.locator('div.fixed')
			.filter({ hasText: 'for month 1 of your plan' })
			.boundingBox();
		expect(Math.round(barBox!.y + barBox!.height)).toBe(844);
	});
});

/**
 * The header's dropdown against the page underneath it. `NavigationMenu.Content` is absolutely
 * positioned with no z-index of its own, so before the header was given one it competed on DOM
 * order alone and the treatment page's gallery painted straight over the open menu.
 */
test('the navigation dropdown paints above the page, and its items respond to hover', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/en/treatments/wegovy-pill');

	// Hovered open, not clicked: the menu closes when the pointer leaves it, and a click parks
	// the pointer on the trigger where any later mouse move can dismiss the panel mid-assertion.
	await page.getByRole('button', { name: 'Treatments' }).first().hover();

	const panel = page.locator('[data-slot=navigation-menu-content]');
	await expect(panel).toBeVisible();

	const item = page.getByRole('link', { name: /Mounjaro Injection/ }).first();
	await expect(item).toBeVisible();

	// The panel zooms and fades in, and a hit test taken mid-flight reports whatever is under
	// a half-transparent, half-scaled element. Wait for the motion to finish first.
	await page.waitForFunction(() =>
		document.getAnimations().every((animation) => animation.playState !== 'running')
	);

	// Hit testing, not visibility: a covered element is still "visible" to Playwright, which is
	// exactly why this shipped unnoticed.
	const onTop = await item.evaluate((el) => {
		const box = el.getBoundingClientRect();
		if (box.width === 0 || box.height === 0) return 'nothing: the panel had closed';

		const top = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
		if (!top) return 'nothing: the point fell outside the viewport';
		if (el.contains(top) || top === el) return 'the item itself';
		return `${top.tagName.toLowerCase()}.${top.className}`.slice(0, 120);
	});
	expect(onTop, 'something is painted over the dropdown item').toBe('the item itself');

	// The hover was always there; it could not be seen through the gallery on top of it.
	// Read from a row the pointer is not on, so the before and after readings differ for the
	// right reason. Moving the pointer out of the panel entirely would close it.
	const other = page.getByRole('link', { name: /Wegovy Pill/ }).first();
	const before = await other.evaluate((el) => getComputedStyle(el).backgroundColor);
	await other.hover();
	await expect
		.poll(() => other.evaluate((el) => getComputedStyle(el).backgroundColor))
		.not.toBe(before);
});
