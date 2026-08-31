import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	clearRecommendationChoice,
	dropStaleKeys,
	loadRecommendationChoice,
	recommendationStorageKey,
	saveRecommendationChoice
} from './answer-storage';

vi.mock('$app/environment', () => ({ browser: true }));

/**
 * The stored choice is what the completion step reads to decide whether a plan was already
 * picked, so the cases here are the ones where being wrong shows someone the wrong screen or
 * carries a variant id into an order it does not belong to.
 */

/** Keys are own properties on the real thing, which is what `dropStaleKeys` enumerates. */
class FakeStorage {
	[key: string]: unknown;

	getItem(key: string): string | null {
		const value = this[key];

		return typeof value === 'string' ? value : null;
	}

	setItem(key: string, value: string): void {
		this[key] = value;
	}

	removeItem(key: string): void {
		delete this[key];
	}
}

function withStorage(): FakeStorage {
	const sessionStorage = new FakeStorage();
	vi.stubGlobal('window', { sessionStorage });

	return sessionStorage;
}

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('recommendationStorageKey', () => {
	it('carries the version, so a new model cannot resume an old choice', () => {
		expect(recommendationStorageKey('quest-1', '3')).toBe('solean:recommendation:quest-1@3');
		expect(recommendationStorageKey('quest-1', '4')).not.toBe(
			recommendationStorageKey('quest-1', '3')
		);
	});
});

describe('the stored recommendation choice', () => {
	it('survives a round trip', () => {
		withStorage();
		saveRecommendationChoice('key', '49703544684877');

		expect(loadRecommendationChoice('key')).toEqual({
			confirmed: true,
			variantId: '49703544684877'
		});
	});

	it('keeps a null variant, which is a confirmed choice of the fallback plan', () => {
		withStorage();
		saveRecommendationChoice('key', null);

		expect(loadRecommendationChoice('key')).toEqual({ confirmed: true, variantId: null });
	});

	it('reads nothing where nothing was written', () => {
		withStorage();

		expect(loadRecommendationChoice('key')).toBeNull();
	});

	it('refuses a value that is not a confirmed choice', () => {
		const storage = withStorage();

		for (const raw of [
			'not json',
			'"a string"',
			'null',
			'[]',
			'{}',
			JSON.stringify({ confirmed: false, variantId: '1' }),
			JSON.stringify({ variantId: '1' }),
			JSON.stringify({ confirmed: true, variantId: 49703544684877 })
		]) {
			storage.setItem('key', raw);
			expect(loadRecommendationChoice('key')).toBeNull();
		}
	});

	it('is forgotten on request, which is what returns the step to the choice', () => {
		withStorage();
		saveRecommendationChoice('key', '111');
		clearRecommendationChoice('key');

		expect(loadRecommendationChoice('key')).toBeNull();
	});

	it('is swept with the answers when it belongs to another version', () => {
		const storage = withStorage();
		const kept = recommendationStorageKey('quest-1', '4');
		storage.setItem(kept, JSON.stringify({ confirmed: true, variantId: '111' }));
		storage.setItem(
			recommendationStorageKey('quest-1', '3'),
			JSON.stringify({ confirmed: true, variantId: '222' })
		);
		storage.setItem('unrelated:key', 'kept, not ours');

		dropStaleKeys([kept]);

		expect(loadRecommendationChoice(kept)).toEqual({ confirmed: true, variantId: '111' });
		expect(loadRecommendationChoice(recommendationStorageKey('quest-1', '3'))).toBeNull();
		expect(storage.getItem('unrelated:key')).toBe('kept, not ours');
	});
});
