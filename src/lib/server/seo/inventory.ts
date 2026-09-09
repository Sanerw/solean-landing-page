import { defineQuery } from 'groq';
import { loadPublishedQuery } from '$lib/sanity/query.server';
import { toPageIdentities, type PageIdentity, type RawInventory } from '$lib/seo/pages';

/**
 * Every published page the site can address, in one read.
 *
 * Ids, slugs, languages and modification stamps only: discovery needs to know which pages
 * exist, never what they say. An article's translations come from the Studio's own metadata
 * document, and a translation whose target is unpublished resolves to a null slug here, which
 * the mapper drops. That is what makes an alternate a verified translation rather than a guess.
 */
export const inventoryQuery = defineQuery(`{
	"home": *[_type == "homePage" && defined(language)]{ language, _updatedAt },
	"articles": *[_type == "article" && defined(language) && defined(slug.current)]{
		language,
		"slug": slug.current,
		_updatedAt,
		"translations": *[_type == "translation.metadata" && references(^._id)][0]
			.translations[]{ "locale": _key, "slug": value->slug.current }
	},
	"treatments": *[_type == "treatment" && defined(language) && defined(treatmentId)]{
		treatmentId, language, _updatedAt
	},
	"legal": *[_type == "legalPage" && defined(language) && defined(slug)]{
		slug, language, _updatedAt
	}
}`);

/**
 * Long enough that discovery costs one read rather than one per visitor, short enough that a
 * newly published article is discoverable well inside the hour the rendered pages are cached
 * at the edge for.
 */
const FRESH_MS = 5 * 60 * 1000;

type Load = () => Promise<RawInventory | null>;

const loadInventory: Load = async () => {
	// The published perspective explicitly, never `locals.sanity.loadQuery`: a visitor holding a
	// preview cookie would otherwise put drafts into the canonical links and the sitemap.
	const { data } = await loadPublishedQuery<RawInventory | null>(inventoryQuery);

	return data;
};

/**
 * A factory rather than a module-level cache, so a test builds its own instance and no state
 * leaks between cases.
 *
 * A failure is not cached and not swallowed: the sitemap has to answer a content outage with a
 * retriable error rather than a successful empty document, so the rejection is the caller's to
 * interpret. Only a good answer is held.
 */
export function createInventoryCache(load: Load = loadInventory): () => Promise<PageIdentity[]> {
	let value: PageIdentity[] | null = null;
	let expiresAt = 0;
	let inFlight: Promise<PageIdentity[]> | null = null;

	return function publishedPages() {
		if (value && Date.now() < expiresAt) return Promise.resolve(value);
		// A cold start answers several requests at once, all asking the same question.
		if (inFlight) return inFlight;

		inFlight = load()
			.then((raw) => {
				value = toPageIdentities(raw);
				expiresAt = Date.now() + FRESH_MS;

				return value;
			})
			.finally(() => {
				inFlight = null;
			});

		return inFlight;
	};
}

/** One per server instance: a cold start pays the read, the requests after it do not. */
export const publishedPages = createInventoryCache();
