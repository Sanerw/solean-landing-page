import { expect, type Page } from '@playwright/test';

/** Selects a DOB through the same month/year controls a visitor uses. */
export async function selectDateOfBirth(page: Page, isoDate = '1990-05-14'): Promise<void> {
	const [year, month] = isoDate.split('-');
	const trigger = page.getByLabel('Bitte gib Dein Geburtsdatum an');

	await trigger.click();
	const popover = page.locator('[data-slot="popover-content"]');
	await expect(popover).toBeVisible();

	const selects = popover.locator('select');
	await expect(selects).toHaveCount(2);
	await selects.nth(1).selectOption(year);
	await selects.nth(0).selectOption(String(Number(month)));
	await popover.locator(`[data-bits-day][data-value="${isoDate}"]`).click();

	await expect(popover).toBeHidden();
}
