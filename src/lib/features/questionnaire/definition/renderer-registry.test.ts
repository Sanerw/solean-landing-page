import { describe, expect, it } from 'vitest';
import { emptyAnswers } from '../answers/types';
import { QUESTIONS, questionById } from './questions';
import { optionsFor, type QuestionKind } from './kinds';
import { rendererFor } from './renderer-registry';

/** Every kind the definition can express, listed so the test fails when one is added. */
const ALL_KINDS: QuestionKind[] = [
	'single',
	'multi',
	'text',
	'number',
	'date',
	'comment',
	'consent'
];

describe('the registry', () => {
	it('has a component for every kind', () => {
		for (const kind of ALL_KINDS) {
			const question = QUESTIONS.find((candidate) => candidate.kind === kind);

			expect(question, `no question uses kind "${kind}"`).toBeDefined();
			expect(rendererFor(question!, optionsFor(question!, emptyAnswers())).entry, kind).not.toBeNull();
		}
	});

	it('draws every question in the definition', () => {
		// The real assertion: not that the record is exhaustive, which the compiler already
		// guarantees, but that no actual question falls through it.
		const answers = emptyAnswers();

		for (const question of QUESTIONS) {
			if (question.kind !== 'single' && question.kind !== 'multi') {
				expect(rendererFor(question, []).entry, question.id).not.toBeNull();
				continue;
			}

			// A choice question is only drawable once it has something to choose from, which for
			// the dose depends on an earlier answer.
			const options = optionsFor(question, answers);
			if (options.length > 0) {
				expect(rendererFor(question, options).entry, question.id).not.toBeNull();
			}
		}
	});

	it('refuses a choice question with nothing to choose from, and says which', () => {
		// The dose before a medication is named. Rendering it would show a question with no
		// options; skipping it would submit without an answer RxScale requires.
		const dose = questionById('pastMedicationDose');
		const lookup = rendererFor(dose, optionsFor(dose, emptyAnswers()));

		expect(lookup.entry).toBeNull();
		expect(lookup.reason).toContain('pastMedicationDose');
	});

	it('draws the dose once a medication makes its options resolve', () => {
		const dose = questionById('pastMedicationDose');
		const onMounjaro = { ...emptyAnswers(), pastMedication: 'mounjaro' as const };

		expect(rendererFor(dose, optionsFor(dose, onMounjaro)).entry).not.toBeNull();
	});

	it('gives choice and consent questions a group presentation, single controls a label', () => {
		const groups = ['diseases', 'gender', 'disclaimer'] as const;
		const controls = ['firstName', 'heightCm', 'dateOfBirth', 'sideEffectsDescription'] as const;

		for (const id of groups) {
			const q = questionById(id);
			expect(rendererFor(q, optionsFor(q, emptyAnswers())).entry?.presentation, id).toBe('group');
		}
		for (const id of controls) {
			const q = questionById(id);
			expect(rendererFor(q, optionsFor(q, emptyAnswers())).entry?.presentation, id).toBe('control');
		}
	});
});
