import { describe, expect, it } from 'vitest';
import { eur } from '$lib/domain';
import {
	chosenPlanName,
	defaultVariant,
	groupPlans,
	groupPrice,
	initialStep,
	modeOf,
	opensPrescriptionStep
} from './plan-choice';
import type { RecommendedPlan } from './recommendation';

function plan(
	name: string,
	options: { variantId: string; preSelected?: boolean; amount?: number }[],
	prescriptionOnly = false
): RecommendedPlan {
	return {
		id: name,
		name,
		image: null,
		prescriptionOnly,
		options: options.map(({ variantId, preSelected = false, amount = 29900 }) => ({
			variantId,
			label: '',
			price: eur(amount),
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

describe('initialStep', () => {
	it('opens on the treatments', () => {
		const groups = groupPlans([
			plan('Mounjaro 2,5 mg Behandlung', [{ variantId: '1' }]),
			plan('Mounjaro®', [{ variantId: '2' }], true)
		]);

		expect(initialStep(groups)).toBe('treatment');
	});

	// Nothing else is offered, so opening on an empty list would look like nothing was matched.
	it('opens on the prescriptions when no treatment was recommended', () => {
		expect(initialStep(groupPlans([plan('Mounjaro®', [{ variantId: '2' }], true)]))).toBe(
			'prescription'
		);
	});

	// Nothing recommended at all is the fallback path, and it belongs on the first screen: the
	// second one would head it "which medication should your prescription be for?" over an
	// empty list. The browser suite caught this.
	it('stays on the first screen when nothing was recommended', () => {
		expect(initialStep(groupPlans([]))).toBe('treatment');
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

describe('groupPrice', () => {
	// What the live shop returns: three prescription-only listings, all 49.90.
	it('names the one price every listing agrees on', () => {
		const plans = [
			plan('Mounjaro®', [{ variantId: '1', amount: 4990 }], true),
			plan('Wegovy®', [{ variantId: '2', amount: 4990 }], true)
		];

		expect(groupPrice(plans)).toEqual({ price: eur(4990), from: false });
	});

	// A single price on a group that disagrees is a promise the next screen breaks.
	it('falls back to the lowest, marked as a floor, when they disagree', () => {
		const plans = [
			plan('Mounjaro®', [{ variantId: '1', amount: 6990 }], true),
			plan('Wegovy®', [{ variantId: '2', amount: 4990 }], true)
		];

		expect(groupPrice(plans)).toEqual({ price: eur(4990), from: true });
	});

	it('has nothing to name for an empty group', () => {
		expect(groupPrice([])).toBeNull();
	});
});

describe('modeOf', () => {
	const groups = groupPlans([
		plan('Mounjaro 2,5 mg Behandlung', [{ variantId: 'treat' }]),
		plan('Mounjaro®', [{ variantId: 'script' }], true)
	]);

	it('reads the purchase off the chosen variant', () => {
		expect(modeOf(groups, 'treat')).toBe('treatment');
		expect(modeOf(groups, 'script')).toBe('prescription');
	});

	it('answers nothing for no choice and for merchandise this screen is not offering', () => {
		expect(modeOf(groups, null)).toBeNull();
		expect(modeOf(groups, 'something-else')).toBeNull();
	});
});

describe('opensPrescriptionStep', () => {
	const both = groupPlans([
		plan('Mounjaro 2,5 mg Behandlung', [{ variantId: 'treat' }]),
		plan('Mounjaro®', [{ variantId: 'script' }], true)
	]);

	it('opens the second screen when the prescription card is the choice', () => {
		expect(opensPrescriptionStep(both, 'treatment', true)).toBe(true);
	});

	it('goes to the checkout for a treatment', () => {
		expect(opensPrescriptionStep(both, 'treatment', false)).toBe(false);
	});

	// Already there: confirming the medication list is the order, not another step.
	it('never opens it from the second screen itself', () => {
		expect(opensPrescriptionStep(both, 'prescription', true)).toBe(false);
	});

	// The card is only drawn when there is something behind it, but the rule states it too:
	// a step onto an empty list would be a dead end at the moment of paying.
	it('does not open an empty medication list', () => {
		const treatmentsOnly = groupPlans([plan('Mounjaro 2,5 mg Behandlung', [{ variantId: 'treat' }])]);

		expect(opensPrescriptionStep(treatmentsOnly, 'treatment', true)).toBe(false);
	});
});
