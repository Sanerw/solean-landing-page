import { getLocale } from '$lib/paraglide/runtime';

/**
 * The article carries dates a reader is meant to act on, so they follow the reading language:
 * `28 Aug 2026` in English and `28. Aug. 2026` in German. A formatter per locale, built once
 * and reused, because `Intl.DateTimeFormat` is expensive to construct.
 */
const FORMATTERS: Record<string, Intl.DateTimeFormat> = {
	en: new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' }),
	de: new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeZone: 'UTC' })
};

/** `value` is a plain `YYYY-MM-DD`, read as UTC so the printed day never shifts by timezone. */
export function formatArticleDate(value: string, locale: string = getLocale()): string {
	const formatter = FORMATTERS[locale] ?? FORMATTERS.en;

	return formatter.format(new Date(`${value}T00:00:00Z`));
}
