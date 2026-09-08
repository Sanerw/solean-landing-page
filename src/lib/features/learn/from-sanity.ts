import { m } from '$lib/paraglide/messages';
import { findTreatment } from '$lib/domain';
import { croppedPicture, picture } from '$lib/sanity/image';
import type { ArticleDetail } from '$lib/sanity/queries';
import { AVATAR_WIDTHS, PANEL_WIDTHS, tagsOf } from './journal';
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
		// A label, not content: the same sentence on every article, with the treatment's own name
		// in it, as the artboard writes it. So it stays a message and takes a parameter.
		manufacturerLabel: m.learn_manufacturer_label({ treatment: treatment.name }),
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
		sourcesSummary: article.sourcesSummary ?? '',
		summary: article.summary,
		tags: tagsOf(article),
		// The same ladder the Journal's featured card carries, because it is the same frame: a
		// photograph running the width of a bleed panel with the copy over it. One fixed URL was
		// enough while the hero was a 805px box beside the text.
		hero: article.hero?.asset ? picture(article.hero, PANEL_WIDTHS) : undefined,
		review: {
			reviewer: {
				name: article.reviewer?.name ?? '',
				role: article.reviewer?.role ?? '',
				portrait: article.reviewer?.portrait?.asset
					? croppedPicture(article.reviewer.portrait, AVATAR_WIDTHS, 1)
					: undefined
			},
			nextReviewAt: article.nextReviewAt ?? '',
			readTimeMinutes: article.readTimeMinutes ?? 0
		},
		toc: articleToc(article),
		quickAnswer: article.quickAnswer ?? [],
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
