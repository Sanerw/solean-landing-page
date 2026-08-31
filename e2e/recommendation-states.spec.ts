import { expect, test, type Page } from '@playwright/test';
import { NO_PLANS, NO_RECOMMENDATION, walkAndSubmit } from './answers';
import { FIXTURE_VARIANT_ID } from './fixture';
import { confirmPlan } from './recommendation';

/**
 * The two answers RxScale can give that are not a list of plans. Both are reachable in the
 * real service: an anamnesis their recommender matches nothing to, and a recommendation call
 * that fails. Neither may end the funnel, because the person has already filed a medical
 * record a doctor will read.
 *
 * Which one the fixture gives is asked for through an answer, and the anamnesis is submitted
 * rather than seeded: nothing is stored any more, so the only uid a session holds is the one
 * its own submission returned.
 */
async function atRecommendation(page: Page, email: string): Promise<void> {
	await walkAndSubmit(page, { email });
	await expect(page.getByRole('heading', { name: 'Choose your treatment' })).toBeVisible();
}

/** What the browser asked the cart for, which on these paths should be nothing at all. */
function orderedVariant(page: Page): { current: string | null } {
	const seen = { current: null as string | null };
	page.on('request', (request) => {
		if (!request.url().includes('/api/checkout')) return;
		seen.current = (request.postDataJSON() as { variantId?: string } | null)?.variantId ?? null;
	});

	return seen;
}

test('an anamnesis nothing was matched to still reaches a checkout', async ({ page }) => {
	const ordered = orderedVariant(page);
	await atRecommendation(page, NO_PLANS);

	await expect(page.getByText('A doctor is reviewing your answers')).toBeVisible();

	// No plan means no price: a screen that showed one would be quoting an offer nobody made.
	await expect(page.getByText('EUR')).toHaveCount(0);

	// Nothing to choose is still a screen that continues: the choice is the fallback plan.
	await confirmPlan(page);
	await page.getByRole('button', { name: 'Go to checkout' }).click();
	await expect(page.getByRole('heading', { name: 'Fixture checkout' })).toBeVisible();

	// The browser names no variant, so the server falls back to the configured one.
	expect(ordered.current).toBeFalsy();
});

test('a recommendation that cannot be reached is not a dead end', async ({ page }) => {
	await atRecommendation(page, NO_RECOMMENDATION);

	// The same screen as nothing-matched on purpose: what the person can do next is identical,
	// and naming the outage would only invite a reload that changes nothing here.
	await expect(page.getByText('A doctor is reviewing your answers')).toBeVisible();
	await expect(page.getByText('EUR')).toHaveCount(0);

	await confirmPlan(page);
	await page.getByRole('button', { name: 'Go to checkout' }).click();
	await expect(page.getByRole('heading', { name: 'Fixture checkout' })).toBeVisible();
});

test('the configured fallback is what a plan-less order actually buys', async ({ page }) => {
	await atRecommendation(page, NO_PLANS);

	await confirmPlan(page);
	await page.getByRole('button', { name: 'Go to checkout' }).click();
	await expect(page.getByRole('heading', { name: 'Fixture checkout' })).toBeVisible();

	// Read off the cart the fixture actually built. The browser names no variant on this path,
	// so its own payload cannot prove which merchandise the order carries; only the cart can.
	await expect(page.getByTestId('variant')).toHaveText(FIXTURE_VARIANT_ID);
});
