import { describe, expect, it } from 'vitest';
import { questionById } from '../definition/questions';
import { keepsOtherText, toggleMulti } from './choice-behaviour';

describe('toggleMulti', () => {
	it('adds and removes an ordinary option', () => {
		expect(toggleMulti([], 'Kidney disease', true)).toEqual(['Kidney disease']);
		expect(toggleMulti(['Kidney disease'], 'Kidney disease', false)).toEqual([]);
	});

	it('replaces everything when "none of the above" is ticked', () => {
		expect(toggleMulti(['Kidney disease', 'Heart failure'], 'none', true)).toEqual(['none']);
	});

	it('clears "none of the above" when a real option is ticked', () => {
		expect(toggleMulti(['none'], 'Kidney disease', true)).toEqual(['Kidney disease']);
	});

	it('holds the rule in both orders, which is the whole point', () => {
		// none, then a real option
		expect(toggleMulti(toggleMulti([], 'none', true), 'Kidney disease', true)).toEqual([
			'Kidney disease'
		]);
		// a real option, then none
		expect(toggleMulti(toggleMulti([], 'Kidney disease', true), 'none', true)).toEqual(['none']);
	});

	it('never produces the combination the validator refuses', () => {
		// `validateScreen` reports `none-with-others`, and this is what makes that state
		// unreachable through the UI rather than merely reported once it happens.
		const sequence: [string, boolean][] = [
			['Kidney disease', true],
			['Heart failure', true],
			['none', true],
			['Liver disease', true],
			['none', true]
		];

		let selected: readonly string[] = [];
		for (const [value, checked] of sequence) {
			selected = toggleMulti(selected, value, checked);
			const both = selected.includes('none') && selected.length > 1;

			expect(both, selected.join()).toBe(false);
		}
	});

	it('unticking "none" leaves nothing selected rather than restoring what it replaced', () => {
		expect(toggleMulti(['none'], 'none', false)).toEqual([]);
	});
});

describe('keepsOtherText', () => {
	it('keeps the free text while "other" is chosen, on a multi and a single', () => {
		expect(keepsOtherText(questionById('diseases'), ['other'])).toBe(true);
		expect(keepsOtherText(questionById('pastMedication'), 'other')).toBe(true);
	});

	it('does not once it is deselected', () => {
		expect(keepsOtherText(questionById('diseases'), ['none'])).toBe(false);
		expect(keepsOtherText(questionById('pastMedication'), 'never')).toBe(false);
	});

	it('is false for a question that offers no "other" at all', () => {
		expect(keepsOtherText(questionById('familyDiseases'), ['other'])).toBe(false);
	});
});
