import { describe, expect, it } from 'vitest';
import {
	categoriesOf,
	inCategory,
	neighboursOf,
	splitJournal,
	tagsOf,
	type JournalArticle
} from './journal';

function article(slug: string, category = 'Treatment comparison'): JournalArticle {
	return { id: slug, slug, title: slug, category, tags: [category], summary: '' };
}

describe('splitJournal', () => {
	it('gives the whole page nothing to draw when nothing is published', () => {
		expect(splitJournal([])).toEqual({ featured: undefined, rest: [] });
	});

	// The state the site is actually in: one article, so the band below the featured card has
	// nothing to show and must not be rendered.
	it('leaves no rest for a single article', () => {
		const only = article('mounjaro-vs-wegovy');

		expect(splitJournal([only])).toEqual({ featured: only, rest: [] });
	});

	it('features the first and keeps the order of the rest', () => {
		const [a, b, c] = [article('a'), article('b'), article('c')];

		expect(splitJournal([a, b, c])).toEqual({ featured: a, rest: [b, c] });
	});
});

describe('categoriesOf', () => {
	it('lists each category once, in the order the articles introduce it', () => {
		const articles = [article('a', 'Nutrition'), article('b', 'Treatments'), article('c', 'Nutrition')];

		expect(categoriesOf(articles)).toEqual(['Nutrition', 'Treatments']);
	});

	it('drops an article that carries no category rather than offering an empty chip', () => {
		expect(categoriesOf([article('a', ''), article('b', 'Nutrition')])).toEqual(['Nutrition']);
	});
});

describe('inCategory', () => {
	const articles = [article('a', 'Nutrition'), article('b', 'Treatments')];

	it('keeps everything for the all-guides chip', () => {
		expect(inCategory(articles, null)).toEqual(articles);
	});

	it('keeps only the chosen category', () => {
		expect(inCategory(articles, 'Treatments')).toEqual([articles[1]]);
	});

	it('answers an unknown category with nothing rather than with everything', () => {
		expect(inCategory(articles, 'Healthy habits')).toEqual([]);
	});
});

describe('tagsOf', () => {
	it('shows the tags an editor wrote, in the order they wrote them', () => {
		expect(tagsOf({ tags: ['Weight loss', 'Nutrition', 'GLP-1'], category: 'Guides' })).toEqual([
			'Weight loss',
			'Nutrition',
			'GLP-1'
		]);
	});

	// Every article published before the field existed, which is all of them today. The chip row
	// is part of the artboard, so it falls back rather than drawing an empty row.
	it('falls back to the category when the field is absent', () => {
		expect(tagsOf({ category: 'Treatment comparison' })).toEqual(['Treatment comparison']);
	});

	it('falls back when the field is there and empty', () => {
		expect(tagsOf({ tags: [], category: 'Treatment comparison' })).toEqual([
			'Treatment comparison'
		]);
	});

	it('drops a blank row rather than drawing an empty chip', () => {
		expect(tagsOf({ tags: ['Weight loss', '   ', ''], category: 'Guides' })).toEqual([
			'Weight loss'
		]);
	});

	// Preview fills every string with zero-width markers, so a tag an editor emptied is not
	// empty to `trim()`. It is empty to a reader, which is the question being asked.
	it('reads a tag of nothing but preview markers as blank', () => {
		expect(tagsOf({ tags: ['\u200b\u2060'], category: 'Guides' })).toEqual(['Guides']);
	});

	it('keeps the markers on a tag it does show, so click-to-edit survives', () => {
		const marked = 'Weight loss\u200b';

		expect(tagsOf({ tags: [marked], category: 'Guides' })).toEqual([marked]);
	});
});

describe('neighboursOf', () => {
	const [newest, middle, oldest] = [article('a'), article('b'), article('c')];
	const journal = [newest, middle, oldest];

	// Direction follows the Journal's own page, which is newest first: "next" is the next one
	// down it, and therefore the older article.
	it('gives both neighbours in the middle of the library', () => {
		expect(neighboursOf(journal, 'b')).toEqual({ previous: newest, next: oldest });
	});

	it('leaves the newest article with nothing before it', () => {
		expect(neighboursOf(journal, 'a')).toEqual({ previous: undefined, next: middle });
	});

	it('leaves the oldest article with nothing after it', () => {
		expect(neighboursOf(journal, 'c')).toEqual({ previous: middle, next: undefined });
	});

	// The state the site is in: one article, so the band at the foot has nothing to draw.
	it('gives a single article neither', () => {
		expect(neighboursOf([newest], 'a')).toEqual({ previous: undefined, next: undefined });
	});

	// An unpublished draft being previewed is not in the published list.
	it('gives an unknown slug neither, rather than the ends of the list', () => {
		expect(neighboursOf(journal, 'not-published')).toEqual({});
	});

	it('never re-sorts: the order it is handed is the order it walks', () => {
		expect(neighboursOf([oldest, newest, middle], 'a')).toEqual({
			previous: oldest,
			next: middle
		});
	});
});
