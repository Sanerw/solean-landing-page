import { locales, type Locale } from '$lib/paraglide/runtime';
import { findTreatment } from '$lib/domain';
import { absoluteUrl } from './links';
import { localePath, pathFor, type PageKey } from './pages';

/**
 * What a Sanity webhook says happened. An identity, deliberately: never a URL.
 *
 * A URL taken from a payload is a URL an attacker or a mistyped GROQ projection chooses. These
 * fields are turned into a path by the same helpers the canonical and the sitemap use, so the
 * worst a wrong payload can produce is a valid URL on our own origin for a page that may not
 * exist, which IndexNow answers by crawling it once and finding a 404.
 */
export interface DocumentEvent {
	type?: unknown;
	id?: unknown;
	slug?: unknown;
	language?: unknown;
}

const LEGAL_SLUGS = new Set(['privacy', 'terms', 'returns', 'legal-notice']);

function isLocale(value: unknown): value is Locale {
	return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

function text(value: unknown): string | null {
	return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * Which pages a change to this document affects.
 *
 * Empty for anything without a public page of its own: a clinician, a testimonial, an unknown
 * type, a draft. Empty is the safe answer and the common one, and it is not an error.
 *
 * An article notifies the Journal as well as itself, because publishing one changes the index
 * that lists it. Nothing else has an index page: the treatments index is undrawn, and the
 * legal pages are linked only from the footer, which is on every page already.
 */
export function affectedPages(event: DocumentEvent): PageKey[] {
	const id = text(event.id);
	// Sanity prefixes an unpublished document, and a draft has no public URL at all. Checked
	// rather than trusted to the webhook's own filter, which is dashboard configuration.
	if (id?.startsWith('drafts.')) return [];

	const type = text(event.type);
	const language = event.language;
	if (!isLocale(language)) return [];

	const slug = text(event.slug);

	switch (type) {
		case 'homePage':
			return [{ kind: 'home' }];
		case 'article':
			return slug ? [{ kind: 'article', slug }, { kind: 'journal' }] : [];
		case 'treatment':
			// The slug is the catalogue id. A document naming a treatment this shop does not
			// sell has no page, exactly as the route's own mapper decides.
			return slug && findTreatment(slug) ? [{ kind: 'treatment', slug }] : [];
		case 'legalPage':
			return slug && LEGAL_SLUGS.has(slug) ? [{ kind: 'legal', slug }] : [];
		default:
			return [];
	}
}

/** The absolute URLs to notify, in the document's own language. */
export function urlsToNotify(origin: string, event: DocumentEvent): string[] {
	const language = event.language;
	if (!isLocale(language)) return [];

	return affectedPages(event).map((key) =>
		absoluteUrl(origin, localePath(pathFor(key), language))
	);
}
