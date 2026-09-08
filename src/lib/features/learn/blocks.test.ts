import { describe, expect, it } from 'vitest';
import { anchorFor, toBlocks, tocFrom } from './blocks';
import type { SanityArticleBlock } from '$lib/sanity/queries';

const block = (raw: Partial<SanityArticleBlock> & { _type: string }): SanityArticleBlock => ({
	_key: 'k1',
	...raw
});

describe('anchorFor', () => {
	it('slugifies a plain heading', () => {
		expect(anchorFor('Quick answer')).toBe('quick-answer');
	});

	it('spells the umlauts out the way German writes them in a URL', () => {
		expect(anchorFor('Häufige Fragen')).toBe('haeufige-fragen');
		expect(anchorFor('Größe und Gewicht')).toBe('groesse-und-gewicht');
	});

	it('drops punctuation rather than encoding it', () => {
		expect(anchorFor('Wer stellt Mounjaro und Wegovy her?')).toBe(
			'wer-stellt-mounjaro-und-wegovy-her'
		);
		expect(anchorFor('Mounjaro vs. Wegovy auf einen Blick')).toBe(
			'mounjaro-vs-wegovy-auf-einen-blick'
		);
	});

	it('answers nothing for a heading with nothing to slugify', () => {
		expect(anchorFor('---')).toBe('');
		expect(anchorFor('日本語')).toBe('');
	});

	// The bug this guards is invisible outside preview: a marked-up heading renders correctly
	// and anchors nowhere.
	it('ignores the invisible markers preview embeds', () => {
		expect(anchorFor('Quick​⁠ answer')).toBe('quick-answer');
	});
});

describe('toBlocks', () => {
	it('maps every block type to its kind', () => {
		const kinds = toBlocks([
			block({ _key: 'a', _type: 'articleProse', heading: 'A', paragraphs: ['one'] }),
			block({ _key: 'b', _type: 'articleCallout', heading: 'B', paragraphs: ['two'] }),
			block({ _key: 'c', _type: 'articleTable', heading: 'C', columns: ['x'], rows: [] }),
			block({ _key: 'd', _type: 'articleCards', heading: 'D', cards: [] }),
			block({ _key: 'e', _type: 'articleChecklist', heading: 'E', items: ['i'] }),
			block({ _key: 'f', _type: 'articleAccordion', heading: 'F', items: [] }),
			block({ _key: 'g', _type: 'articleSourceList', heading: 'G', summary: 's', sources: [] })
		]).map((mapped) => mapped.kind);

		expect(kinds).toEqual([
			'prose',
			'callout',
			'table',
			'cards',
			'checklist',
			'accordion',
			'sources'
		]);
	});

	it('reports a block it cannot draw rather than dropping it', () => {
		const [mapped] = toBlocks([block({ _type: 'articleVideo' })]);

		expect(mapped.kind).toBe('unsupported');
		expect(mapped).toMatchObject({ type: 'articleVideo' });
		expect(mapped.kind === 'unsupported' && mapped.reason).toContain('articleVideo');
	});

	it('resolves a type carrying preview markers', () => {
		expect(toBlocks([block({ _type: 'article​Prose', paragraphs: [] })])[0].kind).toBe(
			'prose'
		);
	});

	it('answers an absent body with no blocks', () => {
		expect(toBlocks(undefined)).toEqual([]);
	});

	it('gives a prose block with no heading no anchor and no label', () => {
		const [mapped] = toBlocks([block({ _type: 'articleProse', paragraphs: ['one'] })]);

		expect(mapped).toMatchObject({ kind: 'prose', paragraphs: ['one'] });
		expect(mapped).not.toHaveProperty('id');
		expect(mapped).not.toHaveProperty('label');
	});

	it('prefers the contents label over the heading, and falls back to it', () => {
		const [labelled, bare] = toBlocks([
			block({ _key: 'a', _type: 'articleProse', heading: 'Sources and medical review', shortLabel: 'Sources' }),
			block({ _key: 'b', _type: 'articleProse', heading: 'Quick answer', shortLabel: '  ' })
		]);

		expect(labelled).toMatchObject({ label: 'Sources', id: 'sources-and-medical-review' });
		expect(bare).toMatchObject({ label: 'Quick answer' });
	});

	it('gives two blocks with one heading two anchors', () => {
		const anchors = toBlocks([
			block({ _key: 'a', _type: 'articleProse', heading: 'Safety' }),
			block({ _key: 'b', _type: 'articleProse', heading: 'Safety' }),
			block({ _key: 'c', _type: 'articleProse', heading: 'Safety' })
		]).map((mapped) => (mapped.kind === 'prose' ? mapped.id : null));

		expect(anchors).toEqual(['safety', 'safety-2', 'safety-3']);
	});

	it('falls the anchor back to the key when the heading slugifies to nothing', () => {
		const [mapped] = toBlocks([block({ _key: 'xyz', _type: 'articleProse', heading: '***' })]);

		expect(mapped).toMatchObject({ id: 'block-xyz' });
	});

	it('squares every table row off against the columns', () => {
		const [mapped] = toBlocks([
			block({
				_type: 'articleTable',
				heading: 'Compare',
				columns: ['A', 'B', 'C'],
				rows: [
					{ _key: 'r1', label: 'short', cells: ['one'] },
					{ _key: 'r2', label: 'long', cells: ['one', 'two', 'three', 'four'] }
				]
			})
		]);

		expect(mapped.kind === 'table' && mapped.rows).toEqual([
			{ label: 'short', cells: ['one', '', ''] },
			{ label: 'long', cells: ['one', 'two', 'three'] }
		]);
	});

	it('captions a table with its heading when the editor wrote none', () => {
		const [mapped] = toBlocks([block({ _type: 'articleTable', heading: 'Compare', columns: [] })]);

		expect(mapped.kind === 'table' && mapped.caption).toBe('Compare');
	});

	it('keeps a checklist to its strings and an accordion to its questions', () => {
		const [checklist, accordion] = toBlocks([
			block({ _key: 'a', _type: 'articleChecklist', heading: 'A', items: ['one', 'two'] }),
			block({
				_key: 'b',
				_type: 'articleAccordion',
				heading: 'B',
				items: [{ _key: 'q', question: 'Why?', answer: 'Because' }]
			})
		]);

		expect(checklist.kind === 'checklist' && checklist.items).toEqual(['one', 'two']);
		expect(accordion.kind === 'accordion' && accordion.items).toEqual([
			{ question: 'Why?', answer: 'Because' }
		]);
	});

	it('strips the markers off a source URL, because a marked-up href is a broken link', () => {
		const [mapped] = toBlocks([
			block({
				_type: 'articleSourceList',
				heading: 'S',
				summary: '',
				sources: [{ _key: 's', label: 'EMA', href: 'https://ema.europa.eu​' }]
			})
		]);

		expect(mapped.kind === 'sources' && mapped.sources[0].href).toBe('https://ema.europa.eu');
	});
});

describe('tocFrom', () => {
	it('lists the blocks that opened a section, in the order they appear', () => {
		const blocks = toBlocks([
			block({ _key: 'a', _type: 'articleCallout', heading: 'Quick answer' }),
			block({ _key: 'b', _type: 'articleProse', paragraphs: ['a continuation'] }),
			block({ _key: 'c', _type: 'articleAccordion', heading: 'Frequently asked questions', shortLabel: 'FAQs' })
		]);

		expect(tocFrom(blocks)).toEqual([
			{ id: 'quick-answer', label: 'Quick answer' },
			{ id: 'frequently-asked-questions', label: 'FAQs' }
		]);
	});

	it('leaves a body of plain paragraphs with no contents list at all', () => {
		expect(tocFrom(toBlocks([block({ _type: 'articleProse', paragraphs: ['one'] })]))).toEqual([]);
	});

	it('never points at a block it cannot draw', () => {
		expect(tocFrom(toBlocks([block({ _type: 'articleVideo', heading: 'Watch' })]))).toEqual([]);
	});
});
