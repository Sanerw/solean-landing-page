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

for (const language of ['de', 'en']) {
	articles[language] = await run(articleQuery, { slug: SLUG, language });
	if (!articles[language]) throw new Error(`${language}: no article at "${SLUG}"`);

	homePages[language] = await run(query('homePageQuery'), { language });
	if (!homePages[language]) throw new Error(`${language}: no home page`);

	// Projected by its own query, because the bar renders above every marketing page.
	announcements[language] = await run(query('announcementQuery'), { language });

	testimonials[language] = await run(query('testimonialsQuery'), { language });
}

const out = resolve(root, 'e2e/fixtures/sanity-articles.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(
	out,
	JSON.stringify({ slug: SLUG, articles, homePages, announcements, testimonials }, null, '\t') + '\n'
);
console.log(`wrote ${out} (article, home page and testimonials, de + en)`);
