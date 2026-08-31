import { expect, test, type Page } from '@playwright/test';
import { selectDateOfBirth } from './date-picker';

/**
 * Every step of the questionnaire, at the widths people actually use. The rule changes with
 * the width, because "fits without scrolling" is a desktop rule: on a phone a long question
 * scrolls, and asserting otherwise would only teach us to cut content.
 */
const VIEWPORTS = [
	{ width: 390, height: 844 },
	{ width: 768, height: 1024 },
	{ width: 1440, height: 900 },
	{ width: 1920, height: 1040 }
] as const;

/** Below this the layout is expected to scroll vertically. */
const DESKTOP_FROM = 1024;

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

	// Horizontal overflow is a defect at every width: nothing here is meant to scroll sideways.
	expect(metrics.scrollWidth, `${step} must not overflow horizontally`).toBeLessThanOrEqual(
		metrics.clientWidth
	);

	// The action has to be reachable and whole. Scrolled to on a phone, already on screen on a
	// desktop, and inside the viewport's width either way.
	await action.scrollIntoViewIfNeeded();
	const actionBox = await action.boundingBox();
	expect(actionBox, `${step} must render its primary action`).not.toBeNull();
	expect(actionBox?.x ?? -1, `${step} must not clip its primary action on the left`).toBeGreaterThanOrEqual(0);
	expect(
		(actionBox?.x ?? 0) + (actionBox?.width ?? metrics.clientWidth + 1),
		`${step} must not clip its primary action on the right`
	).toBeLessThanOrEqual(metrics.clientWidth);

	if (metrics.clientWidth < DESKTOP_FROM) return;

	expect(metrics.scrollHeight, `${step} must fit without vertical scrolling`).toBeLessThanOrEqual(
		metrics.clientHeight
	);
	expect(
		(actionBox?.y ?? metrics.clientHeight) + (actionBox?.height ?? 1),
		`${step} must show the full primary action`
	).toBeLessThanOrEqual(metrics.clientHeight);
}

for (const viewport of VIEWPORTS) {
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
		await selectDateOfBirth(page);
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
