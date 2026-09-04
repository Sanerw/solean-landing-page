import { describe, expect, it } from 'vitest';
import { emptyAnswers } from '../answers/types';
import { MEDICATIONS_WITH_DOSE } from '../answers/types';
 import { QUESTIONS, dosesFor, questionById } from './questions';
import { NONE_VALUE, OTHER_VALUE, choiceItems, optionsFor } from './kinds';

const answers = emptyAnswers();

describe('QUESTIONS', () => {
	it('gives every question an id that is a field on Answers', () => {
		// The type already forbids an id that is not a key. This catches the runtime half: a
		// question whose id was renamed on Answers and left behind here.
		for (const question of QUESTIONS) {
			expect(Object.keys(answers), question.id).toContain(question.id);
		}
	});

	it('uses each id once', () => {
		const ids = QUESTIONS.map((question) => question.id);

		expect(new Set(ids).size).toBe(ids.length);
	});

	it('never points a question at another question as its own free-text field', () => {
		// The type enforces the `<id>Other` naming; this proves the field it names exists.
		for (const question of QUESTIONS) {
			if (!question.otherField) continue;

			expect(Object.keys(answers), question.id).toContain(question.otherField);
			expect(question.hasOther, question.id).toBe(true);
		}
	});

	it('gives every choice question its options and no others', () => {
		for (const question of QUESTIONS) {
			const expectsOptions = question.kind === 'single' || question.kind === 'multi';

			expect(Boolean(question.options), question.id).toBe(expectsOptions);
		}
	});

	it('offers something to pick on every question whose options do not depend on answers', () => {
		// Split from the check above once `pastMedicationDose` arrived: its options are a
		// function and are legitimately empty until a medication is named, so asserting on the
		// resolved list would have forced the assertion to be weakened for every question.
		for (const question of QUESTIONS) {
			if (typeof question.options !== 'object') continue;

			expect(optionsFor(question, answers).length, question.id).toBeGreaterThan(0);
		}
	});

	it('gives every consent question the wording beside its box', () => {
		for (const question of QUESTIONS) {
			if (question.kind !== 'consent') continue;

			expect(question.confirmLabel, question.id).toBeTypeOf('function');
		}
	});

	it('asks all 27 questions', () => {
		expect(QUESTIONS).toHaveLength(27);
	});

	it('keeps every choice value unique inside its own question', () => {
		for (const question of QUESTIONS) {
			const values = optionsFor(question, answers).map((option) => option.value);

			expect(new Set(values).size, question.id).toBe(values.length);
		}
	});

	it('never spells a choice as the none or other marker', () => {
		// Those two strings are survey-core's own, added by `hasNone` and `hasOther`. A real
		// choice carrying one would collide with the marker and break both sides' validators.
		for (const question of QUESTIONS) {
			for (const option of optionsFor(question, answers)) {
				expect([NONE_VALUE, OTHER_VALUE], question.id).not.toContain(option.value);
			}
		}
	});

	it('gives a free-text field to every question that offers "other", and only those', () => {
		for (const question of QUESTIONS) {
			expect(Boolean(question.otherField), question.id).toBe(Boolean(question.hasOther));
		}
	});
});

describe('dosesFor', () => {
	it('offers a dose scale for exactly the medications RxScale follows up on', () => {
		for (const medication of MEDICATIONS_WITH_DOSE) {
			expect(dosesFor(medication).length, medication).toBeGreaterThan(0);
		}
	});

	it('offers nothing for a medication RxScale asks no dose for', () => {
		expect(dosesFor('rybelsus')).toEqual([]);
		expect(dosesFor('never')).toEqual([]);
		expect(dosesFor('other')).toEqual([]);
		expect(dosesFor(null)).toEqual([]);
	});

	it('gives each medication family its own scale', () => {
		const scales = MEDICATIONS_WITH_DOSE.map((medication) =>
			dosesFor(medication)
				.map((option) => option.value)
				.join('|')
		);

		// Saxenda and Nevolat share one scale deliberately; the other three differ, and the
		// difference is not cosmetic: Wegovy tops out at 2,4 mg where Ozempic reads 2,0 mg.
		expect(new Set(scales).size).toBe(4);
		expect(dosesFor('wegovy')).not.toEqual(dosesFor('ozempic'));
		expect(dosesFor('saxenda')).toEqual(dosesFor('nevolat (liraglutid)'));
	});

	it("keeps each scale's values in RxScale's own spelling", () => {
		// Their four dose questions disagree with each other, and the mapper relies on ours
		// already matching whichever one applies: a comma for semaglutide, a period for
		// tirzepatide, no unit at all for liraglutide.
		expect(dosesFor('wegovy').map((o) => o.value)).toContain('0,25 mg');
		expect(dosesFor('mounjaro').map((o) => o.value)).toContain('2.5 mg');
		expect(dosesFor('saxenda').map((o) => o.value)).toContain('0,6');
	});
});

describe('questionById', () => {
	it('finds a defined question', () => {
		expect(questionById('gender').kind).toBe('single');
	});

	it('throws on an id no question claims, rather than returning undefined', () => {
		expect(() => questionById('weightRelatedConditionsOther')).toThrow();
	});
});

describe('choiceItems ordering', () => {
	const labels = { none: () => 'None', other: () => 'Other' };

	it('draws a pinned option after the none and other rows', () => {
		// `never` is a real RxScale value that reads last, not a `none` sentinel. See `pinned`
		// in `kinds.ts` for why the two stay separate mechanisms.
		const question = questionById('pastMedication');
		const kinds = choiceItems(question, optionsFor(question, emptyAnswers()), labels).map(
			(item) => item.kind
		);

		expect(kinds.at(-1)).toBe('pinned');
		expect(kinds.indexOf('other')).toBeLessThan(kinds.indexOf('pinned'));
		expect(kinds.filter((kind) => kind === 'pinned')).toHaveLength(1);
	});

	it('keeps the pinned option out of the ordinary list', () => {
		const question = questionById('pastMedication');
		const items = choiceItems(question, optionsFor(question, emptyAnswers()), labels);
		const ordinary = items.filter((item) => item.kind === 'option');

		expect(ordinary.map((item) => item.value)).not.toContain('never');
	});

	it('leaves a list with nothing pinned exactly as it was', () => {
		const question = questionById('diseases');
		const options = optionsFor(question, emptyAnswers());
		const items = choiceItems(question, options, labels);

		expect(items.slice(0, options.length).map((item) => item.value)).toEqual(
			options.map((option) => option.value)
		);
		expect(items.map((item) => item.kind)).not.toContain('pinned');
	});
});
