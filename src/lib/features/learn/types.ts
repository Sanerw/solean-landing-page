import type { Treatment } from '$lib/domain';
import type { FaqItem } from '$lib/features/marketing/content';
import type { SanityPicture } from '$lib/sanity/image';

export type ArticleSectionId =
	| 'quick-answer'
	| 'at-a-glance'
	| 'how-they-work'
	| 'expected-results'
	| 'side-effects'
	| 'manufacturers'
	| 'faqs'
	| 'sources';

export interface ArticleTocItem {
	id: ArticleSectionId;
	label: string;
}

export interface ArticleTreatmentProfile {
	treatment: Treatment;
	activeIngredient: string;
	manufacturer: string;
	frequency: string;
	mainAction: string;
	manufacturerLabel: string;
	manufacturerBody: string;
}

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
	/** Names the evidence in prose before the list, as the artboard does. */
	sourcesSummary: string;
	summary: string;
	/** The chips over the hero. Never empty: `tagsOf` falls back to the category. */
	tags: readonly string[];
	hero?: SanityPicture;
	review: {
		reviewer: ArticleReviewer;
		nextReviewAt: string;
		readTimeMinutes: number;
	};
	toc: readonly ArticleTocItem[];
	quickAnswer: readonly string[];
	comparison: {
		profiles: readonly [ArticleTreatmentProfile, ArticleTreatmentProfile];
	};
	howTheyWork: readonly string[];
	expectedResults: readonly string[];
	sideEffects: {
		intro: string;
		items: readonly string[];
	};
	manufacturers: readonly [ArticleTreatmentProfile, ArticleTreatmentProfile];
	faqs: readonly FaqItem[];
	sources: readonly ArticleSource[];
}
