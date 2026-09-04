import { expect, type Page } from '@playwright/test';
import { UI } from './ui-labels';

export type PlanMode = 'treatment' | 'prescription';

export interface PlanChoice {
	/**
	 * Which purchase to end on. The screen opens on the treatments, and a prescription-only
	 * listing now lives behind a second screen rather than a tab, so asking for one means
	 * choosing the summary card and confirming it.
	 */
	mode?: PlanMode;
	plan?: string | RegExp;
}

/** The one action that ends the questionnaire, whatever it is currently named. */
export function checkoutButton(page: Page) {
	return page.getByRole('button', { name: /Zur Kasse|Weiter mit Rezept|Erneut versuchen/ });
}

/**
 * Picks a plan on the completion screen, without ordering it. The order is a separate press
 * so a spec can watch what happens in between.
 */
export async function choosePlan(page: Page, choice: PlanChoice = {}): Promise<void> {
	// Enabled only once the recommendation has been read, so this is also the wait for it.
	await expect(checkoutButton(page)).toBeEnabled();

	if (choice.mode === 'prescription') {
		// Only when the first screen is offering the card. A recommendation of nothing but
		// prescriptions already opens on the medication list.
		const card = page.getByRole('radio', { name: new RegExp(UI.prescriptionCard) });
		if (await card.count()) {
			await card.click();
			await checkoutButton(page).click();
			await expect(page.getByRole('heading', { level: 1, name: UI.prescriptionHeadline })).toBeVisible();
		}
	}

	if (choice.plan) await page.getByRole('radio', { name: choice.plan }).click();
}

/** Picks a plan and orders it, which is the whole of the completion step now. */
export async function orderPlan(page: Page, choice: PlanChoice = {}): Promise<void> {
	await choosePlan(page, choice);
	await checkoutButton(page).click();
}
