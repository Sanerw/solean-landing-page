import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
	chooseCountry,
	countryList,
	DEFAULT_COUNTRY,
	enterPhone,
	flagSrc,
	keepDiallable,
	matchCountry,
	searchCountries,
	readPhone
} from './phone';

describe('the flag', () => {
	// A file this app serves rather than an emoji: Windows draws no flag glyphs, so the pair
	// this used to return was the letters "DE" for a whole platform.
	it('is a file under the flags directory, named by the lowercase ISO code', () => {
		expect(flagSrc('DE')).toBe('/flags/de.svg');
		expect(flagSrc('at')).toBe('/flags/at.svg');
	});
});

describe('the country list', () => {
	it('puts the three we ship to first, in that order', () => {
		expect(countryList('de').slice(0, 3).map((country) => country.code)).toEqual([
			'DE',
			'AT',
			'CH'
		]);
	});

	it('sorts the rest by name in the language it was asked for', () => {
		const collator = new Intl.Collator('de');
		const rest = countryList('de').filter((country) => !country.pinned);

		for (let index = 1; index < rest.length; index += 1) {
			expect(collator.compare(rest[index - 1].name, rest[index].name)).toBeLessThanOrEqual(0);
		}
	});

	it('names a country in the language it was asked for', () => {
		const german = countryList('de').find((country) => country.code === 'DE');
		const english = countryList('en').find((country) => country.code === 'DE');

		expect(german?.name).toBe('Deutschland');
		expect(english?.name).toBe('Germany');
		expect(german?.callingCode).toBe('49');
	});

	// The flags are files this repository serves, so a country whose file was never copied is a
	// broken image on a live screen rather than a failing import. Nothing else would catch it.
	it('has a flag file for every country it offers', () => {
		const missing = countryList('de')
			.filter((country) => !existsSync(`static${country.flagSrc}`))
			.map((country) => country.code);

		expect(missing).toEqual([]);
	});

	it('offers every country libphonenumber knows, once each', () => {
		const codes = countryList('de').map((country) => country.code);

		expect(codes.length).toBeGreaterThan(200);
		expect(new Set(codes).size).toBe(codes.length);
	});
});

describe('filtering the list', () => {
	const list = countryList('de');
	const find = (code: string) => list.find((country) => country.code === code)!;
	const matches = (search: string) =>
		list.filter((country) => matchCountry(country, search) > 0).map((country) => country.code);

	it('ranks a name that starts with the search above one that merely contains it', () => {
		expect(matchCountry(find('PL'), 'pol')).toBeGreaterThan(matchCountry(find('PF'), 'pol'));
	});

	// The default fuzzy filter scores a subsequence, so "pol" matched Portugal through p-o-l.
	it('does not match letters that merely appear in order', () => {
		expect(matchCountry(find('PT'), 'pol')).toBe(0);
		expect(matches('zzzz')).toEqual([]);
	});

	it('folds the diacritics a German keyboard may not have', () => {
		expect(matchCountry(find('AT'), 'osterreich')).toBeGreaterThan(0);
		expect(matchCountry(find('TR'), 'turkei')).toBeGreaterThan(0);
		expect(matchCountry(find('EG'), 'agypten')).toBeGreaterThan(0);
	});

	it('finds a country by the code somebody knows instead of the name', () => {
		expect(matches('+48')).toContain('PL');
		expect(matches('48')).toContain('PL');
		expect(matches('PL')).toContain('PL');
	});

	it('keeps every country when nothing has been typed', () => {
		expect(matches('')).toHaveLength(list.length);
		expect(searchCountries(list, '  ')).toEqual(list);
	});

	// The bug this ordering exists for: alphabetically Französisch-Polynesien precedes Polen,
	// so a list left in its own order offered the wrong country to the Enter key.
	it('puts the country the search names first', () => {
		const found = searchCountries(list, 'pol');

		expect(found[0].code).toBe('PL');
		expect(found.map((country) => country.code)).toContain('PF');
	});

	it('keeps equally good matches in the order they came in', () => {
		// "land" is carried by many German country names, none of which starts with it, so this
		// is one whole score band and the tie break is the alphabetical order it arrived in.
		// Pinned countries are excluded: Deutschland matches this search and legitimately
		// outranks the alphabet, which is the whole point of pinning it.
		const names = searchCountries(list, 'land')
			.filter((country) => !country.pinned && matchCountry(country, 'land') === 2)
			.map((country) => country.name);

		expect(names.length).toBeGreaterThan(3);
		expect(names).toEqual([...names].sort(new Intl.Collator('de').compare));
	});
});

describe('what may be typed', () => {
	// Applied on the way in rather than only on Continue: a letter is never part of a number,
	// so refusing it a screen later is late news.
	it('drops what a telephone number cannot contain', () => {
		expect(keepDiallable('abc151-..;234')).toBe('151-..234');
		expect(keepDiallable('0151 <script>')).toBe('0151 ');
	});

	it('keeps the separators people write numbers with', () => {
		expect(keepDiallable('+49 (0)151 234-56.78')).toBe('+49 (0)151 234-56.78');
	});

	// Only at the front, where it announces a country code. Anywhere else it is noise that
	// would send `enterPhone` down its pasted-number branch on a number nobody pasted.
	it('allows a plus only where it means something', () => {
		expect(keepDiallable('+49151')).toBe('+49151');
		expect(keepDiallable('49+151')).toBe('49151');
	});

	it('leaves an empty box empty', () => {
		expect(keepDiallable('')).toBe('');
	});
});

describe('typing a number', () => {
	// The trunk prefix is the library's to handle: Germany drops the leading zero, Italy keeps
	// it, and both have to compose to the number that can actually be dialled.
	it('composes the chosen country with what was typed', () => {
		expect(enterPhone('0151 12345678', 'DE').value).toBe('+4915112345678');
		expect(enterPhone('151 12345678', 'DE').value).toBe('+4915112345678');
		expect(enterPhone('0664 1234567', 'AT').value).toBe('+436641234567');
		expect(enterPhone('06 1234567', 'IT').value).toBe('+39061234567');
	});

	it('leaves the box exactly as it was typed', () => {
		expect(enterPhone('0151 12345678', 'DE').national).toBe('0151 12345678');
	});

	it('stores nothing at all until a digit is typed', () => {
		expect(enterPhone('', 'DE').value).toBe('');
		expect(enterPhone('   ', 'DE').value).toBe('');
		expect(enterPhone('+', 'DE').value).toBe('');
	});

	// Otherwise a pasted "+49 151 ..." under a selector already reading +49 would compose
	// "+4949151...", which is the bug this branch exists to prevent.
	it('takes the country from a number that carries its own', () => {
		const pasted = enterPhone('+43 664 1234567', 'DE');

		expect(pasted.country).toBe('AT');
		expect(pasted.value).toBe('+436641234567');
	});

	it('keeps a half-typed number invalid rather than guessing at it', () => {
		expect(enterPhone('1', 'DE').value).toBe('+491');
		expect(enterPhone('+4', 'DE').value).toBe('+494');
	});
});

describe('picking a country', () => {
	it('recomposes what was already typed', () => {
		expect(chooseCountry('664 1234567', 'AT').value).toBe('+436641234567');
	});

	// The mirror of the paste rule above: there the typed prefix wins, here the picked country
	// does, or the list would appear not to work at all under a number carrying its own code.
	it('overrides a prefix the number carries', () => {
		const picked = chooseCountry('+43 664 1234567', 'DE');

		expect(picked.country).toBe('DE');
		expect(picked.national).toBe('0664 1234567');
	});

	it('keeps an empty box empty', () => {
		expect(chooseCountry('', 'CH')).toEqual({ country: 'CH', national: '', value: '' });
	});
});

describe('reading a stored number back', () => {
	it('recovers the country and draws the national part', () => {
		expect(readPhone('+4915112345678')).toEqual({
			country: 'DE',
			national: '01511 2345678',
			value: '+4915112345678'
		});
		expect(readPhone('+436641234567').country).toBe('AT');
	});

	// +1 and +7 are shared, and the metadata resolves them by the number itself rather than by
	// the code, so the selector lands on the country the visitor actually chose.
	it('tells the countries on a shared calling code apart', () => {
		expect(readPhone('+12133734253').country).toBe('US');
		expect(readPhone('+16046812181').country).toBe('CA');
	});

	it('starts on the default country when there is nothing to read', () => {
		expect(readPhone('')).toEqual({ country: DEFAULT_COUNTRY, national: '', value: '' });
	});

	// The 30-day session can hand back a number somebody was still typing when they left.
	it('hands a half-finished number back untouched', () => {
		expect(readPhone('+491')).toEqual({ country: DEFAULT_COUNTRY, national: '+491', value: '+491' });
	});

	it('round trips what typing produced', () => {
		const typed = enterPhone('0151 12345678', 'DE');
		const read = readPhone(typed.value);

		expect(read.value).toBe(typed.value);
		expect(read.country).toBe('DE');
	});
});
