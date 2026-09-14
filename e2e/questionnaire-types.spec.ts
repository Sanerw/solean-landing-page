import { expect, test, type Page } from '@playwright/test';
import { UI } from './ui-labels';
import { walkTo } from './answers';
import { dateOfBirthField, selectDateOfBirth, typeDateOfBirth } from './date-picker';

/**
 * One spec per control kind our definition uses, and one walk through all of them.
 *
 * From feature 24d the questions are Solean's, so what is asserted here is our wording and
 * our validation. RxScale's own rules still apply, from the committed snapshot, but they
 * judge complete answers and so are not what a missing one reports.
 */

async function ready(page: Page): Promise<void> {
	await expect(page.getByRole('button', { name: UI.continue })).toBeEnabled();
}

/** The first screen answered except for the one thing a test is about. */
async function aboutYouExcept(page: Page, omit: 'date' | 'none' = 'none'): Promise<void> {
	await walkTo(page, 'about-you');
	await ready(page);
	await page.getByRole('radio', { name: 'Männlich', exact: true }).click();
	if (omit !== 'date') await selectDateOfBirth(page);
	await page.locator('#q-heightCm').fill('178');
	await page.locator('#q-weightKg').fill('90');
}

test('a date of birth is required, and ours is the message that says so', async ({ page }) => {
	await aboutYouExcept(page, 'date');

	await page.getByRole('button', { name: UI.continue }).click();

	await expect(page.getByText(UI.requiredField(UI.dateOfBirthShort))).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/about-you');

	await selectDateOfBirth(page);
	await expect(dateOfBirthField(page)).toHaveValue('14/05/1990');
	await page.getByRole('button', { name: UI.continue }).click();
	await expect(page).toHaveURL('/questionnaire/your-details');
});

test('the date of birth can be typed as well as picked', async ({ page }) => {
	await walkTo(page, 'about-you');

	// Digits alone. The field puts the separators in, so nobody has to guess whether it wants
	// dots or slashes.
	await typeDateOfBirth(page, '14051990');
	await expect(dateOfBirthField(page)).toHaveValue('14/05/1990');
});

test('the date field takes digits and nothing else', async ({ page }) => {
	await walkTo(page, 'about-you');

	const field = dateOfBirthField(page);
	await field.click();

	// Refused at the keystroke, so nothing appears at all. Stripping them afterwards would
	// leave letters on screen whenever the masked value did not change.
	await page.keyboard.type('abc');
	await expect(field).toHaveValue('');

	await page.keyboard.type('14ab05cd1990');
	await expect(field).toHaveValue('14/05/1990');
});

test('a typed date that does not exist is not an answer', async ({ page }) => {
	await aboutYouExcept(page, 'date');

	// 31 February. Rolling it into 3 March would record a birth date nobody typed, so the
	// picker emits nothing at all and the answer stays empty.
	await typeDateOfBirth(page, '31021991');
	await expect(dateOfBirthField(page)).toHaveValue('31/02/1991');

	await page.getByRole('button', { name: UI.continue }).click();
	// "Required" rather than "not a date", because that is what an unemitted value is. The
	// wording is worth revisiting in 24e: the field visibly holds text while the message says
	// nothing was answered. Unchanged from before the switch, so not a regression.
	await expect(page.getByText(UI.requiredField(UI.dateOfBirthShort))).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/about-you');
});

test('a measurement outside the plausible band reports on the control that failed', async ({
	page
}) => {
	await aboutYouExcept(page);
	await page.locator('#q-heightCm').fill('5');

	await page.getByRole('button', { name: UI.continue }).click();

	// The bounds are RxScale's, but the check is ours: theirs reads "please check what you
	// entered" too, and it is a typo check rather than a medical decision.
	await expect(page.getByText(UI.outOfRange(UI.heightShort))).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/about-you');

	await page.locator('#q-heightCm').fill('178');
	await page.getByRole('button', { name: UI.continue }).click();
	await expect(page).toHaveURL('/questionnaire/your-details');
});

test('a malformed e-mail is refused before anything is sent', async ({ page }) => {
	await walkTo(page, 'your-details');
	await page.locator('#q-firstName').fill('Jonas');
	await page.locator('#q-lastName').fill('Weber');
	await page.locator('#q-email').fill('nicht-eine-adresse');

	await page.getByRole('button', { name: UI.continue }).click();

	await expect(page.getByText(UI.invalidEmail)).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/your-details');
});

test('"none of the above" is exclusive, in both directions', async ({ page }) => {
	// survey-core used to enforce this. From feature 24c it is ours, in `choice-behaviour.ts`,
	// and the validator that used to be the only guard is now only the backstop.
	await walkTo(page, 'medical-conditions');
	await ready(page);

	const condition = page.getByRole('checkbox', { name: 'Nierenerkrankung', exact: true });
	const none = page.getByRole('checkbox', { name: 'Keine der Genannten', exact: true });

	await condition.click();
	await expect(condition).toBeChecked();

	await none.click();
	await expect(none).toBeChecked();
	await expect(condition).not.toBeChecked();

	await condition.click();
	await expect(none).not.toBeChecked();
});

test('an "other" choice reveals a free text, and requires it', async ({ page }) => {
	await walkTo(page, 'medical-conditions');
	await ready(page);

	const free = page.locator('#q-diseases-other-text');
	await expect(free).toHaveCount(0);

	await page.getByRole('checkbox', { name: 'Andere', exact: true }).click();
	await expect(free).toBeVisible();

	// Chosen but not described is not an answer.
	await page.getByRole('button', { name: UI.continue }).click();
	await expect(page.getByText('Bitte beschreibe, was Du mit "Andere" meinst.')).toBeVisible();

	await free.fill('Sarkoidose');
	await page.getByRole('button', { name: UI.continue }).click();
	await expect(page).toHaveURL('/questionnaire/health-history');
});

test('the dose offers the scale of the medication that was named', async ({ page }) => {
	// The one question whose options depend on an earlier answer, which is why 24a made
	// `options` a function at all.
	await walkTo(page, 'medication-history');
	await ready(page);

	await page.getByRole('radio', { name: 'Mounjaro', exact: true }).click();
	await expect(page.getByRole('radio', { name: '2,5 mg', exact: true })).toBeVisible();
	await expect(page.getByRole('radio', { name: '15 mg', exact: true })).toBeVisible();

	// Wegovy's scale stops at 2,4 mg and has no 15 mg at all.
	await page.getByRole('radio', { name: 'Wegovy', exact: true }).click();
	await expect(page.getByRole('radio', { name: '2,4 mg', exact: true })).toBeVisible();
	await expect(page.getByRole('radio', { name: '15 mg', exact: true })).toHaveCount(0);
});

test('the contact fields carry their own keyboard, hint and description', async ({ page }) => {
	await walkTo(page, 'your-details');

	const email = page.locator('#q-email');
	await expect(email).toHaveAttribute('type', 'email');
	await expect(email).toHaveAttribute('placeholder', 'name@example.com');

	// The SMS caption is the only description left on this screen: the artboard draws nothing
	// under the e-mail, so RxScale's confidentiality line is not transcribed there.
	const phone = page.locator('#q-phone');
	await expect(phone).toHaveAttribute('type', 'tel');
	// The national part alone, and a number the rule actually accepts: the old example was
	// short by a digit, so the field it was teaching turned red the moment it was copied.
	await expect(phone).toHaveAttribute('placeholder', '0151 12345678');
	await expect(phone).toHaveAttribute('aria-describedby', /q-phone-description/);
	await expect(page.locator('#q-phone-description')).toHaveText(
		'Erhalte Bestellupdates, exklusive Rabatte und Tipps per SMS. Jederzeit abbestellbar.'
	);

	await expect(page.getByRole('button', { name: UI.phoneCountry })).toHaveText(/\+49/);
});

/**
 * The rule is libphonenumber's, against the country's own plan. What this proves in a browser
 * is the half the unit tests cannot: that the selector and the box compose one number, and
 * that a national number typed the way a German writes one is accepted rather than refused.
 */
test('the phone is judged against a real numbering plan', async ({ page }) => {
	await walkTo(page, 'your-details');
	await page.locator('#q-firstName').fill('Jonas');
	await page.locator('#q-lastName').fill('Weber');
	await page.locator('#q-email').fill('jonas@example.com');

	// Digits the German plan cannot issue. The old character class accepted this.
	await page.locator('#q-phone').fill('123456');
	await page.getByRole('button', { name: UI.continue }).click();
	await expect(page.getByText(UI.invalidPhone)).toBeVisible();
	await expect(page).toHaveURL('/questionnaire/your-details');

	await page.locator('#q-phone').fill('0151 12345678');
	await page.getByRole('button', { name: UI.continue }).click();
	await expect(page).not.toHaveURL('/questionnaire/your-details');
});

test('the country selector composes the number with the country chosen', async ({ page }) => {
	await walkTo(page, 'your-details');
	await page.locator('#q-firstName').fill('Jonas');
	await page.locator('#q-lastName').fill('Weber');
	await page.locator('#q-email').fill('jonas@example.com');

	const selector = page.getByRole('button', { name: UI.phoneCountry });
	await selector.click();
	await page.getByRole('option', { name: /Österreich/ }).click();
	await expect(selector).toHaveText(/\+43/);

	// Picking a country is never the last thing anybody wants to do here, so the caret goes
	// where the rest of the answer has to be typed.
	await expect(page.locator('#q-phone')).toBeFocused();

	// A Vienna landline, which is invalid under +49 and valid under +43: the number alone does
	// not decide it, so this is the selector being read rather than ignored.
	await page.locator('#q-phone').fill('1 5811234');
	await page.getByRole('button', { name: UI.continue }).click();
	await expect(page).not.toHaveURL('/questionnaire/your-details');
});

/**
 * 245 countries is more than a list anybody scrolls. The filter matches the name a person
 * reads and the code they may know instead, which is why the dial code is a keyword rather
 * than only a column.
 */
test('the country list is filtered by name and by dial code', async ({ page }) => {
	await walkTo(page, 'your-details');
	await page.getByRole('button', { name: UI.phoneCountry }).click();

	const search = page.getByPlaceholder(UI.phoneCountrySearch);
	await search.fill('pol');
	await expect(page.getByRole('option', { name: /Polen/ })).toBeVisible();
	await expect(page.getByRole('option', { name: /Deutschland/ })).toBeHidden();

	// Best first, and it is the Enter key that cares: alphabetically Französisch-Polynesien
	// comes before Polen, so the row order is the difference between the right country and
	// the wrong one.
	await expect(page.getByRole('option').first()).toContainText('Polen');

	await search.fill('+48');
	await expect(page.getByRole('option', { name: /Polen/ })).toBeVisible();

	await search.fill('zzzz');
	await expect(page.getByText(UI.phoneCountryEmpty)).toBeVisible();

	// The keyboard alone has to get from the filter to a chosen country and back to the number.
	await search.fill('Schweiz');
	await page.keyboard.press('ArrowDown');
	await page.keyboard.press('Enter');
	await expect(page.getByRole('button', { name: UI.phoneCountry })).toHaveText(/\+41/);
	await expect(page.locator('#q-phone')).toBeFocused();
});

test('a valid number is tidied once, when the field is left', async ({ page }) => {
	await walkTo(page, 'your-details');
	await page.locator('#q-phone').fill('015112345678');
	// Still exactly as typed: reformatting between keystrokes moves the caret.
	await expect(page.locator('#q-phone')).toHaveValue('015112345678');

	await page.locator('#q-email').click();
	await expect(page.locator('#q-phone')).toHaveValue('01511 2345678');
});
