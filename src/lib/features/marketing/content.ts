/*
 * `imgSizes` is what switches an import from `x` descriptors to `w` descriptors, which is
 * what makes each component's own `sizes` attribute mean anything. The plugin never reads
 * the value (see `get_widths` in @sveltejs/enhanced-img), only whether it is set, so `100vw`
 * is written here as the honest widest slot each of these images fills rather than as a
 * restatement of the breakpoint list its component already declares.
 *
 * An explicit `w` list replaces the plugin's device ladder, which starts at 540 and would
 * still hand a 132px bento row card or a 40px avatar something several times too wide. Each
 * list therefore carries a small step and stops near its own source width, because the
 * plugin only appends that width when it is choosing the ladder itself. A value above the
 * source is dropped rather than upscaled, so a re-exported asset degrades to the next
 * candidate down instead of breaking.
 */
import { m } from '$lib/paraglide/messages';
import { TREATMENTS } from '$lib/domain';
import {
	buildWeightProjection,
	PROJECTION_HORIZON_OPTIONS,
	REFERENCE_WEIGHT_KG,
	type ProjectionHorizon,
	type ProjectionPoint
} from '$lib/components/brand/projection';
import careVisual from '$lib/assets/panels/care-visual-enhanced.webp?enhanced&imgSizes=100vw&quality=90';
import clinicalCarePanel from '$lib/assets/panels/clinical-care-enhanced.webp?enhanced&imgSizes=100vw&w=400;540;768;1080;1366;1536&quality=90';
import deliveryPanel from '$lib/assets/panels/delivery-enhanced.webp?enhanced&imgSizes=100vw&w=400;540;768;1080;1366;1536&quality=90';
import howItWorksPanel from '$lib/assets/panels/how-it-works-enhanced.webp?enhanced&imgSizes=100vw&quality=90';
import planPanel from '$lib/assets/panels/plan-enhanced.webp?enhanced&imgSizes=100vw&w=400;540;768;1080;1366;1536&quality=90';
import supportPanel from '$lib/assets/panels/support-enhanced.webp?enhanced&imgSizes=100vw&w=400;540;768;1080;1366;1536&quality=90';
import treatmentPanel from '$lib/assets/panels/treatment-card-enhanced.webp?enhanced&imgSizes=100vw&w=400;540;768;1080;1315&quality=90';
import amexLogo from '$lib/assets/logos/american-express.png';
import dhlLogo from '$lib/assets/logos/dhl.png';
import euPharmacyBadge from '$lib/assets/logos/eu-pharmacy-badge.png';
import klarnaLogo from '$lib/assets/logos/klarna.png';
import mastercardLogo from '$lib/assets/logos/mastercard.png';
import visaLogo from '$lib/assets/logos/visa.png';
import danielPortrait from '$lib/assets/people/daniel-m-enhanced.webp?enhanced&imgSizes=40px&w=40;80;120&quality=90';
import eliasVossPortrait from '$lib/assets/people/elias-voss-enhanced.webp?enhanced&imgSizes=100vw&quality=90';
import gredelPortrait from '$lib/assets/people/gredel-enhanced.webp?enhanced&imgSizes=100vw&quality=90';
import jurajGalanPortrait from '$lib/assets/people/juraj-galan-enhanced.webp?enhanced&imgSizes=100vw&w=120;240;540;768;1080;1366&quality=90';
import storyPhoto from '$lib/assets/people/story-photo-enhanced.webp?enhanced&imgSizes=100vw&quality=90';
import type { Picture } from '@sveltejs/enhanced-img';

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
		{ label: m.nav_home(), href: ROUTES.home },
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
		{ label: m.nav_faq(), href: '/#faq' },
		{ label: m.nav_learn(), href: ROUTES.learn }
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

export function announcement(): AnnouncementContent {
	return {
		title: m.announcement_title(),
		prefix: m.announcement_prefix(),
		amount: m.announcement_amount(),
		suffix: m.announcement_suffix(),
		mobile: {
			title: m.announcement_mobile_title(),
			detail: m.announcement_mobile_detail()
		}
	};
}

export interface MobileHeroContent {
	eyebrow: string;
	headline: string;
	lead: string;
}

export interface HeroContent {
	eyebrow: string;
	headlineLead: string;
	headlineStruck: string;
	headlineTail: string;
	lead: string;
	primaryCta: string;
	secondaryCta: string;
	mobile: MobileHeroContent;
}

export function hero(): HeroContent {
	return {
		eyebrow: m.hero_eyebrow(),
		headlineLead: m.hero_headline_lead(),
		headlineStruck: m.hero_headline_struck(),
		headlineTail: m.hero_headline_tail(),
		lead: m.hero_lead(),
		primaryCta: m.hero_primary_cta(),
		secondaryCta: m.hero_secondary_cta(),
		mobile: {
			eyebrow: m.hero_mobile_eyebrow(),
			headline: m.hero_mobile_headline(),
			lead: m.hero_mobile_lead()
		}
	};
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

export function articleTeaser() {
	return {
		eyebrow: m.teaser_eyebrow(),
		title: m.teaser_title(),
		body: m.teaser_body(),
		cta: m.teaser_cta(),
		href: ROUTES.learnArticle(FEATURED_ARTICLE_SLUG)
	};
}

export interface TrustBenefit {
	icon: 'stethoscope' | 'shield-check' | 'package-check' | 'lock';
	title: string;
	body: string;
}

export function trustBenefits(): readonly TrustBenefit[] {
	return [
		{ icon: 'stethoscope', title: m.trust_physicians_title(), body: m.trust_physicians_body() },
		{ icon: 'shield-check', title: m.trust_gdpr_title(), body: m.trust_gdpr_body() },
		{ icon: 'package-check', title: m.trust_delivery_title(), body: m.trust_delivery_body() },
		{ icon: 'lock', title: m.trust_digital_title(), body: m.trust_digital_body() }
	];
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
				{ label: m.footer_link_how_it_works(), href: '/#how-it-works' },
				{ label: m.footer_link_experts(), href: '/#experts' }
			]
		},
		{
			title: m.footer_column_support(),
			links: [
				{ label: m.footer_link_about(), href: '/about', inert: true },
				{ label: m.footer_link_faqs(), href: '/#faq' },
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
			{ label: m.footer_legal_notice(), href: '/legal-notice' },
			{ label: m.footer_legal_privacy(), href: '/privacy' },
			{ label: m.footer_legal_terms(), href: '/terms' },
			{ label: m.footer_legal_cancellation(), href: '/returns' }
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
	image?: Picture;
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

/** The narrow artboard gives this section a visible heading; the wide one does not. */
export function bentoSection() {
	return { eyebrow: m.bento_section_eyebrow(), title: m.bento_section_title() };
}

export function bentoCards(): readonly BentoCard[] {
	return [
		{
			category: 'treatment',
			eyebrow: m.bento_treatment_eyebrow(),
			title: m.bento_treatment_title(),
			body: m.bento_treatment_body(),
			image: treatmentPanel
		},
		{
			category: 'clinical-care',
			eyebrow: m.bento_care_eyebrow(),
			title: m.bento_care_title(),
			body: m.bento_care_body(),
			image: clinicalCarePanel
		},
		{
			category: 'plan',
			eyebrow: m.bento_plan_eyebrow(),
			title: m.bento_plan_title(),
			body: m.bento_plan_body(),
			image: planPanel
		},
		{
			category: 'support',
			eyebrow: m.bento_support_eyebrow(),
			title: m.bento_support_title(),
			body: m.bento_support_body(),
			image: supportPanel
		},
		{
			category: 'delivery',
			eyebrow: m.bento_delivery_eyebrow(),
			title: m.bento_delivery_title(),
			body: m.bento_delivery_body(),
			image: deliveryPanel
		}
	];
}

export interface MiniBenefit {
	icon: 'stethoscope' | 'clipboard-check' | 'message-circle';
	title: string;
	body: string;
}

export function resultsBand() {
	return {
		/** The narrow artboard names this block above its heading; the wide one does not. */
		eyebrow: m.results_eyebrow(),
		benefits: [
			{ icon: 'stethoscope', title: m.results_doctors_title(), body: m.results_doctors_body() },
			{ icon: 'clipboard-check', title: m.results_plan_title(), body: m.results_plan_body() },
			{ icon: 'message-circle', title: m.results_support_title(), body: m.results_support_body() }
		] satisfies MiniBenefit[],
		title: m.results_title(),
		lead: m.results_lead(),
		cta: m.results_cta(),
		quote: m.results_quote(),
		// A person's name, not a word: the same in both languages.
		author: 'Daniel M.',
		authorRole: m.results_author_role(),
		authorAvatar: danielPortrait,
		/** No destination exists until a review platform is chosen, so this stays inert. */
		reviewCta: m.results_review_cta(),
		image: careVisual
	};
}

export interface HowItWorksStep {
	title: string;
	body: string;
	/** Only the first step links onward; the rest are descriptive. */
	href?: string;
	linkLabel?: string;
}

export function howItWorks() {
	return {
		title: m.how_title(),
		lead: m.how_lead(),
		image: howItWorksPanel,
		captionEyebrow: m.how_caption_eyebrow(),
		caption: m.how_caption(),
		// Numbering is the list index at render time, so a step cannot carry a stale numeral.
		steps: [
			{
				title: m.how_step1_title(),
				body: m.how_step1_body(),
				href: ROUTES.questionnaire,
				linkLabel: m.how_step1_link()
			},
			{ title: m.how_step2_title(), body: m.how_step2_body() },
			{ title: m.how_step3_title(), body: m.how_step3_body() }
		] satisfies HowItWorksStep[]
	};
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

export function projection() {
	return {
		title: m.projection_title(),
		lead: m.projection_lead(),
		seriesLabel: m.projection_series_label(),
		comparisonLabel: m.projection_comparison_label(),
		tabsLabel: m.projection_tabs_label(),
		disclaimer: m.projection_disclaimer(),
		tableCaption: m.projection_table_caption()
	};
}

export interface MedicalFactor {
	icon: 'brain' | 'activity' | 'dna';
	label: string;
}

export function medicalFraming() {
	return {
		title: m.framing_title(),
		// The artboard credits a competitor here; project-plan.md section 9 rules that
		// competitor names become Solean.
		body: m.framing_body(),
		factors: [
			{ icon: 'brain', label: m.framing_factor_stress() },
			{ icon: 'activity', label: m.framing_factor_hormones() },
			{ icon: 'dna', label: m.framing_factor_genetics() }
		] satisfies MedicalFactor[],
		primaryCta: m.framing_primary_cta(),
		secondaryCta: m.framing_secondary_cta()
	};
}

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
	photo?: Picture;
}

/**
 * The artboard gives all three people the same 22 kg and repeats one treatment across
 * two of them. project-plan.md section 9 rules that duplication out, so each story here
 * carries its own figure and the treatments span the catalogue.
 */
/** Names are people, not words: they read the same in both languages. */
export function testimonials(): readonly Testimonial[] {
	return [
		{
			name: 'Amy R.',
			memberLabel: m.member_label(),
			kgLost: 22,
			quote: m.testimonial_amy(),
			rating: 5,
			treatmentId: 'wegovy',
			verified: true
		},
		{
			name: 'Maya R.',
			memberLabel: m.member_label(),
			kgLost: 17,
			quote: m.testimonial_maya(),
			rating: 5,
			treatmentId: 'mounjaro',
			verified: true,
			photo: storyPhoto
		},
		{
			name: 'Sarah T.',
			memberLabel: m.member_label(),
			kgLost: 14,
			quote: m.testimonial_sarah(),
			rating: 5,
			treatmentId: 'wegovy-pill',
			verified: true
		},
		{
			name: 'Tom B.',
			memberLabel: m.member_label(),
			kgLost: 19,
			quote: m.testimonial_tom(),
			rating: 5,
			treatmentId: 'mounjaro',
			verified: true
		},
		{
			name: 'Priya N.',
			memberLabel: m.member_label(),
			kgLost: 11,
			quote: m.testimonial_priya(),
			rating: 4,
			treatmentId: 'wegovy',
			verified: true
		}
	];
}

export function testimonialsSection() {
	return {
		title: m.stories_title(),
		lead: m.stories_lead(),
		carouselLabel: m.stories_carousel_label(),
		weightLostLabel: m.stories_weight_lost(),
		verifiedLabel: m.stories_verified()
	};
}

export interface Clinician {
	name: string;
	role: string;
	description: string;
	portrait?: Picture;
}

/** The reviewer the Learn article credits, so it is named once and reused. */
export function jurajGalan(): Clinician {
	return {
		name: 'Dr. Juraj Galan',
		role: m.clinician_galan_role(),
		description: m.clinician_galan_description(),
		portrait: jurajGalanPortrait
	};
}

export function clinicians(): readonly Clinician[] {
	return [
		jurajGalan(),
		{
			name: 'Gredel',
			role: m.clinician_gredel_role(),
			description: m.clinician_gredel_description(),
			portrait: gredelPortrait
		},
		{
			name: 'Dr. Elias Voss',
			role: m.clinician_voss_role(),
			description: m.clinician_voss_description(),
			portrait: eliasVossPortrait
		}
	];
}

export function clinicalTeam() {
	return {
		title: m.team_title(),
		lead: m.team_lead(),
		carouselLabel: m.team_carousel_label(),
		learnMore: m.team_learn_more()
	};
}

export interface FaqItem {
	question: string;
	answer: string;
}

export function faq() {
	return {
		title: m.faq_title(),
		lead: m.faq_lead(),
		items: [
			{ question: m.faq_safety_q(), answer: m.faq_safety_a() },
			{ question: m.faq_regain_q(), answer: m.faq_regain_a() },
			{ question: m.faq_eligible_q(), answer: m.faq_eligible_a() },
			{ question: m.faq_privacy_q(), answer: m.faq_privacy_a() },
			{ question: m.faq_price_q(), answer: m.faq_price_a() },
			{ question: m.faq_results_q(), answer: m.faq_results_a() },
			{ question: m.faq_appetite_q(), answer: m.faq_appetite_a() }
		] satisfies FaqItem[]
	};
}
