import { localizeHref } from '$lib/paraglide/runtime';
import { croppedPicture, picture, type SanityPicture } from '$lib/sanity/image';
import { plain } from '$lib/sanity/plain';
import type { HomePage, SanityImage } from '$lib/sanity/queries';
import type { BentoCard, Clinician, MiniBenefit, Testimonial, TrustBenefit } from './content';

/**
 * Turns the home page document into the shapes the sections already render.
 *
 * Two things it is responsible for, and both are easy to get wrong.
 *
 * **Stega.** While preview is on, every string carries invisible source markers so the
 * Presentation tool can offer click-to-edit. Harmless in text, fatal in a value used as logic:
 * an icon name, a category, a catalogue id, an href. Every such value goes through `plain`
 * here, at the boundary, so no component has to remember.
 *
 * **Widths.** The photographs used to be `enhanced:img` imports with hand-tuned ladders, and a
 * browser test decodes each one at four viewports and fails when it is drawn at less than the
 * density it carries. Those ladders are carried over per frame rather than replaced by a
 * default, because the frames differ by an order of magnitude: a 40px avatar and a full-bleed
 * hero cannot share one list.
 */

/** The widths each frame actually draws at, carried over from the enhanced-img imports. */
const WIDTHS = {
	hero: [640, 960, 1280, 1600, 1920, 2560],
	bentoTall: [400, 540, 768, 1080, 1315],
	bentoCard: [400, 540, 768, 1080, 1366, 1536],
	panel: [400, 540, 768, 1080, 1366, 1920],
	portrait: [240, 400, 540, 768, 1080],
	avatar: [40, 80, 120],
	story: [400, 540, 768, 1080]
} as const;

function pictureOf(image: SanityImage | undefined, widths: readonly number[]) {
	return image?.asset ? picture(image, widths) : undefined;
}

export function heroPicture(home: HomePage): SanityPicture | undefined {
	return pictureOf(home.hero?.image, WIDTHS.hero);
}

export function bentoCardsFrom(home: HomePage): readonly BentoCard[] {
	return (home.bento?.cards ?? []).map((card, index) => ({
		// Cleaned because the category resolves the card's ground colour through BENTO_GROUNDS.
		category: plain(card.category) as BentoCard['category'],
		eyebrow: card.eyebrow,
		title: card.title,
		body: card.body,
		// The first card is the tall one, and it is drawn far wider than the four beside it.
		image: pictureOf(card.image, index === 0 ? WIDTHS.bentoTall : WIDTHS.bentoCard)
	}));
}

export function trustBenefitsFrom(home: HomePage): readonly TrustBenefit[] {
	return (home.trustBenefits ?? []).map((benefit) => ({
		icon: plain(benefit.icon) as TrustBenefit['icon'],
		title: benefit.title,
		body: benefit.body
	}));
}

/**
 * Each of these takes the section it maps rather than the whole document, because the page
 * guards on the section before rendering it. Passing the document would put the same
 * `?.`-check in two places and let them disagree.
 */
export function resultsBandFrom(band: NonNullable<HomePage['resultsBand']>) {
	return {
		eyebrow: band.eyebrow,
		title: band.title,
		lead: band.lead,
		cta: band.cta,
		quote: band.quote,
		author: band.author,
		authorRole: band.authorRole,
		reviewCta: band.reviewCta,
		// Square, and cropped around the hotspot so the face survives it.
		authorAvatar: band.authorAvatar?.asset
			? croppedPicture(band.authorAvatar, WIDTHS.avatar, 1)
			: undefined,
		image: pictureOf(band.image, WIDTHS.panel),
		benefits: (band.benefits ?? []).map((benefit) => ({
			icon: plain(benefit.icon) as MiniBenefit['icon'],
			title: benefit.title,
			body: benefit.body
		})) satisfies MiniBenefit[]
	};
}

/**
 * An editor's path, in the reader's language. Left alone when it is not ours to localise: an
 * absolute URL belongs to someone else's site, and an anchor stays on this page.
 */
function internalHref(href: string | undefined): string | undefined {
	if (!href || !href.startsWith('/')) return href;

	return localizeHref(href);
}

export function howItWorksFrom(howItWorks: NonNullable<HomePage['howItWorks']>) {
	return {
		title: howItWorks.title,
		lead: howItWorks.lead,
		captionEyebrow: howItWorks.captionEyebrow,
		caption: howItWorks.caption,
		image: pictureOf(howItWorks.image, WIDTHS.panel),
		// Numbering is the render-time index, so a step cannot carry a stale numeral.
		steps: (howItWorks.steps ?? []).map((step) => ({
			title: step.title,
			body: step.body,
			// An href is logic, not prose: stega markers in it would break the link, and an
			// unprefixed one takes an English reader into the German funnel. Both are fixed here,
			// at the boundary, because an editor types a bare path and cannot know about either.
			href: internalHref(plain(step.href)),
			linkLabel: step.linkLabel
		}))
	};
}

export function testimonialsFrom(home: HomePage): readonly Testimonial[] {
	return storiesFrom(home.testimonialsSection?.testimonials ?? []);
}

/** The same join, for callers that hold the stories without the rest of the page. */
export function storiesFrom(
	stories: readonly NonNullable<HomePage['testimonialsSection']>['testimonials'][number][]
): readonly Testimonial[] {
	return (stories ?? []).map((story) => ({
		name: story.name,
		memberLabel: story.memberLabel,
		kgLost: story.kgLost,
		quote: story.quote,
		rating: story.rating,
		// Cleaned because the card looks the treatment up in the catalogue by this id.
		treatmentId: plain(story.treatmentId),
		verified: story.verified,
		photo: pictureOf(story.photo, WIDTHS.story)
	}));
}

export function cliniciansFrom(home: HomePage): readonly Clinician[] {
	return (home.clinicalTeam?.clinicians ?? []).map((person) => ({
		name: person.name,
		role: person.role,
		description: person.description,
		portrait: pictureOf(person.portrait, WIDTHS.portrait)
	}));
}

export function medicalFramingFrom(framing: NonNullable<HomePage['medicalFraming']>) {
	return {
		...framing,
		factors: (framing.factors ?? []).map((factor) => ({
			...factor,
			icon: plain(factor.icon)
		}))
	};
}
