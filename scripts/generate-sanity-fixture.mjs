/**
 * Regenerates `e2e/fixtures/sanity-articles.json` from the real dataset, so the browser harness
 * asserts against a response Sanity actually produced rather than one we imagined.
 *
 *   node scripts/generate-sanity-fixture.mjs
 *
 * Re-run it when the article query or the seeded article changes.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const env = Object.fromEntries(
	readFileSync(resolve(root, '.env'), 'utf8')
		.split('\n')
		.filter((line) => line.includes('=') && !line.trim().startsWith('#'))
		.map((line) => [line.slice(0, line.indexOf('=')).trim(), line.slice(line.indexOf('=') + 1).trim()])
);

const projectId = env.PUBLIC_SANITY_PROJECT_ID;
const dataset = env.PUBLIC_SANITY_DATASET;
const apiVersion = env.PUBLIC_SANITY_API_VERSION;

// Read the queries out of the app rather than restating them, so the fixture cannot drift from
// the projections the pages actually ask for.
const queries = readFileSync(resolve(root, 'src/lib/sanity/queries.ts'), 'utf8');
function query(name) {
	const match = queries.match(new RegExp(`export const ${name} = defineQuery\\(\\s*\`([\\s\\S]*?)\`\\s*\\);`));
	if (!match) throw new Error(`Could not find ${name} in src/lib/sanity/queries.ts`);
	return match[1];
}

const articleQuery = query('articleQuery');
const SLUG = 'mounjaro-vs-wegovy';

// The four policy documents, keyed here exactly as `LEGAL_SLUGS` keys them in
// `src/lib/features/legal/from-sanity.ts`. They were absent from this script until feature 26c,
// so every regeneration silently deleted them from the fixture and took `legal-pages.spec.ts`
// with it. A generator that writes a subset of the file it overwrites is a trap, so it writes
// all of it now.
const LEGAL_SLUGS = ['legal-notice', 'privacy', 'terms', 'returns'];

async function run(groq, params) {
	const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`);
	url.searchParams.set('query', groq);
	for (const [name, value] of Object.entries(params)) {
		url.searchParams.set(`$${name}`, JSON.stringify(value));
	}

	const response = await fetch(url);
	if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
	return (await response.json()).result;
}

const articles = {};
const homePages = {};
const testimonials = {};
const announcements = {};
const legalPages = {};
const treatments = {};
const treatmentsPages = {};

for (const language of ['de', 'en']) {
	articles[language] = await run(articleQuery, { slug: SLUG, language });
	if (!articles[language]) throw new Error(`${language}: no article at "${SLUG}"`);

	homePages[language] = await run(query('homePageQuery'), { language });
	if (!homePages[language]) throw new Error(`${language}: no home page`);

	// Projected by its own query, because the bar renders above every marketing page.
	announcements[language] = await run(query('announcementQuery'), { language });

	testimonials[language] = await run(query('testimonialsQuery'), { language });

	// Every treatment in one call, because that is how the page reads them: the plan comparison
	// needs all three whichever one is being viewed.
	treatments[language] = await run(query('treatmentsQuery'), { language });
	if (!treatments[language]?.length) throw new Error(`${language}: no treatments`);

	treatmentsPages[language] = await run(query('treatmentsPageQuery'), { language });
	if (!treatmentsPages[language]) throw new Error(`${language}: no shared treatment sections`);

	for (const slug of LEGAL_SLUGS) {
		const page = await run(query('legalPageQuery'), { slug, language });
		if (!page) throw new Error(`${language}: no legal page at "${slug}"`);
		legalPages[`${slug}-${language}`] = page;
	}
}

const out = resolve(root, 'e2e/fixtures/sanity-articles.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(
	out,
	JSON.stringify(
		{ slug: SLUG, articles, homePages, announcements, testimonials, legalPages, treatments, treatmentsPages },
		null,
		'\t'
	) + '\n'
);
console.log(`wrote ${out} (article, home page, testimonials, legal pages and treatments, de + en)`);
