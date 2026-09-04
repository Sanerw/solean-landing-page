import { describe, expect, it } from 'vitest';
import { GALLSTONES, emptyAnswers, type Answers } from '../answers/types';
import {
	asksPregnancy,
	asksWeightRelatedConditions,
	bmi,
	hadGallstones,
	reportsSideEffects,
	takesOtherMedication,
	takesTrackedMedication
} from './conditions';

function answering(overrides: Partial<Answers>): Answers {
	return { ...emptyAnswers(), ...overrides };
}

/** Height that makes the arithmetic easy to read: 1 m, so the BMI is the weight. */
const ONE_METRE = { heightCm: '100' };

describe('bmi', () => {
	it('is null until both measurements are given', () => {
		expect(bmi(emptyAnswers())).toBeNull();
		expect(bmi(answering({ heightCm: '180' }))).toBeNull();
		expect(bmi(answering({ weightKg: '96' }))).toBeNull();
	});

	it('never divides by zero on a height of nothing', () => {
		expect(bmi(answering({ heightCm: '0', weightKg: '96' }))).toBeNull();
	});

	it('refuses text that is not a measurement', () => {
		expect(bmi(answering({ heightCm: 'tall', weightKg: '96' }))).toBeNull();
	});

	it('reads a comma as a decimal separator, because German keyboards type one', () => {
		expect(bmi(answering({ heightCm: '180,5', weightKg: '96' }))).toBeCloseTo(29.47, 2);
	});

	it('computes from height in centimetres and weight in kilograms', () => {
		expect(bmi(answering({ heightCm: '180', weightKg: '96' }))).toBeCloseTo(29.63, 2);
	});
});

describe('asksWeightRelatedConditions', () => {
	it('includes both ends of the band RxScale defines', () => {
		expect(asksWeightRelatedConditions(answering({ ...ONE_METRE, weightKg: '27' }))).toBe(true);
		expect(asksWeightRelatedConditions(answering({ ...ONE_METRE, weightKg: '30' }))).toBe(true);
	});

	it('excludes just outside either end', () => {
		expect(asksWeightRelatedConditions(answering({ ...ONE_METRE, weightKg: '26.9' }))).toBe(false);
		expect(asksWeightRelatedConditions(answering({ ...ONE_METRE, weightKg: '30.1' }))).toBe(false);
	});

	it('hides the screen while the measurements are blank, rather than guessing', () => {
		expect(asksWeightRelatedConditions(emptyAnswers())).toBe(false);
		expect(asksWeightRelatedConditions(answering({ heightCm: '180' }))).toBe(false);
	});
});

describe('asksPregnancy', () => {
	it('asks a female visitor', () => {
		expect(asksPregnancy(answering({ gender: 'female' }))).toBe(true);
	});

	it('does not ask a male visitor, or one who has not said yet', () => {
		expect(asksPregnancy(answering({ gender: 'male' }))).toBe(false);
		expect(asksPregnancy(emptyAnswers())).toBe(false);
	});
});

describe('takesTrackedMedication', () => {
	it('is true for each medication RxScale follows up on', () => {
		for (const medication of ['wegovy', 'ozempic', 'saxenda', 'nevolat (liraglutid)', 'mounjaro'] as const) {
			expect(takesTrackedMedication(answering({ pastMedication: medication })), medication).toBe(true);
		}
	});

	it('is false for never, for other, and for a medication with no dose question', () => {
		expect(takesTrackedMedication(answering({ pastMedication: 'never' }))).toBe(false);
		expect(takesTrackedMedication(answering({ pastMedication: 'other' }))).toBe(false);
		expect(takesTrackedMedication(answering({ pastMedication: 'rybelsus' }))).toBe(false);
		expect(takesTrackedMedication(emptyAnswers())).toBe(false);
	});
});

describe('reportsSideEffects', () => {
	it('asks for a description only after a yes', () => {
		const onWegovy = { pastMedication: 'wegovy' } as const;

		expect(reportsSideEffects(answering({ ...onWegovy, hasSideEffects: 'Yes' }))).toBe(true);
		expect(reportsSideEffects(answering({ ...onWegovy, hasSideEffects: 'No' }))).toBe(false);
		expect(reportsSideEffects(answering(onWegovy))).toBe(false);
	});

	it('ignores a stale yes left behind when the medication changed', () => {
		// Answers are not cleared when a branch closes, so the rule has to hold both halves or
		// a visitor who backtracked would be asked to describe side effects of nothing.
		expect(reportsSideEffects(answering({ pastMedication: 'never', hasSideEffects: 'Yes' }))).toBe(false);
	});
});

describe('hadGallstones', () => {
	it('opens the follow-up on the exact value RxScale compares', () => {
		expect(hadGallstones(answering({ diseases: [GALLSTONES] }))).toBe(true);
		expect(hadGallstones(answering({ diseases: [GALLSTONES, 'Kidney disease'] }))).toBe(true);
	});

	it('stays shut for another disease, or none', () => {
		expect(hadGallstones(answering({ diseases: ['Kidney disease'] }))).toBe(false);
		expect(hadGallstones(emptyAnswers())).toBe(false);
	});
});

describe('takesOtherMedication', () => {
	it('reads the lowercase yes RxScale uses on this question', () => {
		expect(takesOtherMedication(answering({ otherMedication: 'yes' }))).toBe(true);
		expect(takesOtherMedication(answering({ otherMedication: 'no' }))).toBe(false);
	});
});
