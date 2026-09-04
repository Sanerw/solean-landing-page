import { describe, expect, it } from 'vitest';
import type { Answers } from '../answers/types';
import { eligibleAnswers, femaleAnswers, onMounjaro, withGallstones } from './fixtures';
import { missingRequired, theirErrors, wouldBeAccepted } from './shadow';

/**
 * One visitor per branch the two rule sets disagree about. This is the sweep that matters:
 * their `visibleIf` and our `conditions.ts` are maintained separately, and a question their
 * model opens that ours does not ask is a 400 nothing else here would predict.
 */
const BRANCHES: Record<string, Answers> = {
	male: eligibleAnswers(),
	female: femaleAnswers(),
	// BMI 28.4, inside the 27 to 30 band where RxScale requires a weight-related condition.
	insideTheBmiBand: eligibleAnswers({
		heightCm: '180',
		weightKg: '92',
		weightRelatedConditions: ['High blood pressure']
	}),
	// BMI 33.95, above the band, where that question is hidden for both of us.
	aboveTheBmiBand: eligibleAnswers({ heightCm: '180', weightKg: '110' }),
	onMounjaro: onMounjaro(),
	onWegovyWithSideEffects: onMounjaro({
		pastMedication: 'wegovy',
		pastMedicationDose: '2,4 mg',
		hasSideEffects: 'Yes',
		sideEffectsDescription: 'Mild nausea in the first week.'
	}),
	neverTreated: eligibleAnswers({ pastMedication: 'never' }),
	withGallstones: withGallstones(),
	onOtherMedication: eligibleAnswers({
		otherMedication: 'yes',
		otherMedicationDescription: 'Ramipril 5 mg, one tablet a day'
	}),
	femaleOnMounjaroInTheBand: femaleAnswers({
		heightCm: '180',
		weightKg: '92',
		weightRelatedConditions: ['Pre-diabetes'],
		pastMedication: 'mounjaro',
		pastMedicationDose: '5.0 mg',
		pastMedicationDuration: '8',
		pastMedicationLastDose: '2026-08-28',
		hasSideEffects: 'No'
	})
};

describe('the seam between their branching and ours', () => {
	it('leaves nothing they require unanswered, on any branch', () => {
		// The single most valuable assertion in this sub-feature. A gap on any of these paths is
		// a 400 the visitor meets only after answering every question.
		for (const [name, answers] of Object.entries(BRANCHES)) {
			expect(missingRequired(answers), name).toEqual([]);
		}
	});

	it('refuses none of these visitors', () => {
		for (const [name, answers] of Object.entries(BRANCHES)) {
			expect(theirErrors(answers), name).toEqual({});
			expect(wouldBeAccepted(answers), name).toBe(true);
		}
	});

	it('does not ask a male visitor their pregnancy questions', () => {
		// Their `visibleIf` is `{Gender} = 'female'`, so this proves the shadow is reading their
		// branching rather than treating every required question as always required.
		expect(missingRequired(eligibleAnswers({ gender: 'male' }))).toEqual([]);
	});

	it('does ask a female visitor those questions, and notices when they are unanswered', () => {
		const unanswered = femaleAnswers({ pregnancyStatus: [] });

		expect(missingRequired(unanswered)).toContain('isPregnantorBreastfeeding');
		expect(missingRequired(unanswered)).toContain('PlanningPregnancy');
	});

	it('notices an unanswered dose once a medication is named', () => {
		const noDose = onMounjaro({ pastMedicationDose: null });

		expect(missingRequired(noDose)).toContain('question4');
	});
});

describe("their refusals, in their own words", () => {
	it('refuses a BMI under 27, against the weight', () => {
		// BMI 21.6. Their rule, their sentence, and ours only decides where to show it.
		const tooLight = eligibleAnswers({ heightCm: '180', weightKg: '70' });
		const errors = theirErrors(tooLight);

		expect(errors.weightKg).toBeTruthy();
		expect(errors.weightKg).toMatch(/BMI/i);
		expect(wouldBeAccepted(tooLight)).toBe(false);
	});

	it('refuses someone under 18, against the date of birth', () => {
		const tooYoung = eligibleAnswers({ dateOfBirth: '2014-01-01' });

		expect(theirErrors(tooYoung).dateOfBirth).toBeTruthy();
	});

	it('refuses someone over 80, the other end of the same rule', () => {
		expect(theirErrors(eligibleAnswers({ dateOfBirth: '1935-01-01' })).dateOfBirth).toBeTruthy();
	});

	it('refuses a declared eating disorder', () => {
		const errors = theirErrors(eligibleAnswers({ eatingDisorder: 'Yes' }));

		expect(errors.eatingDisorder).toBeTruthy();
	});

	it('refuses a disqualifying condition', () => {
		const errors = theirErrors(eligibleAnswers({ diseases: ['Kidney disease'] }));

		expect(errors.diseases).toBeTruthy();
	});

	it('allows gallstones, which is the one condition their rule lets through', () => {
		expect(theirErrors(withGallstones()).diseases).toBeUndefined();
	});

	it('refuses a gallbladder that was never removed', () => {
		const errors = theirErrors(withGallstones({ gallbladderRemoved: 'No' }));

		expect(errors.gallbladderRemoved).toBeTruthy();
	});

	it('refuses a family history of thyroid cancer', () => {
		const errors = theirErrors(eligibleAnswers({ familyDiseases: ['Medullary thyroid cancer'] }));

		expect(errors.familyDiseases).toBeTruthy();
	});

	it('refuses a pregnant visitor', () => {
		const errors = theirErrors(femaleAnswers({ pregnancyStatus: ['pregnant'] }));

		expect(errors.pregnancyStatus).toBeTruthy();
	});

	it('gives back their German sentence, not a code of ours', () => {
		const errors = theirErrors(eligibleAnswers({ eatingDisorder: 'Yes' }));

		// Deliberately their wording: a refusal is a clinical statement, and 24c decides what an
		// English visitor sees rather than this module inventing a translation.
		expect(errors.eatingDisorder).toMatch(/nicht verschreiben/i);
	});

	it('keys every refusal to a question of ours, never to one of their names', () => {
		const errors = theirErrors(eligibleAnswers({ eatingDisorder: 'Yes', diseases: ['Heart failure'] }));

		expect(Object.keys(errors)).not.toContain('EatingDisorder');
		expect(Object.keys(errors)).not.toContain('Diseases');
		expect(Object.keys(errors).sort()).toEqual(['diseases', 'eatingDisorder']);
	});
});

describe('the shadow instance', () => {
	it('does not carry one visitor errors into the next', () => {
		const refused = eligibleAnswers({ eatingDisorder: 'Yes' });

		expect(theirErrors(refused).eatingDisorder).toBeTruthy();
		expect(theirErrors(eligibleAnswers())).toEqual({});
		expect(theirErrors(refused).eatingDisorder).toBeTruthy();
	});
});
