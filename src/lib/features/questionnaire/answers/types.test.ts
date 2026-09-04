import { describe, expect, it } from 'vitest';
import { emptyAnswers } from './types';

describe('emptyAnswers', () => {
	it('gives every field a value', () => {
		// The return type already refuses a missing key at build time. This catches the other
		// half: a key present but left undefined, which types alone would let through.
		for (const [key, value] of Object.entries(emptyAnswers())) {
			expect(value, key).toBeDefined();
		}
	});

	it('starts every answer empty', () => {
		const answers = emptyAnswers();

		expect(answers.gender).toBeNull();
		expect(answers.heightCm).toBe('');
		expect(answers.diseases).toEqual([]);
		expect(answers.disclaimer).toBe(false);
	});

	it('builds a new object each time', () => {
		expect(emptyAnswers()).not.toBe(emptyAnswers());
	});

	it('does not share its arrays between calls', () => {
		// The bug this exists for: one `[]` reused across calls would carry a visitor's
		// selections into the next session that reset the store.
		const first = emptyAnswers();
		first.diseases.push('Kidney disease');
		first.allergies.push('Semaglutide');

		expect(emptyAnswers().diseases).toEqual([]);
		expect(emptyAnswers().allergies).toEqual([]);
	});
});
