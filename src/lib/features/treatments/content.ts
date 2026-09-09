import { eur, treatmentDisplayName, TREATMENTS, type Money } from '$lib/domain';
import type { ComparisonRow, Dose, PlanDuration, TreatmentPage } from './types';

/**
 * What the treatment page works out for itself.
 *
 * Until feature 27b this file also held the pages: three typed products, their prices and their
 * copy, read from the Paraglide catalogues. That fixture is Sanity's now, so a price change is
 * an edit rather than a deploy. What stayed is everything a stored figure would get wrong the
 * moment a price moved.
 */

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

/**
 * Every treatment as a row of the comparison, cheapest first, which is how the artboard orders
 * them and the only order a price comparison reads naturally in. Sorted rather than stored in
 * order, so a price change reorders the table instead of leaving it stale.
 *
 * The pages are handed in rather than read from a module, so the comparison and the dose
 * selector above it are working from one response and cannot disagree.
 *
 * `isCurrent` is computed rather than stored: it is a property of the page being viewed, not
 * of the treatment. The row it marks is the one that must not link to itself.
 */
export function comparisonRows(
	currentSlug: string,
	pages: readonly TreatmentPage[]
): readonly ComparisonRow[] {
	return TREATMENTS.flatMap((treatment) => {
		const page = pages.find((each) => each.slug === treatment.id);
		if (!page) return [];

		return [
			{
				slug: page.slug,
				name: treatmentDisplayName(treatment),
				formLabel: page.formLabel,
				photo: page.photo,
				plans: page.plans,
				isCurrent: page.slug === currentSlug
			}
		];
	}).sort((a, b) => standardMonthlyOf(a) - standardMonthlyOf(b));
}

/** The figure the rows are ordered by: what a month costs on the shortest plan. */
function standardMonthlyOf(row: ComparisonRow): number {
	return row.plans[0]?.monthlyPrice.amount ?? 0;
}

/** The durations the comparison shows, read off the first row so the header cannot drift. */
export function comparisonDurations(rows: readonly ComparisonRow[]): readonly PlanDuration[] {
	return rows[0]?.plans.map((plan) => plan.durationMonths) ?? [];
}
