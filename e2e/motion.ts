import type { Locator, Page } from '@playwright/test';

/**
 * Reads the whole page the way a visitor does, so nothing is still mid-entrance when it is
 * measured or scanned. Necessary rather than tidy: a section that has never been in view keeps
 * `opacity: 0`, which an automated contrast check reports as unreadable text.
 */
export async function settledPage(page: Page): Promise<void> {
	await page.evaluate(async () => {
		const step = window.innerHeight * 0.8;
		for (let y = 0; y < document.body.scrollHeight; y += step) {
			window.scrollTo(0, y);
			await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
		}
		window.scrollTo(0, 0);
	});

	await page.waitForFunction(
		() =>
			!document.querySelector('[data-reveal]') &&
			document.getAnimations().every((animation) => animation.playState !== 'running')
	);
}

/**
 * Waits until a section has finished entering, so geometry can be measured rather than caught
 * mid-flight. Scrolling is part of the wait, not a precondition: the reveal is driven by an
 * IntersectionObserver, so a section nobody has looked at stays hidden forever and a bare wait
 * would hang instead of settling.
 */
export async function settledInView(locator: Locator): Promise<void> {
	await locator.scrollIntoViewIfNeeded();

	const handle = await locator.elementHandle();
	if (!handle) throw new Error('settledInView: the locator matched no element');

	await locator.page().waitForFunction(
		(element) =>
			!element.querySelector('[data-reveal]') &&
			element.getAnimations({ subtree: true }).every((animation) => animation.playState !== 'running'),
		handle
	);
}
