import { expect, test } from '@playwright/test';
import { UI } from './ui-labels';
import { walkTo } from './answers';

/**
 * The screen system feature 24e built: the eyebrow, the screen title, the OR rule and the
 * medication details panel. These are the parts a person can see and a spec can name, as
 * distinct from the parts only the artboards can judge, which stay with the screenshots.
 */

test('the eyebrow carries the count the artboards print', async ({ page }) => {
	await walkTo(page, 'about-you');

	// Eight screens for a male visitor above the BMI band who has taken nothing: the walk, not
	// a fixed length. The artboards say "of 9" and "of 10" over the same flow, which
	// `project-plan.md` section 9 records as a defect; the counter is computed.
	await expect(page.locator(UI.progressEyebrow)).toHaveText(`${UI.progressPrefix}1 von 8`);
});

test('a screen with several questions states its own title', async ({ page }) => {
	await walkTo(page, 'about-you');

	await expect(page.getByRole('heading', { level: 1 })).toHaveText(UI.aboutYouTitle);
	// Every question keeps its own label, because none of them was promoted.
	await expect(page.getByText(UI.heightShort, { exact: true })).toBeVisible();
	await expect(page.getByText(UI.weightShort, { exact: true })).toBeVisible();
});

test('a single-question screen lets the question be the heading', async ({ page }) => {
	await walkTo(page, 'medical-conditions');

	await expect(page.getByRole('heading', { level: 1 })).toHaveText(UI.diseasesQuestion);
	await expect(page.getByText(UI.selectAll, { exact: true })).toBeVisible();
});

test('the OR rule separates the list from the answer that declines it', async ({ page }) => {
	await walkTo(page, 'medical-conditions');

	// Decorative: drawn, and hidden from the accessibility tree, so it is neither an option nor
	// a stop on the way to one. Both halves in one locator, because finding it only by its
	// text would pass on a rule that announced itself.
	const rule = page.locator('[aria-hidden="true"]').filter({ hasText: UI.orRule });
	await expect(rule).toHaveCount(1);
	await expect(rule).toBeVisible();
	await expect(page.getByRole('checkbox', { name: UI.noneOfThese, exact: true })).toBeVisible();
});

test('a question with no none row draws no rule', async ({ page }) => {
	await walkTo(page, 'medication-history');

	// `pastMedication` has a pinned "never" instead, which is an answer rather than a sentinel.
	await expect(page.getByText(UI.orRule, { exact: true })).toHaveCount(0);
	await expect(page.getByRole('radio', { name: UI.neverTaken, exact: true })).toBeVisible();
});

test('the details panel opens and closes with the medication', async ({ page }) => {
	await walkTo(page, 'medication-history');

	// The dose is a radio group, so its control ids are per option; the group itself has none.
	const dose = page.getByRole('radio', { name: '2,5 mg', exact: true });
	await expect(dose).toHaveCount(0);

	await page.getByRole('radio', { name: 'Mounjaro', exact: true }).click();
	await expect(page.getByText(UI.mounjaroDetails, { exact: true })).toBeVisible();
	await expect(dose).toBeVisible();
	await expect(page.locator('#q-pastMedicationDuration')).toBeVisible();
	await expect(page.locator('#q-pastMedicationLastDose')).toBeVisible();

	await page.getByRole('radio', { name: UI.neverTaken, exact: true }).click();
	await expect(page.getByText(UI.mounjaroDetails, { exact: true })).toHaveCount(0);
	await expect(dose).toHaveCount(0);
});

test('an error clears when the answer it describes changes', async ({ page }) => {
	await walkTo(page, 'your-details');

	await page.getByRole('button', { name: UI.continue }).click();
	const error = page.getByText(UI.requiredField(UI.firstNameShort));
	await expect(error).toBeVisible();

	// Both verdicts describe the answer they were given, so neither survives it being
	// replaced. Without this the message stayed on screen above a filled field.
	await page.locator('#q-firstName').fill('Jonas');
	await expect(page.locator('#q-firstName')).not.toHaveAttribute('aria-invalid', 'true');
	// The siblings still report: only the answer that changed is undescribed.
	await expect(page.locator('#q-lastName')).toHaveAttribute('aria-invalid', 'true');
});

test('an invalid submit moves focus to the first field in error', async ({ page }) => {
	await walkTo(page, 'your-details');

	await page.getByRole('button', { name: UI.continue }).click();

	// Otherwise focus stays on Continue, below the message, and a screen reader hears that
	// there is a problem while sitting nowhere near it.
	await expect(page.locator('#q-firstName')).toBeFocused();
});
