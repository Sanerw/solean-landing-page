import { expect, test } from '@playwright/test';

/**
 * Finding F-07: bits-ui emits role="tab" and role="tabpanel" but never links them, so a
 * screen reader on a tab is not told which region it controls. The pairing now comes from
 * the primitive, and this asserts it from the rendered page rather than from the source.
 */
test('every tab is associated with the panel it controls', async ({ page }) => {
	await page.goto('/');

	const tabs = page.getByRole('tab');
	await expect(tabs).not.toHaveCount(0);

	for (const tab of await tabs.all()) {
		const controls = await tab.getAttribute('aria-controls');
		expect(controls, 'a tab must name the panel it controls').toBeTruthy();

		const tabId = await tab.getAttribute('id');
		expect(tabId, 'a panel needs a tab id to point back at').toBeTruthy();

		// Only the selected panel is mounted, so an absent panel is expected for the others.
		const panel = page.locator(`#${controls}`);
		if ((await panel.count()) > 0) {
			await expect(panel).toHaveAttribute('aria-labelledby', tabId!);
		}
	}
});
