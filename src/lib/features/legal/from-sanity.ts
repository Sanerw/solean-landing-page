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

/**
 * The four documents' own titles and descriptions, in both languages.
 *
 * They are literals rather than message keys because that is what they have always been: each
 * page carried its own pair inline. They move here so the server load can hand one value to the
 * visible `<title>` and to `og:title` at once, which is the only way the two cannot drift.
 *
 * The German wording is the document's own name, so an English reader gets an English label on
 * a German text. That is deliberate and unchanged: the policies are the German legal texts.
 */
export const LEGAL_METADATA = {
	'legal-notice': {
		de: { title: 'Impressum | Solean', description: 'Impressum von Solean.' },
		en: { title: 'Legal notice | Solean', description: 'Legal notice of Solean.' }
	},
	privacy: {
		de: { title: 'Datenschutzerklärung | Solean', description: 'Datenschutzerklärung von Solean.' },
		en: { title: 'Privacy policy | Solean', description: 'Privacy policy of Solean.' }
	},
	terms: {
		de: {
			title: 'AGB | Solean',
			description: 'Allgemeine Geschäftsbedingungen von Solean.'
		},
		en: {
			title: 'Terms and conditions | Solean',
			description: 'General terms and conditions of Solean.'
		}
	},
	returns: {
		de: {
			title: 'Widerrufsrecht | Solean',
			description: 'Widerrufsbelehrung und Muster-Widerrufsformular von Solean.'
		},
		en: {
			title: 'Right of withdrawal | Solean',
			description: 'Withdrawal instructions and model withdrawal form of Solean.'
		}
	}
} as const satisfies Record<
	(typeof LEGAL_SLUGS)[keyof typeof LEGAL_SLUGS],
	Record<'de' | 'en', { title: string; description: string }>
>;

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
