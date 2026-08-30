import { test } from '@playwright/test';

/**
 * Not an assertion suite: it walks the funnel and captures each screen so the artboards can
 * be compared by eye. The guard makes these steps unreachable by URL, which is why they
 * cannot simply be visited.
 */
test('capture every questionnaire screen', async ({ page }) => {
	const shot = (name: string) => page.screenshot({ path: `screens/${name}.png`, fullPage: true });

	await page.goto('/questionnaire/about-you');
	await page.getByRole('radio', { name: 'Male', exact: true }).click();
	await page.getByLabel('Height').fill('178');
	await page.getByLabel('Weight').fill('96');
	await shot('01-about-you');
	await page.getByRole('button', { name: 'Continue' }).click();

	await page.getByLabel('First name').fill('Jonas');
	await page.getByLabel('Last name').fill('Weber');
	await page.getByLabel('E-mail address').fill('jonas@example.com');
	await shot('02-your-details');
	await page.getByRole('button', { name: 'Continue' }).click();

	await page.getByRole('checkbox', { name: 'None of these' }).click();
	await shot('03-pregnancy');
	await page.getByRole('button', { name: 'Continue' }).click();

	await shot('04-projection');
	await page.getByRole('button', { name: 'Continue' }).click();

	await page.getByRole('checkbox', { name: 'None of the above' }).click();
	await shot('05-medical-conditions');
	await page.getByRole('button', { name: 'Continue' }).click();

	await page.getByRole('checkbox', { name: 'None of the above' }).click();
	await page.getByRole('radio', { name: 'No', exact: true }).click();
	await shot('06-health-history');
	await page.getByRole('button', { name: 'Continue' }).click();

	await shot('07-motivation');
	await page.getByRole('button', { name: 'Continue' }).click();

	await page.getByRole('radio', { name: 'No', exact: true }).click();
	await page.getByRole('checkbox', { name: 'None of the above' }).click();
	await shot('08-eating-disorders');
	await page.getByRole('button', { name: 'Continue' }).click();

	await page.getByRole('checkbox', { name: 'None of the above' }).click();
	await page.getByRole('radio', { name: 'No', exact: true }).click();
	await shot('09-allergies-medications');
});
