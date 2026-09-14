import {
	getCountries,
	getCountryCallingCode,
	parsePhoneNumberFromString,
	type CountryCode
} from 'libphonenumber-js/max';

/**
 * The country half of a telephone number, and the two shapes the number takes: what the box
 * holds and what is stored.
 *
 * **`max` metadata rather than `min`.** It costs about 70 kB of JSON and buys the only thing
 * worth having here: `min` validates by length alone and accepts `+49123456`, which the German
 * plan cannot issue. Not `mobile` either, which knows only mobile ranges and would refuse
 * somebody whose only number is a landline.
 */

export const DEFAULT_COUNTRY: CountryCode = 'DE';

/** Drawn above the rest, in this order, because that is where the service ships. */
const PINNED: readonly CountryCode[] = ['DE', 'AT', 'CH'];

export interface PhoneCountry {
	readonly code: CountryCode;
	/** Without the plus, which the trigger and the list draw for themselves. */
	readonly callingCode: string;
	readonly name: string;
	readonly flagSrc: string;
	readonly pinned: boolean;
}

/**
 * The flag as a file this app serves, not as an emoji.
 *
 * The regional indicator pair this used to return is drawn by the platform, and Windows ships
 * no flag glyphs at all, so a Windows visitor saw the letters `DE` where everyone else saw a
 * picture. These are the 245 circular SVGs from `circle-flags`, MIT, copied into `static/flags`
 * and committed: 157 kB for the whole world, the largest file 3 kB. The package itself is not a
 * dependency, because nothing here needs it at runtime.
 *
 * Each one is loaded lazily by the browser, so opening the list fetches the rows on screen
 * rather than all 245 at once.
 */
export function flagSrc(code: string): string {
	return `/flags/${code.toLowerCase()}.svg`;
}

/**
 * Every country libphonenumber knows: the three we ship to first, then the rest by name in the
 * reader's own language.
 *
 * `Intl.DisplayNames` is what names them, so 245 countries are not a table this repository has
 * to carry in two languages and keep in step.
 */
export function countryList(locale: string): readonly PhoneCountry[] {
	const names = new Intl.DisplayNames([locale], { type: 'region' });
	const collator = new Intl.Collator(locale);

	const countries = getCountries().map((code) => ({
		code,
		callingCode: getCountryCallingCode(code),
		name: names.of(code) ?? code,
		flagSrc: flagSrc(code),
		pinned: PINNED.includes(code)
	}));

	const pinned = PINNED.map((code) => countries.find((country) => country.code === code)).filter(
		(country) => country !== undefined
	);
	const rest = countries
		.filter((country) => !country.pinned)
		.sort((one, other) => collator.compare(one.name, other.name));

	return [...pinned, ...rest];
}

/**
 * How well one country answers what somebody typed, as the list's filter reads it: 0 hides the
 * row, and a larger number sorts it higher.
 *
 * **Substring, not fuzzy.** The default filter scores a subsequence, so "pol" matches Portugal
 * (p-o-...-l) and "zzzz" matched two countries outright. On a list of 245 that is noise where
 * the whole point is to narrow.
 *
 * Diacritics are folded on both sides, because this list is read in German: somebody typing
 * "Osterreich" or "Turkei" on a keyboard without umlauts is not making a mistake.
 */
export function matchCountry(country: PhoneCountry, search: string): number {
	const needle = fold(search);
	if (!needle) return 1;

	const name = fold(country.name);
	if (name.startsWith(needle)) return 3;
	if (name.includes(needle)) return 2;

	// The code somebody knows when they do not know the name: "48", "+48", "PL".
	const codes = [country.callingCode, `+${country.callingCode}`, country.code];

	return codes.some((code) => fold(code).startsWith(needle)) ? 1 : 0;
}

/**
 * The list as the search leaves it: only the countries that match, best first.
 *
 * The ordering is ours because the list component does not reorder what it is given, so a
 * search for "pol" drew Französisch-Polynesien above Polen and Enter picked the wrong country.
 * Sorting is stable, so countries on equal footing stay in the alphabetical order they came in.
 */
export function searchCountries(
	countries: readonly PhoneCountry[],
	search: string
): readonly PhoneCountry[] {
	if (!search.trim()) return countries;

	return countries
		.map((country) => ({ country, score: matchCountry(country, search) }))
		.filter((entry) => entry.score > 0)
		.sort((one, other) => other.score - one.score)
		.map((entry) => entry.country);
}

function fold(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '');
}

export interface PhoneEntry {
	readonly country: CountryCode;
	/** What the text box holds: the national part, as the visitor typed it. */
	readonly national: string;
	/** What `answers.phone` holds: E.164, or empty when nothing was typed. */
	readonly value: string;
}

/**
 * Everything a telephone number can be written with, and nothing else.
 *
 * Applied as the visitor types rather than only when they press Continue: a letter is never
 * part of a number, so refusing it a screen later is late news. What survives is digits and
 * the separators a printed number uses, plus a leading plus, which is the one character that
 * carries meaning here because it announces a country code.
 */
export function keepDiallable(text: string): string {
	return text.replace(/[^\d\s()./+-]/g, '').replace(/(?!^)\+/g, '');
}

/** The shared half: what a text plus a country compose to, with no prefix in the text. */
function compose(text: string, country: CountryCode): PhoneEntry {
	const trimmed = text.trim();

	if (!/\d/.test(trimmed)) return { country, national: text, value: '' };

	// The library owns the trunk prefix, which is not a leading zero everywhere: Germany drops
	// it and Italy keeps it. Stripping one by hand would be wrong in one direction or the other.
	const parsed = parsePhoneNumberFromString(trimmed, country);

	return {
		country,
		national: text,
		// The fallback is a half-typed number on its way to being complete. It is deliberately
		// not a valid number, so the rule refuses it until the rest arrives.
		value: parsed?.number ?? `+${getCountryCallingCode(country)}${trimmed.replace(/\D/g, '')}`
	};
}

/**
 * What one keystroke leaves behind: the country, the text, and the number to store.
 *
 * **The typed text is handed back untouched.** Reformatting a number between keystrokes moves
 * the caret to the end of the box, so only the stored value is normalized. `readPhone` does the
 * formatting instead, on mount, where there is no caret to disturb.
 */
export function enterPhone(text: string, country: CountryCode): PhoneEntry {
	const trimmed = text.trim();

	// A number that carries its own country code has answered the question the selector asks,
	// so it moves the selector instead of being appended to it: without this, pasting
	// "+49 151 ..." while Germany is chosen would compose "+4949151...".
	if (/\d/.test(trimmed) && trimmed.startsWith('+')) {
		const pasted = parsePhoneNumberFromString(trimmed);
		const pastedCountry = pasted?.country ?? pasted?.getPossibleCountries()[0];

		if (pasted && pastedCountry) {
			return { country: pastedCountry, national: text, value: pasted.number };
		}
	}

	return compose(text, country);
}

/**
 * The visitor picking a country from the list.
 *
 * **The selector wins here**, where a typed prefix wins in `enterPhone`. A number already
 * carrying "+43" is reduced to its national part first, or picking Germany under it would
 * appear to do nothing: the prefix in the box would compose Austria straight back.
 */
export function chooseCountry(text: string, country: CountryCode): PhoneEntry {
	const trimmed = text.trim();

	if (!trimmed.startsWith('+')) return compose(text, country);

	// Unparseable and prefixed is a number somebody is still typing. Dropping the plus leaves
	// the digits under the chosen country, which is the reading that keeps the most of what
	// they typed.
	const national = parsePhoneNumberFromString(trimmed)?.formatNational() ?? trimmed.slice(1);

	return compose(national, country);
}

/** A stored number back into the control that has to draw it, on mount or after a reload. */
export function readPhone(stored: string): PhoneEntry {
	const trimmed = stored.trim();
	const parsed = trimmed ? parsePhoneNumberFromString(trimmed) : undefined;
	const country = parsed?.country ?? parsed?.getPossibleCountries()[0];

	// Anything that does not parse is somebody's half-finished number coming back from the
	// 30-day session. It returns to the box exactly as it was left, so they can finish it
	// rather than find it gone.
	if (!parsed || !country) return { country: DEFAULT_COUNTRY, national: stored, value: stored };

	return { country, national: parsed.formatNational(), value: parsed.number };
}
