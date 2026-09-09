import { createClient } from '@sanity/client';

/**
 * Links article pairs that exist in both languages but carry no `translation.metadata`.
 *
 * Feature 28a emits an `hreflang` alternate only for a translation the Studio has actually
 * declared, never for a matching slug: two documents sharing a slug are not evidence that one
 * is the other's translation. Six article slugs exist in both languages and only
 * `mounjaro-vs-wegovy` is linked, so the other five are each served without alternates.
 *
 * Read-only by default. Pass `--apply` to write.
 *
 *   SANITY_API_WRITE_TOKEN=<token with Editor rights> node scripts/link-article-translations.mjs
 *   SANITY_API_WRITE_TOKEN=<token> node scripts/link-article-translations.mjs --apply
 */

const apply = process.argv.includes('--apply');
const token = process.env.SANITY_API_WRITE_TOKEN;

if (apply && !token) {
	console.error('SANITY_API_WRITE_TOKEN is required to apply. Create one with Editor rights at');
	console.error('https://sanity.io/manage -> API -> Tokens. The read token cannot write.');
	process.exit(1);
}

const client = createClient({
	projectId: 'tzq5b2my',
	dataset: 'production',
	apiVersion: '2026-09-02',
	useCdn: false,
	token
});

/**
 * Published documents only. A draft has no public URL, so linking one would declare an
 * alternate that answers 404.
 */
const articles = await client.fetch(`*[
	_type == "article" && !(_id in path("drafts.**")) && defined(language) && defined(slug.current)
]{
	_id,
	language,
	"slug": slug.current,
	title,
	"linked": count(*[_type == "translation.metadata" && references(^._id)])
}`);

const bySlug = new Map();
for (const article of articles) {
	const group = bySlug.get(article.slug) ?? {};
	group[article.language] = article;
	bySlug.set(article.slug, group);
}

const pending = [...bySlug.entries()].filter(([, group]) => {
	const languages = Object.values(group);
	// Both halves published, and neither already belongs to a metadata document.
	return languages.length === 2 && languages.every((article) => article.linked === 0);
});

const alreadyLinked = [...bySlug.values()].filter((group) =>
	Object.values(group).some((article) => article.linked > 0)
).length;

console.log(`${bySlug.size} slugs, ${alreadyLinked} already linked, ${pending.length} to link.\n`);

if (pending.length === 0) {
	console.log('Nothing to do.');
	process.exit(0);
}

for (const [slug, group] of pending) {
	console.log(`  ${slug}`);
	for (const [language, article] of Object.entries(group)) {
		console.log(`    ${language}  ${article._id}  ${article.title}`);
	}
}

if (!apply) {
	console.log('\nDry run. Re-run with --apply to create these documents.');
	process.exit(0);
}

/**
 * The shape the plugin itself writes, copied from the one working document rather than
 * guessed: `_key` and `language` both carry the locale, and the member type is the
 * plugin's own `internationalizedArrayReferenceValue`.
 */
for (const [slug, group] of pending) {
	const created = await client.create({
		_type: 'translation.metadata',
		schemaTypes: ['article'],
		translations: ['de', 'en']
			.filter((language) => group[language])
			.map((language) => ({
				_key: language,
				_type: 'internationalizedArrayReferenceValue',
				language,
				value: { _type: 'reference', _ref: group[language]._id }
			}))
	});

	console.log(`linked ${slug} -> ${created._id}`);
}

console.log('\nDone. The site picks this up within five minutes (the inventory cache).');
