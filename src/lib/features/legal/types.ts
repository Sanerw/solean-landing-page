/**
 * The legal documents are stored as data rather than markup, so nothing reaches the page
 * through `{@html}` and every string is addressable. Feature 19 needs each of them to carry
 * a locale, which markup in a component could not offer without rewriting the pages.
 */

export interface LegalSpan {
	text: string;
	bold?: boolean;
	underline?: boolean;
	/** Present when the source linked this run of text. Copied exactly, including the scheme. */
	href?: string;
}

/**
 * A run of spans on one visual line. The sources separate an address block's lines with `br`
 * inside a single paragraph, so flattening those into separate paragraphs would space them
 * apart like prose and stop the Impressum reading as an address.
 */
export type LegalLine = LegalSpan[];

export type LegalBlock =
	| { kind: 'paragraph'; lines: LegalLine[] }
	| { kind: 'list'; items: LegalLine[] };

export interface LegalDocument {
	/** The document's own German title, as the source page headed it. */
	title: string;
	/** The page it was copied from, so the next person knows what to diff against. */
	source: string;
	/** The date it was copied. The document's own "Stand" line, where it has one, is a block. */
	copied: string;
	blocks: LegalBlock[];
}
