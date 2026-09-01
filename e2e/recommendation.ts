import { expect, type Page } from '@playwright/test';
import { UI } from './ui-labels';

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
	treatment: UI.modeTreatment,
	prescription: UI.modePrescription
};

/** The one action that ends the questionnaire, whatever it is currently named. */
export function checkoutButton(page: Page) {
	return page.getByRole('button', { name: /Zur Kasse|Erneut versuchen/ });
}

/**
 * Picks a plan on the completion screen, without ordering it. The order is a separate press
 * so a spec can watch what happens in between.
 */
export async function choosePlan(page: Page, choice: PlanChoice = {}): Promise<void> {
	// Enabled only once the recommendation has been read, so this is also the wait for it.
	await expect(checkoutButton(page)).toBeEnabled();

	if (choice.mode) await page.getByRole('tab', { name: TAB_LABEL[choice.mode] }).click();
	if (choice.plan) await page.getByRole('radio', { name: choice.plan }).click();
}

/** Picks a plan and orders it, which is the whole of the completion step now. */
export async function orderPlan(page: Page, choice: PlanChoice = {}): Promise<void> {
	await choosePlan(page, choice);
	await checkoutButton(page).click();
}
