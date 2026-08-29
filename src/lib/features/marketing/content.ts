import { TREATMENTS } from '$lib/domain';

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
