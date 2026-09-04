import { m } from '$lib/paraglide/messages';
import { localizeHref } from '$lib/paraglide/runtime';
import { TREATMENTS } from '$lib/domain';
import {
	buildWeightProjection,
	PROJECTION_HORIZON_OPTIONS,
	REFERENCE_WEIGHT_KG,
	type ProjectionHorizon,
	type ProjectionPoint
} from '$lib/components/brand/projection';
import amexLogo from '$lib/assets/logos/american-express.png';
import dhlLogo from '$lib/assets/logos/dhl.png';
import euPharmacyBadge from '$lib/assets/logos/eu-pharmacy-badge.png';
import klarnaLogo from '$lib/assets/logos/klarna.png';
import mastercardLogo from '$lib/assets/logos/mastercard.png';
import visaLogo from '$lib/assets/logos/visa.png';
import type { SanityPicture } from '$lib/sanity/image';

/**
 * Every cross-feature destination in one place. Features 6 and 7 make these real by
 * adding the routes; nothing else in marketing hardcodes a path.
 */
/**
 * The canonical paths, unlocalised. Every one of them has to go through `localizeHref` at the
 * link, never here: this table is a module constant, evaluated once at import, while the
 * locale belongs to the request. An unlocalised internal link is not a cosmetic slip, it is a
 * language switch: German is the base locale and owns the bare path, so `/questionnaire`
 * means the German funnel and takes an English reader with it.
 */
export const ROUTES = {
	home: '/',
	questionnaire: '/questionnaire',
	learn: '/learn',
	learnArticle: (slug: string) => `/learn/blog/${slug}`
} as const;

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
/**
 * A function, not a constant: messages resolve against the active locale at call time, and a
 * module-level const would freeze whichever locale happened to be current when the module was
 * first imported. Every localised export in this file is a function for the same reason.
 *
 * Product names are not translated. `Mounjaro` is a brand, and "Injection" stays attached to
 * it as the German market writes it.
 */
export function navItems(): readonly NavItem[] {
	return [
		{ label: m.nav_home(), href: localizeHref(ROUTES.home) },
		{
			label: m.nav_treatments(),
			href: '/treatments',
			inert: true,
			children: TREATMENTS.map((treatment) => ({
				label: treatment.form === 'tablet' ? treatment.name : `${treatment.name} Injection`,
				href: `/treatments/${treatment.id}`,
				inert: true,
				description:
					treatment.form === 'tablet' ? m.nav_treatment_tablet() : m.nav_treatment_injection()
			}))
		},
		{ label: m.nav_about(), href: '/about', inert: true },
		{ label: m.nav_faq(), href: localizeHref('/#faq') },
		{ label: m.nav_learn(), href: localizeHref(ROUTES.learn) }
	];
}

/** Both are real destinations now; the codes are the locales the Paraglide runtime knows. */
export const LANGUAGES = [
	{ value: 'en', label: 'English', short: 'EN' },
	{ value: 'de', label: 'Deutsch', short: 'DE' }
] as const;

export interface AnnouncementContent {
	title: string;
	prefix: string;
	amount: string;
	suffix: string;
	/** The narrow bar sets the offer as two plain lines, so it needs no emphasis split. */
	mobile: { title: string; detail: string };
}

/**
 * The figures shown when Reviews.io cannot be reached. They are the platform's own, read from
 * the profile on 2026-09-01, not invented: the badge prints the platform's name, so a made-up
 * fallback would attribute numbers to a company that reports different ones. The live figures
 * come from the landing page's server load.
 */
export const RATING = {
	platform: 'Reviews.io',
	fallback: { score: 4.9, total: 104 },
	href: 'https://www.reviews.io/company-reviews/store/www.solean.com'
} as const;

export interface TrustBenefit {
	icon: 'stethoscope' | 'shield-check' | 'package-check' | 'lock';
	title: string;
	body: string;
}

export interface FooterColumn {
	title: string;
	links: NavItem[];
}

export function footerColumns(): readonly FooterColumn[] {
	return [
		{
			title: m.footer_column_explore(),
			links: [
				{ label: m.footer_link_treatments(), href: '/treatments', inert: true },
				{ label: m.footer_link_how_it_works(), href: localizeHref('/#how-it-works') },
				{ label: m.footer_link_experts(), href: localizeHref('/#experts') }
			]
		},
		{
			title: m.footer_column_support(),
			links: [
				{ label: m.footer_link_about(), href: '/about', inert: true },
				{ label: m.footer_link_faqs(), href: localizeHref('/#faq') },
				{ label: m.footer_link_contact(), href: '/contact', inert: true }
			]
		}
	];
}

/**
 * The real support details and hours, as the Impressum and the contact page state them. The
 * address and number are not translated; only the words around them are.
 */
export function contact() {
	return {
		title: m.footer_contact_title(),
		emailLabel: m.footer_contact_email(),
		email: 'support@solean.com',
		phoneLabel: m.footer_contact_phone(),
		phone: '+49 40 87709420',
		hoursTitle: m.footer_hours_title(),
		hours: [
			{ days: m.footer_hours_weekdays(), time: '09:00–17:00' },
			{ days: m.footer_hours_friday(), time: '09:00–16:00' },
			{ days: m.footer_hours_weekend(), time: m.footer_hours_closed() }
		]
	};
}

export interface SocialAccount {
	icon: 'instagram' | 'facebook';
	/** Accessible name; the button itself is icon only. */
	label: string;
	href: string;
}

export function footerBrand() {
	return {
		tagline: m.footer_tagline(),
		deliveryTitle: m.footer_delivery_title(),
		deliveryBody: m.footer_delivery_body(),
		shippingLabel: m.footer_shipping_label(),
		paymentsLabel: m.footer_payments_label(),
		// Carrier and card names are marks, not words: they read the same in both languages.
		shipping: [{ name: 'DHL', src: dhlLogo }],
		payments: [
			{ name: 'Visa', src: visaLogo },
			{ name: 'Mastercard', src: mastercardLogo },
			{ name: 'American Express', src: amexLogo },
			{ name: 'Klarna', src: klarnaLogo }
		],
		pharmacyNote: m.footer_pharmacy_note(),
		pharmacyBadge: {
			src: euPharmacyBadge,
			// The badge art is Dutch; its own wording is the verification claim, not ours to translate.
			alt: m.footer_pharmacy_badge_alt()
		},
		copyright: m.footer_copyright(),
		/**
		 * The four documents Solean publishes, German in both locales because they are the
		 * German legal texts. Only the labels change language; the documents do not.
		 */
		legal: [
			{ label: m.footer_legal_notice(), href: localizeHref('/legal-notice') },
			{ label: m.footer_legal_privacy(), href: localizeHref('/privacy') },
			{ label: m.footer_legal_terms(), href: localizeHref('/terms') },
			{ label: m.footer_legal_cancellation(), href: localizeHref('/returns') }
		] satisfies NavItem[],
		social: [
			{ icon: 'instagram', label: m.social_instagram(), href: 'https://instagram.com' },
			{ icon: 'facebook', label: m.social_facebook(), href: 'https://facebook.com' }
		] satisfies readonly SocialAccount[]
	};
}

export interface BentoCard {
	/** Drives the ground token, so a card cannot be given a colour that is not sanctioned. */
	category: 'treatment' | 'clinical-care' | 'plan' | 'support' | 'delivery';
	eyebrow: string;
	title: string;
	body: string;
	/** Set by the imagery step; a card without art still renders its copy. */
	image?: SanityPicture;
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

export interface MiniBenefit {
	icon: 'stethoscope' | 'clipboard-check' | 'message-circle';
	title: string;
	body: string;
}

export interface HowItWorksStep {
	title: string;
	body: string;
	/** Only the first step links onward; the rest are descriptive. */
	href?: string;
	linkLabel?: string;
}

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
	photo?: SanityPicture;
}

export interface Clinician {
	name: string;
	role: string;
	description: string;
	portrait?: SanityPicture;
}

export interface FaqItem {
	question: string;
	answer: string;
}

