import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { EVERY_ANSWER, seedAnamnesis, seedAnswers } from './answers';
import { confirmPlan } from './recommendation';

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

	expect(await violations(page)).toEqual([]);
});

test('the learn article has no serious accessibility violations', async ({ page }) => {
	await page.goto('/learn/blog/mounjaro-vs-wegovy');
	await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

	expect(await violations(page)).toEqual([]);
});

/**
 * The fixture model carries one page per question type by construction, so walking it is the
 * cheapest way to put every adapted primitive in front of the scanner.
 */
const QUESTION_STEPS = ['page30', 'page27', 'page26', 'page3', 'page2', 'page1', 'page16', 'page18'];

for (const step of QUESTION_STEPS) {
	test(`questionnaire ${step} has no serious accessibility violations`, async ({ page }) => {
		await seedAnswers(page, EVERY_ANSWER);
		await page.goto(`/questionnaire/${step}`);
		await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();

		expect(await violations(page)).toEqual([]);
	});
}

test('both recommendation screens have no serious accessibility violations', async ({ page }) => {
	await seedAnswers(page, EVERY_ANSWER);
	await seedAnamnesis(page, 'anam-a11y');
	await page.goto('/questionnaire/complete');
	await expect(page.getByRole('tab', { name: 'Treatment' })).toBeVisible();

	expect(await violations(page)).toEqual([]);

	// The other purchase is a panel of its own, and axe only sees the one on screen.
	await page.getByRole('tab', { name: 'Prescription only' }).click();
	expect(await violations(page)).toEqual([]);

	// The order screen is the other half of this step and is never reached without the choice.
	await confirmPlan(page);
	expect(await violations(page)).toEqual([]);
});
