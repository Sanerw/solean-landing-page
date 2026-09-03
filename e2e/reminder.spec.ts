import { expect, test, type Page } from '@playwright/test';
import { walkAndSubmit, walkTo, stepIsInteractive } from './answers';
import { UI } from './ui-labels';

/**
 * The abandoned-questionnaire reminder, asserted on what the browser actually sends.
 *
 * The harness runs with both Customer.io credentials blank (`playwright.config.ts`), so
 * `/api/reminder` answers as an unconfigured deployment and no request reaches the vendor.
 * That is the point: these specs prove the two signals leave at the right moments carrying the
 * right thing, without enrolling anybody on the real workspace.
 *
 * Requests are observed rather than intercepted, so the endpoint really runs and really
 * answers. Asserting against the vendor's own state would be wrong anyway: profile creation
 * there is asynchronous.
 *
 * **The guard itself cannot be proven from here, and do not try.** The outbound call is made by
 * the server, in the `webServer` process, so `page.on('request')` never sees it: an assertion
 * that no request reached `customer.io` would pass whether the guard worked or not. What proves
 * it is `client.test.ts`, which asserts that an unconfigured pair makes no call at all, plus the
 * blanked variables in `playwright.config.ts`.
 */

interface Signal {
	stage?: unknown;
	email?: unknown;
}

function captureReminders(page: Page): Signal[] {
	const signals: Signal[] = [];

	page.on('request', (request) => {
		if (request.method() !== 'POST') return;
		if (new URL(request.url()).pathname !== '/api/reminder') return;

		try {
			signals.push(JSON.parse(request.postData() ?? '{}'));
		} catch {
			signals.push({});
		}
	});

	return signals;
}

test('nothing is signalled before the address has been answered', async ({ page }) => {
	const signals = captureReminders(page);

	// `page30` is the e-mail question, left open by `walkTo`.
	await walkTo(page, 'page30');
	await page.waitForTimeout(300);

	expect(signals).toEqual([]);
});

test('the watch starts on the step that answers the e-mail, once', async ({ page }) => {
	const signals = captureReminders(page);

	// Past the e-mail question and several steps beyond it. Continue runs the same code every
	// time, so this is where a missing guard would show up as a signal per step.
	await walkTo(page, 'page1');
	await expect.poll(() => signals.length).toBe(1);

	await page.getByRole('checkbox', { name: 'Knie- oder Hüftarthrose' }).click();
	await page.getByRole('button', { name: UI.continue }).click();
	await stepIsInteractive(page);

	expect(signals).toEqual([{ stage: 'email_captured', email: 'jonas@example.com' }]);
});

test('submitting ends the watch', async ({ page }) => {
	const signals = captureReminders(page);

	await walkAndSubmit(page);
	await expect(page).toHaveURL('/questionnaire/complete');
	await expect.poll(() => signals.length).toBe(2);

	expect(signals).toEqual([
		{ stage: 'email_captured', email: 'jonas@example.com' },
		{ stage: 'submitted', email: 'jonas@example.com' }
	]);
});

test('the signals carry the stage and the address, and nothing else', async ({ page }) => {
	const signals = captureReminders(page);

	// An address that shares no substring with the name answered on `page27`, so the leak check
	// below cannot pass by matching the e-mail it is supposed to allow.
	const email = 'funnel-check@example.com';

	await walkAndSubmit(page, { email });
	await expect.poll(() => signals.length).toBe(2);

	// Exact keys rather than an absence check, so a field added later fails here instead of
	// travelling to a marketing processor unnoticed.
	for (const signal of signals) {
		expect(Object.keys(signal).sort()).toEqual(['email', 'stage']);
	}

	/**
	 * The privacy boundary, asserted against what left the browser. This walk answers a name, a
	 * date of birth, a diagnosis and a side effect, and submits an anamnesis. None of it is the
	 * reminder's business.
	 */
	const payload = JSON.stringify(signals).toLowerCase();
	expect(payload).toContain(email);
	for (const leak of ['jonas', 'weber', '1990', 'hüftarthrose', 'übelkeit', 'anam-']) {
		expect(payload, leak).not.toContain(leak);
	}
});
