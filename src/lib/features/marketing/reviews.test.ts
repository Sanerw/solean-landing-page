import { describe, expect, it } from 'vitest';
import { formatScore, parseRating } from './reviews';

describe('parseRating', () => {
	it('reads the shape the live endpoint returns', () => {
		expect(parseRating({ stats: { total_reviews: 104, average_rating: '4.86' } })).toEqual({
			score: 4.86,
			total: 104
		});
	});

	it.each([
		['no stats at all', {}],
		['stats that are not an object', { stats: 'none' }],
		['a body that is not an object', 'nope'],
		['null', null],
		['a non-numeric average', { stats: { total_reviews: 104, average_rating: 'excellent' } }],
		['an average above five', { stats: { total_reviews: 104, average_rating: '5.4' } }],
		['a negative average', { stats: { total_reviews: 104, average_rating: '-1' } }],
		['a fractional review count', { stats: { total_reviews: 10.5, average_rating: '4.86' } }],
		['a negative review count', { stats: { total_reviews: -1, average_rating: '4.86' } }]
	])('refuses %s', (_case, body) => {
		expect(parseRating(body)).toBeNull();
	});

	// A shop with no reviews yet is a real answer, not a broken one. The caller decides
	// whether a zero-count rating is worth showing; parsing must not swallow it.
	it('accepts a shop with no reviews yet', () => {
		expect(parseRating({ stats: { total_reviews: 0, average_rating: '0' } })).toEqual({
			score: 0,
			total: 0
		});
	});
});

describe('formatScore', () => {
	it('rounds to one decimal the way the platform displays it', () => {
		expect(formatScore(4.86)).toBe('4.9');
		expect(formatScore(5)).toBe('5.0');
		expect(formatScore(4.04)).toBe('4.0');
	});
});
