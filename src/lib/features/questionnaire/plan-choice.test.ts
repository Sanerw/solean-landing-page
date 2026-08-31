import { describe, expect, it } from 'vitest';
import { eur } from '$lib/domain';
import { chosenPlanName, defaultVariant, groupPlans, initialMode } from './plan-choice';
import type { RecommendedPlan } from './recommendation';

function plan(
	name: string,
	options: { variantId: string; preSelected?: boolean }[],
	prescriptionOnly = false
): RecommendedPlan {
	return {
		id: name,
		name,
		image: null,
		prescriptionOnly,
		options: options.map(({ variantId, preSelected = false }) => ({
			variantId,
			label: '',
			price: eur(29900),
			therapyDays: null,
			preSelected
		}))
	};
}

describe('groupPlans', () => {
	it('keeps the prescription-only listings out of the treatments', () => {
		const groups = groupPlans([
			plan('Mounjaro 2,5 mg Behandlung', [{ variantId: '1' }]),
			plan('Mounjaro®', [{ variantId: '2' }], true)
		]);

		expect(groups.treatment.map((entry) => entry.name)).toEqual(['Mounjaro 2,5 mg Behandlung']);
		expect(groups.prescription.map((entry) => entry.name)).toEqual(['Mounjaro®']);
	});
});

describe('initialMode', () => {
	it('opens on the treatments', () => {
		const groups = groupPlans([
			plan('Mounjaro 2,5 mg Behandlung', [{ variantId: '1' }]),
			plan('Mounjaro®', [{ variantId: '2' }], true)
		]);

		expect(initialMode(groups)).toBe('treatment');
	});

	// Nothing else is offered, so opening on an empty list would look like nothing was matched.
	it('opens on the prescriptions when no treatment was recommended', () => {
		expect(initialMode(groupPlans([plan('Mounjaro®', [{ variantId: '2' }], true)]))).toBe(
			'prescription'
		);
	});
});

describe('defaultVariant', () => {
	it("takes RxScale's own pre-selected option", () => {
		const variant = defaultVariant([
			plan('Nevolat®', [{ variantId: '1' }]),
			plan('Mounjaro®', [{ variantId: '2' }, { variantId: '3', preSelected: true }])
		]);

		expect(variant).toBe('3');
	});

	it('falls back to the first option, and to nothing at all when there are no plans', () => {
		expect(defaultVariant([plan('Nevolat®', [{ variantId: '1' }])])).toBe('1');
		expect(defaultVariant([])).toBeNull();
	});
});

describe('chosenPlanName', () => {
	const plans = [
		plan('Mounjaro 2,5 mg Behandlung', [{ variantId: '1' }]),
		plan('Nevolat® - 3 Pens ohne Nadeln', [{ variantId: '2' }])
	];

	it('shortens a long name to the brand', () => {
		expect(chosenPlanName(plans, '1')).toBe('Mounjaro');
		expect(chosenPlanName(plans, '2')).toBe('Nevolat®');
	});

	it('keeps a name short enough to fit', () => {
		expect(chosenPlanName([plan('Mounjaro®', [{ variantId: '9' }])], '9')).toBe('Mounjaro®');
	});

	// Shortening here would name a plan the person did not choose.
	it('keeps the full name when another plan shares its first word', () => {
		const both = [
			plan('Wegovy 0,25 mg Behandlung', [{ variantId: '1' }]),
			plan('Wegovy 0,5 mg Behandlung', [{ variantId: '2' }])
		];

		expect(chosenPlanName(both, '1')).toBe('Wegovy 0,25 mg Behandlung');
	});

	it('names nothing when nothing is chosen, or the choice is not on this list', () => {
		expect(chosenPlanName(plans, null)).toBeNull();
		expect(chosenPlanName(plans, 'unknown')).toBeNull();
	});
});
