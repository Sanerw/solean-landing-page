import type { Picture } from '@sveltejs/enhanced-img';
import type { Money } from '$lib/domain';

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
	/** An `enhanced:img` import, so the ladder of widths is built at compile time. */
	picture: Picture;
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
