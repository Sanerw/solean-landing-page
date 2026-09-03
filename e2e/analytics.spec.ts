import { expect, test, type Page } from '@playwright/test';
import { walkAndSubmit, walkTo } from './answers';
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

/**
 * Mixpanel's own hosts. Events and replay data both go to `api-eu.mixpanel.com`, on the
 * `track/` and `record/` routes; `mxpnl.com` is covered so a run cannot reach the CDN either.
 * The recorder bundle is deliberately not among these: it is served from our own origin.
 */
const MIXPANEL_HOSTS = ['**://*.mixpanel.com/**', '**://*.mxpnl.com/**'];

interface Traffic {
	events: Captured[];
	/**
	 * Successful loads of the recorder bundle. The status matters: the SDK's default source is
	 * a 404 on Mixpanel's CDN, which Chrome then blocks, and a spec that only counted the
	 * request would pass while nothing was ever recorded.
	 */
	recorder: string[];
	/** Posts to `record/`, which is session replay data and nothing else. */
	replay: string[];
}

/** Intercepts Mixpanel's hosts, and watches our own origin for the recorder. */
async function captureMixpanel(page: Page): Promise<Traffic> {
	const traffic: Traffic = { events: [], recorder: [], replay: [] };

	page.on('response', (response) => {
		const url = response.url();
		if (url.includes('mixpanel-recorder') && response.status() === 200) {
			traffic.recorder.push(url);
		}
	});

	for (const pattern of MIXPANEL_HOSTS) {
		await page.route(pattern, async (route) => {
			const url = route.request().url();

			if (url.includes('/record')) {
				traffic.replay.push(url);
			} else if (url.includes('/track')) {
				traffic.events.push(...decode(route.request().postData()));
			}

			await route.fulfill({ status: 200, contentType: 'text/plain', body: '1' });
		});
	}

	return traffic;
}

const names = (captured: Captured[]) => captured.map((entry) => entry.event);

/**
 * Mixpanel batches, and its default flush interval is five seconds, so an assertion on the
 * default expect timeout races the library rather than the app. The batch is persisted and
 * retried, so a slow flush delays an event; it does not lose one.
 */
const FLUSH = { timeout: 15_000 };

function awaitEvent(traffic: Traffic, event: string) {
	return expect.poll(() => names(traffic.events), FLUSH).toContain(event);
}

test('nothing reaches Mixpanel before the visitor has answered the banner', async ({ page }) => {
	const traffic = await captureMixpanel(page);

	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Einverstanden' })).toBeVisible();

	// Not merely no events: the SDK itself must not have been fetched, so a refusal is visible
	// in a network log rather than only in a flag inside a script that already ran.
	await page.goto('/learn');
	await page.waitForTimeout(500);

	expect(traffic.events).toEqual([]);
	expect(traffic.recorder).toEqual([]);
	expect(traffic.replay).toEqual([]);
});

test('declining is remembered, and stays silent across a navigation', async ({ page }) => {
	const traffic = await captureMixpanel(page);

	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Ablehnen' })).toBeEnabled();
	await page.getByRole('button', { name: 'Ablehnen' }).click();

	await page.goto('/learn');
	await page.waitForTimeout(500);

	expect(traffic.events).toEqual([]);
	// A refusal has to reach the recorder too, not only the events: a declined visitor must
	// not even fetch its bundle.
	expect(traffic.recorder).toEqual([]);
	expect(traffic.replay).toEqual([]);
	await expect(page.getByRole('button', { name: 'Ablehnen' })).toBeHidden();
});

test('accepting sends the page view for the page the banner was answered on', async ({ page }) => {
	const traffic = await captureMixpanel(page);

	await page.goto('/');
	// Enabled only once hydrated, so this is also the wait for the handler to exist.
	await expect(page.getByRole('button', { name: 'Einverstanden' })).toBeEnabled();
	await page.getByRole('button', { name: 'Einverstanden' }).click();

	// The arrival itself, which is the view that is lost if consent is not what re-triggers it.
	await awaitEvent(traffic, 'page_viewed');
	expect(traffic.events.find((e) => e.event === 'page_viewed')?.properties.path).toBe('/');
	await expect(page.getByRole('button', { name: 'Einverstanden' })).toBeHidden();
});

test('accepting starts the session recording, and only then', async ({ page }) => {
	const traffic = await captureMixpanel(page);

	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Einverstanden' })).toBeEnabled();
	expect(traffic.recorder).toEqual([]);

	await page.getByRole('button', { name: 'Einverstanden' }).click();

	/**
	 * The recorder bundle, loaded and answered 200, which is the proof that recording began.
	 *
	 * Asserting on the successful response rather than on the request is the whole point.
	 * Mixpanel's SDK asks its own CDN for a file that is a 404, Chrome blocks the HTML error
	 * page as ERR_BLOCKED_BY_ORB, and recording silently never starts. A spec that counted
	 * requests passed against exactly that, so this one counts responses.
	 */
	await expect.poll(() => traffic.recorder.length, FLUSH).toBeGreaterThan(0);
});

test('a questionnaire step is never sent as a page view', async ({ page }) => {
	const traffic = await captureMixpanel(page);

	await page.goto('/');
	// Enabled only once hydrated, so this is also the wait for the handler to exist.
	await expect(page.getByRole('button', { name: 'Einverstanden' })).toBeEnabled();
	await page.getByRole('button', { name: 'Einverstanden' }).click();
	await awaitEvent(traffic, 'page_viewed');

	await page.goto('/questionnaire');
	await expect(page).toHaveURL(/\/questionnaire\/page\d+/);
	await page.waitForTimeout(500);

	// Which steps a person is shown is decided by the model's branching, so a step path is
	// derived from their answers. No `page_viewed` may name one.
	const paths = traffic.events
		.filter((entry) => entry.event === 'page_viewed')
		.map((entry) => String(entry.properties.path));

	expect(paths.some((path) => path.startsWith('/questionnaire'))).toBe(false);
});

test('the funnel sends its three events, carrying nothing about the person', async ({ page }) => {
	const traffic = await captureMixpanel(page);

	await page.goto('/');
	// Enabled only once hydrated, so this is also the wait for the handler to exist.
	await expect(page.getByRole('button', { name: 'Einverstanden' })).toBeEnabled();
	await page.getByRole('button', { name: 'Einverstanden' }).click();
	await awaitEvent(traffic, 'page_viewed');

	await walkAndSubmit(page);
	await expect(page).toHaveURL('/questionnaire/complete');
	await awaitEvent(traffic, 'anamnesis_submitted');

	await orderPlan(page, { mode: 'prescription' });
	await awaitEvent(traffic, 'checkout_started');

	expect(names(traffic.events)).toContain('questionnaire_started');

	const submitted = traffic.events.find((entry) => entry.event === 'anamnesis_submitted');
	expect(submitted?.properties.survey_step_count).toBeGreaterThan(0);

	const checkout = traffic.events.find((entry) => entry.event === 'checkout_started');
	expect(checkout?.properties.plan_mode).toBe('prescription');
	expect(checkout?.properties.has_recommendation).toBe(true);

	// The privacy boundary, asserted against what actually left the browser rather than
	// against the module that built it. The answers, the address and the uid stay here.
	const payload = JSON.stringify(traffic.events).toLowerCase();
	for (const leak of ['jonas@example.com', 'anamnesis_uid', 'anam-', 'variant']) {
		expect(payload).not.toContain(leak);
	}
});

test('a heatmap click on a medical question carries no answer wording', async ({ page }) => {
	const traffic = await captureMixpanel(page);

	await page.goto('/');
	await expect(page.getByRole('button', { name: 'Einverstanden' })).toBeEnabled();
	await page.getByRole('button', { name: 'Einverstanden' }).click();
	await awaitEvent(traffic, 'page_viewed');

	// `walkTo` opens `/questionnaire` with a full load, so the recorder starts again there.
	// Counted from this point, because heatmap clicks exist only while a replay is live and a
	// click landing before one would simply not be sent. The walk passes the date picker,
	// which is the portalled surface a class on the shell alone did not cover.
	const recorded = traffic.recorder.length;
	await walkTo(page, 'page1');
	await expect.poll(() => traffic.recorder.length, FLUSH).toBeGreaterThan(recorded);

	// A checkbox whose label is a diagnosis, which is the worst case rather than a typical one.
	await page.getByRole('checkbox', { name: 'Knie- oder H\u00fcftarthrose' }).click();
	await awaitEvent(traffic, '$mp_click');

	const onQuestionnaire = traffic.events.filter((entry) =>
		String(entry.properties.$current_url ?? '').includes('/questionnaire')
	);

	// The heatmap has to actually run here: "everywhere" was the decision, so a questionnaire
	// that quietly reported nothing would pass every assertion below for the wrong reason.
	expect(onQuestionnaire.some((entry) => entry.event === '$mp_click')).toBe(true);

	/**
	 * The guarantee `mp-sensitive` exists for, asserted against what left the browser rather
	 * than against the class in the markup, because the class only matters if the SDK honours
	 * it. Every tracked attribute is checked, not `aria-label` alone: `name` and `title` are on
	 * the same list and a later question type could put an answer in either.
	 */
	for (const entry of onQuestionnaire) {
		const elements = (entry.properties.$elements ?? []) as Record<string, unknown>[];
		const attrs = elements.flatMap((el) => Object.keys(el).filter((k) => k.startsWith('$attr-')));

		expect(attrs, `${entry.event} reported element attributes`).toEqual([]);
	}

	// The two answers this walk actually gave, in the wording the DOM carries them.
	const payload = JSON.stringify(traffic.events).toLowerCase();
	expect(payload).not.toContain('h\u00fcftarthrose');
	expect(payload).not.toContain('1990');
});
