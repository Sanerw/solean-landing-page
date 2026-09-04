import { describe, expect, it } from 'vitest';
import { hasBlockingError, screenErrorFor } from './screen-errors';

const OURS = { weightKg: 'required' } as const;
const THEIRS = { weightKg: 'BMI zu niedrig', eatingDisorder: 'Leider nicht verschreibbar' };

describe('screenErrorFor', () => {
	it('shows ours when both have something to say', () => {
		// The rule this module exists for. Theirs would tell somebody who typed nothing that
		// they are ineligible, which is wrong and alarming in equal measure.
		expect(screenErrorFor('weightKg', OURS, THEIRS)).toEqual({
			source: 'ours',
			code: 'required'
		});
	});

	it('shows theirs when ours is satisfied', () => {
		expect(screenErrorFor('eatingDisorder', OURS, THEIRS)).toEqual({
			source: 'theirs',
			text: 'Leider nicht verschreibbar'
		});
	});

	it('shows nothing when neither objects', () => {
		expect(screenErrorFor('firstName', OURS, THEIRS)).toBeNull();
	});

	it('keeps the two sources distinguishable, because they are shown differently', () => {
		// Ours is a code the screen translates; theirs is a German sentence passed through.
		// A screen that could not tell them apart would have to translate a sentence or print
		// a code.
		const ours = screenErrorFor('weightKg', OURS, {});
		const theirs = screenErrorFor('eatingDisorder', {}, THEIRS);

		expect(ours?.source).toBe('ours');
		expect(theirs?.source).toBe('theirs');
	});
});

describe('hasBlockingError', () => {
	it('is true when any question on the screen has either kind', () => {
		expect(hasBlockingError(['firstName', 'weightKg'], OURS, {})).toBe(true);
		expect(hasBlockingError(['firstName', 'eatingDisorder'], {}, THEIRS)).toBe(true);
	});

	it('is false when none of the named questions has one', () => {
		expect(hasBlockingError(['firstName', 'lastName'], OURS, THEIRS)).toBe(false);
	});

	it('ignores a question that is not on the screen, even if it has an error', () => {
		// A hidden question's error must not block a screen that never showed it.
		expect(hasBlockingError(['firstName'], OURS, THEIRS)).toBe(false);
	});
});

describe('screenErrorFor with the changed set', () => {
	it('reports nothing for a question answered again since the submit', () => {
		// Otherwise the screen goes on saying an answer is missing while it is on display,
		// which is what `screens/08-long-free-text.png` caught.
		expect(screenErrorFor('weightKg', OURS, THEIRS, new Set(['weightKg']))).toBeNull();
	});

	it('drops their refusal too, because it judged the answer that has just been replaced', () => {
		expect(screenErrorFor('eatingDisorder', {}, THEIRS, new Set(['eatingDisorder']))).toBeNull();
	});

	it('leaves an unchanged sibling reporting', () => {
		expect(screenErrorFor('weightKg', OURS, THEIRS, new Set(['firstName']))).toEqual({
			source: 'ours',
			code: 'required'
		});
	});

	it('reports again once the set is empty, which is what a fresh submit does', () => {
		expect(screenErrorFor('weightKg', OURS, THEIRS, new Set())).not.toBeNull();
	});

	it('unblocks the screen when the only offending answer has changed', () => {
		expect(hasBlockingError(['weightKg'], OURS, THEIRS, new Set(['weightKg']))).toBe(false);
	});
});
