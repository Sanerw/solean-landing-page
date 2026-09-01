import { describe, expect, it } from 'vitest';
import { shouldReveal } from './reveal';

/** Only the two capabilities the decision reads, so a case states exactly what it changes. */
function windowWith(options: {
	observer?: boolean;
	reducedMotion?: boolean;
	matchMedia?: boolean;
}) {
	const { observer = true, reducedMotion = false, matchMedia = true } = options;

	return {
		IntersectionObserver: observer ? class {} : undefined,
		matchMedia: matchMedia ? () => ({ matches: reducedMotion }) : undefined
	};
}

describe('shouldReveal', () => {
	it('hides nothing when the browser has no IntersectionObserver', () => {
		// Nothing would ever bring the content back, so it must never leave.
		expect(shouldReveal(windowWith({ observer: false }))).toBe(false);
	});

	it('hides nothing when the visitor asked for reduced motion', () => {
		expect(shouldReveal(windowWith({ reducedMotion: true }))).toBe(false);
	});

	it('hides nothing when the preference cannot be read at all', () => {
		expect(shouldReveal(windowWith({ matchMedia: false }))).toBe(false);
	});

	it('reveals when the browser can observe and no preference forbids it', () => {
		expect(shouldReveal(windowWith({}))).toBe(true);
	});
});
