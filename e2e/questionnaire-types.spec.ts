import { expect, test, type Page } from '@playwright/test';
import { seedAnswers, THROUGH_ALLERGY, THROUGH_GENDER, THROUGH_NAME } from './answers';
import { selectDateOfBirth } from './date-picker';

/**
 * One spec per question type the live model uses, and one walk through all of them. Every
 * label, option and message asserted here comes from the fixture questionnaire, which is a
 * trimmed copy of the real one, so a change in RxScale's model shows up as a failure here
 * rather than as a silent gap in the flow.
 */

async function ready(page: Page): Promise<void> {
	await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
}

test('the date of birth is required by the model, not by the renderer', async ({ page }) => {
	await seedAnswers(page, THROUGH_NAME);
	await page.goto('/questionnaire/page26');
	await ready(page);

	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(
		page.getByText('Der Arzt benötigt diese Angaben zur Erstellung Deines Rezeptes.')
	).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/page26');

	await selectDateOfBirth(page);
	await expect(page.getByLabel('Bitte gib Dein Geburtsdatum an')).toHaveText('14.05.1990');
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page).toHaveURL('/questionnaire/page3');
});

test('a composite question reports its failure on the control that failed', async ({ page }) => {
	await seedAnswers(page, THROUGH_GENDER);
	await page.goto('/questionnaire/page2');
	await ready(page);

	await page.getByLabel('Größe (cm)').fill('5');
	await page.getByLabel('Gewicht (kg)').fill('96');
	await page.getByRole('button', { name: 'Continue' }).click();

	// The model's own range message, attached to the height item rather than to the question.
	await expect(page.getByText('Bitte überprüfe Deine Angaben.')).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/page2');

	await page.getByLabel('Größe (cm)').fill('178');
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page).not.toHaveURL('/questionnaire/page2');
});

test('the exclusive option is the engine\'s, not ours', async ({ page }) => {
	await seedAnswers(page, THROUGH_GENDER);
	await page.goto('/questionnaire/page2');
	await ready(page);
	// The model shows the conditions question only for a BMI between 27 and 30, so the walk
	// has to arrive there with one.
	await page.getByLabel('Größe (cm)').fill('178');
	await page.getByLabel('Gewicht (kg)').fill('90');
	await page.getByRole('button', { name: 'Continue' }).click();

	// Solean's own projection sits between these two model pages.
	await expect(page).toHaveURL('/questionnaire/projection');
	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page).toHaveURL('/questionnaire/page1');
	await ready(page);

	const condition = page.getByRole('checkbox', { name: 'Knie- oder Hüftarthrose' });
	const none = page.getByRole('checkbox', { name: 'Keine der Genannten' });

	await condition.click();
	await expect(condition).toBeChecked();

	await none.click();
	await expect(none).toBeChecked();
	await expect(condition).not.toBeChecked();

	await condition.click();
	await expect(none).not.toBeChecked();
});

test('an "other" choice reveals the free text the model describes', async ({ page }) => {
	await seedAnswers(page, THROUGH_ALLERGY);
	await page.goto('/questionnaire/page18');
	await ready(page);

	const other = page.getByRole('radio', { name: 'Andere' });
	await expect(page.getByPlaceholder('Name  / Dosierung')).toHaveCount(0);

	await other.click();
	const free = page.getByPlaceholder('Name  / Dosierung');
	await expect(free).toBeVisible();

	await free.fill('Metformin 500mg');
	await page.getByRole('button', { name: 'Continue' }).click();
	await expect(page).toHaveURL('/questionnaire/page22');
});

test('every question in the model has a renderer', async ({ page }) => {
	await page.goto('/dev/questionnaire');

	const summary = await page.getByText(/of \d+ questions have a renderer/).innerText();
	const [mapped, total] = summary.match(/(\d+) of (\d+)/)!.slice(1).map(Number);
	expect(mapped).toBe(total);
});

test('the questionnaire can be answered from the first page to the last', async ({ page }) => {
	await page.goto('/questionnaire');
	await expect(page).toHaveURL('/questionnaire/page30');
	const email = page.getByLabel('Bitte gib Deine E-Mail ein:');
	await expect(email).toHaveAttribute('type', 'email');
	await expect(email).toHaveAttribute('placeholder', 'name@example.com');
	await expect(email).toHaveAttribute('aria-describedby', /q-EMail-description/);
	await expect(page.locator('#q-EMail-description')).toHaveText(
		'Deine Antworten werden vertraulich zwischen Dir und unserem Ärzteteam behandelt.'
	);
	await expect(email.locator('xpath=following-sibling::*[1]')).toHaveAttribute(
		'id',
		'q-EMail-description'
	);
	const infoAlert = page.locator('[data-slot="alert"]').filter({ hasText: 'Info:' });
	await expect(infoAlert).toBeVisible();
	await expect(infoAlert.locator('[data-slot="alert-title"]')).toHaveText('Info:');
	await expect(infoAlert.locator('[data-slot="alert-description"]')).toContainText(
		'Mit der Angabe Deiner E-Mail-Adresse bestätigst Du'
	);

	// The display-only element on this page states the consent notice the model carries in its
	// description, next to a question that asks for something.
	await expect(
		page.getByText('Mit der Angabe Deiner E-Mail-Adresse bestätigst Du')
	).toBeVisible();

	// The e-mail question is not required in this model, so the walk starts by moving on.
	await ready(page);
	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page).toHaveURL('/questionnaire/page27');
	await ready(page);
	await page.getByLabel('Bitte gib Deinen Vornamen an.').fill('Jonas');
	await page.getByLabel('Bitte gib Deinen Nachnamen an.').fill('Weber');
	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page).toHaveURL('/questionnaire/page26');
	await ready(page);
	await selectDateOfBirth(page);
	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page).toHaveURL('/questionnaire/page3');
	await ready(page);
	await page.getByRole('radio', { name: 'Männlich' }).click();
	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page).toHaveURL('/questionnaire/page2');
	await ready(page);
	await page.getByLabel('Größe (cm)').fill('178');
	await page.getByLabel('Gewicht (kg)').fill('90');
	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page).toHaveURL('/questionnaire/projection');
	await page.getByRole('button', { name: 'Continue' }).click();

	// The conditions question is behind the BMI answered above.
	await expect(page).toHaveURL('/questionnaire/page1');
	await ready(page);
	await page.getByRole('checkbox', { name: 'Knie- oder Hüftarthrose' }).click();
	await page.getByRole('button', { name: 'Continue' }).click();

	// The model accepts no allergies at all, or one typed into "Andere", and nothing else.
	await expect(page).toHaveURL('/questionnaire/page16');
	await ready(page);
	await page.getByRole('checkbox', { name: 'Keine der Genannten' }).click();
	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page).toHaveURL('/questionnaire/motivation');
	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page).toHaveURL('/questionnaire/page18');
	await ready(page);
	await page.getByRole('radio', { name: 'Wegovy', exact: true }).click();
	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page).toHaveURL('/questionnaire/page22');
	await ready(page);
	await page.getByRole('radio', { name: 'Ja' }).click();
	await page.getByRole('button', { name: 'Continue' }).click();

	// Answering yes opens the follow-up the model hides behind that answer.
	await expect(page).toHaveURL('/questionnaire/page23');
	await ready(page);
	await page.getByRole('textbox').fill('Leichte Übelkeit in der ersten Woche.');
	await page.getByRole('button', { name: 'Continue' }).click();

	await expect(page).toHaveURL('/questionnaire/complete');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Congratulations, you did it!');
});
