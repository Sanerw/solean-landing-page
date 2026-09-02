import { m } from '$lib/paraglide/messages';
import { findTreatment } from '$lib/domain';
import { urlFor } from '$lib/sanity/image';
import type { ArticleDetail } from '$lib/sanity/queries';
import type {
	Article,
	ArticleSectionId,
	ArticleTocItem,
	ArticleTreatmentProfile
} from './types';

/**
 * Turns a Sanity article into the shape the page's components already accept, so the six of
 * them stay untouched by the move off fixtures. The mapping happens once, at the load
 * boundary; later migrations should follow the same route rather than reshaping components
 * around Sanity's output.
 */

/** The order the page lays its sections out in. A table of contents follows the page, not the document. */
const SECTION_ORDER: readonly ArticleSectionId[] = [
	'quick-answer',
	'at-a-glance',
	'how-they-work',
	'expected-results',
	'side-effects',
	'manufacturers',
	'faqs',
	'sources'
];

function sectionLabel(id: ArticleSectionId): string {
	switch (id) {
		case 'quick-answer':
			return m.learn_toc_quick();
		case 'at-a-glance':
			return m.learn_toc_glance();
		case 'how-they-work':
			return m.learn_toc_how();
		case 'expected-results':
			return m.learn_toc_results();
		case 'side-effects':
			return m.learn_toc_side_effects();
		case 'manufacturers':
			return m.learn_toc_manufacturers();
		case 'faqs':
			return m.learn_toc_faqs();
		case 'sources':
			return m.learn_toc_sources();
	}
}

function filled(value: readonly unknown[] | undefined): boolean {
	return Array.isArray(value) && value.length > 0;
}

/**
 * Derived rather than stored, which is why the Studio has no `toc` field: a table of contents
 * is a view of which sections an article actually fills. An article with no side effects
 * section simply has no entry for it, and the anchors keep the page's order, not the
 * document's.
 */
export function articleToc(article: ArticleDetail): readonly ArticleTocItem[] {
	const present: Record<ArticleSectionId, boolean> = {
		'quick-answer': filled(article.quickAnswer),
		'at-a-glance': (article.treatmentProfiles?.length ?? 0) >= 2,
		'how-they-work': filled(article.howTheyWork),
		'expected-results': filled(article.expectedResults),
		'side-effects': filled(article.sideEffects?.items),
		manufacturers: (article.treatmentProfiles?.length ?? 0) >= 2,
		faqs: filled(article.faqs),
		sources: filled(article.sources)
	};

	return SECTION_ORDER.filter((id) => present[id]).map((id) => ({ id, label: sectionLabel(id) }));
}

function toProfile(profile: NonNullable<ArticleDetail['treatmentProfiles']>[number]) {
	const treatment = findTreatment(profile.treatmentId);

	if (!treatment) {
		throw new Error(
			`Article names treatment "${profile.treatmentId}", which is not in the catalogue`
		);
	}

	return {
		treatment,
		activeIngredient: profile.activeIngredient,
		manufacturer: profile.manufacturer,
		frequency: profile.frequency ?? '',
		mainAction: profile.mainAction ?? '',
		// A label, not content: the same words on every article, so it stays a message.
		manufacturerLabel: m.learn_manufacturer_label(),
		manufacturerBody: profile.manufacturerNote ?? ''
	} satisfies ArticleTreatmentProfile;
}

/**
 * The comparison table and the manufacturers section both read the same two profiles, and both
 * name them in their headings, so two is a floor rather than a default. The Studio enforces it
 * as well; this throws rather than rendering a comparison of one.
 */
function toProfilePair(
	article: ArticleDetail
): readonly [ArticleTreatmentProfile, ArticleTreatmentProfile] {
	const profiles = (article.treatmentProfiles ?? []).map(toProfile);

	if (profiles.length < 2) {
		throw new Error(
			`Article "${article.slug.current}" compares ${profiles.length} treatments; it needs two`
		);
	}

	return [profiles[0], profiles[1]];
}

export function toArticle(article: ArticleDetail): Article {
	const profiles = toProfilePair(article);

	return {
		slug: article.slug.current,
		category: article.category,
		title: article.title,
		shortTitle: article.shortTitle ?? article.title,
		sourcesSummary: article.sourcesSummary ?? '',
		summary: article.summary,
		hero: {
			src: article.hero?.asset ? urlFor(article.hero).width(805).height(650).url() : null,
			alt: article.hero?.alt ?? ''
		},
		review: {
			reviewer: {
				name: article.reviewer?.name ?? '',
				role: article.reviewer?.role ?? '',
				portraitUrl: article.reviewer?.portrait?.asset
					? urlFor(article.reviewer.portrait).width(80).height(80).url()
					: null
			},
			updatedAt: article.reviewedAt,
			nextReviewAt: article.nextReviewAt ?? '',
			readTimeMinutes: article.readTimeMinutes ?? 0
		},
		toc: articleToc(article),
		quickAnswer: article.quickAnswer ?? [],
		keyTakeaways: article.keyTakeaways ?? [],
		comparison: { profiles },
		howTheyWork: article.howTheyWork ?? [],
		expectedResults: article.expectedResults ?? [],
		sideEffects: {
			intro: article.sideEffects?.intro ?? '',
			items: article.sideEffects?.items ?? []
		},
		manufacturers: profiles,
		faqs: (article.faqs ?? []).map((faq) => ({ question: faq.question, answer: faq.answer })),
		sources: (article.sources ?? []).map((source) => ({
			label: source.label,
			href: source.href
		}))
	};
}
