import { describe, expect, it } from 'vitest';
import { blocksInsertion, digitsOf, isoFromDigits, maskDigits } from './date-picker.svelte';

/**
 * The typed half of the date field. A wrong answer here is a wrong date of birth on a
 * prescription request, so the cases are the ones a person actually types: a separator they
 * chose themselves, a date that does not exist, and everything half-finished on the way.
 */

describe('digitsOf', () => {
	it('takes the digits whatever separator was typed', () => {
		expect(digitsOf('14/05/1990')).toBe('14051990');
		expect(digitsOf('14.05.1990')).toBe('14051990');
		expect(digitsOf('14-05-1990')).toBe('14051990');
		expect(digitsOf('14051990')).toBe('14051990');
	});

	it('stops at eight, so a ninth keystroke cannot shift the year', () => {
		expect(digitsOf('140519901')).toBe('14051990');
	});
});

describe('blocksInsertion', () => {
	it('lets a digit through', () => {
		expect(blocksInsertion('insertText', '4')).toBe(false);
	});

	// Refused before it lands, rather than stripped after. A letter typed into an empty field
	// leaves the masked value unchanged, so there is nothing for the renderer to correct and
	// the character would stay on screen.
	it('refuses a letter, a separator and anything with no data', () => {
		expect(blocksInsertion('insertText', 'a')).toBe(true);
		expect(blocksInsertion('insertText', '/')).toBe(true);
		expect(blocksInsertion('insertText', ' ')).toBe(true);
		expect(blocksInsertion('insertText', null)).toBe(true);
	});

	// A paste carries its own separators and is cleaned up afterwards instead: refusing the
	// whole thing would reject `14/05/1990` off the clipboard.
	it('leaves a paste, a deletion and a composition alone', () => {
		expect(blocksInsertion('insertFromPaste', '14/05/1990')).toBe(false);
		expect(blocksInsertion('deleteContentBackward', null)).toBe(false);
		expect(blocksInsertion('insertCompositionText', 'a')).toBe(false);
	});
});

describe('maskDigits', () => {
	it('adds the separators as the date is typed', () => {
		expect(maskDigits('')).toBe('');
		expect(maskDigits('1')).toBe('1');
		expect(maskDigits('14')).toBe('14');
		expect(maskDigits('145')).toBe('14/5');
		expect(maskDigits('1405')).toBe('14/05');
		expect(maskDigits('14051990')).toBe('14/05/1990');
	});
});

describe('isoFromDigits', () => {
	it('reads a whole date as day, month, year', () => {
		expect(isoFromDigits('14051990')).toBe('1990-05-14');
		expect(isoFromDigits('01011970')).toBe('1970-01-01');
	});

	it('names no date until all eight digits are in', () => {
		expect(isoFromDigits('')).toBeNull();
		expect(isoFromDigits('1405199')).toBeNull();
	});

	// The reason the check is a real date parse rather than a range test: rolling this into
	// 3 March would record a birth date nobody typed.
	it('refuses a date that does not exist', () => {
		expect(isoFromDigits('31021991')).toBeNull();
		expect(isoFromDigits('32011991')).toBeNull();
		expect(isoFromDigits('14131990')).toBeNull();
	});

	it('accepts the leap day in a year that has one, and refuses it otherwise', () => {
		expect(isoFromDigits('29022004')).toBe('2004-02-29');
		expect(isoFromDigits('29022003')).toBeNull();
	});
});
