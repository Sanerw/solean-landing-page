import { TREATMENTS } from '$lib/domain';
import clinicalCarePanel from '$lib/assets/panels/clinical-care.jpg';
import deliveryPanel from '$lib/assets/panels/delivery.jpg';
import howItWorksPanel from '$lib/assets/panels/how-it-works.jpg';
import planPanel from '$lib/assets/panels/plan.jpg';
import resultsPanel from '$lib/assets/panels/results.jpg';
import supportPanel from '$lib/assets/panels/support.jpg';
import treatmentPanel from '$lib/assets/panels/treatment.jpg';

/**
 * Every cross-feature destination in one place. Features 6 and 7 make these real by
 * adding the routes; nothing else in marketing hardcodes a path.
 */
export const ROUTES = {
	home: '/',
	questionnaire: '/questionnaire',
	learn: '/learn',
	learnArticle: (slug: string) => `/learn/blog/${slug}`
} as const;

export const FEATURED_ARTICLE_SLUG = 'mounjaro-vs-wegovy';

export interface NavItem {
	label: string;
	href: string;
	/** An undesigned route: rendered as text, never as a working link. */
	inert?: boolean;
	description?: string;
	children?: NavItem[];
}

/**
 * The landing artboard's nav. The learn artboard shows a different set; the build plan
 * rules that a reference inconsistency is not a requirement, and this one is canonical
 * because it carries the products dropdown.
 *
 * Treatment labels come from the domain catalogue, never retyped, so the dropdown and
 * the questionnaire can never disagree about a product name.
 */
export const NAV_ITEMS: readonly NavItem[] = [
	{ label: 'Home', href: ROUTES.home },
	{
		label: 'Treatments',
		href: '/treatments',
		inert: true,
		children: TREATMENTS.map((treatment) => ({
			label: treatment.form === 'tablet' ? treatment.name : `${treatment.name} Injection`,
			href: `/treatments/${treatment.id}`,
			inert: true,
			description: treatment.form === 'tablet' ? 'Daily oral treatment' : 'Weekly prescription injection'
		}))
	},
	{ label: 'About Us', href: '/about', inert: true },
	{ label: 'FAQ', href: '/#faq' },
	{ label: 'Learn', href: ROUTES.learn }
];

export const LANGUAGES = [
	{ value: 'en', label: 'English', short: 'EN', available: true },
	// Visible but never selectable: the prototype ships English only, and hiding the
	// option would misrepresent that as a decision rather than a scope boundary.
	{ value: 'de', label: 'Deutsch', short: 'DE', available: false }
] as const;

export const ANNOUNCEMENT = {
	title: 'Welcome offer.',
	body: 'Save \u20ac10 on your first online consultation'
} as const;

export interface HeroContent {
	eyebrow: string;
	headlineLead: string;
	headlineStruck: string;
	headlineTail: string;
	lead: string;
	primaryCta: string;
	secondaryCta: string;
}

export const HERO: HeroContent = {
	eyebrow: 'Doctor-led weight loss for men',
	headlineLead: 'Your pathway to lasting',
	headlineStruck: 'perfect shape',
	headlineTail: 'happiness.',
	lead: 'Personalised, doctor-led weight-loss care designed to help men feel healthier, more confident and supported for the long term.',
	primaryCta: 'Check your eligibility',
	secondaryCta: 'Explore treatments'
};

/**
 * Fictional prototype figures. The reference attributes these to a named third-party
 * review platform; inventing numbers under a real company's name is not something the
 * prototype should ship, so the badge stands on its own.
 */
export const RATING = {
	score: 4.7,
	label: '4.7 - 1,200+ reviews',
	caption: 'Mock prototype rating'
} as const;

export const ARTICLE_TEASER = {
	eyebrow: 'Latest from Learn',
	title: 'Mounjaro vs Wegovy.',
	body: 'Compare results, side effects and how each weekly treatment works in our latest expert-reviewed guide.',
	cta: 'Read the article',
	href: ROUTES.learnArticle(FEATURED_ARTICLE_SLUG)
} as const;

export interface TrustBenefit {
	icon: 'stethoscope' | 'shield-check' | 'package-check' | 'lock';
	title: string;
	body: string;
}

export const TRUST_BENEFITS: readonly TrustBenefit[] = [
	{
		icon: 'stethoscope',
		title: 'Licensed physicians.',
		body: 'Consult with licensed medical professionals experienced in men’s health.'
	},
	{
		icon: 'shield-check',
		title: 'GDPR compliant & discreet.',
		body: 'Your personal data and treatment remain private at every stage of care.'
	},
	{
		icon: 'package-check',
		title: 'Discreet pharmacy delivery.',
		body: 'When prescribed, medication is dispensed by a trusted partner pharmacy and delivered discreetly.'
	},
	{
		icon: 'lock',
		title: '100% digital & secure.',
		body: 'From consultation to follow-up, the entire process happens securely online.'
	}
];

export interface FooterColumn {
	title: string;
	links: NavItem[];
}

export const FOOTER_COLUMNS: readonly FooterColumn[] = [
	{
		title: 'Explore',
		links: [
			{ label: 'Treatments', href: '/treatments', inert: true },
			{ label: 'How it works', href: '/#how-it-works' },
			{ label: 'Our experts', href: '/#experts' }
		]
	},
	{
		title: 'Support',
		links: [
			{ label: 'About Solean', href: '/about', inert: true },
			{ label: 'FAQs', href: '/#faq' },
			{ label: 'Contact', href: '/contact', inert: true }
		]
	}
];

export const CONTACT = {
	title: 'Contact our care team',
	email: 'contact@solean.com',
	phone: '+49 111 111 111',
	hoursTitle: 'Service hours.',
	hours: [
		{ days: 'Monday–Friday', time: '09:00–18:00' },
		{ days: 'Saturday–Sunday', time: 'Closed' }
	]
} as const;

export const FOOTER_BRAND = {
	tagline: 'Better health, built around you',
	deliveryTitle: 'Payment & delivery.',
	deliveryBody: 'Trusted delivery and secure checkout',
	shippingLabel: 'Shipping',
	paymentsLabel: 'Payments',
	// Named as text rather than shipped as trademarked logo art. See the spec's open decision.
	shipping: ['DHL'],
	payments: ['Visa', 'Mastercard', 'American Express', 'Klarna'],
	pharmacyNote: 'Registered EU pharmacy',
	copyright: '© 2026 Solean',
	legal: [
		{ label: 'Privacy', href: '/privacy', inert: true },
		{ label: 'Terms', href: '/terms', inert: true },
		{ label: 'Accessibility', href: '/accessibility', inert: true }
	] satisfies NavItem[],
	social: [
		{ name: 'Instagram', label: 'Solean on Instagram', href: 'https://instagram.com' },
		{ name: 'Facebook', label: 'Solean on Facebook', href: 'https://facebook.com' }
	]
} as const;

export interface BentoCard {
	/** Drives the ground token, so a card cannot be given a colour that is not sanctioned. */
	category: 'treatment' | 'clinical-care' | 'plan' | 'support' | 'delivery';
	eyebrow: string;
	title: string;
	body: string;
	/** Set by the imagery step; a card without art still renders its copy. */
	image?: string;
}

/**
 * Grounds are resolved from the category rather than stored per card, so the five
 * cards can only ever use surfaces recorded in design-system.md section 1b. Only
 * `care` and `delivery` are new tokens; the rest reuse existing ones.
 */
export const BENTO_GROUNDS: Record<BentoCard['category'], string> = {
	treatment: 'bg-surface-care',
	'clinical-care': 'bg-surface-care',
	plan: 'bg-surface-warm',
	support: 'bg-accent',
	delivery: 'bg-surface-delivery'
};

export const BENTO_CARDS: readonly BentoCard[] = [
	{
		category: 'treatment',
		eyebrow: 'Treatment',
		title: 'Treatment, chosen for you.',
		body: 'Doctor-reviewed options tailored to your health and goals.',
		image: treatmentPanel
	},
	{
		category: 'clinical-care',
		eyebrow: 'Clinical care',
		title: 'Doctors who guide every decision.',
		body: 'Personal guidance from consultation onward.',
		image: clinicalCarePanel
	},
	{
		category: 'plan',
		eyebrow: 'Your plan',
		title: 'Everything in one clear place.',
		body: 'Track progress and stay on top of each step.',
		image: planPanel
	},
	{
		category: 'support',
		eyebrow: 'Ongoing support',
		title: 'Help throughout your journey.',
		body: 'Questions, side effects and practical support.',
		image: supportPanel
	},
	{
		category: 'delivery',
		eyebrow: 'Delivery',
		title: 'Discreet delivery, direct to you.',
		body: 'Secure treatment delivery to your door.',
		image: deliveryPanel
	}
];

export interface MiniBenefit {
	icon: 'stethoscope' | 'clipboard-check' | 'message-circle';
	title: string;
	body: string;
}

export const RESULTS_BAND = {
	benefits: [
		{
			icon: 'stethoscope',
			title: 'Licensed doctors.',
			body: 'Clinical assessment and prescribing from home.'
		},
		{
			icon: 'clipboard-check',
			title: 'A plan built around you.',
			body: 'Treatment and guidance tailored to your health.'
		},
		{
			icon: 'message-circle',
			title: 'Support that stays with you.',
			body: 'Ongoing clinical and coaching support.'
		}
	] satisfies MiniBenefit[],
	title: 'Weight loss, with care built in.',
	lead: 'Doctor-led treatment, tailored guidance and ongoing support to help you make progress that lasts.',
	cta: 'Check your eligibility',
	// The reference attributes its rating to a named review platform. Same decision as the
	// hero badge: the figures are invented, so they do not carry a real company's name.
	quote:
		'For the first time, weight loss feels structured and manageable, not like another diet I have to do alone.',
	author: 'Daniel M.',
	authorRole: 'Verified Solean member',
	image: resultsPanel
} as const;

export interface HowItWorksStep {
	title: string;
	body: string;
	/** Only the first step links onward; the rest are descriptive. */
	href?: string;
	linkLabel?: string;
}

export const HOW_IT_WORKS = {
	title: 'How it works.',
	lead: 'Three simple steps, from a quick online consultation to treatment delivered discreetly to your door.',
	image: howItWorksPanel,
	captionEyebrow: 'Doctor-led care',
	caption: 'From consultation to delivery, entirely online.',
	// Numbering is the list index at render time, so a step cannot carry a stale numeral.
	steps: [
		{
			title: 'Answer quick questions.',
			body: 'Take the online quiz, no GP or pharmacy visits required.',
			href: ROUTES.questionnaire,
			linkLabel: 'Start questionnaire'
		},
		{
			title: 'Get prescribed treatment.',
			body: 'Our clinicians review your medical history and find the right treatment for you.'
		},
		{
			title: 'Your treatment is delivered.',
			body: 'Your treatment arrives in discreet packaging, direct to your door.'
		}
	] satisfies HowItWorksStep[]
} as const;

export interface ProjectionPoint {
	/** Months from now. Spacing on the axis is ordinal, not proportional to this value. */
	month: number;
	label: string;
	kg: number;
}

export interface ProjectionHorizon {
	month: number;
	label: string;
}

/**
 * Illustrative figures, not clinical ones. The artboard plots these four points evenly
 * spaced, so 0-to-3 months and 6-to-12 months occupy the same width; the axis is a
 * sequence of milestones rather than a time line, and the geometry follows that.
 */
export const PROJECTION_SERIES: readonly ProjectionPoint[] = [
	{ month: 0, label: 'Now', kg: 96 },
	{ month: 3, label: '3 months', kg: 88 },
	{ month: 6, label: '6 months', kg: 82 },
	{ month: 12, label: '12 months', kg: 78 }
];

/** The "lifestyle alone" comparison, measured off the artboard at the same milestones. */
export const PROJECTION_COMPARISON: readonly ProjectionPoint[] = [
	{ month: 0, label: 'Now', kg: 96 },
	{ month: 3, label: '3 months', kg: 94 },
	{ month: 6, label: '6 months', kg: 92 },
	{ month: 12, label: '12 months', kg: 90 }
];

/** Derived from the series so a horizon can never name a milestone with no data point. */
export const PROJECTION_HORIZONS: readonly ProjectionHorizon[] = PROJECTION_SERIES.filter(
	(p) => p.month > 0
).map((p) => ({ month: p.month, label: p.label }));

export const DEFAULT_HORIZON_MONTH = 6;

export const PROJECTION = {
	title: 'Projected progress with Solean.',
	lead: 'Illustrative weight change when treatment is combined with clinical support.',
	seriesLabel: 'With Solean',
	comparisonLabel: 'Lifestyle alone',
	tabsLabel: 'Projection horizon',
	disclaimer:
		'Illustrative projection only. Actual outcomes vary by treatment, dose, adherence and individual health factors.',
	tableCaption: 'Modelled weight at each milestone'
} as const;

export interface MedicalFactor {
	icon: 'brain' | 'activity' | 'dna';
	label: string;
}

export const MEDICAL_FRAMING = {
	title: 'Weight loss isn’t a motivational issue, it’s a medical one.',
	// The artboard credits a competitor here; project-plan.md section 9 rules that
	// competitor names become Solean.
	body: 'Medicated weight loss isn’t ‘cheating’. Stress, hormones and genetics can all influence your weight. Solean evens the playing field.',
	factors: [
		{ icon: 'brain', label: 'Stress' },
		{ icon: 'activity', label: 'Hormones' },
		{ icon: 'dna', label: 'Genetics' }
	] satisfies MedicalFactor[],
	primaryCta: 'Check your eligibility',
	secondaryCta: 'Explore treatments'
} as const;
