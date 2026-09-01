import { findTreatment, type Treatment } from '$lib/domain';
import articleHero from '$lib/assets/learn/mounjaro-vs-wegovy.jpg';
import {
	FEATURED_ARTICLE_SLUG,
	JURAJ_GALAN,
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

const mounjaroProfile: ArticleTreatmentProfile = {
	treatment: mounjaro,
	activeIngredient: 'Tirzepatide',
	manufacturer: 'Eli Lilly',
	frequency: 'Once weekly',
	mainAction: 'GIP and GLP-1',
	manufacturerLabel: 'Maker of the treatment',
	manufacturerBody:
		'A pharmaceutical company that developed tirzepatide and researches medicines for diabetes and obesity.'
};

const wegovyProfile: ArticleTreatmentProfile = {
	treatment: wegovy,
	activeIngredient: 'Semaglutide',
	manufacturer: 'Novo Nordisk',
	frequency: 'Once weekly',
	mainAction: 'GLP-1',
	manufacturerLabel: 'Maker of the treatment',
	manufacturerBody:
		'A healthcare company with decades of research in diabetes and obesity and the developer of semaglutide.'
};

const ARTICLE_FAQS: readonly FaqItem[] = [
	{
		question: `Is ${mounjaro.name} stronger than ${wegovy.name}?`,
		answer:
			'Published studies report different average outcomes, but they are not a direct promise of an individual result. A clinician considers suitability, tolerability, availability, and health history together.'
	},
	{
		question: 'Can you switch between the treatments?',
		answer:
			'Any treatment change needs clinical review. Timing, dose, side effects, and the reason for switching all affect the advice a prescriber gives.'
	},
	{
		question: 'How quickly do results appear?',
		answer:
			'Results vary by person, dose, adherence, and health factors. A clinician should set expectations and review progress over time.'
	},
	{
		question: 'Are these medicines available without a prescription?',
		answer:
			'No. These are prescription treatments and should only be used after a qualified clinician confirms that they are appropriate.'
	}
];

export const FEATURED_ARTICLE: Article = {
	slug: FEATURED_ARTICLE_SLUG,
	category: 'Treatment comparison',
	title: `${mounjaro.name} vs ${wegovy.name}: differences, results and which may suit you`,
	shortTitle: `${mounjaro.name} vs ${wegovy.name}`,
	sourcesSummary:
		`Key sources include the SURMOUNT-1 and STEP 1 clinical trials, European Medicines Agency product information, and prescribing information from ${mounjaroProfile.manufacturer} and ${wegovyProfile.manufacturer}. This article is educational and does not replace individual medical advice.`,
	summary:
		'An expert-reviewed prototype comparison of two weekly prescription treatments, including how they work, possible side effects, and questions to discuss with a clinician.',
	hero: {
		src: articleHero,
		alt: 'A hand holding several capped injection syringes'
	},
	review: {
		reviewer: JURAJ_GALAN,
		updatedAt: '2026-08-28',
		nextReviewAt: '2027-08-28',
		readTimeMinutes: 12
	},
	toc: [
		{ id: 'quick-answer', label: 'Quick answer' },
		{ id: 'at-a-glance', label: 'At a glance' },
		{ id: 'how-they-work', label: 'How they work' },
		{ id: 'expected-results', label: 'Expected results' },
		{ id: 'side-effects', label: 'Side effects' },
		{ id: 'manufacturers', label: 'Makers and research' },
		{ id: 'faqs', label: 'FAQs' },
		{ id: 'sources', label: 'Sources' }
	],
	quickAnswer: [
		'Both options are once-weekly prescription injections used alongside nutrition, movement, and clinical support.',
		'They act on related appetite pathways but contain different active ingredients. Suitability depends on medical history, goals, side-effect risk, and availability.'
	],
	keyTakeaways: [
		'Both are weekly prescription injections.',
		'They contain different active ingredients.',
		'Average study outcomes do not predict an individual result.',
		'A clinician should decide suitability.'
	],
	comparison: {
		profiles: [mounjaroProfile, wegovyProfile]
	},
	howTheyWork: [
		'Both medicines mimic gut hormones involved in appetite and blood-sugar regulation. They can help people feel fuller for longer and reduce food noise.',
		'Their hormone targets differ, but that difference alone does not make one option right for every person.'
	],
	expectedResults: [
		'Clinical studies report meaningful average weight loss when treatment is used alongside lifestyle support. Studies vary in design and should not be treated as a direct head-to-head promise.',
		'Individual response depends on dose, adherence, health conditions, and ongoing clinical support.'
	],
	sideEffects: {
		intro:
			'Common effects are often gastrointestinal and may be more noticeable while a dose is increasing. A prescriber should review medical history and current medicines first.',
		items: [
			'Nausea, diarrhoea, or constipation',
			'Vomiting, reflux, or stomach discomfort',
			'Reduced appetite and fatigue',
			'Rare but serious symptoms that need urgent medical advice'
		]
	},
	manufacturers: [mounjaroProfile, wegovyProfile],
	faqs: ARTICLE_FAQS,
	sources: [
		{ label: 'SURMOUNT-1 clinical trial' },
		{ label: 'STEP 1 clinical trial' },
		{ label: 'European Medicines Agency product information' },
		{ label: 'Product information from the manufacturers' }
	],
	related: [
		{
			category: 'Treatments',
			title: `${mounjaro.name}: dosing, side effects and results`
		},
		{
			category: 'Treatments',
			title: `${wegovy.name} explained: a complete guide`
		},
		{
			category: 'Companies',
			title: `${mounjaroProfile.manufacturer} and ${wegovyProfile.manufacturer} compared`
		}
	]
};

const ARTICLES: readonly Article[] = [FEATURED_ARTICLE];

export function getArticleBySlug(slug: string): Article | null {
	return ARTICLES.find((article) => article.slug === slug) ?? null;
}
