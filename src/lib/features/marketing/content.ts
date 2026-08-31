import { TREATMENTS } from '$lib/domain';
import {
	buildWeightProjection,
	PROJECTION_HORIZON_OPTIONS,
	REFERENCE_WEIGHT_KG,
	type ProjectionHorizon,
	type ProjectionPoint
} from '$lib/components/brand/projection';
import careVisual from '$lib/assets/panels/care-visual.webp';
import clinicalCarePanel from '$lib/assets/panels/clinical-care.jpg';
import deliveryPanel from '$lib/assets/panels/delivery.jpg';
import howItWorksPanel from '$lib/assets/panels/how-it-works.jpg';
import planPanel from '$lib/assets/panels/plan.jpg';
import supportPanel from '$lib/assets/panels/support.jpg';
import treatmentPanel from '$lib/assets/panels/treatment.jpg';
import amexLogo from '$lib/assets/logos/american-express.png';
import dhlLogo from '$lib/assets/logos/dhl.png';
import euPharmacyBadge from '$lib/assets/logos/eu-pharmacy-badge.png';
import klarnaLogo from '$lib/assets/logos/klarna.png';
import mastercardLogo from '$lib/assets/logos/mastercard.png';
import visaLogo from '$lib/assets/logos/visa.png';
import danielPortrait from '$lib/assets/people/daniel-m.jpg';
import eliasVossPortrait from '$lib/assets/people/elias-voss.jpg';
import gredelPortrait from '$lib/assets/people/gredel.jpg';
import jurajGalanPortrait from '$lib/assets/people/juraj-galan.jpg';
import storyPhoto from '$lib/assets/people/story-photo.jpg';

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

export type { ProjectionHorizon, ProjectionPoint };

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
	prefix: 'Save',
	amount: '\u20ac10',
	suffix: 'on your first online consultation'
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
	href: 'https://www.reviews.io/company-reviews/store/www.solean.com',
	/** The results band prints the score as a numeral, so its line carries the volume and the source. */
	reviewCount: '1,200+ reviews on Reviews.io',
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

export interface SocialAccount {
	icon: 'instagram' | 'facebook';
	/** Accessible name; the button itself is icon only. */
	label: string;
	href: string;
}

export const FOOTER_BRAND = {
	tagline: 'Better health, built around you',
	deliveryTitle: 'Payment & delivery.',
	deliveryBody: 'Trusted delivery and secure checkout',
	shippingLabel: 'Shipping',
	paymentsLabel: 'Payments',
	shipping: [{ name: 'DHL', src: dhlLogo }],
	payments: [
		{ name: 'Visa', src: visaLogo },
		{ name: 'Mastercard', src: mastercardLogo },
		{ name: 'American Express', src: amexLogo },
		{ name: 'Klarna', src: klarnaLogo }
	],
	pharmacyNote: 'Registered EU pharmacy',
	pharmacyBadge: {
		src: euPharmacyBadge,
		// The badge art is Dutch; its own wording is the verification claim, not ours to translate.
		alt: 'Registered EU pharmacy verification badge'
	},
	copyright: '© 2026 Solean',
	legal: [
		{ label: 'Privacy', href: '/privacy', inert: true },
		{ label: 'Terms', href: '/terms', inert: true },
		{ label: 'Accessibility', href: '/accessibility', inert: true }
	] satisfies NavItem[],
	social: [
		{ icon: 'instagram', label: 'Solean on Instagram', href: 'https://instagram.com' },
		{ icon: 'facebook', label: 'Solean on Facebook', href: 'https://facebook.com' }
	] satisfies readonly SocialAccount[]
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
	authorAvatar: danielPortrait,
	/** No destination exists until a review platform is chosen, so this stays inert. */
	reviewCta: 'Leave a review',
	image: careVisual
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

/**
 * Illustrative figures, not clinical ones. Derived from the shared model at the reference
 * weight rather than restated, so the landing page and the questionnaire interstitial plot
 * one curve. The artboard spaces these four points evenly, so 0-to-3 months and 6-to-12
 * months occupy the same width; the axis is a sequence of milestones, not a time line.
 */
const REFERENCE_PROJECTION = buildWeightProjection(REFERENCE_WEIGHT_KG);

export const PROJECTION_SERIES: readonly ProjectionPoint[] = REFERENCE_PROJECTION.series;

/** The "lifestyle alone" comparison, at the same milestones. */
export const PROJECTION_COMPARISON: readonly ProjectionPoint[] = REFERENCE_PROJECTION.comparison;

export const PROJECTION_HORIZONS: readonly ProjectionHorizon[] = PROJECTION_HORIZON_OPTIONS;

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

export interface Testimonial {
	name: string;
	memberLabel: string;
	kgLost: number;
	quote: string;
	rating: number;
	/** A domain id, not a label: a catalogue rename cannot orphan a testimonial. */
	treatmentId: string;
	verified: boolean;
	/** Present on the photo variant only. */
	photo?: string;
}

/**
 * The artboard gives all three people the same 22 kg and repeats one treatment across
 * two of them. project-plan.md section 9 rules that duplication out, so each story here
 * carries its own figure and the treatments span the catalogue.
 */
export const TESTIMONIALS: readonly Testimonial[] = [
	{
		name: 'Amy R.',
		memberLabel: 'Solean member',
		kgLost: 22,
		quote: 'I finally feel in control of my health. The support was personal, clear and built around real life.',
		rating: 5,
		treatmentId: 'wegovy',
		verified: true
	},
	{
		name: 'Maya R.',
		memberLabel: 'Solean member',
		kgLost: 17,
		quote: 'Having a clinician actually read my history changed how I felt about starting at all.',
		rating: 5,
		treatmentId: 'mounjaro',
		verified: true,
		photo: storyPhoto
	},
	{
		name: 'Sarah T.',
		memberLabel: 'Solean member',
		kgLost: 14,
		quote: 'The plan felt achievable from day one. I have more energy, more confidence and support when I need it.',
		rating: 5,
		treatmentId: 'wegovy-pill',
		verified: true
	},
	{
		name: 'Tom B.',
		memberLabel: 'Solean member',
		kgLost: 19,
		quote: 'Being able to message the care team between reviews is what kept me going through the first month.',
		rating: 5,
		treatmentId: 'mounjaro',
		verified: true
	},
	{
		name: 'Priya N.',
		memberLabel: 'Solean member',
		kgLost: 11,
		quote: 'No pharmacy queues, no awkward conversations. It arrived discreetly and the check-ins were genuinely useful.',
		rating: 4,
		treatmentId: 'wegovy',
		verified: true
	}
];

export const TESTIMONIALS_SECTION = {
	title: 'Real stories. Real results.',
	lead: 'Real experiences from members supported by Solean.',
	carouselLabel: 'Member stories',
	weightLostLabel: 'Weight lost',
	verifiedLabel: 'Verified story'
} as const;

export interface Clinician {
	name: string;
	role: string;
	description: string;
	portrait?: string;
}

export const JURAJ_GALAN: Clinician = {
	name: 'Dr. Juraj Galan',
	role: 'Consulting physician',
	description:
		'Provides medical consultations, reviews your health profile and helps determine a safe, appropriate treatment plan.',
	portrait: jurajGalanPortrait
};

export const CLINICIANS: readonly Clinician[] = [
	JURAJ_GALAN,
	{
		name: 'Gredel',
		role: 'Weight-loss coach',
		description:
			'Offers practical, one-to-one coaching to help you build sustainable habits and stay on track throughout your journey.',
		portrait: gredelPortrait
	},
	{
		name: 'Dr. Elias Voss',
		role: 'Prescribing clinician',
		description:
			'Reviews treatment progress, answers medication questions and adjusts your care when clinically appropriate.',
		portrait: eliasVossPortrait
	}
];

export const CLINICAL_TEAM = {
	title: 'Doctors who stay with you.',
	lead: 'Your doctor helps identify the right treatment and supports you through every stage of your plan.',
	carouselLabel: 'Clinical team',
	learnMore: 'Learn more'
} as const;

export interface FaqItem {
	question: string;
	answer: string;
}

export const FAQ = {
	title: 'Frequently asked questions.',
	lead: 'Clear answers about treatment, eligibility, delivery and ongoing support.',
	items: [
		{
			question: 'Are they safe, and what side effects should I expect?',
			answer:
				'Weight-loss medicines are clinically tested and prescribed only when a doctor considers them suitable for you. Common side effects can include nausea, constipation, diarrhoea or reduced appetite, and they often improve as your body adjusts. Your clinician will explain the risks, monitor your progress and advise you if symptoms persist or feel severe.'
		},
		{
			question: 'Will I regain weight if I stop taking it?',
			answer:
				'Some weight regain is common after stopping, which is why treatment is paired with coaching and habit support. Your clinician will discuss how to taper and what to expect before you make that decision.'
		},
		{
			question: 'Am I eligible?',
			answer:
				'Eligibility depends on your health profile, your medical history and your current measurements. The online questionnaire collects what a clinician needs, and they confirm whether treatment is appropriate for you.'
		},
		{
			question: 'I don’t want anyone to know I’m receiving weight-loss treatment. Can I keep it private?',
			answer:
				'Yes. Consultations happen online, your data is handled under GDPR, and medication arrives in discreet, unbranded packaging.'
		},
		{
			question: 'What’s included in the price?',
			answer:
				'Your plan covers the treatment itself, clinical review, and ongoing support from the care team. Optional extras such as coaching or a smart scale are priced separately and always shown before you pay.'
		},
		{
			question: 'How quickly will I see results?',
			answer:
				'Most people notice changes within the first few months, though the pace varies by treatment, dose, adherence and individual health factors. Your clinician sets realistic expectations at the start.'
		},
		{
			question: 'Will I lose my appetite completely, or still be able to enjoy food?',
			answer:
				'These treatments reduce appetite rather than remove it. Most people eat smaller portions and feel full sooner, while still enjoying meals normally.'
		}
	] satisfies FaqItem[]
} as const;
