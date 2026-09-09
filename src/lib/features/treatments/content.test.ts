import { describe, expect, it } from 'vitest';
import { TREATMENTS, eur } from '$lib/domain';
import {
	comparisonDurations,
	comparisonRows,
	firstMonthSaving,
	formatPrice
} from './content';
import type { TreatmentPage } from './types';

/**
 * The pages these helpers derive from are Sanity's from feature 27b, so the fixtures they were
 * written against are gone. They are built here instead, carrying only the fields each helper
 * reads: the point of these tests is the arithmetic and the ordering, not the copy.
 *
 * The prices are the live ones, so a figure changing in the Studio does not silently change
 * what "55 EUR saving" means here.
 */
function page(slug: string, monthly: number, first = 6_900): TreatmentPage {
	return {
		slug,
		formLabel: '',
		isNew: false,
		galleryCaption: '',
		intro: '',
		doses: [{ label: 'first', monthlyPrice: eur(monthly) }],
		plans: [3, 6, 9, 12].map((durationMonths, index) => ({
			durationMonths: durationMonths as 3 | 6 | 9 | 12,
			monthlyPrice: eur(monthly - index * 500),
			recommended: durationMonths === 6
		})),
		firstMonth: eur(first),
		clinicianNote: { title: '', body: '' }
	};
}

/** The three as the live documents price them, cheapest last so the ordering test has work to do. */
const PAGES = [page('mounjaro', 16_900), page('wegovy', 14_900), page('wegovy-pill', 12_400)];

describe('firstMonthSaving', () => {
	// The figure the export prints on the Wegovy Pill badge, reached by subtraction rather
	// than by being typed a second time.
	it('is the standard month minus the first, 55 EUR on the pill', () => {
		expect(firstMonthSaving(page('wegovy-pill', 12_400))).toEqual(eur(5_500));
	});

	it('is larger on a dearer treatment, without a second stored label', () => {
		expect(firstMonthSaving(page('mounjaro', 16_900))).toEqual(eur(10_000));
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

describe('comparisonRows', () => {
	it('offers one row per catalogue treatment', () => {
		const rows = comparisonRows('wegovy-pill', PAGES);

		expect([...rows.map((row) => row.slug)].sort()).toEqual(
			[...TREATMENTS.map((treatment) => treatment.id)].sort()
		);
	});

	// Cheapest first, which is how the artboard orders them and the only order a price
	// comparison reads naturally in. Derived from the prices, so a price change reorders the
	// table rather than leaving it stale.
	it('orders the rows by ascending monthly price', () => {
		const rows = comparisonRows('wegovy-pill', PAGES);

		expect(rows.map((row) => row.slug)).toEqual(['wegovy-pill', 'wegovy', 'mounjaro']);

		const cheapest = rows.map((row) => row.plans[0].monthlyPrice.amount);
		expect(cheapest).toEqual([...cheapest].sort((a, b) => a - b));
	});

	it('names each row from the catalogue rather than from its own copy', () => {
		const rows = comparisonRows('wegovy-pill', PAGES);

		expect(rows.map((row) => row.name)).toEqual([
			'Wegovy Pill',
			'Wegovy Injection',
			'Mounjaro Injection'
		]);
	});

	// The thumbnail is the gallery's own art, so a treatment cannot show one picture in the
	// hero and a different one in the comparison.
	it('carries each treatment its own gallery photograph, where it has one', () => {
		const rows = comparisonRows('wegovy-pill', PAGES);

		for (const row of rows) {
	expect(row.photo, row.slug).toEqual(PAGES.find((each) => each.slug === row.slug)!.photo);
		}
	});

	// The row a visitor is already on is the one that must not link to itself.
	it('marks exactly one row as current', () => {
		const rows = comparisonRows('wegovy', PAGES);

		expect(rows.filter((row) => row.isCurrent).map((row) => row.slug)).toEqual(['wegovy']);
	});

	// The route 404s before this is reached, so an unknown slug marks nothing rather than
	// throwing: the comparison is still renderable, just with no row highlighted.
	it('marks nothing for a slug that is not a treatment', () => {
		expect(comparisonRows('nope', PAGES).some((row) => row.isCurrent)).toBe(false);
	});

	// The durations are the table's columns. A ragged set has no table to render, so this is
	// the assertion that stops one treatment gaining a plan the others do not have.
	it('offers the same durations on every row', () => {
		const rows = comparisonRows('wegovy-pill', PAGES);
		const first = rows[0].plans.map((plan) => plan.durationMonths);

		for (const row of rows) {
			expect(row.plans.map((plan) => plan.durationMonths), row.slug).toEqual(first);
		}
	});

	it('reads its prices from the same pages the dose selector uses', () => {
		const rows = comparisonRows('wegovy-pill', PAGES);
		const pill = rows.find((row) => row.slug === 'wegovy-pill')!;

		expect(pill.plans).toEqual(PAGES.find((each) => each.slug === 'wegovy-pill')!.plans);
	});
});

describe('comparisonDurations', () => {
	it('reads the header off the rows, so it cannot drift from them', () => {
		expect(comparisonDurations(comparisonRows('wegovy-pill', PAGES))).toEqual([3, 6, 9, 12]);
	});

	it('is empty rather than throwing when there are no rows', () => {
		expect(comparisonDurations([])).toEqual([]);
	});
});
