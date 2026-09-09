import { findTreatment } from '$lib/domain';
import { localizeHref, locales, type Locale } from '$lib/paraglide/runtime';

/**
 * The published pages this site can address, as the shape a lookup uses. A page is named by
 * what it is rather than by its URL, because the URL is derived twice: once for the page's own
 * language and once for every language it has been translated into.
 */
export type PageKey =
	| { kind: 'home' }
	| { kind: 'journal' }
	| { kind: 'article'; slug: string }
	| { kind: 'treatment'; slug: string }
	| { kind: 'legal'; slug: string };

/** The four policy routes, as their document slugs. A fifth slug is not a page. */
const LEGAL_ROUTE_SLUGS = new Set(['privacy', 'terms', 'returns', 'legal-notice']);

export function pageId(key: PageKey): string {
	return 'slug' in key ? `${key.kind}:${key.slug}` : key.kind;
}

/** The de-localised path. `localePath` puts the language back on. */
export function pathFor(key: PageKey): string {
	switch (key.kind) {
		case 'home':
			return '/';
		case 'journal':
			return '/learn';
		case 'article':
			return `/learn/blog/${key.slug}`;
		case 'treatment':
			return `/treatments/${key.slug}`;
		case 'legal':
			return `/${key.slug}`;
	}
}

/**
 * `localizeHref('/x', { locale: 'en' })` can answer `/en/x/`, and the server answers a trailing
 * slash with a 308. A canonical or an alternate naming a redirect makes a crawler follow one
 * before it can read the page, so the slash is dropped everywhere except the root itself.
 */
export function localePath(path: string, locale: Locale): string {
	const href = localizeHref(path, { locale });

	return href.length > 1 && href.endsWith('/') ? href.slice(0, -1) : href;
}

export interface PageEquivalent {
	locale: Locale;
	path: string;
}

/**
 * One published page: what it is, which language it actually renders, and the languages whose
 * equivalent has been verified to exist. The equivalents include the page itself, so an
 * hreflang set built from them is reciprocal by construction.
 */
export interface PageIdentity {
	id: string;
	language: Locale;
	path: string;
	equivalents: PageEquivalent[];
	/** Only when the source carries one. Never the time of the request. */
	modifiedAt?: string;
}

interface RawDocument {
	language?: string | null;
	_updatedAt?: string | null;
}

interface RawArticle extends RawDocument {
	slug?: string | null;
	/** From `translation.metadata`. A null slug is an unpublished or missing translation. */
	translations?: ({ locale?: string | null; slug?: string | null } | null)[] | null;
}

interface RawTreatment extends RawDocument {
	treatmentId?: string | null;
}

interface RawLegalPage extends RawDocument {
	slug?: string | null;
}

export interface RawInventory {
	home?: (RawDocument | null)[] | null;
	articles?: (RawArticle | null)[] | null;
	treatments?: (RawTreatment | null)[] | null;
	legal?: (RawLegalPage | null)[] | null;
}

function isLocale(value: unknown): value is Locale {
	return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

/** ISO 8601 only, and only what Sanity actually wrote. A malformed stamp is dropped. */
function modifiedAt(value: string | null | undefined): string | undefined {
	if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) return undefined;

	return value;
}

/** Locale order is the project's, not the order documents happen to arrive in. */
function inLocaleOrder(equivalents: PageEquivalent[]): PageEquivalent[] {
	return [...equivalents].sort(
		(a, b) => locales.indexOf(a.locale) - locales.indexOf(b.locale)
	);
}

function newest(a: string | undefined, b: string | undefined): string | undefined {
	if (!a) return b;
	if (!b) return a;

	return Date.parse(a) >= Date.parse(b) ? a : b;
}

/**
 * The published inventory, as one identity per page and language.
 *
 * Equivalence is never guessed. A document is an English page only because an English document
 * was published, and an article is another article's translation only because the Studio's
 * translation metadata says so and the document it names is published too. Two articles whose
 * slugs happen to match are not each other's translation.
 */
export function toPageIdentities(raw: RawInventory | null | undefined): PageIdentity[] {
	const identities: PageIdentity[] = [];

	const homeLanguages = (raw?.home ?? [])
		.filter((document): document is RawDocument => Boolean(document) && isLocale(document?.language));
	const homeEquivalents = inLocaleOrder(
		homeLanguages.map((document) => ({ locale: document.language as Locale, path: '/' }))
	);
	for (const document of homeLanguages) {
		identities.push({
			id: pageId({ kind: 'home' }),
			language: document.language as Locale,
			path: '/',
			equivalents: homeEquivalents,
			...maybeModified(document._updatedAt)
		});
	}

	const articles = new Map<string, RawArticle & { language: Locale; slug: string }>();
	for (const article of raw?.articles ?? []) {
		if (!article || !isLocale(article.language) || !article.slug) continue;
		articles.set(`${article.language}:${article.slug}`, {
			...article,
			language: article.language,
			slug: article.slug
		});
	}
	for (const article of articles.values()) {
		const equivalents = new Map<Locale, string>([[article.language, article.slug]]);
		for (const translation of article.translations ?? []) {
			if (!translation || !isLocale(translation.locale) || !translation.slug) continue;
			// The metadata may name a document that is not published, or not an article. Only a
			// page this inventory itself holds can be offered as the other language.
			if (!articles.has(`${translation.locale}:${translation.slug}`)) continue;
			equivalents.set(translation.locale, translation.slug);
		}

		identities.push({
			id: pageId({ kind: 'article', slug: article.slug }),
			language: article.language,
			path: pathFor({ kind: 'article', slug: article.slug }),
			equivalents: inLocaleOrder(
				[...equivalents].map(([locale, slug]) => ({
					locale,
					path: pathFor({ kind: 'article', slug })
				}))
			),
			...maybeModified(article._updatedAt)
		});
	}

	// The Journal is a route rather than a document: it renders its own header in either
	// language and says nothing when the library is empty. Its date is the newest article it
	// lists, so an index whose content has not changed does not claim it has.
	for (const locale of locales) {
		let latest: string | undefined;
		for (const article of articles.values()) {
			if (article.language === locale) latest = newest(latest, modifiedAt(article._updatedAt));
		}
		identities.push({
			id: pageId({ kind: 'journal' }),
			language: locale,
			path: pathFor({ kind: 'journal' }),
			equivalents: inLocaleOrder(
				locales.map((other) => ({ locale: other, path: pathFor({ kind: 'journal' }) }))
			),
			...(latest ? { modifiedAt: latest } : {})
		});
	}

	identities.push(
		...groupedBySlug(
			(raw?.treatments ?? []).map((document) =>
				document && document.treatmentId && findTreatment(document.treatmentId)
					? { ...document, slug: document.treatmentId }
					: null
			),
			'treatment'
		)
	);

	identities.push(
		...groupedBySlug(
			(raw?.legal ?? []).map((document) =>
				document && document.slug && LEGAL_ROUTE_SLUGS.has(document.slug)
					? { ...document, slug: document.slug }
					: null
			),
			'legal'
		)
	);

	return identities;
}

function maybeModified(value: string | null | undefined): { modifiedAt?: string } {
	const stamp = modifiedAt(value);

	return stamp ? { modifiedAt: stamp } : {};
}

/**
 * Treatments and policy documents share one rule: the same slug in another language is that
 * page's translation, because both sides are addressed by a fixed id the route already knows.
 * Articles cannot use it, which is why they are built above instead.
 */
function groupedBySlug(
	documents: ((RawDocument & { slug: string }) | null)[],
	kind: 'treatment' | 'legal'
): PageIdentity[] {
	const published = new Map<string, Map<Locale, string | undefined>>();
	for (const document of documents) {
		if (!document || !isLocale(document.language)) continue;
		const languages = published.get(document.slug) ?? new Map();
		languages.set(document.language, modifiedAt(document._updatedAt));
		published.set(document.slug, languages);
	}

	return [...published].flatMap(([slug, languages]) => {
		const path = pathFor({ kind, slug });
		const equivalents = inLocaleOrder([...languages.keys()].map((locale) => ({ locale, path })));

		return [...languages].map(([language, updatedAt]) => ({
			id: pageId({ kind, slug }),
			language,
			path,
			equivalents,
			...(updatedAt ? { modifiedAt: updatedAt } : {})
		}));
	});
}

export function findIdentity(
	identities: readonly PageIdentity[],
	key: PageKey,
	language: Locale
): PageIdentity | null {
	const id = pageId(key);

	return identities.find((page) => page.id === id && page.language === language) ?? null;
}
