import { plain } from '$lib/sanity/plain';
import type { SanityLegalPage, SanityLegalSpan } from '$lib/sanity/queries';
import type { LegalBlock, LegalDocument, LegalLine } from './types';

/**
 * The four policy documents, keyed by the route that serves each one.
 *
 * These are ids in the Content Lake, not display strings: a document lives at
 * `legalPage-<slug>-<language>`, so a typo here is a 404 rather than a wrong word.
 */
export const LEGAL_SLUGS = {
	legalNotice: 'legal-notice',
	privacy: 'privacy',
	terms: 'terms',
	returns: 'returns'
} as const;

function line(source: { spans?: SanityLegalSpan[] } | undefined): LegalLine {
	return (source?.spans ?? []).map((span) => ({
		text: span.text,
		...(span.bold ? { bold: true } : {}),
		...(span.underline ? { underline: true } : {}),
		...(span.href ? { href: plain(span.href) } : {})
	}));
}

/**
 * Turns the document into the shape `LegalPage.svelte` already renders, unchanged since the
 * text lived in this repository. The two carry the same structure on purpose: an address block
 * separates its lines with `br` inside one paragraph, and flattening those into paragraphs
 * would space an Impressum apart like prose.
 *
 * `href` goes through `plain` because preview embeds invisible source markers in every string,
 * and a marker inside a URL is a broken link rather than an invisible one. The prose is left as
 * it arrives so click-to-edit keeps working on it.
 */
export function toLegalDocument(page: SanityLegalPage): LegalDocument {
	const blocks: LegalBlock[] = (page.blocks ?? []).map((block) =>
		block._type === 'legalList'
			? { kind: 'list', items: (block.items ?? []).map(line) }
			: { kind: 'paragraph', lines: (block.lines ?? []).map(line) }
	);

	return { title: page.title, blocks };
}
