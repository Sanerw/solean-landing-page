// Direct, not through `@sanity/sveltekit`, for the reason given in `client.ts`. `defineQuery`
// rather than the `groq` tag: it is the form Sanity TypeGen reads, so wiring TypeGen later needs
// no change here.
import { defineQuery } from 'groq';

/**
 * Every query is scoped by `$language`. Translations are separate documents linked by the
 * Studio's translation metadata, so a query without the filter would return the same article
 * once per locale.
 */
export const articlesQuery = defineQuery(`*[_type == "article" && language == $language && defined(slug.current)]
	| order(reviewedAt desc){
		_id,
		title,
		category,
		summary,
		slug,
		reviewedAt,
		readTimeMinutes,
		hero
	}`);

export const articleQuery = defineQuery(`*[_type == "article" && language == $language && slug.current == $slug][0]{
	_id,
	title,
	shortTitle,
	category,
	summary,
	slug,
	hero,
	reviewedAt,
	nextReviewAt,
	readTimeMinutes,
	quickAnswer,
	keyTakeaways,
	howTheyWork,
	expectedResults,
	sideEffects,
	sourcesSummary,
	reviewer->{ _id, name, role, description, portrait },
	treatmentProfiles[]{
		_key,
		treatmentId,
		activeIngredient,
		manufacturer,
		frequency,
		mainAction,
		manufacturerNote
	},
	faqs[]{ _key, question, answer },
	sources[]{ _key, label, href },
	related[]->{ _id, title, category, slug },
	seoTitle,
	seoDescription
}`);

/** The slug of the most recently reviewed article, for the `/learn` redirects. */
export const featuredArticleSlugQuery = defineQuery(
	`*[_type == "article" && language == $language && defined(slug.current)]
		| order(reviewedAt desc)[0].slug.current`
);

export interface SanityImage {
	asset?: { _ref: string };
	alt?: string;
}

export interface ArticleListItem {
	_id: string;
	title: string;
	category: string;
	summary: string;
	slug: { current: string };
	reviewedAt: string;
	readTimeMinutes?: number;
	hero?: SanityImage;
}

export interface ArticleDetail extends ArticleListItem {
	shortTitle?: string;
	seoTitle?: string;
	seoDescription?: string;
	nextReviewAt?: string;
	quickAnswer?: string[];
	keyTakeaways?: string[];
	howTheyWork?: string[];
	expectedResults?: string[];
	sideEffects?: { intro?: string; items?: string[] };
	sourcesSummary?: string;
	reviewer?: {
		_id: string;
		name: string;
		role: string;
		description?: string;
		portrait?: SanityImage;
	};
	treatmentProfiles?: {
		_key: string;
		treatmentId: string;
		activeIngredient: string;
		manufacturer: string;
		frequency?: string;
		mainAction?: string;
		manufacturerNote?: string;
	}[];
	faqs?: { _key: string; question: string; answer: string }[];
	sources?: { _key: string; label: string; href?: string }[];
	related?: { _id: string; title: string; category: string; slug: { current: string } }[];
}
