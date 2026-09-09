import { localePath, type PageIdentity } from './pages';
import { absoluteUrl } from './links';

/**
 * XML has five predefined entities and a document that omits one is not well formed. Applied to
 * every emitted value rather than to the ones that look risky: a slug is an editor's string,
 * and the day one contains an ampersand must not be the day the sitemap stops parsing.
 */
export function escapeXml(value: string): string {
	return value.replace(/[&<>"']/g, (character) => {
		switch (character) {
			case '&':
				return '&amp;';
			case '<':
				return '&lt;';
			case '>':
				return '&gt;';
			case '"':
				return '&quot;';
			default:
				return '&apos;';
		}
	});
}

/**
 * `lastmod` takes W3C Datetime, and Sanity writes RFC 3339, so the stamp is emitted as the date
 * alone. A page is not republished more precisely than that as far as a crawler is concerned,
 * and a stamp that cannot be parsed is dropped rather than guessed at.
 */
function lastModified(value: string | undefined): string | null {
	if (!value) return null;
	const parsed = Date.parse(value);
	if (Number.isNaN(parsed)) return null;

	return new Date(parsed).toISOString().slice(0, 10);
}

/**
 * The sitemap for one origin.
 *
 * Every entry is a page the inventory says exists, addressed by the same canonical the page
 * itself renders, so the two cannot disagree. Each URL carries the alternates of its own page,
 * which is what `xhtml:link` is for: a set that omits the page it sits on is discarded, so the
 * equivalents include the page's own language.
 *
 * No `changefreq` and no `priority`. Both are hints crawlers stopped reading, and inventing
 * them here would be stating something this project does not know.
 */
export function toSitemapXml(origin: string, identities: readonly PageIdentity[]): string {
	const entries = [...identities]
		.map((identity) => ({
			identity,
			loc: absoluteUrl(origin, localePath(identity.path, identity.language))
		}))
		// Sorted by the URL so a redeploy that changed nothing produces the same document.
		.sort((a, b) => (a.loc < b.loc ? -1 : a.loc > b.loc ? 1 : 0));

	const urls = entries.map(({ identity, loc }) => {
		const modified = lastModified(identity.modifiedAt);
		const alternates =
			identity.equivalents.length > 1
				? identity.equivalents.map(
						({ locale, path }) =>
							`\n\t\t<xhtml:link rel="alternate" hreflang="${escapeXml(locale)}" href="${escapeXml(
								absoluteUrl(origin, localePath(path, locale))
							)}" />`
					)
				: [];

		return [
			'\t<url>',
			`\n\t\t<loc>${escapeXml(loc)}</loc>`,
			modified ? `\n\t\t<lastmod>${escapeXml(modified)}</lastmod>` : '',
			...alternates,
			'\n\t</url>'
		].join('');
	});

	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
		...urls,
		'</urlset>',
		''
	].join('\n');
}

/**
 * What `robots.txt` says.
 *
 * Two states, and the difference is what is advertised rather than what is allowed. Crawling
 * stays open in both, deliberately: the pre-launch site is kept out of an index by
 * `X-Robots-Tag: noindex`, which a crawler can only obey if it is allowed to fetch the page and
 * read the header. A blanket `Disallow` would hide the very instruction it was meant to enforce,
 * and would leave an already-indexed URL in the index with no way to remove it.
 *
 * Robots is not access control either way: it asks, and the internal routes it names are kept
 * out of the index by the response header, not by this file.
 */
export function toRobotsTxt(sitemapUrl: string | null): string {
	const lines = ['User-agent: *', 'Disallow: /api/', 'Disallow: /dev/', 'Disallow: /preview/'];

	if (sitemapUrl) {
		lines.push('', `Sitemap: ${sitemapUrl}`);
	}

	return `${lines.join('\n')}\n`;
}
