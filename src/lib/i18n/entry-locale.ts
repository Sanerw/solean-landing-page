import { baseLocale, cookieName, deLocalizeUrl, isLocale, localizeUrl } from '$lib/paraglide/runtime';
import type { Locale } from '$lib/paraglide/runtime';

/**
 * Where a visitor arriving at an address that names no language should land.
 *
 * The whole decision is here rather than in Paraglide's strategy order, because that order
 * cannot express it. `defaultUrlPatternExtractLocale` ends in `toLocale(segment) || baseLocale`,
 * so an unprefixed path reports German rather than "no locale": whichever strategy leads
 * answers every request and leaves the rest unreachable. With `url` leading, the remembered
 * language was never read, which is the bug this fix came from. With anything leading instead,
 * an explicit `/en` address is bounced back to German, which is worse: it is every `hreflang`
 * alternate the site publishes, and every English link anybody shares.
 *
 * So the prefix is left to decide for itself, and only an address without one asks this
 * question. It is asked in the visitor's own order of explicitness.
 */
export function entryRedirect(
	url: URL,
	headers: { cookie: string | null; acceptLanguage: string | null }
): URL | null {
	// The address names a language. Nothing outranks that, including a language remembered from
	// a page the visitor has already left.
	if (deLocalizeUrl(url).pathname !== url.pathname) return null;

	const wanted = rememberedLocale(headers.cookie) ?? preferredLocale(headers.acceptLanguage);
	if (!wanted || wanted === baseLocale) return null;

	const localized = localizeUrl(url, { locale: wanted });
	// `/` localises to `/en/`, which SvelteKit then answers with a 308 to `/en`. Sending the
	// visitor to the address the site actually serves saves the second hop on the one entry
	// every visitor who is not German makes.
	if (localized.pathname !== '/' && localized.pathname.endsWith('/')) {
		localized.pathname = localized.pathname.slice(0, -1);
	}

	return localized.href === url.href ? null : localized;
}

/**
 * The language the visitor was last served, which `setLocale` writes: deliberately when the
 * switcher is used, and on first render otherwise. Either way it is the language they are
 * reading the site in, which is what a link without a prefix should not silently change.
 */
export function rememberedLocale(cookie: string | null): Locale | undefined {
	const value = cookie
		?.split(';')
		.map((part) => part.trim())
		.find((part) => part.startsWith(`${cookieName}=`))
		?.slice(cookieName.length + 1);

	return isLocale(value) ? value : undefined;
}

/**
 * The best of the languages the browser asks for that this site serves, in its own q-order. A
 * tag is matched on its base subtag as well as whole, so `en-GB` and `de-AT` both count.
 */
export function preferredLocale(acceptLanguage: string | null): Locale | undefined {
	if (!acceptLanguage) return undefined;

	return acceptLanguage
		.split(',')
		.map((entry) => {
			const [tag = '', ...parameters] = entry.trim().split(';');
			const quality = parameters
				.map((parameter) => parameter.trim())
				.find((parameter) => parameter.startsWith('q='))
				?.slice(2);

			return { tag: tag.trim().toLowerCase(), quality: Number(quality ?? 1) };
		})
		.filter(({ tag, quality }) => tag !== '' && Number.isFinite(quality) && quality > 0)
		.sort((a, b) => b.quality - a.quality)
		.map(({ tag }) => (isLocale(tag) ? tag : tag.split('-')[0]))
		.find(isLocale);
}
