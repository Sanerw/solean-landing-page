import { expect, test, type Page } from '@playwright/test';
import { walkAndSubmit } from './answers';
import { orderPlan } from './recommendation';

/**
 * The consent gate and the three funnel events. Every request to Mixpanel is intercepted and
 * answered here, so the run proves what the app sends without sending it anywhere: the point
 * of the spec is the payload and the gate, not Mixpanel's own ingestion.
 *
 * This is the one spec that runs undecided. The rest of the suite carries a declined cookie
 * from the Playwright config, because the banner is fixed to the bottom of the viewport and
 * would sit over the Continue button they press.
 */

test.use({ storageState: { cookies: [], origins: [] } });

interface Captured {
	event: string;
	properties: Record<string, unknown>;
}

/**
 * Mixpanel's JS client posts a form body whose `data` field is the batch, base64 by default
 * and JSON when the payload format is set. Both are decoded, because which one is used is the
 * library's choice rather than ours and a spec that assumed one would break on an upgrade.
 */
function decode(body: string | null): Captured[] {
	if (!body) return [];

	const raw = new URLSearchParams(body).get('data') ?? body;
	const text = raw.trim().startsWith('[') || raw.trim().startsWith('{')
		? raw
		: Buffer.from(raw, 'base64').toString('utf8');

	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		return [];
	}

	const batch = Array.isArray(parsed) ? parsed : [parsed];

	return batch.map((entry) => ({
		event: String((entry as { event?: unknown }).event ?? ''),
		properties: ((entry as { properties?: Record<string, unknown> }).properties ?? {})
	}));
}

/** Intercepts the ingestion host and collects every event the app tried to send. */
async function captureMixpanel(page: Page): Promise<Captured[]> {
	const captured: Captured[] = [];

	await page.route('**://*.mixpanel.com/**', async (route) => {
		captured.push(...decode(route.request().postData()));
		await route.fulfill({ status: 200, contentType: 'text/plain', body: '1' });
	});

	return captured;
}

const names = (captured: Captured[]) => captured.map((entry) => entry.event);

/**
 * Mixpanel batches, and its default flush interval is five seconds, so an assertion on the
 * default expect timeout races the library rather than the app. The batch is persisted and
 * retried, so a slow flush delays an event; it does not lose one.
 */
const FLUSH = { timeout: 15_000 };

function awaitEvent(captured: Captured[], event: string) {
	return expect.poll(() => names(captured), FLUSH).toContain(event);
}

test('nothing reaches Mixpanel before the visitor has answered the banner', async ({ page }) => {
	const captured = await captureMixpanel(page);

	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Einverstanden' })).toBeVisible();

	// Not merely no events: the SDK itself must not have been fetched, so a refusal is visible
	// in a network log rather than only in a flag inside a script that already ran.
	await page.goto('/learn');
	await page.waitForTimeout(500);

	expect(captured).toEqual([]);
});

test('declining is remembered, and stays silent across a navigation', async ({ page }) => {
	const captured = await captureMixpanel(page);

	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Ablehnen' })).toBeEnabled();
	await page.getByRole('button', { name: 'Ablehnen' }).click();

	await page.goto('/learn');
	await page.waitForTimeout(500);

	expect(captured).toEqual([]);
	await expect(page.getByRole('button', { name: 'Ablehnen' })).toBeHidden();
});

test('accepting sends the page view for the page the banner was answered on', async ({ page }) => {
	const captured = await captureMixpanel(page);

	await page.goto('/');
	// Enabled only once hydrated, so this is also the wait for the handler to exist.
	await expect(page.getByRole('button', { name: 'Einverstanden' })).toBeEnabled();
	await page.getByRole('button', { name: 'Einverstanden' }).click();

	// The arrival itself, which is the view that is lost if consent is not what re-triggers it.
	await awaitEvent(captured, 'page_viewed');
	expect(captured.find((entry) => entry.event === 'page_viewed')?.properties.path).toBe('/');
	await expect(page.getByRole('button', { name: 'Einverstanden' })).toBeHidden();
});

test('a questionnaire step is never sent as a page view', async ({ page }) => {
	const captured = await captureMixpanel(page);

	await page.goto('/');
	// Enabled only once hydrated, so this is also the wait for the handler to exist.
	await expect(page.getByRole('button', { name: 'Einverstanden' })).toBeEnabled();
	await page.getByRole('button', { name: 'Einverstanden' }).click();
	await awaitEvent(captured, 'page_viewed');

	await page.goto('/questionnaire');
	await expect(page).toHaveURL(/\/questionnaire\/page\d+/);
	await page.waitForTimeout(500);

	// Which steps a person is shown is decided by the model's branching, so a step path is
	// derived from their answers. No `page_viewed` may name one.
	const paths = captured
		.filter((entry) => entry.event === 'page_viewed')
		.map((entry) => String(entry.properties.path));

	expect(paths.some((path) => path.startsWith('/questionnaire'))).toBe(false);
});

test('the funnel sends its three events, carrying nothing about the person', async ({ page }) => {
	const captured = await captureMixpanel(page);

	await page.goto('/');
	// Enabled only once hydrated, so this is also the wait for the handler to exist.
	await expect(page.getByRole('button', { name: 'Einverstanden' })).toBeEnabled();
	await page.getByRole('button', { name: 'Einverstanden' }).click();
	await awaitEvent(captured, 'page_viewed');

	await walkAndSubmit(page);
	await expect(page).toHaveURL('/questionnaire/complete');
	await awaitEvent(captured, 'anamnesis_submitted');

	await orderPlan(page, { mode: 'prescription' });
	await awaitEvent(captured, 'checkout_started');

	expect(names(captured)).toContain('questionnaire_started');

	const submitted = captured.find((entry) => entry.event === 'anamnesis_submitted');
	expect(submitted?.properties.survey_step_count).toBeGreaterThan(0);

	const checkout = captured.find((entry) => entry.event === 'checkout_started');
	expect(checkout?.properties.plan_mode).toBe('prescription');
	expect(checkout?.properties.has_recommendation).toBe(true);

	// The privacy boundary, asserted against what actually left the browser rather than
	// against the module that built it. The answers, the address and the uid stay here.
	const payload = JSON.stringify(captured).toLowerCase();
	for (const leak of ['jonas@example.com', 'anamnesis_uid', 'anam-', 'variant']) {
		expect(payload).not.toContain(leak);
	}
});
