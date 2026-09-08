import { describe, expect, it } from 'vitest';
import { rendererFor } from './block-registry';
import type { ArticleBlock } from './types';

/**
 * The registry cannot miss a kind: the record is exhaustive and the compiler enforces it, so
 * adding a block type without a component is a build error. What is worth asserting is the
 * other half, the case the type system cannot see: a `_type` the Content Lake holds and this
 * app has never heard of.
 */
const RENDERABLE: ArticleBlock[] = [
	{ kind: 'prose', paragraphs: [] },
	{ kind: 'callout', paragraphs: [] },
	{ kind: 'table', caption: '', columns: [], rows: [] },
	{ kind: 'cards', cards: [] },
	{ kind: 'checklist', items: [] },
	{ kind: 'accordion', items: [] },
	{ kind: 'sources', summary: '', sources: [] }
];

describe('rendererFor', () => {
	it('draws every kind the mapper can produce', () => {
		for (const block of RENDERABLE) {
			const found = rendererFor(block);
			expect(found.entry, block.kind).not.toBeNull();
			expect(found.reason).toBeNull();
		}
	});

	it('builds the props each component takes', () => {
		const found = rendererFor({
			kind: 'checklist',
			id: 'side-effects',
			heading: 'Side effects',
			intro: 'Most are mild.',
			items: ['nausea']
		});

		expect(found.entry?.props({ kind: 'checklist', id: 'side-effects', heading: 'Side effects', intro: 'Most are mild.', items: ['nausea'] })).toEqual({
			id: 'side-effects',
			heading: 'Side effects',
			intro: 'Most are mild.',
			items: ['nausea']
		});
	});

	it('answers a block it cannot draw with the reason rather than a component', () => {
		const found = rendererFor({
			kind: 'unsupported',
			type: 'articleVideo',
			reason: 'no renderer is mapped to "articleVideo"'
		});

		expect(found.entry).toBeNull();
		expect(found.reason).toContain('articleVideo');
	});
});
