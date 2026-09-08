import type { FaqItem } from '$lib/features/marketing/content';
import type { SanityPicture } from '$lib/sanity/image';

export interface ArticleTocItem {
	id: string;
	label: string;
}

/**
 * What every block shares: the heading it is announced by, the anchor derived from it, and the
 * shorter wording the contents list prints.
 *
 * All three are optional together. A prose block without a heading continues the section above
 * it, so it opens no section, claims no anchor and appears in no contents list.
 */
interface BlockHead {
	id?: string;
	heading?: string;
	label?: string;
}

export interface ArticleTableRow {
	label: string;
	cells: readonly string[];
}

export interface ArticleCard {
	name: string;
	eyebrow: string;
	body: string;
}

/**
 * One block of an article body, keyed by our own `kind` rather than Sanity's `_type`, the same
 * separation the questionnaire's renderer registry draws: their string names a document shape,
 * ours names what a reader sees.
 *
 * `unsupported` is a member rather than an absence. A block this app cannot draw is a content
 * bug somebody has to see, and dropping it silently is how an article quietly loses a section.
 */
export type ArticleBlock =
	| (BlockHead & { kind: 'prose'; paragraphs: readonly string[] })
	| (BlockHead & { kind: 'callout'; paragraphs: readonly string[] })
	| (BlockHead & {
			kind: 'table';
			caption: string;
			columns: readonly string[];
			rows: readonly ArticleTableRow[];
	  })
	| (BlockHead & { kind: 'cards'; cards: readonly ArticleCard[] })
	| (BlockHead & { kind: 'checklist'; intro?: string; items: readonly string[] })
	| (BlockHead & { kind: 'accordion'; items: readonly FaqItem[] })
	| (BlockHead & { kind: 'sources'; summary: string; sources: readonly ArticleSource[] })
	| { kind: 'unsupported'; type: string; reason: string };

export type ArticleBlockKind = ArticleBlock['kind'];

/**
 * The doctor credited on an article. Deliberately not the marketing `Clinician`: that one
 * carries an `enhanced:img` import object built at compile time, and an article's reviewer
 * arrives from Sanity. The clinical-team carousel keeps its optimised images.
 */
export interface ArticleReviewer {
	name: string;
	role: string;
	portrait?: SanityPicture;
}

export interface ArticleSource {
	label: string;
	href?: string;
}

export interface Article {
	slug: string;
	category: string;
	title: string;
	summary: string;
	/** The chips over the hero. Never empty: `tagsOf` falls back to the category. */
	tags: readonly string[];
	hero?: SanityPicture;
	review: {
		reviewer: ArticleReviewer;
		nextReviewAt: string;
		readTimeMinutes: number;
	};
	/**
	 * The article itself, in the order an editor composed it. Until feature 26c this was eight
	 * named fields, which meant every article had to be shaped like the first one.
	 */
	body: readonly ArticleBlock[];
}
