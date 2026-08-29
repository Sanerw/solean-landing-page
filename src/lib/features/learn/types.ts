import type { Treatment } from '$lib/domain';
import type { Clinician, FaqItem } from '$lib/features/marketing/content';

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

export interface ArticleSource {
	label: string;
	href?: string;
}

export interface RelatedArticlePreview {
	category: string;
	title: string;
	href?: string;
}

export interface Article {
	slug: string;
	category: string;
	title: string;
	summary: string;
	hero: {
		src: string | null;
		alt: string;
	};
	review: {
		reviewer: Clinician;
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
	related: readonly RelatedArticlePreview[];
}
