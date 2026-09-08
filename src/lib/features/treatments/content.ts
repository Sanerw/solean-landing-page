import { m } from '$lib/paraglide/messages';
import injectionPen from '$lib/assets/panels/treatment-card-enhanced.webp?enhanced&w=400;600;800;1200;1600&quality=90';
import { eur, type Money } from '$lib/domain';
import type { Dose, Plan, PlanDuration, TreatmentPage } from './types';

/**
 * The discounted first month is the same figure for every treatment, and the saving shown
 * beside it is the difference against the standard monthly price rather than a second number.
 * The export carries 69 on the card and 70 on the bar, which is what typing it twice does.
 */
const FIRST_MONTH = eur(6_900);

/** The column the artboard marks "THE BEST VALUE". */
const RECOMMENDED_DURATION: PlanDuration = 6;

/**
 * Prices are display copy, hand-kept, the same standing as the landing page's and the learn
 * article's. Shopify owns the amount actually charged and the recommendation screen reads its
 * own figures from RxScale, so nothing here can drift into a real transaction.
 *
 * They are written out rather than derived from a step, because a marketing price list stops
 * following a formula the first time one cell is negotiated.
 */
const PLAN_PRICES: Record<string, Record<PlanDuration, number>> = {
	'wegovy-pill': { 3: 124, 6: 119, 9: 114, 12: 109 },
	wegovy: { 3: 149, 6: 144, 9: 139, 12: 134 },
	mounjaro: { 3: 169, 6: 164, 9: 159, 12: 154 }
};

/**
 * The titration ladders, each starting at the treatment's standard monthly price so the
 * selector cannot contradict the comparison table below it. The export prices two Wegovy Pill
 * doses identically while claiming "from 124", which `project-plan.md` section 9 records as a
 * defect rather than a requirement. Mounjaro's ladder is not in the export at all; these are
 * the first four steps of its licensed titration.
 */
const DOSE_PRICES: Record<string, ReadonlyArray<readonly [string, number]>> = {
	'wegovy-pill': [
		['1.5mg', 124],
		['4mg', 149],
		['9mg', 179],
		['25mg', 209]
	],
	wegovy: [
		['0.25mg', 149],
		['0.5mg', 174],
		['1mg', 204],
		['1.7mg', 234]
	],
	mounjaro: [
		['2.5mg', 169],
		['5mg', 194],
		['7.5mg', 224],
		['10mg', 254]
	]
};

const PLAN_DURATIONS: readonly PlanDuration[] = [3, 6, 9, 12];

/**
 * The only product photograph this repository has, and it shows a pen beside its box, so it
 * belongs to the two injections and to nothing else. The tablet page is deliberately left
 * without one: its own chip reads "daily tablet" and its caption reads "semaglutide tablet",
 * and a syringe under those is not a missing picture, it is the wrong medicine. The gallery
 * guards on `photo`, so that page keeps its ground, its chips and its caption.
 */
function injectionPhoto() {
	return { picture: injectionPen, alt: m.treatment_photo_alt_injection() };
}

function plansFor(slug: string): readonly Plan[] {
	const prices = PLAN_PRICES[slug];
	if (!prices) return [];

	return PLAN_DURATIONS.map((durationMonths) => ({
		durationMonths,
		monthlyPrice: eur(prices[durationMonths] * 100),
		recommended: durationMonths === RECOMMENDED_DURATION
	}));
}

function dosesFor(slug: string): readonly Dose[] {
	return (DOSE_PRICES[slug] ?? []).map(([label, euros]) => ({
		label,
		monthlyPrice: eur(euros * 100)
	}));
}

/**
 * A function, not a constant, so the messages resolve against the locale of the request rather
 * than whichever one happened to be current when this module was first imported. Every
 * localised export in `marketing/content.ts` is a function for the same reason.
 */
export function treatmentPages(): readonly TreatmentPage[] {
	const clinicianNote = {
		title: m.treatment_dosing_title(),
		body: m.treatment_dosing_body()
	};

	return [
		{
			slug: 'wegovy-pill',
			formLabel: m.treatment_form_tablet(),
			// The one product the artboard chips as new.
			isNew: true,
			galleryCaption: m.treatment_caption_wegovy_pill(),
			intro: m.treatment_intro_wegovy_pill(),
			doses: dosesFor('wegovy-pill'),
			plans: plansFor('wegovy-pill'),
			firstMonth: FIRST_MONTH,
			clinicianNote
		},
		{
			slug: 'wegovy',
			formLabel: m.treatment_form_injection(),
			isNew: false,
			photo: injectionPhoto(),
			galleryCaption: m.treatment_caption_wegovy(),
			intro: m.treatment_intro_wegovy(),
			doses: dosesFor('wegovy'),
			plans: plansFor('wegovy'),
			firstMonth: FIRST_MONTH,
			clinicianNote
		},
		{
			slug: 'mounjaro',
			formLabel: m.treatment_form_injection(),
			isNew: false,
			photo: injectionPhoto(),
			galleryCaption: m.treatment_caption_mounjaro(),
			intro: m.treatment_intro_mounjaro(),
			doses: dosesFor('mounjaro'),
			plans: plansFor('mounjaro'),
			firstMonth: FIRST_MONTH,
			clinicianNote
		}
	];
}

/** Null rather than a throw: an unknown slug is a 404, which the route decides, not this. */
export function findTreatmentPage(slug: string): TreatmentPage | null {
	return treatmentPages().find((page) => page.slug === slug) ?? null;
}

/** The dose a page opens on, and the one the offer card prices before anybody chooses. */
export function startingDose(page: TreatmentPage): Dose {
	return page.doses[0];
}

/**
 * The price a plan costs per month at the shortest commitment. It is what the offer card's
 * "thereafter" line and the saving are measured against, so the page has one standard price
 * rather than one per component.
 */
export function standardMonthly(page: TreatmentPage): Money {
	return page.plans[0].monthlyPrice;
}

/**
 * Derived, never stored. The export's "Save 55 EUR on your first month" is exactly this
 * subtraction, and a stored label is a second figure that goes stale the moment a price moves.
 */
export function firstMonthSaving(page: TreatmentPage): Money {
	return eur(standardMonthly(page).amount - page.firstMonth.amount);
}

/**
 * The artboards print prices as the shop does, `EUR 124` and `EUR 172.73`: the symbol leads,
 * and cents appear only when there are any. `formatEur` in the domain writes `124.00 EUR`
 * instead, which is the checkout's convention and not this page's.
 */
export function formatPrice(money: Money): string {
	const euros = money.amount / 100;
	return `€${Number.isInteger(euros) ? euros : euros.toFixed(2)}`;
}
