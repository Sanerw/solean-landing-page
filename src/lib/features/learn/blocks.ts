import { plain } from '$lib/sanity/plain';
import type { SanityArticleBlock } from '$lib/sanity/queries';
import type { ArticleBlock, ArticleTocItem } from './types';

/**
 * The article body, from Sanity's blocks to ours.
 *
 * This replaces the eight named fields the page used to read. What it buys is that an article
 * can hold two tables, no table, or a table between two paragraphs, without a deploy.
 */

/** ß and the umlauts are spelled out rather than stripped, because that is how German writes them in a URL. */
const GERMAN: Record<string, string> = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };

/**
 * The anchor a heading scrolls to.
 *
 * `plain` first, and this is the whole reason it is here: preview fills every string with
 * invisible markers, so the heading is rendered with them and slugified without them. An anchor
 * built from the marked-up copy is a link that scrolls nowhere, and only in preview, which is
 * the worst place to find out.
 */
export function anchorFor(heading: string): string {
	return plain(heading)
		.toLowerCase()
		.replace(/[äöüß]/g, (char) => GERMAN[char])
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/** Blank to a reader, which is not the same as blank to `trim()` while preview is on. */
function filled(value: string | undefined): value is string {
	return plain(value ?? '').trim() !== '';
}

function texts(values: readonly unknown[] | undefined): string[] {
	return (values ?? []).filter((value): value is string => typeof value === 'string');
}

export function toBlocks(body: readonly SanityArticleBlock[] | undefined): ArticleBlock[] {
	const taken = new Set<string>();

	/**
	 * The heading, its anchor and its contents label. Two blocks may legitimately share a
	 * heading, so the second anchor is suffixed rather than refused: a duplicate `id` would be
	 * an accessibility violation and would send both contents links to the same place.
	 */
	const head = (raw: SanityArticleBlock) => {
		if (!filled(raw.heading)) return {};

		const base = anchorFor(raw.heading) || `block-${raw._key}`;
		let id = base;
		for (let n = 2; taken.has(id); n += 1) id = `${base}-${n}`;
		taken.add(id);

		return { id, heading: raw.heading, label: filled(raw.shortLabel) ? raw.shortLabel : raw.heading };
	};

	return (body ?? []).map((raw): ArticleBlock => {
		// Read as logic, so stripped first, per the rule in `project-overview.md`.
		switch (plain(raw._type)) {
			case 'articleProse':
				return { ...head(raw), kind: 'prose', paragraphs: texts(raw.paragraphs) };

			case 'articleCallout':
				return { ...head(raw), kind: 'callout', paragraphs: texts(raw.paragraphs) };

			case 'articleTable': {
				const columns = texts(raw.columns);
				return {
					...head(raw),
					kind: 'table',
					// The caption names the table for a screen reader; the visible heading is above it,
					// so repeating the heading is the right default rather than a placeholder.
					caption: filled(raw.caption) ? raw.caption : (raw.heading ?? ''),
					columns,
					// Squared off against the columns rather than trusted: the Studio enforces the
					// match, a draft mid-edit does not, and a preview that throws is worse than a
					// preview with a blank cell in it.
					rows: (raw.rows ?? []).map((row) => ({
						label: row.label,
						cells: columns.map((_, index) => texts(row.cells)[index] ?? '')
					}))
				};
			}

			case 'articleCards':
				return {
					...head(raw),
					kind: 'cards',
					cards: (raw.cards ?? []).map((card) => ({
						name: card.name,
						eyebrow: card.eyebrow,
						body: card.body
					}))
				};

			case 'articleChecklist':
				return {
					...head(raw),
					kind: 'checklist',
					...(filled(raw.intro) ? { intro: raw.intro } : {}),
					items: texts(raw.items)
				};

			case 'articleAccordion':
				return {
					...head(raw),
					kind: 'accordion',
					// `items` is the one field name a checklist and an accordion share, so the shape
					// separates them rather than the field name.
					items: (raw.items ?? [])
						.filter((item): item is { _key: string; question: string; answer: string } =>
							typeof item === 'object' && item !== null
						)
						.map((item) => ({ question: item.question, answer: item.answer }))
				};

			case 'articleSourceList':
				return {
					...head(raw),
					kind: 'sources',
					summary: raw.summary ?? '',
					sources: (raw.sources ?? []).map((source) => ({
						label: source.label,
						...(source.href ? { href: plain(source.href) } : {})
					}))
				};

			default:
				return {
					kind: 'unsupported',
					type: plain(raw._type),
					reason: `no renderer is mapped to "${plain(raw._type)}"`
				};
		}
	});
}

/**
 * The contents list, derived rather than stored, which is why the Studio has no `toc` field: it
 * is a view of which blocks opened a section. A body of two paragraphs has no contents list at
 * all, and that is a legitimate article rather than a defect.
 */
export function tocFrom(blocks: readonly ArticleBlock[]): ArticleTocItem[] {
	return blocks.flatMap((block) =>
		block.kind !== 'unsupported' && block.id && block.label
			? [{ id: block.id, label: block.label }]
			: []
	);
}
