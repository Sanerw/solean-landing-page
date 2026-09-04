import { describe, expect, it } from 'vitest';
import { MODEL_SNAPSHOT, modelInventory, modelQuestion } from './snapshot';

const questions = modelInventory();

describe('the snapshot', () => {
	it('is the questionnaire the app is configured against', () => {
		expect(MODEL_SNAPSHOT.identifier).toBe('LIVE: MedQ NEW RECOMMENDER (01/26)');
		expect(MODEL_SNAPSHOT.type).toBe('PRODUCT_RECOMMENDER');
	});
});

describe('modelInventory', () => {
	it('finds the 32 questions that take an answer', () => {
		expect(questions).toHaveLength(32);
	});

	it('leaves out the three notes that display text and take none', () => {
		// `expression` elements carry the e-mail disclaimer and the two product notes. Counting
		// one as a question would make the coverage guard demand a mapping for a note.
		const names = questions.map((question) => question.name);

		expect(names).not.toContain('InfoEMail');
		expect(names).not.toContain('question3');
		expect(names).not.toContain('InfoSaxendaPen');
	});

	it('finds 17 questions required of every visitor', () => {
		const always = questions.filter((question) => question.isRequired && !question.visibleIf);

		expect(always).toHaveLength(17);
	});

	it('finds 14 required only for some answers', () => {
		const conditional = questions.filter((question) => question.isRequired && question.visibleIf);

		expect(conditional).toHaveLength(14);
	});

	it('treats the e-mail as the one question RxScale does not insist on', () => {
		const optional = questions.filter((question) => !question.isRequired);

		expect(optional.map((question) => question.name)).toEqual(['EMail']);
	});

	it('names each question once, so a name is a usable key', () => {
		const names = questions.map((question) => question.name);

		expect(new Set(names).size).toBe(names.length);
	});
});

describe('reading one question structurally', () => {
	it('reads choices given as objects and as bare strings alike', () => {
		// `allergy` mixes both shapes in one list, which a naive reader silently drops half of.
		expect(modelQuestion('allergy')?.choiceValues).toEqual([
			'Liraglutide',
			'Semaglutide',
			'Tirzepatid',
			'Benzylalkohol',
			'Disodium phosphate dihydrate',
			'Propylene glycol',
			'phenol',
			'Hydrochloric Acid/Sodium Hydroxide'
		]);
	});

	it('reads the item names of a multipletext, which are keys inside its answer', () => {
		expect(modelQuestion('WeightSize')?.itemNames).toEqual(['size', 'weight']);
		expect(modelQuestion('dob2')?.itemNames).toEqual(['Day', 'Month', 'Year']);
		expect(modelQuestion('Name')?.itemNames).toEqual(['Name', 'Surname']);
	});

	it('keeps their branching expression verbatim', () => {
		expect(modelQuestion('isPregnantorBreastfeeding')?.visibleIf).toBe("{Gender} = 'female'");
		expect(modelQuestion('GallbladderRemoved')?.visibleIf).toBe(
			"{Diseases} allof ['Gallstones, gallbladder disease']"
		);
	});

	it('keeps their validator expressions, which the shadow runs and the drift check compares', () => {
		expect(modelQuestion('dob')?.validatorExpressions).toEqual([
			'age({dob}) < 80 && age({dob}) >= 18'
		]);
	});

	it('records which questions offer none and other', () => {
		expect(modelQuestion('Diseases')?.hasNone).toBe(true);
		expect(modelQuestion('Diseases')?.hasOther).toBe(true);
		expect(modelQuestion('FamilyDiseases')?.hasNone).toBe(true);
		expect(modelQuestion('FamilyDiseases')?.hasOther).toBe(false);
		expect(modelQuestion('WeightlossMedication')?.hasNone).toBe(false);
		expect(modelQuestion('WeightlossMedication')?.hasOther).toBe(true);
	});

	it('answers null for a name the model does not have', () => {
		expect(modelQuestion('NoSuchQuestion')).toBeNull();
	});
});
