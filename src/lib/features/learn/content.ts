import { m } from '$lib/paraglide/messages';
import { findTreatment, type Treatment } from '$lib/domain';
import articleHero from '$lib/assets/learn/mounjaro-vs-wegovy.jpg';
import {
	FEATURED_ARTICLE_SLUG,
	jurajGalan,
	type FaqItem
} from '$lib/features/marketing/content';
import type { Article, ArticleTreatmentProfile } from './types';

function requireTreatment(id: string): Treatment {
	const treatment = findTreatment(id);

	if (!treatment) {
		throw new Error(`Missing canonical treatment fixture: ${id}`);
	}

	return treatment;
}

const mounjaro = requireTreatment('mounjaro');
const wegovy = requireTreatment('wegovy');

function mounjaroProfile(): ArticleTreatmentProfile {
	return {
		treatment: mounjaro,
		// Active ingredients and company names are not translated: they are the same words in
		// German pharmaceutical writing.
		activeIngredient: 'Tirzepatide',
		manufacturer: 'Eli Lilly',
		frequency: m.learn_frequency_weekly(),
		mainAction: m.learn_main_action_both(),
		manufacturerLabel: m.learn_manufacturer_label(),
		manufacturerBody: m.learn_lilly_body()
	};
}

function wegovyProfile(): ArticleTreatmentProfile {
	return {
		treatment: wegovy,
		activeIngredient: 'Semaglutide',
		manufacturer: 'Novo Nordisk',
		frequency: m.learn_frequency_weekly(),
		mainAction: 'GLP-1',
		manufacturerLabel: m.learn_manufacturer_label(),
		manufacturerBody: m.learn_novo_body()
	};
}

function articleFaqs(): readonly FaqItem[] {
	return [
		{
			question: m.learn_faq_stronger_q({ a: mounjaro.name, b: wegovy.name }),
			answer: m.learn_faq_stronger_a()
		},
		{ question: m.learn_faq_switch_q(), answer: m.learn_faq_switch_a() },
		{ question: m.learn_faq_speed_q(), answer: m.learn_faq_speed_a() },
		{ question: m.learn_faq_otc_q(), answer: m.learn_faq_otc_a() }
	];
}

/**
 * A function, not a constant: every string in it resolves against the active locale, and a
 * module-level object would freeze whichever locale was current at import.
 */
export function featuredArticle(): Article {
	const mounjaroDetail = mounjaroProfile();
	const wegovyDetail = wegovyProfile();

	return {
		slug: FEATURED_ARTICLE_SLUG,
		category: m.learn_category(),
		title: m.learn_title({ a: mounjaro.name, b: wegovy.name }),
		shortTitle: `${mounjaro.name} vs ${wegovy.name}`,
		sourcesSummary: m.learn_sources_summary({
			a: mounjaroDetail.manufacturer,
			b: wegovyDetail.manufacturer
		}),
		summary: m.learn_summary(),
		hero: { src: articleHero, alt: m.learn_hero_alt() },
		review: {
			reviewer: jurajGalan(),
			updatedAt: '2026-08-28',
			nextReviewAt: '2027-08-28',
			readTimeMinutes: 12
		},
		toc: [
			{ id: 'quick-answer', label: m.learn_toc_quick() },
			{ id: 'at-a-glance', label: m.learn_toc_glance() },
			{ id: 'how-they-work', label: m.learn_toc_how() },
			{ id: 'expected-results', label: m.learn_toc_results() },
			{ id: 'side-effects', label: m.learn_toc_side_effects() },
			{ id: 'manufacturers', label: m.learn_toc_manufacturers() },
			{ id: 'faqs', label: m.learn_toc_faqs() },
			{ id: 'sources', label: m.learn_toc_sources() }
		],
		quickAnswer: [m.learn_quick_1(), m.learn_quick_2()],
		keyTakeaways: [
			m.learn_takeaway_1(),
			m.learn_takeaway_2(),
			m.learn_takeaway_3(),
			m.learn_takeaway_4()
		],
		comparison: { profiles: [mounjaroDetail, wegovyDetail] },
		howTheyWork: [m.learn_how_1(), m.learn_how_2()],
		expectedResults: [m.learn_results_1(), m.learn_results_2()],
		sideEffects: {
			intro: m.learn_side_intro(),
			items: [m.learn_side_1(), m.learn_side_2(), m.learn_side_3(), m.learn_side_4()]
		},
		manufacturers: [mounjaroDetail, wegovyDetail],
		faqs: articleFaqs(),
		sources: [
			{ label: m.learn_source_surmount() },
			{ label: m.learn_source_step() },
			{ label: m.learn_source_ema() },
			{ label: m.learn_source_manufacturers() }
		],
		related: [
			{
				category: m.learn_related_category_treatments(),
				title: m.learn_related_dosing({ a: mounjaro.name })
			},
			{
				category: m.learn_related_category_treatments(),
				title: m.learn_related_guide({ a: wegovy.name })
			},
			{
				category: m.learn_related_category_companies(),
				title: m.learn_related_companies({
					a: mounjaroDetail.manufacturer,
					b: wegovyDetail.manufacturer
				})
			}
		]
	};
}

export function getArticleBySlug(slug: string): Article | null {
	return featuredArticle().slug === slug ? featuredArticle() : null;
}
