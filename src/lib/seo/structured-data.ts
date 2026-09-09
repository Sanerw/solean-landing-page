import { plain } from '$lib/sanity/plain';
import { absoluteUrl } from './links';
import { SITE_NAME, type PageSeo } from './metadata';
import { localePath } from './pages';

/**
 * The support details the footer prints on every marketing page, as a machine-readable point of
 * contact. They are literals here for the same reason they are literals in the footer: they are
 * the company's real address and number, not content anybody edits.
 */
const SUPPORT = { email: 'support@solean.com', telephone: '+49 40 87709420' } as const;

/**
 * One step of a visible breadcrumb.
 *
 * The path is de-localised, as every path in `$lib/seo` is: it is localised and made absolute
 * here, so a caller cannot emit a German URL on an English page.
 *
 * It is optional, and its absence is meaningful: the treatment page draws "Treatments" as text
 * rather than a link, because that index is undrawn and would answer 404. Markup that gave it a
 * URL anyway would send a crawler exactly where the page refuses to send a reader.
 */
export interface Crumb {
	name: string;
	path?: string;
}

export interface ArticleFacts {
	/** The article's own headline, without the site suffix the `<title>` carries. */
	headline: string;
	description: string;
	/** ISO 8601. Omitted rather than guessed when the document carries none. */
	published?: string;
	modified?: string;
	reviewer?: string;
}

export interface StructuredDataInput {
	seo: PageSeo;
	origin: string;
	article?: ArticleFacts;
	breadcrumb?: Crumb[];
}

type Node = Record<string, unknown>;

function organizationId(origin: string): string {
	return `${origin}/#organization`;
}

function organization(origin: string): Node {
	return {
		'@type': 'Organization',
		'@id': organizationId(origin),
		name: SITE_NAME,
		url: `${origin}/`,
		contactPoint: {
			'@type': 'ContactPoint',
			contactType: 'customer support',
			email: SUPPORT.email,
			telephone: SUPPORT.telephone
		}
	};
}

/** Only what the document actually carries. A missing date is left out, never defaulted. */
function articleNode(input: StructuredDataInput, facts: ArticleFacts): Node {
	const { seo, origin } = input;
	const canonical = seo.sharing!.canonical;

	return {
		'@type': 'Article',
		'@id': `${canonical}#article`,
		mainEntityOfPage: canonical,
		headline: plain(facts.headline),
		description: plain(facts.description),
		inLanguage: seo.locale,
		publisher: { '@id': organizationId(origin) },
		...(seo.sharing?.image ? { image: [seo.sharing.image.url] } : {}),
		...(facts.published ? { datePublished: facts.published } : {}),
		...(facts.modified ? { dateModified: facts.modified } : {}),
		...(facts.reviewer
			? { reviewedBy: { '@type': 'Person', name: plain(facts.reviewer) } }
			: {})
	};
}

function breadcrumbNode(input: StructuredDataInput, crumbs: Crumb[]): Node {
	const { origin, seo } = input;

	return {
		'@type': 'BreadcrumbList',
		'@id': `${seo.sharing!.canonical}#breadcrumb`,
		itemListElement: crumbs.map((crumb, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: plain(crumb.name),
			// Absent where the page itself offers no link. See `Crumb`.
			...(crumb.path
				? { item: absoluteUrl(origin, localePath(crumb.path, seo.locale)) }
				: {})
		}))
	};
}

/**
 * The page's structured data, as one `@graph`.
 *
 * One graph rather than several script elements, so the Article can name its publisher by
 * `@id` instead of restating the Organization, and so a reader counts one block.
 *
 * `null` without a configured origin, exactly as the canonical and the sharing tags are absent:
 * every `@id` and every URL in here is absolute, and there is nothing truthful to build them
 * from.
 */
export function structuredData(input: StructuredDataInput): Node | null {
	if (!input.seo.sharing) return null;

	const nodes: Node[] = [organization(input.origin)];

	if (input.article) {
		nodes.push(articleNode(input, input.article));
	}
	if (input.breadcrumb?.length) {
		nodes.push(breadcrumbNode(input, input.breadcrumb));
	}

	return { '@context': 'https://schema.org', '@graph': nodes };
}

/**
 * The graph as text that is safe to place inside a `<script>` element.
 *
 * This is a security control, not formatting. An editor who types `</script>` into a summary
 * would otherwise close the element and have the rest of the document parsed as markup, which
 * is script injection through the CMS. Escaping `<` alone is enough to prevent it; `>` and `&`
 * go too so no reader has to reason about which one mattered, and the two Unicode line
 * terminators go because they are legal in JSON strings and illegal in JavaScript source.
 *
 * The escapes stay valid JSON, so a consumer parses exactly what was serialised.
 */
export function toJsonLd(graph: Node | null): string | null {
	if (!graph) return null;

	return JSON.stringify(graph)
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e')
		.replace(/&/g, '\\u0026')
		.replace(/\u2028/g, '\\u2028')
		.replace(/\u2029/g, '\\u2029');
}
