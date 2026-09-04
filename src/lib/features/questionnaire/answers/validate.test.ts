import { describe, expect, it } from 'vitest';
import { questionById } from '../definition/questions';
import { emptyAnswers, GALLSTONES, type Answers } from './types';
import { validateQuestion, validateScreen } from './validate';

function answering(overrides: Partial<Answers>): Answers {
	return { ...emptyAnswers(), ...overrides };
}

const TODAY = new Date('2026-09-04T00:00:00Z');

function check(id: Parameters<typeof questionById>[0], answers: Answers) {
	return validateQuestion(questionById(id), answers, TODAY);
}

describe('required', () => {
	it('blocks an unanswered question of every kind', () => {
		const blank = emptyAnswers();

		expect(check('gender', blank)).toBe('required');
		expect(check('heightCm', blank)).toBe('required');
		expect(check('diseases', blank)).toBe('required');
		expect(check('dateOfBirth', blank)).toBe('required');
		expect(check('sideEffectsDescription', blank)).toBe('required');
		expect(check('disclaimer', blank)).toBe('required');
	});

	it('lets an optional question through unanswered', () => {
		expect(check('phone', emptyAnswers())).toBeNull();
	});

	it('treats whitespace as no answer', () => {
		expect(check('firstName', answering({ firstName: '   ' }))).toBe('required');
	});

	it('accepts "none of the above" as a real answer', () => {
		expect(check('diseases', answering({ diseases: ['none'] }))).toBeNull();
	});

	it('accepts a ticked consent and refuses an unticked one', () => {
		expect(check('disclaimer', answering({ disclaimer: true }))).toBeNull();
		expect(check('disclaimer', answering({ disclaimer: false }))).toBe('required');
	});
});

describe('none and other', () => {
	it('refuses "none of the above" alongside a real answer', () => {
		expect(check('diseases', answering({ diseases: ['none', 'Kidney disease'] }))).toBe(
			'none-with-others'
		);
	});

	it('refuses it whichever way round the two were ticked', () => {
		expect(check('allergies', answering({ allergies: ['Semaglutide', 'none'] }))).toBe(
			'none-with-others'
		);
	});

	it('requires the free text once "other" is chosen, on a multi and on a single', () => {
		expect(check('diseases', answering({ diseases: ['other'] }))).toBe('other-text-missing');
		expect(check('pastMedication', answering({ pastMedication: 'other' }))).toBe(
			'other-text-missing'
		);
	});

	it('is satisfied once the free text is there', () => {
		expect(
			check('diseases', answering({ diseases: ['other'], diseasesOther: 'Sarcoidosis' }))
		).toBeNull();
	});

	it('ignores free text left behind when "other" is no longer chosen', () => {
		expect(
			check('diseases', answering({ diseases: ['Kidney disease'], diseasesOther: 'stale' }))
		).toBeNull();
	});
});

describe('numbers', () => {
	it("accepts a measurement inside RxScale's own plausibility band, at both ends", () => {
		expect(check('heightCm', answering({ heightCm: '120' }))).toBeNull();
		expect(check('heightCm', answering({ heightCm: '250' }))).toBeNull();
		expect(check('weightKg', answering({ weightKg: '40' }))).toBeNull();
		expect(check('weightKg', answering({ weightKg: '300' }))).toBeNull();
	});

	it('refuses one just outside it', () => {
		expect(check('heightCm', answering({ heightCm: '119' }))).toBe('out-of-range');
		expect(check('heightCm', answering({ heightCm: '251' }))).toBe('out-of-range');
		expect(check('weightKg', answering({ weightKg: '39' }))).toBe('out-of-range');
		expect(check('weightKg', answering({ weightKg: '301' }))).toBe('out-of-range');
	});

	it('refuses text that is not a number', () => {
		expect(check('heightCm', answering({ heightCm: 'about six foot' }))).toBe('out-of-range');
	});

	it('reads a comma as a decimal separator', () => {
		expect(check('weightKg', answering({ weightKg: '96,5' }))).toBeNull();
	});

	it('refuses a number that has no range but cannot be zero or less', () => {
		expect(check('pastMedicationDuration', answering({ pastMedicationDuration: '0' }))).toBe(
			'out-of-range'
		);
		expect(check('pastMedicationDuration', answering({ pastMedicationDuration: '12' }))).toBeNull();
	});
});

describe('email', () => {
	it('accepts an ordinary address', () => {
		expect(check('email', answering({ email: 'jonas.weber@example.com' }))).toBeNull();
	});

	it('refuses one with no domain or no at sign', () => {
		expect(check('email', answering({ email: 'jonas.weber' }))).toBe('invalid-email');
		expect(check('email', answering({ email: 'jonas@example' }))).toBe('invalid-email');
		expect(check('email', answering({ email: 'jonas weber@example.com' }))).toBe('invalid-email');
	});
});

describe('date of birth', () => {
	it('accepts a real date in the past', () => {
		expect(check('dateOfBirth', answering({ dateOfBirth: '1990-04-17' }))).toBeNull();
	});

	it('refuses a date that is not in the calendar', () => {
		// JavaScript rolls this into the 3rd of March rather than failing, so the check has to
		// be the round trip, not the parse.
		expect(check('dateOfBirth', answering({ dateOfBirth: '2026-02-31' }))).toBe('invalid-date');
	});

	it('refuses a malformed one', () => {
		expect(check('dateOfBirth', answering({ dateOfBirth: '17.04.1990' }))).toBe('invalid-date');
	});

	it('refuses a birthday that has not happened', () => {
		expect(check('dateOfBirth', answering({ dateOfBirth: '2026-09-05' }))).toBe('invalid-date');
		expect(check('dateOfBirth', answering({ dateOfBirth: '2026-09-04' }))).toBeNull();
	});

	it('leaves the age window to RxScale', () => {
		// 18 to 80 is their rule, with their refusal text, applied from the snapshot in 24b.
		// A twelve year old passes here and is stopped there, deliberately.
		expect(check('dateOfBirth', answering({ dateOfBirth: '2014-01-01' }))).toBeNull();
		expect(check('dateOfBirth', answering({ dateOfBirth: '1920-01-01' }))).toBeNull();
	});
});

describe('validateScreen', () => {
	it('reports every unanswered question on the screen at once', () => {
		expect(validateScreen('about-you', emptyAnswers(), TODAY)).toEqual({
			gender: 'required',
			dateOfBirth: 'required',
			heightCm: 'required',
			weightKg: 'required'
		});
	});

	it('never blocks on a question the branching does not ask', () => {
		// Nothing on this screen is answered, yet only the medication itself is required: the
		// dose, duration and last dose are not asked until one is named.
		expect(validateScreen('medication-history', emptyAnswers(), TODAY)).toEqual({
			pastMedication: 'required'
		});
	});

	it('asks for the follow-ups once the branch opens', () => {
		const errors = validateScreen(
			'medication-history',
			answering({ pastMedication: 'mounjaro' }),
			TODAY
		);

		expect(errors).toEqual({
			pastMedicationDose: 'required',
			pastMedicationDuration: 'required',
			pastMedicationLastDose: 'required'
		});
	});

	it('lets a complete screen through', () => {
		const complete = answering({
			gender: 'male',
			dateOfBirth: '1990-04-17',
			heightCm: '180',
			weightKg: '96'
		});

		expect(validateScreen('about-you', complete, TODAY)).toEqual({});
	});

	it('leaves the optional phone out of the errors on an otherwise blank screen', () => {
		expect(validateScreen('your-details', emptyAnswers(), TODAY)).toEqual({
			firstName: 'required',
			lastName: 'required',
			email: 'required'
		});
	});

	it('validates a conditional screen the same as any other once it is shown', () => {
		expect(validateScreen('gallbladder', answering({ diseases: [GALLSTONES] }), TODAY)).toEqual({
			gallbladderRemoved: 'required'
		});
	});
});
