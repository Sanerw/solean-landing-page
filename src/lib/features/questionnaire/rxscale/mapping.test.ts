import { describe, expect, it } from 'vitest';
import { Model } from 'survey-core';
import { emptyAnswers, type Answers } from '../answers/types';
import { commentKey, DROPPED, ourQuestionFor, toAnamnesisData } from './mapping';
import { eligibleAnswers, femaleAnswers, onMounjaro, withGallstones } from './fixtures';
import { bmi } from '../definition/conditions';

function answering(overrides: Partial<Answers>): Answers {
	return { ...emptyAnswers(), ...overrides };
}

describe("survey-core's own comment key", () => {
	it('is the suffix the mapper writes', () => {
		// Not a convention worth trusting: if the library spells it differently, every "other"
		// free text is dropped on the way to RxScale and nothing else would say so. So ask the
		// library rather than the documentation.
		const survey = new Model({
			elements: [{ type: 'checkbox', name: 'Probe', choices: ['a'], showOtherItem: true }]
		});
		const question = survey.getQuestionByName('Probe');
		question.value = ['other'];
		question.comment = 'written by hand';

		expect(Object.keys(survey.data)).toContain(commentKey('Probe'));
		expect(survey.data[commentKey('Probe')]).toBe('written by hand');
	});
});

describe('the rules that are a rename', () => {
	it('sends each answer unchanged under their own name', () => {
		const data = toAnamnesisData(eligibleAnswers());

		expect(data.Gender).toBe('male');
		expect(data.EMail).toBe('jonas.weber@example.com');
		expect(data.Diseases).toEqual(['none']);
		expect(data.FamilyDiseases).toEqual(['none']);
		expect(data.PsychologicalConditions).toBe('No');
		expect(data.EatingDisorder).toBe('No');
		expect(data.question1).toEqual(['none']);
		expect(data.allergy).toEqual(['none']);
		expect(data.OtherMedication).toBe('no');
	});

	it('leaves out a question nobody answered rather than sending a null', () => {
		// Their validators compare literally, and a present-but-null answer reads to them as an
		// answer: `{Diseases} = ['none']` matches neither a null nor a real selection.
		const data = toAnamnesisData(emptyAnswers());

		expect(Object.keys(data)).not.toContain('Diseases');
		expect(Object.keys(data)).not.toContain('Gender');
	});

	it('carries an "other" free text under the comment key', () => {
		const data = toAnamnesisData(
			eligibleAnswers({ diseases: ['other'], diseasesOther: 'Sarcoidosis' })
		);

		expect(data.Diseases).toEqual(['other']);
		expect(data[commentKey('Diseases')]).toBe('Sarcoidosis');
	});

	it('drops free text left behind when "other" is no longer chosen', () => {
		const data = toAnamnesisData(
			eligibleAnswers({ diseases: ['none'], diseasesOther: 'typed then unpicked' })
		);

		expect(data.Diseases).toEqual(['none']);
		expect(Object.keys(data)).not.toContain(commentKey('Diseases'));
	});
});

describe('the visibility mask', () => {
	it('sends nothing for a screen the branching does not show', () => {
		// BMI 33.95 is above the band, so RxScale hides `WeightRelatedConditions` too.
		const data = toAnamnesisData(eligibleAnswers({ weightRelatedConditions: ['Fatty liver'] }));

		expect(Object.keys(data)).not.toContain('WeightRelatedConditions');
	});

	it('sends nothing for a question hidden inside a visible screen', () => {
		const data = toAnamnesisData(
			answering({ otherMedication: 'no', otherMedicationDescription: 'stale' })
		);

		expect(data.OtherMedication).toBe('no');
		expect(Object.keys(data)).not.toContain('OtherMedicationsDescription');
	});
});

describe('ourQuestionFor', () => {
	it('resolves their name back to the question that shows a refusal about it', () => {
		expect(ourQuestionFor('PsychologicalConditions')).toBe('mentalHealth');
		expect(ourQuestionFor('question1')).toBe('eatingDisorderStatements');
		expect(ourQuestionFor('allergy')).toBe('allergies');
	});

	it('resolves a comment key to the same question as its answer', () => {
		expect(ourQuestionFor(commentKey('Diseases'))).toBe('diseases');
	});

	it('answers null for a name no rule writes', () => {
		expect(ourQuestionFor('NoSuchQuestion')).toBeNull();
	});
});

describe('DROPPED', () => {
	it('records the phone, and gives the reason', () => {
		expect(DROPPED.phone).toMatch(/no phone question/i);
	});
});

describe('the date, twice', () => {
	it('sends the string and the numbers, both of which their model requires', () => {
		const data = toAnamnesisData(eligibleAnswers({ dateOfBirth: '1990-04-17' }));

		expect(data.dob).toBe('1990-04-17');
		expect(data.dob2).toEqual({ Day: 17, Month: 4, Year: 1990 });
	});

	it('sends the parts as numbers, not zero-padded strings', () => {
		// Their item validators use `minValueExpression` and compare numerically, so "04" would
		// be compared as a string and their month range would not hold.
		const data = toAnamnesisData(eligibleAnswers({ dateOfBirth: '1990-04-07' }));
		const parts = data.dob2 as Record<string, unknown>;

		expect(typeof parts.Day).toBe('number');
		expect(parts.Day).toBe(7);
		expect(parts.Month).toBe(4);
	});
});

describe('the name, three times', () => {
	it('fills both halves of their object and each half on its own', () => {
		const data = toAnamnesisData(eligibleAnswers());

		expect(data.FirstName).toBe('Jonas');
		expect(data.Surname).toBe('Weber');
		expect(data.Name).toEqual({ Name: 'Jonas', Surname: 'Weber' });
	});

	it('does not let the second rule overwrite what the first put in the object', () => {
		const data = toAnamnesisData(eligibleAnswers({ firstName: 'Ada', lastName: 'Lovelace' }));

		expect(data.Name).toEqual({ Name: 'Ada', Surname: 'Lovelace' });
	});
});

describe('height and weight, folded into one answer', () => {
	it('sends both as numbers under their item names', () => {
		const data = toAnamnesisData(eligibleAnswers({ heightCm: '180', weightKg: '110' }));

		expect(data.WeightSize).toEqual({ weight: 110, size: 180 });
	});

	it('reads a comma the same way the BMI the visitor was shown does', () => {
		const data = toAnamnesisData(eligibleAnswers({ weightKg: '96,5' }));

		expect((data.WeightSize as Record<string, unknown>).weight).toBe(96.5);
	});

	it('agrees with the BMI helper about what counts as a measurement', () => {
		// The comma handling is duplicated from `conditions.ts`, which this feature may not
		// amend. If the two ever disagree, the payload and the projection the visitor saw would
		// disagree too, so the agreement is asserted rather than assumed.
		for (const raw of ['180', '180,5', '180.5', '', '   ', 'tall', '0', '-5']) {
			const answers = eligibleAnswers({ heightCm: raw, weightKg: '96' });
			const mapped = (toAnamnesisData(answers).WeightSize as Record<string, unknown>)?.size;

			expect(mapped !== undefined, raw).toBe(bmi(answers) !== null);
		}
	});

	it('shows a refusal about the BMI against the weight, not the height', () => {
		expect(ourQuestionFor('WeightSize')).toBe('weightKg');
	});
});

describe('pregnancy, fanned out to two questions', () => {
	it('uses lowercase on one and capitals on the other, as their model does', () => {
		const data = toAnamnesisData(femaleAnswers({ pregnancyStatus: ['breastfeeding'] }));

		expect(data.isPregnantorBreastfeeding).toBe('yes');
		expect(data.PlanningPregnancy).toBe('No');
	});

	it('answers both with a no when nothing applies', () => {
		const data = toAnamnesisData(femaleAnswers({ pregnancyStatus: ['none'] }));

		expect(data.isPregnantorBreastfeeding).toBe('no');
		expect(data.PlanningPregnancy).toBe('No');
	});

	it('sets only the planning question when that is what was chosen', () => {
		const data = toAnamnesisData(femaleAnswers({ pregnancyStatus: ['planning'] }));

		expect(data.isPregnantorBreastfeeding).toBe('no');
		expect(data.PlanningPregnancy).toBe('Yes');
	});
});

describe('the medication, fanned out to two questions', () => {
	it('answers no and names nothing when the visitor has never taken anything', () => {
		const data = toAnamnesisData(eligibleAnswers({ pastMedication: 'never' }));

		expect(data.TakingWeightlossMedication).toBe('no');
		expect(Object.keys(data)).not.toContain('WeightlossMedication');
	});

	it('answers yes and names the medication otherwise', () => {
		const data = toAnamnesisData(onMounjaro());

		expect(data.TakingWeightlossMedication).toBe('yes');
		expect(data.WeightlossMedication).toBe('mounjaro');
	});

	it('carries the free text when the medication is one they do not list', () => {
		const data = toAnamnesisData(
			onMounjaro({ pastMedication: 'other', pastMedicationOther: 'Retatrutide, 4 mg weekly' })
		);

		expect(data.WeightlossMedication).toBe('other');
		expect(data[commentKey('WeightlossMedication')]).toBe('Retatrutide, 4 mg weekly');
	});
});

describe('the dose, routed to one of their four questions', () => {
	it('sends it under the question for that medication, and under no other', () => {
		const data = toAnamnesisData(onMounjaro());

		expect(data.question4).toBe('2.5 mg');
		expect(Object.keys(data)).not.toContain('CurrentDosingSemaglutide');
		expect(Object.keys(data)).not.toContain('CurrentDosingSemaglutide2');
		expect(Object.keys(data)).not.toContain('DosingSaxenda');
	});

	it('routes each medication family to its own question', () => {
		const dose = (medication: Answers['pastMedication'], value: string) =>
			toAnamnesisData(onMounjaro({ pastMedication: medication, pastMedicationDose: value }));

		expect(dose('wegovy', '2,4 mg').CurrentDosingSemaglutide).toBe('2,4 mg');
		expect(dose('ozempic', '2,0 mg').CurrentDosingSemaglutide2).toBe('2,0 mg');
		expect(dose('saxenda', '3,0').DosingSaxenda).toBe('3,0');
		expect(dose('nevolat (liraglutid)', '3,0').DosingSaxenda).toBe('3,0');
	});

	it('resolves a refusal about any of the four back to the one question we ask', () => {
		for (const name of [
			'CurrentDosingSemaglutide',
			'CurrentDosingSemaglutide2',
			'DosingSaxenda',
			'question4'
		]) {
			expect(ourQuestionFor(name), name).toBe('pastMedicationDose');
		}
	});
});

describe('the two consents', () => {
	it('sends the checkbox as an array of their internal item name', () => {
		expect(toAnamnesisData(eligibleAnswers()).Disclaimer).toEqual(['Item 3']);
	});

	it('sends the radio group as a bare string', () => {
		expect(toAnamnesisData(eligibleAnswers()).ContraceptionDisclaimer).toBe('I understand');
	});

	it('sends neither while the boxes are unticked', () => {
		const data = toAnamnesisData(
			eligibleAnswers({ disclaimer: false, contraceptionDisclaimer: false })
		);

		expect(Object.keys(data)).not.toContain('Disclaimer');
		expect(Object.keys(data)).not.toContain('ContraceptionDisclaimer');
	});
});

describe('answers left behind by a branch that closed', () => {
	// Nothing clears an answer when a branch shuts: the store keeps what was typed, and 24c
	// may or may not change that. So the mapper is what has to refuse to send it. A value
	// under a question RxScale hides is precisely the divergence their validator exists to
	// catch, and it would come back as a 400 with nothing here to explain it.

	it('forgets the dose and the medication when the visitor switches to never', () => {
		const backtracked = onMounjaro({ pastMedication: 'never' });

		// The answers are still in the store, which is what makes this worth proving.
		expect(backtracked.pastMedicationDose).toBe('2.5 mg');
		expect(backtracked.pastMedicationDuration).toBe('12');

		const data = toAnamnesisData(backtracked);

		expect(data.TakingWeightlossMedication).toBe('no');
		expect(Object.keys(data)).not.toContain('WeightlossMedication');
		expect(Object.keys(data)).not.toContain('question4');
		expect(Object.keys(data)).not.toContain('DurationCurrentWeightLossDose');
		expect(Object.keys(data)).not.toContain('LastIntakeWeightlossMedication');
	});

	it('forgets the side effects too, since that screen closes with the medication', () => {
		const data = toAnamnesisData(
			onMounjaro({
				pastMedication: 'never',
				hasSideEffects: 'Yes',
				sideEffectsDescription: 'nausea'
			})
		);

		expect(Object.keys(data)).not.toContain('WegovySideEffects');
		expect(Object.keys(data)).not.toContain('SideEffectsDescription');
	});

	it('forgets both pregnancy questions when the visitor changes sex to male', () => {
		const changedMind = femaleAnswers({ pregnancyStatus: ['pregnant'], gender: 'male' });

		expect(changedMind.pregnancyStatus).toEqual(['pregnant']);

		const data = toAnamnesisData(changedMind);

		expect(data.Gender).toBe('male');
		expect(Object.keys(data)).not.toContain('isPregnantorBreastfeeding');
		expect(Object.keys(data)).not.toContain('PlanningPregnancy');
	});

	it('forgets the gallbladder answer when the disease that opened it is deselected', () => {
		const data = toAnamnesisData(withGallstones({ diseases: ['none'] }));

		expect(data.Diseases).toEqual(['none']);
		expect(Object.keys(data)).not.toContain('GallbladderRemoved');
	});

	it('forgets the weight-related conditions when the weight moves out of the band', () => {
		// RxScale's own `visibleIf` on that question is the same BMI band, so sending an answer
		// for a visitor at 33.9 would be a value under a question their model hides.
		const data = toAnamnesisData(
			eligibleAnswers({ heightCm: '180', weightKg: '110', weightRelatedConditions: ['Fatty liver'] })
		);

		expect(Object.keys(data)).not.toContain('WeightRelatedConditions');
	});

	it('sends the same answer once the branch is open again', () => {
		// The mask must be a mask, not a delete: reopening the branch has to restore the value,
		// or a visitor who backtracked and returned would submit an incomplete anamnesis.
		const data = toAnamnesisData(onMounjaro());

		expect(data.WeightlossMedication).toBe('mounjaro');
		expect(data.question4).toBe('2.5 mg');
	});
});
