// Direct, not through `@sanity/sveltekit`, for the reason given in `client.ts`. `defineQuery`
// rather than the `groq` tag: it is the form Sanity TypeGen reads, so wiring TypeGen later needs
// no change here.
import { defineQuery } from 'groq';

/**
 * Every query is scoped by `$language`. Translations are separate documents linked by the
 * Studio's translation metadata, so a query without the filter would return the same article
 * once per locale.
 */
export const articlesQuery = defineQuery(`*[_type == "article" && language == $language && defined(slug.current)]
	| order(reviewedAt desc){
		_id,
		title,
		category,
		summary,
		slug,
		reviewedAt,
		readTimeMinutes,
		hero,
		reviewer->{ name, portrait }
	}`);

export const articleQuery = defineQuery(`*[_type == "article" && language == $language && slug.current == $slug][0]{
	_id,
	title,
	shortTitle,
	category,
	summary,
	slug,
	hero,
	reviewedAt,
	nextReviewAt,
	readTimeMinutes,
	quickAnswer,
	keyTakeaways,
	howTheyWork,
	expectedResults,
	sideEffects,
	sourcesSummary,
	reviewer->{ _id, name, role, description, portrait },
	treatmentProfiles[]{
		_key,
		treatmentId,
		activeIngredient,
		manufacturer,
		frequency,
		mainAction,
		manufacturerNote
	},
	faqs[]{ _key, question, answer },
	sources[]{ _key, label, href },
	related[]->{ _id, title, category, slug },
	seoTitle,
	seoDescription
}`);

export interface SanityImage {
	asset?: { _ref: string };
	alt?: string;
}

export interface ArticleListItem {
	_id: string;
	title: string;
	category: string;
	summary: string;
	slug: { current: string };
	reviewedAt: string;
	readTimeMinutes?: number;
	hero?: SanityImage;
	/** The Journal card credits the doctor; the article page reads the fuller shape below. */
	reviewer?: { name: string; portrait?: SanityImage };
}

export interface ArticleDetail extends ArticleListItem {
	shortTitle?: string;
	seoTitle?: string;
	seoDescription?: string;
	nextReviewAt?: string;
	quickAnswer?: string[];
	keyTakeaways?: string[];
	howTheyWork?: string[];
	expectedResults?: string[];
	sideEffects?: { intro?: string; items?: string[] };
	sourcesSummary?: string;
	reviewer?: {
		_id: string;
		name: string;
		role: string;
		description?: string;
		portrait?: SanityImage;
	};
	treatmentProfiles?: {
		_key: string;
		treatmentId: string;
		activeIngredient: string;
		manufacturer: string;
		frequency?: string;
		mainAction?: string;
		manufacturerNote?: string;
	}[];
	faqs?: { _key: string; question: string; answer: string }[];
	sources?: { _key: string; label: string; href?: string }[];
	related?: { _id: string; title: string; category: string; slug: { current: string } }[];
}

/** The announcement bar shows on every marketing page, so the layout reads it on its own. */
export const announcementQuery = defineQuery(
	`*[_id == "homePage-" + $language][0].announcement{
		title, prefix, amount, suffix, mobileTitle, mobileDetail
	}`
);

/** The landing page, addressed by its fixed id rather than looked up by language. */
export const homePageQuery = defineQuery(`*[_id == "homePage-" + $language][0]{
	hero{
		eyebrow, headlineLead, headlineStruck, headlineTail, lead,
		primaryCta, secondaryCta, mobileEyebrow, mobileHeadline, mobileLead, image
	},
	articleTeaser{ eyebrow, title, body, cta },
	trustBenefits[]{ _key, icon, title, body },
	bento{ eyebrow, title, cards[]{ _key, category, eyebrow, title, body, image } },
	resultsBand{
		eyebrow, title, lead, cta, quote, author, authorRole, reviewCta, image, authorAvatar,
		benefits[]{ _key, icon, title, body }
	},
	howItWorks{
		title, lead, captionEyebrow, caption, image,
		steps[]{ _key, title, body, href, linkLabel }
	},
	projection{ title, lead, seriesLabel, comparisonLabel, tabsLabel, disclaimer, tableCaption },
	medicalFraming{ title, body, primaryCta, secondaryCta, factors[]{ _key, icon, label } },
	testimonialsSection{
		title, lead,
		testimonials[]->{ _id, name, memberLabel, quote, kgLost, rating, treatmentId, verified, photo }
	},
	clinicalTeam{
		title, lead, carouselLabel, learnMore,
		clinicians[]->{ _id, name, role, description, portrait }
	},
	faq{ title, lead, items[]{ _key, question, answer } }
}`);

export interface Announcement {
	title: string;
	prefix: string;
	amount: string;
	suffix: string;
	mobileTitle: string;
	mobileDetail: string;
}

interface IconBenefit {
	_key: string;
	icon: string;
	title: string;
	body: string;
}

export interface HomePage {
	hero?: {
		eyebrow: string;
		headlineLead: string;
		headlineStruck: string;
		headlineTail: string;
		lead: string;
		primaryCta: string;
		secondaryCta: string;
		mobileEyebrow: string;
		mobileHeadline: string;
		mobileLead: string;
		image: SanityImage;
	};
	articleTeaser?: { eyebrow: string; title: string; body: string; cta: string };
	trustBenefits?: IconBenefit[];
	bento?: {
		eyebrow: string;
		title: string;
		cards: {
			_key: string;
			category: string;
			eyebrow: string;
			title: string;
			body: string;
			image: SanityImage;
		}[];
	};
	resultsBand?: {
		eyebrow: string;
		title: string;
		lead: string;
		cta: string;
		quote: string;
		author: string;
		authorRole: string;
		reviewCta: string;
		image: SanityImage;
		authorAvatar: SanityImage;
		benefits: IconBenefit[];
	};
	howItWorks?: {
		title: string;
		lead: string;
		captionEyebrow: string;
		caption: string;
		image: SanityImage;
		steps: { _key: string; title: string; body: string; href?: string; linkLabel?: string }[];
	};
	projection?: {
		title: string;
		lead: string;
		seriesLabel: string;
		comparisonLabel: string;
		tabsLabel: string;
		disclaimer: string;
		tableCaption: string;
	};
	medicalFraming?: {
		title: string;
		body: string;
		primaryCta: string;
		secondaryCta: string;
		factors: { _key: string; icon: string; label: string }[];
	};
	testimonialsSection?: {
		title: string;
		lead: string;
		testimonials: {
			_id: string;
			name: string;
			memberLabel: string;
			quote: string;
			kgLost: number;
			rating: number;
			treatmentId: string;
			verified: boolean;
			photo?: SanityImage;
		}[];
	};
	clinicalTeam?: {
		title: string;
		lead: string;
		carouselLabel: string;
		learnMore: string;
		clinicians: { _id: string; name: string; role: string; description: string; portrait?: SanityImage }[];
	};
	faq?: { title: string; lead: string; items: { _key: string; question: string; answer: string }[] };
}

/** The questionnaire's motivation screen borrows one story, so it reads them server-side. */
export const testimonialsQuery = defineQuery(
	`*[_type == "testimonial" && language == $language]{
		_id, name, memberLabel, quote, kgLost, rating, treatmentId, verified, photo
	}`
);

export type SanityTestimonial =
	NonNullable<HomePage['testimonialsSection']>['testimonials'][number];
