import type { Component } from 'svelte';
import ArticleCallout from './sections/ArticleCallout.svelte';
import ArticleChecklist from './sections/ArticleChecklist.svelte';
import ArticleFaq from './ArticleFaq.svelte';
import ArticleProse from './sections/ArticleProse.svelte';
import ArticleSources from './ArticleSources.svelte';
import ComparisonTable from './sections/ComparisonTable.svelte';
import MakerCards from './sections/MakerCards.svelte';
import type { ArticleBlock } from './types';

/**
 * Which component draws which block.
 *
 * Keyed by our own `kind` rather than Sanity's `_type`, the same separation
 * `renderer-registry.ts` draws in the questionnaire: their string names a document shape and
 * ours names what a reader sees. A registry rather than a chain of conditionals in the screen,
 * so adding a block type is one entry here and one component, and forgetting one is a build
 * error rather than a section that quietly fails to draw.
 */

type Renderable = Exclude<ArticleBlock, { kind: 'unsupported' }>;
type BlockOf<K extends Renderable['kind']> = Extract<Renderable, { kind: K }>;

type Props = Record<string, unknown>;

interface Entry {
	readonly component: Component<Props>;
	/**
	 * Widened to any block on the way out, because a lookup by `kind` cannot prove to the
	 * compiler that the block it found and the entry it found came from the same case. Each
	 * entry below is still written and checked against its own narrow block type.
	 */
	readonly props: (block: ArticleBlock) => Props;
}

/**
 * Pairs a component with the props built for it. The pairing is checked here, at the call site:
 * `props` has to return exactly what `component` accepts, and the block it reads is narrowed to
 * the kind the entry is filed under.
 *
 * The widening happens once, inside this function. Everything either side of that one line is
 * typed: the props a component accepts are inferred from the component, and the block each
 * builder reads is narrowed to the kind its entry is filed under.
 */
function entry<K extends Renderable['kind'], P extends Props>(
	component: Component<P>,
	props: (block: BlockOf<K>) => P
): Entry {
	return { component, props } as unknown as Entry;
}

const BY_KIND: Record<Renderable['kind'], Entry> = {
	prose: entry(ArticleProse, (block: BlockOf<'prose'>) => ({
		id: block.id,
		heading: block.heading,
		paragraphs: block.paragraphs
	})),
	callout: entry(ArticleCallout, (block: BlockOf<'callout'>) => ({
		id: block.id ?? '',
		heading: block.heading ?? '',
		paragraphs: block.paragraphs
	})),
	table: entry(ComparisonTable, (block: BlockOf<'table'>) => ({
		id: block.id ?? '',
		heading: block.heading ?? '',
		caption: block.caption,
		columns: block.columns,
		rows: block.rows
	})),
	cards: entry(MakerCards, (block: BlockOf<'cards'>) => ({
		id: block.id ?? '',
		heading: block.heading ?? '',
		cards: block.cards
	})),
	checklist: entry(ArticleChecklist, (block: BlockOf<'checklist'>) => ({
		id: block.id ?? '',
		heading: block.heading ?? '',
		intro: block.intro,
		items: block.items
	})),
	accordion: entry(ArticleFaq, (block: BlockOf<'accordion'>) => ({
		id: block.id ?? '',
		heading: block.heading ?? '',
		items: block.items
	})),
	sources: entry(ArticleSources, (block: BlockOf<'sources'>) => ({
		id: block.id ?? '',
		heading: block.heading ?? '',
		summary: block.summary,
		sources: block.sources
	}))
};

export type BlockLookup =
	| { readonly entry: Entry; readonly reason: null }
	| { readonly entry: null; readonly reason: string };

/**
 * The component for a block, or the reason there is none.
 *
 * The record is exhaustive and the compiler keeps it that way, so the only miss possible is a
 * `_type` the Content Lake holds and this app has never heard of, which `toBlocks` has already
 * turned into an `unsupported` block. That is reported rather than skipped: a block dropped in
 * silence is a section of an article nobody notices is missing.
 */
export function rendererFor(block: ArticleBlock): BlockLookup {
	if (block.kind === 'unsupported') return { entry: null, reason: block.reason };

	return { entry: BY_KIND[block.kind], reason: null };
}
