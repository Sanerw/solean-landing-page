import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSession, loadSession, saveSession } from './persistence';
import { emptyAnswers } from './types';

/**
 * The store this module writes to is the browser's, and the environment is node, so the tests
 * bring their own. Deliberately a real object rather than a mock of `getItem`: what is under
 * test is what survives a round trip through a string, which a mock returning objects would
 * skip past entirely.
 */
function fakeStorage(): Storage & { readonly size: number } {
	const map = new Map<string, string>();

	return {
		get size() {
			return map.size;
		},
		get length() {
			return map.size;
		},
		getItem: (key) => map.get(key) ?? null,
		setItem: (key, value) => void map.set(key, String(value)),
		removeItem: (key) => void map.delete(key),
		clear: () => map.clear(),
		key: (index) => [...map.keys()][index] ?? null
	};
}

let storage: ReturnType<typeof fakeStorage>;

beforeEach(() => {
	storage = fakeStorage();
	vi.stubGlobal('window', { localStorage: storage });
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.useRealTimers();
});

const KEY = 'solean.questionnaire.session';

/** Most of these care about the answers alone; the uid has its own describe block. */
const loaded = () => loadSession()?.answers ?? null;

describe('a round trip', () => {
	it('gives back every answer that was saved', () => {
		const answers = {
			...emptyAnswers(),
			gender: 'female' as const,
			heightCm: '178',
			diseases: ['Kidney disease'],
			disclaimer: true
		};

		saveSession({ answers, anamnesisUid: null });

		expect(loaded()).toEqual(answers);
	});

	it('has nothing to give back before anything is saved', () => {
		expect(loaded()).toBeNull();
	});

	it('erases what was saved', () => {
		saveSession({ answers: emptyAnswers(), anamnesisUid: null });
		clearSession();

		expect(loaded()).toBeNull();
		expect(storage.size).toBe(0);
	});
});

describe('what may not come back', () => {
	// Local storage has no expiry of its own, so this is the only thing that ends an
	// abandoned questionnaire. Read-time rather than write-time: nothing runs in between.
	it('forgets a questionnaire older than thirty days, and removes it', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
		saveSession({ answers: { ...emptyAnswers(), heightCm: '178' }, anamnesisUid: null });

		vi.setSystemTime(new Date('2026-01-31T00:00:01Z'));

		expect(loaded()).toBeNull();
		expect(storage.size).toBe(0);
	});

	it('keeps one that is a day short of it', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
		saveSession({ answers: { ...emptyAnswers(), heightCm: '178' }, anamnesisUid: null });

		vi.setSystemTime(new Date('2026-01-30T00:00:00Z'));

		expect(loaded()?.heightCm).toBe('178');
	});

	it('treats an unreadable document as nothing saved', () => {
		storage.setItem(KEY, 'not json');

		expect(loaded()).toBeNull();
		expect(storage.size).toBe(0);
	});
});

/**
 * The stored document is input, not state: it can predate a question, outlive one, or have
 * been edited by hand. Every one of these would otherwise reach the mapper and become a
 * payload RxScale refuses.
 */
describe('reconciling a document this version did not write', () => {
	function stored(answers: Record<string, unknown>): void {
		storage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), answers }));
	}

	it('fills in a question that did not exist when it was saved', () => {
		stored({ heightCm: '178' });

		const restored = loaded();

		expect(restored?.heightCm).toBe('178');
		expect(restored?.weightKg).toBe('');
		expect(restored?.diseases).toEqual([]);
	});

	it('drops a key the definition no longer has', () => {
		stored({ heightCm: '178', retiredQuestion: 'whatever' });

		expect(loaded()).not.toHaveProperty('retiredQuestion');
	});

	it('refuses a value of the wrong shape and keeps the empty one', () => {
		stored({ diseases: 'Kidney disease', heightCm: 42, disclaimer: 'yes' });

		const restored = loaded();

		expect(restored?.diseases).toEqual([]);
		expect(restored?.heightCm).toBe('');
		expect(restored?.disclaimer).toBe(false);
	});

	it('refuses an array carrying anything but strings', () => {
		stored({ diseases: ['Kidney disease', 7] });

		expect(loaded()?.diseases).toEqual([]);
	});

	// The empty value carries the shape but not always the type: a choice is empty at `null`
	// and answered with a string, so a rule comparing against the empty value's own type
	// would refuse every answer anybody actually gave.
	it('accepts a choice answered as a string although its empty value is null', () => {
		stored({ gender: 'female', dateOfBirth: '1991-09-27' });

		const restored = loaded();

		expect(restored?.gender).toBe('female');
		expect(restored?.dateOfBirth).toBe('1991-09-27');
	});

	it('still refuses a choice stored as something that is not a string', () => {
		stored({ gender: 7 });

		expect(loaded()?.gender).toBeNull();
	});

	// `null` is a real answer for a choice and `false` a real one for a consent, so neither
	// may be treated as absent.
	it('keeps an unanswered choice unanswered rather than guessing', () => {
		stored({ gender: null, disclaimer: false });

		const restored = loaded();

		expect(restored?.gender).toBeNull();
		expect(restored?.disclaimer).toBe(false);
	});
});

describe('the anamnesis uid', () => {
	// The guard against a second submission: `resolveStepEntry` refuses to reopen the
	// questions once a uid exists, and the answers now outlive a reload.
	it('comes back with the answers', () => {
		saveSession({ answers: emptyAnswers(), anamnesisUid: 'anam-123' });

		expect(loadSession()?.anamnesisUid).toBe('anam-123');
	});

	it('is null on a session that has not been submitted', () => {
		saveSession({ answers: emptyAnswers(), anamnesisUid: null });

		expect(loadSession()?.anamnesisUid).toBeNull();
	});

	it('refuses a stored uid that is not a string', () => {
		storage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), answers: {}, anamnesisUid: 7 }));

		expect(loadSession()?.anamnesisUid).toBeNull();
	});
});

describe('a browser that refuses to store', () => {
	it('reads as nothing saved rather than throwing', () => {
		vi.stubGlobal('window', {
			get localStorage(): Storage {
				throw new Error('The operation is insecure.');
			}
		});

		expect(() => saveSession({ answers: emptyAnswers(), anamnesisUid: null })).not.toThrow();
		expect(loaded()).toBeNull();
		expect(() => clearSession()).not.toThrow();
	});

	// A full store is not a reason to interrupt somebody answering questions about their
	// health: they lose the convenience, not the questionnaire.
	it('swallows a quota failure on write', () => {
		vi.stubGlobal('window', {
			localStorage: {
				...fakeStorage(),
				setItem: () => {
					throw new Error('QuotaExceededError');
				}
			}
		});

		expect(() => saveSession({ answers: emptyAnswers(), anamnesisUid: null })).not.toThrow();
	});
});
