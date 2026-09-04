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

describe('the contact fields', () => {
	it('accepts a phone number written the way people write one', () => {
		for (const phone of ['+49 151 234 56 78', '0151/2345678', '(030) 123-4567']) {
			expect(check('phone', answering({ phone })), phone).toBeNull();
		}
	});

	it('refuses letters and a number too short to be one', () => {
		expect(check('phone', answering({ phone: 'abc' }))).toBe('invalid-phone');
		expect(check('phone', answering({ phone: '12345' }))).toBe('invalid-phone');
	});

	// Optional, so an empty phone is still no error at all: the rule is about what was typed.
	it('still lets the phone be left out', () => {
		expect(check('phone', answering({ phone: '' }))).toBeNull();
	});

	it('refuses a name with no letter in it, and accepts every name that has one', () => {
		expect(check('firstName', answering({ firstName: '123' }))).toBe('invalid-name');
		for (const name of ["O'Brien", 'Müller-Lüdenscheidt', '李', 'Ali']) {
			expect(check('lastName', answering({ lastName: name })), name).toBeNull();
		}
	});
});

describe('the last dose', () => {
	const dose = (value: string) =>
		check('pastMedicationLastDose', answering({ pastMedication: 'mounjaro', pastMedicationLastDose: value }));

	it('accepts a month and year that has been', () => {
		expect(dose('08/2026')).toBeNull();
		expect(dose('01/1991')).toBeNull();
	});

	it('refuses a month that is not one, and free text', () => {
		expect(dose('13/2026')).toBe('invalid-month');
		expect(dose('2026')).toBe('invalid-month');
		expect(dose('irgendwann')).toBe('invalid-month');
	});

	// A dose taken in the future is not a dose already taken, and a doctor reads this to work
	// out the interval since.
	it('refuses a month still ahead', () => {
		expect(dose('12/2099')).toBe('invalid-month');
	});
});

describe('numbers', () => {
	it("accepts a measurement inside RxScale's own plausibility band, near both ends", () => {
		expect(check('heightCm', answering({ heightCm: '121' }))).toBeNull();
		expect(check('heightCm', answering({ heightCm: '249' }))).toBeNull();
		expect(check('weightKg', answering({ weightKg: '41' }))).toBeNull();
		expect(check('weightKg', answering({ weightKg: '299' }))).toBeNull();
	});

	// Their expression is `> 120 and < 250`, so the bound itself is theirs to refuse and ours
	// to refuse first. Accepting it here would pass the field and fail on Continue, in German.
	it('refuses the bound itself, exactly as their expression does', () => {
		expect(check('heightCm', answering({ heightCm: '120' }))).toBe('out-of-range');
		expect(check('heightCm', answering({ heightCm: '250' }))).toBe('out-of-range');
		expect(check('weightKg', answering({ weightKg: '40' }))).toBe('out-of-range');
		expect(check('weightKg', answering({ weightKg: '300' }))).toBe('out-of-range');
	});

	it('refuses one further outside it', () => {
		expect(check('heightCm', answering({ heightCm: '119' }))).toBe('out-of-range');
		expect(check('heightCm', answering({ heightCm: '251' }))).toBe('out-of-range');
		expect(check('weightKg', answering({ weightKg: '39' }))).toBe('out-of-range');
		expect(check('weightKg', answering({ weightKg: '301' }))).toBe('out-of-range');
	});

	// Ours, not RxScale's: their duration question carries no validators at all, so nothing
	// else stops a mistyped 999 reaching a doctor as five years of treatment.
	it('holds the treatment duration to a plausible number of weeks', () => {
		const weeks = (value: string) =>
			check(
				'pastMedicationDuration',
				answering({ pastMedication: 'mounjaro', pastMedicationDuration: value })
			);

		expect(weeks('12')).toBeNull();
		expect(weeks('260')).toBeNull();
		expect(weeks('261')).toBe('out-of-range');
		expect(weeks('999')).toBe('out-of-range');
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
