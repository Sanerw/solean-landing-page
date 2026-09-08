import { describe, expect, it } from 'vitest';
import { TREATMENTS, eur } from '$lib/domain';
import {
	findTreatmentPage,
	firstMonthSaving,
	formatPrice,
	standardMonthly,
	startingDose,
	treatmentPages
} from './content';

describe('findTreatmentPage', () => {
	it('resolves a known slug', () => {
		expect(findTreatmentPage('wegovy-pill')?.slug).toBe('wegovy-pill');
	});

	it('answers null for an unknown slug, which the route turns into a 404', () => {
		expect(findTreatmentPage('nope')).toBeNull();
	});

	it('is not fooled by a slug that only looks like one', () => {
		expect(findTreatmentPage('')).toBeNull();
		expect(findTreatmentPage('WEGOVY-PILL')).toBeNull();
	});
});

/**
 * The whole point of keying pages by the catalogue id: the navigation builds
 * `/treatments/${treatment.id}` from `TREATMENTS`, so a treatment without a page is a dead
 * link in the dropdown and a treatment page without a catalogue entry has no name to print.
 * Both directions, so neither list can grow past the other unnoticed.
 */
describe('coverage against the catalogue', () => {
	it('gives every catalogue treatment a page', () => {
		for (const treatment of TREATMENTS) {
			expect(findTreatmentPage(treatment.id), treatment.id).not.toBeNull();
		}
	});

	it('gives every page a catalogue treatment', () => {
		const ids = TREATMENTS.map((treatment) => treatment.id);
		for (const page of treatmentPages()) {
			expect(ids, page.slug).toContain(page.slug);
		}
	});
});

describe('every page', () => {
	const pages = treatmentPages();

	it.each(pages.map((page) => [page.slug, page] as const))(
		'%s offers doses, each priced',
		(_slug, page) => {
			expect(page.doses.length).toBeGreaterThan(0);
			for (const dose of page.doses) {
				expect(dose.label).not.toBe('');
				expect(dose.monthlyPrice.amount).toBeGreaterThan(0);
			}
		}
	);

	it.each(pages.map((page) => [page.slug, page] as const))(
		'%s offers plans, ordered by ascending duration',
		(_slug, page) => {
			expect(page.plans.length).toBeGreaterThan(0);

			const durations = page.plans.map((plan) => plan.durationMonths);
			expect(durations).toEqual([...durations].sort((a, b) => a - b));
		}
	);

	it.each(pages.map((page) => [page.slug, page] as const))(
		'%s marks exactly one plan as the best value',
		(_slug, page) => {
			expect(page.plans.filter((plan) => plan.recommended)).toHaveLength(1);
		}
	);

	// A first month that is not below the standard price is not an offer, and the saving
	// derived from it would be zero or negative on a badge that says "save".
	it.each(pages.map((page) => [page.slug, page] as const))(
		'%s discounts the first month below every plan month',
		(_slug, page) => {
			for (const plan of page.plans) {
				expect(page.firstMonth.amount).toBeLessThan(plan.monthlyPrice.amount);
			}
		}
	);

	// The selector sits directly above the comparison table on the same page. If the dose it
	// opens on cost something other than the shortest plan, the page would quote two different
	// standard prices within one screen, which is the defect the export itself carries.
	it.each(pages.map((page) => [page.slug, page] as const))(
		'%s prices its starting dose at the standard monthly price',
		(_slug, page) => {
			expect(startingDose(page).monthlyPrice).toEqual(standardMonthly(page));
		}
	);

	it.each(pages.map((page) => [page.slug, page] as const))(
		'%s gets cheaper per month the longer the plan runs',
		(_slug, page) => {
			const amounts = page.plans.map((plan) => plan.monthlyPrice.amount);
			expect(amounts).toEqual([...amounts].sort((a, b) => b - a));
		}
	);
});

describe('firstMonthSaving', () => {
	// The figure the export prints on the Wegovy Pill badge, reached by subtraction rather
	// than by being typed a second time.
	it('is the standard month minus the first, 55 EUR on the pill', () => {
		const page = findTreatmentPage('wegovy-pill')!;

		expect(firstMonthSaving(page)).toEqual(eur(5_500));
	});

	it('is larger on a dearer treatment, without a second stored label', () => {
		const page = findTreatmentPage('mounjaro')!;

		expect(firstMonthSaving(page)).toEqual(eur(10_000));
	});
});

describe('formatPrice', () => {
	it('drops the cents when there are none, as the artboards do', () => {
		expect(formatPrice(eur(12_400))).toBe('€124');
	});

	it('keeps both cents when there are any', () => {
		expect(formatPrice(eur(17_273))).toBe('€172.73');
	});

	// A trailing zero is still a cent: 49.90 must not print as 49.9.
	it('pads a single trailing zero', () => {
		expect(formatPrice(eur(4_990))).toBe('€49.90');
	});

	it('handles zero', () => {
		expect(formatPrice(eur(0))).toBe('€0');
	});
});
