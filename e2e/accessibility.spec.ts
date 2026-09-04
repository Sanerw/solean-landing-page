import AxeBuilder from '@axe-core/playwright';
import { UI } from './ui-labels';
import { expect, test, type Page } from '@playwright/test';
import { walkAndSubmit, walkTo, type WalkOptions } from './answers';
import { settledPage } from './motion';
import { checkoutButton } from './recommendation';

/**
 * One automated pass over every surface a visitor sees. Axe proves a subset of accessibility
 * and no more: it cannot tell whether a label reads sensibly, whether an order makes sense to
 * a screen reader, or whether a focus move is a surprise. Those stay with `/try`. What it does
 * catch is the class of defect that is both objective and easy to reintroduce.
 *
 * Serious and critical only. Axe's minor and moderate rules include judgement calls this
 * project has already made deliberately, and failing on them would turn the sweep into noise.
 */
const BLOCKING = ['serious', 'critical'];

async function violations(page: Page): Promise<string[]> {
	const result = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
		.analyze();

	return result.violations
		.filter((violation) => BLOCKING.includes(violation.impact ?? ''))
		.map(
			(violation) =>
				`${violation.impact} ${violation.id}: ${violation.help} (${violation.nodes.length} node(s), first: ${violation.nodes[0]?.target.join(' ')})`
		);
}

test('the landing page has no serious accessibility violations', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

	// Sections that enter on scroll start transparent, and axe reads a transparent element as
	// unreadable text rather than as one nobody has looked at yet.
	await settledPage(page);

	expect(await violations(page)).toEqual([]);
});

test('the learn article has no serious accessibility violations', async ({ page }) => {
	await page.goto('/learn/blog/mounjaro-vs-wegovy');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

	expect(await violations(page)).toEqual([]);
});

test('the Journal has no serious accessibility violations', async ({ page }) => {
	await page.goto('/learn');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

	expect(await violations(page)).toEqual([]);
});

/**
 * The fixture model carries one page per question type by construction, so walking it is the
 * cheapest way to put every adapted primitive in front of the scanner.
 */
/**
 * Every one of our twelve question screens, so the scan covers each one rather than each
 * renderer. Feature 24e gave four of them a design of their own and rebuilt a fifth, and a
 * screen nothing scans is where a heading level or an unnamed control goes unnoticed.
 *
 * The conditional ones need the answers that open them, which is what `WalkOptions` carries.
 * `health-history` is unconditional and was simply missed before.
 */
const QUESTION_STEPS: { id: string; options?: WalkOptions }[] = [
	{ id: 'about-you' },
	{ id: 'your-details' },
	{ id: 'medication-history' },
	{ id: 'side-effects', options: { onMedication: true } },
	{ id: 'pregnancy', options: { gender: 'Weiblich' } },
	{ id: 'medical-conditions' },
	{ id: 'gallbladder', options: { hadGallstones: true } },
	{ id: 'weight-related-conditions', options: { inTheBmiBand: true } },
	{ id: 'health-history' },
	{ id: 'eating-disorders' },
	{ id: 'allergies' },
	{ id: 'disclaimers' }
];

for (const { id, options } of QUESTION_STEPS) {
	test(`questionnaire ${id} has no serious accessibility violations`, async ({ page }) => {
		await walkTo(page, id, options);

		expect(await violations(page)).toEqual([]);
	});

	test(`questionnaire ${id} has exactly one h1`, async ({ page }) => {
		// Axe reports a missing or empty `h1`, not a second one, and the screen system promotes
		// a question's own label into the heading when the screen has no title of its own.
		await walkTo(page, id, options);

		await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
	});
}

test('the recommendation screen has no serious accessibility violations', async ({ page }) => {
	await walkAndSubmit(page);
	await expect(page.getByRole('heading', { level: 1, name: UI.chooseTreatment })).toBeVisible();
	// The plan list fades in after the wait, so the scan waits with it.
	await settledPage(page);

	expect(await violations(page)).toEqual([]);

	// The medication list is a screen of its own, and axe only sees the one on screen.
	await page.getByRole('radio', { name: new RegExp(UI.prescriptionCard) }).click();
	await checkoutButton(page).click();
	await expect(page.getByRole('heading', { level: 1, name: UI.prescriptionHeadline })).toBeVisible();
	await settledPage(page);
	expect(await violations(page)).toEqual([]);

});
