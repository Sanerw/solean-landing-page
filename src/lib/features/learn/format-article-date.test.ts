import { describe, expect, it } from 'vitest';
import { formatArticleDate } from './format-article-date';

describe('formatArticleDate', () => {
	// German's medium style is all-numeric, English's is not. Asserted as ICU actually renders
	// them rather than as they were guessed: the point is that the two differ and that each
	// follows its own convention.
	it('follows the reading language', () => {
		expect(formatArticleDate('2026-08-28', 'en')).toBe('28 Aug 2026');
		expect(formatArticleDate('2026-08-28', 'de')).toBe('28.08.2026');
	});

	// A date read in the browser's own timezone would print the day before for anyone west of
	// UTC, which is the whole reason the parse pins the offset.
	it('never shifts the day by timezone', () => {
		expect(formatArticleDate('2026-01-01', 'en')).toBe('1 Jan 2026');
		expect(formatArticleDate('2026-12-31', 'de')).toBe('31.12.2026');
	});

	it('falls back to English for a locale it has no formatter for', () => {
		expect(formatArticleDate('2026-08-28', 'fr')).toBe('28 Aug 2026');
	});
});
