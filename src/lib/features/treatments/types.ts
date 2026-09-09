import type { Money } from '$lib/domain';
import type { SanityPicture } from '$lib/sanity/image';

export interface Dose {
	/** As it is printed, "1.5mg". A label, never parsed back into a quantity. */
	label: string;
	monthlyPrice: Money;
}

export type PlanDuration = 3 | 6 | 9 | 12;

export interface Plan {
	durationMonths: PlanDuration;
	monthlyPrice: Money;
	/** The artboard's "THE BEST VALUE" column. Exactly one plan per treatment carries it. */
	recommended: boolean;
}

export interface TreatmentPhoto {
	/**
	 * A CDN picture with a `w`-descriptor srcset, from feature 27b. It was an `enhanced:img`
	 * import whose ladder was built at compile time, which is what made a photograph a deploy.
	 */
	picture: SanityPicture;
	alt: string;
}

export interface TreatmentPage {
	/** The domain catalogue id, which is also the URL segment. */
	slug: string;
	/**
	 * Absent until product art exists. The gallery draws its ground, badges and caption
	 * either way, so a missing photograph costs the panel its picture and nothing else.
	 */
	photo?: TreatmentPhoto;
	formLabel: string;
	/** Drives the artboard's gold NEW chip. */
	isNew: boolean;
	galleryCaption: string;
	intro: string;
	doses: readonly Dose[];
	plans: readonly Plan[];
	/**
	 * The discounted first month, one figure for the offer card and the sticky bar alike.
	 * The export writes 69 on one and 70 on the other, which is what typing it twice does.
	 */
	firstMonth: Money;
	clinicianNote: { title: string; body: string };
}

/**
 * One treatment's line in the plan comparison. Load-bearing: a `/treatments` index would
 * read the same rows.
 */
export interface ComparisonRow {
	slug: string;
	/** From `treatmentDisplayName`, never retyped. */
	name: string;
	formLabel: string;
	/** The same art the gallery uses, or absent where a treatment has none yet. */
	photo?: TreatmentPhoto;
	plans: readonly Plan[];
	/** The page being viewed: marked in the table, and never linked to itself. */
	isCurrent: boolean;
}

export interface HowItWorksStep {
	title: string;
	body: string;
}

export interface FaqItem {
	question: string;
	answer: string;
}
