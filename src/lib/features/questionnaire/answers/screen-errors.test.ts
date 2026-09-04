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
