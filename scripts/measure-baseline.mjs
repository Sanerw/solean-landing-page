import { chromium } from '@playwright/test';

/**
 * Measures the local production preview and prints the table recorded in
 * `blueprint/reference/performance-baseline.md`.
 *
 * Deliberately not part of `pnpm verify` or of any browser project: it needs a preview server
 * somebody started, it reaches the Sanity CDN for photographs, and its numbers depend on the
 * machine. It is a measurement, not a gate. Read the caveats in the baseline document before
 * comparing two runs.
 *
 *   pnpm build
 *   node e2e/fixture-server.mjs &
 *   PUBLIC_SITE_URL=http://localhost:4198 PUBLIC_SANITY_API_HOST=http://localhost:4319 \
 *     pnpm preview --port 4198 --strictPort &
 *   node scripts/measure-baseline.mjs
 */
const ORIGIN = process.argv[2] ?? 'http://localhost:4198';
const PAGES = [
	['home', '/'], ['journal', '/learn'], ['article', '/learn/blog/mounjaro-vs-wegovy'],
	['treatment', '/treatments/mounjaro'], ['legal', '/privacy'], ['questionnaire', '/questionnaire']
];

const browser = await chromium.launch();
const rows = [];

for (const [page, path] of PAGES) {
	const context = await browser.newContext({ locale: 'de-DE' });
	const tab = await context.newPage();
	const byType = { document: 0, script: 0, stylesheet: 0, font: 0, image: 0, other: 0 };
	let requests = 0;

	// `request.sizes()` is Playwright's own accounting and reports the transferred body even
	// where `response.body()` refuses, which it does for anything served from a cache. Measuring
	// with `body()` reported 0.4 KB of JavaScript for a page that plainly hydrates.
	tab.on('requestfinished', async (request) => {
		requests += 1;
		const type = request.resourceType();
		const bucket = type in byType ? type : 'other';
		try {
			byType[bucket] += (await request.sizes()).responseBodySize;
		} catch {
			// A request the page abandoned has nothing to weigh.
		}
	});

	await tab.goto(`${ORIGIN}${path}`, { waitUntil: 'networkidle' });
	const timing = await tab.evaluate(() => {
		const nav = performance.getEntriesByType('navigation')[0];
		const paint = performance.getEntriesByName('first-contentful-paint')[0];
		return {
			ttfb: Math.round(nav.responseStart),
			domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
			fcp: paint ? Math.round(paint.startTime) : null
		};
	});

	const kb = (bytes) => +(bytes / 1024).toFixed(1);
	rows.push({
		page,
		requests,
		htmlKb: kb(byType.document),
		jsKb: kb(byType.script),
		cssKb: kb(byType.stylesheet),
		fontKb: kb(byType.font),
		imageKb: kb(byType.image),
		totalKb: kb(Object.values(byType).reduce((a, b) => a + b, 0)),
		ttfbMs: timing.ttfb,
		fcpMs: timing.fcp,
		domMs: timing.domContentLoaded
	});

	await context.close();
}

await browser.close();
console.table(rows);
console.log(JSON.stringify(rows));
