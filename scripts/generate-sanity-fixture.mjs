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

// Read the query out of the app rather than restating it, so the fixture cannot drift from the
// projection the page actually asks for.
const queries = readFileSync(resolve(root, 'src/lib/sanity/queries.ts'), 'utf8');
const match = queries.match(/export const articleQuery = defineQuery\(`([\s\S]*?)`\);/);
if (!match) throw new Error('Could not find articleQuery in src/lib/sanity/queries.ts');
const articleQuery = match[1];

const SLUG = 'mounjaro-vs-wegovy';

async function run(language) {
	const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`);
	url.searchParams.set('query', articleQuery);
	url.searchParams.set('$slug', JSON.stringify(SLUG));
	url.searchParams.set('$language', JSON.stringify(language));

	const response = await fetch(url);
	if (!response.ok) throw new Error(`${language}: ${response.status} ${await response.text()}`);

	const { result } = await response.json();
	if (!result) throw new Error(`${language}: no article at "${SLUG}"`);
	return result;
}

const articles = {};
for (const language of ['de', 'en']) articles[language] = await run(language);

const out = resolve(root, 'e2e/fixtures/sanity-articles.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify({ slug: SLUG, articles }, null, '\t') + '\n');
console.log(`wrote ${out} (de + en)`);
