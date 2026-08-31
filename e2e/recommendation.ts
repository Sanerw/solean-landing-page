import { expect, type Page } from '@playwright/test';

/**
 * The completion step is two screens: the plan is chosen on the first and ordered on the
 * second. Every spec that is about the order has to pass the choice, so it is one helper
 * rather than the same four lines repeated.
 */
export async function confirmPlan(page: Page, plan?: string | RegExp): Promise<void> {
	const confirm = page.getByRole('button', { name: 'Continue' });

	// Enabled only once the recommendation has been read, so this is also the wait for it.
	await expect(confirm).toBeEnabled();
	if (plan) await page.getByRole('radio', { name: plan }).click();

	await confirm.click();
	await expect(page.getByRole('heading', { name: 'Congratulations, you did it!' })).toBeVisible();
}
