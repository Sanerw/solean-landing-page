import type { Treatment } from '$lib/domain';
import type { FaqItem } from '$lib/features/marketing/content';

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
 * arrives from Sanity as a URL. The clinical-team carousel keeps its optimised images.
 */
export interface ArticleReviewer {
	name: string;
	role: string;
	portraitUrl: string | null;
}

export interface ArticleSource {
	label: string;
	href?: string;
}

export interface Article {
	slug: string;
	category: string;
	title: string;
	/** The breadcrumb's last crumb: the headline is a sentence and truncates there. */
	shortTitle: string;
	/** Names the evidence in prose before the list, as the artboard does. */
	sourcesSummary: string;
	summary: string;
	hero: {
		src: string | null;
		alt: string;
	};
	review: {
		reviewer: ArticleReviewer;
		updatedAt: string;
		nextReviewAt: string;
		readTimeMinutes: number;
	};
	toc: readonly ArticleTocItem[];
	quickAnswer: readonly string[];
	keyTakeaways: readonly string[];
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
