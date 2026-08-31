import { expect, test, type Page } from '@playwright/test';

const DESKTOP_VIEWPORTS = [
	{ width: 1440, height: 900 },
	{ width: 1920, height: 1040 }
] as const;

async function ready(page: Page, step: string): Promise<void> {
	await expect(page).toHaveURL(`/questionnaire/${step}`);
	await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
}

async function fitsViewport(
	page: Page,
	step: string,
	actionName: 'Continue' | 'Place your order' = 'Continue'
): Promise<void> {
	const action = page.getByRole('button', { name: actionName });
	await expect(action).toBeVisible();

	const metrics = await page.evaluate(() => ({
		clientHeight: document.documentElement.clientHeight,
		clientWidth: document.documentElement.clientWidth,
		scrollHeight: document.documentElement.scrollHeight,
		scrollWidth: document.documentElement.scrollWidth
	}));
	const actionBox = await action.boundingBox();

	expect(metrics.scrollWidth, `${step} must not overflow horizontally`).toBeLessThanOrEqual(
		metrics.clientWidth
	);
	expect(metrics.scrollHeight, `${step} must fit without vertical scrolling`).toBeLessThanOrEqual(
		metrics.clientHeight
	);
	expect(actionBox, `${step} must render its primary action`).not.toBeNull();
	expect(
		(actionBox?.y ?? metrics.clientHeight) + (actionBox?.height ?? 1),
		`${step} must show the full primary action`
	).toBeLessThanOrEqual(metrics.clientHeight);
}

for (const viewport of DESKTOP_VIEWPORTS) {
	test(`every questionnaire step fits at ${viewport.width}x${viewport.height}`, async ({
		page
	}) => {
		await page.setViewportSize(viewport);
		const advance = () => page.getByRole('button', { name: 'Continue' }).click();

		await page.goto('/questionnaire');
		await ready(page, 'page30');
		await fitsViewport(page, 'page30');
		await advance();

		await ready(page, 'page27');
		await page.getByLabel('Bitte gib Deinen Vornamen an.').fill('Jonas');
		await page.getByLabel('Bitte gib Deinen Nachnamen an.').fill('Weber');
		await fitsViewport(page, 'page27');
		await advance();

		await ready(page, 'page26');
		await page.getByRole('textbox').fill('1990-05-14');
		await fitsViewport(page, 'page26');
		await advance();

		await ready(page, 'page3');
		await page.getByRole('radio', { name: 'Weiblich' }).click();
		await fitsViewport(page, 'page3');
		await advance();

		await ready(page, 'page4');
		await page.getByRole('radio', { name: 'Nein' }).click();
		await fitsViewport(page, 'page4');
		await advance();

		await ready(page, 'page2');
		await page.getByLabel('Größe (cm)').fill('178');
		await page.getByLabel('Gewicht (kg)').fill('90');
		await fitsViewport(page, 'page2');
		await advance();

		await expect(page).toHaveURL('/questionnaire/projection');
		await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
		await fitsViewport(page, 'projection');
		await advance();

		await ready(page, 'page1');
		await page.getByRole('checkbox', { name: 'Knie- oder Hüftarthrose' }).click();
		await fitsViewport(page, 'page1');
		await advance();

		await ready(page, 'page16');
		await page.getByRole('checkbox', { name: 'Keine der Genannten' }).click();
		await fitsViewport(page, 'page16');
		await advance();

		await expect(page).toHaveURL('/questionnaire/motivation');
		await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
		await fitsViewport(page, 'motivation');
		await advance();

		await ready(page, 'page18');
		await page.getByRole('radio', { name: 'Andere' }).click();
		await page.getByRole('textbox').fill('Metformin 500mg');
		await fitsViewport(page, 'page18');
		await advance();

		await ready(page, 'page22');
		await page.getByRole('radio', { name: 'Ja' }).click();
		await fitsViewport(page, 'page22');
		await advance();

		await ready(page, 'page23');
		await page.getByRole('textbox').fill('Leichte Übelkeit in der ersten Woche.');
		await fitsViewport(page, 'page23');
		await advance();

		await expect(page).toHaveURL('/questionnaire/complete');
		await fitsViewport(page, 'complete', 'Place your order');
	});
}
