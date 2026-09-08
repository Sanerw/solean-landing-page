import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * The home page copy the fixture serves, read out of the fixture rather than retyped here.
 *
 * These specs measure layout, type scale and geometry. The words are Sanity's, and an editor
 * rewriting the hero headline is not a regression in this repository. Hardcoding the wording
 * meant every such edit arrived as a handful of red fidelity tests the next time
 * `scripts/generate-sanity-fixture.mjs` ran, which is exactly what happened in feature 26c
 * after the fixture had gone stale for several features.
 *
 * Reading it keeps each assertion about the thing it is actually checking: that the headline is
 * 48px and alone in the accessibility tree, not that it says any particular sentence.
 */
const fixture = JSON.parse(
	readFileSync(fileURLToPath(new URL('fixtures/sanity-articles.json', import.meta.url)), 'utf8')
) as {
	homePages: Record<string, HomeCopy>;
};

interface HomeCopy {
	hero: {
		primaryCta: string;
		secondaryCta: string;
		mobileHeadline: string;
		mobileEyebrow: string;
		headlineLead: string;
		headlineStruck: string;
		headlineTail: string;
		lead: string;
	};
	articleTeaser: { eyebrow: string; title: string; cta: string };
	resultsBand: { eyebrow: string; title: string; cta: string; reviewCta: string };
	howItWorks: { title: string };
	// The section's own `aria-label`, so a locator built on it follows the copy. A hardcoded one
	// stopped matching when an editor retitled the section, and every assertion scoped to it
	// then passed against nothing at all: the counts it compares are zero either way.
	projection: { title: string };
}

export function homeCopy(language: 'de' | 'en' = 'en'): HomeCopy {
	return fixture.homePages[language];
}

/** English, because the fidelity specs run against `/en`. */
export const HOME = homeCopy('en');
