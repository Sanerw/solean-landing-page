import { expect, type Page } from '@playwright/test';

export type PlanMode = 'treatment' | 'prescription';

export interface PlanChoice {
	/**
	 * The tab to open first. A prescription-only listing is a different purchase and lives in
	 * a panel of its own, so a spec that wants one has to say so: the treatments are what the
	 * screen opens on.
	 */
	mode?: PlanMode;
	plan?: string | RegExp;
}

const TAB_LABEL: Record<PlanMode, string> = {
	treatment: 'Treatment',
	prescription: 'Prescription only'
};

/**
 * The completion step is two screens: the plan is chosen on the first and ordered on the
 * second. Every spec that is about the order has to pass the choice, so it is one helper
 * rather than the same four lines repeated.
 */
export async function confirmPlan(page: Page, choice: PlanChoice = {}): Promise<void> {
	// Enabled only once the recommendation has been read, so this is also the wait for it.
	const confirm = page.getByRole('button', { name: 'Continue' });
	await expect(confirm).toBeEnabled();

	if (choice.mode) await page.getByRole('tab', { name: TAB_LABEL[choice.mode] }).click();
	if (choice.plan) await page.getByRole('radio', { name: choice.plan }).click();

	await confirm.click();
	await expect(page.getByRole('heading', { name: 'Congratulations, you did it!' })).toBeVisible();
}
