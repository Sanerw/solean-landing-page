// Direct, not through `@sanity/sveltekit`, for the reason given in `client.ts`. `defineQuery`
// rather than the `groq` tag: it is the form Sanity TypeGen reads, so wiring TypeGen later needs
// no change here.
import { defineQuery } from 'groq';

/**
 * Every query is scoped by `$language`. Translations are separate documents linked by the
 * Studio's translation metadata, so a query without the filter would return the same article
 * once per locale.
 */
// Ordered by the review date, falling back to when the document was made. That order is not
// cosmetic: it picks the Journal's featured card and decides what "previous" and "next" mean at
// the foot of every article, so an article awaiting its first review still needs a defined place
// in it rather than wherever GROQ happens to sort a null.
export const articlesQuery = defineQuery(`*[_type == "article" && language == $language && defined(slug.current)]
	| order(coalesce(reviewedAt, _createdAt) desc){
		_id,
		title,
		category,
		tags,
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
	category,
	tags,
	summary,
	slug,
	hero,
	reviewedAt,
	nextReviewAt,
	readTimeMinutes,
	body[]{
		_key,
		_type,
		heading,
		shortLabel,
		paragraphs,
		caption,
		columns,
		rows[]{ _key, label, cells },
		cards[]{ _key, name, eyebrow, body },
		intro,
		items,
		summary,
		sources[]{ _key, label, href }
	},
	reviewer->{ _id, name, role, description, portrait },
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
	/** The chips a reader sees. `category` is the one value the Journal's filter keys on. */
	tags?: string[];
	summary: string;
	slug: { current: string };
	reviewedAt: string;
	readTimeMinutes?: number;
	hero?: SanityImage;
	/** The Journal card credits the doctor; the article page reads the fuller shape below. */
	reviewer?: { name: string; portrait?: SanityImage };
}

/**
 * One body block, projected as the union of every block type's fields, the way `legalPageQuery`
 * projects its two. GROQ answers `null` for a field the member does not have, so the mapper
 * narrows on `_type` and the projection stays one shape rather than seven conditional ones.
 *
 * `items` is the one name two block types share: an array of strings on a checklist and an
 * array of questions on an accordion. `toBlocks` separates them.
 */
export interface SanityArticleBlock {
	_key: string;
	_type: string;
	heading?: string;
	shortLabel?: string;
	paragraphs?: string[];
	caption?: string;
	columns?: string[];
	rows?: { _key: string; label: string; cells?: string[] }[];
	cards?: { _key: string; name: string; eyebrow: string; body: string }[];
	intro?: string;
	items?: (string | { _key: string; question: string; answer: string })[];
	summary?: string;
	sources?: { _key: string; label: string; href?: string }[];
}

export interface ArticleDetail extends ArticleListItem {
	body?: SanityArticleBlock[];
	seoTitle?: string;
	seoDescription?: string;
	nextReviewAt?: string;
	reviewer?: {
		_id: string;
		name: string;
		role: string;
		description?: string;
		portrait?: SanityImage;
	};
}

/**
 * One policy document. Addressed by id rather than filtered by slug and language, the way the
 * home page is: the four routes each know which document they serve, so a lookup would be a
 * query that can return the wrong one.
 */
export const legalPageQuery = defineQuery(`*[_id == "legalPage-" + $slug + "-" + $language][0]{
	title,
	slug,
	language,
	blocks[]{
		_type,
		lines[]{ spans[]{ text, bold, underline, href } },
		items[]{ spans[]{ text, bold, underline, href } }
	}
}`);

export interface SanityLegalSpan {
	text: string;
	bold?: boolean;
	underline?: boolean;
	href?: string;
}

export interface SanityLegalPage {
	title: string;
	slug: string;
	language: string;
	blocks?: {
		_type: 'legalParagraph' | 'legalList';
		lines?: { spans?: SanityLegalSpan[] }[];
		items?: { spans?: SanityLegalSpan[] }[];
	}[];
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

/**
 * One treatment page, addressed by its fixed id rather than filtered by slug and language, the
 * way the policy documents are: three known products on three known routes, each of which knows
 * which document it serves, so a lookup would be a query that can return the wrong one.
 */
export const treatmentQuery = defineQuery(`*[_id == "treatment-" + $treatmentId + "-" + $language][0]{
	treatmentId,
	language,
	formLabel,
	isNew,
	photo,
	galleryCaption,
	intro,
	clinicianNote{ title, body },
	doses[]{ _key, label, monthlyPriceCents },
	plans[]{ _key, durationMonths, monthlyPriceCents, recommended },
	firstMonthCents
}`);

/**
 * Every treatment in one language.
 *
 * The page needs all three even though it draws one: the plan comparison lists every treatment
 * so a reader can see what the others cost, and it reads their plans off this same response.
 * One query rather than three reads, so the table and the dose selector above it cannot end up
 * holding two different price lists.
 */
export const treatmentsQuery = defineQuery(`*[_type == "treatment" && language == $language]{
	treatmentId,
	language,
	formLabel,
	isNew,
	photo,
	galleryCaption,
	intro,
	clinicianNote{ title, body },
	doses[]{ _key, label, monthlyPriceCents },
	plans[]{ _key, durationMonths, monthlyPriceCents, recommended },
	firstMonthCents
}`);

/** What all three pages share, so the three cannot drift apart. */
export const treatmentsPageQuery = defineQuery(`*[_id == "treatmentsPage-" + $language][0]{
	howItWorks[]{ _key, title, body },
	faqs[]{ _key, question, answer }
}`);

export interface SanityTreatment {
	treatmentId: string;
	language: string;
	formLabel: string;
	isNew?: boolean;
	photo?: SanityImage;
	galleryCaption: string;
	intro: string;
	clinicianNote?: { title: string; body: string };
	/** Minor units, as `Money` is. The field name carries the unit so the Studio cannot be typed in euros. */
	doses?: { _key: string; label: string; monthlyPriceCents: number }[];
	plans?: {
		_key: string;
		durationMonths: number;
		monthlyPriceCents: number;
		recommended?: boolean;
	}[];
	firstMonthCents?: number;
}

export interface SanityTreatmentsPage {
	howItWorks?: { _key: string; title: string; body: string }[];
	faqs?: { _key: string; question: string; answer: string }[];
}

/** The questionnaire's motivation screen borrows one story, so it reads them server-side. */
export const testimonialsQuery = defineQuery(
	`*[_type == "testimonial" && language == $language]{
		_id, name, memberLabel, quote, kgLost, rating, treatmentId, verified, photo
	}`
);

export type SanityTestimonial =
	NonNullable<HomePage['testimonialsSection']>['testimonials'][number];
