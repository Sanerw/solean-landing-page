import { expect, type Page } from '@playwright/test';
import { UI } from './ui-labels';

/** The field itself, which is a text input a visitor can type a date straight into. */
export function dateOfBirthField(page: Page) {
	return page.getByLabel('Bitte gib Dein Geburtsdatum an');
}

/** Opens the calendar, which hangs off its own icon now that the field takes typing. */
export async function openCalendar(page: Page) {
	await page.getByRole('button', { name: UI.openCalendar }).click();
	const popover = page.locator('[data-slot="popover-content"]');
	await expect(popover).toBeVisible();

	return popover;
}

/** Selects a DOB through the same month/year controls a visitor uses. */
export async function selectDateOfBirth(page: Page, isoDate = '1990-05-14'): Promise<void> {
	const [year, month] = isoDate.split('-');
	const popover = await openCalendar(page);

	const selects = popover.locator('select');
	await expect(selects).toHaveCount(2);
	await selects.nth(1).selectOption(year);
	await selects.nth(0).selectOption(String(Number(month)));
	await popover.locator(`[data-bits-day][data-value="${isoDate}"]`).click();

	await expect(popover).toBeHidden();
}

/** The other way in: the digits, with the field putting the separators in. */
export async function typeDateOfBirth(page: Page, digits = '14051990'): Promise<void> {
	const field = dateOfBirthField(page);
	await field.click();
	await field.fill('');
	await page.keyboard.type(digits);
}
